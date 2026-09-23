import { describe, expect, it } from "vitest";

import { formatSummary } from "@/features/veto/format";
import { SIDE, TEAM } from "@/features/veto/types";
import type { VetoSummary } from "@/features/veto/types";

const maps = [
  { id: "map-1", name: "Ascent" },
  { id: "map-2", name: "Bind" },
  { id: "map-3", name: "Split" },
];

const summary: VetoSummary = {
  format: "bo1",
  teamA: "Red",
  teamB: "Blue",
  bannedMaps: [{ mapId: "map-1", by: TEAM.A }],
  playedMaps: [{ mapId: "map-3", pickedBy: "decider", side: { team: TEAM.B, side: SIDE.ATTACK } }],
};

describe("formatSummary", () => {
  it("includes team names, banned maps, and picked maps in English", () => {
    // Act
    const text = formatSummary(summary, maps, "en");

    // Assert
    expect(text).toContain("Red vs Blue");
    expect(text).toContain("Ascent (Red)");
    expect(text).toContain("Split (Decider)");
    expect(text).toContain("Blue starts on Attack");
  });

  it("renders labels in Portuguese", () => {
    // Act
    const text = formatSummary(summary, maps, "pt");

    // Assert
    expect(text).toContain("Banimentos:");
    expect(text).toContain("Decisivo");
    expect(text).toContain("Ataque");
  });
});
