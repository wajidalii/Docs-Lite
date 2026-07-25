// Empty-state motif: three stacked document cards, the front one iris-tinted.
export function EmptyMotif() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden style={{ margin: '0 auto', display: 'block' }}>
      <g transform="rotate(-7 60 48)">
        <rect x="30" y="10" width="76" height="80" rx="8" fill="#ffffff" stroke="#e4e7eb" />
      </g>
      <g transform="rotate(6 60 48)">
        <rect x="14" y="10" width="76" height="80" rx="8" fill="#ffffff" stroke="#e4e7eb" />
      </g>
      <g>
        <rect x="22" y="8" width="76" height="80" rx="8" fill="#f0f0fe" stroke="#d5d5f7" />
        <path d="M34 30h40" stroke="#cbcbf0" strokeWidth="3" strokeLinecap="round" />
        <path d="M34 43h52" stroke="#cbcbf0" strokeWidth="3" strokeLinecap="round" />
        <path d="M34 56h26" stroke="#cbcbf0" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}
