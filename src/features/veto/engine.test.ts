import { describe, expect, it } from "vitest";

import {
  applyAction,
  createVeto,
  currentStep,
  isComplete,
  isVetoError,
  summarize,
  undo,
} from "@/features/veto/engine";
import { SIDE, TEAM, VETO_ERROR, VETO_FORMAT, type VetoState } from "@/features/veto/types";

function pool(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `map-${i + 1}`);
}

function requireVeto(state: ReturnType<typeof createVeto>): VetoState {
  if (isVetoError(state)) throw new Error(`Expected a VetoState, got error: ${state.error}`);
  return state;
}

describe("createVeto", () => {
  it("rejects a pool smaller than the format minimum", () => {
    // Arrange
    const config = { format: VETO_FORMAT.BO1, teamA: "A", teamB: "B", pool: pool(1) };

    // Act
    const result = createVeto(config);

    // Assert
    expect(isVetoError(result)).toBe(true);
    expect(isVetoError(result) && result.error).toBe(VETO_ERROR.POOL_TOO_SMALL);
  });

  it.each([
    [VETO_FORMAT.BO1, 2],
    [VETO_FORMAT.BO3, 5],
    [VETO_FORMAT.BO5, 7],
  ])("accepts the minimum pool size for %s (%i maps)", (format, minSize) => {
    // Arrange
    const config = { format, teamA: "A", teamB: "B", pool: pool(minSize) };

    // Act
    const result = createVeto(config);

    // Assert
    expect(isVetoError(result)).toBe(false);
  });

  it("rejects duplicate maps in the pool", () => {
    // Arrange
    const config = { format: VETO_FORMAT.BO1, teamA: "A", teamB: "B", pool: ["m1", "m1"] };

    // Act
    const result = createVeto(config);

    // Assert
    expect(isVetoError(result) && result.error).toBe(VETO_ERROR.DUPLICATE_MAP);
  });

  it("rejects missing team names", () => {
    // Arrange
    const config = { format: VETO_FORMAT.BO1, teamA: "  ", teamB: "B", pool: pool(2) };

    // Act
    const result = createVeto(config);

    // Assert
    expect(isVetoError(result) && result.error).toBe(VETO_ERROR.MISSING_TEAM_NAME);
  });

  it("rejects identical team names", () => {
    // Arrange
    const config = { format: VETO_FORMAT.BO1, teamA: "Alpha", teamB: "alpha", pool: pool(2) };

    // Act
    const result = createVeto(config);

    // Assert
    expect(isVetoError(result) && result.error).toBe(VETO_ERROR.DUPLICATE_TEAM_NAME);
  });

  it("rejects identical team names differing only by surrounding whitespace", () => {
    // Arrange
    const config = { format: VETO_FORMAT.BO1, teamA: "Alpha", teamB: " Alpha ", pool: pool(2) };

    // Act
    const result = createVeto(config);

    // Assert
    expect(isVetoError(result) && result.error).toBe(VETO_ERROR.DUPLICATE_TEAM_NAME);
  });
});

