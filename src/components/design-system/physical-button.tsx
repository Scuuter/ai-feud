"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";

type PhysicalButtonProps = {
  /** Short bezel label. Always UPPERCASE. */
  label: string;
  /** Optional icon or tiny pictogram (rendered above the label). */
  icon?: ReactNode;
  /** Highlights the button as an active toggle (recessed state). */
  pressed?: boolean;
  /** Power-style: rendered with a small channel-dot color dot. */
  variant?: "default" | "power" | "menu";
  /** Click handler — chassis buttons become real controls in the preview. */
  onClick?: () => void;
  /** Accessible label override (defaults to `label`). */
  title?: string;
};

/**
 * Chassis-mounted physical button. Lives on the silver bezel below the screen.
 * Uses inset shadows and a chassis gradient to fake tactile hardware.
 */
export function PhysicalButton({
  label,
  icon,
  pressed = false,
  variant = "default",
  onClick,
  title,
}: PhysicalButtonProps) {
  const interactive = typeof onClick === "function";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={interactive ? pressed : undefined}
      aria-label={title ?? label}
      className={clsx(
        "chassis-gradient flex h-10 min-w-12 flex-col items-center justify-center gap-0.5",
        "border-2 border-tv-silver-dark px-2.5 rounded-sm",
        pressed
          ? "shadow-[inset_2px_2px_0px_rgba(0,0,0,0.35)] translate-y-[1px]"
          : "shadow-[inset_0_1px_0_var(--color-tv-silver-light),inset_0_-2px_0_rgba(0,0,0,0.2)]",
        interactive
          ? "transition-transform duration-75 ease-out active:translate-y-[1px] cursor-pointer"
          : "cursor-default",
      )}
    >
      {variant === "power" ? (
        <span
          aria-hidden="true"
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--color-channel-dot)" }}
        />
      ) : variant === "menu" ? (
        <span
          aria-hidden="true"
          className="inline-block h-2 w-2 border border-ink/70"
          style={{
            backgroundColor: pressed
              ? "var(--color-tile-shadow)"
              : "transparent",
          }}
        />
      ) : icon ? (
        <span aria-hidden="true" className="text-ink opacity-70">
          {icon}
        </span>
      ) : null}
      <span className="font-blocks text-[10px] leading-none tracking-widest text-ink/80">
        {label}
      </span>
    </button>
  );
}
