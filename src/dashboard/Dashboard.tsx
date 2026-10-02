import iplProvenance from "./iplProvenance.json";
import { CompareVisual } from "./CompareVisual";

import { Panel, PanelHead } from "./ui";
import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Bookmark,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Database,
  ExternalLink,
  GitCompareArrows,
  LayoutDashboard,
  ListFilter,
  Menu,
  Search,
  Share2,
  ShieldCheck,
  Target,
  Trophy,
  X,
} from "lucide-react";
import {
  careerMilestones,
  opponentData,
  allFormatCareerStats,
} from "../data/kohliData";
import { ALL_RADAR_PLAYERS_FORMATTED } from "../data/legendsComparisonData";
import { DEFINING_INNINGS_DATA } from "../data/definingInningsData";
import {
  DATA_PROVENANCE_MANIFEST,
  DATA_VERIFIED_ON_FORMATTED,
} from "../data/dataSources";
import { getPressurePerformanceView } from "../analytics/adapters";
import { fetchNextMatch, type NextMatchResult } from "../api/cricketData";
import {
  archive,
  coverage,
  csvRows,
  displayDate,
  filterInnings,
  formatCutoffs,
  formatLabel,
  formats,
  number,
  readView,
  statsByFormat,
  viewHash,
  type FormatScope,
  type Page,
  type ViewState,
} from "./model";
import type { DefiningInnings } from "../types";

const OverviewContent = lazy(() =>
  import("./ArchiveViews").then((m) => ({ default: m.OverviewContent })),
);
const ArchiveLibrary = lazy(() =>
  import("./ArchiveViews").then((m) => ({ default: m.ArchiveLibrary })),
);
const CareerLab = lazy(() =>
  import("./ArchiveViews").then((m) => ({ default: m.CareerLab })),
);
const BowlerLab = lazy(() =>
  import("./ArchiveViews").then((m) => ({ default: m.BowlerLab })),
);
const IPLHub = lazy(() =>
  import("./DiscoveryExperience").then((m) => ({ default: m.IPLHub })),
);
const DiscoveryLab = lazy(() =>
  import("./DiscoveryExperience").then((m) => ({ default: m.DiscoveryLab })),
);
const CricketClub = lazy(() => import("./CricketClub"));
const StoryExperience = lazy(() => import("./StoryExperience"));
const navigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "club", label: "Cricket club", icon: Trophy },
  { id: "story", label: "The Kohli story", icon: BookOpen },
  { id: "ipl", label: "The RCB chapter", icon: Trophy },
  { id: "discover", label: "Discovery lab", icon: Search },
  { id: "career", label: "Career explorer", icon: BarChart3 },
  { id: "pressure", label: "Pressure & chases", icon: Activity },
  { id: "compare", label: "Player comparison", icon: GitCompareArrows },
  { id: "innings", label: "Innings library", icon: Bookmark },
] as const;
const titles: Record<Page, [string, string]> = {
  overview: [
    "The analytics story.",
    "A closer look at the numbers behind Virat Kohli.",
  ],
  club: [
    "The game is bigger than one name.",
    "Cricket history, expert challenges and conversations across eras.",
  ],
  story: [
    "The story behind the numbers.",
    "The rise. The chases. The captain. Choose a chapter.",
  ],
  ipl: ["A lifetime in red.", "Every covered season. Every innings. One club."],
  discover: [
    "Follow your cricket curiosity.",
    "Find the patterns. Open an innings. Discover something new.",
  ],
  career: [
    "Explore a remarkable career.",
    "Across formats, opponents and defining chapters.",
  ],
  pressure: [
    "When the game gets harder.",
    "Situational performance, with the sample behind every number.",
  ],
  compare: [
    "Greatness has context.",
    "Compare batting records across players and formats.",
  ],
  innings: [
    "Every innings has a story.",
    "687 covered batting innings. Twelve defining performances.",
  ],
  sources: [
    "Know what the numbers mean.",
    "Sources, coverage and the boundaries of this dataset.",
  ],
};

