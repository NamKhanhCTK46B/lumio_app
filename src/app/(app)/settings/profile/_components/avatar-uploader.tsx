"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { capNhatAvatarUrlAction } from "../actions";

/**
 * Avatar uploader — Client Component để preview ảnh trước khi upload.
 *
 * Flow:
 *  1. User chọn file → onChange tạo blob URL preview.
 *  2. Submit form → FormData lên Server Action `taiAvatarLenAction`.
 *  3. Action validate MIME/size + upload Storage + update ho_so.url_avatar.
 *  4. revalidatePath() làm trang server-side fetch lại url_avatar mới.
 */
type Props = {
  hientai_url: string | null;
  ten_hien_thi: string;
};

export function AvatarUploader({ hientai_url, ten_hien_thi }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const chu_dau = (ten_hien_thi?.[0] ?? "?").toUpperCase();
  const hienThi = preview ?? hientai_url;

  async function onUpload() {
    setError(null);
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError("Vui lòng chọn ảnh.");
      return;
    }

    const hopLe = ["image/png", "image/jpeg", "image/webp"].includes(file.type);
    if (!hopLe) {
      setError("Chỉ hỗ trợ định dạng PNG / JPEG / WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh quá lớn (tối đa 5 MB).");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Chưa đăng nhập.");
      return;
    }

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
      setError("Tải ảnh thất bại: " + uploadError.message);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    await capNhatAvatarUrlAction(publicUrl);
  }

  function khiChonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setPreview(null);
      return;
    }
    // Tạo blob URL để preview ngay — không upload đến khi user submit.
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          await onUpload();
        });
      }}
      className="flex items-center gap-4"
    >
      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-border bg-muted">
        {hienThi ? (
          // eslint-disable-next-line @next/next/no-img-element -- Storage URL bên ngoài, không cần next/image optimization
          <img
            src={hienThi}
            alt="Ảnh đại diện"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-lm-primary-soft text-2xl font-semibold text-lm-primary-ink">
            {chu_dau}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp"
          onChange={khiChonFile}
          className="text-sm text-muted-foreground file:mr-3 file:h-9 file:rounded-md file:border-0 file:bg-primary file:px-3 file:text-sm file:font-medium file:text-primary-foreground file:transition hover:file:bg-lm-primary-hover"
        />
        <Button
          type="submit"
          disabled={pending || !preview}
          className="h-9 self-start px-4"
        >
          {pending ? "Đang tải..." : "Tải lên"}
        </Button>
        <span className="text-xs text-muted-foreground">
          PNG, JPEG, WEBP. Tối đa 5 MB.
        </span>
        {error ? <span className="text-xs text-lm-danger">{error}</span> : null}
      </div>
    </form>
  );
}
