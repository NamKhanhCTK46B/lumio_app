"use client";

/**
 * Bell icon button — hiển thị số thông báo chưa đọc.
 * Subscribe Supabase Realtime để cập nhật badge realtime.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function NotificationBell() {
  const [chuaDoc, setChuaDoc] = useState(0);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel("thong_bao:me")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "thong_bao",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setChuaDoc((n) => n + 1);
          } else if (payload.eventType === "UPDATE") {
            // Có thể thông báo được đánh dấu đã đọc
            if (payload.new && (payload.new as { doc_luc?: string }).doc_luc) {
              setChuaDoc((n) => Math.max(0, n - 1));
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial count từ trang notifications
  useEffect(() => {
    if (open) {
      // Khi dropdown mở, update lại count
      setChuaDoc(0);
    }
  }, [open]);

  return (
    <button
      className="relative rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      onClick={() => setOpen((o) => !o)}
      aria-label="Thông báo"
    >
      <BellIcon className="h-5 w-5" />
      {chuaDoc > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
          {chuaDoc > 9 ? "9+" : chuaDoc}
        </span>
      )}
    </button>
  );
}
