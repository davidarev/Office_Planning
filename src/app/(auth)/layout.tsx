/**
 * Layout for authentication pages (login, verify, error).
 * Minimal layout without navigation — users aren't authenticated yet.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
