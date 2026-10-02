import { inningsIndex, type ArchiveInnings } from "./insights.ts";
export type Checkpoint = {
  over: number;
  runs: number;
  balls: number;
  teamRuns: number;
  wickets: number;
};
export type InningsDetailData = {
  progress: Checkpoint[];
  bowlers: {
    name: string;
    runs: number;
    balls: number;
    outs: number;
    dots: number;
    fours: number;
    sixes: number;
  }[];
};
export function resolvePair(
  left?: string,
  right?: string,
): [ArchiveInnings, ArchiveInnings] {
  const a =
    inningsIndex.find((i) => i.id === left) ||
    inningsIndex.find((i) => i.id === "1298150")!;
  const b =
    inningsIndex.find((i) => i.id === right && i.id !== a.id) ||
    inningsIndex.find(
      (i) => i.id === (a.id === "951363" ? "1298150" : "951363"),
    )!;
  return [a, b];
}
export function checkpointAt(progress: Checkpoint[], balls: number) {
  return progress.filter((p) => p.balls <= balls).at(-1) || null;
}
export function replayContext(p: Checkpoint, previous?: Checkpoint) {
  return {
    strikeRate: p.balls ? (p.runs / p.balls) * 100 : null,
    contribution: p.teamRuns ? (p.runs / p.teamRuns) * 100 : null,
    addedRuns: p.runs - (previous?.runs || 0),
    addedBalls: p.balls - (previous?.balls || 0),
  };
}
export async function loadInningsDetail(
  row: ArchiveInnings,
): Promise<InningsDetailData> {
  const data =
    row.format === "ODI"
      ? await import("./inningsODI.json")
      : row.format === "IPL"
        ? await import("./inningsIPL.json")
        : await import("./inningsT20I.json");
  const detail = data.innings.find((i) => i.id === row.id);
  if (!detail) throw new Error("Innings detail not present");
  return detail;
}
