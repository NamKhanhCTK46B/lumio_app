/**
 * Stepper hiển thị tiến trình onboarding. Server Component thuần. Truyền
 * `current` (1-4) để highlight bước đang ở.
 */

const BUOC = [
  { id: 1, label: "Đánh giá" },
  { id: 2, label: "Mục tiêu" },
  { id: 3, label: "Sở thích" },
];

export function OnboardingSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2 text-xs">
      {BUOC.map((b, i) => {
        const active = b.id === current;
        const done = b.id < current;
        return (
          <li key={b.id} className="flex items-center gap-2">
            <span
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full font-medium",
                active && "bg-amber-500 text-white",
                done && "bg-amber-200 text-amber-900",
                !active && !done && "bg-slate-200 text-slate-500",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {b.id}
            </span>
            <span
              className={
                active ? "font-semibold text-slate-900" : "text-slate-500"
              }
            >
              {b.label}
            </span>
            {i < BUOC.length - 1 && (
              <span className="mx-1 h-px w-6 bg-slate-300" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
