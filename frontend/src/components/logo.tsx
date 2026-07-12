/**
 * TransitOps brand logo.
 *
 * Wordmark "TransitOps" with a gold "O" accent and a coach/bus glyph.
 * The text uses `currentColor` so it renders correctly on both the dark
 * auth panel (white) and the light sidebar (dark).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 248 44"
      className={className}
      role="img"
      aria-label="TransitOps"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="0"
        y="32"
        fontFamily="'Segoe UI', system-ui, -apple-system, sans-serif"
        fontSize="32"
        fontWeight="700"
        letterSpacing="-1"
        fill="currentColor"
      >
        Transit<tspan fill="#C79A3F">O</tspan>ps
      </text>

      {/* Coach / bus glyph */}
      <g
        transform="translate(198,9)"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      >
        <path d="M2 4 h30 a6 6 0 0 1 6 6 v10 a2 2 0 0 1 -2 2 h-4" />
        <path d="M2 22 h22" />
        <path d="M2 4 v18" />
        <path d="M2 12 h36" />
        <circle cx="10" cy="24" r="3.2" fill="currentColor" stroke="none" />
        <circle cx="30" cy="24" r="3.2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
