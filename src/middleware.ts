import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Rate limiter edge-safe ───────────────────────────────────
// Usa Map global en el proceso del servidor. En instancias
// tradicionales (Render, VPS) persiste entre requests. En entornos
// serverless frios puede reiniciarse, pero actua como proteccion
// base contra rafagas desde una misma IP.
type Bucket = { count: number; expiresAt: number };
const rateBuckets = new Map<string, Bucket>();

// Limpieza periodica para no fugar memoria (solo si el runtime
// lo soporta; en Edge strict puede no ejecutarse, pero el chequeo
// de expiracion se hace siempre al leer el bucket).
try {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of Array.from(rateBuckets.entries())) {
      if (bucket.expiresAt < now) rateBuckets.delete(key);
    }
  }, 5 * 60 * 1000);
} catch {
  // Runtime sin setInterval: no pasa nada, la limpieza por lectura basta
}

const WINDOW_MS = 60 * 1000; // 1 minuto

// Limites por tipo de ruta. Se eligen generosamente para no estorbar
// al uso legitimo y solo frenar abuso masivo.
function limiteParaRuta(pathname: string): number {
  // Endpoint publico de aplicacion (incluye uploads grandes)
  if (pathname === "/api/candidatos") return 20;
  // Autenticacion / activacion / webauthn: mas estricto contra brute force
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/activar") ||
    pathname.startsWith("/api/webauthn")
  ) {
    return 30;
  }
  // Endpoints admin/trabajador autenticados: limite generoso
  return 120;
}

function checkRateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || bucket.expiresAt < now) {
    rateBuckets.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return true;
  }

  if (bucket.count >= max) {
    return false;
  }

  bucket.count++;
  return true;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// ─── Middleware principal ─────────────────────────────────────
export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;

    // Rate-limit global para /api/*
    if (pathname.startsWith("/api/")) {
      const ip = getIp(req);
      const max = limiteParaRuta(pathname);
      // Key por IP + categoria, para que un burst en /api/candidatos no
      // consuma el presupuesto de /api/admin/*
      const bucketKey = `${ip}:${pathname.startsWith("/api/admin") ? "admin" : pathname.split("/").slice(0, 3).join("/")}`;
      if (!checkRateLimit(bucketKey, max)) {
        return NextResponse.json(
          { error: "Demasiadas solicitudes. Intente de nuevo mas tarde." },
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
      return NextResponse.next();
    }

    // Auth por rol para rutas protegidas
    const token = req.nextauth.token;
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/trabajador") && token?.role !== "trabajador") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // /api/* no requiere token a nivel middleware (cada route lo valida)
        if (pathname.startsWith("/api/")) return true;
        // /admin y /trabajador requieren token
        if (
          pathname.startsWith("/admin") ||
          pathname.startsWith("/trabajador")
        ) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/trabajador/:path*", "/api/:path*"],
};
