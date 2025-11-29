// TwoPanelsPage.tsx
import React, { useState } from 'react';
import MedChatbot from './MedChatbot';
import MedFileChatbot from './MedFileChatbot';
import { Sparkles } from 'lucide-react';

export default function TwoPanelsPage(): JSX.Element {
  const [active, setActive] = useState<'file' | 'live'>('file');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white pt-16 pb-20">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-teal-100/80 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Interactive MedSage</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">MedSage</h1>
          <p className="text-gray-600 mt-1">Switch tabs to upload a document or ask the medical chatbot directly.</p>
        </div>

        <div className="max-w-full mx-auto bg-white rounded-2xl shadow p-4 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={() => setActive('file')}
              className={`px-4 py-2 rounded-lg font-medium transition ${active === 'file' ? 'bg-teal-600 text-white' : 'bg-gray-50 text-gray-700'}`}
            >
              File Q&A
            </button>

            <button
              onClick={() => setActive('live')}
              className={`px-4 py-2 rounded-lg font-medium transition ${active === 'live' ? 'bg-teal-600 text-white' : 'bg-gray-50 text-gray-700'}`}
            >
              Live Chatbot
            </button>
          </div>

          <div className="mt-4">
            {active === 'file' ? (
              <div className="w-100">
                <MedFileChatbot />
              </div>
            ) : (
              <div className="w-full">
                <MedChatbot />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
