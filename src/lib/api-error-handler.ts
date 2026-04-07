import { NextRequest, NextResponse } from "next/server";
import { errorTracker } from "./error-tracking";

export function withErrorHandler(
  handler: (req: NextRequest, context?: Record<string, unknown>) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: Record<string, unknown>): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      errorTracker.captureException(error, {
        route: req.url,
        action: req.method,
      });

      const message =
        error instanceof Error ? error.message : "Error interno del servidor";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
