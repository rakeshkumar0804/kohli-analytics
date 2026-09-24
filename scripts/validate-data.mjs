import { opponentData, careerStats, famousChases, heroStatsByFormat, allFormatCareerStats, u19CareerStats } from '../src/data/kohliData.ts';
import { DEFINING_INNINGS_DATA } from '../src/data/definingInningsData.ts';
import { DATA_VERIFIED_ON, STRUCTURAL_VALIDATION_DISCLAIMER, DATA_PROVENANCE_MANIFEST } from '../src/data/dataSources.ts';
import { calculateClutchIndex } from '../src/utils/calculateClutchIndex.ts';

let errors = [];

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function isNonNegativeInteger(val) {
  return typeof val === 'number' && Number.isInteger(val) && val >= 0;
}

console.log('🔍 Running Data Integrity Validation Suite...\n');
console.log(`ℹ️ Disclaimer: ${STRUCTURAL_VALIDATION_DISCLAIMER}`);
console.log(`ℹ️ Note: This suite proves repository structural and arithmetic consistency, not independent historical truth.\n`);

// 1. Data Provenance Manifest Check
console.log('--- Checking Data Provenance Manifest & Dates ---');
assert(typeof DATA_VERIFIED_ON === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(DATA_VERIFIED_ON), `Invalid or missing DATA_VERIFIED_ON date format: ${DATA_VERIFIED_ON}`);
assert(DATA_PROVENANCE_MANIFEST.length === 13, `DATA_PROVENANCE_MANIFEST should contain 13 dataset entries, got ${DATA_PROVENANCE_MANIFEST.length}`);

const validClassifications = new Set(['official-source', 'reference-aggregate', 'scorecard-derived', 'editorial', 'experimental']);

DATA_PROVENANCE_MANIFEST.forEach((entry) => {
  if (entry.sourceUrl !== null) {
    assert(typeof entry.sourceUrl === 'string' && entry.sourceUrl.startsWith('https://'), `[Manifest: ${entry.datasetKey}] Invalid or missing HTTPS source URL: ${entry.sourceUrl}`);
  } else {
    assert(Boolean(entry.referenceLandingPage) || entry.verificationStatus === 'experimental' || entry.verificationStatus === 'pending-source' || entry.verificationStatus === 'partially-verified', `[Manifest: ${entry.datasetKey}] Null sourceUrl requires referenceLandingPage or pending/experimental/partially-verified status`);
  }
  assert(validClassifications.has(entry.classification), `[Manifest: ${entry.datasetKey}] Invalid classification: ${entry.classification}`);
  assert(entry.verifiedOnDate === DATA_VERIFIED_ON, `[Manifest: ${entry.datasetKey}] verifiedOnDate must match global audit date ${DATA_VERIFIED_ON}`);

  if (entry.statsThroughDate !== null) {
    assert(/^\d{4}-\d{2}-\d{2}$/.test(entry.statsThroughDate), `[Manifest: ${entry.datasetKey}] Invalid statsThroughDate format: ${entry.statsThroughDate}`);
    assert(entry.statsThroughDate <= entry.verifiedOnDate, `[Manifest: ${entry.datasetKey}] statsThroughDate (${entry.statsThroughDate}) cannot be after verifiedOnDate (${entry.verifiedOnDate})`);
  }
  
  if (entry.datasetKey.includes('Clutch') || entry.datasetKey.includes('Pressure')) {
    assert(entry.classification === 'experimental', `[Manifest: ${entry.datasetKey}] Experimental metric must be classified as 'experimental'`);
  }
});

