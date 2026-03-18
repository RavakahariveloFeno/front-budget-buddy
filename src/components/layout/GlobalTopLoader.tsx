import * as React from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { getPendingFetchCount, subscribeToPendingFetchCount } from "@/lib/fetch-tracker";

const SHOW_DELAY_MS = 150;
const MIN_VISIBLE_MS = 300;

export default function GlobalTopLoader() {
  const pendingFetches = React.useSyncExternalStore(subscribeToPendingFetchCount, getPendingFetchCount, () => 0);
  const queryFetching = useIsFetching();
  const queryMutating = useIsMutating();

  const totalPending = pendingFetches + queryFetching + queryMutating;
  const hasPending = totalPending > 0;

  const [visible, setVisible] = React.useState(false);
  const visibleSinceRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (hasPending) {
      const id = window.setTimeout(() => {
        visibleSinceRef.current = Date.now();
        setVisible(true);
      }, SHOW_DELAY_MS);
      return () => window.clearTimeout(id);
    }

    if (!visible) {
      return;
    }

    const visibleSince = visibleSinceRef.current ?? Date.now();
    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - visibleSince));
    const id = window.setTimeout(() => {
      visibleSinceRef.current = null;
      setVisible(false);
    }, remaining);
    return () => window.clearTimeout(id);
  }, [hasPending, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[80] h-1 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-40" style={{ background: "hsl(var(--secondary))" }} />
      <div
        className="relative h-full w-1/3 animate-[bb-top-loader_1.1s_ease-in-out_infinite]"
        style={{ background: "var(--gradient-primary)", willChange: "transform" }}
      />
    </div>
  );
}

