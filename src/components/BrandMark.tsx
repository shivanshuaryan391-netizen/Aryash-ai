interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 28, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="aryash-mark-grad" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="55%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="9" fill="#0F1631" stroke="rgba(129, 140, 248, 0.35)" strokeWidth="1.2" />
      <path
        d="M18 7.5L27.5 26.5H23.2L20.9 21.6H15.1L12.8 26.5H8.5L18 7.5Z"
        fill="url(#aryash-mark-grad)"
      />
      <path d="M18 13.8L16.3 18H19.7L18 13.8Z" fill="#080B18" />
      <circle cx="18" cy="24.6" r="1.7" fill="#93C5FD" />
    </svg>
  );
}
