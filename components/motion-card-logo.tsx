import type { SVGProps } from "react";

/** Square + 45° diagonal; lower-left triangle filled zinc-600. */
export function MotionCardLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <path
        className="fill-zinc-600"
        d="M3.75 3.75L3.75 20.25L20.25 20.25Z"
      />
      <rect
        x="3.75"
        y="3.75"
        width="16.5"
        height="16.5"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M3.75 3.75L20.25 20.25"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
