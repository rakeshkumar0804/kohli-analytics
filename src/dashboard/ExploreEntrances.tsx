import { ArrowRight, Sparkles } from "lucide-react";
import type { Page, ViewState } from "./model";
type Props = { navigate: (p: Page, v?: Partial<ViewState>) => void };
export function ExploreEntrances({
  navigate,
}: {
  navigate: Props["navigate"];
}) {
  return (
    <>
      <section className="explore-entrances" aria-label="New ways to explore">
        <button
          onClick={() => navigate("ipl", { format: "IPL", year: "2016" })}
        >
          <div>
            <span className="eyebrow">THE RCB CHAPTER</span>
            <h3>One club. Hundreds of stories.</h3>
            <p>
              Season journeys, scoring phases and every covered IPL innings.
            </p>
            <span className="explore-link">
              Enter the red room <ArrowRight size={15} />
            </span>
          </div>
          <strong aria-hidden="true">18</strong>
        </button>
        <button
          onClick={() =>
            navigate("discover", { format: "ALL", metric: "gems" })
          }
        >
          <div>
            <span className="eyebrow">DISCOVERY LAB</span>
            <h3>Find your next favourite innings.</h3>
            <p>
              The famous hundreds. The quiet match-winners. The whole pattern.
            </p>
            <span className="explore-link">
              Follow your curiosity <ArrowRight size={15} />
            </span>
          </div>
          <Sparkles size={60} />
        </button>
      </section>
      <button className="club-entrance" onClick={() => navigate("club")}>
        <span>
          <small>BEYOND ONE PLAYER</small>
          <strong>Enter the Cricket Club</strong>
          <p>
            World Cup stories · flexible player comparisons · the 40-question
            expert gauntlet
          </p>
        </span>
        <ArrowRight size={24} />
      </button>
    </>
  );
}
