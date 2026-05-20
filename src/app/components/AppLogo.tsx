export function AppLogo({ size = 28 }: { size?: number }) {
  const unit = size / 2;
  const r = unit * 0.45;
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <rect x="0" y="0" width="13" height="13" rx={r} fill="#FFFFD3" />
      <rect x="14" y="0" width="13" height="13" rx={r} fill="#3A3A3A" />
      <rect x="0" y="14" width="13" height="13" rx={r} fill="#7A8F6B" />
    </svg>
  );
}
