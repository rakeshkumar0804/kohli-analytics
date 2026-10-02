import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  eras,
  eraSummary,
  replayMatches,
} from "../src/dashboard/storyModel.ts";
import { inningsIndex, summarize } from "../src/dashboard/insights.ts";
import { readView, viewHash } from "../src/dashboard/model.ts";
import odi from "../src/dashboard/inningsODI.json" with { type: "json" };
import t20 from "../src/dashboard/inningsT20I.json" with { type: "json" };
describe("Story data is grounded in the delivered archive", () => {
  for (const format of ["ODI", "T20I"])
    it(`${format}: five eras partition the whole covered archive without overlaps`, () => {
      const rows = eras.flatMap((e) => eraSummary(e.id, format).rows);
      const expected = inningsIndex.filter((r) => r.format === format);
      assert.equal(rows.length, expected.length);
      assert.equal(new Set(rows.map((r) => r.id)).size, expected.length);
      assert.equal(summarize(rows).runs, summarize(expected).runs);
    });
  it("peak ODI summary uses source-derived values, not the legacy static 82.1 estimate", () => {
    const { stats } = eraSummary("peak", "ODI");
    assert.equal(stats.runs, 4711);
    assert.equal(stats.innings, 74);
    assert.equal(stats.average.toFixed(2), "81.22");
  });
  it("all four featured replays exist and end at their final batter score", () => {
    for (const m of replayMatches) {
      const row = inningsIndex.find((i) => i.id === m.id),
        detail = [...odi.innings, ...t20.innings].find((i) => i.id === m.id);
      assert.ok(row && detail);
      assert.ok(row.target > 0);
      assert.equal(detail.progress.at(-1).runs, row.runs);
      assert.equal(detail.progress.at(-1).balls, row.balls);
      assert.ok(
        detail.progress.every((p, i, a) => !i || p.over > a[i - 1].over),
      );
    }
  });
  it("story chapter, era, match and rivalry survive a shared URL round-trip", () => {
    const v = readView(
      "#/story?format=T20I&chapter=replay&era=return&match=951363&opponent=Australia",
    );
    assert.equal(v.page, "story");
    assert.deepEqual(readView(viewHash(v)), v);
  });
  it("unknown eras fall back to the peak chapter", () =>
    assert.equal(eraSummary("not-an-era", "ODI").era.id, "peak"));
});
