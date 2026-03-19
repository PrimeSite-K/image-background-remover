"use client";

import { useState, useRef, useCallback } from "react";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL!;

type State = "idle" | "loading" | "done" | "error";

export default function BgRemover() {
  const [state, setState] = useState<State>("idle");
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file.");
      setState("error");
      return;
    }

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

      if (!resp.ok) {
        throw new Error(`API error: ${resp.status}`);
      }

      const blob = await resp.blob();
      const pngUrl = URL.createObjectURL(blob);

      // Composite onto white background using Canvas
      const img = new Image();
      img.src = pngUrl;
      await new Promise((res) => (img.onload = res));

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      setResultUrl(canvas.toDataURL("image/jpeg", 0.95));
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Background Remover</h1>
      <p className="text-gray-500 mb-8">Upload a photo — get a clean white background instantly.</p>

      {state === "idle" && (
        <div
          className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
            dragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <p className="text-gray-600 text-lg">Drag & drop or <span className="text-blue-500 underline">browse</span></p>
          <p className="text-gray-400 text-sm mt-2">JPG, PNG, WEBP — up to 12 MB</p>
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
              <p className="text-sm text-gray-400 mb-2">White Background</p>
              <img src={resultUrl} alt="result" className="w-64 h-64 object-contain rounded-xl border" />
            </div>
          )}
        </div>
      )}

      {state === "done" && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={download}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download
          </button>
          <button
            onClick={reset}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Try another
          </button>
        </div>
      )}

      {state === "error" && (
        <div className="mt-6 text-center">
          <p className="text-red-500 mb-4">{errorMsg}</p>
          <button onClick={reset} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
