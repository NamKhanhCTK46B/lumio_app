"use client";

/**
 * Bell icon button — hiển thị số thông báo chưa đọc.
 * Subscribe Supabase Realtime để cập nhật badge realtime.
 */

import { useEffect, useState } from "react";
import { BellIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function NotificationBell() {
  const [chuaDoc, setChuaDoc] = useState(0);

  useEffect(() => {
    const supabase = createClient();
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

  return (
    <button
      className="relative rounded-lg border border-transparent p-2 text-lm-fg-muted transition hover:bg-lm-bg-muted hover:text-lm-fg"
      onClick={() => setChuaDoc(0)}
      aria-label="Thông báo"
    >
      <BellIcon className="h-5 w-5" />
      {chuaDoc > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-lm-danger text-[10px] font-medium text-lm-fg-inverse">
          {chuaDoc > 9 ? "9+" : chuaDoc}
        </span>
      )}
    </button>
  );
}
