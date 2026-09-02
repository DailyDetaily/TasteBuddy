"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

type SwitchSize = "sm" | "md" | "lg";

const switchSizeClassNames: Record<SwitchSize, {
  root: string;
  thumb: string;
}> = {
  sm: {
    root: "h-4 w-7",
    thumb: "size-3 data-[state=checked]:translate-x-[14px]",
  },
  md: {
    root: "h-5 w-9",
    thumb: "size-4 data-[state=checked]:translate-x-[18px]",
  },
  lg: {
    root: "h-6 w-11",
    thumb: "size-5 data-[state=checked]:translate-x-[22px]",
  },
};

interface SwitchProps extends React.ComponentProps<typeof SwitchPrimitive.Root> {
  size?: SwitchSize;
}

function Switch({
  className,
  size = "md",
  ...props
}: SwitchProps) {
  const sizeClassNames = switchSizeClassNames[size];

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-switch-background focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex shrink-0 items-center rounded-full transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        sizeClassNames.root,
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-card dark:data-[state=unchecked]:bg-card-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block rounded-full ring-0 transition-transform data-[state=unchecked]:translate-x-[2px]",
          sizeClassNames.thumb,
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
