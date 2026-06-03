import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Lấy site URL cho email redirect và absolute URLs.
 *
 * Priority:
 *  1. NEXT_PUBLIC_SITE_URL (set trong Vercel/production)
 *  2. Fallback localhost cho local dev
 *
 * Không dựa vào headers origin vì có thể không đáng tin cậy trong proxy configs.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""); // Loại bỏ trailing slash
  }
  return "http://localhost:3000";
}
