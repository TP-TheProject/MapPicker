import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useFreeMode } from "@/features/free/useFreeMode";

describe("useFreeMode", () => {
  it("syncs cells when the pool's map ids change", () => {
    // Arrange
    const { result, rerender } = renderHook(({ mapIds }) => useFreeMode(mapIds), {
      initialProps: { mapIds: ["m1", "m2"] },
    });
    act(() => result.current.pick("m1"));
    expect(result.current.state.cells.m1).toEqual({ status: "picked", order: 1 });

    // Act — the pool gains a map and loses another
    rerender({ mapIds: ["m1", "m3"] });

    // Assert
    expect(result.current.state.cells).toEqual({
      m1: { status: "picked", order: 1 },
      m3: { status: "available" },
    });
  });

  it("does not dispatch a sync when the id list is unchanged across renders", () => {
    // Arrange
    const { result, rerender } = renderHook(({ mapIds }) => useFreeMode(mapIds), {
      initialProps: { mapIds: ["m1", "m2"] },
    });
    act(() => result.current.pick("m1"));
    const stateAfterPick = result.current.state;

    // Act — same ids, new array identity
    rerender({ mapIds: ["m1", "m2"] });

    // Assert — untouched, no history-clearing sync happened
    expect(result.current.state).toBe(stateAfterPick);
  });
});
