import fs from 'node:fs';

const normMatches = JSON.parse(fs.readFileSync('./data/normalized/kohli-matches.json', 'utf8'));
const odiMatches = normMatches.filter(m => m.format === 'ODI');

console.log('Total ODI matches in normalized:', odiMatches.length);

const matchBoundaries = [];
let totalFours = 0;
let totalSixes = 0;

for (const m of odiMatches) {
  let m4s = 0;
  let m6s = 0;
  let mRuns = 0;
  let mBalls = 0;

  for (const inn of m.innings) {
    for (const d of inn.deliveries) {
      if (d.batter === 'Virat Kohli' || d.batter === 'V Kohli') {
        mRuns += d.batterRuns;
        if (!d.extras?.wides) mBalls++;
        if (d.batterRuns === 4) m4s++;
        if (d.batterRuns === 6) m6s++;
        if (d.batterRuns > 6) {
          console.log(`[WEIRD RUNS > 6] Match ${m.matchId} (${m.date}): ${d.batterRuns} runs on delivery!`);
        }
      }
    }
  }

  totalFours += m4s;
  totalSixes += m6s;

  if (m6s > 0 || m4s > 0) {
    matchBoundaries.push({
      matchId: m.matchId,
      date: m.date,
      opponent: m.opponent,
      runs: mRuns,
      balls: mBalls,
      fours: m4s,
      sixes: m6s
    });
  }
}

console.log(`Total Ingested ODI Fours: ${totalFours}`);
console.log(`Total Ingested ODI Sixes: ${totalSixes}`);

// Check all matches where sixes were hit
console.log('\n--- ODI Matches with Sixes ---');
const sixMatches = matchBoundaries.filter(m => m.sixes > 0);
console.log(`Matches with sixes count: ${sixMatches.length}`);
console.log(JSON.stringify(sixMatches, null, 2));
