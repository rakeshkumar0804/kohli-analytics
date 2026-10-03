import { it } from "node:test";
import assert from "node:assert/strict";
import {
  dailyRound,
  parseSeen,
  questions,
  newRound,
  answerRound,
  nextQuestion,
  parseRound,
  scoreRound,
  isWinner,
} from "../src/dashboard/quizModel.ts";
import { readView, viewHash } from "../src/dashboard/model.ts";
it("64 unique sourced questions cover four disciplines with four distinct answers", () => {
  assert.equal(questions.length, 64);
  assert.equal(new Set(questions.map((q) => q.id)).size, 64);
  assert.equal(new Set(questions.map((q) => q.category)).size, 4);
  for (const q of questions) {
    assert.equal(new Set(q.options).size, 4);
    assert.ok(q.answer >= 0 && q.answer < 4);
    assert.ok(q.explanation && q.source && q.sourceLabel);
  }
});
it("all modes sample without duplicates and short modes balance disciplines", () => {
  for (const n of [12, 24, 40]) {
    const r = newRound(n);
    assert.equal(r.deck.length, n);
    assert.equal(new Set(r.deck.map((d) => d.id)).size, n);
    for (const d of r.deck) assert.deepEqual([...d.order].sort(), [0, 1, 2, 3]);
    if (n < 40)
      for (const cat of new Set(questions.map((q) => q.category)))
        assert.equal(
          r.deck.filter(
            (d) => questions.find((q) => q.id === d.id).category === cat,
          ).length,
          n / 4,
        );
  }
});
it("answers lock after one choice and unanswered questions cannot advance", () => {
  const r = newRound(12);
  assert.equal(nextQuestion(r), r);
  const a = answerRound(r, 0);
  assert.equal(answerRound(a, 1), a);
  assert.equal(scoreRound(a), 1);
  assert.equal(nextQuestion(a).index, 1);
});
it("only complete rounds at or above 90 percent unlock the reward", () => {
  for (const [n, correct, win] of [
    [12, 10, false],
    [12, 11, true],
    [24, 21, false],
    [24, 22, true],
    [40, 35, false],
    [40, 36, true],
    [40, 40, true],
  ]) {
    let r = newRound(n);
    for (let i = 0; i < n; i++)
      r = nextQuestion(answerRound(r, i < correct ? 0 : 1));
    assert.equal(scoreRound(r), correct);
    assert.equal(isWinner(r), win);
    assert.equal(answerRound(r, 2), r);
  }
  assert.equal(isWinner(newRound(12)), false);
});
it("save and resume preserve shuffled options and locked answers", () => {
  const r = nextQuestion(answerRound(newRound(24), 2));
  assert.deepEqual(parseRound(JSON.stringify(r)), r);
});
it("invalid, duplicate, truncated and impossible storage states are rejected", () => {
  assert.equal(parseRound("broken"), null);
  let r = newRound(12);
  assert.equal(parseRound(JSON.stringify({ ...r, index: 4 })), null);
  assert.equal(parseRound(JSON.stringify({ ...r, done: true })), null);
  assert.equal(
    parseRound(
      JSON.stringify({ ...r, deck: [...r.deck.slice(0, 11), r.deck[0]] }),
    ),
    null,
  );
  assert.equal(
    parseRound(JSON.stringify({ ...r, answers: { [r.deck[0].id]: 8 } })),
    null,
  );
});
it("comparison focus survives sharing and does not require Kohli", () => {
  const v = readView(
    "#/compare?format=Test&players=root,smith,williamson&focusA=root&focusB=williamson",
  );
  assert.deepEqual(readView(viewHash(v)), v);
  assert.equal(v.focusA, "root");
  assert.equal(v.focusB, "williamson");
  assert.equal(readView("#/club").page, "club");
});

it("daily decks are date deterministic, balanced, and resume with their identity", () => {
  const a = dailyRound("2026-10-02"),
    b = dailyRound("2026-10-02"),
    c = dailyRound("2026-10-03");
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.deck, c.deck);
  assert.equal(a.deck.length, 8);
  for (const category of new Set(questions.map((q) => q.category)))
    assert.equal(
      a.deck.filter(
        (d) => questions.find((q) => q.id === d.id).category === category,
      ).length,
      2,
    );
  assert.deepEqual(parseRound(JSON.stringify(a)), a);
  assert.equal(parseRound(JSON.stringify({ ...a, daily: "bad" })), null);
});
it("practice prioritises unseen questions within each discipline", () => {
  const first = newRound(12);
  const ids = first.deck.map((d) => d.id);
  const next = newRound(12, Math.random, ids);
  assert.ok(next.deck.every((d) => !ids.includes(d.id)));
  assert.deepEqual(parseSeen(JSON.stringify([ids[0], ids[0], "unknown", 7])), [
    ids[0],
  ]);
  assert.deepEqual(parseSeen("broken"), []);
});
