import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppHeader } from "@/components/AppHeader";
import { APP_MODE } from "@/config/modes";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("AppHeader", () => {
  it("switches visible strings to Portuguese when PT is selected", () => {
    // Arrange
    renderWithProviders(
      <AppHeader
        mode={APP_MODE.FREE}
        onModeChange={vi.fn()}
        maps={[]}
        selectedPoolIds={[]}
        onApplyPool={vi.fn()}
        poolOpen={false}
        onPoolOpenChange={vi.fn()}
        poolLocked={false}
      />,
    );
    expect(screen.getAllByText("Free")[0]).toBeInTheDocument();

    // Act
    fireEvent.click(screen.getAllByRole("radio", { name: "PT" })[0] as HTMLElement);

    // Assert
    expect(screen.getAllByText("Livre")[0]).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("pt");
  });

  it("calls onModeChange when the Veto toggle is selected", () => {
    // Arrange
    const onModeChange = vi.fn();
    renderWithProviders(
      <AppHeader
        mode={APP_MODE.FREE}
        onModeChange={onModeChange}
        maps={[]}
        selectedPoolIds={[]}
        onApplyPool={vi.fn()}
        poolOpen={false}
        onPoolOpenChange={vi.fn()}
        poolLocked={false}
      />,
    );

    // Act
    fireEvent.click(screen.getAllByRole("radio", { name: "Veto" })[0] as HTMLElement);

    // Assert
    expect(onModeChange).toHaveBeenCalledWith(APP_MODE.VETO);
  });

  it("disables the pool button while a veto is locked", () => {
    // Arrange
    renderWithProviders(
      <AppHeader
        mode={APP_MODE.VETO}
        onModeChange={vi.fn()}
        maps={[]}
        selectedPoolIds={[]}
        onApplyPool={vi.fn()}
        poolOpen={false}
        onPoolOpenChange={vi.fn()}
        poolLocked
      />,
    );

    // Act — nothing, static render

    // Assert
    expect(screen.getAllByRole("button", { name: /Maps/i })[0]).toBeDisabled();
  });
});