// 2. Opponent Data Invariants & Reconciled Rows Check
console.log('--- Checking Opponent Dominance Data ---');
const expectedOpponents = {
  Australia: { matches: 106, innings: 126, notOuts: 12, dismissals: 114, runs: 5551, avg: 48.69, centuries: 17, fifties: 29, highScore: '186' },
  Bangladesh: { matches: 31, innings: 36, notOuts: 9, dismissals: 27, runs: 1698, avg: 62.88, centuries: 7, fifties: 5, highScore: '204' },
  England: { matches: 90, innings: 112, notOuts: 11, dismissals: 101, runs: 4180, avg: 41.38, centuries: 8, fifties: 26, highScore: '235' },
  'New Zealand': { matches: 60, innings: 73, notOuts: 6, dismissals: 67, runs: 3167, avg: 47.26, centuries: 10, fifties: 16, highScore: '211' },
  Pakistan: { matches: 28, innings: 28, notOuts: 8, dismissals: 20, runs: 1270, avg: 63.50, centuries: 4, fifties: 7, highScore: '183' },
  'South Africa': { matches: 64, innings: 73, notOuts: 12, dismissals: 61, runs: 3608, avg: 59.14, centuries: 10, fifties: 17, highScore: '254*' },
  'Sri Lanka': { matches: 75, innings: 79, notOuts: 14, dismissals: 65, runs: 4076, avg: 62.70, centuries: 15, fifties: 18, highScore: '243' },
  'West Indies': { matches: 73, innings: 75, notOuts: 10, dismissals: 65, runs: 3850, avg: 59.23, centuries: 12, fifties: 23, highScore: '200' },
  Zimbabwe: { matches: 11, innings: 8, notOuts: 2, dismissals: 6, runs: 305, avg: 50.83, centuries: 1, fifties: 1, highScore: '115*' },
};

assert(opponentData.length === 9, `opponentData must contain exactly 9 countries, got ${opponentData.length}`);

opponentData.forEach((opp) => {
  const exp = expectedOpponents[opp.country];
  assert(exp !== undefined, `Unexpected opponent country: ${opp.country}`);
  if (exp) {
    assert(opp.matches === exp.matches, `[Opponent: ${opp.country}] matches expected ${exp.matches}, got ${opp.matches}`);
    assert(opp.innings === exp.innings, `[Opponent: ${opp.country}] innings expected ${exp.innings}, got ${opp.innings}`);
    assert(opp.notOuts === exp.notOuts, `[Opponent: ${opp.country}] notOuts expected ${exp.notOuts}, got ${opp.notOuts}`);
    assert(opp.dismissals === exp.dismissals, `[Opponent: ${opp.country}] dismissals expected ${exp.dismissals}, got ${opp.dismissals}`);
    assert(opp.runs === exp.runs, `[Opponent: ${opp.country}] runs expected ${exp.runs}, got ${opp.runs}`);
    assert(opp.centuries === exp.centuries, `[Opponent: ${opp.country}] centuries expected ${exp.centuries}, got ${opp.centuries}`);
    assert(opp.fifties === exp.fifties, `[Opponent: ${opp.country}] fifties expected ${exp.fifties}, got ${opp.fifties}`);
    assert(String(opp.highScore) === String(exp.highScore), `[Opponent: ${opp.country}] highScore expected ${exp.highScore}, got ${opp.highScore}`);
    
    const dismissalsCalc = opp.innings - opp.notOuts;
    assert(opp.dismissals === dismissalsCalc, `[Opponent: ${opp.country}] dismissals mismatch! Stored ${opp.dismissals}, calculated ${dismissalsCalc}`);
    const calcAvg = opp.runs / opp.dismissals;
    assert(Math.abs(calcAvg - opp.avg) < 0.05, `[Opponent: ${opp.country}] Average mismatch! Stored: ${opp.avg}, Calculated: ${calcAvg.toFixed(2)} (${opp.runs}/${opp.dismissals})`);
  }
});

// 3. Senior International Career Stats Arithmetic Check
console.log('--- Checking Senior International Career Statistics ---');
['odi', 'test', 't20i', 'ipl'].forEach((fmtKey) => {
  const stat = careerStats[fmtKey];
  assert(isNonNegativeInteger(stat.matches), `[Career: ${fmtKey}] matches must be a non-negative integer, got ${stat.matches}`);
  assert(isNonNegativeInteger(stat.innings), `[Career: ${fmtKey}] innings must be a non-negative integer, got ${stat.innings}`);
  assert(isNonNegativeInteger(stat.notOuts), `[Career: ${fmtKey}] notOuts must be a non-negative integer, got ${stat.notOuts}`);
  assert(stat.notOuts <= stat.innings, `[Career: ${fmtKey}] notOuts (${stat.notOuts}) cannot exceed innings (${stat.innings})`);
  
  const dismissals = stat.innings - stat.notOuts;
  assert(dismissals === stat.dismissals, `[Career: ${fmtKey}] dismissals mismatch: calculated ${dismissals}, stored ${stat.dismissals}`);
  if (dismissals > 0) {
    const calcAvg = stat.runs / dismissals;
    assert(Math.abs(calcAvg - stat.average) < 0.1, `[Career: ${fmtKey}] Average mismatch! Stored: ${stat.average}, Calculated: ${calcAvg.toFixed(2)} (${stat.runs}/${dismissals})`);
  }
});

