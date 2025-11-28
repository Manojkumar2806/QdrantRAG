import { Shield, Lock, Eye, FileText, Users, AlertCircle } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-teal-100/80 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            <span>Privacy & Security</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-lg text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-2xl p-8 mb-12">
          <div className="flex items-start space-x-4">
            <AlertCircle className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Our Commitment to Privacy</h3>
              <p className="text-gray-700 leading-relaxed">
                At MedSage, we understand the sensitivity of medical information. This privacy
                policy outlines how we collect, use, and protect your data when you use our
                services.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <section className="border-l-4 border-teal-600 pl-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">User-Provided Information:</strong> When you
                use MedSage, you may provide medical documents, case files, and queries. We
                process this information solely to deliver our AI reasoning services.
              </p>
              <p>
                <strong className="text-gray-900">Usage Data:</strong> We collect anonymous
                usage statistics to improve our service, including query patterns, response
                times, and feature usage.
              </p>
              <p>
                <strong className="text-gray-900">Technical Information:</strong> Standard web
                logs including IP addresses, browser type, and device information are collected
                for security and optimization purposes.
              </p>
            </div>
          </section>

          <section className="border-l-4 border-blue-600 pl-6">
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">How We Use Your Data</h2>
            </div>
            <ul className="space-y-3 text-gray-700 leading-relaxed">
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong className="text-gray-900">Service Delivery:</strong> Process your
                  medical documents and queries to provide intelligent search and reasoning
                  capabilities.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong className="text-gray-900">System Improvement:</strong> Analyze usage
                  patterns to enhance AI accuracy and performance.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong className="text-gray-900">Security:</strong> Monitor for unauthorized
                  access and protect against security threats.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong className="text-gray-900">Communication:</strong> Send service
                  updates, security alerts, and respond to your inquiries.
                </span>
              </li>
            </ul>
          </section>

          <section className="border-l-4 border-purple-600 pl-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900">Data Security</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>End-to-end encryption for data in transit and at rest</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Secure vector storage in Qdrant with access controls</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Regular security audits and vulnerability assessments</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Strict access controls and authentication mechanisms</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="border-l-4 border-green-600 pl-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-6 h-6 text-green-600" />
              <h2 className="text-2xl font-bold text-gray-900">Data Sharing</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                <strong className="text-gray-900">We do not sell your data.</strong> Your
                medical information is never shared with third parties for marketing purposes.
              </p>
              <p>We may share data only in the following circumstances:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Service Providers:</strong> Trusted partners who help us operate our
                    platform (e.g., cloud infrastructure providers) under strict
                    confidentiality agreements
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Legal Requirements:</strong> When required by law or to protect
                    rights and safety
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>With Your Consent:</strong> When you explicitly authorize data
                    sharing
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section className="border-l-4 border-orange-600 pl-6">
            <div className="flex items-center space-x-3 mb-4">
              <Eye className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">Your Rights</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>You have the following rights regarding your data:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Access:</strong> Request a copy of the data we hold about you
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Correction:</strong> Request corrections to inaccurate data
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Deletion:</strong> Request deletion of your data (subject to legal
                    obligations)
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Portability:</strong> Request your data in a machine-readable format
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Opt-out:</strong> Opt out of certain data processing activities
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section className="border-l-4 border-red-600 pl-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Data Retention</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                We retain your data only as long as necessary to provide our services and comply
                with legal obligations. Medical documents and queries are stored securely in our
                vector database and can be deleted upon request.
              </p>
              <p>
                Anonymous usage statistics may be retained indefinitely for service improvement
                purposes.
              </p>
            </div>
          </section>

          <section className="border-l-4 border-teal-600 pl-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Cookies and Tracking</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                MedSage uses essential cookies to maintain your session and ensure proper
                functionality. We do not use third-party advertising or tracking cookies.
              </p>
              <p>
                You can control cookie preferences through your browser settings, though
                disabling essential cookies may affect functionality.
              </p>
            </div>
          </section>

          <section className="border-l-4 border-gray-600 pl-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">Changes to This Policy</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                We may update this privacy policy periodically to reflect changes in our
                practices or legal requirements. We will notify users of significant changes via
                email or through our platform.
              </p>
              <p>
                Continued use of MedSage after policy updates constitutes acceptance of the
                revised terms.
              </p>
            </div>
          </section>

          <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="leading-relaxed mb-6">
              If you have questions about this privacy policy or how we handle your data, please
              contact us:
            </p>
            <div className="space-y-2">
              <p>
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:privacy@medsage.ai"
                  className="text-teal-400 hover:text-teal-300 transition-colors"
                >
                  privacy@medsage.ai
                </a>
              </p>
              <p>
                <strong>Address:</strong> 123 Healthcare Innovation Blvd, San Francisco, CA
                94102
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
