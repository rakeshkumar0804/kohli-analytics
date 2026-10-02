import {it} from 'node:test';
import assert from 'node:assert/strict';
import {fetchNextMatch} from '../src/api/cricketData.ts';
it('explicit Retry bypasses client and server caches while normal reads reuse the result',async()=>{
 const original=globalThis.fetch;let calls=0;let headers;
 globalThis.fetch=async(_,options)=>{calls++;headers=options.headers;return new Response(JSON.stringify({status:'confirmed-empty',match:null,message:'No fixture in this test',reason:'no-upcoming-fixture',fetchedAt:'2026-10-01T00:00:00Z'}),{status:200});};
 try{const now=new Date('2026-10-01T00:00:00Z');await fetchNextMatch(now);await fetchNextMatch(now);assert.equal(calls,1);await fetchNextMatch(now,{forceRefresh:true});assert.equal(calls,2);assert.equal(headers['Cache-Control'],'no-cache');}finally{globalThis.fetch=original;}
});
