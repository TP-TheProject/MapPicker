import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VetoSetupForm } from "@/components/VetoSetupForm";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("VetoSetupForm", () => {
  it("calls onSubmit with the entered team names and format", async () => {
    // Arrange
    const onSubmit = vi.fn();
    renderWithProviders(<VetoSetupForm onSubmit={onSubmit} poolSize={2} />);

    // Act
    fireEvent.change(screen.getByLabelText("Team A name"), { target: { value: "Team A" } });
    fireEvent.change(screen.getByLabelText("Team B name"), { target: { value: "Team B" } });
    fireEvent.click(screen.getByRole("button", { name: "Start veto" }));

    // Assert
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { teamA: "Team A", teamB: "Team B", format: "bo1" },
        expect.anything(),
      ),
    );
  });

  it("rejects identical team names instead of calling onSubmit", async () => {
    // Arrange
    const onSubmit = vi.fn();
    renderWithProviders(<VetoSetupForm onSubmit={onSubmit} poolSize={2} />);

    // Act
    fireEvent.change(screen.getByLabelText("Team A name"), { target: { value: "Falcons" } });
    fireEvent.change(screen.getByLabelText("Team B name"), { target: { value: "falcons" } });
    fireEvent.click(screen.getByRole("button", { name: "Start veto" }));

    // Assert
    expect(await screen.findByText("Team names must be different")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
