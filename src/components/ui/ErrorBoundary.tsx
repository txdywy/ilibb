import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          backgroundColor: '#020617', 
          color: '#f43f5e', 
          height: '100vh', 
          fontFamily: 'monospace',
          overflow: 'auto'
        }}>
          <h1 style={{ fontSize: '24px' }}>⚠️ 程序运行中发生了错误</h1>
          <p style={{ color: '#94a3b8' }}>这可能是由于高德地图脚本冲突或数据格式错误导致的。</p>
          <div style={{ 
            backgroundColor: 'rgba(244, 63, 94, 0.1)', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #f43f5e',
            marginTop: '20px'
          }}>
            <strong>Error:</strong> {this.state.error?.message}
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#f43f5e',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            重试页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
