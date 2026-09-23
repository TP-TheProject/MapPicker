import type { Team } from "@/features/veto";

interface AppBackgroundProps {
  /** Current acting team during veto — tints the ambient glow subtly. Ambient-only, never the sole turn signal. */
  activeTeam?: Team;
}

/** Fixed, CSS-only backdrop: base color + layered radial gradients + faint inline noise. */
export function AppBackground({ activeTeam }: AppBackgroundProps) {
  return <div aria-hidden="true" className="app-background" data-team={activeTeam} />;
}
