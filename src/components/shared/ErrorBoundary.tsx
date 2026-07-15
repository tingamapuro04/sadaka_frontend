import { Component, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(): void {
    // Errors are isolated at route level. Logging goes to monitoring when integrated.
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return <div className="p-8 text-red-700">Something went wrong. Please refresh.</div>;
    }

    return this.props.children;
  }
}
