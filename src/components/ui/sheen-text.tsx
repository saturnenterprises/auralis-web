import React from "react";
import { cn } from "@/lib/utils";

interface SheenTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  baseColor?: string;
  sheenColor?: string;
  durationMs?: number;
  children: React.ReactNode;
}

export function SheenText({
  baseColor = "#2563eb",
  sheenColor = "#60a5fa",
  durationMs = 2200,
  className,
  children,
  ...rest
}: SheenTextProps) {
  const duration = `${Math.max(600, durationMs)}ms`;

  return (
    <span className={cn("relative inline-block align-baseline", className)} {...rest}>
      <span style={{ color: baseColor }} className="relative z-0">
        {children}
      </span>
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 z-10",
          // ultra-narrow band to avoid any outside glow
          "[background:linear-gradient(110deg,transparent_0%,transparent_49%,var(--sheen)_50%,transparent_51%,transparent_100%)]",
          "[background-size:240%_100%]",
          // strictly clip to glyphs across engines
          "text-transparent [color:transparent] [-webkit-text-fill-color:transparent] [background-clip:text] [-webkit-background-clip:text]",
          // no drop-shadows, no blending
          "motion-safe:animate-[sheen_move_var(--dur)_linear_infinite] motion-reduce:animate-none",
        )}
        style={{ ['--sheen' as any]: sheenColor, ['--dur' as any]: duration }}
      >
        {children}
      </span>
      <style>{`@keyframes sheen_move{0%{background-position:-130% 0}100%{background-position:230% 0}}`}</style>
    </span>
  );
}

export default SheenText;
