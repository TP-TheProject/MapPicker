import { SIDE, TEAM, type Side, type Team, type VetoSummary } from "@/features/veto/types";

interface SummaryMapLike {
  id: string;
  name: string;
}

type SupportedLanguage = "pt" | "en";

const LABELS: Record<
  SupportedLanguage,
  {
    title: (format: string) => string;
    versus: (teamA: string, teamB: string) => string;
    bans: string;
    picks: string;
    decider: string;
    startsOn: (team: string, side: string) => string;
    team: (name: string) => string;
    side: Record<Side, string>;
  }
> = {
  en: {
    title: (format) => `MapPicker — ${format.toUpperCase()}`,
    versus: (teamA, teamB) => `${teamA} vs ${teamB}`,
    bans: "Bans",
    picks: "Picks",
    decider: "Decider",
    startsOn: (team, side) => `${team} starts on ${side}`,
    team: (name) => name,
    side: { [SIDE.ATTACK]: "Attack", [SIDE.DEFENSE]: "Defense" },
  },
  pt: {
    title: (format) => `MapPicker — ${format.toUpperCase()}`,
    versus: (teamA, teamB) => `${teamA} vs ${teamB}`,
    bans: "Banimentos",
    picks: "Escolhas",
    decider: "Decisivo",
    startsOn: (team, side) => `${team} começa no lado ${side}`,
    team: (name) => name,
    side: { [SIDE.ATTACK]: "Ataque", [SIDE.DEFENSE]: "Defesa" },
  },
};

function teamName(team: Team, summary: VetoSummary): string {
  return team === TEAM.A ? summary.teamA : summary.teamB;
}

function mapName(mapId: string, maps: SummaryMapLike[]): string {
  return maps.find((map) => map.id === mapId)?.name ?? mapId;
}

/** Renders a veto summary as plain text, suitable for pasting into Discord. */
export function formatSummary(
  summary: VetoSummary,
  maps: SummaryMapLike[],
  lang: SupportedLanguage,
): string {
  const t = LABELS[lang];
  const lines: string[] = [];

  lines.push(t.title(summary.format));
  lines.push(t.versus(summary.teamA, summary.teamB));
  lines.push("");

  if (summary.bannedMaps.length > 0) {
    lines.push(`${t.bans}:`);
    for (const ban of summary.bannedMaps) {
      lines.push(`- ${mapName(ban.mapId, maps)} (${teamName(ban.by, summary)})`);
    }
    lines.push("");
  }

  lines.push(`${t.picks}:`);
  for (const played of summary.playedMaps) {
    const pickedByLabel =
      played.pickedBy === "decider" ? t.decider : teamName(played.pickedBy, summary);
    const sideText = played.side
      ? ` — ${t.startsOn(teamName(played.side.team, summary), t.side[played.side.side])}`
      : "";
    lines.push(`- ${mapName(played.mapId, maps)} (${pickedByLabel})${sideText}`);
  }

  return lines.join("\n");
}
