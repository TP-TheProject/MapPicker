import { z } from "zod";

/**
 * Shape of a single map entry as returned by https://valorant-api.com/v1/maps.
 * We only declare the fields MapPicker actually consumes.
 */
export const apiMapSchema = z.object({
  uuid: z.string(),
  displayName: z.string(),
  splash: z.string().nullable(),
  listViewIcon: z.string().nullable(),
  listViewIconTall: z.string().nullable(),
  tacticalDescription: z.string().nullable(),
});

export type ApiMap = z.infer<typeof apiMapSchema>;

export const apiMapsResponseSchema = z.object({
  status: z.number(),
  data: z.array(apiMapSchema),
});

export type ApiMapsResponse = z.infer<typeof apiMapsResponseSchema>;
