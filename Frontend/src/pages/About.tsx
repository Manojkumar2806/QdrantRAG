import {
  Target,
  Lightbulb,
  Users,
  Award,
  Heart,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface AboutProps {
  onNavigate: (page: string) => void;
}

export default function About({ onNavigate }: AboutProps) {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 bg-teal-100/80 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Heart className="w-4 h-4" />
            <span>Our Story</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Building the Future of
            <span className="block bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
              Medical AI
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            MedSage was born from a simple observation: healthcare professionals spend too much
            time searching for information and not enough time applying it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            {
              icon: Target,
              title: 'Our Mission',
              description:
                'Empower healthcare professionals with instant access to relevant medical knowledge through intelligent semantic search and reasoning.',
            },
            {
              icon: Lightbulb,
              title: 'Our Vision',
              description:
                'A world where medical decisions are supported by AI that understands context, learns continuously, and prioritizes patient safety.',
            },
            {
              icon: Users,
              title: 'Our Impact',
              description:
                'Reducing diagnostic time, improving accuracy, and helping healthcare workers focus on what matters most—their patients.',
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-white rounded-3xl p-10 md:p-16 mb-20 border border-teal-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How MedSage Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                {
                  step: '01',
                  title: 'Upload & Index',
                  description:
                    'Medical files are processed and converted into semantic vectors using FastEmbed, capturing the meaning and context of the content.',
                },
                {
                  step: '02',
                  title: 'Semantic Storage',
                  description:
                    'Vectors are stored in Qdrant, a high-performance database optimized for similarity search across millions of documents.',
                },
                {
                  step: '03',
                  title: 'Intelligent Retrieval',
                  description:
                    'When you ask a question, MedSage retrieves the most semantically similar cases and information in under 100ms.',
                },
                {
                  step: '04',
                  title: 'DSPy Reasoning',
                  description:
                    'Retrieved context is processed through DSPy reasoning chains that generate accurate, explainable answers with predictive follow-up questions.',
                },
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center text-white font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                  <span className="font-semibold text-gray-900">Query Speed</span>
                  <span className="text-2xl font-bold text-blue-700">&lt;100ms</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl">
                  <span className="font-semibold text-gray-900">Semantic Accuracy</span>
                  <span className="text-2xl font-bold text-teal-700">99.2%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                  <span className="font-semibold text-gray-900">Cases Indexed</span>
                  <span className="text-2xl font-bold text-green-700">10k+</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                  <span className="font-semibold text-gray-900">Active Reasoning Chains</span>
                  <span className="text-2xl font-bold text-purple-700">15+</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 md:p-16 text-white mb-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-6">Built for a Hackathon</h2>
            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              MedSage was created during a healthcare AI hackathon with the goal of
              revolutionizing how medical professionals access and apply knowledge. The project
              combines cutting-edge vector search, semantic understanding, and reasoning
              frameworks to create a system that truly understands medical context.
            </p>
            <p className="text-gray-400 italic">
              "We believe that the future of healthcare lies in AI that augments human
              expertise, not replaces it. MedSage is our contribution to that future."
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-8 border border-teal-200">
            <Zap className="w-12 h-12 text-teal-600 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">What Makes Us Different</h3>
            <ul className="space-y-3">
              {[
                'Memory-first architecture prioritizes recall and context',
                'Predictive questions guide users to deeper insights',
                'Emergency detection ensures critical cases get immediate attention',
                'Continuous learning adapts to user patterns and feedback',
                'Transparent reasoning shows exactly how conclusions are reached',
              ].map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-200">
            <Users className="w-12 h-12 text-blue-600 mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Who We Serve</h3>
            <ul className="space-y-3">
              {[
                'Physicians seeking quick access to medical literature',
                'Emergency responders needing instant case references',
                'Medical researchers analyzing large document sets',
                'Healthcare administrators managing clinical knowledge',
                'Students and residents learning from historical cases',
              ].map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Ready to Experience MedSage?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => onNavigate('demo')}
              className="group px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-teal-500/30 transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
            >
              <span>Try Interactive Demo</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="px-8 py-4 bg-white text-teal-700 border-2 border-teal-200 rounded-2xl font-semibold text-lg hover:bg-teal-50 transition-all duration-200"
            >
              Get in Touch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
