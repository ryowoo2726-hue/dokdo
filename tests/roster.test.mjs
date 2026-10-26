import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {loadRoster} from '../home-server/roster.mjs';
import {createQuizServer} from '../home-server/server.mjs';
import {loadRankingQuiz} from '../home-server/ranking.mjs';

test('server resolves roster names, rejects unknown/blank entries and survives duplicate retries/restarts',async()=>{
  const roster=loadRoster();
  assert.equal(roster.get('1-1-1'),'가상학생가');
  assert.equal(roster.get('1-1-28'),'TEST STUDENT');
  assert.equal(roster.get('2-2-3'),'가상학생아');
  assert.equal(roster.get('2-2-4'),'가상학생자');
  assert.equal(roster.get('3-12-29'),'가상학생차');
  assert.equal(roster.has('3-12-30'),false);
  assert.ok([...roster.keys()].some(key=>key.startsWith('2-')));
  const directory=mkdtempSync(join(tmpdir(),'dokdo-roster-'));
  const student={grade:1,classroom:1,number:1,name:'위조된 이름'};
  const quiz=loadRankingQuiz();
  const payload={id:randomUUID(),quizVersion:quiz.quizVersion,student,started:Date.now(),answers:Object.fromEntries(quiz.questions.map(q=>[q.id,q.answer]))};
  let server,base;
  async function open(){server=createQuizServer({directory});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;}
  async function close(){await new Promise(r=>{server.close(r);server.closeIdleConnections();});}
  const post=(path,body)=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    await open();
    const start=await post('/api/start',student);
    assert.equal(start.status,200);
    assert.deepEqual(await start.json(),{eligible:true,participated:false,student:{grade:1,classroom:1,number:1,name:'가상학생가'}});
    for(const unknown of [{grade:1,classroom:30,number:1},{grade:3,classroom:12,number:30}]){
      assert.equal((await post('/api/start',unknown)).status,400);
      assert.equal((await post('/api/submit',{...payload,id:randomUUID(),student:unknown})).status,400);
    }
    assert.equal((await post('/api/submit',payload)).status,200);
    assert.equal((await post('/api/submit',payload)).status,200);
    assert.equal((await post('/api/submit',{...payload,id:randomUUID()})).status,409);
    await close();await open();
    const duplicate=await post('/api/start',student);
    assert.equal(duplicate.status,409);
    const duplicateResult=await duplicate.json();
    assert.match(duplicateResult.error,/이미 참여/);
    assert.equal(duplicateResult.eligible,false);
    assert.equal(duplicateResult.participated,true);
    assert.equal(duplicateResult.student.name,'가상학생가');
    const ranking=await (await fetch(base+'/api/rankings')).json();
    assert.equal(ranking.participants,1);
    assert.equal(ranking.rankings[0].student.name,'가상학생가');
  }finally{if(server?.listening)await close();rmSync(directory,{recursive:true,force:true});}
});

test('CSV supports Excel quotes, BOM, blank entries and notes; rejects invalid rows and duplicate IDs',()=>{
  const directory=mkdtempSync(join(tmpdir(),'dokdo-csv-'));
  const path=join(directory,'students.csv');
  const header='\uFEFF학년,반,번호,성명,비고\r\n';
  try{
    writeFileSync(path,header+'"2","2","3","가상학생아","비고, 쉼표와 ""따옴표""\r\n줄바꿈"\r\n2,2,4,"Kim, ""A""",\r\n3,12,30,-,공란\r\n,,,,\r\n');
    assert.deepEqual([...loadRoster(path)],[['2-2-3','가상학생아'],['2-2-4','Kim, "A"']]);
    for(const content of [
      header+'2,2,3,가상학생아,\n2,2,3,가상학생자,',
      header+'4,2,3,가상학생아,',
      header+'2,2,3.5,가상학생아,',
      header+'2,2,3,"가상학생아,',
      header+'2,2,3,가상학생아,비고,추가열',
      'grade,class,number,name,notes\n2,2,3,가상학생아,',
      header+'3,12,30,-,공란',
    ]){
      writeFileSync(path,content);
      assert.throws(()=>loadRoster(path));
    }
  }finally{rmSync(directory,{recursive:true,force:true});}
});
