import { it } from 'node:test';
import assert from 'node:assert/strict';
import snapshots from '../src/dashboard/comparisonSnapshots.json' with { type: 'json' };
it('all 21 comparison records carry dated source provenance and reconcilable rates', () => {
  assert.equal(Object.keys(snapshots).length, 7);
  for (const player of Object.values(snapshots)) {
    assert.match(player.source, /^https:\/\/www\.cricbuzz\.com\/profiles\//);
    assert.match(player.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.deepEqual(Object.keys(player.formats).sort(), ['ODI','T20I','Test']);
    for (const [format, s] of Object.entries(player.formats)) {
      assert.ok(s.lastMatch <= player.checkedAt);
      assert.ok(s.innings > s.notOuts && s.balls > 0);
      assert.ok(Math.abs(s.runs / (s.innings-s.notOuts)-s.battingAvg) < .02, player.source+' '+format+' average');
      assert.ok(Math.abs(s.runs / s.balls *100-s.strikeRate) < .02, player.source+' '+format+' strike rate');
    }
  }
});
