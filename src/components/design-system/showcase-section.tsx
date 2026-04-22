import type { ReactNode } from "react";

type ShowcaseSectionProps = {
  /** Short numeric prefix, e.g. "01". Rendered as a display-font badge. */
  index: string;
  /** Section title. Uppercase, display font. */
  title: string;
  /** One-line subtitle, base font. */
  subtitle?: string;
  /** The section body. */
  children: ReactNode;
  /** Optional id for anchor nav. */
  id?: string;
};

/**
 * A labelled showcase block used to organize the design system page into
 * legible broadcast-style chapters. Each section is brick-walled from its
 * neighbors by a thick ink rule.
 */
export function ShowcaseSection({
  index,
  title,
  subtitle,
  children,
  id,
}: ShowcaseSectionProps) {
  return (
    <section
      id={id}
      className="flex flex-col gap-8 border-t-4 border-ink pt-8 lg:pt-10"
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-4">
          <span className="inline-flex h-10 min-w-10 items-center justify-center bg-ink px-2 font-blocks text-[var(--text-base-md)] text-paper">
            {index}
          </span>
          <h2 className="font-blocks text-[var(--text-blocks-md)] leading-none uppercase tracking-wider text-balance">
            {title}
          </h2>
        </div>
        {subtitle ? (
          <p className="font-base text-[var(--text-base-md)] max-w-3xl text-pretty opacity-85 leading-relaxed">
            {subtitle}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
