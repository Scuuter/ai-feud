import { clsx } from "clsx";

type InputTerminalProps = {
  /** Preview text to render as a "typed" guess. */
  value?: string;
  /** Whether to render the focused cyan-border variant. Defaults to true. */
  focused?: boolean;
  /** Optional placeholder when value is empty. */
  placeholder?: string;
};

/**
 * Static preview of the chunky game-show input bar that lives just above the
 * `<NewsTicker />`. The real interactive component will be a client-only file
 * under `src/components/game/` and will consume the same tokens.
 */
export function InputTerminal({
  value = "",
  focused = true,
  placeholder = "TYPE A GUESS",
}: InputTerminalProps) {
  return (
    <div
      className={clsx(
        "flex h-14 items-center gap-2 bg-paper border-4 px-4",
        focused ? "border-[var(--color-tile-shadow)]" : "border-ink",
      )}
      role="textbox"
      aria-readonly="true"
      aria-label={`Input terminal: ${value || placeholder}`}
    >
      <span
        aria-hidden="true"
        className="font-blocks text-[var(--text-base-lg)] leading-none text-[var(--color-tile-shadow)]"
      >
        &gt;
      </span>
      <span
        className={clsx(
          "font-base text-[var(--text-base-lg)] font-bold uppercase tracking-wide",
          value ? "text-ink" : "text-ink/35",
        )}
      >
        {value || placeholder}
      </span>
      <span
        aria-hidden="true"
        className="animate-cursor ml-0.5 inline-block h-5 w-3 bg-[var(--color-tile-shadow)]"
      />
    </div>
  );
}
