import { useState } from "react";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VetoBoard } from "@/components/VetoBoard";
import type { GameMap } from "@/features/maps";
import { useVeto } from "@/features/veto";
import { renderWithProviders } from "@/test/renderWithProviders";

function map(id: string, name: string): GameMap {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    splash: `/maps/${name.toLowerCase()}.webp`,
    banner: `/maps/${name.toLowerCase()}.webp`,
    tall: `/maps/${name.toLowerCase()}.webp`,
  };
}

const ALL_MAPS = [map("map-1", "Ascent"), map("map-2", "Bind"), map("map-3", "Split")];

/** Mirrors how `App` wires `VetoBoard`: a live, shrinkable pool alongside a stable full catalog. */
function Harness() {
  const veto = useVeto();
  const [pool, setPool] = useState<GameMap[]>(ALL_MAPS.slice(0, 2));

  return (
    <>
      <button type="button" onClick={() => setPool([])}>
        shrink pool
      </button>
      <VetoBoard pool={pool} allMaps={ALL_MAPS} veto={veto} />
    </>
  );
}

async function startVeto(): Promise<void> {
  fireEvent.change(screen.getByLabelText("Team A name"), { target: { value: "Team A" } });
  fireEvent.change(screen.getByLabelText("Team B name"), { target: { value: "Team B" } });
  fireEvent.click(screen.getByRole("button", { name: "Start veto" }));
  await screen.findByRole("button", { name: /Ascent/ });
}

describe("VetoBoard", () => {
  it("keeps rendering the veto's own maps by name after the live pool shrinks mid-veto", async () => {
    // Arrange
    renderWithProviders(<Harness />);
    await startVeto();
    fireEvent.click(screen.getByRole("button", { name: /Ascent/ }));

    // Act — the pool the user could still edit elsewhere in the app collapses to empty
    fireEvent.click(screen.getByRole("button", { name: "shrink pool" }));

    // Assert — grid still resolves both maps from the full catalog, not the live (now-empty) pool
    expect(screen.getByText("Ascent")).toBeInTheDocument();
    expect(screen.getByText("Bind")).toBeInTheDocument();
  });

  it("resolves map names (not raw ids) in the summary even after the live pool shrinks", async () => {
    // Arrange
    renderWithProviders(<Harness />);
    await startVeto();
    fireEvent.click(screen.getByRole("button", { name: /Ascent/ }));
    fireEvent.click(screen.getByRole("button", { name: "shrink pool" }));

    // Act — B (opponent of the last ban) chooses the decider's side, completing the BO1 veto
    fireEvent.click(screen.getByRole("button", { name: /Attack/ }));

    // Assert
    expect(screen.getByRole("heading", { name: "Match ready" })).toBeInTheDocument();
    expect(screen.getAllByText("Bind").length).toBeGreaterThan(0);
    expect(screen.queryByText("map-2")).not.toBeInTheDocument();
  });
});
