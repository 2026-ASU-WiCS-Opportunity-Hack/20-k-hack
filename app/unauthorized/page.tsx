export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border text-center max-w-md">
        <p className="text-4xl mb-4">🔒</p>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h1>
        <p className="text-gray-500 text-sm">
          You are not authorized to access this system.
          Please contact your administrator.
        </p>
        <a href="/login" className="mt-4 inline-block text-indigo-600 text-sm hover:underline">
          ← Back to Login
        </a>
      </div>
    </div>
  )
}