import { useState } from "react";
import type { ViewState } from "./model";
import { Panel, PanelHead } from "./ui";
type Player = {
  id: string;
  name: string;
  shortName: string;
  stats: {
    battingAvg: number;
    strikeRate: number;
    centuries: number;
    innings: number;
    lastMatch: string;
  };
  source: string;
  checkedAt: string;
};
const colors = ["#ef9b7d", "#87bdb7", "#b6a2e4", "#d3bf7b"];
export function CompareVisual({
  players,
  format,
  view,
  update,
}: {
  players: Player[];
  format: string;
  view: ViewState;
  update: (p: Partial<ViewState>) => void;
}) {
  const [fullScale, setFullScale] = useState(false);
  const domain = (values: number[], step: number) => {
    const low = fullScale
      ? 0
      : Math.max(0, Math.floor((Math.min(...values) - step) / step) * step);
    const high = Math.max(
      low + step * 4,
      Math.ceil((Math.max(...values) + step) / step) * step,
    );
    return [low, high];
  };
  const [minAvg, maxAvg] = domain(
    players.map((p) => p.stats.battingAvg),
    5,
  );
  const [minSR, maxSR] = domain(
    players.map((p) => p.stats.strikeRate),
    10,
  );
  const focus = players.find((p) => p.id === view.focusA) || players[0];
  const peer =
    players.find((p) => p.id === view.focusB && p.id !== focus?.id) ||
    players.find((p) => p.id !== focus?.id);
  return (
    <>
      <details className="comparison-provenance">
        <summary>Sources & sample sizes · checked 2 Oct 2026</summary>
        <p>
          Last match means the match’s starting date in the source. This is a
          saved snapshot, not an automatic live feed.
        </p>
        <div>
          {players.map((p) => (
            <article key={p.id}>
              <strong>{p.name}</strong>
              <span>Last match: {p.stats.lastMatch}</span>
              <span>
                {p.stats.innings} batting innings
                {p.stats.innings < 30 ? " · small sample" : ""}
              </span>
              <span>Checked: {p.checkedAt}</span>
              <a href={p.source} target="_blank" rel="noreferrer">
                Cricbuzz player record ↗
              </a>
            </article>
          ))}
        </div>
      </details>
      <div className="compare-visual-grid">
        <Panel>
          <PanelHead
            title="Consistency meets scoring pace"
            eyebrow={`${format} · BATTING AVERAGE × STRIKE RATE`}
          />
          <button
            className="text-button"
            aria-pressed={fullScale}
            onClick={() => setFullScale(!fullScale)}
          >
            {fullScale ? "Focus on selected players" : "Show axes from zero"}
          </button>
          <svg
            className="comparison-scatter"
            viewBox="0 0 600 285"
            role="img"
            aria-label="Player comparison: batting average on the horizontal axis and strike rate on the vertical axis. Exact values in the table below."
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <line
                  x1="52"
                  x2="565"
                  y1={232 - i * 48}
                  y2={232 - i * 48}
                  stroke="#303c4c"
                  strokeDasharray="3 5"
                />
                <text x="40" y={236 - i * 48} textAnchor="end">
                  {Math.round(minSR + (i * (maxSR - minSR)) / 4)}
                </text>
                <text x={52 + i * 128.25} y="254" textAnchor="middle">
                  {Math.round(minAvg + (i * (maxAvg - minAvg)) / 4)}
                </text>
              </g>
            ))}
            <text x="310" y="279" textAnchor="middle">
              Batting average →
            </text>
            <text
              x="13"
              y="135"
              transform="rotate(-90 13 135)"
              textAnchor="middle"
            >
              Strike rate →
            </text>
            {players.map((p, i) => {
              const x =
                  52 +
                  ((p.stats.battingAvg - minAvg) / (maxAvg - minAvg)) * 513,
                y =
                  232 - ((p.stats.strikeRate - minSR) / (maxSR - minSR)) * 192;
              return (
                <g key={p.id}>
                  <title>
                    {p.name}: average {p.stats.battingAvg}, strike rate{" "}
                    {p.stats.strikeRate}
                  </title>
                  <circle cx={x} cy={y} r="14" fill={colors[i]} opacity=".1" />
                  <circle
                    cx={x}
                    cy={y}
                    r="11"
                    fill={colors[i]}
                    stroke="#16202b"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    className="scatter-marker"
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="scatter-legend">
            {players.map((p, i) => (
              <div key={p.id}>
                <b style={{ color: colors[i] }}>{i + 1}</b>
                <span>{p.shortName}</span>
                <small>
                  {p.stats.battingAvg.toFixed(2)} avg ·{" "}
                  {p.stats.strikeRate.toFixed(2)} SR
                  <br />
                  {p.stats.innings} innings · last match {p.stats.lastMatch}
                  {p.stats.innings < 30 ? " · small sample" : ""}
                </small>
              </div>
            ))}
          </div>
          <p className="panel-footnote">
            {fullScale
              ? "Axes start at zero. "
              : "Axes focus on the selected range; they do not start at zero. "}
            Higher and further right means faster scoring and more runs per
            dismissal. This does not adjust for era, role or sample size.
          </p>
        </Panel>
        <Panel>
          <PanelHead
            title={
              focus && peer
                ? `${focus.shortName} & ${peer.shortName}`
                : "Read the comparison"
            }
            eyebrow="YOUR COMPARISON FOCUS"
          />
          {focus && peer && (
            <div className="focus-pickers">
              <label>
                Player A
                <select
                  aria-label="Comparison focus A"
                  value={focus.id}
                  onChange={(e) =>
                    update({
                      focusA: e.target.value,
                      focusB: e.target.value === peer.id ? focus.id : peer.id,
                    })
                  }
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Player B
                <select
                  aria-label="Comparison focus B"
                  value={peer.id}
                  onChange={(e) =>
                    update({ focusA: focus.id, focusB: e.target.value })
                  }
                >
                  {players
                    .filter((p) => p.id !== focus.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          )}
          {focus && peer ? (
            <div className="compare-deltas">
              {(
                [
                  {
                    key: "battingAvg",
                    label: "Batting average",
                    unit: "runs per dismissal",
                  },
                  {
                    key: "strikeRate",
                    label: "Strike rate",
                    unit: "runs per 100 balls",
                  },
                  {
                    key: "centuries",
                    label: "Centuries",
                    unit: "career hundreds",
                  },
                ] as const
              ).map((m) => {
                const diff = focus.stats[m.key] - peer.stats[m.key];
                return (
                  <div key={m.key}>
                    <span>{m.label}</span>
                    <strong className={diff >= 0 ? "ahead" : "behind"}>
                      {diff > 0 ? "+" : ""}
                      {diff.toFixed(m.key === "centuries" ? 0 : 2)}
                    </strong>
                    <small>
                      {m.unit} · {focus.shortName}{" "}
                      {diff === 0 ? "level" : diff > 0 ? "ahead" : "behind"}
                    </small>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="section-copy">
              Select at least two players to choose a comparison focus. The
              scatter plot and table reflect every selected player.
            </p>
          )}
          <p className="panel-footnote">
            Differences use stored records. Players may have different career
            cutoffs and sample sizes.
            {focus && peer && (
              <>
                {" "}
                {focus.shortName}: {focus.stats.innings} inn. (last match: {focus.stats.lastMatch}) · {peer.shortName}: {peer.stats.innings} inn. (last match: {peer.stats.lastMatch}) · Checked: {focus.checkedAt}
              </>
            )}
          </p>
        </Panel>
      </div>
    </>
  );
}
