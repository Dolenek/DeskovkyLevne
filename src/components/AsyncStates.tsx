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
