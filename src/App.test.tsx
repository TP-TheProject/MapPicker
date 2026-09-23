import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { App } from "@/App";
import { FALLBACK_MAPS } from "@/features/maps";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/features/maps", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/maps")>();
  return {
    ...actual,
    useMaps: () => ({
      data: { maps: actual.FALLBACK_MAPS, source: actual.MAP_SOURCE.API },
      isLoading: false,
    }),
  };
});

const [mapA, mapB] = FALLBACK_MAPS;

function seedTwoMapPool(): void {
  if (mapA === undefined || mapB === undefined) throw new Error("Fixture needs 2 fallback maps");
  window.localStorage.setItem("mappicker:pool", JSON.stringify([mapA.id, mapB.id]));
}

function switchMode(name: "Free" | "Veto"): void {
  fireEvent.click(screen.getAllByRole("radio", { name })[0] as HTMLElement);
}

function startVeto(): void {
  fireEvent.change(screen.getByLabelText("Team A name"), { target: { value: "Team A" } });
  fireEvent.change(screen.getByLabelText("Team B name"), { target: { value: "Team B" } });
  fireEvent.click(screen.getByRole("button", { name: "Start veto" }));
}

function poolButtons(): HTMLElement[] {
  return screen.getAllByRole("button", { name: /Maps/i });
}

describe("App", () => {
  it("locks the pool button during an active veto and re-enables it after reset, preserving veto state across a Free mode round-trip", async () => {
    // Arrange
    seedTwoMapPool();
    renderWithProviders(<App />);
    switchMode("Veto");
    await screen.findByRole("heading", { name: "Set up veto" });
    poolButtons().forEach((button) => expect(button).not.toBeDisabled());

    // Act — start the veto and ban the first map
    startVeto();
    const banButton = await screen.findByRole("button", { name: new RegExp(mapA!.name) });
    fireEvent.click(banButton);

    // Assert — the pool is now locked
    await waitFor(() => poolButtons().forEach((button) => expect(button).toBeDisabled()));

    // Act — round-trip through Free mode
    switchMode("Free");
    await screen.findByText(mapB!.name);
    switchMode("Veto");

    // Assert — the veto is still mid-flow (awaiting the decider's side choice), not reset
    expect(
      await screen.findByText(new RegExp(`starting side on ${mapB!.name}`, "i")),
    ).toBeInTheDocument();

    // Act — finish the veto and reset it
    fireEvent.click(screen.getByRole("button", { name: /Attack/ }));
    await screen.findByRole("heading", { name: "Match ready" });
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    const confirmDialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(confirmDialog).getByRole("button", { name: "Reset" }));

    // Assert — back to setup, and the pool button is unlocked again
    await screen.findByRole("heading", { name: "Set up veto" });
    poolButtons().forEach((button) => expect(button).not.toBeDisabled());
  });
});
