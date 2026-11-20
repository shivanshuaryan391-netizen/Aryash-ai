import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AiErrorBannerProps {
  message: string;
  code?: string;
  onRetry?: () => void;
}

export function AiErrorBanner({ message, code, onRetry }: AiErrorBannerProps) {
  const isMissingKey = code === 'MISSING_API_KEY';

  return (
    <div
      role="alert"
      className="rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3.5 text-sm text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-amber-100">
            {isMissingKey ? 'Gemini API Key Configuration Required' : 'AI Request Could Not Complete'}
          </p>
          <p className="text-xs text-amber-200/85 leading-relaxed">{message}</p>
          {isMissingKey && (
            <p className="text-xs text-amber-200/70">
              All local calculators, Pomodoro timer, task planner, habit tracker, and local progress storage continue working without an API key.
            </p>
          )}
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
