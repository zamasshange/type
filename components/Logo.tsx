export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo">
      <svg viewBox="0 0 32 32" width={compact ? 22 : 28} height={compact ? 22 : 28} aria-hidden>
        <rect x="2" y="10" width="28" height="18" rx="4" fill="currentColor" opacity="0.14" />
        <path
          d="M6 14h8.5c2.4 0 3.5 1.4 3.5 3.2 0 1.9-1.2 3.3-3.6 3.3H9.6V24H6V14zm3.6 4.3h4c.9 0 1.4-.5 1.4-1.15 0-.7-.5-1.15-1.4-1.15h-4v2.3zM20.2 24V14h3.6v10h-3.6z"
          fill="currentColor"
        />
        <path d="M8 6h16l-8 5L8 6z" fill="var(--main)" />
      </svg>
      <span className="logo-word">
        type<span>haven</span>
      </span>
    </span>
  );
}
