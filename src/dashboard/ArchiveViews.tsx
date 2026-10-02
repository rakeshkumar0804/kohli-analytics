import { ExploreEntrances } from "./ExploreEntrances";
import { IdentityHero, StoryEntrances } from "./StoryHero";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Panel, PanelHead } from "./ui";
import {
  archiveCsv,
  bowlerMatchups,
  groupArchive,
  inningsIndex,
  selectArchive,
  summarize,
  type ArchiveInnings,
} from "./insights";
import {
  number,
  displayDate,
  statsByFormat,
  type Page,
  type ViewState,
} from "./model";
import { DEFINING_INNINGS_DATA } from "../data/definingInningsData";
import { TEST_SITUATIONAL_SPLITS } from "../data/testSituationalData";

const fmtColors: Record<string, string> = {
  ODI: "#ee806b",
  T20I: "#77c5b1",
  Test: "#a19ae8",
  IPL: "#e4bb70",
};
const countries: Record<string, string> = {
  Australia: "AUS",
  England: "ENG",
  India: "IND",
  Pakistan: "PAK",
  "New Zealand": "NZ",
  "South Africa": "SA",
  "Sri Lanka": "SL",
  "West Indies": "WI",
  Bangladesh: "BAN",
  Zimbabwe: "ZIM",
  Afghanistan: "AFG",
  Ireland: "IRE",
};
const n = (value: number | null, dp = 2) =>
  value === null ? "—" : number(value, dp);
const options = (rows: ArchiveInnings[], key: "opponent" | "venue") =>
  [...new Set(rows.map((r) => r[key]))].sort();
