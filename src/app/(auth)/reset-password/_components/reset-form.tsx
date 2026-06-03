'use client'

import { datLaiMatKhauAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "../../_components/submit-button";

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
        <p className="text-xs text-slate-600 dark:text-slate-400">
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

      <SubmitButton loadingText="Đang đặt lại mật khẩu..." className="mt-1 h-11">
        Đặt lại mật khẩu
      </SubmitButton>
    </form>
  );
}
