/**
 * TransitOps brand logo — premium wordmark with a right-facing truck.
 *
 * "Transit" in currentColor + "Ops" in gold. A modern minimal delivery truck
 * (cab on the RIGHT, facing right) sits before the wordmark. Uses currentColor
 * so it adapts to dark (white) and light (dark) backgrounds.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 232 40"
      className={className}
      role="img"
      aria-label="TransitOps"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Right-facing truck: box trailer on the left, cab + nose on the right */}
      <g transform="translate(0,6)">
        <rect x="1" y="4" width="20" height="15" rx="2.5" stroke="currentColor" strokeWidth="2.2" />
        {/* cab */}
        <path
          d="M21 8 h6.5 l4.5 4.5 V19 h-11 Z"
          stroke="#F59E0B"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* wheels */}
        <circle cx="9" cy="22" r="3" fill="currentColor" />
        <circle cx="26" cy="22" r="3" fill="#F59E0B" />
      </g>

      <text
        x="42"
        y="28"
        fontFamily="'Segoe UI', system-ui, -apple-system, sans-serif"
        fontSize="27"
        fontWeight="700"
        letterSpacing="-0.6"
      >
        <tspan fill="currentColor">Transit</tspan><tspan fill="#F59E0B">Ops</tspan>
      </text>
    </svg>
  );
}
