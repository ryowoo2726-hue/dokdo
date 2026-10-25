import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createController} from '../home-server/controller.mjs';

async function waitFor(check){const end=Date.now()+10000;while(!await check()){if(Date.now()>end)throw Error('Timed out');await delay(30);}}
test('controller stops and starts the real quiz repeatedly and preserves submissions',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'dokdo-controller-')),probe=http.createServer();
 await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 const controller=createController({env:{...process.env,DOKDO_DATA_DIR:directory,DOKDO_API_PORT:String(port)},restartDelayMs:30});
 const base=`http://127.0.0.1:${port}`;
 try{
  await controller.command('start');await waitFor(()=>controller.getSnapshot().state==='running');
  const student={grade:1,classroom:1,number:2,nickname:'원격강치'};
  const payload={id:crypto.randomUUID(),quizVersion:'0123456789abcdef',student,started:Date.now(),answers:{q1:0}};
  assert.equal((await fetch(base+'/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})).status,200);
  await waitFor(()=>controller.getSnapshot().total===1);
  for(const action of ['stop','start','restart']){
   await controller.command(action);
   if(action==='stop'){
    assert.equal(controller.getSnapshot().state,'stopped');assert.equal(controller.getSnapshot().total,1);
    await assert.rejects(fetch(base+'/health',{signal:AbortSignal.timeout(1000)}));
   }else{
    await waitFor(()=>controller.getSnapshot().state==='running');
    assert.equal((await fetch(base+'/api/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(student)})).status,409);
   }
  }
 }finally{await controller.close();rmSync(directory,{recursive:true,force:true});}
});
