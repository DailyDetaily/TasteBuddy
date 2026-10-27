"use client";

import { X as XIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ComponentProps, ElementType, ReactNode } from "react";

import { ICON_TOKENS } from "../../constants/designTokens";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
} from "../ui/drawer";
import { cn } from "../ui/utils";

const BOTTOM_SHEET_HEADER_ICON_SIZE = ICON_TOKENS.size.lg;
const BOTTOM_SHEET_HEADER_ICON_BUTTON_SIZE = ICON_TOKENS.container.lg;
const BOTTOM_SHEET_HEADER_ICON_STROKE = ICON_TOKENS.strokeWidth.regular;
export const BOTTOM_SHEET_STAGE_HEIGHT_CLASS =
  "h-[calc(var(--tb-viewport-height,100dvh)*var(--tb-sheet-native-surface-height-ratio)_-_var(--tb-safe-area-top)_-_var(--tb-sheet-native-surface-top-inset))] !max-h-[calc(var(--tb-viewport-height,100dvh)*var(--tb-sheet-native-surface-height-ratio)_-_var(--tb-safe-area-top)_-_var(--tb-sheet-native-surface-top-inset))]";
const BOTTOM_SHEET_HEADER_ICON_BUTTON_CLASS =
  "flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)] active:opacity-70";

type BottomSheetShellProps = ComponentProps<typeof Drawer> & {
  presentation?: 'native' | 'web';
  bodyClassName?: string;
  children: ReactNode;
  contentClassName?: string;
  footer?: ReactNode;
  footerClassName?: string;
  floatingLayer?: ReactNode;
  headerCenter?: ReactNode;
  headerClassName?: string;
  headerEnd?: ReactNode;
  headerStart?: ReactNode;
  overlayClassName?: string;
  trigger?: ReactNode;
}

interface BottomSheetCloseButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel?: string;
}

interface BottomSheetIconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel?: string;
  icon: ElementType;
  iconSize?: number;
  iconStrokeWidth?: number;
}

export function BottomSheetIconButton({
  ariaLabel,
  className,
  icon: Icon,
  iconSize = BOTTOM_SHEET_HEADER_ICON_SIZE,
  iconStrokeWidth = BOTTOM_SHEET_HEADER_ICON_STROKE,
  style,
  type,
  ...props
}: BottomSheetIconButtonProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(BOTTOM_SHEET_HEADER_ICON_BUTTON_CLASS, className)}
      style={{
        width: BOTTOM_SHEET_HEADER_ICON_BUTTON_SIZE,
        height: BOTTOM_SHEET_HEADER_ICON_BUTTON_SIZE,
        ...style,
      }}
      type={type ?? "button"}
      {...props}
    >
      <Icon size={iconSize} strokeWidth={iconStrokeWidth} />
    </button>
  );
}

export function BottomSheetCloseButton({
  ariaLabel = "닫기",
  children,
  className,
  style,
  type,
  ...props
}: BottomSheetCloseButtonProps) {
  return (
    <DrawerClose asChild>
      <button
        aria-label={ariaLabel}
        className={cn(BOTTOM_SHEET_HEADER_ICON_BUTTON_CLASS, className)}
        style={{
          width: BOTTOM_SHEET_HEADER_ICON_BUTTON_SIZE,
          height: BOTTOM_SHEET_HEADER_ICON_BUTTON_SIZE,
          ...style,
        }}
        type={type ?? "button"}
        {...props}
      >
        {children ?? (
          <XIcon
            size={BOTTOM_SHEET_HEADER_ICON_SIZE}
            strokeWidth={BOTTOM_SHEET_HEADER_ICON_STROKE}
          />
        )}
      </button>
    </DrawerClose>
  );
}

export default function BottomSheetShell({
  presentation = 'native',
  bodyClassName,
  children,
  contentClassName,
  footer,
  footerClassName,
  floatingLayer,
  headerCenter,
  headerClassName,
  headerEnd,
  headerStart,
  overlayClassName,
  trigger,
  ...drawerProps
}: BottomSheetShellProps) {
  const showHeader =
    headerStart !== undefined || headerCenter !== undefined || headerEnd !== undefined;
  const isNative = presentation === 'native';
  const headerSlotClass = isNative ? "min-h-8 min-w-8" : "min-h-10 min-w-10";
  const headerPlaceholderClass = isNative ? "h-8 w-8" : "h-10 w-10";

  return (
    <Drawer {...drawerProps}>
      {trigger}
      <DrawerContent
        overlayClassName={cn("z-40 bg-[rgba(0,0,0,var(--tb-sheet-web-background-dim-opacity))]", overlayClassName)}
        className={cn(
          "left-0 right-0 z-50 mx-auto max-w-[1440px] border-0 bg-[var(--tb-color-bg-focus)] outline-none",
          isNative && BOTTOM_SHEET_STAGE_HEIGHT_CLASS,
          isNative
            ? "!rounded-t-[var(--tb-sheet-native-surface-radius)] [&>div:first-child]:!mt-[5px] [&>div:first-child]:!mb-[10px] [&>div:first-child]:!h-[var(--tb-sheet-native-surface-grabber-height)] [&>div:first-child]:!w-[var(--tb-sheet-native-surface-grabber-width)]"
            : "!rounded-t-[var(--tb-sheet-web-surface-radius)]",
          "data-[vaul-drawer-direction=bottom]:border-t-0",
          "[&>div:first-child]:mt-3 [&>div:first-child]:h-[var(--tb-sheet-web-surface-grabber-height)] [&>div:first-child]:w-[var(--tb-sheet-web-surface-grabber-width)] [&>div:first-child]:bg-[var(--tb-color-border-strong)]",
          contentClassName,
        )}
      >
        {showHeader ? (
          <div
            className={cn(
              "relative flex shrink-0 items-center justify-between",
              isNative ? "px-5 pb-3" : "px-4 pb-4",
              headerClassName,
            )}
          >
            <div className={cn("flex items-center justify-start", headerSlotClass)}>
              {headerStart ?? <div aria-hidden="true" className={headerPlaceholderClass} />}
            </div>
            {headerCenter ? (
              <div className={cn("pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center justify-center text-center", isNative ? "min-h-8" : "min-h-10")}>
                {headerCenter}
              </div>
            ) : null}
            <div className={cn("flex items-center justify-end", headerSlotClass)}>
              {headerEnd ?? <div aria-hidden="true" className={headerPlaceholderClass} />}
            </div>
          </div>
        ) : null}

        <div className={cn("flex flex-1 flex-col overflow-hidden", bodyClassName)}>
          {children}
        </div>

        {footer ? (
          <div
            className={cn(
              "w-full px-5 pb-[max(12px,var(--tb-safe-area-bottom))] pt-4",
              footerClassName,
            )}
          >
            {footer}
          </div>
        ) : null}

        {floatingLayer ? (
          <div className="fixed inset-0 z-[70]">
            {floatingLayer}
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
