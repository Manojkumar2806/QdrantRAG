import {
  FileText,
  MessageSquare,
  AlertTriangle,
  Database,
  Cpu,
  TrendingUp,
  Search,
  Brain,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Universal File Q&A',
    description:
      'Upload medical documents in any format—PDFs, images, text files—and ask natural language questions. MedSage extracts context and provides accurate answers with semantic understanding.',
    color: 'from-blue-500 to-blue-600',
    benefits: ['Multi-format support', 'Contextual answers', 'Source references'],
  },
  {
    icon: MessageSquare,
    title: 'Predictive Questions',
    description:
      'Never wonder what to ask next. MedSage analyzes your conversation and suggests the next 3 most relevant questions, guiding you toward deeper insights.',
    color: 'from-teal-500 to-teal-600',
    benefits: ['AI-powered suggestions', 'Context-aware', 'Saves time'],
  },
  {
    icon: AlertTriangle,
    title: 'Emergency Detection',
    description:
      'Critical situations require immediate action. MedSage automatically identifies urgent medical indicators and highlights emergency-level information in real-time.',
    color: 'from-red-500 to-red-600',
    benefits: ['Real-time alerts', 'Priority flagging', 'Instant notifications'],
  },
  {
    icon: Database,
    title: 'Semantic Memory (Qdrant)',
    description:
      'Powered by Qdrant vector database, MedSage stores and retrieves information using semantic similarity, finding relevant cases even when terminology varies.',
    color: 'from-purple-500 to-purple-600',
    benefits: ['Vector search', 'Similar case retrieval', 'Fast queries'],
  },
  {
    icon: Cpu,
    title: 'DSPy Reasoning',
    description:
      'Advanced reasoning chains built with DSPy ensure that every answer is grounded in logic, transparent, and traceable back to source material.',
    color: 'from-orange-500 to-orange-600',
    benefits: ['Explainable AI', 'Logical reasoning', 'Transparent process'],
  },
  {
    icon: TrendingUp,
    title: 'Continuous Learning Loop',
    description:
      'MedSage improves with every interaction. Feedback loops and usage patterns help the system adapt and become more accurate over time.',
    color: 'from-green-500 to-green-600',
    benefits: ['Adaptive learning', 'Performance optimization', 'User feedback integration'],
  },
];

const capabilities = [
  {
    icon: Search,
    title: 'Instant Search',
    value: '<100ms',
    description: 'Vector search response time',
  },
  {
    icon: Brain,
    title: 'Smart Retrieval',
    value: '99.2%',
    description: 'Semantic accuracy rate',
  },
  {
    icon: Zap,
    title: 'Fast Processing',
    value: '10k+',
    description: 'Documents processed daily',
  },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 bg-teal-100/80 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>Powerful Capabilities</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Features That Set
            <span className="block bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
              MedSage Apart
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Every feature is designed with healthcare professionals in mind, combining
            cutting-edge AI with practical usability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {capabilities.map((capability, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
                <capability.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{capability.value}</div>
              <div className="text-sm font-semibold text-teal-700 mb-1">{capability.title}</div>
              <div className="text-sm text-gray-600">{capability.description}</div>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group"
            >
              <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div
                    className={`flex-shrink-0 w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {feature.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <span
                          key={benefitIndex}
                          className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-200"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-gradient-to-br from-teal-50 to-white rounded-3xl p-10 md:p-16 text-center border border-teal-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            See Features in Action
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience how these powerful features work together to deliver intelligent
            medical reasoning and insights.
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-2xl font-semibold text-lg hover:shadow-2xl hover:shadow-teal-500/30 transform hover:scale-105 transition-all duration-200">
            Try Interactive Demo
          </button>
        </div>
      </div>
    </div>
  );
}
