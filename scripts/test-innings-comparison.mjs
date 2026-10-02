import { it } from "node:test";
import assert from "node:assert/strict";
import {
  resolvePair,
  checkpointAt,
  replayContext,
} from "../src/dashboard/inningsCompareModel.ts";
import { readView, viewHash } from "../src/dashboard/model.ts";
import odi from "../src/dashboard/inningsODI.json" with { type: "json" };
import t20 from "../src/dashboard/inningsT20I.json" with { type: "json" };
it("invalid or duplicate pairs always resolve to two real distinct innings", () => {
  for (const args of [
    [],
    ["bad", "bad"],
    ["951363", "951363"],
    ["1298150", "1298150"],
  ]) {
    const [a, b] = resolvePair(...args);
    assert.notEqual(a.id, b.id);
    assert.ok(a.balls && b.balls);
  }
});
it("both innings survive share URL roundtrip", () => {
  const v = readView(
    "#/story?chapter=compare-innings&left=518966&right=535798",
  );
  assert.equal(v.left, "518966");
  assert.equal(v.right, "535798");
  assert.deepEqual(readView(viewHash(v)), v);
});
it("sparse checkpoints never interpolate a score", () => {
  const p = [
    { balls: 4, runs: 7 },
    { balls: 9, runs: 13 },
  ];
  assert.equal(checkpointAt(p, 0), null);
  assert.equal(checkpointAt(p, 8), p[0]);
  assert.equal(checkpointAt(p, 9), p[1]);
});
it("replay context uses batter pace, team contribution and checkpoint deltas", () => {
  assert.deepEqual(
    replayContext(
      { runs: 30, balls: 20, teamRuns: 75 },
      { runs: 20, balls: 15 },
    ),
    { strikeRate: 150, contribution: 40, addedRuns: 10, addedBalls: 5 },
  );
  assert.equal(
    replayContext({ runs: 0, balls: 0, teamRuns: 0 }).strikeRate,
    null,
  );
});
it("all archived innings comparisons end at their actual score and balls", () => {
  for (const d of [...odi.innings, ...t20.innings]) {
    const [row] = resolvePair(d.id);
    const final = checkpointAt(d.progress, row.balls);
    assert.equal(final?.runs, row.runs, d.id);
    assert.equal(final?.balls, row.balls, d.id);
  }
});
