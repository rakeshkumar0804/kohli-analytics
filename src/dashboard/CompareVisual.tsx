import type { ViewState } from "./model";
import { Panel, PanelHead } from "./ui";
type Player = {
  id: string;
  name: string;
  shortName: string;
  stats: { battingAvg: number; strikeRate: number; centuries: number };
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
  const maxAvg =
    Math.ceil(Math.max(60, ...players.map((p) => p.stats.battingAvg)) / 10) *
    10;
  const maxSR =
    Math.ceil(Math.max(80, ...players.map((p) => p.stats.strikeRate)) / 20) *
    20;
  const focus = players.find((p) => p.id === view.focusA) || players[0];
  const peer =
    players.find((p) => p.id === view.focusB && p.id !== focus?.id) ||
    players.find((p) => p.id !== focus?.id);
  return (
    <div className="compare-visual-grid">
      <Panel>
        <PanelHead
          title="Consistency meets scoring pace"
          eyebrow={`${format} · BATTING AVERAGE × STRIKE RATE`}
        />
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
                {Math.round((i * maxSR) / 4)}
              </text>
              <text x={52 + i * 128.25} y="254" textAnchor="middle">
                {Math.round((i * maxAvg) / 4)}
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
            const x = 52 + (p.stats.battingAvg / maxAvg) * 513,
              y = 232 - (p.stats.strikeRate / maxSR) * 192;
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
                  r="6"
                  fill={colors[i]}
                  stroke="#16202b"
                  strokeWidth="2"
                />
                <text
                  x={x > 475 ? x - 12 : x + 12}
                  y={y + (i % 2 ? 18 : -12)}
                  textAnchor={x > 475 ? "end" : "start"}
                  fill={colors[i]}
                >
                  {p.shortName}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="panel-footnote">
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
          cutoffs and very different sample sizes.
        </p>
      </Panel>
    </div>
  );
}
