import { createLink } from "@tanstack/react-router";
import { type AnchorHTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/utils";

/*
 * Links. Every link in the app comes from here.
 *
 *   <TextLink to="/auth">Sign In</TextLink>              inline text link, ink
 *   <TextLink to="/auth" icon={<Mail size={16} />}>…</TextLink>
 *   <TextButton onClick={resend}>Send Again</TextButton>  the same look, but it acts instead of navigating
 *   <SectionActionLink to="/search">See All</SectionActionLink>  the action beside a section title, pink
 *   <BtnLink to="/feed">Continue</BtnLink>                a link that looks like a button (re-export of ui.tsx)
 *   <IconBtnLink to="/search" label="Search">…</IconBtnLink>  icon-only link (re-export of ui.tsx)
 *
 * `RowLink` (components/ml/collab.tsx) stays where it is: it is a whole-row target, not a text link.
 *
 * States, shared by TextLink, TextButton and SectionActionLink (the `link-action` utility in
 * styles.css):
 *   default   no underline, current colour — ink for TextLink/TextButton, brand pink for
 *             SectionActionLink; an optional leading icon is decorative, the text is the name.
 *   hover     underline appears in the current colour, on pointer devices only.
 *   pressed   dims to 60% opacity while the finger or button is down.
 *   disabled  TextButton only: grey text, no pointer events. Links are never disabled — leave the
 *             link out instead.
 *   focus     the global :focus-visible ring; links add nothing of their own.
 *   There is no visited style: the app is one signed-in surface, so visited would only add noise.
 *
 * Touch: `hit-area` gives every one of these a 48dp target without changing the drawn size.
 * Colour: ink is the rule. Brand pink is reserved for prices and for the section action, so reach
 * for SectionActionLink only in the "See All" / "View All" role beside a section title.
 * Labels are Title Case, apart from a link that sits inside a sentence.
 */

const textLinkBase = "link-action hit-area inline-flex items-center gap-1.5 font-semibold";

function TextLinkAnchor({
  icon,
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { icon?: ReactNode; ref?: Ref<HTMLAnchorElement> }) {
  return (
    <a {...props} className={cn(textLinkBase, "text-foreground", className)}>
      {icon ? (
        <span aria-hidden className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </a>
  );
}

/** Inline text link: ink, underline on hover, dims while pressed, 48dp touch area, optional icon. */
export const TextLink = createLink(TextLinkAnchor);

function SectionActionAnchor({
  icon,
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { icon?: ReactNode; ref?: Ref<HTMLAnchorElement> }) {
  return (
    <a {...props} className={cn(textLinkBase, "text-primary", className)}>
      {icon ? (
        <span aria-hidden className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </a>
  );
}

/**
 * The action beside a section title — "See All", "View All". Brand pink, the one link colour that
 * is not ink. Nothing else on the screen should borrow it. An optional leading `icon` marks an action
 * that is not a plain "see all" — the city on Nearby, the shortcut on Recommended.
 */
export const SectionActionLink = createLink(SectionActionAnchor);

/** The text-link treatment for an action that is not navigation. */
export function TextButton({
  icon,
  children,
  onClick,
  disabled = false,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        textLinkBase,
        "text-foreground disabled:pointer-events-none disabled:text-muted-foreground",
        className,
      )}
    >
      {icon ? (
        <span aria-hidden className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </button>
  );
}

export { BtnLink, IconBtnLink } from "@/components/ml/ui";
