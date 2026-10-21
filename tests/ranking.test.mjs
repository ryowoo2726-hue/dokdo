import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createQuizServer} from '../home-server/server.mjs';
import {loadRankingQuiz,buildRankings} from '../home-server/ranking.mjs';
import {validateStudent,studentKey} from '../home-server/core.mjs';

test('nickname validation trims input and preserves the original student identity',()=>{
  const student={grade:1,classroom:2,number:3};
  assert.deepEqual(validateStudent({...student,nickname:'  독도강치  '}),{...student,nickname:'독도강치'});
  assert.equal(studentKey({...student,nickname:'푸른바다'}),studentKey(student));
  assert.deepEqual(validateStudent(student),student);
  for(const nickname of ['   ','가'.repeat(21),'줄\n바꿈',123])assert.throws(()=>validateStudent({...student,nickname}));
});

test('ranking API grades saved answers, uses gapless tied ranks, refreshes cache, filters versions, preserves restart and CORS',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'dokdo-ranking-test-'));
  const {questions,quizVersion}=loadRankingQuiz();
  let server,base;
  async function open(){server=createQuizServer({directory});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;}
  async function close(){await new Promise(r=>{server.close(r);server.closeIdleConnections();});}
  const rankings=async()=>{const r=await fetch(base+'/api/rankings',{headers:{Origin:'https://dokdo.sangsangbar.com'}});assert.equal(r.status,200);assert.equal(r.headers.get('access-control-allow-origin'),'https://dokdo.sangsangbar.com');return r.json();};
  const submit=async(number,correct,version=quizVersion)=>{
    const answers=Object.fromEntries(questions.map((q,i)=>[q.id,i<correct?q.answer:(q.answer+1)%q.options.length]));
    const student={grade:1,classroom:1,number};
    if(number!==1)student.nickname=`독도강치${number}`;
    const r=await fetch(base+'/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:randomUUID(),quizVersion:version,student,started:Date.now(),answers})});assert.equal(r.status,200);
  };
  try{
    await open();assert.deepEqual(await rankings(),{participants:0,rankings:[]});
    await submit(1,9);await submit(2,10);await submit(3,10);await submit(4,10,'ffffffffffffffff');await submit(5,0);
    const data=await rankings();assert.equal(data.participants,4);
    assert.deepEqual(data.rankings.map(e=>[e.rank,e.score,e.student.number]),[[1,100,2],[1,100,3],[2,90,1],[3,0,5]]);
    assert.equal(data.rankings[0].student.nickname,'독도강치2');
    assert.equal(data.rankings[2].student.nickname,undefined);
    assert.deepEqual(Object.keys(data.rankings[0]).sort(),['rank','score','student']);
    assert.equal((await fetch(base+'/api/rankings',{headers:{Origin:'https://untrusted.example'}})).status,403);
    assert.equal((await fetch(base+'/api/rankings',{method:'POST'})).status,405);
    await close();await open();assert.deepEqual(await rankings(),data);
  }finally{if(server?.listening)await close();rmSync(directory,{recursive:true,force:true});}
});

test('three first-place and four second-place students leave no gaps in later ranks',()=>{
  const quiz=loadRankingQuiz();
  const rows=[10,10,10,9,9,9,9,8,0,0].map((correct,i)=>({received:new Date(1760000000000+i).toISOString(),payload:JSON.stringify({quizVersion:quiz.quizVersion,student:{grade:1,classroom:1,number:i+1},answers:Object.fromEntries(quiz.questions.map((q,j)=>[q.id,j<correct?q.answer:(q.answer+1)%q.options.length]))})}));
  const ranking=buildRankings(rows,quiz);
  assert.deepEqual(ranking.map(e=>e.rank),[1,1,1,2,2,2,2,3,4,4]);
  assert.deepEqual(ranking.map(e=>e.score),[100,100,100,90,90,90,90,80,0,0]);
});
