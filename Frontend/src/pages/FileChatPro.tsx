// FileChatPro.tsx — YOUR FINAL PERFECT VERSION
import React, { useEffect, useRef, useState } from "react";
import {
  Send, Upload, FileText, Loader2, Brain, ChevronRight,
  Database, Sparkles, Volume2, VolumeX, RefreshCw, X,
  CheckCircle, Circle, Image as ImageIcon, FileAudio, AlertCircle
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

type Source = {
  text: string;
  file: string;
  type: string;
  score: number;
};

type AskResponse = {
  question: string;
  answer: string;
  sources: Source[];
  suggested_questions: string[];
};

const API_BASE = "http://localhost:8000/api/system"; // Kept exactly as you requested
const SUPPORTED_FILES = ".pdf,.docx,.pptx,.xlsx,.csv,.txt,.json,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.ogg";

const UPLOAD_STEPS = [
  "Uploading file",
  "Extracting content (OCR / Transcription / Text)",
  "Chunking document",
  "Generating embeddings",
  "Storing in Qdrant vector DB",
];

export default function FileChatPro() {
  const [messages, setMessages] = useState<{ id: string; role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // === Upload Animation ===
  const startUploadAnimation = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= 0) setCompletedSteps(s => [...s, prev]);
        const next = prev + 1;
        if (next >= UPLOAD_STEPS.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        return next;
      });
    }, 800);
  };

  const finishUploadAnimation = () => {
    setCompletedSteps(UPLOAD_STEPS.map((_, i) => i));
    setTimeout(() => {
      setCurrentStep(-1);
      setCompletedSteps([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, 1000);
  };

  // === Text-to-Speech ===
  const speak = (text: string) => {
    if (isMuted || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/\*\*/g, "").replace(/#/g, ""));
    utter.rate = 0.95;
    utteranceRef.current = utter;
    speechSynthesis.speak(utter);
  };

  const toggleMute = () => {
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    setIsMuted(!isMuted);
  };

  // === File Upload ===
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFile(null);
    setMessages([]);
    setSources([]);
    setSuggestions([]);
    startUploadAnimation();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload/`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());

      await new Promise(r => setTimeout(r, 600));
      finishUploadAnimation();

      setUploadedFile(file);
      const welcome = `**${file.name}** successfully processed and ready!\n\nYou can now ask any question about its content.`;
      setMessages([{ id: Date.now().toString(), role: "assistant", content: welcome }]);
      speak(welcome);
      toast.success(`"${file.name}" uploaded & indexed!`, { duration: 4000 });

    } catch (err: any) {
      finishUploadAnimation();
      toast.error("Upload failed: " + err.message);
      setMessages([{ id: Date.now().toString(), role: "assistant", content: `Upload failed: ${err.message}` }]);
    } finally {
      setIsUploading(false);
    }
  };

  // === Ask Question ===
  const ask = async (question: string) => {
    if (!question.trim()) return;
    setIsLoading(true);
    speechSynthesis.cancel();

    const userMsg = { id: Date.now().toString(), role: "user" as const, content: question };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch("http://localhost:8000/api/chat/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, n_results: 6 }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data: AskResponse = await res.json();

      const assistantMsg = { id: Date.now().toString(), role: "assistant" as const, content: data.answer };
      setMessages(prev => [...prev, assistantMsg]);
      setSources(data.sources || []);
      setSuggestions(data.suggested_questions || []);

      if (!isMuted) speak(data.answer);

    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    ask(input);
    setInput("");
  };

  const handleSuggestion = (q: string) => ask(q);

  // === Clear Index ===
  const clearIndex = async () => {
    setIsClearing(true);
    try {
      await fetch(`${API_BASE}/clear/`, { method: "POST" });
      setUploadedFile(null);
      setMessages([{ id: Date.now().toString(), role: "assistant", content: "Index cleared. Upload a new file to continue." }]);
      setSources([]);
      setSuggestions([]);
      toast.success("Document index cleared!", { duration: 4000 });
    } catch (err) {
      toast.error("Failed to clear index");
    } finally {
      setIsClearing(false);
      setShowClearModal(false);
    }
  };

  // === Rich Text Renderer ===
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let key = 0;
    let inCodeBlock = false;
    let codeLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <pre key={key++} className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm font-mono my-5 border border-gray-700">
              <code>{codeLines.join("\n")}</code>
            </pre>
          );
          codeLines = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }
      if (inCodeBlock) { codeLines.push(line); continue; }

      if (line.startsWith("### ")) elements.push(<h3 key={key++} className="text-xl font-bold text-teal-800 mt-8 mb-3">{line.slice(4)}</h3>);
      else if (line.startsWith("## ")) elements.push(<h2 key={key++} className="text-2xl font-bold text-teal-900 mt-10 mb-4">{line.slice(3)}</h2>);
      else if (line.startsWith("# ")) elements.push(<h1 key={key++} className="text-3xl font-extrabold text-indigo-900 mt-12 mb-5">{line.slice(2)}</h1>);
      else if (line.startsWith("> ")) elements.push(<blockquote key={key++} className="border-l-4 border-teal-500 pl-5 py-2 italic text-gray-600 my-5 bg-teal-50/50 rounded-r-lg">{line.slice(2)}</blockquote>);
      else if (line.match(/^(\d+\.|-|\*|\•)\s/)) {
        const items: string[] = [];
        while (i < lines.length && lines[i].match(/^(\d+\.|-|\*|\•)\s/)) {
          items.push(lines[i].replace(/^(\d+\.|-|\*|\•)\s+/, "").trim());
          i++;
        }
        i--;
        elements.push(
          <ul key={key++} className="list-disc list-inside space-y-2 my-5 ml-4">
            {items.map((it, idx) => (
              <li key={idx} className="text-gray-700 leading-relaxed">{it}</li>
            ))}
          </ul>
        );
      }
      else if (line.includes("**") || line.includes("__")) {
        const formatted = line
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
          .replace(/__(.*?)__/g, '<strong class="font-bold text-gray-900">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic text-teal-700">$1</em>');
        elements.push(<p key={key++} className="my-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />);
      }
      else if (line.trim()) {
        elements.push(<p key={key++} className="text-gray-700 leading-relaxed my-4">{line}</p>);
      }
    }

    return <div className="prose max-w-none">{elements}</div>;
  };

  const getFileIcon = (name: string) => {
    const ext = name.toLowerCase().split(".").pop();
    if (["png", "jpg", "jpeg", "webp"].includes(ext || "")) return <ImageIcon className="w-5 h-5" />;
    if (["mp3", "wav", "m4a", "ogg"].includes(ext || "")) return <FileAudio className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  useEffect(() => () => speechSynthesis.cancel(), []);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ className: "font-medium" }} />

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 mt-20" style={{ padding: "40px 20px" }}>
        <div className="max-w-7xl mx-auto p-6">
          {/* Enhanced Professional Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-100 to-indigo-100 text-teal-800 px-6 py-3 rounded-full text-sm font-semibold shadow-md mb-6">
              <Sparkles className="w-5 h-5" />
              <span>Gemini 2.5 Flash • Full Multimodal RAG Engine</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-700 leading-tight">
              File Intelligence Assistant
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mt-5 max-w-4xl mx-auto leading-relaxed font-medium">
  Upload <span className="text-teal-600 font-bold">any document, image, audio, or handwritten note</span> — from research papers, contracts, 
  diagrams, books, classroom notes, sketches, or even rough scribbles — and get 
  <span className="text-indigo-600 font-bold"> instant, context-rich answers</span> that break down complexity with absolute clarity.
</p>

            <p className="text-lg text-gray-600 mt-4">
              Powered by OCR, speech-to-text, vector search, and state-of-the-art AI reasoning.
            </p>
          </div>

          {/* Rest of your beautiful UI (unchanged except Smart Suggestions styling) */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Main Chat Area */}
              <div className="lg:col-span-2 flex flex-col h-[840px]">
                {isUploading && (
                  <div className="flex-1 flex items-center justify-center p-12">
                    <div className="text-center max-w-md w-full">
                      <div className="w-28 h-28 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
                        <Loader2 className="w-14 h-14 text-white animate-spin" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">Processing Your File</h2>
                      <p className="text-gray-600 mb-8">Extracting text, running OCR, transcribing audio...</p>
                      <div className="bg-gray-50 rounded-2xl p-8 border">
                        {UPLOAD_STEPS.map((step, i) => (
                          <div key={i} className="flex items-center gap-4 py-3">
                            {completedSteps.includes(i) ? (
                              <CheckCircle className="w-7 h-7 text-emerald-500" />
                            ) : currentStep === i ? (
                              <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-300" />
                            )}
                            <span className={`text-lg font-medium ${completedSteps.includes(i) ? "text-emerald-700" : currentStep === i ? "text-teal-700" : "text-gray-500"}`}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!isUploading && !uploadedFile && (
                  <div className="flex-1 flex items-center justify-center p-12">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-teal-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-10">
                        <Upload className="w-16 h-16 text-white" />
                      </div>
                      <h2 className="text-4xl font-bold text-gray-900 mb-4">Upload Your File</h2>
                      <p className="text-xl text-gray-600 mb-10 max-w-lg mx-auto">
                        Supports <strong>PDFs, DOCX, images (OCR), audio (transcription), Excel, PPT, and more</strong>
                      </p>
                      <label className="cursor-pointer inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-teal-600 to-indigo-600 text-white text-xl font-bold rounded-2xl hover:shadow-2xl transition">
                        <Upload className="w-7 h-7" />
                        Choose File
                        <input type="file" onChange={handleUpload} className="hidden" accept={SUPPORTED_FILES} />
                      </label>
                    </div>
                  </div>
                )}

                {uploadedFile && !isUploading && (
                  <>
                    <div className="bg-gradient-to-r from-teal-600 to-indigo-600 text-white px-8 py-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getFileIcon(uploadedFile.name)}
                        <span className="text-lg font-bold truncate max-w-md">{uploadedFile.name}</span>
                      </div>
                      <div className="flex gap-3">
                        <label className="cursor-pointer bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium">
                          <Upload className="w-4 h-4 inline mr-2" />Change
                          <input type="file" onChange={handleUpload} className="hidden" accept={SUPPORTED_FILES} />
                        </label>
                        <button onClick={() => setShowClearModal(true)} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium">
                          <RefreshCw className="w-4 h-4 inline mr-2" />Clear
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                      {messages.map(m => (
                        <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-3xl rounded-3xl px-8 py-5 shadow-lg ${m.role === "user" 
                            ? "bg-gradient-to-br from-teal-600 to-indigo-600 text-white" 
                            : "bg-gray-100 text-gray-900 border border-gray-200"}`}>
                            {m.role === "assistant" ? renderContent(m.content) : <p className="text-lg whitespace-pre-wrap">{m.content}</p>}
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-3xl px-8 py-5 flex items-center gap-4">
                            <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                            <span className="text-gray-700 font-medium">Thinking deeply...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t p-6 bg-gray-50">
                      <div className="flex items-center gap-4">
                        <input
                          type="text"
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                          placeholder="Ask anything about this file..."
                          className="flex-1 px-6 py-4 rounded-2xl border border-gray-300 focus:outline-none focus:ring-4 focus:ring-teal-300 text-lg"
                        />
                        <button
                          onClick={handleSend}
                          disabled={isLoading || !input.trim()}
                          className="p-4 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-2xl hover:shadow-xl disabled:opacity-50 transition"
                        >
                          <Send className="w-6 h-6" />
                        </button>
                        <button onClick={toggleMute} className="p-4 bg-gray-200 rounded-2xl hover:bg-gray-300">
                          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Sidebar — Perfect Smart Suggestions */}
              <div className="bg-gray-50 border-l p-8 space-y-8">
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                  <div className="flex items-center gap-3 mb-7">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                      <Brain className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900">Smart Suggestions</h3>
                  </div>
                  {suggestions.length > 0 ? (
                    <div className="space-y-4">
                      {suggestions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestion(q)}
                          className="w-full text-left group"
                        >
                          <div className="p-5 bg-gradient-to-r from-indigo-50 via-purple-50 to-teal-50 rounded-2xl border border-indigo-200/50 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-start gap-4">
                              <div className="mt-1 p-2 bg-white rounded-xl shadow-md group-hover:shadow-lg transition">
                                <ChevronRight className="w-5 h-5 text-indigo-600 group-hover:translate-x-2 transition" />
                              </div>
                              <p className="text-gray-800 font-medium leading-relaxed text-sm md:text-base">
                                {q}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Ask a question to unlock AI-powered follow-ups</p>
                    </div>
                  )}
                </div>

                {/* Retrieved Sources */}
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                  <div className="flex items-center gap-3 mb-7">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl">
                      <Database className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900">Retrieved Sources</h3>
                  </div>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {sources.length > 0 ? sources.map((s, i) => (
                      <div key={i} className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-bold text-teal-600">
                            {(s.score * 100).toFixed(1)}% match
                          </span>
                          <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-medium">{s.type}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">{s.text || "Document content"}</p>
                      </div>
                    )) : (
                      <p className="text-gray-500 text-center py-12 font-medium">Sources will appear after your first question</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clear Modal */}
          {showClearModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-white rounded-3xl p-10 max-w-md w-full mx-6 shadow-2xl">
                <div className="flex items-center gap-4 text-red-600 mb-6">
                  <AlertCircle className="w-10 h-10" />
                  <h3 className="text-2xl font-bold">Clear Document Index?</h3>
                </div>
                <p className="text-gray-600 mb-8">This will permanently delete all processed content and vectors.</p>
                <div className="flex justify-end gap-4">
                  <button onClick={() => setShowClearModal(false)} className="px-6 py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200 transition">
                    Cancel
                  </button>
                  <button onClick={clearIndex} disabled={isClearing} className="px-8 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition">
                    {isClearing ? "Clearing..." : "Yes, Clear Index"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}