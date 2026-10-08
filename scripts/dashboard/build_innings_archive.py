"""Build the UI archive from the exact Cricsheet ZIPs in the existing manifest.
Usage: python scripts/dashboard/build_innings_archive.py /path/to/odi.zip /path/to/t20i.zip
This writes the detailed archive and a compact UI index, never career baselines.
"""
import sys,json,zipfile,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[2]
artifact=json.loads((root/'src/data/derived/kohliAnalyticsArtifact.json').read_text())
ledger=json.loads((root/'data/derived/match-level-reconciliation.json').read_text())
rows=[]
for fmt,path in zip(['ODI','T20I'],sys.argv[1:]):
 raw=Path(path).read_bytes(); expected=next(s['sha256'] for s in artifact['provenance']['sourceArchives'] if s['format']==fmt)
 assert hashlib.sha256(raw).hexdigest()==expected,'Source checksum differs from the existing snapshot'
 z=zipfile.ZipFile(path)
 for ref in [r for r in ledger if r['format']==fmt and r['batted']]:
  data=json.loads(z.read(ref['filename']));info=data['info']; player=next(n for n,pid in info['registry']['people'].items() if pid=='ba607b88')
  for idx,inn in enumerate(data['innings']):
   if inn['team']!='India' or inn.get('super_over'):continue
   deliveries=[d for o in inn['overs'] for d in o['deliveries']]
   if not any(d['batter']==player or d['non_striker']==player for d in deliveries):continue
   runs=balls=fours=sixes=dots=outs=teamruns=teamouts=0;progress=[];bowlers={};dismissal='not out'
   for over in inn['overs']:
    involved=False
    for d in over['deliveries']:
     teamruns+=d['runs']['total'];teamouts+=len([w for w in d.get('wickets',[]) if w['kind']!='retired hurt'])
     if d['batter']==player:
      involved=True;b=d['runs']['batter'];valid=0 if d.get('extras',{}).get('wides',0)>0 else 1
      runs+=b;balls+=valid;fours+=int(b==4 and not d['runs'].get('non_boundary'));sixes+=int(b==6 and not d['runs'].get('non_boundary'));dots+=int(valid and b==0)
      stat=bowlers.setdefault(d['bowler'],{'name':d['bowler'],'runs':0,'balls':0,'outs':0,'dots':0,'fours':0,'sixes':0})
      stat['runs']+=b;stat['balls']+=valid;stat['dots']+=int(valid and b==0);stat['fours']+=int(b==4 and not d['runs'].get('non_boundary'));stat['sixes']+=int(b==6 and not d['runs'].get('non_boundary'))
     for w in d.get('wickets',[]):
      if w['player_out']==player and w['kind'] not in ['retired hurt','obstructing the field','retired not out']:
       outs=1;dismissal=w['kind'];involved=True
       if d['batter']==player and w['kind'] not in ['run out','retired out']:bowlers[d['bowler']]['outs']+=1
    if involved:progress.append({'over':over['over']+1,'runs':runs,'balls':balls,'teamRuns':teamruns,'wickets':teamouts})
   outcome=info.get('outcome',{});result='won' if outcome.get('winner')=='India' else 'lost' if outcome.get('winner') else outcome.get('result','no result')
   rows.append({'id':ref['matchId'],'date':info['dates'][0],'format':fmt,'opponent':ref['opponent'],'venue':info['venue'],'event':ref['event'],'stage':ref['stage'],'innings':idx+1,'runs':runs,'balls':balls,'notOut':outs==0,'fours':fours,'sixes':sixes,'dots':dots,'dismissal':dismissal,'result':result,'target':inn.get('target',{}).get('runs'),'playerOfMatch':player in info.get('player_of_match',[]),'progress':progress,'bowlers':list(bowlers.values())})
for fmt in ['ODI','T20I']:
 rr=[r for r in rows if r['format']==fmt];actual={'inningsBatted':len(rr),'runs':sum(r['runs'] for r in rr),'ballsFaced':sum(r['balls'] for r in rr),'dismissals':sum(not r['notOut'] for r in rr),'fours':sum(r['fours'] for r in rr),'sixes':sum(r['sixes'] for r in rr)}
 expected={k:artifact['formats'][fmt][k] for k in actual};print(fmt,actual);assert actual==expected,(actual,expected)
assert len(rows)==415
out={'source':'Cricsheet','archiveEnd':artifact['coverage']['coverageEnd'],'sourceHashes':{s['format']:s['sha256'] for s in artifact['provenance']['sourceArchives']},'innings':sorted(rows,key=lambda r:r['date'],reverse=True)}
for fmt in ['ODI','T20I']:
 (root/f'src/dashboard/innings{fmt}.json').write_text(json.dumps({'innings':[r for r in out['innings'] if r['format']==fmt]},separators=(',',':')))
print('Wrote',len(rows),'reconciled batting innings')

matchups={}
for fmt in ['ODI','T20I']:
 aggregate={}
 for row in rows:
  if row['format']!=fmt:continue
  for b in row['bowlers']:
   item=aggregate.setdefault(b['name'],{'name':b['name'],**{key:0 for key in ['runs','balls','outs','dots','fours','sixes']}})
   for key in ['runs','balls','outs','dots','fours','sixes']:item[key]+=b[key]
 matchups[fmt]=list(aggregate.values())
index={**out,'innings':[{k:v for k,v in r.items() if k not in ['progress','bowlers']} for r in out['innings']],'matchups':matchups}
(root/'src/dashboard/inningsIndex.json').write_text(json.dumps(index,separators=(',',':')))
