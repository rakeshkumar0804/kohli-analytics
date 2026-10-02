import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Search,
  GitCompareArrows,
} from "lucide-react";
import { inningsIndex, type ArchiveInnings } from "./insights";
import { displayDate, type ViewState } from "./model";
import {
  checkpointAt,
  loadInningsDetail,
  resolvePair,
  type InningsDetailData,
} from "./inningsCompareModel";
import { Panel, PanelHead } from "./ui";
const colors = ["#e4c17f", "#87c7ba"];
const label = (r: ArchiveInnings) =>
  `${r.runs}${r.notOut ? "*" : ""} vs ${r.opponent} · ${r.date} · ${r.format}`;
function Picker({
  row,
  other,
  side,
  onChange,
}: {
  row: ArchiveInnings;
  other: string;
  side: string;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const options = inningsIndex.filter(
    (r) =>
      r.id !== other &&
      r.id !== row.id &&
      `${r.opponent} ${r.venue} ${r.date} ${r.runs} ${r.format}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  return (
    <div className="innings-picker">
      <div className="picker-label">
        <i />
        {side}
        <span>
          {row.format} · {row.innings === 2 ? "Chasing" : "Batting first"}
        </span>
      </div>
      <label className="search-input">
        <Search size={15} />
        <input
          aria-label={`Search innings ${side}`}
          placeholder="Find by opponent, year, ground or score…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <select
        aria-label={`Select innings ${side}`}
        value={row.id}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value={row.id}>{label(row)}</option>
        {options.map((r) => (
          <option key={r.id} value={r.id}>
            {label(r)}
          </option>
        ))}
      </select>
      <small>
        {options.length} other matching innings · current selection stays
        available
      </small>
    </div>
  );
}
function BowlerTable({
  row,
  data,
}: {
  row: ArchiveInnings;
  data: InningsDetailData;
}) {
  return (
    <details className="compare-bowlers">
      <summary>
        Bowler matchups · {row.opponent}, {row.date.slice(0, 4)}{" "}
        <span>{data.bowlers.length} bowlers</span>
      </summary>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Bowler</th>
              <th>Runs</th>
              <th>Balls</th>
              <th>SR</th>
              <th>4s/6s</th>
            </tr>
          </thead>
          <tbody>
            {data.bowlers.map((b) => (
              <tr key={b.name}>
                <td>{b.name}</td>
                <td>{b.runs}</td>
                <td>{b.balls}</td>
                <td>{b.balls ? ((b.runs / b.balls) * 100).toFixed(1) : "—"}</td>
                <td>
                  {b.fours}/{b.sixes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
export default function InningsCompare({
  view,
  update,
}: {
  view: ViewState;
  update: (patch: Partial<ViewState>) => void;
}) {
  const pair = resolvePair(view.left, view.right);
  const [details, setDetails] = useState<
    [InningsDetailData, InningsDetailData] | null
  >(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [cursor, setCursor] = useState(0);
  const a = pair[0],
    b = pair[1];
  const maxBalls = Math.max(1, a.balls, b.balls),
    maxRuns = Math.max(1, a.runs, b.runs);
  useEffect(() => {
    let active = true;
    setDetails(null);
    setError(false);
    setCursor(Math.max(a.balls, b.balls));
    Promise.all([loadInningsDetail(a), loadInningsDetail(b)])
      .then((result) => {
        if (active) setDetails(result);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [a, b, retry]);
  const active = details?.map((d) => checkpointAt(d.progress, cursor));
  const metrics = [
    {
      label: "Runs",
      value: (r: ArchiveInnings) => `${r.runs}${r.notOut ? "*" : ""}`,
    },
    { label: "Balls faced", value: (r: ArchiveInnings) => String(r.balls) },
    {
      label: "Strike rate",
      value: (r: ArchiveInnings) =>
        r.balls ? ((r.runs / r.balls) * 100).toFixed(2) : "—",
    },
    {
      label: "Fours / sixes",
      value: (r: ArchiveInnings) => `${r.fours} / ${r.sixes}`,
    },
    {
      label: "Boundary runs",
      value: (r: ArchiveInnings) =>
        `${r.fours * 4 + r.sixes * 6} (${r.runs ? (((r.fours * 4 + r.sixes * 6) / r.runs) * 100).toFixed(1) : "0"}%)`,
    },
    {
      label: "Zero-batter-run balls",
      value: (r: ArchiveInnings) => `${r.dots} of ${r.balls}`,
    },
    { label: "Team result", value: (r: ArchiveInnings) => r.result },
  ];
  return (
    <div className="innings-comparison">
      <div className="story-section-intro">
        <div>
          <span className="eyebrow">TWO INNINGS / TWO DIFFERENT STORIES</span>
          <h2>Same batter. Another kind of brilliance.</h2>
        </div>
        <GitCompareArrows size={25} />
      </div>
      <div className="comparison-presets">
        <span>Start with a rivalry of innings</span>
        <button onClick={() => update({ left: "1298150", right: "951363" })}>
          Melbourne vs Mohali
        </button>
        <button onClick={() => update({ left: "518966", right: "535798" })}>
          Hobart vs Mirpur
        </button>
        <button
          className="swap-pair"
          aria-label="Swap compared innings"
          onClick={() => update({ left: b.id, right: a.id })}
        >
          <ArrowLeftRight size={15} />
          Swap
        </button>
      </div>
      <div className="pair-pickers">
        <Picker
          row={a}
          other={b.id}
          side="A"
          onChange={(id) => update({ left: id, right: b.id })}
        />
        <Picker
          row={b}
          other={a.id}
          side="B"
          onChange={(id) => update({ left: a.id, right: id })}
        />
      </div>
      <div className="pair-scorecards">
        {pair.map((r, i) => (
          <article
            key={r.id}
            style={{ "--pair-color": colors[i] } as React.CSSProperties}
          >
            <div className="pair-card-top">
              <span>
                INNINGS {i === 0 ? "A" : "B"} · {r.format}
              </span>
              <span>{displayDate(r.date)}</span>
            </div>
            <h3>vs {r.opponent}</h3>
            <p>{r.venue}</p>
            <div className="pair-score">
              <strong>
                {r.runs}
                {r.notOut ? "*" : ""}
              </strong>
              <span>
                off {r.balls} balls
                <small>
                  {r.balls ? ((r.runs / r.balls) * 100).toFixed(2) : "—"} strike
                  rate
                </small>
              </span>
            </div>
            <div className="pair-boundaries">
              <span>
                <strong>{r.fours}</strong> fours
              </span>
              <span>
                <strong>{r.sixes}</strong> sixes
              </span>
              <span className="result-pill">{r.result}</span>
            </div>
          </article>
        ))}
      </div>
      {a.format !== b.format && (
        <p className="pair-scope">
          Different formats: {a.format} and {b.format}. The chart uses actual
          balls faced, without adjusting for match length, pitch or opposition.
        </p>
      )}
      {details ? (
        <>
          <Panel className="pair-chart-panel">
            <PanelHead
              eyebrow="CUMULATIVE RUNS × BALLS FACED"
              title="Two paths through an innings"
              action={<span className="badge">Move the slider to inspect</span>}
            />
            <div className="pair-legend">
              {pair.map((r, i) => (
                <span key={r.id}>
                  <i style={{ background: colors[i] }} />
                  {i === 0 ? "A" : "B"} · {r.opponent} {r.date.slice(0, 4)}
                </span>
              ))}
            </div>
            <svg
              className="pair-chart"
              viewBox="0 0 700 290"
              role="img"
              aria-label="Cumulative runs plotted against actual balls faced. Gold is innings A, teal is innings B. Points are recorded over checkpoints, not every delivery."
            >
              {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                <g key={v}>
                  <line
                    x1="45"
                    x2="665"
                    y1={235 - v * 200}
                    y2={235 - v * 200}
                    stroke="#333944"
                    strokeDasharray="3 5"
                  />
                  <text x="33" y={239 - v * 200} textAnchor="end">
                    {Math.round(v * maxRuns)}
                  </text>
                  <text x={45 + v * 620} y="258" textAnchor="middle">
                    {Math.round(v * maxBalls)}
                  </text>
                </g>
              ))}
              <text x="355" y="282" textAnchor="middle">
                Balls faced
              </text>
              {details.map((d, i) => (
                <path
                  key={i}
                  d={
                    "M45,235 " +
                    d.progress
                      .map(
                        (p) =>
                          `L${45 + (p.balls / maxBalls) * 620},${235 - (p.runs / maxRuns) * 200}`,
                      )
                      .join(" ")
                  }
                  stroke={colors[i]}
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinejoin="round"
                />
              ))}
              <line
                x1={45 + (cursor / maxBalls) * 620}
                x2={45 + (cursor / maxBalls) * 620}
                y1="25"
                y2="235"
                stroke="#ccc2aa"
                strokeDasharray="4 5"
              />
              {active?.map(
                (p, i) =>
                  p && (
                    <circle
                      key={i}
                      cx={45 + (p.balls / maxBalls) * 620}
                      cy={235 - (p.runs / maxRuns) * 200}
                      r="5"
                      fill={colors[i]}
                      stroke="#151a23"
                      strokeWidth="2"
                    />
                  ),
              )}
            </svg>
            <label className="pair-slider">
              Inspect through <strong>{cursor} balls</strong>
              <input
                type="range"
                aria-label="Comparison balls faced"
                min="0"
                max={maxBalls}
                value={cursor}
                onChange={(e) => setCursor(Number(e.target.value))}
              />
            </label>
            <div className="pair-checkpoints">
              {active?.map((p, i) => (
                <div key={i}>
                  <span>
                    INNINGS {i === 0 ? "A" : "B"} · LAST RECORDED CHECKPOINT
                  </span>
                  {p ? (
                    <>
                      <strong>
                        {p.runs}
                        <small> off {p.balls} balls</small>
                      </strong>
                      <p>
                        Over {p.over} ·{" "}
                        {pair[i].format === "IPL" ? "RCB" : "India"}{" "}
                        {p.teamRuns}/{p.wickets}
                        {cursor >= pair[i].balls ? " · Innings complete" : ""}
                      </p>
                    </>
                  ) : (
                    <p>No recorded checkpoint by {cursor} balls.</p>
                  )}
                </div>
              ))}
            </div>
            <p className="panel-footnote">
              Lines connect recorded over checkpoints; they do not estimate
              every delivery. The readouts show the last actual checkpoint at or
              before your selected ball count. One innings may finish before the
              other.
            </p>
          </Panel>
          <div className="comparison-detail-grid">
            <Panel>
              <PanelHead title="The scorecard, side by side" />
              <div className="table-scroll">
                <table className="pair-metrics">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>A · {a.opponent}</th>
                      <th>B · {b.opponent}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => (
                      <tr key={m.label}>
                        <td>{m.label}</td>
                        <td>{m.value(a)}</td>
                        <td>{m.value(b)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="panel-footnote">
                Zero-batter-run balls include byes and leg-byes. A higher strike
                rate alone does not determine which innings was better.
              </p>
            </Panel>
            <Panel>
              <PanelHead
                title="Against the bowling"
                eyebrow="EXACT MATCHUP TOTALS"
              />
              {pair.map((r, i) => (
                <BowlerTable key={r.id} row={r} data={details[i]} />
              ))}
              <p className="panel-footnote">
                Runs and boundaries are credited to Kohli. Bowler figures here
                exclude runs scored by other batters and extras.
              </p>
              <div className="pair-sources">
                {pair.map((r, i) => (
                  <a
                    key={r.id}
                    href="https://cricsheet.org/downloads/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Source {i === 0 ? "A" : "B"} · Cricsheet #{r.id}
                    <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            </Panel>
          </div>
        </>
      ) : (
        <div className="pair-loading panel" role="status">
          {error ? (
            <>
              <h3>Comparison details could not load.</h3>
              <p>Your selected innings are preserved.</p>
              <button
                className="secondary"
                onClick={() => setRetry((s) => s + 1)}
              >
                Retry comparison
              </button>
            </>
          ) : (
            <>
              <span className="loading-line" />
              <p>Loading both innings…</p>
            </>
          )}
        </div>
      )}
      <p className="quiet-scope">
        Choose from {inningsIndex.length} covered ODI/T20I/IPL innings. Use
        Share view above to keep this pair in a link. Test delivery comparisons
        are not included.
      </p>
    </div>
  );
}
