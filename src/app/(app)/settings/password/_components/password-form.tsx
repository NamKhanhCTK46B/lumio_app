'use client'

import { doiMatKhauAction } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionButton } from "@/components/app/action-button";

export function PasswordForm() {
  return (
    <form action={doiMatKhauAction} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="current_password">Mật khẩu hiện tại</Label>
        <Input
          id="current_password"
          type="password"
          name="current_password"
          required
          autoComplete="current-password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_password">Mật khẩu mới</Label>
        <Input
          id="new_password"
          type="password"
          name="new_password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
        />
        <p className="text-xs text-lm-fg-muted">
          Tối thiểu 8 ký tự, có chữ cái và số. Phải khác mật khẩu hiện tại.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new_password_confirm">Nhập lại mật khẩu mới</Label>
        <Input
          id="new_password_confirm"
          type="password"
          name="new_password_confirm"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
        />
      </div>

      <div className="flex justify-end">
        <ActionButton type="submit" loadingText="Đang đổi mật khẩu...">
          Đổi mật khẩu
        </ActionButton>
      </div>
    </form>
  );
}