// 3b. Exact per-format component value assertions (read from actual UI data)
console.log('--- Checking Exact Per-Format Component Values ---');
// Test
assert(careerStats.test.matches === 123, `Test matches expected 123, got ${careerStats.test.matches}`);
assert(careerStats.test.innings === 210, `Test innings expected 210, got ${careerStats.test.innings}`);
assert(careerStats.test.notOuts === 13, `Test notOuts expected 13, got ${careerStats.test.notOuts}`);
assert(careerStats.test.runs === 9230, `Test runs expected 9230, got ${careerStats.test.runs}`);
assert(careerStats.test.centuries === 30, `Test centuries expected 30, got ${careerStats.test.centuries}`);
assert(careerStats.test.fifties === 31, `Test fifties expected 31, got ${careerStats.test.fifties}`);
assert(careerStats.test.ducks === 15, `Test ducks expected 15, got ${careerStats.test.ducks}`);
assert(careerStats.test.fours === 1027, `Test fours expected 1027, got ${careerStats.test.fours}`);
assert(careerStats.test.sixes === 30, `Test sixes expected 30, got ${careerStats.test.sixes}`);
assert(careerStats.test.catches === 121, `Test catches expected 121, got ${careerStats.test.catches}`);
assert(careerStats.test.ballsFaced === 16608, `Test ballsFaced expected 16608, got ${careerStats.test.ballsFaced}`);
// ODI
assert(careerStats.odi.matches === 314, `ODI matches expected 314, got ${careerStats.odi.matches}`);
assert(careerStats.odi.innings === 302, `ODI innings expected 302, got ${careerStats.odi.innings}`);
assert(careerStats.odi.notOuts === 47, `ODI notOuts expected 47, got ${careerStats.odi.notOuts}`);
assert(careerStats.odi.runs === 14941, `ODI runs expected 14941, got ${careerStats.odi.runs}`);
assert(careerStats.odi.centuries === 54, `ODI centuries expected 54, got ${careerStats.odi.centuries}`);
assert(careerStats.odi.fifties === 79, `ODI fifties expected 79, got ${careerStats.odi.fifties}`);
assert(careerStats.odi.ducks === 18, `ODI ducks expected 18, got ${careerStats.odi.ducks}`);
assert(careerStats.odi.fours === 1389, `ODI fours expected 1389, got ${careerStats.odi.fours}`);
assert(careerStats.odi.sixes === 171, `ODI sixes expected 171, got ${careerStats.odi.sixes}`);
assert(careerStats.odi.catches === 169, `ODI catches expected 169, got ${careerStats.odi.catches}`);
assert(careerStats.odi.ballsFaced === 15903, `ODI ballsFaced expected 15903, got ${careerStats.odi.ballsFaced}`);
// T20I
assert(careerStats.t20i.matches === 125, `T20I matches expected 125, got ${careerStats.t20i.matches}`);
assert(careerStats.t20i.innings === 117, `T20I innings expected 117, got ${careerStats.t20i.innings}`);
assert(careerStats.t20i.notOuts === 31, `T20I notOuts expected 31, got ${careerStats.t20i.notOuts}`);
assert(careerStats.t20i.runs === 4188, `T20I runs expected 4188, got ${careerStats.t20i.runs}`);
assert(careerStats.t20i.centuries === 1, `T20I centuries expected 1, got ${careerStats.t20i.centuries}`);
assert(careerStats.t20i.fifties === 38, `T20I fifties expected 38, got ${careerStats.t20i.fifties}`);
assert(careerStats.t20i.ducks === 7, `T20I ducks expected 7, got ${careerStats.t20i.ducks}`);
assert(careerStats.t20i.fours === 369, `T20I fours expected 369, got ${careerStats.t20i.fours}`);
assert(careerStats.t20i.sixes === 124, `T20I sixes expected 124, got ${careerStats.t20i.sixes}`);
assert(careerStats.t20i.catches === 54, `T20I catches expected 54, got ${careerStats.t20i.catches}`);
assert(careerStats.t20i.ballsFaced === 3056, `T20I ballsFaced expected 3056, got ${careerStats.t20i.ballsFaced}`);

