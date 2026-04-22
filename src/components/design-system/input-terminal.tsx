"use client";

import { useId, useState, type KeyboardEvent, type ChangeEvent } from "react";
import { clsx } from "clsx";

type InputTerminalProps = {
  /** Controlled value. Omit to use internal state. */
  value?: string;
  /** Change handler (controlled mode). Receives the raw (un-uppercased) value. */
  onChange?: (value: string) => void;
  /** Fires on Enter. Receives the trimmed value. Empty guesses are ignored. */
  onSubmit?: (value: string) => void;
  /** Placeholder copy. Defaults to a game-show prompt. */
  placeholder?: string;
  /** When true the input is read-only / non-interactive. Used for static
   *  mocks / storybook-style previews. Defaults to false. */
  disabled?: boolean;
  /** Hard character limit — prevents the ticker row from being overrun. */
  maxLength?: number;
};

/**
 * The chunky game-show input bar that sits just above the `<NewsTicker />`.
 *
 * Visual contract:
 *   - 4px themed (`--color-tile-shadow`) border in the focused state.
 *   - Black `>` prompt glyph in the blocks font.
 *   - Uppercase visual transform (via Tailwind `uppercase`) so casing feels
 *     consistent regardless of how the user types. The *actual* underlying
 *     string keeps the user's original casing so submission logic can
 *     normalize it exactly once.
 *
 * Interaction contract:
 *   - Wrapping `<label>` means the entire bar is clickable to focus the input.
 *   - Enter submits (trimmed) and clears the input in uncontrolled mode.
 *   - Escape clears the current input.
 *   - Native caret handles blinking; we deliberately do NOT render a custom
 *     block cursor to avoid caret-doubling.
 */
export function InputTerminal({
  value,
  onChange,
  onSubmit,
  placeholder = "TYPE A GUESS · PRESS ENTER",
  disabled = false,
  maxLength = 60,
}: InputTerminalProps) {
  const inputId = useId();
  const [internal, setInternal] = useState("");
  const isControlled = value !== undefined;
  const current = isControlled ? value! : internal;

  const commit = (next: string) => {
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    commit(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = current.trim();
      if (!trimmed) return;
      onSubmit?.(trimmed);
      if (!isControlled) setInternal("");
    } else if (e.key === "Escape") {
      e.preventDefault();
      commit("");
    }
  };

  return (
    <label
      htmlFor={inputId}
      className={clsx(
        "flex h-14 items-center gap-2 bg-paper border-4 px-4 cursor-text transition-colors",
        "border-[var(--color-tile-shadow)] focus-within:shadow-[4px_4px_0px_var(--color-tile-shadow)]",
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      <span
        aria-hidden="true"
        className="font-blocks text-[var(--text-base-lg)] leading-none text-[var(--color-tile-shadow)]"
      >
        &gt;
      </span>
      <input
        id={inputId}
        type="text"
        value={current}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode="text"
        className={clsx(
          "flex-1 min-w-0 bg-transparent outline-none border-0",
          "font-base text-[var(--text-base-lg)] font-bold uppercase tracking-wide leading-none",
          "text-ink placeholder:text-ink/35",
          "caret-[var(--color-tile-shadow)]",
        )}
        aria-label="Guess input"
      />
    </label>
  );
}
