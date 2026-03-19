import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">You're all set!</h1>
      <p className="text-gray-500 mb-8">Your Pro subscription is active. Enjoy unlimited full-resolution images.</p>
      <Link href="/" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
        Start removing backgrounds
      </Link>
    </div>
  );
}
