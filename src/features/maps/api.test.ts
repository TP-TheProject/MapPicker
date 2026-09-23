import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchMaps } from "@/features/maps/api";

function jsonResponse(body: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(body),
  } as Response;
}

const STANDARD_MAP = {
  uuid: "id-1",
  displayName: "Ascent",
  splash: "https://example.com/ascent-splash.png",
  listViewIcon: "https://example.com/ascent-banner.png",
  listViewIconTall: "https://example.com/ascent-tall.png",
  tacticalDescription: "A tactical map.",
};

const NON_STANDARD_MAP = {
  uuid: "id-2",
  displayName: "The Range",
  splash: "https://example.com/range.png",
  listViewIcon: "https://example.com/range-banner.png",
  listViewIconTall: "https://example.com/range-tall.png",
  tacticalDescription: null,
};

describe("fetchMaps", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps only maps with a tactical description, sorted alphabetically", async () => {
    // Arrange
    const zMap = { ...STANDARD_MAP, uuid: "id-3", displayName: "Zephyr" };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ status: 200, data: [zMap, STANDARD_MAP, NON_STANDARD_MAP] }),
        ),
    );

    // Act
    const maps = await fetchMaps();

    // Assert
    expect(maps.map((m) => m.name)).toEqual(["Ascent", "Zephyr"]);
  });

  it("dedupes by display name", async () => {
    // Arrange
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ status: 200, data: [STANDARD_MAP, STANDARD_MAP] })),
    );

    // Act
    const maps = await fetchMaps();

    // Assert
    expect(maps).toHaveLength(1);
  });

  it("throws when the response is not ok", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, false)));

    // Act & Assert
    await expect(fetchMaps()).rejects.toThrow();
  });

  it("throws when the response fails validation", async () => {
    // Arrange
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ status: 200, data: "not-an-array" })),
    );

    // Act & Assert
    await expect(fetchMaps()).rejects.toThrow();
  });
});