// Combined International — computed from format components above (Test + ODI + T20I only)
console.log('--- Checking Combined International Statistics (Component Sums) ---');
const combinedMatches = careerStats.test.matches + careerStats.odi.matches + careerStats.t20i.matches;
const combinedInnings = careerStats.test.innings + careerStats.odi.innings + careerStats.t20i.innings;
const combinedNotOuts = careerStats.test.notOuts + careerStats.odi.notOuts + careerStats.t20i.notOuts;
const combinedRuns = careerStats.test.runs + careerStats.odi.runs + careerStats.t20i.runs;
const combinedDismissals = combinedInnings - combinedNotOuts;
const combinedAvg = Number((combinedRuns / combinedDismissals).toFixed(2));
const combinedBallsFaced = careerStats.test.ballsFaced + careerStats.odi.ballsFaced + careerStats.t20i.ballsFaced;
const combinedCenturies = careerStats.test.centuries + careerStats.odi.centuries + careerStats.t20i.centuries;
const combinedFifties = careerStats.test.fifties + careerStats.odi.fifties + careerStats.t20i.fifties;
const combinedDucks = careerStats.test.ducks + careerStats.odi.ducks + careerStats.t20i.ducks;
const combinedFours = careerStats.test.fours + careerStats.odi.fours + careerStats.t20i.fours;
const combinedSixes = careerStats.test.sixes + careerStats.odi.sixes + careerStats.t20i.sixes;
const combinedCatches = careerStats.test.catches + careerStats.odi.catches + careerStats.t20i.catches;

// Assert component sums match expected combined totals
assert(combinedMatches === 562, `Combined matches: 123+314+125 expected 562, got ${combinedMatches}`);
assert(combinedInnings === 629, `Combined innings: 210+302+117 expected 629, got ${combinedInnings}`);
assert(combinedNotOuts === 91, `Combined notOuts: 13+47+31 expected 91, got ${combinedNotOuts}`);
assert(combinedDismissals === 538, `Combined dismissals: 629-91 expected 538, got ${combinedDismissals}`);
assert(combinedRuns === 28359, `Combined runs: 9230+14941+4188 expected 28359, got ${combinedRuns}`);
assert(combinedAvg === 52.71, `Combined average: 28359/538 expected 52.71, got ${combinedAvg}`);
assert(combinedBallsFaced === 35567, `Combined ballsFaced: 16608+15903+3056 expected 35567, got ${combinedBallsFaced}`);
assert(combinedCenturies === 85, `Combined centuries: 30+54+1 expected 85, got ${combinedCenturies}`);
assert(combinedFifties === 148, `Combined fifties: 31+79+38 expected 148, got ${combinedFifties}`);
assert(combinedDucks === 40, `Combined ducks: 15+18+7 expected 40, got ${combinedDucks}`);
assert(combinedFours === 2785, `Combined fours: 1027+1389+369 expected 2785, got ${combinedFours}`);
assert(combinedSixes === 325, `Combined sixes: 30+171+124 expected 325, got ${combinedSixes}`);
assert(combinedCatches === 344, `Combined catches: 121+169+54 expected 344, got ${combinedCatches}`);

