interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorDisplay = ({ message, onRetry }: ErrorDisplayProps) => {
  return (
    <div className="rounded-2xl bg-red-50 border border-red-100 p-4 shadow-sm">
      <div className="flex gap-3">
        <svg
          className="h-5 w-5 text-red-500 shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800">Error Occurred</h3>
          <div className="mt-1 text-sm text-red-700 font-medium">{message}</div>
          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-200 transition-colors shadow-sm"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
