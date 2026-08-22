import { useState } from 'react';
import { useIntersectionObserver } from '../../hooks';
import type { QuizQuestion } from '../../types';
import './BonusSection.css';

const MILESTONES = [
  { year: '2008', title: 'International Debut', desc: 'ODI debut against Sri Lanka in Dambulla at age 19.' },
  { year: '2011', title: 'World Cup Winner', desc: 'Scored vital 35 in WC Final chase against Sri Lanka.' },
  { year: '2012', title: 'Hobart Storm (133*)', desc: 'Chased 321 in 36.4 overs vs Sri Lanka.' },
  { year: '2016', title: '973 IPL Runs Peak', desc: 'All-time IPL record season with 4 centuries.' },
  { year: '2019', title: 'Fastest 20,000 Runs', desc: 'Surpassed Tendulkar & Lara in total innings taken.' },
  { year: '2022', title: '71st Century (122*)', desc: 'Ended 1020-day century drought in Asia Cup.' },
  { year: '2023', title: '50th ODI Century', desc: 'Broke Sachin Tendulkar\'s record of 49 ODI centuries in the World Cup semifinal.' },
  { year: '2024', title: 'T20 WC Final Hero', desc: '76 off 59 in Bridgetown to crown India T20 World Champions.' },
];

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What is Virat Kohli's career ODI batting average?",
    options: ["44.83", "58.59", "51.42", "62.11"],
    correct: 1,
    explanation: "Kohli averages 58.59 in ODIs — highest amongst all modern batters with over 5,000 runs."
  },
  {
    id: 2,
    question: "How many ODI centuries has Kohli scored to date?",
    options: ["49", "51", "54", "60"],
    correct: 2,
    explanation: "Kohli passed Sachin Tendulkar's 49 centuries by scoring his 50th at the 2023 World Cup, currently at 54."
  },
  {
    id: 3,
    question: "What is Kohli's highest individual score in ODIs?",
    options: ["175", "183", "200*", "154*"],
    correct: 1,
    explanation: "He scored 183 against Pakistan at Dhaka in the 2012 Asia Cup while chasing 330."
  },
  {
    id: 4,
    question: "What is Kohli's ODI batting average in successful run chases?",
    options: ["72.4", "82.1", "89.4", "95.6"],
    correct: 2,
    explanation: "In matches where India successfully completed a run chase, Kohli averages a legendary 89.4."
  },
  {
    id: 5,
    question: "How many runs did Kohli score in the 2016 IPL season?",
    options: ["840", "973", "1015", "890"],
    correct: 1,
    explanation: "Kohli scored a monumental 973 runs in 2016 with 4 centuries, an all-time tournament record."
  }
];

export default function BonusSection() {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [sectionRef, isVisible] = useIntersectionObserver(0.2);

  const handleSelect = (idx: number) => {
    if (selectedOpt !== null) return; // Prevent double click
    setSelectedOpt(idx);
    const q = QUIZ_QUESTIONS[currentQ];
    if (idx === q.correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQ < QUIZ_QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedOpt(null);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQ(0);
    setSelectedOpt(null);
    setScore(0);
    setQuizFinished(false);
  };

  const getTier = (finalScore: number) => {
    if (finalScore === 5) return { label: "KING'S INNER CIRCLE 👑", desc: "You are a true Kohli historian! Perfection." };
    if (finalScore >= 3) return { label: "DIE-HARD FAN 🔥", desc: "Impressive knowledge of the Chase Master!" };
    return { label: "CASUAL OBSERVER 🏏", desc: "Good try! Time to re-watch those classic chases." };
  };

  return (
    <section id="bonus" className="bonus-section" ref={sectionRef as React.RefObject<HTMLElement>}>
      <div className="container">
        <div className="section-header text-center">
          <p className="section-label">INTERACTIVE BONUS</p>
          <h2 className="section-title">TIMELINE & <span className="text-gold">QUIZ</span></h2>
          <p className="section-body">
            Test your knowledge of King Kohli and review the pivotal moments that defined his legendary career.
          </p>
        </div>

        <div className="bonus-layout">
          {/* Timeline Column */}
          <div className="timeline-column glass-card">
            <h3 className="column-title">Career Milestones</h3>
            <div className="timeline-list">
              {MILESTONES.map((m, idx) => (
                <div key={m.year} className={`timeline-item ${isVisible ? 'animate-in' : ''}`} style={{ transitionDelay: `${idx * 80}ms` }}>
                  <div className="timeline-badge">{m.year}</div>
                  <div className="timeline-content">
                    <h4>{m.title}</h4>
                    <p>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiz Column */}
          <div className="quiz-column glass-card">
            <h3 className="column-title">Are You Inner Circle?</h3>
            
            {!quizFinished ? (
              <div className="quiz-container">
                <div className="quiz-progress">
                  <span>Question {currentQ + 1} of {QUIZ_QUESTIONS.length}</span>
                  <span className="quiz-score-live">Score: {score}</span>
                </div>

                <h4 className="quiz-question">{QUIZ_QUESTIONS[currentQ].question}</h4>

                <div className="quiz-options">
                  {QUIZ_QUESTIONS[currentQ].options.map((opt, idx) => {
                    let optClass = 'quiz-opt-btn';
                    if (selectedOpt !== null) {
                      if (idx === QUIZ_QUESTIONS[currentQ].correct) optClass += ' correct';
                      else if (idx === selectedOpt) optClass += ' wrong';
                    }
                    return (
                      <button
                        key={idx}
                        className={optClass}
                        onClick={() => handleSelect(idx)}
                        disabled={selectedOpt !== null}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {selectedOpt !== null && (
                  <div className="explanation-box animate-in">
                    <p>{QUIZ_QUESTIONS[currentQ].explanation}</p>
                    <button className="next-btn" onClick={handleNext}>
                      {currentQ === QUIZ_QUESTIONS.length - 1 ? 'See Results' : 'Next Question →'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="quiz-results animate-in">
                <div className="results-badge">RESULTS</div>
                <div className="results-score text-gold">{score} / {QUIZ_QUESTIONS.length}</div>
                <h4 className="results-tier-label">{getTier(score).label}</h4>
                <p className="results-tier-desc">{getTier(score).desc}</p>
                <button className="reset-btn" onClick={resetQuiz}>Try Again 🔄</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
