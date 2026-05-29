"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CapNhatHoSoSchema } from "@/lib/schemas/ho_so";
import { hoSoRepo } from "@/lib/repositories/ho_so.repo";

/**
 * Cập nhật các trường hồ sơ. Tách riêng với upload avatar (action khác)
 * vì avatar dùng FormData kèm File, payload upsize không cần thiết khi
 * user chỉ đổi tên hiển thị.
 */
export async function capNhatHoSoAction(formData: FormData): Promise<void> {
  const parsed = CapNhatHoSoSchema.safeParse({
    ten_hien_thi: formData.get("ten_hien_thi"),
    so_dien_thoai: formData.get("so_dien_thoai"),
    ngon_ngu_giao_dien: formData.get("ngon_ngu_giao_dien"),
    chu_de_giao_dien: formData.get("chu_de_giao_dien"),
    phut_moi_ngay: formData.get("phut_moi_ngay"),
    mui_gio: formData.get("mui_gio"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    redirect(`/settings/profile?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Chưa đăng nhập"); // (app)/layout đã redirect — defensive
  }

  await hoSoRepo.capNhat(supabase, user.id, parsed.data);

  revalidatePath("/settings/profile");
  redirect("/settings/profile?ok=" + encodeURIComponent("Đã lưu thay đổi."));
}

/**
 * Upload ảnh đại diện lên Storage bucket `avatars`, path
 * `<userId>/avatar.<ext>`. RLS owner-write (migration 12) enforce:
 * chỉ owner upload được vào folder mang tên user_id của họ.
 *
 * Sau upload thành công, cập nhật `ho_so.url_avatar` để các nơi khác
 * (header, dashboard) hiển thị avatar mới.
 */
const MIME_HOP_LE = new Set(["image/png", "image/jpeg", "image/webp"]);
const KICH_THUOC_TOI_DA = 5 * 1024 * 1024; // 5 MB — khớp file_size_limit bucket

export async function taiAvatarLenAction(formData: FormData): Promise<void> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    redirect(
      "/settings/profile?error=" + encodeURIComponent("Vui lòng chọn ảnh."),
    );
  }

  if (!MIME_HOP_LE.has(file.type)) {
    redirect(
      "/settings/profile?error=" +
        encodeURIComponent("Chỉ hỗ trợ định dạng PNG / JPEG / WEBP."),
    );
  }

  if (file.size > KICH_THUOC_TOI_DA) {
    redirect(
      "/settings/profile?error=" +
        encodeURIComponent("Ảnh quá lớn (tối đa 5 MB)."),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Chưa đăng nhập");

  // Trích extension từ MIME — đặt tên cố định "avatar.<ext>" + upsert
  // để mỗi user chỉ giữ 1 file avatar (đỡ rác Storage).
  const duoi =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${user.id}/avatar.${duoi}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    redirect(
      "/settings/profile?error=" +
        encodeURIComponent("Tải ảnh thất bại: " + uploadError.message),
    );
  }

  // Append timestamp để CDN/browser cache không show ảnh cũ sau upsert.
  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  await hoSoRepo.capNhatAvatar(supabase, user.id, publicUrl);

  revalidatePath("/settings/profile");
  redirect(
    "/settings/profile?ok=" + encodeURIComponent("Đã cập nhật ảnh đại diện."),
  );
}

/**
 * Cập nhật url_avatar sau khi upload client-side.
 */
export async function capNhatAvatarUrlAction(url: string): Promise<void> {
  if (!url) {
    redirect(
      "/settings/profile?error=" + encodeURIComponent("URL ảnh không hợp lệ."),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Chưa đăng nhập");

  await hoSoRepo.capNhatAvatar(supabase, user.id, url);

  revalidatePath("/settings/profile");
  redirect(
    "/settings/profile?ok=" + encodeURIComponent("Đã cập nhật ảnh đại diện."),
  );
}