// Assert careerStats.overall matches component sums exactly
assert(careerStats.overall.matches === combinedMatches, `overall.matches (${careerStats.overall.matches}) !== Test+ODI+T20I sum (${combinedMatches})`);
assert(careerStats.overall.innings === combinedInnings, `overall.innings (${careerStats.overall.innings}) !== Test+ODI+T20I sum (${combinedInnings})`);
assert(careerStats.overall.notOuts === combinedNotOuts, `overall.notOuts (${careerStats.overall.notOuts}) !== Test+ODI+T20I sum (${combinedNotOuts})`);
assert(careerStats.overall.dismissals === combinedDismissals, `overall.dismissals (${careerStats.overall.dismissals}) !== Test+ODI+T20I sum (${combinedDismissals})`);
assert(careerStats.overall.runs === combinedRuns, `overall.runs (${careerStats.overall.runs}) !== Test+ODI+T20I sum (${combinedRuns})`);
assert(careerStats.overall.average === combinedAvg, `overall.average (${careerStats.overall.average}) !== Test+ODI+T20I combined (${combinedAvg})`);
assert(careerStats.overall.ballsFaced === combinedBallsFaced, `overall.ballsFaced (${careerStats.overall.ballsFaced}) !== Test+ODI+T20I sum (${combinedBallsFaced})`);
assert(careerStats.overall.centuries === combinedCenturies, `overall.centuries (${careerStats.overall.centuries}) !== Test+ODI+T20I sum (${combinedCenturies})`);
assert(careerStats.overall.fifties === combinedFifties, `overall.fifties (${careerStats.overall.fifties}) !== Test+ODI+T20I sum (${combinedFifties})`);
assert(careerStats.overall.ducks === combinedDucks, `overall.ducks (${careerStats.overall.ducks}) !== Test+ODI+T20I sum (${combinedDucks})`);
assert(careerStats.overall.fours === combinedFours, `overall.fours (${careerStats.overall.fours}) !== Test+ODI+T20I sum (${combinedFours})`);
assert(careerStats.overall.sixes === combinedSixes, `overall.sixes (${careerStats.overall.sixes}) !== Test+ODI+T20I sum (${combinedSixes})`);
assert(careerStats.overall.catches === combinedCatches, `overall.catches (${careerStats.overall.catches}) !== Test+ODI+T20I sum (${combinedCatches})`);

// Verify IPL is excluded from overall
assert(careerStats.overall.matches < combinedMatches + careerStats.ipl.matches, `IPL matches must not be included in combined international totals`);

// 4. Domestic & All-Format Career Stats Check
console.log('--- Checking Domestic & All-Format Career Statistics ---');
const fcBat = allFormatCareerStats.firstClass.batting;
const listABat = allFormatCareerStats.listA.batting;
const t20Bat = allFormatCareerStats.allT20.batting;

assert(fcBat.matches === 156 && fcBat.runs === 11485 && fcBat.centuries === 37 && fcBat.fifties === 39, 'First-class batting stats mismatch');
assert((fcBat.runs / fcBat.dismissals).toFixed(2) === '48.05', `FC batting average mismatch: expected 48.05, got ${(fcBat.runs / fcBat.dismissals).toFixed(2)}`);
assert((fcBat.runs / fcBat.ballsFaced * 100).toFixed(2) === '55.95', `FC strike rate mismatch: expected 55.95`);

assert(listABat.matches === 350 && listABat.runs === 16591 && listABat.centuries === 59 && listABat.fifties === 88, 'List A batting stats mismatch');
assert(listABat.average === 57.80 && Math.abs((listABat.runs / listABat.dismissals) - listABat.average) < 0.02, `List A batting average mismatch: stored ${listABat.average}, calculated ${(listABat.runs / listABat.dismissals).toFixed(2)}`);
assert((listABat.runs / listABat.ballsFaced * 100).toFixed(2) === '94.26', `List A strike rate mismatch: expected 94.26`);

assert(t20Bat.matches === 430 && t20Bat.runs === 14218 && t20Bat.centuries === 10 && t20Bat.fifties === 110, 'All T20 batting stats mismatch');
assert((t20Bat.runs / t20Bat.dismissals).toFixed(2) === '42.44', `All T20 batting average mismatch: expected 42.44, got ${(t20Bat.runs / t20Bat.dismissals).toFixed(2)}`);
assert(t20Bat.strikeRate === 135.88 && Math.abs((t20Bat.runs / t20Bat.ballsFaced * 100) - t20Bat.strikeRate) < 0.02, `All T20 strike rate mismatch: stored ${t20Bat.strikeRate}, calculated ${(t20Bat.runs / t20Bat.ballsFaced * 100).toFixed(2)}`);

// Domestic Bowling Checks
const fcBowl = allFormatCareerStats.firstClass.bowling;
const listABowl = allFormatCareerStats.listA.bowling;
const t20Bowl = allFormatCareerStats.allT20.bowling;

assert(fcBowl.wickets === 3 && fcBowl.runsConceded === 338, 'FC bowling wickets/runs mismatch');
assert(Math.abs(fcBowl.runsConceded / fcBowl.wickets - 112.66) < 0.1, 'FC bowling average mismatch');
assert((fcBowl.runsConceded / (fcBowl.balls / 6)).toFixed(2) === '3.15', 'FC economy mismatch');

