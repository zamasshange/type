export function flagUrl(code: string, width = 40) {
  return `https://flagcdn.com/w${width}/${(code || "za").toLowerCase()}.png`;
}

export function Flag({
  code,
  title,
  className = "",
}: {
  code?: string | null;
  title?: string;
  className?: string;
}) {
  const cc = (code || "za").toLowerCase();
  return (
    // Remote 4x3 flags from flagcdn; next/image is heavier for dozens of tiny icons.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`flag ${className}`}
      src={`https://flagcdn.com/w40/${cc}.png`}
      srcSet={`https://flagcdn.com/w80/${cc}.png 2x`}
      alt={title ?? code ?? cc}
      title={title}
      width={22}
      height={16}
      loading="lazy"
      decoding="async"
    />
  );
}
