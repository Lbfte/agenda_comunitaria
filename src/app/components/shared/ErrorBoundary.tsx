"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 border border-red-500/20 bg-red-500/5 rounded-2xl w-full">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
            <AlertCircle className="text-red-500 w-6 h-6" />
          </div>
          <h2 className="text-[15px] font-semibold text-white mb-1">
            Falha ao renderizar componente
          </h2>
          <p className="text-[13px] text-zinc-400 mb-4 text-center max-w-[280px]">
            {this.state.error?.message || "Ocorreu um erro interno neste bloco."}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-zinc-900 border border-white/[0.04] text-white text-[12px] font-medium hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw size={14} />
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
