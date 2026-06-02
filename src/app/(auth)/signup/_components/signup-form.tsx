import { dangKyAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  return (
    <form action={dangKyAction} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Tên hiển thị</Label>
        <Input
          id="signup-name"
          type="text"
          name="ten_hien_thi"
          required
          maxLength={64}
          autoComplete="name"
          placeholder="Vd. Nguyễn Văn A"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="ban@email.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Mật khẩu</Label>
        <Input
          id="signup-password"
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
        <Label htmlFor="signup-password-confirm">Nhập lại mật khẩu</Label>
        <Input
          id="signup-password-confirm"
          type="password"
          name="password_confirm"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu vừa rồi"
        />
      </div>

      <Button type="submit" size="lg" className="mt-1 h-11">
        Tạo tài khoản
      </Button>
    </form>
  );
}