describe("currentStep sequences", () => {
  it("BO1 with N=2 is a single ban by A then a decider side step for B", () => {
    // Arrange
    let state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO1, teamA: "A", teamB: "B", pool: pool(2) }),
    );

    // Act
    expect(currentStep(state)).toEqual({ kind: "ban", team: TEAM.A });
    state = applyAction(state, { type: "ban", mapId: "map-1", team: TEAM.A });

    // Assert — decider auto-assigned, side chosen by the team that did NOT make the last ban (B)
    expect(currentStep(state)).toEqual({ kind: "side", team: TEAM.B, mapId: "map-2" });
  });

  it("BO1 alternates bans A,B,... across a 13-map pool down to one decider", () => {
    // Arrange
    let state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO1, teamA: "A", teamB: "B", pool: pool(13) }),
    );
    const expectedTeams = [
      TEAM.A,
      TEAM.B,
      TEAM.A,
      TEAM.B,
      TEAM.A,
      TEAM.B,
      TEAM.A,
      TEAM.B,
      TEAM.A,
      TEAM.B,
      TEAM.A,
      TEAM.B,
    ];

    // Act & Assert — 12 bans reduce 13 maps to 1
    for (const team of expectedTeams) {
      const step = currentStep(state);
      expect(step?.kind).toBe("ban");
      expect(step?.team).toBe(team);
      state = applyAction(state, {
        type: "ban",
        mapId: state.config.pool.find((id) => state.maps[id]?.status === "available")!,
        team,
      });
    }

    const finalStep = currentStep(state);
    expect(finalStep?.kind).toBe("side");
  });

  it("BO3 with N=7 runs ban,ban,pick,pick,ban,ban then a decider", () => {
    // Arrange
    let state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO3, teamA: "A", teamB: "B", pool: pool(7) }),
    );
    const expectedPlan = [
      { kind: "ban", team: TEAM.A },
      { kind: "ban", team: TEAM.B },
      { kind: "pick", team: TEAM.A },
      { kind: "pick", team: TEAM.B },
      { kind: "ban", team: TEAM.A },
      { kind: "ban", team: TEAM.B },
    ];

    // Act & Assert
    for (const expected of expectedPlan) {
      const step = currentStep(state);
      expect(step?.kind).toBe(expected.kind);
      expect(step?.team).toBe(expected.team);

      const mapId = state.config.pool.find((id) => state.maps[id]?.status === "available")!;
      state = applyAction(state, {
        type: expected.kind as "ban" | "pick",
        mapId,
        team: expected.team,
      });

      if (expected.kind === "pick") {
        const sideStep = currentStep(state);
        expect(sideStep?.kind).toBe("side");
        state = applyAction(state, {
          type: "side",
          mapId: sideStep!.mapId!,
          team: sideStep!.team,
          side: SIDE.ATTACK,
        });
      }
    }

    expect(currentStep(state)?.kind).toBe("side");
  });

  it("BO3 with N=5 (minimum) has no trailing bans: ban,ban,pick,pick then decider", () => {
    // Arrange
    let state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO3, teamA: "A", teamB: "B", pool: pool(5) }),
    );
    const expectedPlan = [
      { kind: "ban", team: TEAM.A },
      { kind: "ban", team: TEAM.B },
      { kind: "pick", team: TEAM.A },
      { kind: "pick", team: TEAM.B },
    ];

    // Act
    for (const expected of expectedPlan) {
      const mapId = state.config.pool.find((id) => state.maps[id]?.status === "available")!;
      state = applyAction(state, {
        type: expected.kind as "ban" | "pick",
        mapId,
        team: expected.team,
      });
      if (expected.kind === "pick") {
        const sideStep = currentStep(state)!;
        state = applyAction(state, {
          type: "side",
          mapId: sideStep.mapId!,
          team: sideStep.team,
          side: SIDE.DEFENSE,
        });
      }
    }

    // Assert — exactly one map left, auto-assigned as decider, awaiting its side step
    expect(currentStep(state)?.kind).toBe("side");
    const summary = summarize(
      applyAction(state, {
        type: "side",
        mapId: currentStep(state)!.mapId!,
        team: currentStep(state)!.team,
        side: SIDE.ATTACK,
      }),
    );
    expect(summary.playedMaps.at(-1)?.pickedBy).toBe("decider");
  });

  it("BO5 with N=7 (minimum) has no trailing bans: ban,ban,pick,pick,pick,pick then decider", () => {
    // Arrange
    let state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO5, teamA: "A", teamB: "B", pool: pool(7) }),
    );
    const expectedPlan = [
      { kind: "ban", team: TEAM.A },
      { kind: "ban", team: TEAM.B },
      { kind: "pick", team: TEAM.A },
      { kind: "pick", team: TEAM.B },
      { kind: "pick", team: TEAM.A },
      { kind: "pick", team: TEAM.B },
    ];

    // Act
    for (const expected of expectedPlan) {
      const step = currentStep(state);
      expect(step?.kind).toBe(expected.kind);
      expect(step?.team).toBe(expected.team);

      const mapId = state.config.pool.find((id) => state.maps[id]?.status === "available")!;
      state = applyAction(state, {
        type: expected.kind as "ban" | "pick",
        mapId,
        team: expected.team,
      });
      if (expected.kind === "pick") {
        const sideStep = currentStep(state)!;
        state = applyAction(state, {
          type: "side",
          mapId: sideStep.mapId!,
          team: sideStep.team,
          side: SIDE.ATTACK,
        });
      }
    }

    // Assert
    expect(currentStep(state)?.kind).toBe("side");
    expect(isComplete(state)).toBe(false);
  });
});

describe("side selection rules", () => {
  it("assigns the pick's side choice to the opponent of the picking team", () => {
    // Arrange
    let state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO3, teamA: "A", teamB: "B", pool: pool(5) }),
    );
    state = applyAction(state, { type: "ban", mapId: "map-1", team: TEAM.A });
    state = applyAction(state, { type: "ban", mapId: "map-2", team: TEAM.B });

    // Act — A picks map-3
    state = applyAction(state, { type: "pick", mapId: "map-3", team: TEAM.A });

    // Assert — B (the opponent) chooses the side
    expect(currentStep(state)).toEqual({ kind: "side", team: TEAM.B, mapId: "map-3" });
  });

  it("assigns the decider's side choice to the team that did NOT make the last ban", () => {
    // Arrange
    let state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO1, teamA: "A", teamB: "B", pool: pool(3) }),
    );
    state = applyAction(state, { type: "ban", mapId: "map-1", team: TEAM.A });
    // Act — B makes the last ban
    state = applyAction(state, { type: "ban", mapId: "map-2", team: TEAM.B });

    // Assert — decider (map-3) side goes to A, since B made the last ban
    expect(currentStep(state)).toEqual({ kind: "side", team: TEAM.A, mapId: "map-3" });
  });
});

