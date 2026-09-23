import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VetoSummary } from "@/components/VetoSummary";
import type { GameMap } from "@/features/maps";
import { SIDE, TEAM, VETO_FORMAT, type VetoSummary as VetoSummaryData } from "@/features/veto";
import { renderWithProviders } from "@/test/renderWithProviders";

const maps: GameMap[] = [
  {
    id: "map-1",
    name: "Bind",
    slug: "bind",
    splash: "/maps/bind.webp",
    banner: "/maps/bind.webp",
    tall: "/maps/bind.webp",
  },
  {
    id: "map-2",
    name: "Ascent",
    slug: "ascent",
    splash: "/maps/ascent.webp",
    banner: "/maps/ascent.webp",
    tall: "/maps/ascent.webp",
  },
];

const summary: VetoSummaryData = {
  format: VETO_FORMAT.BO1,
  teamA: "Team A",
  teamB: "Team B",
  playedMaps: [{ mapId: "map-1", pickedBy: "decider", side: { team: TEAM.A, side: SIDE.ATTACK } }],
  bannedMaps: [{ mapId: "map-2", by: TEAM.B }],
};

describe("VetoSummary", () => {
  it("renders the match title and picked map", () => {
    // Arrange & Act
    renderWithProviders(
      <VetoSummary
        summary={summary}
        maps={maps}
        onCopy={vi.fn()}
        onNewVeto={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByText("Match ready")).toBeInTheDocument();
    expect(screen.getByText("Bind")).toBeInTheDocument();
  });

  it("calls onCopy when the copy result button is clicked", () => {
    // Arrange
    const onCopy = vi.fn();
    renderWithProviders(
      <VetoSummary
        summary={summary}
        maps={maps}
        onCopy={onCopy}
        onNewVeto={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /Copy result/i }));

    // Assert
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("falls back to the raw map id when the map isn't present in the given map list", () => {
    // Arrange & Act — `maps` here stands in for a live selection that no longer includes map-1
    renderWithProviders(
      <VetoSummary
        summary={summary}
        maps={maps.filter((m) => m.id !== "map-1")}
        onCopy={vi.fn()}
        onNewVeto={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByText("map-1")).toBeInTheDocument();
  });

  it("resolves the picked map's name (not its raw id) when given the full map catalog", () => {
    // Arrange & Act
    renderWithProviders(
      <VetoSummary
        summary={summary}
        maps={maps}
        onCopy={vi.fn()}
        onNewVeto={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    // Assert
    expect(screen.getByText("Bind")).toBeInTheDocument();
    expect(screen.queryByText("map-1")).not.toBeInTheDocument();
  });

  it("calls onNewVeto when the new veto button is clicked", () => {
    // Arrange
    const onNewVeto = vi.fn();
    renderWithProviders(
      <VetoSummary
        summary={summary}
        maps={maps}
        onCopy={vi.fn()}
        onNewVeto={onNewVeto}
        onReset={vi.fn()}
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: "New veto" }));

    // Assert
    expect(onNewVeto).toHaveBeenCalledTimes(1);
  });
});
