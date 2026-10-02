import { useState } from "react";
import { ArrowRight, ArrowUpRight, Globe2 } from "lucide-react";
import CricketQuiz from "./CricketQuiz";
import type { Page, ViewState } from "./model";
const chapters = [
  {
    year: "1983",
    title: "The outsiders who changed the game.",
    team: "INDIA",
    detail:
      "A title built on more than one hero. Revisit the bowling, the support acts and the moments behind the famous trophy lift.",
    source:
      "https://www.icc-cricket.com/tournaments/cricketworldcup/news/on-this-day-india-win-the-1983-world-cup",
  },
  {
    year: "1996",
    title: "A new way to win.",
    team: "SRI LANKA",
    detail:
      "An all-round final from Aravinda de Silva. A tournament that ended with Sri Lanka holding the World Cup.",
    source:
      "https://www.icc-cricket.com/tournaments/cricketworldcup/news/mens-cricket-world-cup-1996-overview",
  },
  {
    year: "1999",
    title: "One run. A thousand what-ifs.",
    team: "AUSTRALIA / SOUTH AFRICA",
    detail:
      "A tied semi-final, a frantic run-out, and a place in the final decided by the Super Six table.",
    source:
      "https://www.icc-cricket.com/tournaments/cricketworldcup/news/mens-cricket-world-cup-1999-overview",
  },
  {
    year: "2015",
    title: "The finish before the final.",
    team: "NEW ZEALAND",
    detail:
      "Grant Elliott. Dale Steyn. A penultimate-ball six that took New Zealand into its first men’s World Cup final.",
    source:
      "https://www.icc-cricket.com/tournaments/cricketworldcup/news/mens-cricket-world-cup-2015-overview",
  },
];
export default function CricketClub({
  navigate,
}: {
  navigate: (p: Page, v?: Partial<ViewState>) => void;
}) {
  const [index, setIndex] = useState(0);
  const c = chapters[index];
  return (
    <div className="cricket-club">
      <section className="club-intro">
        <Globe2 size={26} />
        <span className="eyebrow">
          THE WHOLE GAME / A PLACE FOR CRICKET PEOPLE
        </span>
        <h2>
          Different shirts.
          <br />
          <em>The same obsession.</em>
        </h2>
        <p>The Kohli archive is one doorway. Cricket has many more.</p>
      </section>
      <section className="world-chapters" aria-label="World Cup chapters">
        <div className="world-tabs" role="group" aria-label="World Cup years">
          {chapters.map((c, i) => (
            <button
              key={c.year}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            >
              {c.year}
            </button>
          ))}
        </div>
        <div className="world-stage">
          <div>
            <span className="eyebrow">{c.team} / WORLD CUP MEMORY</span>
            <h3>{c.title}</h3>
            <p>{c.detail}</p>
            <a href={c.source} target="_blank" rel="noreferrer">
              Read the ICC retrospective
              <ArrowUpRight size={15} />
            </a>
          </div>
          <strong aria-hidden="true">{c.year.slice(2)}</strong>
        </div>
      </section>
      <div className="club-conversations">
        <button
          onClick={() =>
            navigate("compare", {
              format: "Test",
              players: "smith,root,williamson",
              focusA: "root",
              focusB: "smith",
            })
          }
        >
          <span className="eyebrow">THREE TEST CRAFTSMEN</span>
          <h3>Root. Smith. Williamson.</h3>
          <p>
            Choose the pair. Inspect the numbers. Keep the eras and sample sizes
            in view.
          </p>
          <ArrowRight size={20} />
        </button>
        <button
          onClick={() =>
            navigate("compare", {
              format: "ODI",
              players: "sachin,ponting,rohit",
              focusA: "sachin",
              focusB: "ponting",
            })
          }
        >
          <span className="eyebrow">ODI ACROSS GENERATIONS</span>
          <h3>Different careers. Your perspective.</h3>
          <p>
            Explore Tendulkar, Ponting and Rohit without a permanent benchmark.
          </p>
          <ArrowRight size={20} />
        </button>
      </div>
      <CricketQuiz />
    </div>
  );
}
