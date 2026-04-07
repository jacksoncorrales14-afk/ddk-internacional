"use client";
import { Component, ReactNode } from "react";
import { errorTracker } from "@/lib/error-tracking";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    errorTracker.captureException(error, { action: "react_render" });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                Algo salio mal
              </h2>
              <p className="mt-2 text-gray-500">
                Por favor recarga la pagina.
              </p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="btn-primary mt-4"
              >
                Reintentar
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
