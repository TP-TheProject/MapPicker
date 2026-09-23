import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FreeMapCard } from "@/components/FreeMapCard";
import type { GameMap } from "@/features/maps";
import { renderWithProviders } from "@/test/renderWithProviders";

const map: GameMap = {
  id: "map-1",
  name: "Ascent",
  slug: "ascent",
  splash: "/maps/ascent.webp",
  banner: "/maps/ascent.webp",
  tall: "/maps/ascent.webp",
};

describe("FreeMapCard", () => {
  it("renders the map name and available state", () => {
    // Arrange & Act
    renderWithProviders(
      <FreeMapCard map={map} cell={{ status: "available" }} onPick={vi.fn()} onBan={vi.fn()} />,
    );

    // Assert
    expect(screen.getByText("Ascent")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("shows the pick order badge when picked", () => {
    // Arrange & Act
    renderWithProviders(
      <FreeMapCard
        map={map}
        cell={{ status: "picked", order: 2 }}
        onPick={vi.fn()}
        onBan={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Picked #2")).toBeInTheDocument();
  });

  it("shows the banned label when banned", () => {
    // Arrange & Act
    renderWithProviders(
      <FreeMapCard map={map} cell={{ status: "banned" }} onPick={vi.fn()} onBan={vi.fn()} />,
    );

    // Assert
    expect(screen.getAllByText("BANNED").length).toBeGreaterThan(0);
  });

  it("calls onPick when the card is clicked", () => {
    // Arrange
    const onPick = vi.fn();
    renderWithProviders(
      <FreeMapCard map={map} cell={{ status: "available" }} onPick={onPick} onBan={vi.fn()} />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { pressed: false }));

    // Assert
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it("calls onBan when the Ban button is clicked, without triggering onPick", () => {
    // Arrange
    const onPick = vi.fn();
    const onBan = vi.fn();
    renderWithProviders(
      <FreeMapCard map={map} cell={{ status: "available" }} onPick={onPick} onBan={onBan} />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "Ban Ascent" }));

    // Assert
    expect(onBan).toHaveBeenCalledTimes(1);
    expect(onPick).not.toHaveBeenCalled();
  });

  it("calls onBan when 'b' is pressed on the focused card", () => {
    // Arrange
    const onBan = vi.fn();
    renderWithProviders(
      <FreeMapCard map={map} cell={{ status: "available" }} onPick={vi.fn()} onBan={onBan} />,
    );

    // Act
    fireEvent.keyDown(screen.getByRole("button", { pressed: false }), { key: "b" });

    // Assert
    expect(onBan).toHaveBeenCalledTimes(1);
  });
});
