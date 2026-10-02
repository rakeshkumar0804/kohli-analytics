import bank from "./cricketQuestions.json" with { type: "json" };
export const questions = bank;
export const quizKey = "cricket-gauntlet-v1";
export type Round = {
  deck: { id: string; order: number[] }[];
  answers: Record<string, number>;
  index: number;
  done: boolean;
};
function shuffled<T>(a: T[], random = Math.random) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
export function newRound(count: number, random = Math.random): Round {
  const n = [12, 24, 40].includes(count) ? count : 12;
  const categories = [...new Set(bank.map((q) => q.category))];
  const buckets = categories.map((c) =>
    shuffled(
      bank.filter((q) => q.category === c),
      random,
    ),
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
      ![12, 24, 40].includes(r.deck.length) ||
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
