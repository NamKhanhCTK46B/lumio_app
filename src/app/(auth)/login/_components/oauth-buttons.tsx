"use client";

import { useTransition } from "react";
import { dangNhapOAuthAction } from "../actions";

/**
 * Hai button OAuth Google + Facebook. Disable khi action đang chạy
 * (transition) để tránh user click đôi gây 2 redirect liên tiếp.
 */
export function OAuthButtons() {
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { await dangNhapOAuthAction("google"); })}
        className="flex h-11 items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
      >
        <GoogleIcon />
        <span>Đăng nhập với Google</span>
      </button>

      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => { await dangNhapOAuthAction("facebook"); })}
        className="flex h-11 items-center justify-center gap-3 rounded-md bg-[#1877F2] px-4 text-sm font-medium text-white transition hover:bg-[#166FE5] disabled:opacity-50"
      >
        <FacebookIcon />
        <span>Đăng nhập với Facebook</span>
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09a6.61 6.61 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6 4.39 10.97 10.13 11.88v-8.4H7.08v-3.48h3.05V9.41c0-3.02 1.79-4.7 4.54-4.7 1.32 0 2.7.24 2.7.24v2.97h-1.52c-1.5 0-1.96.93-1.96 1.89v2.27h3.34l-.53 3.48h-2.8V24C19.61 23.04 24 18.07 24 12.07Z" />
    </svg>
  );
}
