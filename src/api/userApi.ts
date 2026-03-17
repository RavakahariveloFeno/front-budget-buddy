import { buildAuthHeaders, getRequiredUserId } from "./authApi";

const USER_API_URL = `${import.meta.env.VITE_API_URL}/user`;

export interface UpdateUserProfilePayload {
  firstName: string;
  lastName: string;
}

export async function updateCurrentUserProfile(payload: UpdateUserProfilePayload): Promise<void> {
  const userId = getRequiredUserId();
  const response = await fetch(`${USER_API_URL}/${userId}`, {
    method: "PUT",
    headers: buildAuthHeaders(true),
    body: JSON.stringify({
      firstName: payload.firstName,
      lastName: payload.lastName,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}
