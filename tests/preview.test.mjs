import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createQuizServer} from '../home-server/server.mjs';
import {createPreviewServer} from '../scripts/dev.mjs';

test('preview serves public assets and proxies the API without exposing local files',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'dokdo-preview-test-'));
  const api=createQuizServer({directory});
  await new Promise(r=>api.listen(0,'127.0.0.1',r));
  const preview=createPreviewServer({apiPort:api.address().port});
  await new Promise(r=>preview.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${preview.address().port}`;
  try{
    for(const path of ['/','/ranking.html','/css/style.css','/css/ranking.css','/js/app.js','/js/ranking.js','/js/api.mjs','/js/quiz.mjs','/data/questions.json','/assets/dokdo.svg'])assert.equal((await fetch(base+path)).status,200,path);
    for(const path of ['/home-server/server.mjs','/학생 명단.md','/학생 명단.csv','/README.md','/.git/config','/design/reference-assets/rank-score-slot.svg','/scripts/dev.mjs'])assert.equal((await fetch(base+path)).status,404,path);
    assert.deepEqual(await (await fetch(base+'/api/rankings')).json(),{participants:0,rankings:[]});
    const response=await fetch(base+'/api/start',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({grade:1,classroom:1,number:1,nickname:'로컬강치'})});
    assert.equal(response.status,200);assert.deepEqual(await response.json(),{eligible:true,participated:false,student:{grade:1,classroom:1,number:1,nickname:'로컬강치',name:'가상학생가'}});
    await new Promise(r=>{api.close(r);api.closeIdleConnections();});
    assert.equal((await fetch(base+'/api/rankings')).status,503);
  }finally{
    await new Promise(r=>{preview.close(r);preview.closeIdleConnections();});
    if(api.listening)await new Promise(r=>{api.close(r);api.closeIdleConnections();});
    rmSync(directory,{recursive:true,force:true});
  }
});
