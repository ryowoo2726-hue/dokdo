import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {supervise} from '../home-server/supervisor.mjs';

async function waitFor(check,timeout=5000){
 const deadline=Date.now()+timeout;
 while(!check()){if(Date.now()>deadline)throw Error('Timed out waiting for worker');await delay(15);}
}
const simpleWorker=`process.on('message',m=>{if(m.command==='stop'){process.send({type:'intentional-stop'});process.exit(0);}});process.send({type:'ready',generation:Number(process.env.DOKDO_RESTART_COUNT)});setInterval(()=>{},1000);`;

test('unexpected worker death restarts once, retains session token, and manual stop prevents another restart',async()=>{
 const ready=[],tokens=[],logs=[];
 const worker=`${simpleWorker}process.send({type:'token',token:process.env.DOKDO_ADMIN_TOKEN});`;
 const manager=supervise({args:['-e',worker],restartDelayMs:30,cleanup:async()=>{},write:l=>logs.push(l),onMessage:m=>{if(m.type==='ready')ready.push(m);if(m.type==='token')tokens.push(m.token);}});
 try{
  await waitFor(()=>ready.length===1&&tokens.length===1);const original=manager.getStatus().pid;
  process.kill(original);
  await waitFor(()=>ready.length===2&&tokens.length===2);
  assert.notEqual(manager.getStatus().pid,original);assert.equal(manager.getStatus().restarts,1);assert.equal(tokens[0],tokens[1]);assert.ok(logs.some(l=>l.includes('재시작')));
  manager.stop();const result=await manager.done;assert.equal(result.stoppedByUser,true);await delay(100);assert.equal(ready.length,2);
 }finally{manager.stop();await manager.done;}
});

test('clean exit and fatal configuration errors do not restart',async()=>{
 for(const code of [0,78]){
  const manager=supervise({args:['-e',`process.exit(${code})`],restartDelayMs:20,cleanup:async()=>{},write:()=>{}});
  const result=await manager.done;assert.equal(result.restarts,0);assert.equal(result.code,code);
 }
});

test('an explicit user-stop message prevents restart even when termination is abnormal',async()=>{
 const worker=`process.send({type:'intentional-stop'});setTimeout(()=>process.exit(1),30);process.on('message',()=>{});`;
 const manager=supervise({args:['-e',worker],restartDelayMs:20,cleanup:async()=>{},write:()=>{}});
 const result=await manager.done;assert.equal(result.stoppedByUser,true);assert.equal(result.restarts,0);
});

test('stopping during restart delay cancels the pending restart',async()=>{
 const manager=supervise({args:['-e','process.exit(1)'],restartDelayMs:300,cleanup:async()=>{},write:()=>{}});
 await waitFor(()=>manager.getStatus().restarts===1);manager.stop();await manager.done;await delay(350);assert.equal(manager.getStatus().pid,null);assert.equal(manager.getStatus().restarts,1);
});

test('three consecutive health failures recover a hung worker',async()=>{
 let generation=-1,checks=0;
 const manager=supervise({args:['-e',simpleWorker],restartDelayMs:20,healthIntervalMs:25,healthFailures:3,healthCheck:async()=>{checks++;return generation>0;},cleanup:async()=>{},write:()=>{},onMessage:m=>{if(m.type==='ready')generation=m.generation;}});
 try{await waitFor(()=>generation===1);assert.ok(checks>=3);assert.equal(manager.getStatus().restarts,1);}finally{manager.stop();await manager.done;}
});

test('real API recovers after a crash and keeps its saved responses',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'dokdo-recovery-test-'));
 const moduleUrl=new URL('../home-server/server.mjs',import.meta.url).href;
 const worker=`import {createQuizServer} from ${JSON.stringify(moduleUrl)};const api=createQuizServer();api.listen(0,'127.0.0.1',()=>process.send({type:'ready',port:api.address().port}));process.on('message',m=>{if(m.command==='stop'){process.send({type:'intentional-stop'});api.close(()=>process.exit(0));api.closeIdleConnections();}});`;
 const ready=[];
 const manager=supervise({args:['--input-type=module','-e',worker],env:{...process.env,DOKDO_DATA_DIR:directory},restartDelayMs:30,cleanup:async()=>{},write:()=>{},onMessage:m=>{if(m.type==='ready')ready.push(m);}});
 try{
  await waitFor(()=>ready.length===1);const first=`http://127.0.0.1:${ready[0].port}`;
  const payload={id:crypto.randomUUID(),quizVersion:'0123456789abcdef',student:{grade:1,classroom:1,number:1,nickname:'복구강치'},started:Date.now(),answers:{q1:0}};
  assert.equal((await fetch(first+'/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})).status,200);
  process.kill(manager.getStatus().pid);await waitFor(()=>ready.length===2);
  const second=`http://127.0.0.1:${ready[1].port}`;
  assert.equal((await fetch(second+'/health')).status,200);
  assert.equal((await fetch(second+'/api/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload.student)})).status,409);
 }finally{manager.stop();await manager.done;rmSync(directory,{recursive:true,force:true});}
});
