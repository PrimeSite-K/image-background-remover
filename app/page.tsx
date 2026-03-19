import BgRemover from "@/components/BgRemover";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <BgRemover />

      {/* SEO content below the fold */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Why use our Background Remover?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 text-left">
            <div>
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-800 mb-1">Instant results</h3>
              <p className="text-gray-500 text-sm">Upload your photo and get a clean white background in seconds. No design skills needed.</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🛒</div>
              <h3 className="font-semibold text-gray-800 mb-1">Ecommerce ready</h3>
              <p className="text-gray-500 text-sm">White background photos meet Amazon, Shopify, and marketplace requirements out of the box.</p>
            </div>
            <div>
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-semibold text-gray-800 mb-1">Privacy first</h3>
              <p className="text-gray-500 text-sm">Your images are never stored on our servers. Processed and discarded immediately.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12 px-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Need more than 3 images/day?</h2>
        <p className="text-gray-500 mb-6">Upgrade to Pro for unlimited full-resolution downloads.</p>
        <Link href="/pricing" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          See pricing →
        </Link>
      </section>
    </>
  );
}
