import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createQuizServer} from '../home-server/server.mjs';
import {savedReceipt} from '../home-server/core.mjs';
import {gradeQuiz} from '../public/js/quiz.mjs';
const questions=JSON.parse(readFileSync(new URL('../public/data/questions.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
const quizVersion='0123456789abcdef';

test('500 students, 300 concurrent submits, duplicate races, retry, restart, migration, CORS',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'dokdo-test-'));
 let server,base;
 async function open(){server=createQuizServer({directory});await new Promise(r=>server.listen({port:0,host:'127.0.0.1',backlog:2048},r));base=`http://127.0.0.1:${server.address().port}`;}
 async function close(){await new Promise(r=>{server.close(r);server.closeIdleConnections();});}
 const student=n=>({grade:1,classroom:Math.floor(n/50)+1,number:n%50+1});
 const payload=n=>({id:randomUUID(),quizVersion,student:student(n),started:Date.now(),answers:Object.fromEntries(questions.map(q=>[q.id,q.answer]))});
 let retries=0;
 const post=async(path,body,origin='https://dokdo.sangsangbar.com')=>{for(let attempt=0;attempt<3;attempt++){try{return await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});}catch(e){if(attempt===2)throw e;retries++;await new Promise(r=>setTimeout(r,(attempt+1)*500+Math.random()*1000));}}};
 try{
  await open();
  let r=await post('/api/start',student(0));assert.equal(r.status,200);
  assert.equal(r.headers.get('access-control-allow-origin'),'https://dokdo.sangsangbar.com');
  assert.deepEqual(await r.json(),{eligible:true});
  assert.equal((await fetch(base+'/api/questions')).status,404);
  assert.equal((await fetch(base+'/questions.json')).status,404);
  r=await fetch(base+'/api/submit',{method:'OPTIONS',headers:{Origin:'https://dokdo.sangsangbar.com','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});assert.equal(r.status,204);
  assert.equal((await post('/api/start',student(0),'https://untrusted.example')).status,403);
  assert.equal((await post('/api/start',student(0),'https://maseok-dokdo.pages.dev')).status,200);
  assert.equal((await post('/api/start',{grade:0,classroom:1,number:1})).status,400);
  console.log('CORS and validation passed');
  const entries=Array.from({length:500},(_,i)=>payload(i));
  const started=performance.now();
  const settled=await Promise.allSettled(entries.slice(0,300).map(p=>post('/api/submit',p)));console.log('completed',settled.filter(x=>x.status==='fulfilled').length,'network retries',retries); const responses=settled.map(x=>{if(x.status==='rejected')throw x.reason;return x.value;});
  for(const response of responses){assert.equal(response.status,200);assert.deepEqual(Object.keys(await response.json()).sort(),['receipt','saved','storage']);}
  console.log(`300 simultaneous local submissions: ${Math.round(performance.now()-started)} ms`);
  for(const response of await Promise.all(entries.slice(300).map(p=>post('/api/submit',p))))assert.equal(response.status,200);
  assert.equal((await post('/api/start',student(0))).status,409);
  assert.equal((await post('/api/submit',payload(0))).status,409);
  r=await post('/api/submit',entries[0]);assert.equal(r.status,200);assert.equal((await r.json()).receipt,entries[0].id);
  const races=await Promise.all(Array.from({length:30},()=>post('/api/submit',payload(500))));
  assert.equal(races.filter(r=>r.status===200).length,1);assert.equal(races.filter(r=>r.status===409).length,29);
  await close();
  const db=new DatabaseSync(join(directory,'responses.sqlite'));
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM responses').get().n,501);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM participants').get().n,501);
  const stored=JSON.parse(db.prepare('SELECT payload FROM responses WHERE id=?').get(entries[0].id).payload);
  assert.deepEqual(stored,entries[0]);
  assert.equal('score' in stored,false);
  const old=payload(501);db.prepare('INSERT INTO responses VALUES(?,?,?,?)').run(old.id,new Date().toISOString(),JSON.stringify(old),JSON.stringify(savedReceipt(old)));db.close();
  execFileSync(process.execPath,[fileURLToPath(new URL('../home-server/export.mjs',import.meta.url))],{env:{...process.env,DOKDO_DATA_DIR:directory}});
  const csv=readFileSync(join(directory,'exports',readdirSync(join(directory,'exports'))[0]),'utf8');
  assert.equal(csv.includes('점수'),false);assert.ok(csv.includes('문제 버전'));assert.equal(csv.split('\r\n').length,503);
  await open();assert.equal((await post('/api/start',student(501))).status,409);
  assert.equal((await post('/api/start',student(0))).status,409);
  assert.equal((await post('/api/submit',entries[0])).status,200);
 }finally{if(server?.listening)await close();rmSync(directory,{recursive:true,force:true});}
});

test('browser grading uses public answers for full, partial and zero scores',()=>{
 const answers=Object.fromEntries(questions.map(q=>[q.id,q.answer]));
 assert.equal(gradeQuiz(questions,answers,30).score,100);
 answers[questions[0].id]=(questions[0].answer+1)%questions[0].options.length;
 const partial=gradeQuiz(questions,answers,30);assert.equal(partial.score,90);assert.equal(partial.details[0].correct,false);
 for(const q of questions)answers[q.id]=(q.answer+1)%q.options.length;
 assert.equal(gradeQuiz(questions,answers,30).score,0);
});
