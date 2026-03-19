import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const DAILY_FREE_LIMIT = 3;
const COOKIE_NAME = "bg_usage";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function parseUsage(cookie: string | undefined): { date: string; count: number } {
  try {
    if (!cookie) return { date: getTodayKey(), count: 0 };
    const parsed = JSON.parse(atob(cookie));
    if (parsed.date !== getTodayKey()) return { date: getTodayKey(), count: 0 };
    return parsed;
  } catch {
    return { date: getTodayKey(), count: 0 };
  }
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const usage = parseUsage(cookie);
  const remaining = Math.max(0, DAILY_FREE_LIMIT - usage.count);
  return NextResponse.json({ remaining, limit: DAILY_FREE_LIMIT, used: usage.count });
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const usage = parseUsage(cookie);

  if (usage.count >= DAILY_FREE_LIMIT) {
    return NextResponse.json({ error: "Daily limit reached", remaining: 0 }, { status: 429 });
  }

  usage.count += 1;
  const remaining = DAILY_FREE_LIMIT - usage.count;

  const res = NextResponse.json({ remaining, limit: DAILY_FREE_LIMIT, used: usage.count });
  res.cookies.set(COOKIE_NAME, btoa(JSON.stringify(usage)), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 2,
    path: "/",
  });
  return res;
}
