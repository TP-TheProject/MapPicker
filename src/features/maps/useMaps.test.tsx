import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FALLBACK_MAPS } from "@/features/maps/fallback";
import { MAP_SOURCE } from "@/features/maps/types";
import { useMaps } from "@/features/maps/useMaps";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useMaps", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("falls back to the local map list when the fetch fails", async () => {
    // Arrange
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    // Act
    const { result } = renderHook(() => useMaps(), { wrapper });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.source).toBe(MAP_SOURCE.FALLBACK);
    expect(result.current.data?.maps).toEqual(FALLBACK_MAPS);
  });

  it("falls back when the API returns an empty map list", async () => {
    // Arrange
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 200, data: [] }),
      }),
    );

    // Act
    const { result } = renderHook(() => useMaps(), { wrapper });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.source).toBe(MAP_SOURCE.FALLBACK);
  });
});
