import type { SVGProps } from 'react';

export default function HomeTabIcon({
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
      <path d="M3.18579 9.15771C3.06333 9.42161 2.99993 9.70906 3 9.99999V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H8C8.55228 21 9 20.5523 9 20V13C9 12.4477 9.44772 12 10 12H14C14.5523 12 15 12.4477 15 13V20C15 20.5523 15.4477 21 16 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V9.99999C21.0001 9.70906 20.9367 9.42161 20.8142 9.15771C20.6918 8.8938 20.5132 8.65979 20.291 8.47199L13.291 2.47199C12.93 2.1669 12.4726 1.99951 12 1.99951C11.5274 1.99951 11.07 2.1669 10.709 2.47199L3.709 8.47199C3.4868 8.65979 3.30824 8.8938 3.18579 9.15771Z" />
    </svg>
  );
}
