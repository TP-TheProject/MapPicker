import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TurnBanner } from "@/components/TurnBanner";
import { TEAM, VETO_STEP_KIND, type Team, type VetoStep } from "@/features/veto";
import { renderWithProviders } from "@/test/renderWithProviders";

function teamName(team: Team): string {
  return team === TEAM.A ? "Team A" : "Team B";
}

describe("TurnBanner", () => {
  it("announces the acting team and BAN for a ban step", () => {
    // Arrange
    const step: VetoStep = { kind: VETO_STEP_KIND.BAN, team: TEAM.A };

    // Act
    renderWithProviders(
      <TurnBanner step={step} teamName={teamName} onUndo={vi.fn()} canUndo={false} />,
    );

    // Assert
    expect(screen.getByText("Team A — BAN")).toBeInTheDocument();
  });

  it("announces the acting team and PICK for a pick step", () => {
    // Arrange
    const step: VetoStep = { kind: VETO_STEP_KIND.PICK, team: TEAM.B };

    // Act
    renderWithProviders(
      <TurnBanner step={step} teamName={teamName} onUndo={vi.fn()} canUndo={false} />,
    );

    // Assert
    expect(screen.getByText("Team B — PICK")).toBeInTheDocument();
  });

  it("announces the side-choice prompt with the map name for a side step", () => {
    // Arrange
    const step: VetoStep = { kind: VETO_STEP_KIND.SIDE, team: TEAM.A, mapId: "map-1" };

    // Act
    renderWithProviders(
      <TurnBanner
        step={step}
        teamName={teamName}
        mapName="Bind"
        onUndo={vi.fn()}
        canUndo={false}
      />,
    );

    // Assert
    expect(screen.getByText("Team A — choose side on Bind")).toBeInTheDocument();
  });

  it("disables Undo when there is nothing to undo", () => {
    // Arrange
    const step: VetoStep = { kind: VETO_STEP_KIND.BAN, team: TEAM.A };

    // Act
    renderWithProviders(
      <TurnBanner step={step} teamName={teamName} onUndo={vi.fn()} canUndo={false} />,
    );

    // Assert
    expect(screen.getByRole("button", { name: "Undo" })).toBeDisabled();
  });
});
