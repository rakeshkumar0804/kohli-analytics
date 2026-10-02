import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  readView,
  viewHash,
  filterInnings,
  csvRows,
  statsByFormat,
  coverage,
} from "../src/dashboard/model.ts";

describe("Dashboard routes, filters and data boundaries", () => {
  it("normalizes unknown routes and formats to a usable overview", () => {
    const view = readView("#/unknown?format=UNKNOWN");
    assert.equal(view.page, "overview");
    assert.equal(view.format, "ALL");
  });
  it("normalizes unsupported pressure and comparison scopes", () => {
    assert.equal(readView("#/pressure?format=IPL").format, "ODI");
    assert.equal(readView("#/compare?format=ALL").format, "ODI");
    assert.equal(readView("#/pressure?format=Test").format, "Test");
  });
  it("round-trips a shared view including special characters", () => {
    const view = {
      page: "innings",
      format: "ODI",
      query: "Mumbai & Wankhede",
      year: "2023",
      result: "won",
      saved: false,
    };
    assert.deepEqual(readView(viewHash(view)), view);
  });
  it("combines format, year, outcome, search and saved filters", () => {
    const view = readView(
      "#/innings?format=T20I&year=2022&result=won&q=pakistan",
    );
    const rows = filterInnings(view);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].matchId, "1298150");
    assert.equal(rows[0].runs, 82);
    assert.equal(filterInnings({ ...view, saved: true }, []).length, 0);
    assert.equal(
      filterInnings({ ...view, saved: true }, [rows[0].id]).length,
      1,
    );
  });
  it("searches venue text case-insensitively and trims whitespace", () => {
    assert.equal(
      filterInnings({ ...readView("#/innings"), query: "  HOBART  " })[0].runs,
      133,
    );
  });
  it("returns empty results for a non-matching query", () => {
    assert.equal(
      filterInnings({ ...readView("#/innings"), query: "zzzzzzzz" }).length,
      0,
    );
  });
  it("sorts the curated library newest first without mutating its data", () => {
    const first = filterInnings(readView("#/innings"));
    assert.ok(first.every((item, i) => !i || first[i - 1].date >= item.date));
    assert.equal(filterInnings(readView("#/innings")).length, 12);
  });
  it("does not include IPL in international totals", () => {
    assert.equal(
      statsByFormat.ALL.runs,
      statsByFormat.ODI.runs +
        statsByFormat.Test.runs +
        statsByFormat.T20I.runs,
    );
    assert.notEqual(
      statsByFormat.ALL.runs,
      statsByFormat.ODI.runs +
        statsByFormat.Test.runs +
        statsByFormat.T20I.runs +
        statsByFormat.IPL.runs,
    );
  });
  it("uses artifact coverage rather than stale hard-coded denominators", () => {
    assert.equal(
      coverage.referenceMatches,
      statsByFormat.ODI.matches + statsByFormat.T20I.matches,
    );
    assert.equal(
      coverage.referenceBattingInnings,
      statsByFormat.ODI.innings + statsByFormat.T20I.innings,
    );
  });
  it("exports only filtered rows with quoted venue commas and source URLs", () => {
    const rows = filterInnings({ ...readView("#/innings"), query: "Hobart" });
    const csv = csvRows(rows);
    assert.equal(csv.split("\r\n").length, 2);
    assert.ok(csv.includes('"Bellerive Oval, Hobart"'));
    assert.ok(csv.includes(rows[0].sourceUrl));
    assert.ok(!csv.includes("Melbourne"));
  });
});
