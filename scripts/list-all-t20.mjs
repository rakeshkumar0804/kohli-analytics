import fs from 'node:fs';

const normMatches = JSON.parse(fs.readFileSync('./data/normalized/kohli-matches.json', 'utf8'));
const t20iNorm = normMatches.filter(m => m.format === 'T20I');
const missingMatches = JSON.parse(fs.readFileSync('./data/fixtures/missing-reference-matches.json', 'utf8'));
const t20iMiss = missingMatches.formats.T20I.missingMatches.filter(m => m.officialPlayerAppearance);

const all = [...t20iNorm.map(m => ({ matchId: m.matchId, date: m.date, opp: m.opponent, event: m.event, stage: m.stage, runs: m.innings?.[0]?.deliveries?.filter(d => d.batter === 'Virat Kohli').reduce((s, d) => s + d.batterRuns, 0) || 0 })), ...t20iMiss.map(m => ({ matchId: m.matchId, date: m.date, opp: m.opponent, event: m.event, stage: 'afg-missing', runs: m.runs }))];

all.sort((a, b) => a.date.localeCompare(b.date));

console.log('Total matches:', all.length);
all.forEach((m, idx) => {
  console.log(`${idx + 1}. [${m.matchId}] ${m.date} vs ${m.opp} (${m.event || 'Series'}) - ${m.runs} runs`);
});
