import {
  ArrowRight,
  ArrowUpRight,
  Play,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { formatCutoffs, formatLabel, type Page, type ViewState } from "./model";
type Navigate = (page: Page, extra?: Partial<ViewState>) => void;
export function IdentityHero({
  view,
  navigate,
}: {
  view: ViewState;
  navigate: Navigate;
}) {
  return (
    <section
      className="identity-hero"
      aria-label="Virat Kohli, the analytics story"
    >
      <div className="hero-editorial">
        <div className="hero-kicker">
          <span /> THE KOHLI STORY{" "}
          <span className="hero-edition">NO. 18 / INDIA</span>
        </div>
        <h2>
          <span>VIRAT</span> KOHLI<span className="hero-period">.</span>
        </h2>
        <h3>Every run. A reason to believe.</h3>
        <p>
          The rise. The pressure. The innings you still remember.
          <br className="desktop-break" /> Explore the story, then get inside
          the numbers.
        </p>
        <div className="hero-actions">
          <button
            className="primary"
            onClick={() =>
              navigate("story", { chapter: "eras", format: "ODI" })
            }
          >
            Explore the story <ArrowRight size={16} />
          </button>
          <button
            className="hero-replay"
            onClick={() =>
              navigate("story", { chapter: "replay", match: "1298150" })
            }
          >
            <span>
              <Play size={13} fill="currentColor" />
            </span>
            Relive Melbourne ’22
          </button>
        </div>
        <span className="hero-scope">
          {formatLabel(view.format)} · {formatCutoffs[view.format]}
        </span>
      </div>
      <div className="identity-art" aria-hidden="true">
        <div className="identity-watermark">VK</div>
        <svg viewBox="0 0 380 380">
          <defs>
            <linearGradient id="identityArc" x1="0" y1="1" x2="1" y2="0">
              <stop stopColor="#e43755" />
              <stop offset=".48" stopColor="#d77349" />
              <stop offset="1" stopColor="#ead18a" />
            </linearGradient>
          </defs>
          <circle cx="190" cy="190" r="172" className="identity-outer" />
          <circle cx="190" cy="190" r="147" className="identity-inner" />
          <circle cx="190" cy="190" r="126" className="identity-dashes" />
          <circle
            cx="190"
            cy="190"
            r="147"
            fill="none"
            stroke="url(#identityArc)"
            strokeWidth="5"
            strokeDasharray="750 174"
            transform="rotate(-52 190 190)"
            className="identity-orbit"
          />
          <path d="M37 286 L330 82 M56 310 L352 100" stroke="#b7955822" />
          <text x="190" y="222" className="identity-jersey" textAnchor="middle">
            18
          </text>
          <text x="190" y="253" className="identity-name" textAnchor="middle">
            ONE OF A KIND
          </text>
          <circle cx="296" cy="88" r="6" fill="#e3bd73" />
          <circle cx="70" cy="275" r="4" fill="#e4455b" />
        </svg>
        <div className="identity-art-label">
          <span>INDIA’S NO. 18</span>
          <i />
          <span>RIGHT-HAND BAT</span>
        </div>
      </div>
    </section>
  );
}
export function StoryEntrances({ navigate }: { navigate: Navigate }) {
  return (
    <div className="story-entrances">
      <button
        className="entrance entrance-replay"
        onClick={() =>
          navigate("story", { chapter: "replay", match: "1298150" })
        }
      >
        <div className="entrance-art">
          <strong>
            82<span>*</span>
          </strong>
          <Play size={17} />
        </div>
        <div>
          <span className="eyebrow">MELBOURNE · 2022</span>
          <h3>The night belief won.</h3>
          <p>Replay the chase, over by over.</p>
        </div>
        <ArrowUpRight size={18} />
      </button>
      <button
        className="entrance"
        onClick={() =>
          navigate("story", { chapter: "eras", era: "peak", format: "ODI" })
        }
      >
        <TrendingUp size={24} />
        <div>
          <span className="eyebrow">THE CAREER ARC</span>
          <h3>What did peak Kohli look like?</h3>
          <p>Five eras. Follow the transformation.</p>
        </div>
        <ArrowUpRight size={18} />
      </button>
      <button
        className="entrance"
        onClick={() => navigate("story", { chapter: "captaincy" })}
      >
        <Trophy size={24} />
        <div>
          <span className="eyebrow">THE CAPTAIN’S CHAPTER</span>
          <h3>A different kind of legacy.</h3>
          <p>68 Tests. 40 wins. An attitude shift.</p>
        </div>
        <ArrowUpRight size={18} />
      </button>
    </div>
  );
}
