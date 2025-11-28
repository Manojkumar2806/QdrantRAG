import { useState } from 'react';
import {
  Send,
  Upload,
  FileText,
  Loader2,
  Brain,
  ChevronRight,
  Database,
  Sparkles,
} from 'lucide-react';
import type { Message, RetrievedCase } from '../types';

const mockRetrievedCases: RetrievedCase[] = [
  {
    id: '1',
    title: 'Similar diabetic ketoacidosis case',
    similarity: 0.94,
    snippet: 'Patient presented with elevated glucose levels, metabolic acidosis...',
  },
  {
    id: '2',
    title: 'Type 1 diabetes management protocol',
    similarity: 0.89,
    snippet: 'Standard protocol for managing acute hyperglycemia in diabetic patients...',
  },
  {
    id: '3',
    title: 'Emergency insulin administration guidelines',
    similarity: 0.87,
    snippet: 'Guidelines for rapid insulin administration in critical situations...',
  },
];

const mockPredictiveQuestions = [
  'What are the recommended insulin dosage adjustments for this patient?',
  'Are there any contraindications based on the patient history?',
  'What monitoring protocols should be followed during treatment?',
];

export default function Demo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've analyzed your file "${file.name}". I'm ready to answer questions about its contents using semantic search and medical reasoning.`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowReasoning(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateUniqueResponse(input),
        timestamp: new Date(),
        reasoning: {
          nextQuestions: mockPredictiveQuestions,
          retrievedCases: mockRetrievedCases,
        },
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateUniqueResponse = (query: string): string => {
    const responses = [
      `Based on semantic analysis of your query "${query}", I've identified relevant information from the uploaded document. The patient's condition requires immediate attention with a focus on monitoring glucose levels and adjusting insulin administration according to current guidelines.`,
      `After processing your question about "${query}" through our DSPy reasoning chain, I found that the document contains critical information regarding treatment protocols. I've retrieved 3 similar cases from our Qdrant database for comparison.`,
      `Analyzing "${query}" using vector similarity search... The document indicates specific contraindications and recommended dosage adjustments. I've cross-referenced this with 3 similar historical cases showing 94% semantic similarity.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handlePredictiveQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-teal-100/80 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Demo</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Experience MedSage
            <span className="block bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
              In Action
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload a medical file and ask questions to see our AI reasoning system at work
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[700px]">
            {!uploadedFile ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Upload Medical File
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Start by uploading a medical document, report, or case study
                  </p>
                  <label className="cursor-pointer inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200">
                    <Upload className="w-5 h-5" />
                    <span>Choose File</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.txt,.doc,.docx"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 px-6 py-4 border-b border-teal-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-teal-700" />
                    <span className="font-medium text-teal-900">{uploadedFile.name}</span>
                  </div>
                  <label className="cursor-pointer text-sm text-teal-700 hover:text-teal-800 font-medium">
                    Change
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.txt,.doc,.docx"
                    />
                  </label>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="leading-relaxed">{message.content}</p>
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

                <div className="border-t border-gray-200 p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask a question about the document..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      <Send className="w-5 h-5" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-gray-900">Next Questions</h3>
              </div>
              {showReasoning ? (
                <div className="space-y-3">
                  {mockPredictiveQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handlePredictiveQuestion(question)}
                      className="w-full text-left p-4 bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex items-start space-x-3">
                        <ChevronRight className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5 group-hover:translate-x-1 transition-transform" />
                        <span className="text-sm text-gray-700 leading-relaxed">
                          {question}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Ask a question to see AI-predicted follow-ups
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Database className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-gray-900">Retrieved Cases</h3>
              </div>
              {showReasoning ? (
                <div className="space-y-3">
                  {mockRetrievedCases.map((case_, index) => (
                    <div
                      key={case_.id}
                      className="p-4 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-teal-700">
                          {(case_.similarity * 100).toFixed(1)}% match
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        {case_.title}
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{case_.snippet}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Similar cases will appear here via Qdrant search
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
