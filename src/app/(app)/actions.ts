"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Đăng xuất user hiện tại.
 *
 * Supabase signOut() xoá session phía server + revoke refresh token.
 * Cookie HTTP-only được clear bởi @supabase/ssr qua middleware.
 */
export async function dangXuatAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?info=" + encodeURIComponent("Bạn đã đăng xuất."));
}
