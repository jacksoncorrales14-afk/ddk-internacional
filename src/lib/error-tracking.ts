// Error tracking abstraction - can be connected to Sentry, LogRocket, etc.

interface ErrorContext {
  userId?: string;
  route?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

class ErrorTracker {
  private static instance: ErrorTracker;

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  captureException(error: Error | unknown, context?: ErrorContext): void {
    const err = error instanceof Error ? error : new Error(String(error));

    // Log to console in development
    console.error('[ErrorTracker]', {
      message: err.message,
      stack: err.stack,
      ...context,
      timestamp: new Date().toISOString(),
    });

    // TODO: Send to Sentry/external service when configured
    // if (process.env.SENTRY_DSN) { Sentry.captureException(err, { extra: context }); }
  }

  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: ErrorContext
  ): void {
    console.log(`[ErrorTracker][${level}]`, message, context || '');
    // TODO: Send to external service
  }
}

export const errorTracker = ErrorTracker.getInstance();
