export const metadata = {
  title: "Privacy Policy – SmoothSales",
  description: "SmoothSales Privacy Policy – how we collect, use and protect your data.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "November 24, 2026";
  return (
    <main className="min-h-screen bg-white text-gray-800 font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 py-4 px-6 flex items-center gap-3">
        <img src="/images/smoothsales-logo.jpg" alt="SmoothSales" className="h-8 w-8 rounded" />
        <span className="font-semibold text-lg text-gray-900">SmoothSales</span>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: {lastUpdated}</p>

        <section className="space-y-8 text-gray-700 leading-relaxed">

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              SmoothSales ("we", "us", or "our") operates the CRM platform available at{" "}
              <strong>crm.smoothsales.in</strong> and the marketing website at{" "}
              <strong>smoothsales.in</strong>. This Privacy Policy explains how we collect, use,
              share, and protect information about you when you use our services, including our
              integration with Meta (Facebook/WhatsApp) platforms.
            </p>
            <p className="mt-3">
              By using SmoothSales, you agree to the collection and use of information in accordance
              with this policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account information:</strong> Name, email address, phone number, and company
                details when you register or use our services.
              </li>
              <li>
                <strong>Business data:</strong> Lead information, contacts, deals, and conversation
                data that you input into the CRM.
              </li>
              <li>
                <strong>WhatsApp / Meta data:</strong> When you connect a WhatsApp Business number
                via Meta's Embedded Signup, we receive your WhatsApp Business Account ID, phone
                number ID, and an access token. We also receive incoming and outgoing WhatsApp
                messages routed through the Meta Cloud API webhook.
              </li>
              <li>
                <strong>Usage data:</strong> Log files, IP addresses, browser type, pages visited,
                and time spent on pages.
              </li>
              <li>
                <strong>Cookies:</strong> Session cookies and analytics cookies to maintain your
                login session and improve our service.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide, operate, and maintain the SmoothSales CRM platform.</li>
              <li>
                To enable WhatsApp messaging features through the Meta WhatsApp Business API.
              </li>
              <li>To send transactional notifications related to your account.</li>
              <li>To improve and personalise your experience on our platform.</li>
              <li>To comply with legal obligations and enforce our terms.</li>
              <li>To detect and prevent fraud or misuse of our platform.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Meta Platform Data</h2>
            <p>
              SmoothSales integrates with Meta's platforms (Facebook, WhatsApp) using the Meta
              Business API. When you connect your WhatsApp Business account:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                We store your WhatsApp Business Account (WABA) ID, Phone Number ID, and access
                token in encrypted form on our servers.
              </li>
              <li>
                Incoming WhatsApp messages are received via Meta's webhook and stored in our
                database linked to your workspace.
              </li>
              <li>
                We do not sell or share your Meta account data with any third parties except as
                required by law.
              </li>
              <li>
                You can disconnect your WhatsApp number at any time from the CRM settings, which
                will revoke our access to your WhatsApp Business Account.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Sharing</h2>
            <p>We do not sell your personal data. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>
                <strong>Service providers:</strong> Third-party services that help us operate our
                platform (cloud hosting, email delivery, analytics). These providers are
                contractually bound to protect your data.
              </li>
              <li>
                <strong>Meta Platforms:</strong> Data flows to and from Meta's APIs as needed to
                operate WhatsApp and advertising integrations you have enabled.
              </li>
              <li>
                <strong>Legal requirements:</strong> We may disclose data if required by law, court
                order, or governmental authority.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS encryption in
              transit, AES-GCM encryption at rest for sensitive tokens, and regular security
              reviews. However, no method of transmission over the internet is 100% secure.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active or as needed to provide our
              services. If you delete your account, we will delete or anonymize your personal data
              within 30 days, except where retention is required by law.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data ("right to be forgotten").</li>
              <li>Object to or restrict processing of your data.</li>
              <li>Data portability — receive your data in a machine-readable format.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:privacy@smoothsales.in" className="text-blue-600 underline">
                privacy@smoothsales.in
              </a>
              . For Facebook/Meta data deletion requests, please visit our{" "}
              <a href="/data-deletion" className="text-blue-600 underline">
                Data Deletion page
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies</h2>
            <p>
              We use essential cookies to maintain your login session and functional cookies to
              remember your preferences. We do not use advertising or cross-site tracking cookies.
              You can control cookies through your browser settings.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Children's Privacy</h2>
            <p>
              Our services are not directed to individuals under the age of 18. We do not knowingly
              collect personal information from children.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              significant changes by posting the new policy on this page and updating the "Last
              updated" date. Your continued use of SmoothSales after changes constitutes acceptance
              of the new policy.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1 text-sm">
              <p><strong>SmoothSales</strong></p>
              <p>Email: <a href="mailto:privacy@smoothsales.in" className="text-blue-600">privacy@smoothsales.in</a></p>
              <p>Website: <a href="https://smoothsales.in" className="text-blue-600">https://smoothsales.in</a></p>
            </div>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
          <a href="/terms" className="hover:text-gray-900">Terms of Service</a>
          <a href="/data-deletion" className="hover:text-gray-900">Data Deletion</a>
          <a href="https://crm.smoothsales.in/login" className="hover:text-gray-900">Back to CRM</a>
        </div>
      </div>
    </main>
  );
}
