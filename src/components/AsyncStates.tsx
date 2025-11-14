export const LoadingState = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-slate-300">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-primary" />
    {message ? <p className="text-sm text-slate-400">{message}</p> : null}
  </div>
);

export const ErrorState = ({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) => (
  <div className="rounded-3xl border border-rose-900 bg-rose-950/40 p-10 text-center text-rose-200">
    <p className="mb-4 font-semibold">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="rounded-full bg-primary px-6 py-2 font-medium text-white transition hover:drop-shadow-glow"
    >
      {retryLabel}
    </button>
  </div>
);

export const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-10 text-center text-slate-300">
    {message}
  </div>
);
