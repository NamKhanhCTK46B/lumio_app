'use client'

import { quenMatKhauAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "../../_components/submit-button";

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

      <SubmitButton loadingText="Đang gửi email..." className="h-11">
        Gửi liên kết đặt lại
      </SubmitButton>
    </form>
  );
}
