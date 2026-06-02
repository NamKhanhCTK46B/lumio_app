import { capNhatHoSoAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

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
      <div className="space-y-2">
        <Label htmlFor="ten_hien_thi">
          Tên hiển thị
          <span className="ml-0.5 text-lm-danger">*</span>
        </Label>
        <Input
          id="ten_hien_thi"
          type="text"
          name="ten_hien_thi"
          defaultValue={hoSo.ten_hien_thi ?? ""}
          required
          maxLength={64}
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="so_dien_thoai">Số điện thoại</Label>
        <Input
          id="so_dien_thoai"
          type="tel"
          name="so_dien_thoai"
          defaultValue={hoSo.so_dien_thoai ?? ""}
          maxLength={20}
          autoComplete="tel"
          placeholder="+84 9xx xxx xxx"
        />
      </div>

      <div className="space-y-2">
        <Label>Trình độ hiện tại</Label>
        <Input
          type="text"
          value={hoSo.trinh_do_cefr ?? "—"}
          readOnly
          disabled
        />
        <p className="text-xs text-lm-fg-muted">Cập nhật bởi placement test</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ngon_ngu_giao_dien">Ngôn ngữ giao diện</Label>
          <NativeSelect
            id="ngon_ngu_giao_dien"
            name="ngon_ngu_giao_dien"
            defaultValue={hoSo.ngon_ngu_giao_dien ?? "vi"}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chu_de_giao_dien">Giao diện</Label>
          <NativeSelect
            id="chu_de_giao_dien"
            name="chu_de_giao_dien"
            defaultValue={hoSo.chu_de_giao_dien ?? "system"}
          >
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
            <option value="system">Theo hệ thống</option>
          </NativeSelect>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phut_moi_ngay">Mục tiêu mỗi ngày</Label>
          <Input
            id="phut_moi_ngay"
            type="number"
            name="phut_moi_ngay"
            defaultValue={hoSo.phut_moi_ngay ?? 15}
            min={0}
            max={240}
            step={5}
          />
          <p className="text-xs text-lm-fg-muted">Số phút bạn muốn học mỗi ngày (0–240)</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mui_gio">Múi giờ</Label>
          <Input
            id="mui_gio"
            type="text"
            name="mui_gio"
            defaultValue={hoSo.mui_gio ?? "Asia/Ho_Chi_Minh"}
            maxLength={64}
            placeholder="Asia/Ho_Chi_Minh"
          />
          <p className="text-xs text-lm-fg-muted">Tên múi giờ IANA</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit">Lưu thay đổi</Button>
      </div>
    </form>
  );
}
