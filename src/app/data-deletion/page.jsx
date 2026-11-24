export const metadata = {
  title: "Data Deletion – SmoothSales",
  description: "Request deletion of your SmoothSales data or data obtained via Facebook/Meta integrations.",
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 py-4 px-6 flex items-center gap-3">
        <img src="/images/smoothsales-logo.jpg" alt="SmoothSales" className="h-8 w-8 rounded" />
        <span className="font-semibold text-lg text-gray-900">SmoothSales</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Deletion Request</h1>
        <p className="text-sm text-gray-500 mb-8">
          In compliance with Meta Platform Policy and applicable data protection laws.
        </p>

        <section className="space-y-8 text-gray-700 leading-relaxed">

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Facebook / Meta Data Deletion
            </h2>
            <p className="text-blue-800 text-sm">
              If you used Facebook Login or connected a WhatsApp Business account through
              SmoothSales and wish to have your Meta-related data deleted, follow the instructions
              below. This complies with Meta's Platform Policy requirement for a user data deletion
              callback.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              How to Request Data Deletion
            </h2>
            <div className="space-y-6">

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Via SmoothSales Account</h3>
                  <p className="text-sm text-gray-600">
                    If you have a SmoothSales account, log in and go to <strong>Settings → Account →
                    Delete Account</strong>. This will permanently remove all your data including any
                    Facebook/WhatsApp integration data within 30 days.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Via Facebook Settings</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    You can remove SmoothSales access to your Facebook account directly from Facebook:
                  </p>
                  <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-1">
                    <li>Go to <a href="https://www.facebook.com/settings/?tab=business_tools" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Facebook Settings → Business Integrations</a></li>
                    <li>Find <strong>Smoothsales</strong> in the list</li>
                    <li>Click <strong>View and Edit</strong> → <strong>Remove</strong></li>
                    <li>Confirm removal</li>
                  </ol>
                  <p className="text-sm text-gray-500 mt-2">
                    This revokes our access token. We will delete your associated data within 30 days.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Via Email Request</h3>
                  <p className="text-sm text-gray-600">
                    Send an email to{" "}
                    <a href="mailto:privacy@smoothsales.in" className="text-blue-600 underline">
                      privacy@smoothsales.in
                    </a>{" "}
                    with the subject line <strong>"Data Deletion Request"</strong> and include:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-gray-600 mt-2 space-y-1">
                    <li>Your name and email address</li>
                    <li>Your Facebook user ID or the email used to sign up</li>
                    <li>Description of the data you want deleted</li>
                  </ul>
                  <p className="text-sm text-gray-500 mt-2">
                    We will process your request within <strong>30 days</strong> and send you a
                    confirmation email once deletion is complete.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">What Data We Delete</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Your Facebook/Meta access tokens stored in our system</li>
              <li>Your WhatsApp Business Account ID and Phone Number ID linkage</li>
              <li>Any personal data (name, email, phone) associated with your account</li>
              <li>Conversation history and lead data you created</li>
              <li>All workspace data associated with your organisation</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Data We May Retain</h2>
            <p className="text-sm">
              We may retain anonymized or aggregated data that cannot identify you, as well as data
              required by law (e.g. financial records for tax compliance). We will inform you of any
              such retention in our deletion confirmation email.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Automated Deletion Callback</h2>
            <p className="text-sm">
              SmoothSales implements Meta's required data deletion callback endpoint. When Meta
              sends a deletion notification on your behalf (after you remove the app from Facebook),
              our system automatically processes the deletion request. You will receive a
              confirmation at the email associated with your SmoothSales account.
            </p>
            <p className="text-sm mt-2 text-gray-500">
              Technical endpoint: <code className="bg-gray-100 px-1 rounded">POST /api/whatsapp/meta/data-deletion</code>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1 text-sm">
              <p><strong>SmoothSales – Privacy Team</strong></p>
              <p>Email: <a href="mailto:privacy@smoothsales.in" className="text-blue-600">privacy@smoothsales.in</a></p>
              <p>Response time: Within 30 days of receiving your request</p>
            </div>
          </div>

        </section>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
          <a href="/privacy" className="hover:text-gray-900">Privacy Policy</a>
          <a href="/terms" className="hover:text-gray-900">Terms of Service</a>
          <a href="https://crm.smoothsales.in/login" className="hover:text-gray-900">Back to CRM</a>
        </div>
      </div>
    </main>
  );
}
