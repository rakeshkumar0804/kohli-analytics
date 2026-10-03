import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Trophy,
  Sparkles,
  RotateCcw,
  Download,
  X,
  Check,
  BookOpen,
} from "lucide-react";
import {
  dailyRound,
  parseSeen,
  answerRound,
  isWinner,
  newRound,
  nextQuestion,
  parseRound,
  questions,
  quizKey,
  scoreRound,
  type Round,
} from "./quizModel";
function downloadTrophy(score: number, total: number) {
  const title = score === total ? "THE PERFECT INNINGS" : "CRICKET CONNOISSEUR";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#0e1521"/><rect x="30" y="30" width="1140" height="740" rx="20" fill="none" stroke="#d9b971" stroke-width="2"/><circle cx="600" cy="255" r="115" fill="#d9b971"/><text x="600" y="275" text-anchor="middle" font-family="Arial" font-size="58" font-weight="700" fill="#152033">${score}/${total}</text><g fill="#ead8a8" text-anchor="middle" font-family="Arial"><text x="600" y="95" font-size="20" letter-spacing="5">THE CRICKET GAUNTLET</text><text x="600" y="445" font-size="44" font-weight="700">${title}</text><text x="600" y="510" font-size="24">World cricket · Laws · Deep archive · Scorekeeper</text><text x="600" y="590" font-size="22">${Math.round((score / total) * 100)}% ACCURACY / EXPERT ROUND</text><text x="600" y="690" font-size="17">Kohli Analytics · Digital achievement · Personal practice</text></g></svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `cricket-gauntlet-${score}-of-${total}.svg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Winner({
  score,
  total,
  close,
}: {
  score: number;
  total: number;
  close: () => void;
}) {
  const modal = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(
    typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null
  );
  const [particles, setParticles] = useState(true);
  useEffect(() => {
    const d = modal.current;
    d?.showModal();
    const t = setTimeout(() => setParticles(false), 7000);
    return () => {
      clearTimeout(t);
      d?.close();
      triggerRef.current?.focus();
    };
  }, []);
  return (
    <dialog
      ref={modal}
      className="winner-arena"
      aria-labelledby="winner-title"
      onClose={(event) => {
        if (!event.currentTarget.open) close();
      }}
    >
      <button
        className="winner-close icon-button"
        aria-label="Close winner celebration"
        onClick={close}
      >
        <X size={23} />
      </button>
      {particles && (
        <div className="winner-confetti" aria-hidden="true">
          {Array.from({ length: 100 }, (_, i) => (
            <i
              key={i}
              style={
                {
                  left: `${(i * 37) % 100}%`,
                  background: ["#e8c987", "#90d7c2", "#cf8bac", "#aebdf0"][
                    i % 4
                  ],
                  "--drift": `${i % 2 ? 1 : -1}20px`,
                  animationDelay: `${(i % 17) * 0.11}s`,
                  animationDuration: `${3 + (i % 5) * 0.4}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div className="winner-orbit" aria-hidden="true">
        <Trophy size={80} strokeWidth={1.3} />
      </div>
      <span className="eyebrow">THE ARCHIVE HAS A NEW KEEPER</span>
      <h2 id="winner-title">
        {score === total ? "A perfect innings." : "You know this game."}
      </h2>
      <p>You cleared the expert gate. This one belongs on your wall.</p>
      <div className="winner-medal">
        <strong>
          {score}
          <span>/{total}</span>
        </strong>
        <span>
          {score === total ? "PERFECT INNINGS" : "CRICKET CONNOISSEUR"}
        </span>
      </div>
      <button className="primary" onClick={() => downloadTrophy(score, total)}>
        <Download size={17} />
        Claim your digital trophy
      </button>
      <button className="text-button" onClick={close}>
        Review the innings
        <ArrowRight size={15} />
      </button>
      <small>A personal digital achievement. No cash or physical prize.</small>
    </dialog>
  );
}
export default function CricketQuiz() {
  const [round, setRound] = useState<Round | null>(() => {
    try {
      return parseRound(localStorage.getItem(quizKey));
    } catch {
      return null;
    }
  });
  const [seen, setSeen] = useState<string[]>(() => {
    try {
      return parseSeen(localStorage.getItem("cricket-seen-v1"));
    } catch {
      return [];
    }
  });
  const [today, setToday] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  useEffect(() => {
    const tick = setInterval(
      () => setToday(new Date().toISOString().slice(0, 10)),
      30000,
    );
    return () => clearInterval(tick);
  }, []);
  const [dailySave, setDailySave] = useState<Round | null>(() => {
    try {
      return parseRound(localStorage.getItem("cricket-daily-v1"));
    } catch {
      return null;
    }
  });
  function startDaily() {
    const day = new Date().toISOString().slice(0, 10);
    setToday(day);
    setRound(dailySave?.daily === day ? dailySave : dailyRound(day));
  }
  const [size, setSize] = useState(12);
  const [celebrate, setCelebrate] = useState(false);
  const [storage, setStorage] = useState(true);
  const [best, setBest] = useState(() => {
    try {
      return Number(localStorage.getItem("cricket-gauntlet-best")) || 0;
    } catch {
      return 0;
    }
  });
  const questionRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (round?.daily) setDailySave(round);
    if (round) setSeen(previous => [...new Set([...previous, ...Object.keys(round.answers)])]);
    try {
      if (round) {
        localStorage.setItem(quizKey, JSON.stringify(round));
        if (round.daily) {
          localStorage.setItem("cricket-daily-v1", JSON.stringify(round));
        }
        const ids = [
          ...new Set([
            ...parseSeen(localStorage.getItem("cricket-seen-v1")),
            ...Object.keys(round.answers),
          ]),
        ];
        localStorage.setItem("cricket-seen-v1", JSON.stringify(ids));
        setSeen(ids);
      } else localStorage.removeItem(quizKey);
    } catch {
      setStorage(false);
    }
  }, [round]);
  useEffect(() => {
    if (!round?.done) return;
    const pct = Math.round((scoreRound(round) / round.deck.length) * 100);
    if (pct > best) {
      setBest(pct);
      try {
        localStorage.setItem("cricket-gauntlet-best", String(pct));
      } catch {
        setStorage(false);
      }
    }
  }, [round, best]);
  const current = round?.deck[round.index];
  const q = questions.find((q) => q.id === current?.id);
  const chosen = q && round ? round.answers[q.id] : undefined;
  const score = round ? scoreRound(round) : 0;
  const total = round?.deck.length || size;
  function advance() {
    if (!round) return;
    const next = nextQuestion(round);
    setRound(next);
    if (isWinner(next)) setCelebrate(true);
    requestAnimationFrame(() => questionRef.current?.focus());
  }
  return (
    <section
      id="cricket-gauntlet"
      tabIndex={-1}
      className={`cricket-quiz story-quiz ${round ? "quiz-in-progress" : ""}`}
      aria-label="The Cricket Gauntlet"
    >
      <div className="gauntlet-banner">
        <div>
          <span className="eyebrow">
            BEYOND THE HIGHLIGHT REEL / {questions.length} QUESTIONS
          </span>
          <h2>
            The Cricket
            <br />
            <em>Gauntlet.</em>
          </h2>
          <p>
            History. Laws. The overlooked details.
            <br />A challenge for people who stay after the highlights.
          </p>
        </div>
        <div className="gauntlet-seal">
          <Trophy size={28} />
          <strong>90%</strong>
          <span>THE WINNER’S GATE</span>
        </div>
      </div>
      {!round ? (
        <div className="gauntlet-lobby">
          <div className="gauntlet-rules">
            <span>
              <BookOpen size={17} />
              Four cricket disciplines
            </span>
            <span>
              <Sparkles size={17} />
              Shuffled questions & answers
            </span>
            <span>
              <Trophy size={17} />
              Win a surprise digital reward
            </span>
          </div>
          <div className="daily-challenge">
            <div>
              <span className="eyebrow">THE DAILY EIGHT · {today} UTC</span>
              <h3>A level playing field.</h3>
              <p>
                Same eight questions for everyone today. Two from each
                discipline. Resets at midnight UTC.
              </p>
            </div>
            <button className="primary" onClick={startDaily}>
              {dailySave?.daily === today
                ? dailySave.done
                  ? "Review today’s result"
                  : "Resume daily challenge"
                : "Play daily challenge"}
              <ArrowRight size={17} />
            </button>
          </div>
          <p className="quiz-discovery-progress">
            {seen.length} / {questions.length} questions explored · Practice
            prioritises questions you haven’t answered.
          </p>
          <h3>Or build a practice round.</h3>
          <div className="quiz-modes">
            {[
              [12, "Expert sprint"],
              [24, "The long spell"],
              [40, "Full gauntlet"],
            ].map(([n, label]) => (
              <button
                key={n}
                className={size === n ? "active" : ""}
                aria-pressed={size === n}
                onClick={() => setSize(Number(n))}
              >
                <strong>{n}</strong>
                <span>{label}</span>
                <small>questions</small>
              </button>
            ))}
          </div>
          <div className="gauntlet-start">
            <button
              className="primary"
              onClick={() => setRound(newRound(size, Math.random, seen))}
            >
              Enter the gauntlet
              <ArrowRight size={17} />
            </button>
            <p>
              Win with {Math.ceil(size * 0.9)}/{size}. No timer. Every answer
              has an explanation.
              <br />
              {best > 0 ? `Your best on this device: ${best}%. ` : ""}Progress
              stays on this device.
            </p>
          </div>
        </div>
      ) : round.done ? (
        <div className="gauntlet-result">
          <div className="result-heading">
            <div>
              <span className="eyebrow">
                {round.daily
                  ? `DAILY EIGHT · ${round.daily} UTC`
                  : "INNINGS COMPLETE"}
              </span>
              <h3 ref={questionRef} tabIndex={-1}>
                {isWinner(round)
                  ? "You earned your place."
                  : "The archive has more to teach."}
              </h3>
            </div>
            <strong>
              {score}
              <small>/{total}</small>
            </strong>
          </div>
          <p>
            {Math.round((score / total) * 100)}% accuracy ·{" "}
            {isWinner(round)
              ? "Winner’s gate cleared."
              : `${Math.ceil(total * 0.9)} correct needed for the winner’s reward.`}
          </p>
          <div className="discipline-scores">
            {[...new Set(questions.map((q) => q.category))].map((cat) => {
              const rows = round.deck
                .map((d) => questions.find((q) => q.id === d.id)!)
                .filter((q) => q.category === cat);
              return (
                <div key={cat}>
                  <span>{cat}</span>
                  <strong>
                    {
                      rows.filter((q) => round.answers[q.id] === q.answer)
                        .length
                    }
                    /{rows.length}
                  </strong>
                </div>
              );
            })}
          </div>
          <div className="result-actions">
            {isWinner(round) && (
              <button className="primary" onClick={() => setCelebrate(true)}>
                <Trophy size={17} />
                Reveal your reward
              </button>
            )}
            <button
              className="secondary"
              onClick={() => {
                setRound(null);
                setCelebrate(false);
              }}
            >
              <RotateCcw size={16} />
              New challenge
            </button>
          </div>
          <details className="answer-review">
            <summary>Review every answer and its source</summary>
            {round.deck.map((d) => {
              const item = questions.find((q) => q.id === d.id)!;
              return (
                <article key={d.id}>
                  <span>
                    {round.answers[d.id] === item.answer ? "Correct" : "Missed"}{" "}
                    · {item.category}
                  </span>
                  <h4>{item.prompt}</h4>
                  <p>Your answer: {item.options[round.answers[d.id]]}</p>
                  <p>
                    <strong>{item.options[item.answer]}</strong> —{" "}
                    {item.explanation}
                  </p>
                  <a
                    href={item.source}
                    target={
                      item.source.startsWith("http") ? "_blank" : undefined
                    }
                    rel="noreferrer"
                  >
                    {item.sourceLabel}
                  </a>
                </article>
              );
            })}
          </details>
        </div>
      ) : q && current ? (
        <div className="gauntlet-play">
          {round.daily && (
            <p className="daily-round-label">
              Daily eight · {round.daily} UTC · 8/8 unlocks the reward
            </p>
          )}
          <div className="quiz-progress-label">
            <span>
              Question {round.index + 1} of {total}
            </span>
            <span>
              {score} correct · {q.category}
            </span>
          </div>
          <div className="quiz-progress-track">
            <span
              style={{
                width: `${((round.index + (chosen !== undefined ? 1 : 0)) / total) * 100}%`,
              }}
            />
          </div>
          <h3 ref={questionRef} tabIndex={-1}>
            {q.prompt}
          </h3>
          <div className="gauntlet-options quiz-answers">
            {current.order.map((o, i) => (
              <button
                key={o}
                disabled={chosen !== undefined}
                className={
                  chosen === undefined
                    ? ""
                    : o === q.answer
                      ? "correct"
                      : o === chosen
                        ? "incorrect"
                        : ""
                }
                onClick={() => setRound((r) => (r ? answerRound(r, o) : r))}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {q.options[o]}
                {chosen !== undefined && o === q.answer && <Check size={17} />}
              </button>
            ))}
          </div>
          {chosen !== undefined && (
            <div className="gauntlet-feedback" role="status" aria-live="polite">
              <strong>
                {chosen === q.answer
                  ? "That’s the detail."
                  : "A detail worth keeping."}
              </strong>
              <p>{q.explanation}</p>
              <a
                href={q.source}
                target={q.source.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
              >
                {q.sourceLabel}
              </a>
              <button className="primary" onClick={advance}>
                {round.index === total - 1 ? "Reveal result" : "Next question"}
                <ArrowRight size={16} />
              </button>
            </div>
          )}
          <div className="quiz-session-note">
            <span>
              {storage
                ? "Progress saved on this device."
                : "Device storage unavailable; keep this tab open."}
            </span>
            <button className="text-button" onClick={() => setRound(null)}>
              End round
            </button>
          </div>
        </div>
      ) : null}
      {celebrate && round && isWinner(round) && (
        <Winner score={score} total={total} close={() => setCelebrate(false)} />
      )}
    </section>
  );
}
