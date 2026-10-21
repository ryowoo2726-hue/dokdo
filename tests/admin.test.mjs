import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import http from 'node:http';
import {createQuizServer} from '../home-server/server.mjs';
import {createAdminServer} from '../home-server/admin.mjs';
import {loadRankingQuiz} from '../home-server/ranking.mjs';
import {attachSubmissionLog,printSummary,formatSubmission} from '../home-server/monitor.mjs';

test('local manager refreshes saved responses, logs each save once and restricts shutdown controls',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'dokdo-admin-test-'));
 const api=createQuizServer({directory});const lines=[];attachSubmissionLog(api,line=>lines.push(line));
 await new Promise(r=>api.listen(0,'127.0.0.1',r));const apiBase=`http://127.0.0.1:${api.address().port}`;
 let refreshed=0,stopped=0;
 const admin=createAdminServer({getSnapshot:()=>({...api.getMonitorSnapshot(),tunnel:'connected'}),onRefresh:()=>{refreshed++;printSummary(api,line=>lines.push(line));},onStop:()=>stopped++});
 await new Promise(r=>admin.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${admin.address().port}`;
 try{
  const html=await (await fetch(base)).text(),token=html.match(/const token='([a-f0-9]+)'/)[1];
  const headers={'X-Admin-Token':token};
  assert.equal((await fetch(base+'/status')).status,403);
  assert.equal((await fetch(base+'/stop',{method:'POST'})).status,403);
  assert.equal((await fetch(base+'/stop',{method:'POST',headers:{...headers,Origin:'https://untrusted.example'}})).status,403);
  const badHost=await new Promise((resolve,reject)=>{http.get(base+'/status',{headers:{...headers,Host:'untrusted.example'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject);});
  assert.equal(badHost,403);
  assert.equal((await fetch(apiBase+'/admin')).status,404);
  assert.equal((await fetch(apiBase+'/stop',{method:'POST'})).status,404);
  const {questions,quizVersion}=loadRankingQuiz();
  const payload={id:randomUUID(),quizVersion,student:{grade:1,classroom:2,number:3,nickname:'독도강치'},started:Date.now(),answers:Object.fromEntries(questions.map(q=>[q.id,q.answer]))};
  const submit=()=>fetch(apiBase+'/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  assert.equal((await submit()).status,200);assert.equal((await submit()).status,200);
  assert.equal(lines.length,1);assert.match(lines[0],/1학년 2반 3번.*독도강치.*누적 1명/);
  let snapshot=await (await fetch(base+'/status',{headers})).json();assert.equal(snapshot.total,1);assert.equal(snapshot.recent[0].student.nickname,'독도강치');assert.equal('answers' in snapshot.recent[0],false);
  assert.equal((await fetch(base+'/refresh',{method:'POST',headers})).status,200);assert.equal(refreshed,1);assert.ok(lines.some(l=>l.includes('현황 새로고침')));
  assert.equal((await fetch(base+'/stop',{method:'POST',headers})).status,200);await delay(250);assert.equal(stopped,1);
  assert.equal(formatSubmission({student:{grade:1,classroom:1,number:1,nickname:'강치\x1b[2J'},received:new Date().toISOString(),total:1}).includes('\x1b'),false);
 }finally{
  await new Promise(r=>{admin.close(r);admin.closeIdleConnections();});
  await new Promise(r=>{api.close(r);api.closeIdleConnections();});
  rmSync(directory,{recursive:true,force:true});
 }
});
