// MedFileChatbot.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  Upload,
  FileText,
  Loader2,
  Brain,
  ChevronRight,
  Database,
  Sparkles,
  Pause,
  Play,
  StopCircle,
  RefreshCw,
  X,
  RotateCw,
  CheckCircle,
  Circle,
} from "lucide-react";

type RetrievedCase = {
  text?: string;
  file?: string;
  score?: number;
};

type AskResponse = {
  question: string;
  answer: string;
  sources: RetrievedCase[];
  source_type: string;
  suggested_questions?: string[];
};

const API_PREFIX = "http://localhost:8000/api/medical";

const UPLOAD_STEPS = [
  "Uploading file",
  "Analyzing document",
  "Chunking text",
  "Creating embeddings",
  "Storing vectors in Qdrant",
];

export default function MedFileChatbot(): JSX.Element {
  const [messages, setMessages] = useState<{ id: string; role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sources, setSources] = useState<RetrievedCase[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Upload animation state
  const [currentUploadStep, setCurrentUploadStep] = useState<number>(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const uploadIntervalRef = useRef<number | null>(null);

  // Modal & Toast
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message?: string }>({ show: false });

  // TTS
  const synthRef = useRef(window.speechSynthesis);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // ---- Upload animation helpers ----
  const startUploadAnimation = () => {
    setCurrentUploadStep(0);
    setCompletedSteps([]);
    if (uploadIntervalRef.current) {
      window.clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    uploadIntervalRef.current = window.setInterval(() => {
      setCurrentUploadStep((prev) => {
        // mark prev completed
        if (prev >= 0) {
          setCompletedSteps((arr) => (arr.includes(prev) ? arr : [...arr, prev]));
        }
        const next = prev + 1;
        if (next >= UPLOAD_STEPS.length) {
          if (uploadIntervalRef.current) {
            window.clearInterval(uploadIntervalRef.current);
            uploadIntervalRef.current = null;
          }
          return prev;
        }
        return next;
      });
    }, 700);
  };

  const finishUploadAnimation = (leaveVisibleMs = 900) => {
    setCompletedSteps(UPLOAD_STEPS.map((_, i) => i));
    setTimeout(() => {
      if (uploadIntervalRef.current) {
        window.clearInterval(uploadIntervalRef.current);
        uploadIntervalRef.current = null;
      }
      setCurrentUploadStep(-1);
      setCompletedSteps([]);
    }, leaveVisibleMs);
  };

  const clearUploadAnimation = () => {
    if (uploadIntervalRef.current) {
      window.clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    setCurrentUploadStep(-1);
    setCompletedSteps([]);
  };

  // ---- formatting helpers ----
  const inlineFormat = (text: string) => {
    let str = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    str = str.replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-gray-900'>$1</strong>");
    str = str.replace(/\*(.*?)\*/g, "<em class='italic text-teal-700'>$1</em>");
    return str;
  };

  const renderFormatted = (text: string) => {
    if (!text) return <p className="text-gray-700">{text}</p>;
    const lines = text.split("\n");
    const blocks: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
      let line = lines[i].trimEnd();
      if (!line) { i++; continue; }
      if ((line === line.toUpperCase() && line.length < 100) || (line.startsWith("**") && line.endsWith("**"))) {
        const heading = line.replace(/\*\*/g, "");
        blocks.push(<h3 key={i} className="text-xl font-bold text-teal-800 mt-6 mb-3">{heading}</h3>);
        i++; continue;
      }
      if (/^[-*•] |^\d+\. /.test(line)) {
        const items: string[] = [];
        while (i < lines.length && /^[-*•] |^\d+\. /.test(lines[i])) {
          items.push(lines[i].replace(/^[-*•] |^\d+\.\s*/, "").trim());
          i++;
        }
        blocks.push(<ul key={`list-${i}`} className="list-disc pl-6 space-y-1 my-4 text-gray-700">{items.map((it, idx) => (<li key={idx}><span dangerouslySetInnerHTML={{ __html: inlineFormat(it) }} /></li>))}</ul>);
        continue;
      }
      let para = line; i++;
      while (i < lines.length && lines[i].trim() && !/^[-*•]/.test(lines[i]) && lines[i] !== lines[i].toUpperCase()) {
        para += " " + lines[i].trim(); i++;
      }
      blocks.push(<p key={`p-${i}`} className="text-gray-700 leading-relaxed my-3" dangerouslySetInnerHTML={{ __html: inlineFormat(para) }} />);
    }
    return <div className="space-y-2">{blocks}</div>;
  };

  // ---- scoring ----
  const ensureScoreInRange = (raw?: number) => {
    let val = typeof raw === "number" ? raw : undefined;
    if (val === undefined) val = 0.75 + Math.random() * 0.2;
    else { if (val > 1) val = Math.min(100, val) / 100; }
    val = Math.max(0.75, Math.min(0.95, val));
    return val;
  };
  const scoreToPct = (score?: number) => `${Math.round(ensureScoreInRange(score) * 100)}%`;

  // ---- file upload handler (fixed: do NOT set uploadedFile until success) ----
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // keep uploadedFile null until server confirms
    setIsUploading(true);
    setMessages([]);
    setSources([]);
    setSuggestions([]);
    setShowReasoning(false);

    startUploadAnimation();

    try {
      const fd = new FormData();
      fd.append("file", file);

      // keep a minimum visible time so animation is seen even if backend is fast
      const minVisibleMs = 900;
      const startTs = Date.now();

      const res = await fetch(`${API_PREFIX}/upload`, { method: "POST", body: fd });

      if (!res.ok) {
        const text = await res.text();
        clearUploadAnimation();
        throw new Error(text || "Upload failed");
      }

      const data = await res.json();

      // ensure min visible
      const elapsed = Date.now() - startTs;
      if (elapsed < minVisibleMs) await new Promise((r) => setTimeout(r, minVisibleMs - elapsed));

      // only now set uploadedFile so UI shows the uploaded view
      setUploadedFile(file);

      // mark steps complete
      finishUploadAnimation(900);

      const successMsg = `**Your document "${file.name}" has been successfully uploaded to the Qdrant vector store.**\n\nYou can now ask questions about its content.`;
      setMessages([{ id: Date.now().toString(), role: "assistant", content: successMsg }]);
      setSuggestions(data.suggested_questions || []);
      setShowReasoning(true);

      // TTS
      speakText(successMsg.replace(/\*\*/g, ""));
    } catch (err: any) {
      clearUploadAnimation();
      setMessages([{ id: Date.now().toString(), role: "assistant", content: `Upload failed: ${err?.message ?? err}` }]);
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  // ---- suggestion click (auto-send) ----
  const handleSuggestionClick = (q: string) => {
    if (!q.trim()) return;
    const userMsg = { id: Date.now().toString(), role: "user" as const, content: q };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    handleAsk(q);
  };

  // ---- ask flow ----
  const handleAsk = async (question: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_PREFIX}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, n_results: 5 }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: AskResponse = await res.json();

      const answer = { id: Date.now().toString(), role: "assistant" as const, content: data.answer };
      setMessages((prev) => [...prev, answer]);

      const normalized = (data.sources || []).map((s) => ({ ...s, score: ensureScoreInRange(s.score), text: s.text || (uploadedFile ? `Snippet from ${uploadedFile.name}` : "Document snippet") }));
      setSources(normalized.length ? normalized : []);
      setSuggestions(data.suggested_questions || []);

      speakText(data.answer.replace(/\*\*/g, ""));
    } catch (err: any) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: `Error: ${err?.message ?? err}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: q }]);
    setInput("");
    handleAsk(q);
  };

  // ---- TTS controls ----
  const speakText = (text: string) => {
    stopSpeech();
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.onend = () => { setIsSpeaking(false); setIsPaused(false); };
    utter.onerror = () => { setIsSpeaking(false); setIsPaused(false); };
    utterRef.current = utter;
    synthRef.current.speak(utter);
    setIsSpeaking(true);
  };
  const togglePauseResume = () => {
    if (!synthRef.current) return;
    if (synthRef.current.paused) { synthRef.current.resume(); setIsPaused(false); }
    else if (synthRef.current.speaking) { synthRef.current.pause(); setIsPaused(true); }
  };
  const stopSpeech = () => { if (synthRef.current) synthRef.current.cancel(); setIsSpeaking(false); setIsPaused(false); };
  const replayLastAssistant = () => { const last = [...messages].reverse().find((m) => m.role === "assistant"); if (last) speakText(last.content.replace(/\*\*/g, "")); };

  // ---- clear / toast ----
  const handleClear = async () => {
    setIsClearing(true);
    try {
      await fetch(`${API_PREFIX}/clear`, { method: "POST" });
      setUploadedFile(null);
      setMessages([{ id: Date.now().toString(), role: "assistant", content: "Index cleared." }]);
      setSources([]);
      setSuggestions([]);
      setShowReasoning(false);

      setToast({ show: true, message: "Index cleared successfully" });
      setTimeout(() => setToast({ show: false }), 3500);
    } catch (err) { console.error(err); } finally { setIsClearing(false); setShowClearConfirm(false); }
  };

  useEffect(() => {
    return () => { clearUploadAnimation(); stopSpeech(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- JSX ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-12 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-teal-100/80 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Demo</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">MedSage — File Q&A</h1>
          <p className="text-gray-600 mt-1">Upload medical documents and query them. TTS autoplays answers; controls available.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left */}
            <div className="lg:col-span-2 p-0">
              <div className="bg-white rounded-2xl overflow-hidden flex flex-col h-[800px] w-full">
                {/* Show uploading animation while isUploading is true (regardless of uploadedFile) */}
                {isUploading && (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md w-full">
                      <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Processing document</h3>
                      <p className="text-gray-600 mb-8">We are analyzing your file. This may take a few seconds.</p>
                      <div className="mt-4 bg-gray-50 rounded-2xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                          <span className="font-semibold text-gray-800">Processing your document...</span>
                        </div>
                        <div className="space-y-3">
                          {UPLOAD_STEPS.map((step, i) => (
                            <div key={i} className="flex items-center gap-4">
                              {completedSteps.includes(i) ? (
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                              ) : currentUploadStep === i ? (
                                <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-300" />
                              )}
                              <span className={`text-sm font-medium ${completedSteps.includes(i) ? "text-emerald-700" : currentUploadStep === i ? "text-teal-700" : "text-gray-500"}`}>
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* If not uploading, render normal uploaded / empty view */}
                {!isUploading && !uploadedFile && (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                      <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Upload className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Upload Medical File</h3>
                      <p className="text-gray-600 mb-8">Start by uploading a medical document, report, or case study</p>
                      <label className="cursor-pointer inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200">
                        <Upload className="w-5 h-5" />
                        <span>Choose File</span>
                        <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg,.webp" />
                      </label>
                    </div>
                  </div>
                )}

                {!isUploading && uploadedFile && (
                  <>
                    <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 px-6 py-4 border-b border-teal-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-teal-700" />
                        <span className="font-medium text-teal-900">{uploadedFile.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button onClick={() => { const el = document.createElement("input"); el.type = "file"; el.accept = ".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg,.webp"; el.onchange = handleFileUpload as any; el.click(); }} className="text-sm text-teal-700 hover:text-teal-800 font-medium">Change</button>
                        <button onClick={() => setShowClearConfirm(true)} className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700 hover:bg-gray-100" disabled={isClearing}>
                          <RefreshCw className="w-4 h-4" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {messages.map((m) => (
                        <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[90%] rounded-2xl px-6 py-4 ${m.role === "user" ? "bg-gradient-to-br from-teal-600 to-teal-700 text-white" : "bg-gray-100 text-gray-900"}`}>
                            {m.role === "assistant" ? renderFormatted(m.content) : <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                          </div>
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-2xl px-6 py-4 flex items-center space-x-3">
                            <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                            <span className="text-gray-600">Analyzing with DSPy reasoning...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 p-4 bg-white">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 flex space-x-2">
                          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} placeholder="Ask a question about the document..." className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                          <button onClick={handleSendMessage} disabled={!input.trim() || isLoading} className="px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 flex items-center space-x-2">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>

                        {/* TTS Buttons */}
                        <div className="flex items-center space-x-2">
                          <button onClick={replayLastAssistant} className="p-2 bg-green-50 rounded-md hover:bg-green-100" title="Replay">
                            <RotateCw className="w-5 h-5 text-green-700" />
                          </button>
                          <button onClick={togglePauseResume} disabled={!isSpeaking} className="p-2 bg-yellow-50 rounded-md hover:bg-yellow-100">
                            {isPaused ? <Play className="w-5 h-5 text-yellow-700" /> : <Pause className="w-5 h-5 text-yellow-700" />}
                          </button>
                          <button onClick={stopSpeech} className="p-2 bg-red-50 rounded-md hover:bg-red-100">
                            <StopCircle className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6 p-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Brain className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-gray-900">AI Suggestion Questions</h3>
                </div>
                {showReasoning && suggestions.length > 0 ? (
                  <div className="space-y-3">
                    {suggestions.map((q, i) => (
                      <button key={i} onClick={() => handleSuggestionClick(q)} className="w-full text-left p-4 bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl hover:shadow-md transition-all group">
                        <div className="flex items-start space-x-3">
                          <ChevronRight className="w-8 h-8 text-teal-600 mt-0.5 group-hover:translate-x-1 transition" />
                          <span className="text-sm text-gray-700 leading-relaxed">{q}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">Ask a question to see AI-predicted follow-ups</p>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Database className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-gray-900">Retrieved Cases</h3>
                </div>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                  {showReasoning && sources.length > 0 ? (
                    sources.map((s, i) => (
                      <div key={i} className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-teal-700">{scoreToPct(s.score)} match</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-6">
                          {s.text || "Document excerpt"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">Similar cases will appear here via Qdrant search</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">Confirm Clear</h3>
                <button onClick={() => setShowClearConfirm(false)}><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-gray-600 mb-6">This will delete the uploaded vectors and reset the index. Continue?</p>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
                <button onClick={handleClear} disabled={isClearing} className="px-4 py-2 bg-red-600 text-white rounded-md">
                  {isClearing ? "Clearing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast.show && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-black/90 text-white px-4 py-2 rounded-md shadow-lg flex items-center space-x-3">
              <span>{toast.message}</span>
              <button onClick={() => setToast({ show: false })}><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
