import { datLaiMatKhauAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ResetForm() {
  return (
    <form action={datLaiMatKhauAction} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="reset-password">Mật khẩu mới</Label>
        <Input
          id="reset-password"
          type="password"
          name="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
        />
        <p className="text-xs text-lm-fg-muted">
          Yêu cầu: tối thiểu 8 ký tự, có chữ cái và số.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-password-confirm">Nhập lại mật khẩu mới</Label>
        <Input
          id="reset-password-confirm"
          type="password"
          name="password_confirm"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" size="lg" className="mt-1 h-11">
        Đặt lại mật khẩu
      </Button>
    </form>
  );
}
