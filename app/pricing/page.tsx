"use client";

import { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <Link href="/" className="text-blue-500 text-sm mb-8 hover:underline">← Back to tool</Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Simple Pricing</h1>
      <p className="text-gray-500 mb-10">No hidden fees. Cancel anytime.</p>

      <div className="flex gap-6 flex-wrap justify-center">
        {/* Free */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 w-72 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Free</h2>
          <p className="text-4xl font-bold text-gray-900 mb-1">$0</p>
          <p className="text-gray-400 text-sm mb-6">Forever free</p>
          <ul className="text-sm text-gray-600 space-y-2 mb-8 flex-1">
            <li>✓ 3 images per day</li>
            <li>✓ 800px output</li>
            <li>✓ White background</li>
            <li className="text-gray-300">✗ Full resolution</li>
            <li className="text-gray-300">✗ Unlimited images</li>
          </ul>
          <Link href="/" className="block text-center px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Get started
          </Link>
        </div>

        {/* Pro */}
        <div className="bg-blue-600 rounded-2xl p-8 w-72 flex flex-col text-white relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>
          <h2 className="text-lg font-semibold mb-1">Pro</h2>
          <p className="text-4xl font-bold mb-1">$7</p>
          <p className="text-blue-200 text-sm mb-6">per month</p>
          <ul className="text-sm space-y-2 mb-8 flex-1">
            <li>✓ Unlimited images</li>
            <li>✓ Full original resolution</li>
            <li>✓ White background</li>
            <li>✓ Priority processing</li>
            <li>✓ Cancel anytime</li>
          </ul>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="px-6 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-60"
          >
            {loading ? "Redirecting..." : "Upgrade to Pro"}
          </button>
        </div>
      </div>

      <p className="mt-8 text-xs text-gray-400">Secure payment via Stripe · SSL encrypted</p>
    </div>
  );
}
