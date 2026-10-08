import { careerStats } from "../data/kohliData.ts";
import { DEFINING_INNINGS_DATA } from "../data/definingInningsData.ts";
import artifact from "../data/derived/kohliAnalyticsArtifact.json" with { type: "json" };
import type { DefiningInnings } from "../types";

export const pages = [
  "overview",
  "story",
  "club",
  "ipl",
  "discover",
  "career",
  "pressure",
  "compare",
  "innings",
  "sources",
] as const;
export type Page = (typeof pages)[number];
export const formats = ["ALL", "ODI", "Test", "T20I", "IPL"] as const;
export type FormatScope = (typeof formats)[number];
export const statsByFormat = {
  ALL: careerStats.overall,
  ODI: careerStats.odi,
  Test: careerStats.test,
  T20I: careerStats.t20i,
  IPL: careerStats.ipl,
};
export const coverage = artifact.coverage;
export const archive = artifact;
export const formatLabel = (format: FormatScope) =>
  format === "ALL" ? "All international" : format;
export const formatCutoffs: Record<FormatScope, string> = {
  ALL: "Senior career totals (ODI: 3 Oct 2026 · Test: 3 Jan 2025 · T20I: 29 Jun 2024) · excludes IPL",
  ODI: "Career totals through 3 Oct 2026 (305 inngs) · Archive: 303 inngs through 3 Oct 2026 (99.3% coverage)",
  Test: "Career totals through 3 Jan 2025 (210 inngs) · Delivery archive not included",
  T20I: "Career totals through 29 Jun 2024 (117 inngs) · Archive: 112 inngs through 29 Jun 2024 (95.7% coverage)",
  IPL: "19 seasons (2008–2026) · Stored archive: 275 inngs through 31 May 2026",
};
export const formatArchiveCutoffs: Record<FormatScope, string> = {
  ALL: "Archive: 303 ODI + 112 T20I + 275 IPL innings",
  ODI: "Archive: 303 of 305 career innings (through 3 Oct 2026)",
  Test: "Delivery archive not included",
  T20I: "Archive: 112 of 117 career innings (through 29 Jun 2024)",
  IPL: "Archive: 275 innings (through 31 May 2026)",
};
export interface ViewState {
  page: Page;
  format: FormatScope;
  query: string;
  year: string;
  result: string;
  saved: boolean;
  focusA?: string;
  focusB?: string;
  left?: string;
  right?: string;
  chapter?: string;
  era?: string;
  match?: string;
  collection?: string;
  players?: string;
  metric?: string;
  opponent?: string;
  venue?: string;
  situation?: string;
  minRuns?: string;
}
export function readView(hash: string): ViewState {
  const [path, search = ""] = hash.replace(/^#\/?/, "").split("?");
  const params = new URLSearchParams(search);
  const page = pages.includes(path as Page) ? (path as Page) : "overview";
  let format = formats.includes(params.get("format") as FormatScope)
    ? (params.get("format") as FormatScope)
    : "ALL";
  if (page === "pressure" && (format === "ALL" || format === "IPL"))
    format = "ODI";
  if (page === "compare" && (format === "ALL" || format === "IPL"))
    format = "ODI";
  return {
    ...Object.fromEntries(
      [
        "focusA",
        "focusB",
        "left",
        "right",
        "chapter",
        "era",
        "match",
        "collection",
        "opponent",
        "venue",
        "situation",
        "minRuns",
        "players",
        "metric",
      ]
        .filter((k) => params.has(k))
        .map((k) => [k, params.get(k)!]),
    ),
    page,
    format,
    query: params.get("q") || "",
    year: params.get("year") || "",
    result: params.get("result") || "",
    saved: params.get("saved") === "1",
  };
}
export function viewHash(view: ViewState): string {
  const p = new URLSearchParams({ format: view.format });
  if (view.query) p.set("q", view.query);
  if (view.year) p.set("year", view.year);
  if (view.result) p.set("result", view.result);
  if (view.saved) p.set("saved", "1");
  for (const key of [
    "focusA",
    "focusB",
    "left",
    "right",
    "chapter",
    "era",
    "match",
    "collection",
    "opponent",
    "venue",
    "situation",
    "minRuns",
    "players",
    "metric",
  ] as const)
    if (view[key]) p.set(key, view[key]);
  return `#/${view.page}?${p}`;
}
export function filterInnings(
  view: ViewState,
  saved: string[] = [],
): DefiningInnings[] {
  return DEFINING_INNINGS_DATA.filter(
    (i) =>
      (view.format === "ALL" || i.format === view.format) &&
      (!view.year || i.date.startsWith(view.year)) &&
      (!view.result || i.inningsResult === view.result) &&
      (!view.saved || saved.includes(i.id)) &&
      `${i.title} ${i.opponent} ${i.venue} ${i.tournament}`
        .toLowerCase()
        .includes(view.query.trim().toLowerCase()),
  ).sort((a, b) => b.date.localeCompare(a.date));
}
export function csvRows(rows: DefiningInnings[]) {
  const cell = (value: unknown) => `"${String(value).replace(/"/g, '""')}"`;
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
        "Strike rate",
        "Result",
        "Source",
      ],
      ...rows.map((i) => [
        i.date,
        i.format,
        i.opponent,
        i.venue,
        i.runs,
        i.notOut,
        i.ballsFaced,
        i.strikeRate,
        i.inningsResult,
        i.sourceUrl,
      ]),
    ]
      .map((r) => r.map(cell).join(","))
      .join("\r\n")
  );
}
export const number = (value: number, decimals = 0) =>
  value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
export const displayDate = (date: string) =>
  new Date(date + (date.length === 10 ? "T12:00:00Z" : "")).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
  );
