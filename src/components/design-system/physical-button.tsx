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
  variant?: "default" | "power";
};

/**
 * Chassis-mounted physical button. Lives on the silver bezel below the screen,
 * NOT floating in the room. Uses inset shadows and a chassis gradient to fake
 * tactile hardware. In the showcase these are static; gameplay instances will
 * add `onClick` handlers but share this exact styling.
 */
export function PhysicalButton({
  label,
  icon,
  pressed = false,
  variant = "default",
}: PhysicalButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={clsx(
        "chassis-gradient flex h-12 min-w-14 flex-col items-center justify-center gap-0.5",
        "border-2 border-tv-silver-dark px-3 rounded-sm",
        pressed
          ? "shadow-[inset_2px_2px_0px_rgba(0,0,0,0.35)] translate-y-[1px]"
          : "shadow-[inset_0_1px_0_var(--color-tv-silver-light),inset_0_-2px_0_rgba(0,0,0,0.2)]",
        "transition-transform duration-75 ease-out active:translate-y-[1px]",
      )}
    >
      {variant === "power" ? (
        <span
          aria-hidden="true"
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--color-channel-dot)" }}
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
