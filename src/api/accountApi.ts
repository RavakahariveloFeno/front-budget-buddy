import { buildAuthHeaders } from "./authApi";

const ACCOUNT_API_URL = `${import.meta.env.VITE_API_URL}/account`;

async function readApiErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as any;
    const message = data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    if (Array.isArray(message) && message.length) {
      return String(message[0]);
    }
  } catch {
    // ignore
  }

  return `HTTP ${response.status}`;
}

export async function resetAccountHistory(): Promise<void> {
  const response = await fetch(`${ACCOUNT_API_URL}/reset`, {
    method: "POST",
    headers: buildAuthHeaders(true),
  });

  if (!response.ok) {
    throw new Error(await readApiErrorMessage(response));
  }
}

