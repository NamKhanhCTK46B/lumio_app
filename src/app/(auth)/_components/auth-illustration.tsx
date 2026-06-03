/**
 * Education-themed illustration cho auth pages.
 *
 * Inline SVG với books, speech bubbles, và learning elements.
 * Ẩn trên mobile, hiện trên desktop ở góc card.
 */
export function AuthIllustration() {
  return (
    <div className="hidden md:block absolute -top-12 -right-12 w-40 h-40 opacity-20 dark:opacity-10">
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Books stack */}
        <rect
          x="40"
          y="120"
          width="60"
          height="15"
          rx="2"
          fill="#FF9B71"
          transform="rotate(-5 70 127.5)"
        />
        <rect
          x="40"
          y="105"
          width="60"
          height="15"
          rx="2"
          fill="#FFD97D"
          transform="rotate(-3 70 112.5)"
        />
        <rect
          x="40"
          y="90"
          width="60"
          height="15"
          rx="2"
          fill="#C4A1FF"
          transform="rotate(2 70 97.5)"
        />

        {/* Speech bubble */}
        <circle cx="140" cy="60" r="30" fill="#FF9B71" opacity="0.6" />
        <path
          d="M 135 75 L 130 85 L 140 78 Z"
          fill="#FF9B71"
          opacity="0.6"
        />
        <text
          x="140"
          y="65"
          textAnchor="middle"
          fontSize="18"
          fontWeight="600"
          fill="#FFF"
        >
          ABC
        </text>

        {/* Pencil */}
        <rect
          x="110"
          y="130"
          width="8"
          height="50"
          rx="4"
          fill="#FFD97D"
          transform="rotate(45 114 155)"
        />
        <path
          d="M 148 168 L 152 172 L 144 164 Z"
          fill="#3D2817"
        />

        {/* Stars/sparkles */}
        <circle cx="30" cy="40" r="3" fill="#C4A1FF" />
        <circle cx="170" cy="120" r="2" fill="#FFD97D" />
        <circle cx="160" cy="30" r="2.5" fill="#FF9B71" />
      </svg>
    </div>
  )
}
