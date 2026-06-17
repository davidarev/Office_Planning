"use client";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}

/**
 * Error banner with an optional "Reintentar" button.
 *
 * Always displays `message` as-is — callers must pass a user-friendly string,
 * not a raw server/technical error.
 *
 * @param message  - User-facing error text.
 * @param onRetry  - Callback invoked when the user clicks "Reintentar".
 * @param retrying - When true, the retry button is disabled to prevent double-clicks.
 */
export function ErrorMessage({ message, onRetry, retrying = false }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center"
    >
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
