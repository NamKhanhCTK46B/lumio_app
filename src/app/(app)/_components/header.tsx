import Link from "next/link";
import { UserMenu } from "./user-menu";

/**
 * Header chung cho mọi page trong (app). Server Component — nhận
 * thông tin user qua prop từ (app)/layout (đã fetch sẵn).
 */
type Props = {
  email: string;
  ten_hien_thi: string | null;
  url_avatar: string | null;
};

export function Header({ email, ten_hien_thi, url_avatar }: Props) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-slate-900"
        >
          Lumio
        </Link>
        <UserMenu email={email} ten_hien_thi={ten_hien_thi} url_avatar={url_avatar} />
      </div>
    </header>
  );
}
