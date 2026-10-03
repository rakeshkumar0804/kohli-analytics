import { useState } from "react";
import { ArrowRight, ArrowUpRight, Globe2 } from "lucide-react";
import CricketQuiz from "./CricketQuiz";
import { parseRound, quizKey } from "./quizModel";
import type { Page, ViewState } from "./model";
const chapterStories: [string, string, string, [string, string][]][] = [
  [
    "India 183",
    "West Indies 140",
    "India won by 43 runs",
    [
      [
        "The platform",
        "Srikkanth’s 38 was India’s highest score. A modest total left the bowlers little room for error.",
      ],
      [
        "The opening",
        "Sandhu bowled Greenidge for one. Richards then threatened to take the game away.",
      ],
      [
        "The turn",
        "Kapil’s running catch off Madan Lal removed Richards. Amarnath helped finish the defence.",
      ],
    ],
  ],
  [
    "Australia 241/7",
    "Sri Lanka 245/3",
    "Sri Lanka won by seven wickets",
    [
      [
        "A strong start",
        "Australia reached 137/1 before de Silva helped change the innings with the wickets of Taylor and Ponting.",
      ],
      [
        "Two disciplines",
        "De Silva took 3/42, then returned to make an unbeaten 107 in the chase.",
      ],
      [
        "A new champion",
        "Sri Lanka completed the chase in 46.2 overs. The final rewarded both recovery and control.",
      ],
    ],
  ],
  [
    "Australia 213",
    "South Africa 213",
    "Match tied · Australia advanced on Super Six position",
    [
      [
        "The resistance",
        "Bevan made 65 and Steve Waugh 56. Pollock and Donald shared nine Australian wickets.",
      ],
      [
        "The equation",
        "South Africa needed nine from the last over. Klusener’s first two boundaries brought the scores level.",
      ],
      [
        "The consequence",
        "Donald’s run-out left the scores tied. Australia progressed under the tournament’s tie-break rule, not a Super Over.",
      ],
    ],
  ],
  [
    "South Africa 281/5",
    "Target 298 in 43 overs",
    "New Zealand reached its first men’s World Cup final",
    [
      [
        "Rain changes the chase",
        "South Africa finished on 281/5 in 43 overs. The adjusted target was 298, not 282.",
      ],
      [
        "The launch",
        "McCullum’s 59 from 26 balls gave New Zealand a rapid start to a demanding chase.",
      ],
      [
        "The finish",
        "Elliott hit Steyn for six with one ball remaining. The winning shot settled a rain-adjusted thriller.",
      ],
    ],
  ],
];
const chapters = [
  {
    year: "1983",
    title: "The outsiders who changed the game.",
    team: "INDIA",
    detail:
      "A title built on more than one hero. Revisit the bowling, the support acts and the moments behind the famous trophy lift.",
    source:
      "https://www.icc-cricket.com/news/1983-crickets-greatest-underdog-story-scripted-by-kapils-devils",
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
  const [returning] = useState(() => {
    try {
      return parseRound(localStorage.getItem(quizKey));
    } catch {
      return null;
    }
  });
  const story = chapterStories[index];
  return (
    <div className="cricket-club">
      <div className="club-fastlane">
        <div>
          <span className="eyebrow">YOUR NEXT INNINGS</span>
          <strong>
            {returning
              ? "Pick up where you left off."
              : "Eight questions. A fresh challenge every day."}
          </strong>
        </div>
        <a
          className="primary"
          href="#cricket-gauntlet"
          onClick={(e) => {
            e.preventDefault();
            document
              .getElementById("cricket-gauntlet")
              ?.scrollIntoView({ behavior: "auto" });
            document.getElementById("cricket-gauntlet")?.focus();
          }}
        >
          {returning?.done ? "View your result" : returning ? "Continue quiz" : "Play the daily eight"}
          <ArrowRight size={17} />
        </a>
      </div>
      <section className={`club-intro ${returning ? "returning" : ""}`}>
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
        <div className="chapter-score">
          <div>
            <span>IN THE SCOREBOOK</span>
            <strong>{story[0]}</strong>
            <strong>{story[1]}</strong>
          </div>
          <p>{story[2]}</p>
        </div>
        <div className="chapter-moments">
          {story[3].map(([title, body], i) => (
            <article key={title}>
              <span>0{i + 1} / TURNING POINT</span>
              <h4>{title}</h4>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <p className="chapter-source">
          Match summary and editorial turning points ·{" "}
          <a href={c.source} target="_blank" rel="noreferrer">
            ICC historical source ↗
          </a>
        </p>
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
