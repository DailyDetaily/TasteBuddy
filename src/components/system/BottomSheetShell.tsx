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
const BOTTOM_SHEET_HEADER_ICON_BUTTON_CLASS =
  "flex items-center justify-center rounded-full text-[var(--tb-color-icon-primary)] transition-colors hover:text-[var(--tb-color-text-primary)] active:opacity-70";

interface BottomSheetShellProps extends ComponentProps<typeof Drawer> {
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
  ...drawerProps
}: BottomSheetShellProps) {
  const showHeader =
    headerStart !== undefined || headerCenter !== undefined || headerEnd !== undefined;

  return (
    <Drawer {...drawerProps}>
      <DrawerContent
        overlayClassName={cn("z-40 bg-[rgba(0,0,0,0.6)]", overlayClassName)}
        className={cn(
          "left-0 right-0 z-50 mx-auto h-[calc(var(--tb-viewport-height,100dvh)*0.95)] max-h-[calc(var(--tb-viewport-height,100dvh)*0.95)] max-w-[1440px] !rounded-t-[20px] border-0 bg-[var(--tb-color-bg-focus)] outline-none",
          "data-[vaul-drawer-direction=bottom]:border-t-0",
          "[&>div:first-child]:mt-3 [&>div:first-child]:h-1.5 [&>div:first-child]:w-10 [&>div:first-child]:bg-[var(--tb-color-border-strong)]",
          contentClassName,
        )}
      >
        {showHeader ? (
          <div
            className={cn(
              "relative flex items-center justify-between px-4 pb-4",
              headerClassName,
            )}
          >
            <div className="flex min-h-10 min-w-10 items-center justify-start">
              {headerStart ?? <div aria-hidden="true" className="h-10 w-10" />}
            </div>
            {headerCenter ? (
              <div className="pointer-events-none absolute left-1/2 flex min-h-10 -translate-x-1/2 items-center justify-center text-center">
                {headerCenter}
              </div>
            ) : null}
            <div className="flex min-h-10 min-w-10 items-center justify-end">
              {headerEnd ?? <div aria-hidden="true" className="h-10 w-10" />}
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
