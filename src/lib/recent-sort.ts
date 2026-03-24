export function parseDateToTime(value: unknown): number {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isFinite(time) ? time : Number.NaN;
  }

  if (typeof value === "string" || typeof value === "number") {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : Number.NaN;
  }

  return Number.NaN;
}

export function mostRecentTime<T extends object>(item: T, fields: readonly (keyof T | string)[]): number {
  for (const field of fields) {
    const time = parseDateToTime((item as any)?.[String(field)]);
    if (Number.isFinite(time)) {
      return time;
    }
  }

  return 0;
}

export function compareByMostRecent<T extends object>(
  fields: readonly (keyof T | string)[] = ["createdAt", "date"],
): (a: T, b: T) => number {
  return (a, b) => mostRecentTime(b, fields) - mostRecentTime(a, fields);
}
