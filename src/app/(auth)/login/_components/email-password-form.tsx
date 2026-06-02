import { dangNhapEmailAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function EmailPasswordForm() {
  return (
    <form action={dangNhapEmailAction} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="ban@email.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Mật khẩu</Label>
        <Input
          id="login-password"
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" size="lg" className="mt-1 h-11">
        Đăng nhập
      </Button>
    </form>
  );
}
