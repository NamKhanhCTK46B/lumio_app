import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

type PageLoadingProps = {
  variant?: "page" | "content";
  label?: string;
};

const SKELETON_ROWS = 3;
const SKELETON_CARDS = 4;

/**
 * Loading UI dùng chung cho route-level Suspense.
 *
 * @param variant  `page` phủ toàn màn hình, `content` nằm trong app shell.
 * @param label  Nội dung trạng thái ngắn gọn cho screen reader và UI.
 */
export function PageLoading({
  variant = "page",
  label = "Đang tải",
}: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-5",
        variant === "page"
          ? "min-h-screen bg-lm-bg px-4 py-8 sm:px-6 lg:px-8"
          : "min-h-[calc(100vh-8rem)]",
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-lm-primary-soft text-lm-primary">
            <Loader2Icon className="h-5 w-5 animate-spin" />
          </span>
          <div>
            <p className="text-sm font-semibold text-lm-fg">{label}</p>
            <p className="text-xs text-lm-fg-muted">
              Lumio đang chuẩn bị dữ liệu cho bạn.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="h-4 w-full max-w-xl" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: SKELETON_CARDS }).map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-lm-border bg-lm-bg-elev-1 p-4"
            >
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="mt-4 h-8 w-20" />
              <SkeletonBlock className="mt-3 h-3 w-32" />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-lm-border bg-lm-bg-elev-1 p-4">
          <div className="space-y-3">
            {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <SkeletonBlock className="h-10 w-10 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-2/3" />
                  <SkeletonBlock className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-lm-bg-muted",
        className,
      )}
    />
  );
}
