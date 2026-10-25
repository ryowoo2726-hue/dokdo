import {spawn,execFile} from 'node:child_process';
import {createInterface} from 'node:readline';
import {randomBytes} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

async function cleanResources(pids){
  await Promise.all(pids.map(pid=>new Promise(resolve=>{
    if(process.platform==='win32')execFile('taskkill',['/PID',String(pid),'/T','/F'],{windowsHide:true,timeout:5000},()=>resolve());
    else{try{process.kill(pid,'SIGTERM');}catch{}resolve();}
  })));
}

export function supervise({args=[fileURLToPath(new URL('./operate.mjs',import.meta.url))],env=process.env,restartDelayMs=3000,maxRestartDelayMs=30000,stopTimeoutMs=12000,healthCheck=null,healthIntervalMs=5000,healthFailures=3,cleanup=cleanResources,write=console.log,onMessage=()=>{}}={}){
  const adminToken=randomBytes(32).toString('hex');
  let worker=null,stopping=false,finished=false,restarts=0,failures=0,retryTimer,stopTimer,healthTimer,workerReady=false;
  let resolveDone;
  const done=new Promise(resolve=>resolveDone=resolve);
  function finish(code){
    if(finished)return;finished=true;clearTimeout(retryTimer);clearTimeout(stopTimer);clearInterval(healthTimer);
    resolveDone({code,restarts,stoppedByUser:stopping});
  }
  function send(message){if(worker?.connected){try{worker.send(message,()=>{});}catch{}}}
  function stop(){
    if(stopping||finished)return;stopping=true;clearTimeout(retryTimer);clearInterval(healthTimer);
    if(!worker){finish(0);return;}
    send({type:'command',command:'stop'});
    stopTimer=setTimeout(()=>worker?.kill(),stopTimeoutMs);
  }
  function launch(){
    if(stopping){finish(0);return;}
    workerReady=false;
    const resources=new Set(),started=Date.now();let ready=false,checking=false,misses=0,spawnError;
    const child=spawn(process.execPath,args,{env:{...env,DOKDO_SUPERVISED:'1',DOKDO_ADMIN_TOKEN:adminToken,DOKDO_RESTART_COUNT:String(restarts),...(restarts?{DOKDO_NO_OPEN:'1'}:{})},stdio:['ignore','inherit','inherit','ipc'],windowsHide:true});
    worker=child;
    child.on('message',message=>{
      if(message?.type==='resource'&&Number.isSafeInteger(message.pid)&&message.pid>0)resources.add(message.pid);
      if(message?.type==='ready'){ready=true;workerReady=true;}
      if(message?.type==='intentional-stop')stop();
      onMessage(message);
    });
    child.once('error',error=>{spawnError=error;write(`[자동 복구] 실행 오류: ${error.code||error.message}`);});
    child.once('close',async(code,signal)=>{
      clearInterval(healthTimer);clearTimeout(stopTimer);worker=null;workerReady=false;
      await cleanup([...resources]);
      if(stopping||code===0){finish(0);return;}
      if(code===78||spawnError?.code==='ENOENT'){write('[실행 중단] 설정 또는 포트 오류를 확인한 뒤 다시 실행해 주세요.');finish(code||1);return;}
      if(Date.now()-started>=60000)failures=0;
      const delay=Math.min(restartDelayMs*2**Math.min(failures++,10),maxRestartDelayMs);
      restarts++;write(`[자동 복구] 서버 종료 감지 (${signal||code}). ${delay/1000}초 후 재시작합니다. 누적 ${restarts}회`);
      retryTimer=setTimeout(launch,delay);
    });
    if(healthCheck)healthTimer=setInterval(async()=>{
      if(stopping||!ready||checking||worker!==child)return;checking=true;
      let healthy=false;try{healthy=await healthCheck();}catch{}
      checking=false;if(stopping||worker!==child)return;
      misses=healthy?0:misses+1;
      if(misses>=healthFailures){clearInterval(healthTimer);write('[자동 복구] 서버가 연속으로 응답하지 않아 다시 시작합니다.');child.kill();}
    },healthIntervalMs);
  }
  launch();
  return {done,stop,refresh:()=>send({type:'command',command:'refresh'}),getStatus:()=>({pid:worker?.pid??null,ready:workerReady,restarts,stopping,finished})};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  console.log('[자동 복구] 사용 중 · 오류 종료 시 재시작 / 직접 종료 시 재시작하지 않음');
  const manager=supervise({healthCheck:async()=>{
    const response=await fetch('http://127.0.0.1:8787/health',{signal:AbortSignal.timeout(3000)});
    return response.ok&&(await response.json()).ok===true;
  }});
  const input=createInterface({input:process.stdin,output:process.stdout});
  input.on('line',line=>{const command=line.trim().toLowerCase();if(command==='r')manager.refresh();else if(!command||['q','exit'].includes(command))manager.stop();else console.log('R + Enter: 새로고침 / Enter: 종료');});
  for(const signal of ['SIGINT','SIGTERM','SIGBREAK'])process.on(signal,()=>manager.stop());
  manager.done.then(({code})=>{input.close();process.exit(code);});
}
