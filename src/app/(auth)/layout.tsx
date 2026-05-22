import type { ReactNode } from "react";

/**
 * Layout cho route group (auth): login, signup, reset password.
 * Tối giản — không header / sidebar, full-bleed center.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
