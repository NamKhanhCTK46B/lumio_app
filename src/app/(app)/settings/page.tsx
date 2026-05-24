import { redirect } from "next/navigation";

/** /settings → mặc định chuyển tới /settings/profile. */
export default function SettingsIndexPage() {
  redirect("/settings/profile");
}
