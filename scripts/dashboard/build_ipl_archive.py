"""Rebuild IPL UI data from a Cricsheet IPL JSON ZIP.
Usage: python scripts/dashboard/build_ipl_archive.py /path/to/ipl_json.zip
No changes to international archives or career reference snapshots.
"""
import sys, json, zipfile, hashlib
from pathlib import Path
from datetime import datetime, timezone
root=Path(__file__).resolve().parents[2]
path=Path(sys.argv[1]); raw=path.read_bytes(); source_hash=hashlib.sha256(raw).hexdigest()
provenance=root/'src/dashboard/iplProvenance.json'
if provenance.exists():
 expected=json.loads(provenance.read_text())['sourceHash']
 assert source_hash==expected, 'Source ZIP differs from the recorded IPL snapshot; review new coverage before replacing provenance.'
rows=[]; matches=0
with zipfile.ZipFile(path) as z:
 for filename in sorted(z.namelist()):
  if not filename.endswith('.json'):continue
  data=json.loads(z.read(filename));info=data['info']
  player=next((n for n,pid in info.get('registry',{}).get('people',{}).items() if pid=='ba607b88'),None)
  if not player:continue
  team=next((t for t,players in info.get('players',{}).items() if player in players),None)
  if not team:continue
  matches+=1
  for idx,inn in enumerate(data['innings']):
   if inn['team']!=team or inn.get('super_over'):continue
   deliveries=[d for o in inn['overs'] for d in o['deliveries']]
   if not any(d['batter']==player or d['non_striker']==player for d in deliveries):continue
   runs=balls=fours=sixes=dots=outs=teamruns=teamouts=0;progress=[];bowlers={};dismissal='not out'
   phases={p:{'runs':0,'balls':0,'fours':0,'sixes':0,'dots':0} for p in ['Powerplay','Middle','Death']}
   for over in inn['overs']:
    involved=False
    for d in over['deliveries']:
     teamruns+=d['runs']['total'];teamouts+=sum(w['kind'] not in ['retired hurt','retired not out'] for w in d.get('wickets',[]))
     if d['batter']==player:
      involved=True;b=d['runs']['batter'];valid=int(not d.get('extras',{}).get('wides'));four=int(b==4 and not d['runs'].get('non_boundary'));six=int(b==6 and not d['runs'].get('non_boundary'));dot=int(valid and b==0)
      runs+=b;balls+=valid;fours+=four;sixes+=six;dots+=dot
      stat=bowlers.setdefault(d['bowler'],{'name':d['bowler'],'runs':0,'balls':0,'outs':0,'dots':0,'fours':0,'sixes':0})
      phase=phases['Powerplay' if over['over']<6 else 'Middle' if over['over']<15 else 'Death']
      for key,value in [('runs',b),('balls',valid),('dots',dot),('fours',four),('sixes',six)]:stat[key]+=value;phase[key]+=value
     for w in d.get('wickets',[]):
      if w['player_out']==player and w['kind'] not in ['retired hurt','retired not out']:
       outs=1;dismissal=w['kind'];involved=True
       if d['batter']==player and w['kind'] not in ['run out','retired out','obstructing the field']:bowlers[d['bowler']]['outs']+=1
    if involved:progress.append({'over':over['over']+1,'runs':runs,'balls':balls,'teamRuns':teamruns,'wickets':teamouts})
   outcome=info.get('outcome',{});result='won' if outcome.get('winner')==team else 'lost' if outcome.get('winner') else outcome.get('result','no result')
   event=info.get('event',{});opponent=next(t for t in info['teams'] if t!=team)
   rows.append({'id':Path(filename).stem,'date':str(info['dates'][0]),'format':'IPL','opponent':opponent,'venue':info['venue'],'event':event.get('name','Indian Premier League'),'stage':str(event.get('stage','league')),'innings':idx+1,'runs':runs,'balls':balls,'notOut':not outs,'fours':fours,'sixes':sixes,'dots':dots,'dismissal':dismissal,'result':result,'target':inn.get('target',{}).get('runs'),'playerOfMatch':player in info.get('player_of_match',[]),'progress':progress,'bowlers':list(bowlers.values()),'phases':phases})
rows.sort(key=lambda r:r['date'],reverse=True)
assert rows and len({r['id'] for r in rows})==len(rows)
aggregate={}
for row in rows:
 assert row['progress'][-1]['runs']==row['runs'] and row['progress'][-1]['balls']==row['balls']
 for b in row['bowlers']:
  item=aggregate.setdefault(b['name'],{'name':b['name'],**{k:0 for k in ['runs','balls','outs','dots','fours','sixes']}})
  for k in ['runs','balls','outs','dots','fours','sixes']:item[k]+=b[k]
metadata={'source':'Cricsheet','sourceUrl':'https://cricsheet.org/downloads/ipl_json.zip','licenseUrl':'https://cricsheet.org/license/','sourceHash':source_hash,'generatedAt':datetime.now(timezone.utc).isoformat(),'coverageStart':rows[-1]['date'],'coverageEnd':rows[0]['date'],'matches':matches,'innings':len(rows),'runs':sum(r['runs'] for r in rows),'balls':sum(r['balls'] for r in rows),'dismissals':sum(not r['notOut'] for r in rows),'excluded':'DNB appearances and super overs. Archive coverage is separate from career snapshots.'}
(root/'src/dashboard/inningsIPL.json').write_text(json.dumps({'innings':rows},separators=(',',':')))
(root/'src/dashboard/iplIndex.json').write_text(json.dumps({'metadata':metadata,'innings':[{k:v for k,v in r.items() if k not in ['progress','bowlers']} for r in rows],'matchups':list(aggregate.values())},separators=(',',':')))
print(json.dumps(metadata,indent=2))
print('2016 runs:',sum(r['runs'] for r in rows if r['date'].startswith('2016')))

(root/'src/dashboard/iplProvenance.json').write_text(json.dumps(metadata,indent=2)+'\n')
