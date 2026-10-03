import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/*
 * Toasts are Material 3 snackbars: ink surface, white text, one line where possible, at the bottom
 * above the navigation and the keyboard, gone in four seconds. Success and error carry an icon; the
 * words say what happened. Page-level problems use AuthNotice inline instead.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-center"
      offset={88}
      mobileOffset={{ bottom: "calc(88px + env(safe-area-inset-bottom))" }}
      duration={4000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-sm bg-ink px-4 py-3 text-sm text-ink-foreground shadow-elevation-3",
          title: "font-medium leading-snug",
          description: "mt-0.5 text-1 text-ink-foreground/70",
          success: "[&_[data-icon]]:text-success",
          error: "[&_[data-icon]]:text-destructive",
          actionButton: "link-action ml-auto shrink-0 font-semibold text-ink-foreground",
          cancelButton: "shrink-0 text-ink-foreground/70",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
