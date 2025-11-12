import React, { CSSProperties, ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
  className?: string;
  children?: React.ReactNode;
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      shimmerColor = "#4f8ff8",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "100px",
      background = "transparent",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        style={
          {
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--bg": background,
            "--stroke": shimmerColor,
          } as CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-visible whitespace-nowrap px-6 py-3 text-blue-600 [background:var(--bg)] [border-radius:var(--radius)]",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* SVG outline tracer */}
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
          <rect x="5" y="5" width="990" height="290" rx="150" ry="150" pathLength={1000} className="outline-trace" style={{ stroke: "var(--stroke)" }} />
        </svg>

        {children}
      </button>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";
