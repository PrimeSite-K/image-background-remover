import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "No image data" }, { status: 400 });
    }

    const binaryStr = atob(imageBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType || "image/jpeg" });

    const body = new FormData();
    body.append("image_file", blob, "image.jpg");
    body.append("size", "auto");

    const resp = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": REMOVE_BG_API_KEY },
      body,
    });

    if (!resp.ok) {
      const err = await resp.text();
      return NextResponse.json({ error: err }, { status: resp.status });
    }

    const resultBuffer = await resp.arrayBuffer();
    const resultBytes = new Uint8Array(resultBuffer);
    let binary = "";
    for (let i = 0; i < resultBytes.length; i++) {
      binary += String.fromCharCode(resultBytes[i]);
    }
    const resultBase64 = btoa(binary);

    return NextResponse.json({ resultBase64 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
