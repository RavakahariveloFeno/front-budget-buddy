import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/authApi";
import { getManagedProfile } from "@/api/profileApi";

export function useActiveManagedProfile() {
  const currentUser = getCurrentUser();
  const profileId = currentUser?.profileId;

  return useQuery({
    queryKey: ["managedProfile", profileId],
    queryFn: () => getManagedProfile(profileId as string),
    enabled: Boolean(profileId),
    staleTime: 60_000,
  });
}

