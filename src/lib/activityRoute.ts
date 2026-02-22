import type { Activity } from "@/data/staticData";

export function slugifyActivityName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildActivityPath(activity: Activity): string {
  const slug = slugifyActivityName(activity.name) || "activite";
  return `/${slug}`;
}
