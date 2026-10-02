import { groupArchive, summarize, type ArchiveInnings } from "./insights.ts";
export const lenses = [
  { id: "all", name: "Every innings", hint: "The complete selected archive" },
  { id: "chases", name: "Chases won", hint: "Batting second in a team win" },
  {
    id: "centuries",
    name: "Hundred club",
    hint: "Every covered score of 100+",
  },
  {
    id: "rapid",
    name: "Fast fifties",
    hint: "50+ runs at a strike rate of 150+",
  },
  {
    id: "gems",
    name: "Unsung innings",
    hint: "50+ in a win, without Player of the Match",
  },
  {
    id: "saved",
    name: "Your collection",
    hint: "Innings saved on this device",
  },
] as const;
export function applyLens(
  rows: ArchiveInnings[],
  lens: string,
  saved: string[] = [],
) {
  return rows.filter((r) =>
    lens === "chases"
      ? r.innings === 2 && r.result === "won"
      : lens === "centuries"
        ? r.runs >= 100
        : lens === "rapid"
          ? r.runs >= 50 && r.balls > 0 && r.runs / r.balls >= 1.5
          : lens === "gems"
            ? r.runs >= 50 && r.result === "won" && !r.playerOfMatch
            : lens === "saved"
              ? saved.includes("archive-" + r.id)
              : true,
  );
}
export const scoreTone = (runs: number) =>
  runs >= 100 ? "hundred" : runs >= 50 ? "fifty" : runs >= 30 ? "start" : "low";
export function recentForm(rows: ArchiveInnings[], count = 20) {
  const recent = [...rows]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, count);
  return { rows: recent, stats: summarize(recent) };
}
export function seasonGroups(rows: ArchiveInnings[]) {
  return groupArchive(rows, "year");
}
export function shortOpponent(name: string) {
  const map: Record<string, string> = {
    "Royal Challengers Bangalore": "RCB",
    "Chennai Super Kings": "CSK",
    "Mumbai Indians": "MI",
    "Kolkata Knight Riders": "KKR",
    "Delhi Capitals": "DC",
    "Delhi Daredevils": "DD",
    "Kings XI Punjab": "KXIP",
    "Punjab Kings": "PBKS",
    "Sunrisers Hyderabad": "SRH",
    "Deccan Chargers": "DCG",
    "Rajasthan Royals": "RR",
    "Gujarat Titans": "GT",
    "Gujarat Lions": "GL",
    "Lucknow Super Giants": "LSG",
    "Pune Warriors": "PWI",
    "Rising Pune Supergiant": "RPS",
    "Rising Pune Supergiants": "RPS",
    "Kochi Tuskers Kerala": "KTK",
    "South Africa": "SA",
    "New Zealand": "NZ",
    "West Indies": "WI",
    "Sri Lanka": "SL",
    Australia: "AUS",
    Pakistan: "PAK",
    England: "ENG",
    Bangladesh: "BAN",
  };
  return map[name] || name.slice(0, 3).toUpperCase();
}
