import React, { useEffect, useRef, useState } from "react";
import { Send, Loader2, ChevronRight, Pause, Play, StopCircle, RotateCw, AlertTriangle, Activity, Trash2, Download, Copy, Check, Mic, MicOff, Settings, BarChart3, Clock } from "lucide-react";

const API_PREFIX = "http://localhost:8000/api/chat";
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
  const [nextQuestions, setNextQuestions] = useState([]);
  const [lastResponse, setLastResponse] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionStats, setSessionStats] = useState({ consultations: 0, avgTime: 0 });
  const [showStats, setShowStats] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoTTS, setAutoTTS] = useState(true);
  const [consultationTimes, setConsultationTimes] = useState([]);
  const synthRef = useRef(window.speechSynthesis);
  const utterRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (last?.content) speakText(stripHtml(last.content || ""));
  };

  const stripHtml = (html = "") => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const buildAssistantContent = (payload) => {
    const blocks = [];

    if (payload.is_emergency) {
      blocks.push(`<div class="emergency-badge"><strong>⚠️ POSSIBLE EMERGENCY — ESCALATE IMMEDIATELY</strong></div>`);
    }

    if (payload.diagnosis) {
      const diag = Array.isArray(payload.diagnosis) ? payload.diagnosis.join("; ") : payload.diagnosis;
      blocks.push(`<div class="section"><div class="section-title">Diagnosis</div><div class="section-content">${inlineFormat(diag)}</div></div>`);
    }

    if (payload.reasoning) {
      blocks.push(`<div class="section"><div class="section-title">Clinical Reasoning</div><div class="section-content">${inlineFormat(payload.reasoning)}</div></div>`);
    }

    if (payload.recommendations) {
      const rec = Array.isArray(payload.recommendations) ? payload.recommendations.map((r) => `• ${r}`).join("<br/>") : payload.recommendations;
      blocks.push(`<div class="section"><div class="section-title">Recommendations</div><div class="section-content">${inlineFormat(rec)}</div></div>`);
    }

    if (payload.danger_signs) {
      const ds = Array.isArray(payload.danger_signs) ? payload.danger_signs.map((d) => `• ${d}`).join("<br/>") : payload.danger_signs;
      blocks.push(`<div class="section danger"><div class="section-title">Danger Signs</div><div class="section-content">${inlineFormat(ds)}</div></div>`);
    }

    return blocks.join("");
  };

  const consult = async (symptoms) => {
    setIsLoading(true);
    const startTime = Date.now();
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
      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(1);
      
      // Update stats
      setConsultationTimes(prev => [...prev, parseFloat(timeTaken)]);
      setSessionStats(prev => ({
        consultations: prev.consultations + 1,
        avgTime: [...consultationTimes, parseFloat(timeTaken)].reduce((a, b) => a + b, 0) / (consultationTimes.length + 1)
      }));

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
          responseTime: timeTaken
        },
      };
      setMessages((s) => [...s, assistantMsg]);
      setNextQuestions(Array.isArray(data.next_questions) ? data.next_questions : []);
      setLastResponse(data);

      const ttsText = [
        data.diagnosis ? (Array.isArray(data.diagnosis) ? data.diagnosis.join(", ") : data.diagnosis) : null,
        data.recommendations ? (Array.isArray(data.recommendations) ? data.recommendations.join(". ") : data.recommendations) : null,
        data.warning || null,
      ]
        .filter(Boolean)
        .join(". ");

      if (autoTTS) {
        speakText(ttsText || (typeof data.reasoning === "string" ? data.reasoning : JSON.stringify(data.reasoning || "")));
      }
    } catch (err) {
      const errMsg = { id: Date.now().toString(), role: "assistant", content: `<div class="error-message">Error: ${String(err.message || err)}</div>` };
      setMessages((s) => [...s, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMessages((s) => [...s, { id: Date.now().toString(), role: "user", content: escapeHtml(q) }]);
    setInput("");
    consult(q);
  };

  const handlePickFollowUp = (q) => {
    if (!q) return;
    setMessages((s) => [...s, { id: Date.now().toString(), role: "user", content: escapeHtml(q) }]);
    consult(q);
  };

  const clearChat = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      setMessages([
        {
          id: "sys-1",
          role: "assistant",
          content: "Chat cleared. How can I assist you today?",
          meta: null,
        },
      ]);
      setNextQuestions([]);
      setLastResponse(null);
      stopSpeech();
      setSessionStats({ consultations: 0, avgTime: 0 });
      setConsultationTimes([]);
    }
  };

  const exportChat = () => {
    const chatText = messages
      .map((m) => {
        const content = stripHtml(m.content);
        return `[${m.role.toUpperCase()}]: ${content}`;
      })
      .join("\n\n");

    const blob = new Blob([chatText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medsage-consultation-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyMessage = (content, id) => {
    const text = stripHtml(content);
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Voice input is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  };

  const escapeHtml = (str = "") => {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    return () => {
      if (synthRef.current && synthRef.current.speaking) synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <style>{`
        .section {
          margin: 12px 0;
        }
        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: #0f766e;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .section-content {
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
        }
        .section.danger .section-title {
          color: #b91c1c;
        }
        .section.danger .section-content {
          color: #b91c1c;
        }
        .emergency-badge {
          background: #fef2f2;
          border-left: 4px solid #b91c1c;
          padding: 12px;
          margin-bottom: 12px;
          border-radius: 6px;
          color: #b91c1c;
          font-size: 13px;
        }
        .error-message {
          color: #b91c1c;
          font-size: 14px;
          padding: 12px;
          background: #fef2f2;
          border-radius: 6px;
        }
      `}</style>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ height: "85vh", maxHeight: "800px" }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MedSage</h1>
                <p className="text-xs text-teal-100">Clinical Decision Support</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowStats(!showStats)}
                title="View statistics"
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                title="Settings"
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Settings className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={exportChat}
                title="Export chat"
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Download className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={clearChat}
                title="Clear chat"
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>

              <div className="w-px h-6 bg-white/30"></div>

              <button
                onClick={replayLastAssistant}
                title="Replay last response"
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <RotateCw className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={togglePauseResume}
                disabled={!isSpeaking && !isPaused}
                title={isPaused ? "Resume" : "Pause"}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-40"
              >
                {isPaused ? <Play className="w-4 h-4 text-white" /> : <Pause className="w-4 h-4 text-white" />}
              </button>

              <button
                onClick={stopSpeech}
                title="Stop playback"
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              >
                <StopCircle className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Emergency Alert */}
        {lastResponse?.is_emergency && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">Emergency Alert</p>
              <p className="text-xs text-red-700 mt-1">Signs of deterioration detected. Immediate escalation and in-person assessment required.</p>
            </div>
          </div>
        )}

        {/* Statistics Panel */}
        {showStats && (
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-200 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-teal-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Session Statistics
              </h3>
              <button onClick={() => setShowStats(false)} className="text-xs text-teal-600 hover:text-teal-800">Close</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Consultations</p>
                <p className="text-2xl font-bold text-teal-600">{sessionStats.consultations}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Avg Response Time</p>
                <p className="text-2xl font-bold text-teal-600">{sessionStats.avgTime.toFixed(1)}s</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Messages</p>
                <p className="text-2xl font-bold text-teal-600">{messages.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-xs text-gray-600 hover:text-gray-800">Close</button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between bg-white rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                <span className="text-sm text-gray-700">Auto-play TTS</span>
                <input
                  type="checkbox"
                  checked={autoTTS}
                  onChange={(e) => setAutoTTS(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
              </label>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="group relative max-w-[75%]">
                  <div
                    className={`rounded-2xl px-5 py-4 shadow-sm ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-teal-600 to-teal-700 text-white"
                        : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div>
                        <div dangerouslySetInnerHTML={{ __html: m.content }} />
                        {m.meta?.responseTime && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                            <Clock className="w-3 h-3" />
                            <span>Response time: {m.meta.responseTime}s</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: m.content }} />
                    )}
                  </div>
                  {m.role === "assistant" && (
                    <button
                      onClick={() => copyMessage(m.content, m.id)}
                      className="absolute -right-10 top-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy message"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 flex items-center space-x-3 shadow-sm">
                  <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
                  <span className="text-sm text-gray-600">Fetching results from Qdrant Cloud...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          {/* Quick Actions */}
          {nextQuestions && nextQuestions.length > 0 ? (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Suggested Follow-ups</p>
              <div className="flex flex-wrap gap-2">
                {nextQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handlePickFollowUp(q)}
                    className="text-xs px-4 py-2 bg-teal-50 text-teal-700 rounded-full hover:bg-teal-100 transition-colors flex items-center space-x-1 border border-teal-200"
                  >
                    <ChevronRight className="w-3 h-3" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                {["I have fever for 3 days, what should I do?","My ankle is swollen after a twist, any quick advice?", "I have a headache with nausea since yesterday, what can I do?"].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-xs px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="flex space-x-3">
            <button
              onClick={toggleVoiceInput}
              className={`px-4 rounded-xl font-semibold transition-all flex items-center justify-center ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title={isListening ? "Stop recording" : "Voice input"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Describe symptoms, clinical findings, or paste notes..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 resize-none text-sm"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}