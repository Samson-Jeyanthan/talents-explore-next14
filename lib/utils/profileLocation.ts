import { z } from "zod";

export const profileLocationSchema = z.object({
  location: z.string().trim().min(1, "Please select your location."),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

type ProfileLocation = {
  location?: string;
  latitude?: unknown;
  longitude?: unknown;
  gpsLocation?: { coordinates?: unknown[] };
};

function coordinate(value: unknown): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (typeof value === "string" && !value.trim()) return undefined;
  const result = Number(value);
  return Number.isFinite(result) ? result : undefined;
}

export function getProfileLocationValues(user: ProfileLocation) {
  return {
    location: user.location || "",
    latitude: coordinate(user.latitude ?? user.gpsLocation?.coordinates?.[1]),
    longitude: coordinate(user.longitude ?? user.gpsLocation?.coordinates?.[0]),
  };
}

export function getProfileLocationUpdate(user: ProfileLocation, values: {
  location: string; latitude?: number; longitude?: number;
}) {
  const previous = getProfileLocationValues(user);
  if (values.location.trim() === previous.location.trim() &&
      values.latitude === previous.latitude && values.longitude === previous.longitude) return {};
  return profileLocationSchema.parse(values);
}
