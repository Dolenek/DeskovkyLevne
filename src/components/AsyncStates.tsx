export const LoadingState = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-outline bg-surface/80 p-10 text-center text-muted shadow-card">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-outline border-t-primary" />
    {message ? <p className="text-sm text-muted">{message}</p> : null}
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
  <div className="rounded-3xl border border-accent/60 bg-[rgba(196,69,54,0.08)] p-10 text-center text-ink shadow-card">
    <p className="mb-4 font-semibold text-accent">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="rounded-full bg-primary px-6 py-2 font-semibold text-white transition hover:drop-shadow-glow"
    >
      {retryLabel}
    </button>
  </div>
);

export const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-3xl border border-outline bg-surface/80 p-10 text-center text-muted shadow-card">
    {message}
  </div>
);