assert(listABowl.wickets === 5 && listABowl.runsConceded === 741, 'List A bowling wickets/runs mismatch');
assert((listABowl.runsConceded / listABowl.wickets).toFixed(2) === '148.20', 'List A bowling average mismatch');
assert((listABowl.runsConceded / (listABowl.balls / 6)).toFixed(2) === '6.12', 'List A economy mismatch');

assert(t20Bowl.wickets === 8 && t20Bowl.runsConceded === 667, 'All T20 bowling wickets/runs mismatch');
assert(Math.abs(t20Bowl.runsConceded / t20Bowl.wickets - 83.37) < 0.1, 'All T20 bowling average mismatch');
assert((t20Bowl.runsConceded / (t20Bowl.balls / 6)).toFixed(2) === '8.70', 'All T20 economy mismatch');

// 5. U-19 Career Stats Check
console.log('--- Checking U-19 Career Statistics (Separate Scope) ---');
assert(u19CareerStats.u19Test.matches === 12 && u19CareerStats.u19Test.runs === 932 && u19CareerStats.u19Test.average === 51.78, 'U-19 Test stats mismatch');
assert(u19CareerStats.u19ODI.matches === 28 && u19CareerStats.u19ODI.runs === 978 && u19CareerStats.u19ODI.average === 46.57, 'U-19 ODI stats mismatch');
assert(u19CareerStats.u19Test.innings === null && u19CareerStats.u19ODI.innings === null, 'U-19 unknown innings represented as null');

// 6. Famous Chase Records Check
console.log('--- Checking Famous Chase Records ---');
const chaseKeys = new Set();
famousChases.forEach((chase, idx) => {
  assert(['ODI', 'Test', 'T20I'].includes(chase.format), `[Chase #${idx + 1}] Unknown format: ${chase.format}`);
  assert(['won', 'lost', 'draw'].includes(chase.result), `[Chase #${idx + 1}] Unknown result: ${chase.result}`);
  assert(isNonNegativeInteger(chase.year) && chase.year >= 2008 && chase.year <= 2026, `[Chase #${idx + 1}] Invalid year: ${chase.year}`);
  assert(isNonNegativeInteger(chase.target), `[Chase #${idx + 1}] Target must be positive integer: ${chase.target}`);
  assert(isNonNegativeInteger(chase.kohliScore), `[Chase #${idx + 1}] Kohli score must be positive integer: ${chase.kohliScore}`);
  
  const key = `${chase.format}-${chase.year}-${chase.opponent}-${chase.venue}-${chase.kohliScore}`;
  assert(!chaseKeys.has(key), `[Chase #${idx + 1}] Duplicate chase entry detected: ${key}`);
  chaseKeys.add(key);
});

// 7. Hero Stats Alignment Check
console.log('--- Checking Hero Stats Alignment ---');
assert(heroStatsByFormat.ALL[0].value === careerStats.overall.runs, `Hero ALL runs (${heroStatsByFormat.ALL[0].value}) does not match career overall runs (${careerStats.overall.runs})`);
assert(heroStatsByFormat.ALL[1].value === careerStats.overall.centuries, `Hero ALL centuries (${heroStatsByFormat.ALL[1].value}) does not match career overall centuries (${careerStats.overall.centuries})`);
assert(heroStatsByFormat.ALL[2].value === careerStats.overall.average, `Hero ALL average (${heroStatsByFormat.ALL[2].value}) does not match career overall average (${careerStats.overall.average})`);
assert(heroStatsByFormat.Test[0].value === careerStats.test.runs, `Hero Test runs (${heroStatsByFormat.Test[0].value}) does not match career test runs (${careerStats.test.runs})`);
assert(heroStatsByFormat.Test[2].value === careerStats.test.average, `Hero Test average (${heroStatsByFormat.Test[2].value}) does not match career test average (${careerStats.test.average})`);
assert(heroStatsByFormat.ODI[0].value === careerStats.odi.runs, `Hero ODI runs (${heroStatsByFormat.ODI[0].value}) does not match career odi runs (${careerStats.odi.runs})`);
assert(heroStatsByFormat.ODI[2].value === careerStats.odi.average, `Hero ODI average (${heroStatsByFormat.ODI[2].value}) does not match career odi average (${careerStats.odi.average})`);
assert(heroStatsByFormat.T20I[0].value === careerStats.t20i.runs, `Hero T20I runs (${heroStatsByFormat.T20I[0].value}) does not match career t20i runs (${careerStats.t20i.runs})`);
assert(heroStatsByFormat.T20I[2].value === careerStats.t20i.average, `Hero T20I average (${heroStatsByFormat.T20I[2].value}) does not match career t20i average (${careerStats.t20i.average})`);

