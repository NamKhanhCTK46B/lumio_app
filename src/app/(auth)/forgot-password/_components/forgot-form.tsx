import { quenMatKhauAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ForgotForm() {
  return (
    <form action={quenMatKhauAction} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email tài khoản</Label>
        <Input
          id="forgot-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="ban@email.com"
        />
      </div>

      <Button type="submit" size="lg" className="h-11">
        Gửi liên kết đặt lại
      </Button>
    </form>
  );
}
