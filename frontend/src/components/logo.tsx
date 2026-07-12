/**
 * TransitOps brand logo.
 *
 * Wordmark "TransitOps" with a gold "O" accent and a compact coach/bus glyph
 * that sits directly after the text on the same baseline. Uses `currentColor`
 * so it renders correctly on the dark auth panel (white) and the light
 * sidebar (dark). The viewBox is fitted so it never floats or misaligns.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 226 36"
      className={className}
      role="img"
      aria-label="TransitOps"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <text
        x="0"
        y="27"
        fontFamily="'Segoe UI', system-ui, -apple-system, sans-serif"
        fontSize="28"
        fontWeight="700"
        letterSpacing="-0.5"
        fill="currentColor"
      >
        Transit<tspan fill="#C79A3F">O</tspan>ps
      </text>

      {/* Coach glyph, baseline-aligned with the text */}
      <g
        transform="translate(184,8)"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="2" width="36" height="16" rx="4" />
        <line x1="1" y1="9" x2="37" y2="9" />
        <line x1="13" y1="2" x2="13" y2="9" />
        <circle cx="11" cy="20" r="2.6" fill="currentColor" stroke="none" />
        <circle cx="28" cy="20" r="2.6" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