// 8. Explicit Format Division Sanity Tests
console.log('--- Checking Explicit Format Division Equations ---');
assert((9230 / (210 - 13)).toFixed(2) === '46.85', `Test avg division mismatch: expected 46.85, got ${(9230 / (210 - 13)).toFixed(2)}`);
assert((14941 / (302 - 47)).toFixed(2) === '58.59', `ODI avg division mismatch: expected 58.59, got ${(14941 / (302 - 47)).toFixed(2)}`);
assert((4188 / (117 - 31)).toFixed(2) === '48.70', `T20I avg division mismatch: expected 48.70, got ${(4188 / (117 - 31)).toFixed(2)}`);
assert((9336 / (275 - 44)).toFixed(2) === '40.42', `IPL avg division mismatch: expected 40.42, got ${(9336 / (275 - 44)).toFixed(2)}`);
assert((28359 / (629 - 91)).toFixed(2) === '52.71', `Combined International avg division mismatch: expected 52.71, got ${(28359 / (629 - 91)).toFixed(2)}`);

// 9. Clutch Index Status Test
console.log('--- Checking Clutch Index Calculation Status ---');
const clutchRes = calculateClutchIndex({ baselineAvg: 58.59, chaseAvg: 65.0, knockoutAvg: 68.4, finalsAvg: 71.2, baselineSR: 93.95, chaseSR: 93.4 });
assert(clutchRes.status === 'calibration-pending', `Clutch Index status expected 'calibration-pending', got ${clutchRes.status}`);

// 10. Selected Defining Innings Gallery Integrity & Provenance Check
console.log('--- Checking Selected Defining Innings Gallery Integrity ---');
assert(Array.isArray(DEFINING_INNINGS_DATA) && DEFINING_INNINGS_DATA.length >= 10, `DEFINING_INNINGS_DATA must contain at least 10 verified innings, found ${DEFINING_INNINGS_DATA.length}`);

const validFormats = new Set(['Test', 'ODI', 'T20I', 'IPL']);
const validImpacts = new Set(['Rescue & Recovery', 'Record Chase', 'World Milestone', 'Captaincy Masterclass', 'Knockout Heroics']);
const definingIds = new Set();

