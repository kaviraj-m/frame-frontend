/** Small “open in new window” arrow for external redirects (WhatsApp, etc.). */
export function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "icon-external-link"}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M14 4h6v6M10 14L20 4M15 4h5v5M5 9v10h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
