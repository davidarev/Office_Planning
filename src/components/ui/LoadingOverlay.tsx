"use client";

interface LoadingOverlayProps {
  message?: string;
}

/**
 * Centered spinner overlay for async loading states.
 *
 * @param message - Optional label shown below the spinner.
 */
export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={message ?? "Cargando…"}
      className="flex flex-col items-center justify-center gap-3 py-12"
    >
      <span
        className="block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"
        aria-hidden="true"
      />
      {message && (
        <p className="text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
}
