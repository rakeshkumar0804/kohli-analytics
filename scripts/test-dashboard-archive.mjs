import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  inningsIndex,
  selectArchive,
  summarize,
  groupArchive,
  bowlerMatchups,
  archiveCsv,
} from "../src/dashboard/insights.ts";
import { readView, viewHash } from "../src/dashboard/model.ts";
import artifact from "../src/data/derived/kohliAnalyticsArtifact.json" with { type: "json" };
import odi from "../src/dashboard/inningsODI.json" with { type: "json" };
import t20 from "../src/dashboard/inningsT20I.json" with { type: "json" };
const detail = { innings: [...odi.innings, ...t20.innings] };
describe("Reconciled innings exploration", () => {
  for (const format of ["ODI", "T20I"])
    it(`${format}: independently matches the existing source aggregates`, () => {
      const s = summarize(selectArchive({ format })),
        a = artifact.formats[format];
      assert.equal(s.innings, a.inningsBatted);
      assert.equal(s.runs, a.runs);
      assert.equal(s.balls, a.ballsFaced);
      assert.equal(s.outs, a.dismissals);
      assert.equal(s.fours, a.fours);
      assert.equal(s.sixes, a.sixes);
      assert.equal(
        bowlerMatchups[format].reduce((v, b) => v + b.runs, 0),
        s.runs,
      );
      assert.equal(
        bowlerMatchups[format].reduce((v, b) => v + b.balls, 0),
        s.balls,
      );
    });
  it("has unique matches and a consistent final progression point for every innings", () => {
    assert.equal(inningsIndex.length, 687);
    assert.equal(new Set(inningsIndex.map((i) => i.id)).size, 687);
    for (const row of detail.innings) {
      const final = row.progress.at(-1);
      assert.equal(final.runs, row.runs, row.id);
      assert.equal(final.balls, row.balls, row.id);
    }
  });
  it("keeps Test unsupported and includes sourced IPL records", () => {
    assert.equal(selectArchive({ format: "Test" }).length, 0);
    assert.equal(selectArchive({ format: "IPL" }).length, 275);
  });
  it("combines filters and aggregates groups without double counting", () => {
    const rows = selectArchive({
      format: "ODI",
      opponent: "Australia",
      situation: "chase",
      minRuns: 50,
    });
    assert.ok(rows.length > 0);
    assert.ok(
      rows.every(
        (r) =>
          r.format === "ODI" &&
          r.opponent === "Australia" &&
          r.innings === 2 &&
          r.runs >= 50,
      ),
    );
    for (const group of ["year", "opponent", "venue", "result", "situation"])
      assert.equal(
        groupArchive(rows, group).reduce((v, g) => v + g.runs, 0),
        summarize(rows).runs,
      );
  });
  it("represents undefined averages honestly", () => {
    assert.equal(summarize([]).average, null);
    const row = inningsIndex.find((i) => i.notOut);
    assert.equal(summarize([row]).average, null);
  });
  it("restores all shared archive and comparison choices", () => {
    const view = readView(
      "#/innings?format=ODI&collection=archive&opponent=Australia&venue=Adelaide%20Oval&situation=chase&minRuns=100&year=2016&saved=1&players=kohli,rohit&metric=strikeRate",
    );
    assert.deepEqual(readView(viewHash(view)), view);
  });
  it("exports filtered records with stable source identifiers and escaped values", () => {
    const rows = selectArchive({ format: "T20I", year: "2024" });
    const csv = archiveCsv(rows);
    assert.equal(csv.split("\r\n").length, rows.length + 1);
    assert.ok(csv.includes("Cricsheet match ID"));
    assert.ok(csv.includes(rows[0].id));
  });
});
