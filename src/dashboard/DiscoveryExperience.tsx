import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  Download,
  Shuffle,
  Sparkles,
  ArrowUpRight,
  Trophy,
} from "lucide-react";
import { ArchiveDetail } from "./ArchiveViews";
import { Panel, PanelHead } from "./ui";
import {
  iplArchive,
  selectArchive,
  summarize,
  groupArchive,
  type ArchiveInnings,
} from "./insights";
import {
  applyLens,
  lenses,
  recentForm,
  scoreTone,
  shortOpponent,
} from "./discoveryModel";
import { number, displayDate, type Page, type ViewState } from "./model";
type Props = {
  view: ViewState;
  update: (p: Partial<ViewState>) => void;
  navigate: (p: Page, v?: Partial<ViewState>) => void;
  saved: string[];
  toggleSave: (id: string) => void;
};
const val = (n: number | null, d = 1) => (n === null ? "—" : number(n, d));
function ScoreTile({
  row,
  onOpen,
  saved,
  toggleSave,
}: {
  row: ArchiveInnings;
  onOpen: () => void;
  saved: boolean;
  toggleSave: () => void;
}) {
  return (
    <article className={`discovery-card ${scoreTone(row.runs)}`}>
      <div className="discovery-card-kicker">
        <span>
          {row.format} · {row.date.slice(0, 4)}
        </span>
        <button
          className="icon-button"
          aria-label={`${saved ? "Unsave" : "Save"} ${row.runs} against ${row.opponent} on ${row.date}`}
          aria-pressed={saved}
          onClick={toggleSave}
        >
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <button className="discovery-card-main" onClick={onOpen}>
        <strong>
          {row.runs}
          {row.notOut ? "*" : ""}
          <small> / {row.balls}</small>
        </strong>
        <h3>vs {row.opponent}</h3>
        <p>{row.venue}</p>
        <span>
          {displayDate(row.date)}
          <ArrowUpRight size={15} />
        </span>
      </button>
      <footer>
        <span>
          {row.result} · {row.innings === 2 ? "Chasing" : "Batting first"}
        </span>
        <span>
          {row.balls ? ((row.runs / row.balls) * 100).toFixed(1) : "—"} SR
        </span>
      </footer>
    </article>
  );
}
function Metrics({ rows }: { rows: ArchiveInnings[] }) {
  const s = summarize(rows);
  return (
    <div className="lab-metrics">
      {[
        [number(s.runs), "Runs"],
        [String(s.innings), "Innings"],
        [val(s.average, 2), "Average"],
        [val(s.strikeRate, 2), "Strike rate"],
        [`${s.fifties} / ${s.centuries}`, "50s / 100s"],
      ].map(([v, k]) => (
        <div key={k}>
          <strong>{v}</strong>
          <span>{k}</span>
        </div>
      ))}
    </div>
  );
}
function Detail({
  row,
  close,
  saved,
  toggleSave,
}: {
  row: ArchiveInnings | null;
  close: () => void;
  saved: string[];
  toggleSave: (id: string) => void;
}) {
  return row ? (
    <ArchiveDetail
      innings={row}
      close={close}
      saved={saved.includes("archive-" + row.id)}
      toggleSave={() => toggleSave("archive-" + row.id)}
    />
  ) : null;
}
export function DiscoveryLab({
  view,
  update,
  navigate,
  saved,
  toggleSave,
}: Props) {
  const [detail, setDetail] = useState<ArchiveInnings | null>(null);
  const [limit, setLimit] = useState(12);
  const lens = lenses.find((l) => l.id === view.metric) || lenses[0];
  const base = selectArchive({ format: view.format });
  const rows = applyLens(base, lens.id, saved);
  const groups = groupArchive(rows, "year").reverse();
  const form = recentForm(base);
  function chooseLens(metric: string) {
    setLimit(12);
    update({ metric, year: "" });
  }
  const selected = rows.filter(
    (r) => !view.year || r.date.startsWith(view.year),
  );
  return (
    <div className="discovery-lab">
      <section className="lab-intro">
        <div>
          <span className="eyebrow">THE INNINGS ATLAS</span>
          <h2>
            Greatness leaves
            <br />
            <em>a pattern.</em>
          </h2>
          <p>
            Each square is one innings. Follow the colour, choose a year, then
            open the score behind it.
          </p>
        </div>
        <div className="lab-intro-counter">
          <strong>{rows.length}</strong>
          <span>innings through your lens</span>
          <button
            className="secondary"
            disabled={!rows.length}
            onClick={() =>
              setDetail(rows[Math.floor(Math.random() * rows.length)])
            }
          >
            <Shuffle size={15} />
            Surprise me
          </button>
        </div>
      </section>
      <div className="lens-list" role="group" aria-label="Discovery lenses">
        {lenses.map((l) => (
          <button
            key={l.id}
            aria-pressed={lens.id === l.id}
            className={lens.id === l.id ? "active" : ""}
            onClick={() => chooseLens(l.id)}
          >
            {l.name}
            <span>{applyLens(base, l.id, saved).length}</span>
          </button>
        ))}
      </div>
      <div className="lab-active">
        <span>
          <Sparkles size={15} />
          {lens.hint}
        </span>
        <span>
          {view.format === "ALL"
            ? "ODI + T20I · IPL has its own scope"
            : view.format}{" "}
          · covered batting innings
        </span>
      </div>
      <Panel className="innings-atlas">
        <PanelHead
          title="A career, one square at a time"
          eyebrow="CLICK ANY INNINGS"
          action={
            <div className="atlas-key">
              {[
                ["low", "0–29"],
                ["start", "30–49"],
                ["fifty", "50–99"],
                ["hundred", "100+"],
              ].map(([c, t]) => (
                <span key={c}>
                  <i className={c} />
                  {t}
                </span>
              ))}
            </div>
          }
        />
        {groups.length ? (
          <div className="atlas-rows">
            {groups.map((g) => (
              <div
                className={`atlas-year ${view.year === g.label ? "selected" : ""}`}
                key={g.label}
              >
                <button
                  aria-label={`Explore ${g.label} innings`}
                  onClick={() => {
                    setLimit(12);
                    update({ year: view.year === g.label ? "" : g.label });
                  }}
                >
                  {g.label}
                </button>
                <div>
                  {rows
                    .filter((r) => r.date.startsWith(g.label))
                    .slice()
                    .reverse()
                    .map((r) => (
                      <button
                        className={`atlas-cell ${scoreTone(r.runs)}`}
                        key={r.id}
                        title={`${r.runs}${r.notOut ? "*" : ""} vs ${r.opponent}, ${r.date}`}
                        aria-label={`${r.runs}${r.notOut ? " not out" : ""} vs ${r.opponent}, ${r.date}`}
                        onClick={() => setDetail(r)}
                      />
                    ))}
                </div>
                <span>
                  {number(g.runs)} <small>runs</small>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="lab-empty">
            <Bookmark size={28} />
            <h3>
              {lens.id === "saved"
                ? "Your collection starts with one innings."
                : "No innings in this lens."}
            </h3>
            <p>
              {view.format === "Test"
                ? "Test has curated scorecards, without a delivery archive."
                : lens.id === "saved"
                  ? "Use the bookmark on any innings card to keep it here."
                  : "Choose another format or lens to explore."}
            </p>
            <button
              className="secondary"
              onClick={() =>
                view.format === "Test"
                  ? navigate("innings", {
                      format: "Test",
                      collection: "highlights",
                    })
                  : chooseLens("all")
              }
            >
              {view.format === "Test"
                ? "Open Test highlights"
                : "Show every innings"}
            </button>
          </div>
        )}
      </Panel>
      {base.length > 0 && (
        <Panel className="form-panel">
          <PanelHead
            eyebrow={`LATEST ${form.rows.length} COVERED INNINGS · ${view.format === "ALL" ? "MIXED INTERNATIONAL FORMATS" : view.format}`}
            title="The recent rhythm"
            action={
              <span className="badge">
                {val(form.stats.average, 2)} avg ·{" "}
                {val(form.stats.strikeRate, 1)} SR
              </span>
            }
          />
          <div className="form-bars">
            {form.rows
              .slice()
              .reverse()
              .map((r) => (
                <button
                  key={r.id}
                  aria-label={`Open ${r.runs} against ${r.opponent} on ${r.date}`}
                  title={`${r.date}: ${r.runs} vs ${r.opponent}`}
                  onClick={() => setDetail(r)}
                >
                  <strong>
                    {r.runs}
                    {r.notOut ? "*" : ""}
                  </strong>
                  <span
                    style={{
                      height: `${Math.max(4, (r.runs / Math.max(1, ...form.rows.map((x) => x.runs))) * 90)}px`,
                    }}
                    className={scoreTone(r.runs)}
                  />
                  <small>{shortOpponent(r.opponent)}</small>
                </button>
              ))}
          </div>
          <p className="panel-footnote">
            Oldest → newest. Archive appearances only; these may differ from the
            latest matches played.
          </p>
        </Panel>
      )}
      <div className="lab-results-heading">
        <div>
          <span className="eyebrow">YOUR CURRENT DISCOVERY</span>
          <h2>
            {view.year ? `${view.year} · ` : ""}
            {lens.name}
            <small>{selected.length} innings</small>
          </h2>
        </div>
        {view.year && (
          <button className="secondary" onClick={() => update({ year: "" })}>
            Clear year
          </button>
        )}
      </div>
      <div className="discovery-cards">
        {selected.slice(0, limit).map((r) => (
          <ScoreTile
            key={r.id}
            row={r}
            saved={saved.includes("archive-" + r.id)}
            toggleSave={() => toggleSave("archive-" + r.id)}
            onOpen={() => setDetail(r)}
          />
        ))}
      </div>
      {selected.length > limit && (
        <button
          className="secondary lab-more"
          onClick={() => setLimit((n) => n + 12)}
        >
          Explore 12 more <ArrowRight size={15} />
        </button>
      )}
      <Detail
        row={detail}
        close={() => setDetail(null)}
        saved={saved}
        toggleSave={toggleSave}
      />
    </div>
  );
}
function exportSeason(year: string, rows: ArchiveInnings[]) {
  const s = summarize(rows);
  const text = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#11141b"/><path d="M800 0H1200V630H1000Z" fill="#721d32"/><g font-family="Arial,sans-serif" fill="#f6ecd9"><text x="70" y="75" font-size="22" letter-spacing="5">KOHLI ANALYTICS / RCB</text><text x="65" y="210" font-size="100" font-weight="700">${year} SEASON</text><text x="65" y="370" font-size="150" font-weight="700" fill="#e8c486">${s.runs}</text><text x="70" y="418" font-size="28">RUNS IN ${s.innings} COVERED INNINGS</text><text x="70" y="505" font-size="24">${val(s.average, 2)} AVG · ${val(s.strikeRate, 2)} SR · ${s.centuries} HUNDREDS</text><text x="70" y="575" font-size="16" fill="#a9adb5">Source: Cricsheet · covered batting innings · excludes DNB and super overs</text></g></svg>`;
  const url = URL.createObjectURL(new Blob([text], { type: "image/svg+xml" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `kohli-rcb-${year}.svg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function IPLHub({ view, update, navigate, saved, toggleSave }: Props) {
  const seasonRail = useRef<HTMLDivElement>(null);
  const [detail, setDetail] = useState<ArchiveInnings | null>(null);
  const all = selectArchive({ format: "IPL" });
  const seasons = groupArchive(all, "year");
  const year = seasons.some((s) => s.label === view.year) ? view.year! : "2016";
  useEffect(() => {
    const rail = seasonRail.current;
    const active = rail?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (rail && active)
      rail.scrollLeft +=
        active.getBoundingClientRect().left -
        rail.getBoundingClientRect().left -
        rail.clientWidth / 2 +
        active.clientWidth / 2;
  }, [year]);
  const rows = all
    .filter((r) => r.date.startsWith(year))
    .slice()
    .reverse();
  const s = summarize(rows);
  const max = Math.max(...seasons.map((x) => x.runs));
  const best = [...rows].sort((a, b) => b.runs - a.runs)[0];
  const opponents = groupArchive(rows, "opponent");
  const phases = ["Powerplay", "Middle", "Death"].map((name) => {
    const entries = iplArchive.innings.filter((r) => r.date.startsWith(year));
    const total = entries.reduce(
      (a, r) => {
        const p = r.phases[name as keyof typeof r.phases];
        return {
          runs: a.runs + p.runs,
          balls: a.balls + p.balls,
          boundaries: a.boundaries + p.fours * 4 + p.sixes * 6,
        };
      },
      { runs: 0, balls: 0, boundaries: 0 },
    );
    return {
      name,
      ...total,
      sr: total.balls ? (total.runs / total.balls) * 100 : null,
    };
  });
  return (
    <div className="ipl-hub">
      <section className="rcb-hero">
        <div className="rcb-editorial">
          <span className="eyebrow">
            <i /> THE ROYAL CHALLENGERS ARCHIVE
          </span>
          <h2>
            ONE CLUB.
            <br />
            <em>EVERY CHAPTER.</em>
          </h2>
          <p>
            From the first season to the innings that defined an era. Step
            inside the numbers behind the red shirt.
          </p>
          <div>
            <span>{iplArchive.metadata.innings} innings</span>
            <span>{seasons.length} seasons</span>
            <span>Since 2008</span>
          </div>
          <button
            className="primary"
            onClick={() =>
              navigate("innings", { format: "IPL", collection: "archive" })
            }
          >
            Explore every IPL innings
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="rcb-art" aria-hidden="true">
          <span>ROYAL / LOYAL</span>
          <strong>18</strong>
          <span>BENGALURU</span>
        </div>
      </section>
      <div className="season-command">
        <div>
          <span className="eyebrow">CHOOSE YOUR CHAPTER</span>
          <h2>
            {year}
            <span>season</span>
          </h2>
        </div>
        <button className="secondary" onClick={() => exportSeason(year, rows)}>
          <Download size={15} />
          Download season card
        </button>
      </div>
      <div
        ref={seasonRail}
        className="season-selector"
        role="group"
        aria-label="IPL seasons"
      >
        {seasons.map((g) => (
          <button
            key={g.label}
            className={year === g.label ? "active" : ""}
            aria-pressed={year === g.label}
            onClick={() => update({ year: g.label })}
          >
            <span>{g.label}</span>
            <i style={{ height: `${Math.max(4, (g.runs / max) * 52)}px` }} />
            <strong>{g.runs}</strong>
          </button>
        ))}
      </div>
      <section className="season-spotlight">
        <div>
          <span className="eyebrow">
            {year === "2016"
              ? "THE BENCHMARK SEASON"
              : "A SEASON IN THE ARCHIVE"}
          </span>
          <h3>
            {year === "2016"
              ? "The year the ceiling disappeared."
              : `${s.runs} runs. ${s.innings} different stories.`}
          </h3>
          <p>
            {year === "2016"
              ? "Four hundreds. Seven fifties. 973 runs. Explore each innings in the season that became a reference point."
              : `${s.centuries} hundreds and ${s.fifties} fifties in the covered ${year} batting innings. Select a score below to see how it happened.`}
          </p>
        </div>
        <div className="season-run-total">
          <strong>{number(s.runs)}</strong>
          <span>RUNS / {year}</span>
        </div>
      </section>
      <Metrics rows={rows} />
      <Panel className="season-scoreline">
        <PanelHead
          title="The season, innings by innings"
          eyebrow="IN CHRONOLOGICAL ORDER"
          action={
            <span className="badge">Select a score to open its story</span>
          }
        />
        <div className="season-matches">
          {rows.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setDetail(r)}
              className={scoreTone(r.runs)}
              aria-label={`IPL ${year}: ${r.runs} against ${r.opponent}`}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <strong>
                {r.runs}
                {r.notOut ? "*" : ""}
              </strong>
              <small>{shortOpponent(r.opponent)}</small>
              <i className={r.result === "won" ? "won" : "lost"} />
            </button>
          ))}
        </div>
        <p className="panel-footnote">
          Green dot: team win. Grey dot: other result. DNB appearances are
          excluded.
        </p>
      </Panel>
      <div className="ipl-analysis-grid">
        <Panel>
          <PanelHead
            title="How the innings takes shape"
            eyebrow="SCORING PHASES"
          />
          <div className="phase-cards">
            {phases.map((p, i) => (
              <article key={p.name}>
                <div>
                  <span>
                    0{i + 1} / {p.name}
                  </span>
                  <small>{["Overs 1–6", "Overs 7–15", "Overs 16–20"][i]}</small>
                </div>
                <strong>
                  {val(p.sr, 1)}
                  <small>strike rate</small>
                </strong>
                <div className="phase-track">
                  <span
                    style={{
                      width: `${p.runs ? (p.boundaries / p.runs) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p>
                  {p.runs} runs · {p.balls} balls
                  <br />
                  {p.boundaries} runs in boundaries
                </p>
              </article>
            ))}
          </div>
          <p className="panel-footnote">
            Actual match-over bands, including shortened matches; bars show the
            share of runs from boundaries.
          </p>
        </Panel>
        <Panel>
          <PanelHead
            title="Against the opposition"
            eyebrow={`${year} · COVERED INNINGS`}
          />
          <div className="ipl-opponents">
            {opponents.map((o) => (
              <button
                key={o.label}
                onClick={() =>
                  navigate("innings", {
                    format: "IPL",
                    year,
                    opponent: o.label,
                    collection: "archive",
                  })
                }
              >
                <span>
                  {shortOpponent(o.label)}
                  <small>{o.innings} innings</small>
                </span>
                <div>
                  <i
                    style={{
                      width: `${(o.runs / Math.max(1, ...opponents.map((x) => x.runs))) * 100}%`,
                    }}
                  />
                </div>
                <strong>{o.runs}</strong>
                <ArrowUpRight size={13} />
              </button>
            ))}
          </div>
        </Panel>
      </div>
      {best && (
        <section className="season-finale">
          <Trophy size={28} />
          <div>
            <span className="eyebrow">THE SEASON HIGH</span>
            <h3>
              {best.runs}
              {best.notOut ? "*" : ""} vs {best.opponent}
            </h3>
            <p>
              {displayDate(best.date)} · {best.balls} balls · {best.venue}
            </p>
          </div>
          <button className="secondary" onClick={() => setDetail(best)}>
            Open scorecard
            <ArrowUpRight size={15} />
          </button>
          <button
            className="secondary"
            onClick={() =>
              navigate("story", {
                chapter: "compare-innings",
                left: best.id,
                right: "1298150",
              })
            }
          >
            Compare innings
            <ArrowRight size={15} />
          </button>
        </section>
      )}
      <div className="ipl-source">
        <span className="eyebrow">A SOURCED ARCHIVE</span>
        <p>
          {iplArchive.metadata.innings} batting innings across{" "}
          {iplArchive.metadata.matches} covered appearances,{" "}
          {displayDate(iplArchive.metadata.coverageStart)}–
          {displayDate(iplArchive.metadata.coverageEnd)}. This is separate from
          the stored career snapshot. Super overs and DNB are excluded.
        </p>
        <a
          href="https://cricsheet.org/downloads/"
          target="_blank"
          rel="noreferrer"
        >
          Cricsheet · source & attribution
          <ArrowUpRight size={13} />
        </a>
      </div>
      <Detail
        row={detail}
        close={() => setDetail(null)}
        saved={saved}
        toggleSave={toggleSave}
      />
    </div>
  );
}
