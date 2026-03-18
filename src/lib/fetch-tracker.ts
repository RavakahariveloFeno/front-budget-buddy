type Subscriber = () => void;

let pendingCount = 0;
const subscribers = new Set<Subscriber>();

function notify(): void {
  subscribers.forEach((subscriber) => subscriber());
}

export function getPendingFetchCount(): number {
  return pendingCount;
}

export function subscribeToPendingFetchCount(subscriber: Subscriber): () => void {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

function getHeaderValue(headers: HeadersInit | undefined, name: string): string | null {
  if (!headers) {
    return null;
  }
  if (headers instanceof Headers) {
    return headers.get(name);
  }
  if (Array.isArray(headers)) {
    const entry = headers.find(([key]) => key.toLowerCase() === name.toLowerCase());
    return entry ? entry[1] : null;
  }
  const record = headers as Record<string, string>;
  const direct = record[name];
  if (typeof direct === "string") {
    return direct;
  }
  const lowerKey = Object.keys(record).find((key) => key.toLowerCase() === name.toLowerCase());
  return lowerKey ? record[lowerKey] ?? null : null;
}

function isSilentRequest(init: RequestInit | undefined): boolean {
  const value = getHeaderValue(init?.headers, "x-bb-silent-loading");
  if (!value) {
    return false;
  }
  return value === "1" || value.toLowerCase() === "true";
}

function shouldIgnoreFetchInput(input: RequestInfo | URL): boolean {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  return url.includes("/@vite/") || url.includes("@vite/client") || url.includes("vite-hmr");
}

export function initFetchTracking(): void {
  if (typeof window === "undefined") {
    return;
  }

  const anyWindow = window as unknown as { __bbFetchTrackingInitialized?: boolean };
  if (anyWindow.__bbFetchTrackingInitialized) {
    return;
  }
  anyWindow.__bbFetchTrackingInitialized = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const silent = isSilentRequest(init) || shouldIgnoreFetchInput(input);
    if (!silent) {
      pendingCount += 1;
      notify();
    }

    try {
      return await originalFetch(input, init);
    } finally {
      if (!silent) {
        pendingCount = Math.max(0, pendingCount - 1);
        notify();
      }
    }
  };
}

