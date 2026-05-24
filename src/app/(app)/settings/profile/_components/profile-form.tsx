import { capNhatHoSoAction } from "../actions";

/**
 * Form chỉnh sửa hồ sơ. Server Component — submit qua Server Action.
 * Pre-fill từ `hoSo` truyền vào prop.
 *
 * Trường `trinh_do_cefr` KHÔNG cho user tự sửa — chỉ set bởi placement
 * test (UC1) hoặc dashboard. Show readonly cho minh bạch.
 */
type Props = {
  hoSo: {
    ten_hien_thi: string | null;
    so_dien_thoai: string | null;
    trinh_do_cefr: string | null;
    ngon_ngu_giao_dien: string | null;
    chu_de_giao_dien: string | null;
    phut_moi_ngay: number | null;
    mui_gio: string | null;
  };
};

export function ProfileForm({ hoSo }: Props) {
  return (
    <form action={capNhatHoSoAction} className="flex flex-col gap-4">
      <FieldRow label="Tên hiển thị" htmlFor="ten_hien_thi" required>
        <input
          id="ten_hien_thi"
          type="text"
          name="ten_hien_thi"
          defaultValue={hoSo.ten_hien_thi ?? ""}
          required
          maxLength={64}
          autoComplete="name"
          className={inputCls}
        />
      </FieldRow>

      <FieldRow label="Số điện thoại" htmlFor="so_dien_thoai">
        <input
          id="so_dien_thoai"
          type="tel"
          name="so_dien_thoai"
          defaultValue={hoSo.so_dien_thoai ?? ""}
          maxLength={20}
          autoComplete="tel"
          placeholder="+84 9xx xxx xxx"
          className={inputCls}
        />
      </FieldRow>

      <FieldRow label="Trình độ hiện tại" hint="Cập nhật bởi placement test">
        <input
          type="text"
          value={hoSo.trinh_do_cefr ?? "—"}
          readOnly
          className={`${inputCls} cursor-not-allowed bg-slate-100`}
        />
      </FieldRow>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FieldRow label="Ngôn ngữ giao diện" htmlFor="ngon_ngu_giao_dien">
          <select
            id="ngon_ngu_giao_dien"
            name="ngon_ngu_giao_dien"
            defaultValue={hoSo.ngon_ngu_giao_dien ?? "vi"}
            className={inputCls}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </FieldRow>

        <FieldRow label="Giao diện" htmlFor="chu_de_giao_dien">
          <select
            id="chu_de_giao_dien"
            name="chu_de_giao_dien"
            defaultValue={hoSo.chu_de_giao_dien ?? "system"}
            className={inputCls}
          >
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
            <option value="system">Theo hệ thống</option>
          </select>
        </FieldRow>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FieldRow
          label="Mục tiêu mỗi ngày"
          htmlFor="phut_moi_ngay"
          hint="Số phút bạn muốn học mỗi ngày (0–240)"
        >
          <input
            id="phut_moi_ngay"
            type="number"
            name="phut_moi_ngay"
            defaultValue={hoSo.phut_moi_ngay ?? 15}
            min={0}
            max={240}
            step={5}
            className={inputCls}
          />
        </FieldRow>

        <FieldRow label="Múi giờ" htmlFor="mui_gio" hint="Tên múi giờ IANA">
          <input
            id="mui_gio"
            type="text"
            name="mui_gio"
            defaultValue={hoSo.mui_gio ?? "Asia/Ho_Chi_Minh"}
            maxLength={64}
            placeholder="Asia/Ho_Chi_Minh"
            className={inputCls}
          />
        </FieldRow>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="h-10 rounded-md bg-amber-500 px-6 text-sm font-medium text-white transition hover:bg-amber-600"
        >
          Lưu thay đổi
        </button>
      </div>
    </form>
  );
}

// Tailwind classes dùng chung — gom 1 chỗ để đồng bộ.
const inputCls =
  "h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200";

function FieldRow({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm">
      <span className="mb-1 block text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