describe("applyAction rejects invalid actions", () => {
  it("rejects an action from the wrong team", () => {
    // Arrange
    const state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO1, teamA: "A", teamB: "B", pool: pool(2) }),
    );

    // Act
    const next = applyAction(state, { type: "ban", mapId: "map-1", team: TEAM.B });

    // Assert — no-op, same state
    expect(next).toBe(state);
  });

  it("rejects an action of the wrong kind", () => {
    // Arrange
    const state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO1, teamA: "A", teamB: "B", pool: pool(2) }),
    );

    // Act
    const next = applyAction(state, { type: "pick", mapId: "map-1", team: TEAM.A });

    // Assert
    expect(next).toBe(state);
  });

  it("rejects targeting a map that's no longer available", () => {
    // Arrange
    let state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO1, teamA: "A", teamB: "B", pool: pool(3) }),
    );
    state = applyAction(state, { type: "ban", mapId: "map-1", team: TEAM.A });

    // Act — B tries to ban the same, already-banned map
    const next = applyAction(state, { type: "ban", mapId: "map-1", team: TEAM.B });

    // Assert
    expect(next).toBe(state);
  });

  it("rejects a side action while a ban/pick step is expected", () => {
    // Arrange
    const state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO1, teamA: "A", teamB: "B", pool: pool(2) }),
    );

    // Act
    const next = applyAction(state, {
      type: "side",
      mapId: "map-1",
      team: TEAM.A,
      side: SIDE.ATTACK,
    });

    // Assert
    expect(next).toBe(state);
  });

  it("does nothing once the veto is complete", () => {
    // Arrange
    let state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO1, teamA: "A", teamB: "B", pool: pool(2) }),
    );
    state = applyAction(state, { type: "ban", mapId: "map-1", team: TEAM.A });
    state = applyAction(state, { type: "side", mapId: "map-2", team: TEAM.B, side: SIDE.ATTACK });
    expect(isComplete(state)).toBe(true);

    // Act
    const next = applyAction(state, { type: "ban", mapId: "map-1", team: TEAM.A });

    // Assert
    expect(next).toBe(state);
  });
});

describe("undo", () => {
  it("reverts the most recent action, including an auto-assigned decider", () => {
    // Arrange
    let state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO1, teamA: "A", teamB: "B", pool: pool(2) }),
    );
    const beforeBan = state;
    state = applyAction(state, { type: "ban", mapId: "map-1", team: TEAM.A });
    expect(currentStep(state)?.kind).toBe("side");

    // Act
    state = undo(state);

    // Assert — back to the pre-ban state (decider assignment undone too)
    expect(state.log).toEqual(beforeBan.log);
    expect(currentStep(state)).toEqual({ kind: "ban", team: TEAM.A });
  });

  it("is a no-op with empty history", () => {
    // Arrange
    const state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO1, teamA: "A", teamB: "B", pool: pool(2) }),
    );

    // Act
    const next = undo(state);

    // Assert
    expect(next).toBe(state);
  });

  it("supports undoing a side-selection step independently from the pick before it", () => {
    // Arrange
    let state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO3, teamA: "A", teamB: "B", pool: pool(5) }),
    );
    state = applyAction(state, { type: "ban", mapId: "map-1", team: TEAM.A });
    state = applyAction(state, { type: "ban", mapId: "map-2", team: TEAM.B });
    state = applyAction(state, { type: "pick", mapId: "map-3", team: TEAM.A });
    state = applyAction(state, { type: "side", mapId: "map-3", team: TEAM.B, side: SIDE.ATTACK });
    expect(currentStep(state)?.kind).toBe("pick");

    // Act
    state = undo(state);

    // Assert — the pick is still there, only the side choice was undone
    expect(state.maps["map-3"]?.status).toBe("picked");
    expect(state.maps["map-3"]?.side).toBeUndefined();
    expect(currentStep(state)).toEqual({ kind: "side", team: TEAM.B, mapId: "map-3" });
  });
});

describe("summarize", () => {
  it("returns ordered played maps (with sides) and bans", () => {
    // Arrange
    let state = requireVeto(
      createVeto({ format: VETO_FORMAT.BO1, teamA: "Red", teamB: "Blue", pool: pool(3) }),
    );
    state = applyAction(state, { type: "ban", mapId: "map-1", team: TEAM.A });
    state = applyAction(state, { type: "ban", mapId: "map-2", team: TEAM.B });
    state = applyAction(state, { type: "side", mapId: "map-3", team: TEAM.A, side: SIDE.DEFENSE });

    // Act
    const summary = summarize(state);

    // Assert
    expect(summary.bannedMaps).toEqual([
      { mapId: "map-1", by: TEAM.A },
      { mapId: "map-2", by: TEAM.B },
    ]);
    expect(summary.playedMaps).toEqual([
      { mapId: "map-3", pickedBy: "decider", side: { team: TEAM.A, side: SIDE.DEFENSE } },
    ]);
  });
});
