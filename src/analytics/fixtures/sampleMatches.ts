import type { RawMatchInput } from '../normalizeMatch.ts';

/**
 * Hand-checkable miniature match fixtures for testing the analytics pipeline.
 *
 * CLASSIFICATION: scorecard-inspired-partial
 * WARNING: These fixtures contain partial ball sequences created solely for unit and regression testing.
 * They must NEVER be combined or presented as Virat Kohli's genuine career statistics.
 */
export const SAMPLE_MATCH_FIXTURES: RawMatchInput[] = [
  // 1. T20 WC 2022 Chase vs Pakistan (Won Chase)
  {
    matchId: 'sample-t20-2022-ind-pak',
    date: '2022-10-23',
    format: 'T20I',
    competition: "ICC Men's T20 World Cup",
    stage: 'super-8',
    isKnockout: false,
    isFinal: false,
    venue: 'MCG, Melbourne',
    teams: ['Pakistan', 'India'],
    tossWinner: 'India',
    tossDecision: 'field',
    winner: 'India',
    resultType: 'won',
    target: 160,
    source: 'test-fixture',
    fixtureMetadata: {
      fixtureId: 'sample-t20-2022-ind-pak',
      fixtureClassification: 'scorecard-inspired-partial',
      completeness: 'partial-overs-only',
      intendedTestPurpose: 'Testing legal ball counting, wides, no-balls, byes, and death-overs RRR derivation',
      sourceUrl: 'https://stats.espncricinfo.com/ci/engine/match/1298150.html',
      warningNotForProduction: 'Partial test fixture with selected overs. Never use for career aggregates.',
    },
    innings: [
      {
        inningsNumber: 1,
        battingTeam: 'Pakistan',
        bowlingTeam: 'India',
        oversLimit: 20,
        deliveries: [
          { over: 0, ball: 1, batter: 'Babar Azam', nonStriker: 'Mohammad Rizwan', bowler: 'Bhuvneshwar Kumar', batterRuns: 0 },
          { over: 0, ball: 2, batter: 'Babar Azam', nonStriker: 'Mohammad Rizwan', bowler: 'Bhuvneshwar Kumar', batterRuns: 0, wicket: { playerDismissed: 'Babar Azam', kind: 'lbw' } },
        ],
      },
      {
        inningsNumber: 2,
        battingTeam: 'India',
        bowlingTeam: 'Pakistan',
        target: 160,
        oversLimit: 20,
        deliveries: [
          // Kohli batting in middle/death overs
          { over: 5, ball: 1, batter: 'Virat Kohli', nonStriker: 'Hardik Pandya', bowler: 'Shadab Khan', batterRuns: 1 },
          { over: 5, ball: 2, batter: 'Hardik Pandya', nonStriker: 'Virat Kohli', bowler: 'Shadab Khan', batterRuns: 1 },
          { over: 5, ball: 3, batter: 'Virat Kohli', nonStriker: 'Hardik Pandya', bowler: 'Shadab Khan', batterRuns: 4 },
          { over: 5, ball: 4, batter: 'Virat Kohli', nonStriker: 'Hardik Pandya', bowler: 'Shadab Khan', batterRuns: 0 },
          { over: 5, ball: 5, batter: 'Virat Kohli', nonStriker: 'Hardik Pandya', bowler: 'Shadab Khan', batterRuns: 2 },
          { over: 5, ball: 6, batter: 'Virat Kohli', nonStriker: 'Hardik Pandya', bowler: 'Shadab Khan', batterRuns: 1 },
          // Death over 18 (19th over)
          { over: 18, ball: 5, batter: 'Virat Kohli', nonStriker: 'Hardik Pandya', bowler: 'Haris Rauf', batterRuns: 6 },
          { over: 18, ball: 6, batter: 'Virat Kohli', nonStriker: 'Hardik Pandya', bowler: 'Haris Rauf', batterRuns: 6 },
          // Over 19 (20th over)
          { over: 19, ball: 1, batter: 'Hardik Pandya', nonStriker: 'Virat Kohli', bowler: 'Mohammad Nawaz', batterRuns: 0, wicket: { playerDismissed: 'Hardik Pandya', kind: 'caught' } },
          { over: 19, ball: 2, batter: 'Dinesh Karthik', nonStriker: 'Virat Kohli', bowler: 'Mohammad Nawaz', batterRuns: 1 },
          { over: 19, ball: 3, batter: 'Virat Kohli', nonStriker: 'Dinesh Karthik', bowler: 'Mohammad Nawaz', batterRuns: 2 },
          { over: 19, ball: 4, batter: 'Virat Kohli', nonStriker: 'Dinesh Karthik', bowler: 'Mohammad Nawaz', batterRuns: 6, extras: { noBalls: 1 } },
          { over: 19, ball: 5, batter: 'Virat Kohli', nonStriker: 'Dinesh Karthik', bowler: 'Mohammad Nawaz', batterRuns: 0, extras: { byes: 3 } },
          { over: 19, ball: 6, batter: 'Ravichandran Ashwin', nonStriker: 'Virat Kohli', bowler: 'Mohammad Nawaz', batterRuns: 1 },
        ],
      },
    ],
  },

  // 2. T20 WC 2014 Semi-Final vs South Africa (Won Knockout Chase)
  {
    matchId: 'sample-t20-2014-sf-ind-sa',
    date: '2014-04-04',
    format: 'T20I',
    competition: "ICC World Twenty20",
    stage: 'semi-final',
    isKnockout: true,
    isFinal: false,
    venue: 'Sher-e-Bangla National Stadium, Dhaka',
    teams: ['South Africa', 'India'],
    tossWinner: 'South Africa',
    tossDecision: 'bat',
    winner: 'India',
    resultType: 'won',
    target: 173,
    source: 'test-fixture',
    fixtureMetadata: {
      fixtureId: 'sample-t20-2014-sf-ind-sa',
      fixtureClassification: 'scorecard-inspired-partial',
      completeness: 'partial-overs-only',
      intendedTestPurpose: 'Testing knockout chase filtering and unbeaten batter calculations',
      sourceUrl: 'https://stats.espncricinfo.com/ci/engine/match/682963.html',
      warningNotForProduction: 'Partial test fixture. Never use for career aggregates.',
    },
    innings: [
      {
        inningsNumber: 1,
        battingTeam: 'South Africa',
        bowlingTeam: 'India',
        oversLimit: 20,
        deliveries: [
          { over: 0, ball: 1, batter: 'Hashim Amla', nonStriker: 'Quinton de Kock', bowler: 'Bhuvneshwar Kumar', batterRuns: 1 },
        ],
      },
      {
        inningsNumber: 2,
        battingTeam: 'India',
        bowlingTeam: 'South Africa',
        target: 173,
        oversLimit: 20,
        deliveries: [
          { over: 3, ball: 1, batter: 'Virat Kohli', nonStriker: 'Rohit Sharma', bowler: 'Dale Steyn', batterRuns: 4 },
          { over: 3, ball: 2, batter: 'Virat Kohli', nonStriker: 'Rohit Sharma', bowler: 'Dale Steyn', batterRuns: 4 },
          { over: 3, ball: 3, batter: 'Virat Kohli', nonStriker: 'Rohit Sharma', bowler: 'Dale Steyn', batterRuns: 1 },
          { over: 15, ball: 1, batter: 'Virat Kohli', nonStriker: 'Yuvraj Singh', bowler: 'Imran Tahir', batterRuns: 6 },
          { over: 18, ball: 1, batter: 'Virat Kohli', nonStriker: 'MS Dhoni', bowler: 'Dale Steyn', batterRuns: 4 },
        ],
      },
    ],
  },

  // 3. T20 WC 2024 Final vs South Africa (Won Batting First Final)
  {
    matchId: 'sample-t20-2024-final-ind-sa',
    date: '2024-06-29',
    format: 'T20I',
    competition: "ICC Men's T20 World Cup",
    stage: 'final',
    isKnockout: true,
    isFinal: true,
    venue: 'Kensington Oval, Bridgetown, Barbados',
    teams: ['India', 'South Africa'],
    tossWinner: 'India',
    tossDecision: 'bat',
    winner: 'India',
    resultType: 'won',
    source: 'test-fixture',
    fixtureMetadata: {
      fixtureId: 'sample-t20-2024-final-ind-sa',
      fixtureClassification: 'scorecard-inspired-partial',
      completeness: 'partial-overs-only',
      intendedTestPurpose: 'Testing finals stage filter and striker dismissal handling',
      sourceUrl: 'https://stats.espncricinfo.com/ci/engine/match/1415755.html',
      warningNotForProduction: 'Partial test fixture. Never use for career aggregates.',
    },
    innings: [
      {
        inningsNumber: 1,
        battingTeam: 'India',
        bowlingTeam: 'South Africa',
        oversLimit: 20,
        deliveries: [
          { over: 0, ball: 1, batter: 'Virat Kohli', nonStriker: 'Rohit Sharma', bowler: 'Marco Jansen', batterRuns: 4 },
          { over: 0, ball: 2, batter: 'Virat Kohli', nonStriker: 'Rohit Sharma', bowler: 'Marco Jansen', batterRuns: 4 },
          { over: 0, ball: 3, batter: 'Virat Kohli', nonStriker: 'Rohit Sharma', bowler: 'Marco Jansen', batterRuns: 0 },
          { over: 0, ball: 4, batter: 'Virat Kohli', nonStriker: 'Rohit Sharma', bowler: 'Marco Jansen', batterRuns: 4 },
          { over: 18, ball: 1, batter: 'Virat Kohli', nonStriker: 'Shivam Dube', bowler: 'Kagiso Rabada', batterRuns: 6 },
          { over: 18, ball: 5, batter: 'Virat Kohli', nonStriker: 'Shivam Dube', bowler: 'Kagiso Rabada', batterRuns: 0, wicket: { playerDismissed: 'Virat Kohli', kind: 'caught' } },
        ],
      },
    ],
  },

  // 4. Test 2014 Adelaide 4th Innings (Lost Chase)
  {
    matchId: 'sample-test-2014-adelaide-ind-aus',
    date: '2014-12-13',
    format: 'Test',
    competition: 'Border-Gavaskar Trophy',
    stage: 'bilateral',
    isKnockout: false,
    isFinal: false,
    venue: 'Adelaide Oval, Adelaide',
    teams: ['Australia', 'India'],
    tossWinner: 'Australia',
    tossDecision: 'bat',
    winner: 'Australia',
    resultType: 'lost',
    target: 364,
    source: 'test-fixture',
    fixtureMetadata: {
      fixtureId: 'sample-test-2014-adelaide-ind-aus',
      fixtureClassification: 'scorecard-inspired-partial',
      completeness: 'partial-overs-only',
      intendedTestPurpose: 'Testing 4th innings failed chase categorization',
      sourceUrl: 'https://stats.espncricinfo.com/ci/engine/match/754737.html',
      warningNotForProduction: 'Partial test fixture. Never use for career aggregates.',
    },
    innings: [
      {
        inningsNumber: 4,
        battingTeam: 'India',
        bowlingTeam: 'Australia',
        target: 364,
        deliveries: [
          { over: 25, ball: 1, batter: 'Virat Kohli', nonStriker: 'Murali Vijay', bowler: 'Nathan Lyon', batterRuns: 4 },
          { over: 68, ball: 6, batter: 'Virat Kohli', nonStriker: 'Wriddhiman Saha', bowler: 'Nathan Lyon', batterRuns: 0, wicket: { playerDismissed: 'Virat Kohli', kind: 'caught' } },
        ],
      },
    ],
  },

  // 5. ODI 2018 Visakhapatnam (Tied Chase)
  {
    matchId: 'sample-odi-2018-vizag-ind-wi',
    date: '2018-10-24',
    format: 'ODI',
    competition: 'West Indies in India ODI Series',
    stage: 'bilateral',
    isKnockout: false,
    isFinal: false,
    venue: 'ACA-VDCA Stadium, Visakhapatnam',
    teams: ['India', 'West Indies'],
    tossWinner: 'India',
    tossDecision: 'bat',
    resultType: 'tied',
    target: 322,
    source: 'test-fixture',
    fixtureMetadata: {
      fixtureId: 'sample-odi-2018-vizag-ind-wi',
      fixtureClassification: 'scorecard-inspired-partial',
      completeness: 'partial-overs-only',
      intendedTestPurpose: 'Testing tied match chase categorization',
      sourceUrl: 'https://stats.espncricinfo.com/ci/engine/match/1157755.html',
      warningNotForProduction: 'Partial test fixture. Never use for career aggregates.',
    },
    innings: [
      {
        inningsNumber: 2,
        battingTeam: 'West Indies',
        bowlingTeam: 'India',
        target: 322,
        oversLimit: 50,
        deliveries: [
          { over: 49, ball: 6, batter: 'Shai Hope', nonStriker: 'Ashley Nurse', bowler: 'Umesh Yadav', batterRuns: 4 },
        ],
      },
    ],
  },

  // 6. ODI 2014 Bristol (No-Result Chase)
  {
    matchId: 'sample-odi-2014-bristol-ind-eng',
    date: '2014-08-25',
    format: 'ODI',
    competition: 'India in England ODI Series',
    stage: 'bilateral',
    isKnockout: false,
    isFinal: false,
    venue: 'County Ground, Bristol',
    teams: ['India', 'England'],
    tossWinner: 'England',
    tossDecision: 'field',
    resultType: 'no-result',
    source: 'test-fixture',
    fixtureMetadata: {
      fixtureId: 'sample-odi-2014-bristol-ind-eng',
      fixtureClassification: 'scorecard-inspired-partial',
      completeness: 'partial-overs-only',
      intendedTestPurpose: 'Testing no-result match exclusion from completed statistics',
      sourceUrl: 'https://stats.espncricinfo.com/ci/engine/match/667721.html',
      warningNotForProduction: 'Partial test fixture. Never use for career aggregates.',
    },
    innings: [],
  },

  // 7. Test 2013 Johannesburg (Drawn 4th Innings Chase)
  {
    matchId: 'sample-test-2013-joburg-ind-sa',
    date: '2013-12-22',
    format: 'Test',
    competition: 'India in South Africa Test Series',
    stage: 'bilateral',
    isKnockout: false,
    isFinal: false,
    venue: 'Wanderers Stadium, Johannesburg',
    teams: ['South Africa', 'India'],
    tossWinner: 'India',
    tossDecision: 'bat',
    resultType: 'draw',
    target: 458,
    source: 'test-fixture',
    fixtureMetadata: {
      fixtureId: 'sample-test-2013-joburg-ind-sa',
      fixtureClassification: 'scorecard-inspired-partial',
      completeness: 'partial-overs-only',
      intendedTestPurpose: 'Testing drawn 4th innings chase handling',
      sourceUrl: 'https://stats.espncricinfo.com/ci/engine/match/648665.html',
      warningNotForProduction: 'Partial test fixture. Never use for career aggregates.',
    },
    innings: [
      {
        inningsNumber: 4,
        battingTeam: 'India',
        bowlingTeam: 'South Africa',
        target: 458,
        deliveries: [
          { over: 100, ball: 1, batter: 'Virat Kohli', nonStriker: 'Cheteshwar Pujara', bowler: 'Dale Steyn', batterRuns: 4 },
          { over: 120, ball: 5, batter: 'Virat Kohli', nonStriker: 'MS Dhoni', bowler: 'JP Duminy', batterRuns: 0, wicket: { playerDismissed: 'Virat Kohli', kind: 'caught' } },
        ],
      },
    ],
  },
];
