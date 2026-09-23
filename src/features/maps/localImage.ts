import { FALLBACK_MAPS } from "@/features/maps/fallback";

/** Local fallback splash path for a map slug, if we ship one — used when a remote image 404s. */
export function getLocalFallbackImage(slug: string): string | undefined {
  return FALLBACK_MAPS.find((map) => map.slug === slug)?.splash;
}
