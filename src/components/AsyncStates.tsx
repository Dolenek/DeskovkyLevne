export const LoadingState = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line bg-white p-10 text-center text-muted shadow-sm">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-primary" />
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
  <div className="rounded-lg border border-rose-200 bg-rose-50 p-10 text-center text-rose-700">
    <p className="mb-4 font-semibold">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="rounded-lg bg-primary px-6 py-2 font-bold text-white transition hover:bg-emerald-700"
    >
      {retryLabel}
    </button>
  </div>
);

export const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-line bg-white p-10 text-center text-muted shadow-sm">
    {message}
  </div>
);
