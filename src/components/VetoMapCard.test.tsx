import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VetoMapCard } from "@/components/VetoMapCard";
import type { GameMap } from "@/features/maps";
import { MAP_VETO_STATUS } from "@/features/veto";
import { renderWithProviders } from "@/test/renderWithProviders";

const map: GameMap = {
  id: "map-1",
  name: "Ascent",
  slug: "ascent",
  splash: "/maps/ascent.webp",
  banner: "/maps/ascent.webp",
  tall: "/maps/ascent.webp",
};

describe("VetoMapCard", () => {
  it("calls onSelect when clickable", () => {
    // Arrange
    const onSelect = vi.fn();
    renderWithProviders(
      <VetoMapCard
        map={map}
        mapState={{ status: MAP_VETO_STATUS.AVAILABLE }}
        teamA="Team A"
        teamB="Team B"
        clickable
        onSelect={onSelect}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /Ascent/ }));

    // Assert
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("does not call onSelect when not clickable, and renders no 'not your turn' tooltip", () => {
    // Arrange
    const onSelect = vi.fn();
    renderWithProviders(
      <VetoMapCard
        map={map}
        mapState={{ status: MAP_VETO_STATUS.AVAILABLE }}
        teamA="Team A"
        teamB="Team B"
        clickable={false}
        onSelect={onSelect}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /Ascent/ }));

    // Assert
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByText("Wait for your turn")).not.toBeInTheDocument();
  });
});
