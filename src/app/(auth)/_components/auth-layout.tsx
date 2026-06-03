import Image from "next/image";
import { ParticlesBackground } from "./particles-background";
import { AuthIllustration } from "./auth-illustration";

/**
 * Layout chung cho tất cả auth pages (login, signup, forgot-password, reset-password).
 *
 * Bao gồm:
 * - Warm pastel color scheme (peach, cream, lavender)
 * - Particles background (dots pattern + floating circles)
 * - Education-themed illustration
 * - Logo wordmark ở đầu card
 * - Error/info alerts
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
    <main className="relative flex min-h-screen items-center justify-center bg-[#FFF8F0] dark:bg-[#1A1410] px-4 py-10">
      {/* Particles background decoration */}
      <ParticlesBackground />

      {/* Radial glow decoration - warm peach */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,155,113,.15), transparent 60%)'
        }}
      />

      <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-[#FFE5D0] dark:border-[#4A3B2F] bg-white dark:bg-[#2D2520] p-8 sm:p-10 shadow-md">
        {/* Education illustration */}
        <AuthIllustration />
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
          <h1 className="text-2xl font-semibold text-[#3D2817] dark:text-[#F5E6D3]">
            {title}
          </h1>
          <p className="text-sm text-[#6B4E3D] dark:text-[#D4BBA0]">
            {description}
          </p>
        </header>

        {/* Error alert */}
        {error ? (
          <div
            role="alert"
            className="rounded-md border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
          >
            {decodeURIComponent(error)}
          </div>
        ) : null}

        {/* Info alert */}
        {info ? (
          <div
            role="status"
            className="rounded-md border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
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