const fmtColor: Record<string, string> = {
  ODI: "#ee806b",
  Test: "#a19ae8",
  T20I: "#77c5b1",
  IPL: "#e4bb70",
};
function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <Search size={28} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
function StatCards({ format }: { format: FormatScope }) {
  const s = statsByFormat[format];
  return (
    <div className="stats-grid">
      {[
        [
          "Total runs",
          number(s.runs),
          `${number(s.innings)} batting innings`,
          <BarChart3 key="runs" size={17} />,
        ],
        [
          "Batting average",
          number(s.average, 2),
          `${number(s.dismissals)} dismissals`,
          <Activity key="average" size={17} />,
        ],
        [
          "Centuries",
          number(s.centuries),
          `${s.fifties} half-centuries`,
          <Trophy key="centuries" size={17} />,
        ],
        [
          "Matches",
          number(s.matches),
          `${number(s.notOuts)} unbeaten innings`,
          <Target key="matches" size={17} />,
        ],
      ].map(([label, value, note, icon], i) => (
        <Panel key={String(label)} className={`stat-card stat-${i}`}>
          <div className="stat-label">
            {label}
            {icon}
          </div>
          <div className="stat-value">{value}</div>
          <span className="stat-note">{note}</span>
        </Panel>
      ))}
    </div>
  );
}
function Fixture() {
  const [fixture, setFixture] = useState<NextMatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    fetchNextMatch(new Date(), { forceRefresh: attempt > 0 })
      .then((r) => {
        if (active) {
          setFixture(r);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const m = fixture?.match;
  const available =
    fixture?.status === "available" &&
    m &&
    new Date(m.date).getTime() > Date.now();
  return (
    <Panel className="fixture">
      <div className="fixture-icon">
        <Target size={20} />
      </div>
      <div>
        <span className="eyebrow">INDIA · ODI SCHEDULE</span>
        <h3>
          {loading
            ? "Checking the next fixture…"
            : available
              ? `India vs ${m.opponent}`
              : fixture?.status === "confirmed-empty"
                ? "No upcoming fixture confirmed"
                : "Schedule currently unavailable"}
        </h3>
        <p>
          {available
            ? `${displayDate(m.date)} · ${m.venue}`
            : fixture?.reason === "timeout"
              ? "The schedule provider took too long to respond. Try again shortly."
              : fixture?.reason === "provider-error"
                ? "The schedule provider rejected the request. Check the server account status or quota."
                : fixture?.reason === "missing-credentials"
                  ? "Configure CRICKETDATA_API_KEY in the server environment, then restart the local server."
                  : fixture?.status === "confirmed-empty"
                    ? "No upcoming India ODI was found in the provider’s returned schedule. Other formats are outside this feed."
                    : "The schedule provider could not be reached. Career analytics remain available."}
        </p>
      </div>
      {!loading && !available && (
        <button
          className="text-button"
          onClick={() => {
            setLoading(true);
            setAttempt((a) => a + 1);
          }}
        >
          Retry
        </button>
      )}
      {available && <Badge tone="green">Upcoming</Badge>}
    </Panel>
  );
}

function Career({
  view,
  navigate,
}: {
  view: ViewState;
  navigate: (page: Page, extra?: Partial<ViewState>) => void;
}) {
  const [opponent, setOpponent] = useState("");
  const opponents = opponentData
    .filter((o) => o.country.toLowerCase().includes(opponent.toLowerCase()))
    .sort((a, b) => b.runs - a.runs);
  return (
    <>
      <div className="scope-caption">
        <span>{formatLabel(view.format)} career totals</span>
        <span>{formatCutoffs[view.format]}</span>
      </div>
      <StatCards format={view.format} />
      <Panel>
        <PanelHead title="Format breakdown" eyebrow="CAREER SNAPSHOTS" />
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              Career batting records by format
            </caption>
            <thead>
              <tr>
                {[
                  "Format",
                  "Matches",
                  "Innings",
                  "Runs",
                  "Average",
                  "Strike rate",
                  "100s",
                  "50s",
                ].map((t) => (
                  <th key={t}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(["ODI", "Test", "T20I", "IPL"] as const).map((f) => {
                const s = statsByFormat[f];
                return (
                  <tr
                    key={f}
                    className={view.format === f ? "selected-row" : ""}
                  >
                    <td>
                      <button
                        className="format-link"
                        onClick={() => navigate("career", { format: f })}
                      >
                        <i style={{ background: fmtColor[f] }} />
                        {f}
                      </button>
                    </td>
                    <td>{s.matches}</td>
                    <td>{s.innings}</td>
                    <td className="strong">{number(s.runs)}</td>
                    <td>{s.average.toFixed(2)}</td>
                    <td>{s.strikeRate.toFixed(2)}</td>
                    <td>{s.centuries}</td>
                    <td>{s.fifties}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="panel-footnote">
          IPL is a separate league scope and is never included in international
          totals.
        </p>
      </Panel>
      <div className="career-grid">
        <Panel>
          <PanelHead
            eyebrow="ALL INTERNATIONAL FORMATS"
            title="Across the opposition"
          />
          <label className="search-input">
            <Search size={16} />
            <input
              aria-label="Find an opponent"
              placeholder="Find an opponent…"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
            />
          </label>
          <p className="panel-footnote">
            Combined Test + ODI + T20I records · this breakdown is independent
            of the career format filter.
          </p>
          <div className="opponent-list">
            {opponents.map((o, i) => (
              <div className="opponent-row" key={o.code}>
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <div className="opponent-label">
                    <strong>{o.country}</strong>
                    <span>
                      {number(o.runs)} <small>runs</small>
                    </span>
                  </div>
                  <div className="bar-track">
                    <span style={{ width: `${(o.runs / 6000) * 100}%` }} />
                  </div>
                  <div className="opponent-meta">
                    {o.matches} matches{" "}
                    <span>
                      {o.avg.toFixed(2)} avg · {o.centuries} centuries
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!opponents.length && (
            <Empty title="No opponent found" text="Try another country name." />
          )}
        </Panel>
        <div className="stack">
          <Panel className="captain-card">
            <span className="eyebrow">TEST CAPTAINCY · 2014–2022</span>
            <Trophy size={25} />
            <h2>Leading from the front.</h2>
            <div className="captain-value">
              40 <span>wins</span>
            </div>
            <div className="captain-stats">
              <span>
                <strong>68</strong>Tests captained
              </span>
              <span>
                <strong>58.82%</strong>Win rate
              </span>
            </div>
            <p>
              17 losses · 11 draws. India’s first Test series victory in
              Australia came under Kohli in 2018–19.
            </p>
          </Panel>
          <Panel>
            <PanelHead title="Beyond international cricket" />
            <div className="domestic">
              {[
                ["First-class", allFormatCareerStats.firstClass.batting],
                ["List A", allFormatCareerStats.listA.batting],
                ["All T20", allFormatCareerStats.allT20.batting],
              ].map(([label, data]) => {
                const s =
                  data as typeof allFormatCareerStats.firstClass.batting;
                return (
                  <div key={String(label)}>
                    <span>
                      {String(label)}
                      <small>
                        {s.matches} matches · {s.average.toFixed(2)} avg
                      </small>
                    </span>
                    <strong>
                      {number(s.runs)}
                      <small>runs</small>
                    </strong>
                  </div>
                );
              })}
            </div>
            <p className="panel-footnote">
              These scopes overlap with international and league records. Do not
              add them together.
            </p>
          </Panel>
        </div>
      </div>

      <Panel>
        <PanelHead eyebrow="THE JOURNEY" title="Milestones, not just numbers" />
        <div className="timeline">
          {careerMilestones.map((m) => (
            <article key={m.year}>
              <span>{m.year}</span>
              <div>
                <small>{m.phase}</small>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </>
  );
}
function Pressure({ format }: { format: "ODI" | "Test" | "T20I" }) {
  const cards = getPressurePerformanceView(format).cards;
  const [selectedCell, setSelectedCell] = useState<string>("middle-below-6");
  const c = format === "Test" ? null : archive.coverage.formats[format];
  const cells = format === "Test" ? [] : archive.pressureMap[format].cells;
  const active =
    cells.find((c) => `${c.phase}-${c.rrrBand}` === selectedCell) || cells[0];
  const chase = format === "Test" ? null : archive.chaseMetrics[format];
  return (
    <>
      <div className="notice">
        <ShieldCheck size={19} />
        <div>
          <strong>
            {format === "Test"
              ? "Test scorecard splits"
              : `${c!.archiveMatches} / ${c!.referenceMatches} ${format} matches in the delivery archive`}
          </strong>
          <p>
            {format === "Test"
              ? "Test situations are shown separately from required-run-rate analysis."
              : `Archive ends ${displayDate(coverage.coverageEnd)}. Career totals use a separate snapshot; missing deliveries are not estimated.`}
          </p>
        </div>
      </div>
      <div className="pressure-cards">
        {cards.map((card) => (
          <Panel key={card.id}>
            <div className="situation-title">
              <span className="eyebrow">{card.category}</span>
              <Badge tone={card.innings < 10 ? "amber" : ""}>
                {card.innings} innings
              </Badge>
            </div>
            <h3>{card.title}</h3>
            <div className="situation-numbers">
              <div>
                <strong>{card.battingAvgDisplay}</strong>
                <small>Batting average</small>
              </div>
              <div>
                <strong>{card.strikeRateDisplay}</strong>
                <small>Strike rate</small>
              </div>
            </div>
            <div className="situation-meta">
              <span>{number(card.runs)} runs</span>
              <span>{card.dismissals} outs</span>
              <span>{number(card.balls)} balls</span>
            </div>
            <p>{card.scopeDescription}</p>
            <details>
              <summary>Sample & baseline</summary>
              <p>
                {card.sampleBadgeText}. {card.baselineScopeLabel}:{" "}
                {card.baselineAvgDisplay}. {card.coverageLabel}.
              </p>
            </details>
          </Panel>
        ))}
      </div>
      {format !== "Test" && (
        <>
          <Panel>
            <PanelHead
              eyebrow="DELIVERY-LEVEL ANALYSIS"
              title="The pressure map"
              action={<Badge>{format} run chases</Badge>}
            />
            <p className="section-copy">
              Batting average by innings phase and required run rate. Select a
              cell to inspect its sample.
            </p>
            <div className="table-scroll">
              <div className="heatmap">
                <span className="heat-corner">PHASE / RRR</span>
                {["< 6", "6–8", "8–10", "10–12", "> 12"].map((b) => (
                  <span className="heat-heading" key={b}>
                    {b}
                    <small>runs / over</small>
                  </span>
                ))}
                {["powerplay", "middle", "death"].map((phase) => (
                  <div className="heat-row" key={phase}>
                    <span className="phase-label">
                      {phase}
                      <small>
                        {format === "ODI"
                          ? {
                              powerplay: "Overs 1–10",
                              middle: "Overs 11–40",
                              death: "Overs 41–50",
                            }[phase]
                          : {
                              powerplay: "Overs 1–6",
                              middle: "Overs 7–15",
                              death: "Overs 16–20",
                            }[phase]}
                      </small>
                    </span>
                    {[
                      "below-6",
                      "6-to-8",
                      "8-to-10",
                      "10-to-12",
                      "above-12",
                    ].map((band, idx) => {
                      const row = cells.filter((c) => c.phase === phase);
                      const cell =
                        row.find((c) => c.rrrBand === band) || row[idx];
                      if (!cell) return <span key={band} />;
                      const key = `${cell.phase}-${cell.rrrBand}`;
                      const thin = cell.sampleSize.ballsFaced < 12;
                      return (
                        <button
                          key={band}
                          className={`heat-cell ${selectedCell === key ? "active" : ""} ${thin ? "thin" : ""}`}
                          style={{
                            backgroundColor: thin
                              ? undefined
                              : `rgba(237,118,102,${0.08 + (Math.min(cell.average || 0, 100) / 100) * 0.36})`,
                          }}
                          onClick={() => setSelectedCell(key)}
                          aria-label={`${phase}, ${cell.rrrRange}: average ${cell.average ?? "unavailable"}, ${cell.sampleSize.ballsFaced} balls`}
                          aria-pressed={selectedCell === key}
                        >
                          <strong>
                            {thin ? "—" : (cell.average?.toFixed(1) ?? "—")}
                          </strong>
                          <small>{cell.sampleSize.ballsFaced} balls</small>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            {active && (
              <div className="cell-detail" aria-live="polite">
                <div>
                  <Badge>
                    {active.phase} · {active.rrrRange}
                  </Badge>
                  <h3>
                    {active.sampleSize.ballsFaced < 12
                      ? "Insufficient sample"
                      : active.average === null
                        ? "Average unavailable: no dismissals"
                        : `${active.average.toFixed(2)} batting average`}
                  </h3>
                  <p>
                    {active.sampleSizeBand} sample ·{" "}
                    {active.sampleSize.inningsCount} innings ·{" "}
                    {active.dismissals} dismissals
                  </p>
                </div>
                <div>
                  <span>
                    Strike rate
                    <strong>{active.strikeRate?.toFixed(2) ?? "—"}</strong>
                  </span>
                  <span>
                    Runs<strong>{active.runs}</strong>
                  </span>
                  <span>
                    Boundary runs
                    <strong>
                      {active.boundaryPercentage?.toFixed(1) ?? "—"}%
                    </strong>
                  </span>
                </div>
              </div>
            )}
            <p className="panel-footnote">
              Below 12 balls: insufficient; 12–29: limited; 30–59: usable; 60+:
              strong. A small sample is not a reliable ranking.
            </p>
          </Panel>
          {chase && (
            <Panel>
              <PanelHead
                title="Chasing, with context"
                eyebrow="COVERED ARCHIVE ONLY"
              />
              <div className="chase-grid">
                <div>
                  <strong>{chase.average.toFixed(2)}</strong>
                  <span>Average in all batting chases</span>
                  <small>
                    {chase.runs.toLocaleString()} runs / {chase.dismissals}{" "}
                    dismissals
                  </small>
                </div>
                <div>
                  <strong>{chase.successfulChaseAverage.toFixed(2)}</strong>
                  <span>Average in winning chases</span>
                  <small>{chase.successfulInningsCount} winning innings</small>
                </div>
                <div>
                  <strong>
                    {(
                      (chase.successfulInningsCount / chase.inningsCount) *
                      100
                    ).toFixed(1)}
                    %
                  </strong>
                  <span>Wins among batting chases</span>
                  <small>
                    {chase.successfulInningsCount} wins / {chase.inningsCount}{" "}
                    batting chases · includes all outcomes
                  </small>
                </div>
              </div>
              <div className="target-bands">
                {chase.targetBands.map((b) => (
                  <div key={b.band}>
                    <small>Target {b.band}</small>
                    <strong>{b.average?.toFixed(2) ?? "—"}</strong>
                    <span>{b.innings} innings · batting average</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
      <div className="notice subdued">
        <CircleHelp size={20} />
        <div>
          <strong>Why there is no single “clutch score”</strong>
          <p>
            Composite weights are still under calibration. Small finals samples
            and overlapping situations can mislead, so the app presents the
            underlying statistics instead.
          </p>
        </div>
      </div>
    </>
  );
}
function Compare({
  view,
  update,
}: {
  view: ViewState;
  update: (patch: Partial<ViewState>) => void;
}) {
  const format = view.format as "ODI" | "Test" | "T20I";
  const validPlayers = view.players
    ?.split(",")
    .filter((id) => ALL_RADAR_PLAYERS_FORMATTED.some((p) => p.id === id))
    .slice(0, 4);
  const selected = validPlayers?.length
    ? [...new Set(validPlayers)]
    : ["kohli", "williamson"];
  const metric: "battingAvg" | "strikeRate" | "centuries" =
    view.metric === "strikeRate" || view.metric === "centuries"
      ? view.metric
      : "battingAvg";
  const key = format === "Test" ? "TEST" : format;
  const labels = {
    battingAvg: "Batting average",
    strikeRate: "Strike rate",
    centuries: "Centuries",
  };
  const players = ALL_RADAR_PLAYERS_FORMATTED.filter((p) =>
    selected.includes(p.id),
  ).map((p) => ({
    ...p,
    stats:
      p.id === "kohli"
        ? {
            battingAvg: statsByFormat[format].average,
            strikeRate: statsByFormat[format].strikeRate,
            centuries: statsByFormat[format].centuries,
          }
        : p.formats[key].raw,
  }));
  const max = Math.max(1, ...players.map((p) => p.stats[metric]));
  return (
    <>
      <div className="comparison-presets">
        <span>Explore a different conversation</span>
        <button
          onClick={() =>
            update({
              format: "Test",
              players: "kohli,smith,root,williamson",
              focusA: "root",
              focusB: "smith",
            })
          }
        >
          Modern Test quartet
        </button>
        <button
          onClick={() =>
            update({
              format: "ODI",
              players: "sachin,ponting,rohit",
              focusA: "sachin",
              focusB: "ponting",
            })
          }
        >
          ODI across eras
        </button>
        <button
          onClick={() =>
            update({
              format: "T20I",
              players: "kohli,rohit",
              focusA: "rohit",
              focusB: "kohli",
            })
          }
        >
          India’s T20I chapter
        </button>
      </div>
      <div className="notice">
        <CircleHelp size={18} />
        <div>
          <strong>Reference snapshots, not a live leaderboard</strong>
          <p>
            Peer records come from the existing comparison dataset and may have
            different cutoffs. Undefined chase-success and consistency scores
            are excluded.
          </p>
        </div>
      </div>
      <Panel>
        <PanelHead
          eyebrow="BUILD YOUR COMPARISON"
          title="Choose up to four players"
          action={<Badge>{selected.length} / 4 selected</Badge>}
        />
        <div className="player-picker">
          {ALL_RADAR_PLAYERS_FORMATTED.map((p) => (
            <button
              key={p.id}
              aria-pressed={selected.includes(p.id)}
              disabled={
                (!selected.includes(p.id) && selected.length === 4) ||
                (selected.includes(p.id) && selected.length === 1)
              }
              className={selected.includes(p.id) ? "selected" : ""}
              onClick={() =>
                update({
                  players: (selected.includes(p.id)
                    ? selected.filter((id) => id !== p.id)
                    : [...selected, p.id]
                  ).join(","),
                })
              }
            >
              <span className="player-initial">
                {p.shortName.slice(0, 2).toUpperCase()}
              </span>
              <span>
                {p.name}
                <small>{p.country}</small>
              </span>
              {selected.includes(p.id) && <Check size={16} />}
            </button>
          ))}
        </div>
      </Panel>
      <CompareVisual
        players={players}
        format={format}
        view={view}
        update={update}
      />
      <Panel>
        <PanelHead
          title={`${format} · ${labels[metric]}`}
          action={
            <select
              aria-label="Comparison metric"
              value={metric}
              onChange={(e) => update({ metric: e.target.value })}
            >
              <option value="battingAvg">Batting average</option>
              <option value="strikeRate">Strike rate</option>
              <option value="centuries">Centuries</option>
            </select>
          }
        />
        <div className="comparison-bars">
          {[...players]
            .sort((a, b) => b.stats[metric] - a.stats[metric])
            .map((p, i) => (
              <div key={p.id}>
                <span className="rank">0{i + 1}</span>
                <div>
                  <div className="opponent-label">
                    <strong>{p.name}</strong>
                    <strong>
                      {p.stats[metric].toFixed(metric === "centuries" ? 0 : 2)}
                    </strong>
                  </div>
                  <div className="comparison-track">
                    <span
                      style={{
                        width: `${(p.stats[metric] / max) * 100}%`,
                        background: p.id === "kohli" ? "#ed7666" : "#747d98",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Panel>
      <Panel>
        <PanelHead title="The numbers, side by side" />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                {players.map((p) => (
                  <th key={p.id}>{p.shortName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(labels) as (keyof typeof labels)[]).map((m) => (
                <tr key={m}>
                  <td>{labels[m]}</td>
                  {players.map((p) => (
                    <td key={p.id} className={p.id === "kohli" ? "accent" : ""}>
                      {p.stats[m].toFixed(m === "centuries" ? 0 : 2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="panel-footnote">
          Raw values, without synthetic ratings. Cross-era differences in
          conditions and sample sizes still matter.
        </p>
      </Panel>
    </>
  );
}
function InningsDetail({
  innings,
  close,
  saved,
  toggleSave,
}: {
  innings: DefiningInnings;
  close: () => void;
  saved: boolean;
  toggleSave: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      className="innings-dialog"
      ref={dialog}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dialog-top">
        <Badge>
          {innings.format} · {displayDate(innings.date)}
        </Badge>
        <button
          className="icon-button"
          aria-label="Close innings details"
          onClick={close}
          autoFocus
        >
          <X size={20} />
        </button>
      </div>
      <span className="eyebrow">INDIA VS {innings.opponent.toUpperCase()}</span>
      <div className="detail-score">
        {innings.runs}
        {innings.notOut ? "*" : ""}
        <span>off {innings.ballsFaced} balls</span>
      </div>
      <h2>{innings.title}</h2>
      <p>{innings.verifiedNarrative}</p>
      <div className="detail-stats">
        <span>
          <strong>{innings.strikeRate.toFixed(2)}</strong>Strike rate
        </span>
        <span>
          <strong>{innings.fours}</strong>Fours
        </span>
        <span>
          <strong>{innings.sixes}</strong>Sixes
        </span>
        <span>
          <strong>{innings.inningsResult}</strong>Match result
        </span>
      </div>
      <dl>
        <dt>Venue</dt>
        <dd>{innings.venue}</dd>
        <dt>Competition</dt>
        <dd>{innings.tournament}</dd>
        <dt>Situation</dt>
        <dd>{innings.stage}</dd>
      </dl>
      <div className="dialog-actions">
        <a
          className="primary"
          href={innings.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open scorecard <ExternalLink size={15} />
        </a>
        <button className="secondary" onClick={toggleSave}>
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved" : "Save innings"}
        </button>
      </div>
    </dialog>
  );
}
function Innings({
  view,
  update,
  saved,
  toggleSave,
}: {
  view: ViewState;
  update: (patch: Partial<ViewState>) => void;
  saved: string[];
  toggleSave: (id: string) => void;
}) {
  const [detail, setDetail] = useState<DefiningInnings | null>(null);
  const [sort, setSort] = useState("recent");
  const filtered = filterInnings(view, saved).sort((a, b) =>
    sort === "runs"
      ? b.runs - a.runs
      : sort === "oldest"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date),
  );
  const years = [
    ...new Set(DEFINING_INNINGS_DATA.map((i) => i.date.slice(0, 4))),
  ]
    .sort()
    .reverse();
  function download() {
    const url = URL.createObjectURL(
      new Blob([csvRows(filtered)], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "kohli-selected-innings.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div className="library-toolbar">
        <label className="search-input">
          <Search size={18} />
          <input
            value={view.query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Search opponent, venue or innings…"
            aria-label="Search innings"
          />
        </label>
        <select
          value={view.year}
          onChange={(e) => update({ year: e.target.value })}
          aria-label="Filter by year"
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
        <select
          value={view.result}
          onChange={(e) => update({ result: e.target.value })}
          aria-label="Filter by result"
        >
          <option value="">All results</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
        </select>
        <button
          className={`secondary ${view.saved ? "active" : ""}`}
          aria-pressed={view.saved}
          onClick={() => update({ saved: !view.saved })}
        >
          <Bookmark size={16} />
          Saved
        </button>
        <button
          className="icon-button"
          aria-label="Export filtered innings as CSV"
          disabled={!filtered.length}
          onClick={download}
        >
          <ArrowDownToLine size={19} />
        </button>
      </div>
      <div className="scope-caption">
        <span aria-live="polite">
          {filtered.length} selected innings · curated, not a complete match
          archive{view.format === "ALL" ? " · all formats, including IPL" : ""}
        </span>
        <select
          aria-label="Sort innings"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="recent">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="runs">Highest score</option>
        </select>
      </div>
      <div className="innings-grid">
        {filtered.map((i) => (
          <Panel key={i.id} className="innings-card">
            <div className="innings-card-top">
              <Badge>{i.format}</Badge>
              <button
                className="icon-button"
                onClick={() => toggleSave(i.id)}
                aria-label={`${saved.includes(i.id) ? "Unsave" : "Save"} ${i.title}`}
                aria-pressed={saved.includes(i.id)}
              >
                <Bookmark
                  size={17}
                  fill={saved.includes(i.id) ? "currentColor" : "none"}
                />
              </button>
            </div>
            <button className="innings-open" onClick={() => setDetail(i)}>
              <span className="eyebrow">VS {i.opponent.toUpperCase()}</span>
              <div className="innings-score">
                {i.runs}
                {i.notOut ? "*" : ""}
                <span>({i.ballsFaced})</span>
              </div>
              <h3>{i.title}</h3>
              <p>{i.venue}</p>
              <div className="innings-bottom">
                <span>{displayDate(i.date)}</span>
                <span className={i.inningsResult === "won" ? "won" : "lost"}>
                  {i.inningsResult}
                  <ChevronRight size={14} />
                </span>
              </div>
            </button>
          </Panel>
        ))}
      </div>
      {!filtered.length && (
        <Panel>
          <Empty
            title="No innings match these filters"
            text="Try a different format, year or search. Saved innings are stored on this device."
            action={
              <button
                className="secondary"
                onClick={() =>
                  update({
                    query: "",
                    year: "",
                    result: "",
                    saved: false,
                    format: "ALL",
                  })
                }
              >
                Clear filters
              </button>
            }
          />
        </Panel>
      )}
      {detail && (
        <InningsDetail
          innings={detail}
          close={() => setDetail(null)}
          saved={saved.includes(detail.id)}
          toggleSave={() => toggleSave(detail.id)}
        />
      )}
    </>
  );
}
function Sources() {
  return (
    <>
      <div className="stats-grid">
        <Panel className="stat-card">
          <span className="stat-label">Archive matches</span>
          <div className="stat-value">{coverage.archiveMatches}</div>
          <span className="stat-note">
            of {coverage.referenceMatches} reference matches
          </span>
        </Panel>
        <Panel className="stat-card">
          <span className="stat-label">Innings coverage</span>
          <div className="stat-value">{coverage.inningsCoveragePercent}%</div>
          <span className="stat-note">
            {coverage.archiveBattingInnings} /{" "}
            {coverage.referenceBattingInnings} innings
          </span>
        </Panel>
        <Panel className="stat-card">
          <span className="stat-label">Archive cutoff</span>
          <div className="date-value">{displayDate(coverage.coverageEnd)}</div>
          <span className="stat-note">
            Latest included delivery-level match
          </span>
        </Panel>
        <Panel className="stat-card">
          <span className="stat-label">Composite score</span>
          <div className="date-value">Not published</div>
          <span className="stat-note">Calibration pending</span>
        </Panel>
      </div>
      <Panel className="ipl-provenance-panel">
        <PanelHead
          eyebrow="NEW / SOURCED IPL ARCHIVE"
          title="The RCB data, with its boundaries"
        />
        <p className="panel-footnote">
          {iplProvenance.innings} batting innings across {iplProvenance.matches}{" "}
          covered appearances, {iplProvenance.coverageStart} to{" "}
          {iplProvenance.coverageEnd}. Runs, balls faced, dismissals and
          boundaries reconcile to the stored IPL batting totals. The archive
          appearance count differs from the career match count. DNB and super
          overs are excluded; no missing match is filled with an estimate.
        </p>
        <p className="panel-footnote">
          IPL scoring phases use actual match overs: 1–6, 7–15 and 16–20.
          International career totals and situational analytics exclude IPL.
        </p>
        <details>
          <summary>IPL source fingerprint</summary>
          <p className="source-hash">SHA-256: {iplProvenance.sourceHash}</p>
          <a href={iplProvenance.sourceUrl}>Cricsheet IPL JSON archive</a>
        </details>
      </Panel>
      <Panel>
        <PanelHead title="A few useful distinctions" />
        <div className="source-explainer">
          <article>
            <Badge>01</Badge>
            <h3>Career totals</h3>
            <p>
              Stored career snapshots sourced from scorecards and reference
              profiles. Format-specific dates appear beside the totals.
            </p>
          </article>
          <article>
            <Badge>02</Badge>
            <h3>Situational analytics</h3>
            <p>
              Derived from the available Cricsheet archive. Missing matches are
              excluded rather than filled with estimates.
            </p>
          </article>
          <article>
            <Badge>03</Badge>
            <h3>Editorial selections</h3>
            <p>
              The archive contains 412 covered ODI/T20I and 275 IPL batting
              innings; Defining innings contains 12 curated highlights. Peer
              comparisons use stored reference records; neither is a complete
              live database.
            </p>
          </article>
        </div>
      </Panel>
      <Panel>
        <PanelHead
          title="Source register"
          action={
            <a className="secondary" href="/data-dictionary.json" download>
              <ArrowDownToLine size={15} />
              Data dictionary
            </a>
          }
        />
        <p className="panel-footnote">
          Source metadata last reviewed {DATA_VERIFIED_ON_FORMATTED}. Archive
          generated {displayDate(archive.generatedAt)}. Structural checks
          establish internal consistency, not independent historical accuracy.
        </p>
        <div className="source-list">
          {DATA_PROVENANCE_MANIFEST.filter((s) =>
            [
              "careerStats",
              "opponentData",
              "legendsComparisonData",
              "definingInningsData",
            ].includes(s.datasetKey),
          ).map((s) => (
            <article key={s.datasetKey}>
              <div>
                <h3>{s.datasetName}</h3>
                <Badge>{s.classification}</Badge>
              </div>
              <p>{s.coverageNote || s.limitationDisclaimer}</p>
              <small>
                {s.sourceName} · {s.verificationStatus}
              </small>
              {(s.sourceUrl || s.referenceLandingPage) && (
                <a
                  href={s.sourceUrl || s.referenceLandingPage}
                  target="_blank"
                  rel="noreferrer"
                >
                  Reference <ExternalLink size={13} />
                </a>
              )}
            </article>
          ))}
        </div>
      </Panel>
      <div className="notice subdued">
        <Database size={20} />
        <div>
          <strong>Cricsheet attribution</strong>
          <p>
            Delivery data: Cricsheet / Stephen Rushe. See the bundled dataset’s
            license and source details. This is an independent project, not an
            official ICC, BCCI or player application.
          </p>
          <a
            href={archive.dataset.sourcePageUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open Cricsheet <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </>
  );
}
export default function Dashboard() {
  const [view, setView] = useState(() => readView(window.location.hash));
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [shareFallback, setShareFallback] = useState("");
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("kohli-saved-innings") || "[]",
      );
      return Array.isArray(value)
        ? value.filter((v) => typeof v === "string")
        : [];
    } catch {
      return [];
    }
  });
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    const sync = () => setView(readView(window.location.hash));
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);
  useEffect(() => {
    const dismiss = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, []);
  useEffect(() => {
    document.title = `${view.page === "sources" ? "Data & sources" : navigation.find((n) => n.id === view.page)?.label} · Kohli Analytics`;
  }, [view.page]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  function update(patch: Partial<ViewState>, push = false) {
    if (patch.format && patch.format !== view.format)
      patch = {
        query: "",
        year: "",
        result: "",
        opponent: "",
        venue: "",
        situation: "",
        minRuns: "",
        ...patch,
      };
    if (patch.format === "Test") patch = { ...patch, collection: "highlights" };
    if (patch.format && patch.format !== "Test" && !patch.collection)
      patch = { ...patch, collection: "archive" };
    const next = readView(viewHash({ ...view, ...patch }));
    window.history[push ? "pushState" : "replaceState"](
      null,
      "",
      viewHash(next),
    );
    setView(next);
  }
  function navigate(page: Page, extra: Partial<ViewState> = {}) {
    update(
      {
        page,
        query: "",
        year: "",
        result: "",
        saved: false,
        collection: "",
        opponent: "",
        venue: "",
        situation: "",
        minRuns: "",
        ...extra,
      },
      true,
    );
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
    main.current?.focus();
  }
  function toggleSave(id: string) {
    const next = saved.includes(id)
      ? saved.filter((v) => v !== id)
      : [...saved, id];
    setSaved(next);
    try {
      localStorage.setItem("kohli-saved-innings", JSON.stringify(next));
      setToast(
        next.includes(id)
          ? "Innings saved on this device"
          : "Innings removed from saved",
      );
    } catch {
      setToast("Saved for this session only; device storage is unavailable.");
    }
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast("Link copied with your current filters");
    } catch {
      setShareFallback(window.location.href);
    }
  }
  const availableFormats =
    view.page === "pressure" || view.page === "compare"
      ? (["ODI", "Test", "T20I"] as const)
      : formats;
  return (
    <div className={`dashboard-app page-${view.page}`}>
      <a
        href="#dashboard-main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          main.current?.focus();
        }}
      >
        Skip to content
      </a>
      {menu && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <a
          href="#/overview?format=ALL"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("overview");
          }}
        >
          <span className="brand-mark">
            k<span>.</span>
          </span>
          <span>
            KOHLI<small>ANALYTICS</small>
          </span>
        </a>
        <div className="workspace-label">THE KOHLI ARCHIVE</div>
        <nav aria-label="Main navigation">
          {navigation.map((n) => (
            <a
              key={n.id}
              href={viewHash({ ...view, page: n.id })}
              onClick={(e) => {
                e.preventDefault();
                navigate(n.id);
              }}
              className={view.page === n.id ? "active" : ""}
              aria-current={view.page === n.id ? "page" : undefined}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {view.page === n.id && <span className="nav-indicator" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="status-dot" />
            <span>
              Numbers with context.<small>Explore beyond the scorecard.</small>
            </span>
          </div>
          <a
            href="#/sources"
            className={
              view.page === "sources" ? "source-nav active" : "source-nav"
            }
            onClick={(e) => {
              e.preventDefault();
              navigate("sources");
            }}
          >
            <Database size={18} />
            Data & sources
            <ArrowUpRight size={15} />
          </a>
          <div className="sidebar-profile">
            <div className="avatar">18</div>
            <div>
              Virat Kohli<small>India · Right-hand bat</small>
            </div>
            <span className="india-mark" aria-label="India" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="icon-button menu-button"
              aria-label="Open navigation"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb">
              Kohli Analytics <ChevronRight size={14} />
              <strong>
                {view.page === "sources"
                  ? "Data & sources"
                  : navigation.find((n) => n.id === view.page)?.label}
              </strong>
            </span>
          </div>
          <div className="topbar-actions">
            <button
              className="quick-search"
              onClick={() => navigate("innings")}
            >
              <Search size={16} />
              <span>Find an innings</span>
              <span className="key-hint">↗</span>
            </button>
            <button
              className="icon-button"
              aria-label="Data and methodology"
              onClick={() => navigate("sources")}
            >
              <CircleHelp size={19} />
            </button>
            <div className="topbar-avatar">VK</div>
          </div>
        </header>
        <main id="dashboard-main" ref={main} tabIndex={-1}>
          <div className="page-heading">
            <div>
              <div className="eyebrow page-eyebrow">
                THE KOHLI ARCHIVE <span>/</span> {view.page.toUpperCase()}
              </div>
              <h1>{titles[view.page][0]}</h1>
              <p>{titles[view.page][1]}</p>
            </div>
            <button className="secondary share-button" onClick={share}>
              <Share2 size={15} />
              Share view
            </button>
          </div>
          {shareFallback && (
            <div className="share-fallback">
              <label>
                Copy this view link
                <input
                  readOnly
                  value={shareFallback}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <button
                className="icon-button"
                aria-label="Close share link"
                onClick={() => setShareFallback("")}
              >
                <X size={18} />
              </button>
            </div>
          )}
          {view.page !== "sources" &&
            view.page !== "story" &&
            view.page !== "ipl" &&
            view.page !== "club" && (
              <div className="filterbar">
                <div
                  className="format-tabs"
                  role="group"
                  aria-label="Format scope"
                >
                  {availableFormats.map((f) => (
                    <button
                      key={f}
                      className={view.format === f ? "active" : ""}
                      aria-pressed={view.format === f}
                      onClick={() => update({ format: f }, true)}
                    >
                      {f === "ALL"
                        ? view.page === "innings"
                          ? "All formats"
                          : "All international"
                        : f}
                    </button>
                  ))}
                </div>
                <span className="filter-note">
                  <ListFilter size={14} />
                  {view.page === "innings"
                    ? "687 archive innings · 12 defining moments"
                    : view.page === "pressure"
                      ? "Situational archive"
                      : view.page === "compare"
                        ? "Reference snapshots"
                        : view.page === "discover"
                          ? "Covered innings archive"
                          : "Career snapshot"}
                </span>
              </div>
            )}
          <Suspense
            fallback={
              <div className="loading" role="status">
                Loading innings workspace…
              </div>
            }
          >
            {view.page === "ipl" && (
              <IPLHub
                view={view}
                update={update}
                navigate={navigate}
                saved={saved}
                toggleSave={toggleSave}
              />
            )}
            {view.page === "discover" && (
              <DiscoveryLab
                view={view}
                update={update}
                navigate={navigate}
                saved={saved}
                toggleSave={toggleSave}
              />
            )}
            {view.page === "club" && <CricketClub navigate={navigate} />}
            {view.page === "story" && (
              <StoryExperience
                view={view}
                update={update}
                navigate={navigate}
              />
            )}
            {view.page === "overview" && (
              <OverviewContent
                view={view}
                navigate={navigate}
                stats={<StatCards format={view.format} />}
                fixture={<Fixture />}
              />
            )}
            {view.page === "career" && (
              <>
                <StatCards format={view.format} />
                <CareerLab view={view} update={update} />
                <details className="reference-details">
                  <summary>Career reference tables & milestones</summary>
                  <Career view={view} navigate={navigate} />
                </details>
              </>
            )}
            {view.page === "pressure" && (
              <>
                <Pressure format={view.format as "ODI" | "Test" | "T20I"} />
                <BowlerLab format={view.format as "ODI" | "Test" | "T20I"} />
              </>
            )}
            {view.page === "compare" && <Compare view={view} update={update} />}
            {view.page === "innings" && (
              <ArchiveLibrary
                view={view}
                update={update}
                saved={saved}
                toggleSave={toggleSave}
                highlights={
                  <Innings
                    view={view}
                    update={update}
                    saved={saved}
                    toggleSave={toggleSave}
                  />
                }
              />
            )}
            {view.page === "sources" && <Sources />}
          </Suspense>
          <footer className="app-footer">
            <span>
              Kohli Analytics <span> / </span> An independent cricket data
              project
            </span>
            <button onClick={() => navigate("sources")}>
              Sources & methodology <ArrowUpRight size={13} />
            </button>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation
          .filter((n) =>
            ["overview", "discover", "ipl", "innings"].includes(n.id),
          )
          .map((n) => (
            <button
              key={n.id}
              className={view.page === n.id ? "active" : ""}
              aria-current={view.page === n.id ? "page" : undefined}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={20} />
              <span>
                {
                  {
                    overview: "Home",
                    discover: "Discover",
                    ipl: "RCB",
                    story: "Story",
                    club: "Club",
                    career: "Career",
                    pressure: "Pressure",
                    compare: "Compare",
                    innings: "Innings",
                  }[n.id]
                }
              </span>
            </button>
          ))}
        <button aria-label="More navigation" onClick={() => setMenu(true)}>
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
