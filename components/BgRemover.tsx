"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL!;
const FREE_MAX_PX = 800;

type State = "idle" | "loading" | "done" | "error";

export default function BgRemover() {
  const [state, setState] = useState<State>("idle");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load quota on mount
  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => setRemaining(d.remaining))
      .catch(() => setRemaining(null));
  }, []);

  const resizeToFree = (img: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, FREE_MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file.");
      setState("error");
      return;
    }

    // Check quota before processing
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
      const form = new FormData();
      form.append("image_file", file);

      const resp = await fetch(`${WORKER_URL}/remove-bg`, {
        method: "POST",
        body: form,
      });

      if (!resp.ok) throw new Error(`API error: ${resp.status}`);

      const blob = await resp.blob();
      const pngUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.src = pngUrl;
      await new Promise((res) => (img.onload = res));

      // Free tier: resize to 800px max
      const canvas = resizeToFree(img);
      setResultUrl(canvas.toDataURL("image/jpeg", 0.92));
      setState("done");
    } catch (e: any) {
      setErrorMsg(e.message || "Something went wrong.");
      setState("error");
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "white-bg.jpg";
    a.click();
  };

  const reset = () => {
    setState("idle");
    setOriginalUrl(null);
    setResultUrl(null);
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const isLimitReached = remaining === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Background Remover</h1>
      <p className="text-gray-500 mb-4">Upload a photo — get a clean white background instantly.</p>

      {/* Quota badge */}
      {remaining !== null && (
        <div className={`mb-6 px-4 py-2 rounded-full text-sm font-medium ${
          isLimitReached
            ? "bg-red-100 text-red-600"
            : remaining <= 1
            ? "bg-yellow-100 text-yellow-700"
            : "bg-green-100 text-green-700"
        }`}>
          {isLimitReached
            ? "Daily limit reached — resets tomorrow"
            : `${remaining} free image${remaining !== 1 ? "s" : ""} remaining today`}
        </div>
      )}

      {state === "idle" && (
        <div
          className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
            isLimitReached
              ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
              : dragging
              ? "border-blue-500 bg-blue-50 cursor-pointer"
              : "border-gray-300 hover:border-blue-400 cursor-pointer"
          }`}
          onClick={() => !isLimitReached && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); if (!isLimitReached) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { if (!isLimitReached) onDrop(e); else e.preventDefault(); }}
        >
          <p className="text-gray-600 text-lg">
            {isLimitReached ? "Daily limit reached" : <>Drag & drop or <span className="text-blue-500 underline">browse</span></>}
          </p>
          <p className="text-gray-400 text-sm mt-2">JPG, PNG, WEBP — up to 12 MB · Free tier: 800px output</p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
        </div>
      )}

      {state === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Removing background...</p>
        </div>
      )}

      {(state === "done" || state === "loading") && originalUrl && (
        <div className="flex gap-6 mt-8 flex-wrap justify-center">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">Original</p>
            <img src={originalUrl} alt="original" className="w-64 h-64 object-contain rounded-xl border" />
          </div>
          {resultUrl && (
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">White Background <span className="text-xs text-gray-300">(800px)</span></p>
              <img src={resultUrl} alt="result" className="w-64 h-64 object-contain rounded-xl border" />
            </div>
          )}
        </div>
      )}

      {state === "done" && (
        <div className="flex gap-3 mt-6">
          <button onClick={download} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Download
          </button>
          <button onClick={reset} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
            Try another
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="mt-6 text-center">
          <p className="text-red-500 mb-4">{errorMsg}</p>
          <button onClick={reset} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            {isLimitReached ? "OK" : "Try again"}
          </button>
        </div>
      )}

      {/* Free tier notice */}
      <p className="mt-8 text-xs text-gray-400">
        Free tier: 3 images/day · 800px output · <span className="underline cursor-pointer">Upgrade for unlimited full-res</span>
      </p>
    </div>
  );
}