DEFINING_INNINGS_DATA.forEach((inn, idx) => {
  assert(!definingIds.has(inn.id), `[Defining Innings #${idx + 1}] Duplicate ID: ${inn.id}`);
  definingIds.add(inn.id);

  assert(validFormats.has(inn.format), `[Defining Innings: ${inn.id}] Invalid format: ${inn.format}`);
  assert(validImpacts.has(inn.impactCategory), `[Defining Innings: ${inn.id}] Invalid impact category: ${inn.impactCategory}`);
  assert(isNonNegativeInteger(inn.runs), `[Defining Innings: ${inn.id}] runs must be non-negative integer, got ${inn.runs}`);
  assert(isNonNegativeInteger(inn.ballsFaced) && inn.ballsFaced > 0, `[Defining Innings: ${inn.id}] ballsFaced must be positive integer, got ${inn.ballsFaced}`);
  assert(typeof inn.notOut === 'boolean', `[Defining Innings: ${inn.id}] notOut must be boolean`);
  assert(isNonNegativeInteger(inn.fours), `[Defining Innings: ${inn.id}] fours must be non-negative integer`);
  assert(isNonNegativeInteger(inn.sixes), `[Defining Innings: ${inn.id}] sixes must be non-negative integer`);
  assert(inn.sourceUrl.startsWith('https://'), `[Defining Innings: ${inn.id}] sourceUrl must start with https://, got ${inn.sourceUrl}`);
  assert(typeof inn.matchId === 'string' && inn.matchId.length > 0, `[Defining Innings: ${inn.id}] matchId must be valid string`);

  // Verify strike rate formula: (runs / ballsFaced) * 100
  const calcSR = (inn.runs / inn.ballsFaced) * 100;
  assert(Math.abs(calcSR - inn.strikeRate) < 0.15, `[Defining Innings: ${inn.id}] Strike rate mismatch! Stored: ${inn.strikeRate}, Calculated: ${calcSR.toFixed(2)}`);

  // Verify candidate screenshot entries and key match records
  if (inn.id === 'test-254-sa-pune-2019') {
    assert(inn.runs === 254 && inn.ballsFaced === 336 && inn.fours === 33 && inn.sixes === 2 && inn.notOut === true && inn.opponent === 'South Africa' && inn.format === 'Test', 'Candidate 254* must match verified Test score');
  }
  if (inn.id === 'test-149-eng-edgbaston-2018') {
    assert(inn.runs === 149 && inn.ballsFaced === 225 && inn.fours === 22 && inn.sixes === 1 && inn.opponent === 'England' && inn.format === 'Test', 'Candidate 149 must match verified Test score');
  }
  if (inn.id === 'test-141-aus-adelaide-2014') {
    assert(inn.runs === 141 && inn.ballsFaced === 175 && inn.fours === 16 && inn.sixes === 1 && inn.matchId === '754737' && inn.opponent === 'Australia' && inn.format === 'Test', 'Adelaide 2014 must match verified 141 (175b, 16x4, 1x6, matchId 754737)');
  }
  if (inn.id === 'test-123-aus-perth-2018') {
    assert(inn.runs === 123 && inn.ballsFaced === 257 && inn.fours === 13 && inn.sixes === 1 && inn.matchId === '1144994', 'Perth 2018 must match 123 (257b, 13x4, 1x6)');
  }
  if (inn.id === 'odi-133-sl-hobart-2012') {
    assert(inn.runs === 133 && inn.ballsFaced === 86 && inn.fours === 16 && inn.sixes === 2 && inn.notOut === true && inn.matchId === '518966', 'Hobart 2012 must match 133* (86b, 16x4, 2x6)');
  }
  if (inn.id === 'odi-183-pak-dhaka-2012') {
    assert(inn.runs === 183 && inn.ballsFaced === 148 && inn.fours === 22 && inn.sixes === 1 && inn.matchId === '535798', 'Mirpur 2012 must match 183 (148b, 22x4, 1x6)');
  }
  if (inn.id === 'odi-117-nz-mumbai-2023') {
    assert(inn.runs === 117 && inn.ballsFaced === 113 && inn.fours === 9 && inn.sixes === 2 && inn.matchId === '1384438', 'Mumbai 2023 must match 117 (113b, 9x4, 2x6)');
  }
  if (inn.id === 't20i-82-pak-mcg-2022') {
    assert(inn.runs === 82 && inn.ballsFaced === 53 && inn.fours === 6 && inn.sixes === 4 && inn.notOut === true && inn.matchId === '1298150', 'MCG 2022 must match 82* (53b, 6x4, 4x6)');
  }
  if (inn.id === 't20i-82-aus-mohali-2016') {
    assert(inn.runs === 82 && inn.ballsFaced === 51 && inn.fours === 9 && inn.sixes === 2 && inn.notOut === true && inn.matchId === '951363', 'Mohali 2016 must match 82* (51b, 9x4, 2x6)');
  }
  if (inn.id === 't20i-76-sa-barbados-2024') {
    assert(inn.runs === 76 && inn.ballsFaced === 59 && inn.fours === 6 && inn.sixes === 2 && inn.matchId === '1415755', 'Barbados 2024 must match 76 (59b, 6x4, 2x6)');
  }
  if (inn.id === 'ipl-113-kxip-bengaluru-2016') {
    assert(inn.runs === 113 && inn.ballsFaced === 50 && inn.fours === 12 && inn.sixes === 8 && inn.matchId === '980999', 'Bengaluru 2016 must match 113 (50b, 12x4, 8x6)');
  }
});

// Report Results
if (errors.length > 0) {
  console.error('\n❌ DATA INTEGRITY VALIDATION FAILED!');
  errors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`));
  process.exit(1);
} else {
  console.log('\n✅ ALL DATA INTEGRITY CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
}