export function Sparkline({
  values,
  color = "#ed806c",
  height = 60,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  const max = Math.max(1, ...values);
  const pts = values.map(
    (v, i) =>
      `${10 + (i * 280) / Math.max(values.length - 1, 1)},${height - 8 - (v / max) * (height - 18)}`,
  );
  return (
    <svg viewBox={`0 0 300 ${height}`} className="sparkline" aria-hidden="true">
      <path
        d={`M${pts.join(" L")}`}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      <circle
        cx={10 + ((values.length - 1) * 280) / Math.max(values.length - 1, 1)}
        cy={height - 8 - ((values.at(-1) || 0) / max) * (height - 18)}
        r="3"
        fill={color}
      />
    </svg>
  );
}
function Histogram({ rows }: { rows: ArchiveInnings[] }) {
  const bins = [
    { label: "0–9", min: 0, max: 9 },
    { label: "10–29", min: 10, max: 29 },
    { label: "30–49", min: 30, max: 49 },
    { label: "50–99", min: 50, max: 99 },
    { label: "100+", min: 100, max: 1000 },
  ].map((b) => ({
    ...b,
    count: rows.filter((r) => r.runs >= b.min && r.runs <= b.max).length,
  }));
  const max = Math.max(1, ...bins.map((b) => b.count));
  return (
    <div className="score-distribution">
      {bins.map((b) => (
        <div key={b.label}>
          <strong>{b.count}</strong>
          <div>
            <i style={{ height: `${(b.count / max) * 100}%` }} />
          </div>
          <span>{b.label}</span>
        </div>
      ))}
    </div>
  );
}
export function ArchiveDetail({
  innings,
  close,
  saved,
  toggleSave,
}: {
  innings: ArchiveInnings;
  close: () => void;
  saved?: boolean;
  toggleSave?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [detail, setDetail] = useState<{
    progress: {
      over: number;
      runs: number;
      balls: number;
      teamRuns: number;
      wickets: number;
    }[];
    bowlers: {
      name: string;
      runs: number;
      balls: number;
      outs: number;
      dots: number;
      fours: number;
      sixes: number;
    }[];
  } | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState("progress");
  useEffect(() => {
    const d = dialog.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  useEffect(() => {
    let active = true;
    (innings.format === "ODI"
      ? import("./inningsODI.json")
      : innings.format === "IPL"
        ? import("./inningsIPL.json")
        : import("./inningsT20I.json")
    )
      .then((data) => {
        if (active)
          setDetail(data.innings.find((i) => i.id === innings.id) || null);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [innings.id, innings.format]);
  const highlight = DEFINING_INNINGS_DATA.find((i) => i.matchId === innings.id);
  return (
    <dialog
      ref={dialog}
      className="innings-dialog archive-dialog"
      aria-labelledby="archive-detail-title"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dialog-top">
        <span className="badge">
          {innings.format} · {displayDate(innings.date)}
        </span>
        <button
          className="icon-button"
          aria-label="Close innings details"
          onClick={close}
          autoFocus
        >
          <X size={20} />
        </button>
      </div>
      <div className="match-detail-heading">
        <div>
          <span className="eyebrow">{innings.event}</span>
          <h2 id="archive-detail-title">
            {innings.format === "IPL" ? "RCB" : "India"} <span>vs</span>{" "}
            {innings.opponent}
          </h2>
          <p>{innings.venue}</p>
        </div>
        <span
          className={`result-pill ${innings.result === "won" ? "positive" : ""}`}
        >
          {innings.result}
        </span>
      </div>
      <div className="detail-score">
        {innings.runs}
        {innings.notOut ? "*" : ""}
        <span>runs off {innings.balls} balls</span>
      </div>
      <div className="detail-stats">
        <span>
          <strong>
            {n(innings.balls ? (innings.runs / innings.balls) * 100 : null)}
          </strong>
          Strike rate
        </span>
        <span>
          <strong>{innings.fours}</strong>Fours
        </span>
        <span>
          <strong>{innings.sixes}</strong>Sixes
        </span>
        <span>
          <strong>{innings.notOut ? "Not out" : innings.dismissal}</strong>
          Dismissal
        </span>
      </div>
      <div className="content-tabs">
        <button
          className={tab === "progress" ? "active" : ""}
          onClick={() => setTab("progress")}
        >
          Innings progression
        </button>
        <button
          className={tab === "bowlers" ? "active" : ""}
          onClick={() => setTab("bowlers")}
        >
          Bowler matchups
        </button>
      </div>
      {!detail ? (
        <p role="status">
          {error
            ? "Detailed delivery summary could not load. Reload to retry."
            : "Loading delivery summary…"}
        </p>
      ) : tab === "progress" ? (
        <>
          <div className="detail-progression">
            <Sparkline
              values={detail.progress.map((p) => p.runs)}
              height={110}
            />
            <div>
              <span>First over faced: {detail.progress[0]?.over}</span>
              <span>Last over faced: {detail.progress.at(-1)?.over}</span>
            </div>
          </div>
          <p className="panel-footnote">
            Cumulative batter runs after each over in which Kohli faced a
            delivery or was dismissed. Intervals are participating overs, not
            equal elapsed time.
          </p>
          <details>
            <summary>Over-by-over values</summary>
            <div className="table-scroll detail-over-table">
              <table>
                <thead>
                  <tr>
                    <th>Over completed</th>
                    <th>Kohli</th>
                    <th>Balls faced</th>
                    <th>{innings.format === "IPL" ? "RCB" : "India"}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.progress.map((p) => (
                    <tr key={p.over}>
                      <td>{p.over}</td>
                      <td>{p.runs}</td>
                      <td>{p.balls}</td>
                      <td>
                        {p.teamRuns}/{p.wickets}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Bowler</th>
                <th>Runs</th>
                <th>Balls</th>
                <th>SR</th>
                <th>4s / 6s</th>
              </tr>
            </thead>
            <tbody>
              {detail.bowlers.map((b) => (
                <tr key={b.name}>
                  <td>{b.name}</td>
                  <td>{b.runs}</td>
                  <td>{b.balls}</td>
                  <td>{n(b.balls ? (b.runs / b.balls) * 100 : null)}</td>
                  <td>
                    {b.fours} / {b.sixes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {highlight && (
        <p className="detail-story">{highlight.verifiedNarrative}</p>
      )}
      <div className="dialog-actions">
        <a
          className="secondary"
          href={`#/story?chapter=compare-innings&left=${innings.id}&right=${innings.id === "951363" ? "1298150" : "951363"}`}
          onClick={() => {
            close();
            window.scrollTo({ top: 0, behavior: "instant" });
          }}
        >
          Compare innings <ArrowUpRight size={15} />
        </a>
        {highlight?.sourceUrl ? (
          <a
            href={highlight.sourceUrl}
            className="primary"
            target="_blank"
            rel="noreferrer"
          >
            Source scorecard <ArrowUpRight size={15} />
          </a>
        ) : (
          <a
            href="https://cricsheet.org/downloads/"
            className="secondary"
            target="_blank"
            rel="noreferrer"
          >
            Cricsheet archive · #{innings.id}
            <ArrowUpRight size={14} />
          </a>
        )}
        {toggleSave && (
          <button className="secondary" onClick={toggleSave}>
            <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save innings"}
          </button>
        )}
      </div>
    </dialog>
  );
}
function InningsTable({
  rows,
  onOpen,
  saved = [],
  toggleSave,
  compact = false,
}: {
  rows: ArchiveInnings[];
  onOpen: (row: ArchiveInnings) => void;
  saved?: string[];
  toggleSave?: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`table-scroll archive-table ${compact ? "compact-table" : ""}`}
    >
      <table>
        <caption className="sr-only">
          Batting innings from the covered Cricsheet archive
        </caption>
        <thead>
          <tr>
            <th>Date / format</th>
            <th>Opposition</th>
            <th>Score</th>
            <th>SR</th>
            {!compact && (
              <>
                <th>4s</th>
                <th>6s</th>
                <th>Result</th>
              </>
            )}
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id}>
              <td>
                <span>{displayDate(i.date)}</span>
                <small
                  className="format-inline"
                  style={{ color: fmtColors[i.format] }}
                >
                  {i.format}
                  {i.innings === 2 ? " · Chasing" : " · Batting first"}
                </small>
              </td>
              <td>
                <button className="row-match" onClick={() => onOpen(i)}>
                  <span
                    className={`country-badge country-${countries[i.opponent] || "other"}`}
                  >
                    {countries[i.opponent] ||
                      i.opponent.slice(0, 3).toUpperCase()}
                  </span>
                  <span>
                    {i.opponent}
                    <small>{compact ? displayDate(i.date) : i.venue}</small>
                  </span>
                </button>
              </td>
              <td>
                <button
                  className={`score-button ${i.runs >= 100 ? "century" : i.runs >= 50 ? "fifty" : ""}`}
                  onClick={() => onOpen(i)}
                >
                  {i.runs}
                  {i.notOut ? "*" : ""}
                  <small>({i.balls})</small>
                </button>
              </td>
              <td>{n(i.balls ? (i.runs / i.balls) * 100 : null, 1)}</td>
              {!compact && (
                <>
                  <td>{i.fours}</td>
                  <td>{i.sixes}</td>
                  <td>
                    <span
                      className={`result-pill ${i.result === "won" ? "positive" : ""}`}
                    >
                      {i.result}
                    </span>
                  </td>
                </>
              )}
              <td>
                {toggleSave ? (
                  <button
                    className="icon-button"
                    aria-label={`${saved.includes("archive-" + i.id) ? "Unsave" : "Save"} innings ${i.id}`}
                    onClick={() => toggleSave("archive-" + i.id)}
                  >
                    <Bookmark
                      size={15}
                      fill={
                        saved.includes("archive-" + i.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                ) : (
                  <button
                    className="icon-button"
                    aria-label={`Open innings ${i.id}`}
                    onClick={() => onOpen(i)}
                  >
                    <ArrowUpRight size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ArchiveLibrary({
  view,
  update,
  saved,
  toggleSave,
  highlights,
}: {
  view: ViewState;
  update: (p: Partial<ViewState>) => void;
  saved: string[];
  toggleSave: (id: string) => void;
  highlights: ReactNode;
}) {
  const [detail, setDetail] = useState<ArchiveInnings | null>(null);
  const [page, setPage] = useState(0);
  const collection =
    view.collection || (view.format === "Test" ? "highlights" : "archive");
  const [sort, setSort] = useState("newest");
  const [advanced, setAdvanced] = useState(
    Boolean(view.opponent || view.venue || view.situation || view.minRuns),
  );
  const rows = selectArchive({
    ...view,
    includeIPL: true,
    minRuns: view.minRuns ? Number(view.minRuns) : undefined,
  })
    .filter((i) => !view.saved || saved.includes("archive-" + i.id))
    .sort((a, b) =>
      sort === "runs"
        ? b.runs - a.runs
        : sort === "sr"
          ? (b.balls ? b.runs / b.balls : 0) - (a.balls ? a.runs / a.balls : 0)
          : sort === "oldest"
            ? a.date.localeCompare(b.date)
            : b.date.localeCompare(a.date),
    );
  const signature = JSON.stringify([view, sort]);
  useEffect(() => setPage(0), [signature]);
  const s = summarize(rows);
  const count = Math.ceil(rows.length / 15);
  const scopeRows = selectArchive({ format: view.format, includeIPL: true });
  const years = [...new Set(scopeRows.map((i) => i.date.slice(0, 4)))]
    .sort()
    .reverse();
  function exportRows() {
    const url = URL.createObjectURL(
      new Blob([archiveCsv(rows)], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "kohli-archive-filtered.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <div className="collection-tabs">
        <button
          className={collection === "archive" ? "active" : ""}
          onClick={() =>
            update({
              collection: "archive",
              format: view.format === "Test" ? "ALL" : view.format,
              query: "",
              year: "",
              result: "",
              saved: false,
              opponent: "",
              venue: "",
              situation: "",
              minRuns: "",
            })
          }
        >
          Batting archive <span>{inningsIndex.length}</span>
        </button>
        <button
          className={collection === "highlights" ? "active" : ""}
          onClick={() =>
            update({
              collection: "highlights",
              query: "",
              year: "",
              result: "",
              saved: false,
              opponent: "",
              venue: "",
              situation: "",
              minRuns: "",
            })
          }
        >
          Defining innings <span>12</span>
        </button>
        <span>Two ways to explore the career</span>
      </div>
      {view.format === "IPL" && (
        <a className="ipl-archive-entrance" href="#/ipl?format=IPL&year=2016">
          <span>
            <strong>Go deeper into the RCB chapter</strong>
            <small>
              19 seasons · scoring phases · downloadable season cards
            </small>
          </span>
          <ArrowRight size={18} />
        </a>
      )}
      {collection === "highlights" ? (
        highlights
      ) : (
        <>
          <div className="archive-filter-row">
            <label className="search-input">
              <Search size={17} />
              <input
                aria-label="Search batting archive"
                placeholder="Opponent, ground or competition…"
                value={view.query}
                onChange={(e) => update({ query: e.target.value })}
              />
            </label>
            <select
              aria-label="Archive year"
              value={view.year}
              onChange={(e) => update({ year: e.target.value })}
            >
              <option value="">Every year</option>
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
            <select
              aria-label="Archive outcome"
              value={view.result}
              onChange={(e) => update({ result: e.target.value })}
            >
              <option value="">Every result</option>
              {["won", "lost", "tie", "no result"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <button
              className={`secondary ${advanced ? "active" : ""}`}
              aria-expanded={advanced}
              onClick={() => setAdvanced(!advanced)}
            >
              <SlidersHorizontal size={15} />
              Filters
            </button>
            <button
              className={`secondary ${view.saved ? "active" : ""}`}
              aria-pressed={view.saved}
              onClick={() => update({ saved: !view.saved })}
            >
              <Bookmark size={15} />
              Saved
            </button>
            <button
              className="icon-button"
              aria-label="Export batting archive as CSV"
              onClick={exportRows}
              disabled={!rows.length}
            >
              <ArrowDownToLine size={18} />
            </button>
          </div>
          {advanced && (
            <div className="advanced-filters">
              <label>
                Opponent
                <select
                  value={view.opponent || ""}
                  onChange={(e) => update({ opponent: e.target.value })}
                >
                  <option value="">All opponents</option>
                  {options(
                    selectArchive({
                      format: view.format,
                      includeIPL: view.page === "innings",
                    }),
                    "opponent",
                  ).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
              <label>
                Venue
                <select
                  value={view.venue || ""}
                  onChange={(e) => update({ venue: e.target.value })}
                >
                  <option value="">All venues</option>
                  {options(
                    selectArchive({
                      format: view.format,
                      includeIPL: view.page === "innings",
                    }),
                    "venue",
                  ).map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                Situation
                <select
                  value={view.situation || ""}
                  onChange={(e) => update({ situation: e.target.value })}
                >
                  <option value="">Both innings</option>
                  <option value="chase">Chasing</option>
                  <option value="first">Batting first</option>
                </select>
              </label>
              <label>
                Score
                <select
                  value={view.minRuns || ""}
                  onChange={(e) => update({ minRuns: e.target.value })}
                >
                  <option value="">Any score</option>
                  <option value="50">50+ runs</option>
                  <option value="100">Centuries</option>
                </select>
              </label>
            </div>
          )}
          <div className="archive-summary" aria-live="polite">
            <div>
              <strong>{s.innings}</strong>
              <span>Innings found</span>
            </div>
            <div>
              <strong>{number(s.runs)}</strong>
              <span>Runs</span>
            </div>
            <div>
              <strong>{n(s.average)}</strong>
              <span>Average</span>
            </div>
            <div>
              <strong>{n(s.strikeRate)}</strong>
              <span>Strike rate</span>
            </div>
            <div>
              <strong>
                {s.centuries}
                <small> / {s.fifties}</small>
              </strong>
              <span>100s / 50s</span>
            </div>
          </div>
          <Panel className="archive-results">
            <PanelHead
              title="The innings ledger"
              eyebrow="CRICSHEET · COVERED ODI / T20I / IPL INNINGS"
              action={
                <select
                  aria-label="Sort archive"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="runs">Highest score</option>
                  <option value="sr">Highest strike rate</option>
                </select>
              }
            />
            {rows.length ? (
              <InningsTable
                rows={rows.slice(page * 15, page * 15 + 15)}
                onOpen={setDetail}
                saved={saved}
                toggleSave={toggleSave}
              />
            ) : (
              <div className="empty">
                <Search size={24} />
                <h3>No innings match these filters</h3>
                <p>Try a wider selection, or return to all covered innings.</p>
                <button
                  className="secondary"
                  onClick={() =>
                    update({
                      format: "ALL",
                      query: "",
                      year: "",
                      result: "",
                      saved: false,
                      opponent: "",
                      venue: "",
                      situation: "",
                      minRuns: "",
                    })
                  }
                >
                  Reset archive filters
                </button>
              </div>
            )}
            <div className="archive-pagination">
              <span>
                {rows.length
                  ? `${page * 15 + 1}–${Math.min(rows.length, page * 15 + 15)} of ${rows.length} innings`
                  : "0 innings"}{" "}
                · Archive through 19 Jul 2026
              </span>
              <div>
                <button
                  className="icon-button"
                  aria-label="Previous innings page"
                  disabled={!page}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={17} />
                </button>
                <span>
                  {rows.length ? page + 1 : 0} / {count}
                </span>
                <button
                  className="icon-button"
                  aria-label="Next innings page"
                  disabled={page + 1 >= count}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </Panel>
          <p className="quiet-scope">
            The archive covers 300 ODI, 112 T20I and 275 IPL batting innings.
            DNB appearances and super overs are excluded. Test highlights are
            available under Defining innings.
          </p>
        </>
      )}
      {detail && (
        <ArchiveDetail
          innings={detail}
          close={() => setDetail(null)}
          saved={saved.includes("archive-" + detail.id)}
          toggleSave={() => toggleSave("archive-" + detail.id)}
        />
      )}
    </>
  );
}
export function OverviewContent({
  view,
  navigate,
  stats,
  fixture,
}: {
  view: ViewState;
  navigate: (page: Page, extra?: Partial<ViewState>) => void;
  stats: ReactNode;
  fixture: ReactNode;
}) {
  const [detail, setDetail] = useState<ArchiveInnings | null>(null);
  const format = view.format;
  const rows = selectArchive({ format });
  const s = statsByFormat[format];
  const recent = rows.slice(0, 5);
  const chase = rows.filter((i) => i.innings === 2);
  const cs = summarize(chase);
  const featured =
    format === "ALL"
      ? ["T20I", "ODI", "Test"].map(
          (f) => DEFINING_INNINGS_DATA.find((i) => i.format === f)!,
        )
      : DEFINING_INNINGS_DATA.filter((i) => i.format === format).slice(0, 3);
  const boundary = s.fours * 4 + s.sixes * 6;
  return (
    <>
      <IdentityHero view={view} navigate={navigate} />
      {stats}
      <StoryEntrances navigate={navigate} />
      <ExploreEntrances navigate={navigate} />
      <div className="overview-v2-grid">
        <Panel className="recent-panel">
          <PanelHead
            eyebrow="MATCH-BY-MATCH EXPLORATION"
            title={
              rows.length
                ? "Latest in the delivery archive"
                : "Defining performances"
            }
            action={
              <button
                className="text-button"
                onClick={() =>
                  navigate("innings", {
                    collection: rows.length ? "archive" : "highlights",
                  })
                }
              >
                Open library
                <ArrowRight size={14} />
              </button>
            }
          />
          {rows.length ? (
            <>
              <div className="recent-form">
                {recent.map((r) => (
                  <button key={r.id} onClick={() => setDetail(r)}>
                    <span style={{ color: fmtColors[r.format] }}>
                      {countries[r.opponent] || r.opponent}
                    </span>
                    <strong className={r.runs >= 50 ? "form-good" : ""}>
                      {r.runs}
                      {r.notOut ? "*" : ""}
                    </strong>
                    <small>
                      {r.balls} balls · {r.format}
                    </small>
                  </button>
                ))}
              </div>
              <InningsTable rows={recent} onOpen={setDetail} compact />
              <p className="panel-footnote">
                Latest available in this archive, not a live form feed. Open any
                score to inspect the innings.
              </p>
            </>
          ) : (
            <div className="highlight-overview">
              {featured.map((i) => (
                <button
                  key={i.id}
                  onClick={() =>
                    navigate("innings", {
                      collection: "highlights",
                      query: i.opponent,
                      year: i.date.slice(0, 4),
                    })
                  }
                >
                  <strong>
                    {i.runs}
                    {i.notOut ? "*" : ""}
                    <small>({i.ballsFaced})</small>
                  </strong>
                  <span>
                    {i.title}
                    <small>
                      {i.opponent} · {displayDate(i.date)}
                    </small>
                  </span>
                  <ArrowUpRight size={17} />
                </button>
              ))}
            </div>
          )}
        </Panel>
        <div className="overview-right-stack">
          <Panel className="scoring-panel">
            <PanelHead
              eyebrow="CAREER SCORING PROFILE"
              title="How the runs add up"
            />
            <div className="scoring-ring-layout">
              <div
                className="scoring-ring"
                style={{
                  background: `conic-gradient(#ee806b 0 ${((s.fours * 4) / s.runs) * 100}%,#a39ae8 ${((s.fours * 4) / s.runs) * 100}% ${(boundary / s.runs) * 100}%,#303844 ${(boundary / s.runs) * 100}% 100%)`,
                }}
              >
                <div>
                  <strong>{((boundary / s.runs) * 100).toFixed(1)}%</strong>
                  <small>boundary runs</small>
                </div>
              </div>
              <div className="scoring-key">
                <span>
                  <i style={{ background: "#ee806b" }} />
                  Fours<strong>{number(s.fours)}</strong>
                </span>
                <span>
                  <i style={{ background: "#a39ae8" }} />
                  Sixes<strong>{number(s.sixes)}</strong>
                </span>
                <span>
                  <i style={{ background: "#576272" }} />
                  Other runs<strong>{number(s.runs - boundary)}</strong>
                </span>
              </div>
            </div>
            <div className="scoring-footer">
              <span>
                Strike rate<strong>{s.strikeRate.toFixed(2)}</strong>
              </span>
              <span>
                50+ innings<strong>{s.fifties + s.centuries}</strong>
              </span>
              <span>
                Best score
                <strong>
                  {s.highScore}
                  {["Test", "T20I", "ALL", "IPL"].includes(format) ? "*" : ""}
                </strong>
              </span>
            </div>
          </Panel>
          <Panel className="chase-teaser">
            <span className="eyebrow">
              {rows.length
                ? `COVERED ${format === "ALL" ? "ODI / T20I" : format} CHASES`
                : "FORMAT SNAPSHOT"}
            </span>
            <div>
              <strong>{rows.length ? n(cs.average) : n(s.average)}</strong>
              <span>batting average</span>
            </div>
            <p>
              {rows.length
                ? `${cs.innings} innings · ${number(cs.runs)} runs · ${cs.notOuts} not outs`
                : `${number(s.innings)} innings · ${number(s.runs)} runs`}
            </p>
            <button
              className="text-button"
              onClick={() =>
                navigate("pressure", {
                  format:
                    format === "T20I"
                      ? "T20I"
                      : format === "Test"
                        ? "Test"
                        : "ODI",
                })
              }
            >
              Understand pressure performance
              <ArrowRight size={14} />
            </button>
          </Panel>
        </div>
      </div>
      <div className="feature-heading">
        <div>
          <span className="eyebrow">THE MOMENTS BEHIND THE NUMBERS</span>
          <h2>Worth another look.</h2>
        </div>
        <button
          className="text-button"
          onClick={() => navigate("innings", { collection: "highlights" })}
        >
          All defining innings
          <ArrowRight size={14} />
        </button>
      </div>
      <div className="editorial-row">
        {featured.map((i, idx) => (
          <button
            key={i.id}
            className={`editorial-tile editorial-${idx}`}
            onClick={() =>
              navigate("innings", {
                collection: "highlights",
                query: i.opponent,
                year: i.date.slice(0, 4),
              })
            }
          >
            <div>
              <span className="badge">
                {i.format} · {i.date.slice(0, 4)}
              </span>
              <ArrowUpRight size={18} />
            </div>
            <span className="editorial-score">
              {i.runs}
              {i.notOut ? "*" : ""}
              <small>{i.ballsFaced} balls</small>
            </span>
            <h3>{i.title}</h3>
            <p>
              {i.opponent} · {i.venue.split(",").at(-1)}
            </p>
          </button>
        ))}
      </div>
      {fixture}
      {detail && (
        <ArchiveDetail innings={detail} close={() => setDetail(null)} />
      )}
    </>
  );
}
export function CareerLab({
  view,
  update,
}: {
  view: ViewState;
  update: (patch: Partial<ViewState>) => void;
}) {
  const [group, setGroup] = useState<
    "year" | "opponent" | "venue" | "result" | "situation"
  >("year");
  const [metric, setMetric] = useState<"runs" | "average" | "strikeRate">(
    "runs",
  );
  const [detail, setDetail] = useState<ArchiveInnings | null>(null);
  const format = view.format;
  const rows = useMemo(
    () =>
      selectArchive({
        ...view,
        minRuns: view.minRuns ? Number(view.minRuns) : undefined,
      }),
    [view],
  );
  const s = summarize(rows);
  const groups = groupArchive(rows, group);
  const max = Math.max(1, ...groups.map((g) => g[metric] || 0));
  if (format === "Test")
    return (
      <>
        <Panel>
          <PanelHead
            eyebrow="123 TESTS · SCORECARD SPLITS"
            title="Where the runs came from"
          />
          <div className="test-splits">
            {TEST_SITUATIONAL_SPLITS.filter((s) =>
              [
                "testHomeConditions",
                "testAwayConditions",
                "testNeutralConditions",
              ].includes(s.id),
            ).map((s) => (
              <article key={s.id}>
                <span>{s.title}</span>
                <strong>{number(s.runs)}</strong>
                <small>
                  {s.innings} innings · {n(s.battingAvg)} average
                </small>
                <div className="bar-track">
                  <span style={{ width: `${(s.runs / 9230) * 100}%` }} />
                </div>
                <p>{s.scopeDescription}</p>
              </article>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelHead title="The Test innings profile" />
          <div className="test-splits">
            {TEST_SITUATIONAL_SPLITS.filter((s) =>
              [
                "testFirstTeamInnings",
                "testSecondTeamInnings",
                "testFourthMatchInnings",
              ].includes(s.id),
            ).map((s) => (
              <article key={s.id}>
                <span>{s.title}</span>
                <strong>{n(s.battingAvg)}</strong>
                <small>batting average · {number(s.runs)} runs</small>
                <p>{s.scopeDescription}</p>
              </article>
            ))}
          </div>
        </Panel>
      </>
    );
  return (
    <>
      <div className="explorer-controls">
        <div>
          <SlidersHorizontal size={17} />
          <strong>Explore the covered archive</strong>
        </div>
        <select
          aria-label="Career year"
          value={view.year}
          onChange={(e) => update({ year: e.target.value })}
        >
          <option value="">All years</option>
          {[...new Set(inningsIndex.map((i) => i.date.slice(0, 4)))]
            .sort()
            .reverse()
            .map((y) => (
              <option key={y}>{y}</option>
            ))}
        </select>
        <select
          aria-label="Career opponent"
          value={view.opponent || ""}
          onChange={(e) => update({ opponent: e.target.value })}
        >
          <option value="">All opponents</option>
          {options(
            selectArchive({
              format: view.format,
              includeIPL: view.page === "innings",
            }),
            "opponent",
          ).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <select
          aria-label="Career situation"
          value={view.situation || ""}
          onChange={(e) => update({ situation: e.target.value })}
        >
          <option value="">Both innings</option>
          <option value="chase">Chasing</option>
          <option value="first">Batting first</option>
        </select>
        <button
          className="text-button"
          onClick={() =>
            update({
              year: "",
              opponent: "",
              situation: "",
              query: "",
              venue: "",
              result: "",
            })
          }
        >
          Reset
        </button>
      </div>
      <div className="scope-caption">
        <span>
          Filtered delivery archive · {format === "ALL" ? "ODI + T20I" : format}
        </span>
        <span>Independent of the career totals above</span>
      </div>
      <div className="archive-summary explorer-summary">
        <div>
          <strong>{s.innings}</strong>
          <span>Innings</span>
        </div>
        <div>
          <strong>{number(s.runs)}</strong>
          <span>Runs</span>
        </div>
        <div>
          <strong>{n(s.average)}</strong>
          <span>Batting average</span>
        </div>
        <div>
          <strong>{n(s.strikeRate)}</strong>
          <span>Strike rate</span>
        </div>
        <div>
          <strong>
            {s.centuries}
            <small> / {s.fifties}</small>
          </strong>
          <span>100s / 50s</span>
        </div>
      </div>
      <div className="career-lab-grid">
        <Panel>
          <PanelHead
            title="Find the pattern"
            eyebrow="RECALCULATED FROM THE SELECTED INNINGS"
            action={
              <select
                aria-label="Career chart metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value as typeof metric)}
              >
                <option value="runs">Runs</option>
                <option value="average">Average</option>
                <option value="strikeRate">Strike rate</option>
              </select>
            }
          />
          <div className="content-tabs">
            {(
              ["year", "opponent", "venue", "result", "situation"] as const
            ).map((t) => (
              <button
                key={t}
                onClick={() => setGroup(t)}
                className={group === t ? "active" : ""}
              >
                {t}
              </button>
            ))}
          </div>
          {groups.length ? (
            <div
              className={`group-chart ${group === "year" ? "vertical" : ""}`}
            >
              {groups.slice(0, group === "year" ? 30 : 10).map((g) => (
                <div
                  key={g.label}
                  title={`${g.label}: ${n(g[metric], metric === "runs" ? 0 : 2)} · ${g.innings} innings`}
                >
                  <span>{g.label}</span>
                  <div className="group-track">
                    <i
                      style={
                        group === "year"
                          ? { height: `${((g[metric] || 0) / max) * 100}%` }
                          : { width: `${((g[metric] || 0) / max) * 100}%` }
                      }
                    />
                  </div>
                  <strong>{n(g[metric], metric === "runs" ? 0 : 1)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <h3>No innings in this selection</h3>
              <p>Reset the filters to explore the full archive.</p>
            </div>
          )}
          <p className="panel-footnote">
            {group === "year"
              ? "Calendar years with covered innings."
              : "Top 10 groups by runs."}{" "}
            Averages use runs ÷ dismissals; no-dismissal averages stay
            unavailable.
          </p>
        </Panel>
        <Panel>
          <PanelHead title="Score distribution" eyebrow="SELECTED INNINGS" />
          <Histogram rows={rows} />
          <div className="distribution-insight">
            <strong>
              {s.innings
                ? (((s.centuries + s.fifties) / s.innings) * 100).toFixed(1)
                : "—"}
              %
            </strong>
            <span>
              of selected innings reached 50+
              <small>
                {s.centuries + s.fifties} of {s.innings} innings
              </small>
            </span>
          </div>
          <div className="scoring-footer">
            <span>
              Not outs<strong>{s.notOuts}</strong>
            </span>
            <span>
              Highest<strong>{s.highest ?? "—"}</strong>
            </span>
            <span>
              Boundary runs
              <strong>
                {s.runs
                  ? ((s.boundaryRuns / s.runs) * 100).toFixed(1) + "%"
                  : "—"}
              </strong>
            </span>
          </div>
        </Panel>
      </div>
      <Panel>
        <PanelHead
          title="Inside the selection"
          action={
            <span className="badge">Latest 8 of {rows.length} innings</span>
          }
        />
        <InningsTable rows={rows.slice(0, 8)} onOpen={setDetail} />
      </Panel>
      {detail && (
        <ArchiveDetail innings={detail} close={() => setDetail(null)} />
      )}
    </>
  );
}
export function BowlerLab({ format }: { format: "ODI" | "Test" | "T20I" }) {
  const [query, setQuery] = useState("");
  const [minimum, setMinimum] = useState("30");
  const [sort, setSort] = useState("balls");
  if (format === "Test") return null;
  const rows = bowlerMatchups[format]
    .filter(
      (b) =>
        b.name.toLowerCase().includes(query.toLowerCase()) &&
        b.balls >= Number(minimum),
    )
    .sort((a, b) =>
      sort === "sr"
        ? b.runs / b.balls - a.runs / a.balls
        : sort === "outs"
          ? b.outs - a.outs
          : b.balls - a.balls,
    );
  return (
    <Panel className="bowler-lab">
      <PanelHead
        eyebrow="BATTER VS BOWLER · SAME COVERED ARCHIVE"
        title="Who tested him. Who he took on."
        action={<span className="badge">{rows.length} bowlers</span>}
      />
      <div className="archive-filter-row">
        <label className="search-input">
          <Search size={16} />
          <input
            aria-label="Find a bowler"
            placeholder="Search a bowler…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Minimum matchup balls"
          value={minimum}
          onChange={(e) => setMinimum(e.target.value)}
        >
          <option value="1">Any sample</option>
          <option value="30">30+ balls</option>
          <option value="60">60+ balls</option>
          <option value="100">100+ balls</option>
        </select>
        <select
          aria-label="Sort bowler matchups"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="balls">Most balls faced</option>
          <option value="sr">Highest strike rate</option>
          <option value="outs">Most dismissals</option>
        </select>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Bowler</th>
              <th>Runs</th>
              <th>Balls</th>
              <th>Outs</th>
              <th>SR</th>
              <th>Dot balls</th>
              <th>4s / 6s</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 12).map((b) => (
              <tr key={b.name}>
                <td>{b.name}</td>
                <td className="strong">{b.runs}</td>
                <td>{b.balls}</td>
                <td>{b.outs}</td>
                <td>{((b.runs / b.balls) * 100).toFixed(1)}</td>
                <td>{((b.dots / b.balls) * 100).toFixed(1)}%</td>
                <td>
                  {b.fours} / {b.sixes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="empty">
          <p>No bowler matches the selected name and sample threshold.</p>
        </div>
      )}
      <p className="panel-footnote">
        Showing up to 12 matches to your filters. Outs exclude run-outs and
        retirements. Dot balls here mean zero batter runs on a ball faced,
        including byes/leg-byes.
      </p>
    </Panel>
  );
}
