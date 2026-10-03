import bank from "./cricketQuestions.json" with { type: "json" };
export const questions = bank;
export const quizKey = "cricket-gauntlet-v1";
export type Round = {
  deck: { id: string; order: number[] }[];
  answers: Record<string, number>;
  index: number;
  done: boolean;
  daily?: string;
};
function shuffled<T>(a: T[], random = Math.random) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
export function newRound(
  count: number,
  random = Math.random,
  seen: string[] = [],
): Round {
  const n = [8, 12, 24, 40].includes(count) ? count : 12;
  const categories = [...new Set(bank.map((q) => q.category))];
  const buckets = categories.map((c) =>
    shuffled(
      bank.filter((q) => q.category === c),
      random,
    ).sort((a, b) => Number(seen.includes(b.id)) - Number(seen.includes(a.id))),
  );
  const ordered: typeof bank = [];
  while (buckets.some((b) => b.length))
    for (const bucket of buckets) {
      const q = bucket.pop();
      if (q) ordered.push(q);
    }
  return {
    deck: shuffled(ordered.slice(0, n), random).map((q) => ({
      id: q.id,
      order: shuffled([0, 1, 2, 3], random),
    })),
    answers: {},
    index: 0,
    done: false,
  };
}
export function scoreRound(r: Round) {
  return r.deck.filter(
    (d) => r.answers[d.id] === bank.find((q) => q.id === d.id)!.answer,
  ).length;
}
export function isWinner(r: Round) {
  return r.done && scoreRound(r) >= Math.ceil(r.deck.length * 0.9);
}
export function answerRound(r: Round, choice: number): Round {
  const id = r.deck[r.index].id;
  if (
    r.done ||
    r.answers[id] !== undefined ||
    !Number.isInteger(choice) ||
    choice < 0 ||
    choice > 3
  )
    return r;
  return { ...r, answers: { ...r.answers, [id]: choice } };
}
export function nextQuestion(r: Round): Round {
  if (r.done || r.answers[r.deck[r.index].id] === undefined) return r;
  return r.index === r.deck.length - 1
    ? { ...r, done: true }
    : { ...r, index: r.index + 1 };
}
export function parseRound(raw: string | null): Round | null {
  try {
    const r = JSON.parse(raw || "null") as Round;
    if (
      !r ||
      !Array.isArray(r.deck) ||
      ![8, 12, 24, 40].includes(r.deck.length) ||
      !Number.isInteger(r.index) ||
      r.index < 0 ||
      r.index >= r.deck.length ||
      typeof r.done !== "boolean" ||
      !r.answers ||
      typeof r.answers !== "object" ||
      Array.isArray(r.answers)
    )
      return null;
    if (
      r.daily !== undefined &&
      (typeof r.daily !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(r.daily) ||
        r.deck.length !== 8)
    )
      return null;
    if (
      new Set(r.deck.map((d) => d.id)).size !== r.deck.length ||
      r.deck.some(
        (d) =>
          !bank.some((q) => q.id === d.id) ||
          !Array.isArray(d.order) ||
          [...d.order].sort().join(",") !== "0,1,2,3",
      )
    )
      return null;
    if (
      Object.entries(r.answers).some(
        ([id, v]) =>
          !r.deck.some((d) => d.id === id) ||
          !Number.isInteger(v) ||
          v < 0 ||
          v > 3,
      )
    )
      return null;
    if (
      r.deck.some(
        (d, i) => (i < r.index || r.done) && r.answers[d.id] === undefined,
      ) ||
      r.deck.some((d, i) => i > r.index && r.answers[d.id] !== undefined)
    )
      return null;
    return r;
  } catch {
    return null;
  }
}

// A UTC date and a versioned seed give everyone the same daily deck and options.
export function dailyRound(day: string): Round {
  let seed = 2166136261;
  for (const ch of `daily-v1-${day}`)
    seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619);
  const random = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { ...newRound(8, random), daily: day };
}
export function parseSeen(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    return Array.isArray(value)
      ? [
          ...new Set(
            value.filter(
              (id): id is string =>
                typeof id === "string" && bank.some((q) => q.id === id),
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}
