import type { KeyboardEvent } from "react";

/**
 * Utility hook to return standard React event handlers for dismissing overlays.
 * Spreading these props onto a focusable element (tabIndex={0}) allows it to
 * capture Space, Enter, or Click events locally.
 */
export function useDismissProps(onDismiss?: () => void) {
  if (!onDismiss) return {};

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onDismiss();
    }
  };

  const handleClick = () => {
    onDismiss();
  };

  return {
    onClick: handleClick,
    onKeyDown: handleKeyDown,
  };
}
