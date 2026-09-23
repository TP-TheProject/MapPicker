import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PoolDialog } from "@/components/PoolDialog";
import type { GameMap } from "@/features/maps";
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

const MAPS = [map("map-1", "Ascent"), map("map-2", "Bind"), map("map-3", "Split")];

describe("PoolDialog", () => {
  it("discards a toggled checkbox when Cancel is clicked", () => {
    // Arrange
    const onApply = vi.fn();
    renderWithProviders(
      <PoolDialog maps={MAPS} selectedIds={["map-1", "map-2"]} onApply={onApply} open />,
    );

    // Act
    fireEvent.click(screen.getByRole("checkbox", { name: /Split/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // Assert
    expect(onApply).not.toHaveBeenCalled();
  });

  it("commits a toggled checkbox when Apply is clicked", () => {
    // Arrange
    const onApply = vi.fn();
    renderWithProviders(
      <PoolDialog maps={MAPS} selectedIds={["map-1", "map-2"]} onApply={onApply} open />,
    );

    // Act
    fireEvent.click(screen.getByRole("checkbox", { name: /Split/ }));
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    // Assert
    expect(onApply).toHaveBeenCalledWith(["map-1", "map-2", "map-3"]);
  });

  it("re-seeds the draft from the live selection each time the dialog re-opens", () => {
    // Arrange
    const onApply = vi.fn();
    const { rerender } = renderWithProviders(
      <PoolDialog maps={MAPS} selectedIds={["map-1", "map-2"]} onApply={onApply} open={false} />,
    );
    rerender(<PoolDialog maps={MAPS} selectedIds={["map-1", "map-2"]} onApply={onApply} open />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Split/ }));
    rerender(
      <PoolDialog maps={MAPS} selectedIds={["map-1", "map-2"]} onApply={onApply} open={false} />,
    );

    // Act — reopen without ever applying the earlier edit
    rerender(<PoolDialog maps={MAPS} selectedIds={["map-1", "map-2"]} onApply={onApply} open />);

    // Assert
    expect(screen.getByRole("checkbox", { name: /Split/ })).not.toBeChecked();
  });

  it("disables Apply when the draft drops below the minimum selection", () => {
    // Arrange
    const onApply = vi.fn();
    renderWithProviders(
      <PoolDialog maps={MAPS} selectedIds={["map-1", "map-2"]} onApply={onApply} open />,
    );

    // Act
    fireEvent.click(screen.getByRole("checkbox", { name: /Ascent/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Bind/ }));

    // Assert
    expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
  });

  it("disables the trigger and never opens when locked", () => {
    // Arrange
    const onOpenChange = vi.fn();
    renderWithProviders(
      <PoolDialog
        maps={MAPS}
        selectedIds={["map-1", "map-2"]}
        onApply={vi.fn()}
        open={false}
        onOpenChange={onOpenChange}
        locked
      />,
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /Maps/i }));

    // Assert
    expect(screen.getByRole("button", { name: /Maps/i })).toBeDisabled();
    expect(screen.queryByText("Map pool")).not.toBeInTheDocument();
  });
});
