export interface Env {
  REMOVE_BG_API_KEY: string;
  ALLOWED_ORIGIN: string; // e.g. https://your-site.pages.dev
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return corsResponse(new Response(null, { status: 204 }), env.ALLOWED_ORIGIN);
    }

    if (request.method !== "POST") {
      return corsResponse(new Response("Method not allowed", { status: 405 }), env.ALLOWED_ORIGIN);
    }

    const url = new URL(request.url);
    if (url.pathname !== "/remove-bg") {
      return corsResponse(new Response("Not found", { status: 404 }), env.ALLOWED_ORIGIN);
    }

    // Check origin
    const origin = request.headers.get("origin") || "";
    if (env.ALLOWED_ORIGIN && origin !== env.ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    try {
      const formData = await request.formData();
      const imageFile = formData.get("image_file");

      if (!imageFile || !(imageFile instanceof File)) {
        return corsResponse(new Response("Missing image_file", { status: 400 }), env.ALLOWED_ORIGIN);
      }

      // Forward to remove.bg
      const bgForm = new FormData();
      bgForm.append("image_file", imageFile);
      bgForm.append("size", "auto");

      const resp = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: {
          "X-Api-Key": env.REMOVE_BG_API_KEY,
        },
        body: bgForm,
      });

      if (!resp.ok) {
        const err = await resp.text();
        return corsResponse(new Response(err, { status: resp.status }), env.ALLOWED_ORIGIN);
      }

      const resultBuffer = await resp.arrayBuffer();
      return corsResponse(
        new Response(resultBuffer, {
          status: 200,
          headers: { "Content-Type": "image/png" },
        }),
        env.ALLOWED_ORIGIN
      );
    } catch (e) {
      return corsResponse(new Response("Internal error", { status: 500 }), env.ALLOWED_ORIGIN);
    }
  },
};

function corsResponse(response: Response, allowedOrigin: string): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", allowedOrigin || "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
