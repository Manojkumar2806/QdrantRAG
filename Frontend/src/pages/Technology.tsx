import {
  Database,
  Zap,
  Cpu,
  ArrowRight,
  FileText,
  Search,
  Brain,
  CheckCircle,
} from 'lucide-react';

const techStack = [
  {
    icon: Database,
    name: 'Qdrant Vector DB',
    description:
      'High-performance vector database for semantic search. Stores medical knowledge as embeddings for instant similarity matching.',
    color: 'from-red-500 to-red-600',
    features: ['Sub-100ms queries', 'Semantic similarity', 'Scalable storage'],
  },
  {
    icon: Zap,
    name: 'FastEmbed',
    description:
      'Lightning-fast embedding generation for medical text. Converts documents into high-dimensional vectors for semantic understanding.',
    color: 'from-yellow-500 to-yellow-600',
    features: ['Real-time encoding', 'Multi-language support', 'Optimized performance'],
  },
  {
    icon: Cpu,
    name: 'DSPy Framework',
    description:
      'Advanced reasoning framework that structures AI logic into explainable chains, ensuring accurate and transparent medical insights.',
    color: 'from-blue-500 to-blue-600',
    features: ['Logical reasoning', 'Explainable AI', 'Chain optimization'],
  },
];

export default function Technology() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center space-x-2 bg-teal-100/80 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Cpu className="w-4 h-4" />
            <span>Cutting-Edge Stack</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Technology Behind
            <span className="block bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
              MedSage
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Built on state-of-the-art AI infrastructure designed for speed, accuracy, and
            scalability in medical reasoning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {techStack.map((tech, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 group"
            >
              <div className={`h-2 bg-gradient-to-r ${tech.color}`}></div>
              <div className="p-8">
                <div
                  className={`w-14 h-14 bg-gradient-to-br ${tech.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}
                >
                  <tech.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{tech.name}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{tech.description}</p>
                <div className="space-y-2">
                  {tech.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-10 md:p-12 border border-gray-200 mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            RAG Pipeline Architecture
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Our Retrieval-Augmented Generation pipeline combines vector search with advanced
            reasoning for accurate, contextual medical responses.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">1. Document Upload</h4>
              <p className="text-sm text-gray-600">User uploads medical file</p>
            </div>

            <div className="hidden md:flex justify-center">
              <ArrowRight className="w-6 h-6 text-teal-600" />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">2. Embedding</h4>
              <p className="text-sm text-gray-600">FastEmbed converts to vectors</p>
            </div>

            <div className="hidden md:flex justify-center">
              <ArrowRight className="w-6 h-6 text-teal-600" />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Database className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">3. Storage</h4>
              <p className="text-sm text-gray-600">Stored in Qdrant DB</p>
            </div>
          </div>

          <div className="my-6 flex justify-center">
            <div className="w-px h-12 bg-gradient-to-b from-teal-600 to-teal-400"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">4. User Query</h4>
              <p className="text-sm text-gray-600">Natural language question</p>
            </div>

            <div className="hidden md:flex justify-center">
              <ArrowRight className="w-6 h-6 text-teal-600" />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">5. Retrieval</h4>
              <p className="text-sm text-gray-600">Semantic search in Qdrant</p>
            </div>

            <div className="hidden md:flex justify-center">
              <ArrowRight className="w-6 h-6 text-teal-600" />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">6. Reasoning</h4>
              <p className="text-sm text-gray-600">DSPy processes context</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-xl font-semibold">
              <CheckCircle className="w-5 h-5" />
              <span>Accurate, Contextual Response Delivered</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl p-8 border border-teal-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Why This Stack?</h3>
            <ul className="space-y-4">
              {[
                {
                  title: 'Performance',
                  description: 'Sub-100ms vector search ensures instant responses',
                },
                {
                  title: 'Accuracy',
                  description: 'DSPy reasoning chains provide explainable logic',
                },
                {
                  title: 'Scalability',
                  description: 'Qdrant handles millions of medical documents',
                },
                {
                  title: 'Transparency',
                  description: 'Every answer is traceable to source material',
                },
              ].map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Technical Highlights</h3>
            <ul className="space-y-4">
              {[
                {
                  metric: '384-dimensional',
                  description: 'Vector embeddings for rich semantic representation',
                },
                {
                  metric: 'HNSW indexing',
                  description: 'Hierarchical graph structure for fast ANN search',
                },
                {
                  metric: 'Multi-stage',
                  description: 'DSPy chains with validation and optimization',
                },
                {
                  metric: 'Real-time',
                  description: 'Stream processing for continuous learning',
                },
              ].map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.metric}</h4>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
