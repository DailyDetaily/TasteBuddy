import { forwardRef, type HTMLAttributes } from 'react';

/** Stable layout container. The sheet presenter transforms this outer layer. */
const SheetBackground = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function SheetBackground({
  children, style, ...props
}, ref) {
  return (
    <div {...props} ref={ref} data-sheet-background="" style={{ transformOrigin: '50% 0%', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
});

export default SheetBackground;
