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
      "India 183 all out. West Indies 140 all out. Nobody gave Kapil's Devils a chance, but Mohinder Amarnath's 3/12 and a stunning Kapil Dev catch of Viv Richards at 57 turned the final on its head. Roger Binny finished the tournament with 18 wickets — the quiet architect of the upset.",
    scorecard: "IND 183 · WI 140 · India won by 43 runs",
    turningPoint: "Kapil Dev's catch to dismiss Viv Richards at 57",
    source:
      "https://www.icc-cricket.com/tournaments/cricketworldcup/news/on-this-day-india-win-the-1983-world-cup",
  },
  {
    year: "1996",
    title: "A new way to win.",
    team: "SRI LANKA",
    detail:
      "Aravinda de Silva took 3/42 with the ball and then scored an unbeaten 107 in the final — the most complete World Cup final performance ever. Sri Lanka chased down Australia's 241 with 22 balls to spare. Sanath Jayasuriya's explosive 82-ball 44 in the powerplay overs had already redefined how ODIs could begin.",
    scorecard: "AUS 241/7 · SL 245/3 · Sri Lanka won by 7 wickets",
    turningPoint: "de Silva's all-round mastery: 3/42 and 107*",
    source:
      "https://www.icc-cricket.com/tournaments/cricketworldcup/news/mens-cricket-world-cup-1996-overview",
  },
  {
    year: "1999",
    title: "One run. A thousand what-ifs.",
    team: "AUSTRALIA / SOUTH AFRICA",
    detail:
      "Australia 213. South Africa 213. The scores were level, but Allan Donald was run out attempting the winning run — the most dramatic single delivery in World Cup history. Damien Fleming bowled the last over, Lance Klusener smashed two fours, then confusion between the wickets ended South Africa's dream.",
    scorecard: "AUS 213 · SA 213 · Match tied · AUS advanced",
    turningPoint: "Donald's run-out off the last ball with scores tied",
    source:
      "https://www.icc-cricket.com/tournaments/cricketworldcup/news/mens-cricket-world-cup-1999-overview",
  },
  {
    year: "2015",
    title: "The finish before the final.",
    team: "NEW ZEALAND",
    detail:
      "Dale Steyn ran in to bowl the penultimate ball of the semi-final. Grant Elliott launched it over long-on for six. New Zealand 300/7. South Africa's World Cup heartbreak continued. Elliott's unbeaten 84 from 73 balls rescued NZ from 149/4 and completed the greatest semi-final chase ever seen.",
    scorecard: "SA 281/5 · NZ 299/6 · New Zealand won by 4 wickets",
    turningPoint: "Elliott's penultimate-ball six off Steyn",
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
            {c.scorecard && (
              <p style={{ fontFamily: 'var(--sport-font)', fontSize: '14px', color: '#e2bd7c', margin: '12px 0 8px', letterSpacing: '0.5px' }}>
                📊 {c.scorecard}
              </p>
            )}
            <p>{c.detail}</p>
            {c.turningPoint && (
              <p style={{ fontSize: '12px', color: '#8dc6b5', marginTop: '10px', fontStyle: 'italic' }}>
                ⚡ Turning point: {c.turningPoint}
              </p>
            )}
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
