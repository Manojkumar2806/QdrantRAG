// MedChatbot.jsx
import React, { useEffect, useRef, useState } from "react";
import { Send, Loader2, Brain, ChevronRight, Pause, Play, StopCircle, RotateCw, AlertOctagon } from "lucide-react";

/**
 * MedChatbot.jsx
 *
 * - Sends user input as `symptoms` to backend `/consult` endpoint.
 * - Expects response:
 *   {
 *     reasoning: string,
 *     diagnosis: string | string[],
 *     recommendations: string | string[],
 *     danger_signs: string | string[],
 *     next_questions: string[],
 *     is_emergency: boolean
 *   }
 *
 * - Auto-plays TTS for assistant outputs.
 * - Follow-up (next_questions) are clickable and auto-submitted.
 * - Includes TTS controls: pause/resume, stop, replay last assistant message.
 *
 * Usage: place this component where you had your MedChatbot previously.
 */

const API_PREFIX = "http://localhost:8000/api/chat"; // backend base
const CONSULT_URL = `${API_PREFIX}/consult`;

export default function MedChatbot() {
  const [messages, setMessages] = useState([
    {
      id: "sys-1",
      role: "assistant",
      content: "Hello — I am the MedSage clinical assistant. Describe patient symptoms or paste clinical notes.",
      meta: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nextQuestions, setNextQuestions] = useState([]); // dynamic follow-ups from server
  const [lastResponse, setLastResponse] = useState(null); // store last server payload
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const utterRef = useRef(null);

  // helper: simple HTML-safe formatting for server text (supports **bold** and *italic*)
  const inlineFormat = (text = "") => {
    if (!text) return "";
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return esc.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\n/g, "<br/>");
  };

  const speakText = (text) => {
    stopSpeech();
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utterRef.current = null;
    };
    utter.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      utterRef.current = null;
    };
    utterRef.current = utter;
    synthRef.current.speak(utter);
    setIsSpeaking(true);
  };

  const togglePauseResume = () => {
    if (!synthRef.current) return;
    if (synthRef.current.paused) {
      synthRef.current.resume();
      setIsPaused(false);
    } else if (synthRef.current.speaking) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  };

  const stopSpeech = () => {
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    utterRef.current = null;
  };

  const replayLastAssistant = () => {
    // find last assistant message content (composed from payload)
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (last?.content) speakText(stripHtml(last.content || ""));
  };

  const stripHtml = (html = "") => {
    // used to create plain text for TTS
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // build an assistant message from server payload
  const buildAssistantContent = (payload) => {
    // payload: reasoning, diagnosis, recommendations, danger_signs, next_questions, is_emergency
    const blocks = [];

    if (payload.is_emergency) {
      blocks.push(`<p><strong style="color:#b91c1c">⚠️ Possible emergency — escalate immediately.</strong></p>`);
    }

    if (payload.diagnosis) {
      const diag = Array.isArray(payload.diagnosis) ? payload.diagnosis.join("; ") : payload.diagnosis;
      blocks.push(`<h4 style="margin:6px 0 4px 0">Diagnosis</h4><p>${inlineFormat(diag)}</p>`);
    }

    if (payload.reasoning) {
      blocks.push(`<h4 style="margin:6px 0 4px 0">Reasoning</h4><p>${inlineFormat(payload.reasoning)}</p>`);
    }

    if (payload.recommendations) {
      const rec = Array.isArray(payload.recommendations) ? payload.recommendations.map((r) => `• ${r}`).join("<br/>") : payload.recommendations;
      blocks.push(`<h4 style="margin:6px 0 4px 0">Recommendations</h4><p>${inlineFormat(rec)}</p>`);
    }

    if (payload.danger_signs) {
      const ds = Array.isArray(payload.danger_signs) ? payload.danger_signs.map((d) => `• ${d}`).join("<br/>") : payload.danger_signs;
      blocks.push(`<h4 style="margin:6px 0 4px 0">Danger signs</h4><p style="color:#b91c1c">${inlineFormat(ds)}</p>`);
    }

    return blocks.join("<hr style='margin:8px 0'/>");
  };

  // send consult request to backend
  const consult = async (symptoms) => {
    setIsLoading(true);
    try {
      const resp = await fetch(CONSULT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        throw new Error(t || "Server error");
      }
      const data = await resp.json();
      // build content and push assistant message
      const contentHtml = buildAssistantContent(data);
      const assistantMsg = {
        id: Date.now().toString(),
        role: "assistant",
        content: contentHtml,
        meta: {
          diagnosis: data.diagnosis,
          recommendations: data.recommendations,
          danger_signs: data.danger_signs,
          reasoning: data.reasoning,
          is_emergency: data.is_emergency,
        },
      };
      setMessages((s) => [...s, assistantMsg]);
      setNextQuestions(Array.isArray(data.next_questions) ? data.next_questions : []);
      setLastResponse(data);

      // Auto TTS: speak a cleaned version — prefer short summary if available
      const ttsText = [
        data.diagnosis ? (Array.isArray(data.diagnosis) ? data.diagnosis.join(", ") : data.diagnosis) : null,
        data.recommendations ? (Array.isArray(data.recommendations) ? data.recommendations.join(". ") : data.recommendations) : null,
        data.warning || null,
      ]
        .filter(Boolean)
        .join(". ");

      // fallback to reasoning if ttsText empty
      speakText(ttsText || (typeof data.reasoning === "string" ? data.reasoning : JSON.stringify(data.reasoning || "")));
    } catch (err) {
      const errMsg = { id: Date.now().toString(), role: "assistant", content: `<p style="color:#b91c1c">Error: ${String(err.message || err)}</p>` };
      setMessages((s) => [...s, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // handle user send
  const handleSend = () => {
    if (!input.trim()) return;
    const q = input.trim();
    // add user bubble
    setMessages((s) => [...s, { id: Date.now().toString(), role: "user", content: escapeHtml(q) }]);
    setInput("");
    consult(q);
  };

  // when user clicks suggested follow-up
  const handlePickFollowUp = (q) => {
    if (!q) return;
    // show as user msg and immediately call consult
    setMessages((s) => [...s, { id: Date.now().toString(), role: "user", content: escapeHtml(q) }]);
    consult(q);
  };

  const escapeHtml = (str = "") => {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
  };

  // small keyboard helper
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // clean up speech on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current && synthRef.current.speaking) synthRef.current.cancel();
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[700px]">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">MedSage — Live Chatbot</h3>
          <div className="text-sm text-gray-500">Clinical assistant</div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={replayLastAssistant} title="Re-read last assistant reply" className="p-2 rounded-md bg-gray-50 hover:bg-gray-100">
            <RotateCw className="w-4 h-4 text-teal-600" />
          </button>

          <button onClick={togglePauseResume} disabled={!isSpeaking && !isPaused} title={isPaused ? "Resume" : "Pause"} className="p-2 rounded-md bg-gray-50 hover:bg-gray-100">
            {isPaused ? <Play className="w-4 h-4 text-yellow-600" /> : <Pause className="w-4 h-4 text-yellow-600" />}
          </button>

          <button onClick={stopSpeech} title="Stop" className="p-2 rounded-md bg-gray-50 hover:bg-gray-100">
            <StopCircle className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-6 py-4 ${m.role === "user" ? "bg-gradient-to-br from-teal-600 to-teal-700 text-white" : "bg-gray-100 text-gray-900"}`}>
              {m.role === "assistant" ? (
                <div dangerouslySetInnerHTML={{ __html: m.content }} />
              ) : (
                <p className="leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: m.content }} />
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-6 py-3 flex items-center space-x-3">
              <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
              <span className="text-gray-600">Analyzing symptoms…</span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        {/* follow-ups */}
        <div className="flex space-x-2 mb-3">
          {nextQuestions && nextQuestions.length > 0 ? (
            nextQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handlePickFollowUp(q)}
                className="flex-1 text-xs px-3 py-2 border rounded-xl text-gray-700 bg-gray-50 hover:shadow-sm flex items-center gap-2"
              >
                <ChevronRight className="w-5 h-5 text-teal-600" />
                <span className="truncate">{q}</span>
              </button>
            ))
          ) : (
            // show some default predictive prompts
            ["Could you summarize the patient history?", "What are the top 3 differential diagnoses?", "Recommend initial tests to order."].map((q, i) => (
              <button key={i} onClick={() => setInput(q)} className="flex-1 text-xs px-3 py-2 border rounded-xl text-gray-700 bg-gray-50 hover:shadow-sm">
                <ChevronRight className="w-4 h-4 text-teal-600" />
                <span className="truncate">{q}</span>
              </button>
            ))
          )}
        </div>

        {/* input */}
        <div className="flex space-x-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Describe symptoms, signs, vitals, labs... (press Enter to send)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading} className="px-5 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* small emergency badge if last response indicates emergency */}
        {lastResponse?.is_emergency && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-700">
            <AlertOctagon className="w-4 h-4 text-red-700" />
            <span><strong>Emergency flag:</strong> signs of deterioration detected — escalate immediately and call for in-person assessment.</span>
          </div>
        )}
      </div>
    </div>
  );
}
