import { it } from "node:test";
import assert from "node:assert/strict";
import {
  inningsIndex,
  iplArchive,
  selectArchive,
  summarize,
} from "../src/dashboard/insights.ts";
import { applyLens, recentForm } from "../src/dashboard/discoveryModel.ts";
import { statsByFormat, readView, viewHash } from "../src/dashboard/model.ts";
import detail from "../src/dashboard/inningsIPL.json" with { type: "json" };
it("IPL totals reconcile to the existing career runs, dismissals and boundaries", () => {
  const s = summarize(selectArchive({ format: "IPL" }));
  assert.equal(s.runs, statsByFormat.IPL.runs);
  assert.equal(s.outs, 231);
  assert.equal(s.fours, statsByFormat.IPL.fours);
  assert.equal(s.sixes, statsByFormat.IPL.sixes);
  assert.equal(s.innings, 275);
  assert.equal(s.balls, statsByFormat.IPL.ballsFaced);
  assert.equal(s.centuries, statsByFormat.IPL.centuries);
  assert.equal(s.fifties, statsByFormat.IPL.fifties);
});
it("2016 reconciles to 973 runs and four centuries, seven fifties", () => {
  const s = summarize(selectArchive({ format: "IPL", year: "2016" }));
  assert.equal(s.runs, 973);
  assert.equal(s.centuries, 4);
  assert.equal(s.fifties, 7);
});
it("IPL is excluded from international defaults and included only in explicit scopes", () => {
  assert.equal(selectArchive({ format: "ALL" }).length, 415);
  assert.equal(selectArchive({ format: "ALL", includeIPL: true }).length, 690);
  assert.equal(selectArchive({ format: "IPL" }).length, 275);
});
it("all IPL progress, bowler and phase totals independently reconcile to the innings", () => {
  for (const r of detail.innings) {
    assert.equal(r.progress.at(-1).runs, r.runs, r.id);
    assert.equal(r.progress.at(-1).balls, r.balls, r.id);
    for (const key of ["runs", "balls", "dots", "fours", "sixes"]) {
      assert.equal(
        r.bowlers.reduce((n, b) => n + b[key], 0),
        r[key],
        r.id,
      );
      assert.equal(
        Object.values(r.phases).reduce((n, b) => n + b[key], 0),
        r[key],
        r.id,
      );
    }
    assert.ok(
      r.progress.every((p, i, a) => i === 0 || p.balls >= a[i - 1].balls),
    );
  }
});
it("IPL provenance is explicit and chronology is stable", () => {
  assert.match(iplArchive.metadata.sourceHash, /^[a-f0-9]{64}$/);
  assert.equal(iplArchive.metadata.coverageEnd, "2026-05-31");
  assert.equal(new Set(inningsIndex.map((r) => r.id)).size, 690);
});
it("discovery lenses apply their stated conditions", () => {
  for (const r of applyLens(inningsIndex, "gems"))
    assert.ok(r.runs >= 50 && r.result === "won" && !r.playerOfMatch);
  for (const r of applyLens(inningsIndex, "rapid"))
    assert.ok(r.runs >= 50 && r.runs / r.balls >= 1.5);
  for (const r of applyLens(inningsIndex, "chases"))
    assert.ok(r.innings === 2 && r.result === "won");
  assert.equal(applyLens(inningsIndex, "saved").length, 0);
  assert.equal(
    applyLens(inningsIndex, "saved", ["archive-" + inningsIndex[0].id]).length,
    1,
  );
});
it("recent form is chronologically selected without mutating the source", () => {
  const original = inningsIndex.map((r) => r.id);
  const r = recentForm(inningsIndex);
  assert.equal(r.rows.length, 20);
  assert.ok(r.rows.every((v, i, a) => !i || v.date <= a[i - 1].date));
  assert.deepEqual(
    inningsIndex.map((r) => r.id),
    original,
  );
});
it("discovery and IPL season links survive sharing", () => {
  for (const hash of [
    "#/discover?format=IPL&metric=centuries&year=2016",
    "#/ipl?format=IPL&year=2024",
  ]) {
    const v = readView(hash);
    assert.deepEqual(readView(viewHash(v)), v);
    assert.notEqual(v.page, "overview");
  }
});
