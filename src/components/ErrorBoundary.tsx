import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-slate-800">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-red-200 max-w-4xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra lỗi hệ thống (Crash)</h1>
            <p className="mb-4">Hệ thống đã gặp một lỗi không mong muốn trong quá trình render giao diện.</p>
            
            <div className="bg-slate-100 p-4 rounded-lg overflow-auto max-h-64 mb-4">
              <h3 className="font-bold text-sm text-slate-700">Lỗi:</h3>
              <pre className="text-xs text-red-500 whitespace-pre-wrap">{this.state.error?.toString()}</pre>
            </div>

            {this.state.errorInfo && (
              <div className="bg-slate-100 p-4 rounded-lg overflow-auto max-h-96">
                <h3 className="font-bold text-sm text-slate-700">Stack Trace Component:</h3>
                <pre className="text-xs text-slate-600 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
              </div>
            )}

            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
