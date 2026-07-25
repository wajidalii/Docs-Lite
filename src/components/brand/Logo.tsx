// The DocsLite mark: an iris tile with three white rules; the middle rule runs
// off the right edge. Lifted from the brand kit.
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden role="img">
      <rect width="32" height="32" rx="8.6" fill="#5b5bd6" />
      <path d="M8 11.5h10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8 16h24" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8 20.5h7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
