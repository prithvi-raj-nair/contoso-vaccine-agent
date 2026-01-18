export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Privacy Policy</h1>

        <p className="text-gray-700 mb-4">
          <strong>Last updated:</strong> January 2026
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Demo Application</h2>
        <p className="text-gray-700 mb-4">
          SimpleCal is a demonstration application created for educational and testing purposes.
          This is not a production service intended for real-world use.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Data Collection</h2>
        <p className="text-gray-700 mb-4">
          This demo application does not collect, store, or process any personal user data.
          The only data stored are calendar events created through the application interface,
          which contain no personally identifiable information.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">No Tracking</h2>
        <p className="text-gray-700 mb-4">
          We do not use cookies, analytics, or any tracking mechanisms.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Contact</h2>
        <p className="text-gray-700 mb-4">
          For questions about this demo, please contact the repository owner.
        </p>
      </div>
    </div>
  );
}
