export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

      <div className="prose prose-gray">
        <p className="text-gray-600 mb-6">
          Last updated: January 2026
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Overview</h2>
          <p className="text-gray-600">
            The National Health Database (NHDB) is a demonstration application
            built to showcase vaccination tracking and management capabilities.
            This privacy policy explains how data is handled within this demo system.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Collection</h2>
          <p className="text-gray-600">
            This application collects and stores simulated health data including:
          </p>
          <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
            <li>Parent/guardian information (names, contact details)</li>
            <li>Child information (names, dates of birth, village assignments)</li>
            <li>Vaccination records (visit dates, vaccines administered)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Usage</h2>
          <p className="text-gray-600">
            All data in this system is used solely for demonstration purposes to
            showcase the functionality of a vaccination tracking system. The data
            may be accessed via API endpoints for integration with AI assistants
            and other authorized systems.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Data Storage</h2>
          <p className="text-gray-600">
            Data is stored securely in MongoDB Atlas cloud database with
            appropriate access controls. The database is hosted in secure data
            centers with industry-standard security measures.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">API Access</h2>
          <p className="text-gray-600">
            This application exposes REST API endpoints that may be accessed by
            authorized systems including Custom GPT integrations. API access is
            limited to read and write operations necessary for vaccination
            tracking and reporting.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact</h2>
          <p className="text-gray-600">
            For questions about this privacy policy or the NHDB application,
            please contact the system administrator.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Disclaimer</h2>
          <p className="text-gray-600">
            This is a demonstration application. All data contained within is
            simulated and does not represent real individuals or health records.
          </p>
        </section>
      </div>
    </div>
  );
}
