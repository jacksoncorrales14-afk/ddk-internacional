import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (no external deps)
// Uses a Map of IP -> { count, resetTime }
// Automatically cleans up expired entries

const rateLimit = (options: { interval: number; uniqueTokenPerInterval: number }) => {
  const tokenCache = new Map<string, { count: number; expiresAt: number }>();

  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of Array.from(tokenCache.entries())) {
      if (value.expiresAt < now) tokenCache.delete(key);
    }
  }, options.interval);

  return {
    check: (limit: number, token: string): { success: boolean; remaining: number } => {
      const now = Date.now();
      const record = tokenCache.get(token);

      if (!record || record.expiresAt < now) {
        tokenCache.set(token, { count: 1, expiresAt: now + options.interval });
        return { success: true, remaining: limit - 1 };
      }

      if (record.count >= limit) {
        return { success: false, remaining: 0 };
      }

      record.count++;
      return { success: true, remaining: limit - record.count };
    },
  };
};

export default rateLimit;

export const loginLimiter = rateLimit({ interval: 15 * 60 * 1000, uniqueTokenPerInterval: 500 }); // 15 min window
export const apiLimiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 500 }); // 1 min window
export const uploadLimiter = rateLimit({ interval: 60 * 1000, uniqueTokenPerInterval: 100 }); // 1 min window

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Intente de nuevo mas tarde." },
    { status: 429 }
  );
}
