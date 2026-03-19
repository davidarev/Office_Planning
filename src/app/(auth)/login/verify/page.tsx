/**
 * Verify request page — shown after a magic link has been sent.
 * Informs the user to check their inbox.
 */
export default function VerifyRequestPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold">Revisa tu bandeja de entrada</h1>
        <p className="text-gray-600">
          Te hemos enviado un enlace de acceso a tu email. Haz clic en él para
          entrar en la aplicación.
        </p>
        <p className="text-sm text-gray-500">
          Si no lo encuentras, revisa la carpeta de spam.
        </p>
      </div>
    </main>
  );
}
