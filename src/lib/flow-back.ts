import { useRouter } from "@tanstack/react-router";
import type { AnyRouter } from "@tanstack/react-router";

/**
 * In-app Back that agrees with the Android back gesture. Pushing the previous step on Back grows the
 * history stack, so the system gesture then walks forward again. When the entry just behind this one
 * is where Back is going, pop it instead; otherwise (a deep link, a resumed draft) fall back to a
 * replace so the stack does not grow.
 */
const pathByIndex = new Map<number, string>();

const indexOf = (router: AnyRouter) =>
  (router.history.location.state as { __TSR_index?: number }).__TSR_index;

export function trackHistory(router: AnyRouter) {
  if (typeof window === "undefined") return;
  const record = () => {
    const i = indexOf(router);
    if (typeof i === "number") pathByIndex.set(i, router.history.location.pathname);
  };
  record();
  router.history.subscribe(record);
}

export function useFlowBack() {
  const router = useRouter();
  return (path: string, fallback: () => void) => {
    const i = indexOf(router);
    if (typeof i === "number" && i > 0 && pathByIndex.get(i - 1) === path) {
      router.history.back();
      return;
    }
    fallback();
  };
}
