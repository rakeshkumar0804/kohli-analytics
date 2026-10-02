import index from "./inningsIndex.json" with { type: "json" };
import ipl from "./iplIndex.json" with { type: "json" };
import type { FormatScope } from "./model";
export type ArchiveInnings = (typeof index.innings)[number];
export const inningsIndex: ArchiveInnings[] = [
  ...index.innings,
  ...ipl.innings,
].sort((a, b) => b.date.localeCompare(a.date));
export const iplArchive = ipl;
export const bowlerMatchups = { ...index.matchups, IPL: ipl.matchups };
export interface ArchiveFilters {
  format?: FormatScope;
  includeIPL?: boolean;
  query?: string;
  year?: string;
  result?: string;
  opponent?: string;
  venue?: string;
  situation?: string;
  minRuns?: number;
}
export function selectArchive(f: ArchiveFilters): ArchiveInnings[] {
  return inningsIndex.filter(
    (i) =>
      (!f.format || f.format === "ALL"
        ? f.includeIPL || i.format !== "IPL"
        : i.format === f.format) &&
      (!f.query ||
        `${i.opponent} ${i.venue} ${i.event} ${i.date}`
          .toLowerCase()
          .includes(f.query.trim().toLowerCase())) &&
      (!f.year || i.date.startsWith(f.year)) &&
      (!f.result || i.result === f.result) &&
      (!f.opponent || i.opponent === f.opponent) &&
      (!f.venue || i.venue === f.venue) &&
      (!f.situation ||
        (f.situation === "chase" ? i.innings === 2 : i.innings === 1)) &&
      (f.minRuns === undefined || i.runs >= f.minRuns),
  );
}
export function summarize(rows: ArchiveInnings[]) {
  const runs = rows.reduce((s, i) => s + i.runs, 0),
    balls = rows.reduce((s, i) => s + i.balls, 0),
    outs = rows.filter((i) => !i.notOut).length;
  const fours = rows.reduce((s, i) => s + i.fours, 0),
    sixes = rows.reduce((s, i) => s + i.sixes, 0);
  return {
    innings: rows.length,
    runs,
    balls,
    outs,
    notOuts: rows.length - outs,
    average: outs ? runs / outs : null,
    strikeRate: balls ? (runs / balls) * 100 : null,
    centuries: rows.filter((i) => i.runs >= 100).length,
    fifties: rows.filter((i) => i.runs >= 50 && i.runs < 100).length,
    fours,
    sixes,
    boundaryRuns: fours * 4 + sixes * 6,
    won: rows.filter((i) => i.result === "won").length,
    highest: rows.length ? Math.max(...rows.map((i) => i.runs)) : null,
  };
}
export function groupArchive(
  rows: ArchiveInnings[],
  key: "year" | "opponent" | "venue" | "result" | "situation",
) {
  const groups = new Map<string, ArchiveInnings[]>();
  for (const r of rows) {
    const label =
      key === "year"
        ? r.date.slice(0, 4)
        : key === "situation"
          ? r.innings === 2
            ? "Chasing"
            : "Batting first"
          : r[key];
    groups.set(label, [...(groups.get(label) || []), r]);
  }
  return [...groups]
    .map(([label, innings]) => ({ label, ...summarize(innings) }))
    .sort((a, b) =>
      key === "year" ? a.label.localeCompare(b.label) : b.runs - a.runs,
    );
}
export function archiveCsv(rows: ArchiveInnings[]) {
  const quote = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  return (
    "\ufeff" +
    [
      [
        "Date",
        "Format",
        "Opponent",
        "Venue",
        "Runs",
        "Not out",
        "Balls",
        "Fours",
        "Sixes",
        "Result",
        "Cricsheet match ID",
      ],
      ...rows.map((i) => [
        i.date,
        i.format,
        i.opponent,
        i.venue,
        i.runs,
        i.notOut,
        i.balls,
        i.fours,
        i.sixes,
        i.result,
        i.id,
      ]),
    ]
      .map((r) => r.map(quote).join(","))
      .join("\r\n")
  );
}
