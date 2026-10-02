import CricketQuiz from "./CricketQuiz";
import InningsCompare from "./InningsCompare";
import { replayContext } from "./inningsCompareModel";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Globe2,
  BookOpen,
  Flag,
  GitCompareArrows,
} from "lucide-react";
import { eras, eraSummary, replayMatches } from "./storyModel";
import { groupArchive, inningsIndex } from "./insights";
import { number, displayDate, type Page, type ViewState } from "./model";
import { opponentData, careerMilestones } from "../data/kohliData";
import { DEFINING_INNINGS_DATA } from "../data/definingInningsData";
import { Panel, PanelHead } from "./ui";
type Navigate = (page: Page, extra?: Partial<ViewState>) => void;
type StoryProps = {
  view: ViewState;
  update: (v: Partial<ViewState>) => void;
  navigate: Navigate;
};
const chapters = [
  { id: "eras", label: "Career eras", icon: BookOpen },
  { id: "replay", label: "Innings replay", icon: Play },
  { id: "compare-innings", label: "Compare innings", icon: GitCompareArrows },
  { id: "captaincy", label: "The captain", icon: Trophy },
  { id: "rivalries", label: "Rivalries", icon: Globe2 },
] as const;
const fmt = (v: number | null) => (v === null ? "—" : v.toFixed(2));
function EraChapter({ view, update, navigate }: StoryProps) {
  const format = view.format === "T20I" ? "T20I" : "ODI";
  const { era, rows, stats } = eraSummary(view.era || "peak", format);
  const years = groupArchive(rows, "year");
  const max = Math.max(1, ...years.map((y) => y.runs));
  return (
    <>
      <div className="story-section-intro">
        <div>
          <span className="eyebrow">01 / THE CAREER ARC</span>
          <h2>Greatness has chapters.</h2>
        </div>
        <div className="story-format" role="group" aria-label="Era format">
          {(["ODI", "T20I"] as const).map((f) => (
            <button
              key={f}
              aria-pressed={format === f}
              className={format === f ? "active" : ""}
              onClick={() => update({ format: f })}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div
        className="era-selector"
        role="group"
        aria-label="Choose a career era"
      >
        {eras.map((e, i) => (
          <button
            key={e.id}
            className={era.id === e.id ? "active" : ""}
            aria-pressed={era.id === e.id}
            onClick={() => update({ era: e.id })}
          >
            <span>0{i + 1}</span>
            <strong>{e.years}</strong>
            <small>{e.title}</small>
          </button>
        ))}
      </div>
      <div
        className="era-stage"
        style={{ "--era-color": era.color } as React.CSSProperties}
      >
        <article key={era.id} className="era-narrative">
          <span className="eyebrow">
            {era.years} / {format} DELIVERY ARCHIVE
          </span>
          <h3>{era.line}</h3>
          <p>{era.copy}</p>
          <div className="era-main-number">
            <strong>{fmt(stats.average)}</strong>
            <span>
              batting average<small>{stats.innings} covered innings</small>
            </span>
          </div>
          <div className="era-secondary">
            <span>
              <strong>{number(stats.runs)}</strong>Runs
            </span>
            <span>
              <strong>{stats.centuries}</strong>Hundreds
            </span>
            <span>
              <strong>{fmt(stats.strikeRate)}</strong>Strike rate
            </span>
          </div>
        </article>
        <div className="era-year-chart">
          <span className="eyebrow">THE RUNS BEHIND THE CHAPTER</span>
          <div>
            {years.map((y) => (
              <button
                key={y.label}
                onClick={() => navigate("career", { format, year: y.label })}
                aria-label={`Explore ${y.label}, ${y.runs} runs`}
              >
                <strong>{number(y.runs)}</strong>
                <span className="era-column">
                  <i style={{ height: `${(y.runs / max) * 100}%` }} />
                </span>
                <span>{y.label}</span>
                <small>{y.innings} innings</small>
              </button>
            ))}
          </div>
          <p>
            Select a year to explore its innings <ArrowUpRight size={13} />
          </p>
        </div>
      </div>
      <p className="quiet-scope">
        Era statistics are recalculated from covered {format} innings. They
        exclude missing matches and other formats; the selected period is not a
        whole-career total.
      </p>
      <div className="chapter-next">
        <span>
          The career is the context.<strong>The innings are the memory.</strong>
        </span>
        <button
          className="primary"
          onClick={() => update({ chapter: "replay" })}
        >
          Relive a defining chase <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
type Detail = {
  progress: {
    over: number;
    runs: number;
    balls: number;
    teamRuns: number;
    wickets: number;
  }[];
};
function ReplayChapter({ view, update, navigate }: StoryProps) {
  const selected =
    replayMatches.find((m) => m.id === view.match) || replayMatches[0];
  const row = inningsIndex.find((i) => i.id === selected.id)!;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    let active = true;
    setDetail(null);
    setError(false);
    setStep(0);
    setPlaying(false);
    (selected.format === "ODI"
      ? import("./inningsODI.json")
      : import("./inningsT20I.json")
    )
      .then((d) => {
        if (active) {
          const match = d.innings.find((i) => i.id === selected.id);
          if (match) setDetail(match);
          else setError(true);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [selected.id, selected.format]);
  useEffect(() => {
    if (!playing || !detail) return;
    const timer = setInterval(
      () =>
        setStep((s) => {
          if (s >= detail.progress.length - 1) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        }),
      900,
    );
    return () => clearInterval(timer);
  }, [playing, detail]);
  useEffect(() => {
    const stop = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", stop);
    return () => document.removeEventListener("visibilitychange", stop);
  }, []);
  const p = detail?.progress[step];
  const context = p
    ? replayContext(p, step > 0 ? detail?.progress[step - 1] : undefined)
    : null;
  const story = DEFINING_INNINGS_DATA.find((i) => i.matchId === selected.id);
  const points =
    detail?.progress.map(
      (v, i) =>
        `${45 + (i * 540) / Math.max(1, detail.progress.length - 1)},${235 - (v.runs / Math.max(row.runs, 1)) * 185}`,
    ) || [];
  return (
    <>
      <div
        className="replay-selector"
        role="group"
        aria-label="Choose an innings replay"
      >
        {replayMatches.map((m) => (
          <button
            key={m.id}
            aria-pressed={selected.id === m.id}
            className={selected.id === m.id ? "active" : ""}
            onClick={() => update({ match: m.id })}
          >
            {m.name}
            <small>vs {m.opponent}</small>
          </button>
        ))}
      </div>
      <div className="replay-story">
        <div>
          <span className="eyebrow">{selected.tag}</span>
          <h2>{selected.title}</h2>
          <p>{selected.copy}</p>
          <span className="match-date">
            <Flag size={13} />
            {displayDate(row.date)} · {row.venue}
          </span>
        </div>
        <div className="replay-final">
          <strong>
            {row.runs}
            {row.notOut ? "*" : ""}
          </strong>
          <span>
            {row.balls} balls · SR {((row.runs / row.balls) * 100).toFixed(2)}
          </span>
          <small>FINAL INNINGS SCORE</small>
        </div>
      </div>
      {detail && p ? (
        <section
          className="replay-console"
          aria-label="Interactive innings progression"
        >
          <div className="replay-scoreboard">
            <span>
              AT THE END OF OVER <strong>{p.over}</strong>
            </span>
            <span>
              KOHLI{" "}
              <strong>
                {p.runs}
                <small> ({p.balls})</small>
              </strong>
            </span>
            <span>
              INDIA{" "}
              <strong>
                {p.teamRuns}
                <small>/{p.wickets}</small>
              </strong>
            </span>
            <span>
              RUNS TO TARGET{" "}
              <strong>{Math.max(0, (row.target || 0) - p.teamRuns)}</strong>
            </span>
          </div>
          {context && (
            <div className="replay-context">
              <div>
                <span>SCORING PACE NOW</span>
                <strong>
                  {context.strikeRate?.toFixed(1) ?? "—"}
                  <small> strike rate</small>
                </strong>
              </div>
              <div>
                <span>SHARE OF INDIA’S RUNS</span>
                <strong>
                  {context.contribution?.toFixed(1) ?? "—"}
                  <small>%</small>
                </strong>
              </div>
              <div>
                <span>SINCE THE PREVIOUS CHECKPOINT</span>
                <strong>
                  +{context.addedRuns}
                  <small> off {context.addedBalls} balls faced</small>
                </strong>
              </div>
            </div>
          )}
          <div className="replay-chart">
            <svg
              viewBox="0 0 630 280"
              role="img"
              aria-label={`Kohli has ${p.runs} runs from ${p.balls} balls after over ${p.over}. Cumulative run chart.`}
            >
              {[0, 0.5, 1].map((v) => (
                <g key={v}>
                  <line
                    x1="45"
                    x2="585"
                    y1={235 - v * 185}
                    y2={235 - v * 185}
                    stroke="#343844"
                    strokeDasharray="3 5"
                  />
                  <text x="28" y={239 - v * 185} textAnchor="end">
                    {Math.round(v * row.runs)}
                  </text>
                </g>
              ))}
              <path
                d={"M" + points.join(" L")}
                stroke="#44444b"
                strokeWidth="2"
                fill="none"
              />
              <path
                d={"M" + points.slice(0, step + 1).join(" L")}
                stroke="#dfbe7b"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
              {detail.progress.map((d, i) => (
                <circle
                  key={d.over}
                  cx={45 + (i * 540) / Math.max(1, detail.progress.length - 1)}
                  cy={235 - (d.runs / row.runs) * 185}
                  r={i === step ? 6 : 2}
                  fill={i <= step ? "#e4c684" : "#60616d"}
                />
              ))}
              <text x="45" y="265">
                OVER {detail.progress[0].over}
              </text>
              <text x="585" y="265" textAnchor="end">
                OVER {detail.progress.at(-1)!.over}
              </text>
            </svg>
            <div className="replay-controls">
              <button
                className="icon-button"
                aria-label="Restart innings replay"
                onClick={() => {
                  setStep(0);
                  setPlaying(false);
                }}
              >
                <RotateCcw size={17} />
              </button>
              <button
                className="play-replay"
                aria-label={
                  playing ? "Pause innings replay" : "Play innings replay"
                }
                onClick={() => {
                  if (step === detail.progress.length - 1) setStep(0);
                  setPlaying(!playing);
                }}
              >
                {playing ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} fill="currentColor" />
                )}
              </button>
              <label>
                <span className="sr-only">Replay over</span>
                <input
                  type="range"
                  min="0"
                  max={detail.progress.length - 1}
                  value={step}
                  aria-valuetext={`Over ${p.over}: ${p.runs} runs`}
                  onChange={(e) => {
                    setStep(Number(e.target.value));
                    setPlaying(false);
                  }}
                />
              </label>
              <span>
                {step + 1} / {detail.progress.length}
              </span>
              <button
                className="icon-button"
                aria-label="Previous replay over"
                disabled={!step}
                onClick={() => {
                  setStep((s) => s - 1);
                  setPlaying(false);
                }}
              >
                <ChevronLeft size={17} />
              </button>
              <button
                className="icon-button"
                aria-label="Next replay over"
                disabled={step === detail.progress.length - 1}
                onClick={() => {
                  setStep((s) => s + 1);
                  setPlaying(false);
                }}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
          <p className="panel-footnote">
            Actual archive values at the end of each over in which Kohli faced a
            delivery. The slider uses these over checkpoints; it is not video or
            ball-by-ball commentary.
          </p>
        </section>
      ) : (
        <div className="panel" role="status">
          {error
            ? "The innings summary could not load. Reload this page to retry."
            : "Loading the innings…"}
        </div>
      )}
      <div className="replay-compare-link">
        <span>How does this innings compare?</span>
        <button
          className="secondary"
          onClick={() =>
            update({
              chapter: "compare-innings",
              left: row.id,
              right: row.id === "951363" ? "1298150" : "951363",
            })
          }
        >
          <GitCompareArrows size={16} />
          Compare this innings
        </button>
      </div>
      <div className="replay-bottom">
        <p>{story?.verifiedNarrative}</p>
        <button
          className="secondary"
          onClick={() =>
            navigate("innings", {
              format: row.format as "ODI" | "T20I",
              collection: "archive",
              query: row.opponent,
              year: row.date.slice(0, 4),
            })
          }
        >
          Explore this match in the archive <ArrowUpRight size={14} />
        </button>
      </div>
    </>
  );
}
function CaptainChapter({ navigate }: StoryProps) {
  return (
    <>
      <div className="captain-story">
        <div className="captain-visual">
          <span className="eyebrow">INDIA / TEST CAPTAINCY / 2014–2022</span>
          <div className="captain-forty">
            40<span>WINS</span>
          </div>
          <div
            className="captain-result-bar"
            aria-label="40 wins, 17 losses and 11 draws in 68 Tests"
          >
            <i style={{ width: "58.82%" }} />
            <i style={{ width: "25%" }} />
            <i style={{ width: "16.18%" }} />
          </div>
          <div className="captain-result-key">
            <span>40 wins</span>
            <span>17 losses</span>
            <span>11 draws</span>
          </div>
          <span className="captain-watermark" aria-hidden="true">
            LEAD
            <br />
            FROM
            <br />
            THE FRONT.
          </span>
        </div>
        <article>
          <span className="eyebrow">04 / THE CAPTAIN’S CHAPTER</span>
          <h2>
            A team that went
            <br />
            looking for a win.
          </h2>
          <p>
            Kohli’s captaincy story stretches beyond a trophy count. Across 68
            Tests, India won 40. The 2018–19 tour of Australia became a defining
            chapter: India’s first Test series victory there.
          </p>
          <div className="leadership-metrics">
            <span>
              <strong>58.82%</strong>Test win rate
            </span>
            <span>
              <strong>68</strong>Tests captained
            </span>
            <span>
              <strong>2018–19</strong>Australia series win
            </span>
          </div>
          <button
            className="primary"
            onClick={() => navigate("career", { format: "Test" })}
          >
            Explore his Test career <ArrowRight size={16} />
          </button>
        </article>
      </div>
      <Panel>
        <PanelHead
          eyebrow="STORED CAPTAINCY RECORDS · SELECTED INDIAN CAPTAINS"
          title="The record alongside his predecessors"
        />
        <div className="captain-comparison">
          {[
            { name: "Virat Kohli", wins: 40, tests: 68 },
            { name: "Rahul Dravid", wins: 12, tests: 25 },
            { name: "MS Dhoni", wins: 27, tests: 60 },
            { name: "Sourav Ganguly", wins: 21, tests: 49 },
          ].map((c, i) => (
            <div key={c.name}>
              <span>
                {c.name}
                <small>
                  {c.wins} wins / {c.tests} Tests
                </small>
              </span>
              <div>
                <i
                  style={{
                    width: `${(c.wins / c.tests) * 100}%`,
                    background: i === 0 ? "#e0bb73" : "#677185",
                  }}
                />
              </div>
              <strong>{((c.wins / c.tests) * 100).toFixed(2)}%</strong>
            </div>
          ))}
        </div>
        <p className="panel-footnote">
          Wins divided by Tests captained. These selected historical records do
          not adjust for opposition, venue or draws.
        </p>
      </Panel>
    </>
  );
}
function RivalryChapter({ view, update, navigate }: StoryProps) {
  const country =
    opponentData.find((o) => o.country === view.opponent) || opponentData[0];
  const moments = DEFINING_INNINGS_DATA.filter(
    (i) => i.opponent === country.country,
  );
  const sorted = [...opponentData].sort((a, b) => b.runs - a.runs);
  return (
    <>
      <div className="story-section-intro">
        <div>
          <span className="eyebrow">05 / ACROSS THE OPPOSITION</span>
          <h2>Same batter. Different battles.</h2>
        </div>
        <span className="badge">Combined international snapshots</span>
      </div>
      <div className="rivalry-grid">
        <div
          className="rivalry-list"
          role="group"
          aria-label="Choose a rivalry"
        >
          {sorted.map((o, i) => (
            <button
              key={o.code}
              onClick={() => update({ opponent: o.country })}
              aria-pressed={country.code === o.code}
              className={country.code === o.code ? "active" : ""}
            >
              <span className="rivalry-rank">0{i + 1}</span>
              <span>
                {o.country}
                <small>{o.matches} matches</small>
              </span>
              <strong>
                {number(o.runs)}
                <small>runs</small>
              </strong>
              <ArrowUpRight size={14} />
            </button>
          ))}
        </div>
        <article className="rivalry-stage" key={country.code}>
          <div className="rivalry-monogram" aria-hidden="true">
            {country.code}
          </div>
          <span className="eyebrow">VIRAT KOHLI VS</span>
          <h3>{country.country}</h3>
          <div className="rivalry-headline">
            <strong>{number(country.runs)}</strong>
            <span>international runs</span>
          </div>
          <div className="leadership-metrics">
            <span>
              <strong>{country.avg.toFixed(2)}</strong>Average
            </span>
            <span>
              <strong>{country.centuries}</strong>Hundreds
            </span>
            <span>
              <strong>{country.highScore}</strong>Highest
            </span>
          </div>
          <p>
            {country.innings} innings · {country.notOuts} not outs · Test + ODI
            + T20I. Opposition records are stored combined snapshots,
            independent of the delivery archive.
          </p>
          <button
            className="primary"
            onClick={() =>
              navigate("innings", {
                format: "ALL",
                collection: "archive",
                opponent: country.country,
              })
            }
          >
            Explore covered innings <ArrowRight size={16} />
          </button>
          {moments.length > 0 && (
            <div className="rivalry-moments">
              <span className="eyebrow">A FEW THAT STAY WITH YOU</span>
              {moments.slice(0, 3).map((m) => (
                <button
                  key={m.id}
                  onClick={() =>
                    navigate("innings", {
                      format: m.format as ViewState["format"],
                      collection: "highlights",
                      query: country.country,
                      year: m.date.slice(0, 4),
                    })
                  }
                >
                  <strong>
                    {m.runs}
                    {m.notOut ? "*" : ""}
                  </strong>
                  <span>
                    {m.title}
                    <small>
                      {m.venue} · {m.date.slice(0, 4)}
                    </small>
                  </span>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          )}
        </article>
      </div>
    </>
  );
}
export default function StoryExperience(props: StoryProps) {
  const chapter =
    chapters.find((c) => c.id === props.view.chapter)?.id || "eras";
  return (
    <div className="story-experience">
      <div className="chapter-tabs" role="group" aria-label="Story chapters">
        {chapters.map((c, i) => (
          <button
            key={c.id}
            aria-pressed={chapter === c.id}
            className={chapter === c.id ? "active" : ""}
            onClick={() => props.update({ chapter: c.id })}
          >
            <span>0{i + 1}</span>
            <c.icon size={17} />
            {c.label}
          </button>
        ))}
      </div>
      {chapter === "eras" ? (
        <EraChapter {...props} />
      ) : chapter === "replay" ? (
        <ReplayChapter {...props} />
      ) : chapter === "compare-innings" ? (
        <InningsCompare view={props.view} update={props.update} />
      ) : chapter === "captaincy" ? (
        <CaptainChapter {...props} />
      ) : (
        <RivalryChapter {...props} />
      )}
      <details className="story-timeline">
        <summary>
          The journey, in milestones{" "}
          <span>{careerMilestones.length} moments</span>
        </summary>
        <div>
          {careerMilestones.map((m) => (
            <article key={m.year}>
              <strong>{m.year}</strong>
              <div>
                <span className="eyebrow">{m.phase}</span>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </details>
      <CricketQuiz />
    </div>
  );
}
