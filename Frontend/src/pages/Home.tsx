import { ArrowRight, Zap, Shield, Sparkles, FileText, MessageSquare, TrendingUp } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-teal-50/30 pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-100/20 via-transparent to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-teal-100/80 backdrop-blur-sm text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fadeIn">
              <Sparkles className="w-4 h-4" />
              <span>Memory-First AI Medical Reasoning</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight animate-slideUp">
              Medical Knowledge,
              <span className="block bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                Intelligently Retrieved
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 leading-relaxed animate-slideUp max-w-3xl mx-auto">
              MedSage transforms medical files into actionable insights with semantic memory,
              predictive reasoning, and intelligent case retrieval powered by Qdrant and DSPy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slideUp">
              <button
                onClick={() => onNavigate('demo')}
                className="group px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-teal-500/30 transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              >
                <span>Try Demo</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('features')}
                className="px-8 py-4 bg-white text-teal-700 border-2 border-teal-200 rounded-2xl font-semibold text-lg hover:bg-teal-50 transition-all duration-200"
              >
                Explore Features
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Zap, label: 'Instant Semantic Search', value: 'Qdrant Vector DB' },
              { icon: Shield, label: 'Emergency Detection', value: 'Real-time Analysis' },
              { icon: TrendingUp, label: 'Continuous Learning', value: 'Adaptive AI' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-gradient-to-br hover:from-teal-50 hover:to-white transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.label}</h3>
                <p className="text-sm text-teal-600 font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose MedSage?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for healthcare professionals who need instant access to relevant medical knowledge
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: 'Universal File Q&A',
                description: 'Upload any medical file and get instant, contextual answers with semantic understanding.',
              },
              {
                icon: MessageSquare,
                title: 'Predictive Questions',
                description: 'AI suggests the next 3 most relevant questions based on conversation context.',
              },
              {
                icon: Shield,
                title: 'Emergency Detection',
                description: 'Automatically identifies urgent medical situations requiring immediate attention.',
              },
              {
                icon: Sparkles,
                title: 'Semantic Memory',
                description: 'Qdrant-powered vector search retrieves similar cases with precision and speed.',
              },
              {
                icon: TrendingUp,
                title: 'DSPy Reasoning',
                description: 'Advanced reasoning chains ensure accurate, explainable medical insights.',
              },
              {
                icon: Zap,
                title: 'Continuous Learning',
                description: 'System improves over time by learning from user interactions and feedback.',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-teal-600 to-teal-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Medical Workflow?
          </h2>
          <p className="text-xl text-teal-100 mb-10 leading-relaxed">
            Experience the power of memory-first AI reasoning designed specifically for healthcare professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => onNavigate('demo')}
              className="group px-8 py-4 bg-white text-teal-700 rounded-2xl font-semibold text-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
            >
              <span>Start Free Demo</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-8 py-4 bg-teal-800 text-white border-2 border-teal-500 rounded-2xl font-semibold text-lg hover:bg-teal-900 transition-all duration-200"
            >
              Get in Touch
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
