export default function Logo({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={className}
    >
      <rect width="120" height="120" rx="26" fill="#2f6fed" />
      <circle cx="41" cy="49" r="17" fill="#ffffff" />
      <circle cx="79" cy="49" r="17" fill="#ffffff" />
      <circle cx="60" cy="82" r="17" fill="#fbbf24" />
    </svg>
  );
}
