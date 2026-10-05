import type { ComponentProps } from "react";

// Preview controls belong to the page. AbsoluteFill registers an editable
// Studio outline over its children, which intercepts their pointer events.
export const PreviewSurface = ({ style, ...props }: ComponentProps<"div">) => (
  <div
    {...props}
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      ...style,
    }}
  />
);
