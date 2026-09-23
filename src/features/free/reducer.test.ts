import { describe, expect, it } from "vitest";

import { createInitialFreeModeState, freeModeReducer } from "@/features/free/reducer";
import { FREE_MODE_ACTION } from "@/features/free/types";

const MAP_IDS = ["m1", "m2", "m3"];

describe("freeModeReducer", () => {
  it("starts every map as available", () => {
    // Arrange
    const state = createInitialFreeModeState(MAP_IDS);

    // Act — nothing, initial state

    // Assert
    expect(Object.values(state.cells)).toEqual([
      { status: "available" },
      { status: "available" },
      { status: "available" },
    ]);
  });

  it("picking an available map marks it picked with order 1", () => {
    // Arrange
    const state = createInitialFreeModeState(MAP_IDS);

    // Act
    const next = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m1" });

    // Assert
    expect(next.cells.m1).toEqual({ status: "picked", order: 1 });
  });

  it("picking a second map assigns the next order", () => {
    // Arrange
    let state = createInitialFreeModeState(MAP_IDS);
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m1" });

    // Act
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m2" });

    // Assert
    expect(state.cells.m2).toEqual({ status: "picked", order: 2 });
  });

  it("re-picking a picked map returns it to available and renumbers remaining picks", () => {
    // Arrange
    let state = createInitialFreeModeState(MAP_IDS);
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m1" });
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m2" });

    // Act — undo the pick on m1 (the first pick)
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m1" });

    // Assert
    expect(state.cells.m1).toEqual({ status: "available" });
    expect(state.cells.m2).toEqual({ status: "picked", order: 1 });
  });

  it("banning an available map marks it banned", () => {
    // Arrange
    const state = createInitialFreeModeState(MAP_IDS);

    // Act
    const next = freeModeReducer(state, { type: FREE_MODE_ACTION.BAN, mapId: "m1" });

    // Assert
    expect(next.cells.m1).toEqual({ status: "banned" });
  });

  it("banning a picked map bans it and renumbers remaining picks", () => {
    // Arrange
    let state = createInitialFreeModeState(MAP_IDS);
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m1" });
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m2" });

    // Act
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.BAN, mapId: "m1" });

    // Assert
    expect(state.cells.m1).toEqual({ status: "banned" });
    expect(state.cells.m2).toEqual({ status: "picked", order: 1 });
  });

  it("banning a banned map returns it to available", () => {
    // Arrange
    let state = createInitialFreeModeState(MAP_IDS);
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.BAN, mapId: "m1" });

    // Act
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.BAN, mapId: "m1" });

    // Assert
    expect(state.cells.m1).toEqual({ status: "available" });
  });

  it("picking a banned map is a no-op", () => {
    // Arrange
    let state = createInitialFreeModeState(MAP_IDS);
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.BAN, mapId: "m1" });

    // Act
    const next = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m1" });

    // Assert
    expect(next).toBe(state);
  });

  it("undo reverts the last action", () => {
    // Arrange
    let state = createInitialFreeModeState(MAP_IDS);
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m1" });

    // Act
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.UNDO });

    // Assert
    expect(state.cells.m1).toEqual({ status: "available" });
    expect(state.history).toHaveLength(0);
  });

  it("undo with empty history is a no-op", () => {
    // Arrange
    const state = createInitialFreeModeState(MAP_IDS);

    // Act
    const next = freeModeReducer(state, { type: FREE_MODE_ACTION.UNDO });

    // Assert
    expect(next).toBe(state);
  });

  it("sync_pool adds a newly added map as available, keeping existing cells", () => {
    // Arrange
    let state = createInitialFreeModeState(MAP_IDS);
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m1" });

    // Act
    state = freeModeReducer(state, {
      type: FREE_MODE_ACTION.SYNC_POOL,
      mapIds: [...MAP_IDS, "m4"],
    });

    // Assert
    expect(state.cells.m1).toEqual({ status: "picked", order: 1 });
    expect(state.cells.m4).toEqual({ status: "available" });
  });

  it("sync_pool drops a removed map and renumbers the remaining picks", () => {
    // Arrange
    let state = createInitialFreeModeState(MAP_IDS);
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m1" });
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m2" });

    // Act — m1 (the first pick) is removed from the pool
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.SYNC_POOL, mapIds: ["m2", "m3"] });

    // Assert
    expect(state.cells).toEqual({
      m2: { status: "picked", order: 1 },
      m3: { status: "available" },
    });
  });

  it("sync_pool clears undo history", () => {
    // Arrange
    let state = createInitialFreeModeState(MAP_IDS);
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m1" });
    expect(state.history).toHaveLength(1);

    // Act
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.SYNC_POOL, mapIds: MAP_IDS });

    // Assert
    expect(state.history).toHaveLength(0);
  });

  it("sync_pool with an unchanged id set leaves cells equivalent", () => {
    // Arrange
    let state = createInitialFreeModeState(MAP_IDS);
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m1" });

    // Act
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.SYNC_POOL, mapIds: MAP_IDS });

    // Assert
    expect(state.cells).toEqual({
      m1: { status: "picked", order: 1 },
      m2: { status: "available" },
      m3: { status: "available" },
    });
  });

  it("reset clears all state back to available", () => {
    // Arrange
    let state = createInitialFreeModeState(MAP_IDS);
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.PICK, mapId: "m1" });
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.BAN, mapId: "m2" });

    // Act
    state = freeModeReducer(state, { type: FREE_MODE_ACTION.RESET, mapIds: MAP_IDS });

    // Assert
    expect(Object.values(state.cells).every((cell) => cell.status === "available")).toBe(true);
    expect(state.history).toHaveLength(0);
  });
});
