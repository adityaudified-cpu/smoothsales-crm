export const metadata = {
  title: "Terms of Service – SmoothSales",
  description: "SmoothSales Terms of Service – the rules and conditions governing use of our platform.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "November 24, 2026";
  return (
    <main className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 py-4 px-6 flex items-center gap-3">
        <img src="/images/smoothsales-logo.jpg" alt="SmoothSales" className="h-8 w-8 rounded" />
        <span className="font-semibold text-lg text-gray-900">SmoothSales</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {lastUpdated}</p>

        <section className="space-y-8 text-gray-700 leading-relaxed">

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using SmoothSales ("the Service") at <strong>crm.smoothsales.in</strong>{" "}
              or <strong>smoothsales.in</strong>, you agree to be bound by these Terms of Service
              ("Terms"). If you do not agree to these Terms, please do not use our Service.
            </p>
            <p className="mt-3">
              These Terms apply to all users, including businesses and individuals who connect
              WhatsApp Business accounts, Meta advertising accounts, or other third-party services
              through SmoothSales.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              SmoothSales is a Customer Relationship Management (CRM) platform that provides:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Lead and contact management</li>
              <li>WhatsApp Business messaging via Meta Cloud API</li>
              <li>Sales pipeline and deal tracking</li>
              <li>Integration with Meta Ads (Facebook/Instagram advertising)</li>
              <li>Reporting, analytics, and team collaboration tools</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Account Registration</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You must be at least 18 years old to use SmoothSales.</li>
              <li>
                One workspace may be used by multiple team members. The account owner is
                responsible for all activity under their workspace.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Meta Platform Integration</h2>
            <p>
              SmoothSales integrates with Meta's platforms (WhatsApp Business API, Facebook Login,
              Meta Ads). By using these integrations, you also agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <a
                  href="https://www.facebook.com/terms"
                  className="text-blue-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Meta's Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="https://www.whatsapp.com/legal/business-policy/"
                  className="text-blue-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp Business Policy
                </a>
              </li>
              <li>
                <a
                  href="https://developers.facebook.com/policy/"
                  className="text-blue-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Meta Platform Policy
                </a>
              </li>
            </ul>
            <p className="mt-3">
              You are solely responsible for ensuring your use of WhatsApp Business messaging
              complies with WhatsApp's policies, including obtaining proper consent from message
              recipients.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Acceptable Use</h2>
            <p>You agree not to use SmoothSales to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Send spam or unsolicited bulk messages via WhatsApp or other channels.</li>
              <li>Violate any applicable laws or regulations.</li>
              <li>Infringe the intellectual property rights of others.</li>
              <li>Transmit malicious code, viruses, or harmful data.</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts.</li>
              <li>Engage in any activity that disrupts the functioning of the Service.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Ownership</h2>
            <p>
              You retain ownership of all data you input into SmoothSales (leads, contacts, messages,
              etc.). By using the Service, you grant us a limited licence to process this data solely
              to provide and improve the Service.
            </p>
            <p className="mt-3">
              You can export or delete your data at any time by contacting{" "}
              <a href="mailto:support@smoothsales.in" className="text-blue-600 underline">
                support@smoothsales.in
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Payment and Billing</h2>
            <p>
              Certain features of SmoothSales require a paid subscription. Subscription fees are
              billed in advance on a monthly or annual basis. All fees are non-refundable unless
              required by law. We reserve the right to change pricing with 30 days' notice.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Service Availability</h2>
            <p>
              We strive for 99.9% uptime but do not guarantee uninterrupted access. Scheduled
              maintenance, updates, or external service disruptions (including Meta API outages)
              may affect availability. We will endeavour to notify users in advance of planned
              maintenance.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, SmoothSales shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including loss of
              profits, data, or business opportunities, arising from your use of or inability to
              use the Service.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
            <p>
              We may suspend or terminate your account if you violate these Terms. You may
              terminate your account at any time by contacting us. Upon termination, your data
              will be retained for 30 days and then permanently deleted.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will provide at least 7 days' notice for
              material changes by email or in-app notification. Continued use of the Service after
              changes constitutes acceptance of the new Terms.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the
              exclusive jurisdiction of the courts in India.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Us</h2>
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1 text-sm">
              <p><strong>SmoothSales</strong></p>
              <p>Email: <a href="mailto:support@smoothsales.in" className="text-blue-600">support@smoothsales.in</a></p>
              <p>Website: <a href="https://smoothsales.in" className="text-blue-600">https://smoothsales.in</a></p>
            </div>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
          <a href="/privacy" className="hover:text-gray-900">Privacy Policy</a>
          <a href="/data-deletion" className="hover:text-gray-900">Data Deletion</a>
          <a href="https://crm.smoothsales.in/login" className="hover:text-gray-900">Back to CRM</a>
        </div>
      </div>
    </main>
  );
}
