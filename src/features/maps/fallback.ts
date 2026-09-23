import type { GameMap } from "@/features/maps/types";

/**
 * Static local fallback for the 13 standard (pickable) Valorant maps, used when the
 * valorant-api.com request fails, times out, or returns an empty/invalid payload.
 *
 * UUIDs are copied from https://valorant-api.com/v1/maps as of 2026-09-23. Images live in
 * `public/maps/<slug>.webp` — regenerate with `npm run fetch:map-images` if the API adds,
 * removes, or renames a map.
 */
export const FALLBACK_MAPS: GameMap[] = [
  { id: "224b0a95-48b9-f703-1bd8-67aca101a61f", name: "Abyss", slug: "abyss" },
  { id: "7eaecc1b-4337-bbf6-6ab9-04b8f06b3319", name: "Ascent", slug: "ascent" },
  { id: "2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba", name: "Bind", slug: "bind" },
  { id: "2fb9a4fd-47b8-4e7d-a969-74b4046ebd53", name: "Breeze", slug: "breeze" },
  { id: "1c18ab1f-420d-0d8b-71d0-77ad3c439115", name: "Corrode", slug: "corrode" },
  { id: "b529448b-4d60-346e-e89e-00a4c527a405", name: "Fracture", slug: "fracture" },
  { id: "2bee0dc9-4ffe-519b-1cbd-7fbe763a6047", name: "Haven", slug: "haven" },
  { id: "e2ad5c54-4114-a870-9641-8ea21279579a", name: "Icebox", slug: "icebox" },
  { id: "2fe4ed3a-450a-948b-6d6b-e89a78e680a9", name: "Lotus", slug: "lotus" },
  { id: "fd267378-4d1d-484f-ff52-77821ed10dc2", name: "Pearl", slug: "pearl" },
  { id: "d960549e-485c-e861-8d71-aa9d1aed12a2", name: "Split", slug: "split" },
  { id: "756da597-416b-c0f2-f47b-afbdf28670bc", name: "Summit", slug: "summit" },
  { id: "92584fbe-486a-b1b2-9faa-39b0f486b498", name: "Sunset", slug: "sunset" },
].map((map) => ({
  ...map,
  splash: `/maps/${map.slug}.webp`,
  banner: `/maps/${map.slug}.webp`,
  tall: `/maps/${map.slug}.webp`,
}));
