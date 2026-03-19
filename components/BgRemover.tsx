"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const FREE_MAX_PX = 800;
type State = "idle" | "loading" | "done" | "error";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip data:image/xxx;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeToWhiteBg(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, FREE_MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export default function BgRemover() {
  const [state, setState] = useState<State>("idle");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const [remaining, setRemaining] = useState<number>(3);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => setRemaining(d.remaining))
      .catch(() => {});
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file (JPG, PNG, WEBP).");
      setState("error");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setErrorMsg("File too large. Max 12MB.");
      setState("error");
      return;
    }

    // Consume quota
    const usageRes = await fetch("/api/usage", { method: "POST" });
    if (usageRes.status === 429) {
      setErrorMsg("You've used all 3 free images today. Come back tomorrow!");
      setState("error");
      setRemaining(0);
      return;
    }
    const usageData = await usageRes.json();
    setRemaining(usageData.remaining);

    setOriginalUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setState("loading");

    try {
      // Convert to base64 and send as JSON
      const imageBase64 = await fileToBase64(file);

      const resp = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mimeType: file.type }),
      });

      const data = await resp.json();

      if (!resp.ok || data.error) {
        throw new Error(data.error || `API error ${resp.status}`);
      }

      // Load result image from base64
      const img = new Image();
      img.src = `data:image/png;base64,${data.resultBase64}`;
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("Failed to load result image"));
      });

      setResultUrl(resizeToWhiteBg(img));
      setState("done");
    } catch (e: any) {
      setErrorMsg(e.message || "Something went wrong. Please try again.");
      setState("error");
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const reset = () => {
    setState("idle");
    setOriginalUrl(null);
    setResultUrl(null);
    setErrorMsg("");
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "white-bg.jpg";
    a.click();
  };

  const isLimitReached = remaining === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Background Remover</h1>
      <p className="text-gray-500 mb-4">Upload a photo — get a clean white background instantly.</p>

      {/* Quota badge */}
      <div className={`mb-6 px-4 py-2 rounded-full text-sm font-medium ${
        isLimitReached ? "bg-red-100 text-red-600"
        : remaining <= 1 ? "bg-yellow-100 text-yellow-700"
        : "bg-green-100 text-green-700"
      }`}>
        {isLimitReached
          ? "Daily limit reached — resets tomorrow"
          : `${remaining} free image${remaining !== 1 ? "s" : ""} remaining today`}
      </div>

      {/* Upload zone */}
      {state === "idle" && (
        <div
          className={`w-full max-w-lg rounded-2xl p-10 text-center transition-all ${
            isLimitReached
              ? "border-2 border-dashed border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
              : dragging
              ? "border-2 border-solid border-blue-500 bg-blue-50"
              : "border-2 border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
          }`}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); if (!isLimitReached) setDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!isLimitReached) setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
          onDrop={isLimitReached ? (e) => e.preventDefault() : handleDrop}
          onClick={() => !isLimitReached && inputRef.current?.click()}
        >
          <div className="text-4xl mb-3">🖼️</div>
          <p className="text-gray-700 text-lg mb-1">
            {isLimitReached ? "Daily limit reached" : "Drag & drop or click to browse"}
          </p>
          <p className="text-gray-400 text-sm mb-5">JPG, PNG, WEBP — up to 12 MB</p>

          {!isLimitReached && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Browse files
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Loading */}
      {state === "loading" && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Removing background...</p>
          {originalUrl && (
            <img src={originalUrl} alt="original" className="w-40 h-40 object-contain rounded-xl border opacity-50" />
          )}
        </div>
      )}

      {/* Result */}
      {state === "done" && originalUrl && resultUrl && (
        <div className="flex flex-col items-center gap-6 mt-4">
          <div className="flex gap-6 flex-wrap justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">Original</p>
              <img src={originalUrl} alt="original" className="w-56 h-56 object-contain rounded-xl border bg-gray-100" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">White Background</p>
              <img src={resultUrl} alt="result" className="w-56 h-56 object-contain rounded-xl border bg-white" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={download} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              ⬇ Download
            </button>
            <button onClick={reset} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
              Try another
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="mt-4 text-center max-w-md">
          {originalUrl && (
            <img src={originalUrl} alt="original" className="w-40 h-40 object-contain rounded-xl border mx-auto mb-4 opacity-60" />
          )}
          <p className="text-red-500 mb-4 text-sm">{errorMsg}</p>
          <button onClick={reset} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Try again
          </button>
        </div>
      )}

      <p className="mt-10 text-xs text-gray-400">
        Free: 3 images/day · 800px · <a href="/pricing" className="underline hover:text-gray-600">Upgrade for unlimited full-res →</a>
      </p>
    </div>
  );
}
