import type { SVGProps } from 'react';

export default function AnalysisTabIcon({
  strokeWidth = 2,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M14 9L14 16C14 16.5523 14.4477 17 15 17L17 17C17.5523 17 18 16.5523 18 16L18 9C18 8.44772 17.5523 8 17 8L15 8C14.4477 8 14 8.44772 14 9Z" />
      <path d="M6 6L6 16C6 16.5523 6.44772 17 7 17L9 17C9.55229 17 10 16.5523 10 16L10 6C10 5.44772 9.55229 5 9 5L7 5C6.44772 5 6 5.44772 6 6Z" />
      <path d="M2 21H22" />
    </svg>
  );
}
