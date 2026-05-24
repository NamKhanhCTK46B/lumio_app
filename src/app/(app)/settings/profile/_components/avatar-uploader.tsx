"use client";

import { useRef, useState, useTransition } from "react";
import { taiAvatarLenAction } from "../actions";

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
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const chu_dau = (ten_hien_thi?.[0] ?? "?").toUpperCase();
  const hienThi = preview ?? hientai_url;

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
      action={(fd) => start(async () => { await taiAvatarLenAction(fd); })}
      className="flex items-center gap-4"
    >
      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
        {hienThi ? (
          // eslint-disable-next-line @next/next/no-img-element -- Storage URL bên ngoài, không cần next/image optimization
          <img
            src={hienThi}
            alt="Ảnh đại diện"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-amber-100 text-2xl font-semibold text-amber-700">
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
          className="text-sm text-slate-600 file:mr-3 file:h-9 file:rounded-md file:border-0 file:bg-amber-500 file:px-3 file:text-sm file:font-medium file:text-white file:transition hover:file:bg-amber-600"
        />
        <button
          type="submit"
          disabled={pending || !preview}
          className="h-9 self-start rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Đang tải..." : "Tải lên"}
        </button>
        <span className="text-xs text-slate-500">PNG, JPEG, WEBP. Tối đa 5 MB.</span>
      </div>
    </form>
  );
}
