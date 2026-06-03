import Image from "next/image";

/**
 * Layout chung cho tất cả auth pages (login, signup, forgot-password, reset-password).
 *
 * Bao gồm:
 * - Radial glow decoration (amber subtle)
 * - Logo wordmark ở đầu card
 * - Error/info alerts
 * - Card với border amber và shadow
 * - Background màu paper từ design system
 */

type AuthLayoutProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  error?: string;
  info?: string;
};

export function AuthLayout({ title, description, children, error, info }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#FBF9F5] dark:bg-[#0E1626] px-4 py-10">
      {/* Radial glow decoration */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(232,163,61,.12), transparent 60%)'
        }}
      />

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-amber-100 dark:border-amber-900/20 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-md">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logo-wordmark.svg"
            alt="Lumio"
            width={120}
            height={32}
            className="h-8 w-auto dark:invert"
            priority
          />
        </div>

        {/* Header */}
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </header>

        {/* Error alert */}
        {error ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400"
          >
            {decodeURIComponent(error)}
          </div>
        ) : null}

        {/* Info alert */}
        {info ? (
          <div
            role="status"
            className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/10 dark:text-emerald-400"
          >
            {decodeURIComponent(info)}
          </div>
        ) : null}

        {/* Content */}
        {children}
      </div>
    </main>
  );
}
