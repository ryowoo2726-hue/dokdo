import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,join} from 'node:path';
import {spawn,execFile} from 'node:child_process';
import {existsSync} from 'node:fs';
import {createInterface} from 'node:readline';
import {supervise} from './supervisor.mjs';
import {createRemoteAdminServer,loadRemoteCredentials} from './remote-admin.mjs';
import {dataDir,tunnelDir} from './paths.mjs';

export function createController({workerArgs=[fileURLToPath(new URL('./quiz-worker.mjs',import.meta.url))],env=process.env,healthCheck=async()=>{
  const response=await fetch(`http://127.0.0.1:${env.DOKDO_API_PORT||8787}/health`,{signal:AbortSignal.timeout(3000)});return response.ok;
},restartDelayMs=3000}={}){
  let manager=null,desired=false,busy=false,state='stopped',snapshot={total:0,pending:0,recent:[],uptimeSeconds:0},restarts=0,error=null;
  async function start(){
    desired=true;if(manager)return;
    state='starting';error=null;
    const current=supervise({args:workerArgs,env,healthCheck,restartDelayMs,onMessage:message=>{
      if(manager!==current)return;
      if(message?.type==='ready')state='running';
      if(message?.type==='snapshot')snapshot=message.snapshot;
    }});
    manager=current;
    current.done.then(result=>{
      if(manager!==current)return;
      restarts+=result.restarts;manager=null;state='stopped';
      if(desired){error=`서버가 종료되었습니다 (코드 ${result.code}). 포트와 설정을 확인한 뒤 다시 켜 주세요.`;desired=false;}
    });
  }
  async function stop(){
    desired=false;state='stopping';const current=manager;
    if(current){current.stop();await current.done;}
    state='stopped';
  }
  async function command(action){
    if(busy)throw Error('다른 작업을 처리하고 있습니다. 잠시 뒤 다시 시도해 주세요.');
    busy=true;try{
      if(action==='start')await start();
      else if(action==='stop')await stop();
      else if(action==='restart'){await stop();await start();}
      else if(action==='refresh')manager?.refresh();
      else throw Error('알 수 없는 명령입니다.');
    }finally{busy=false;}
  }
  return {command,close:stop,getSnapshot:()=>({...snapshot,state:state==='running'&&!manager?.getStatus().ready?'starting':state,busy,error,dataDir,autoRestart:true,restarts:restarts+(manager?.getStatus().restarts||0),uptimeSeconds:state==='running'?snapshot.uptimeSeconds:0,pending:state==='running'?snapshot.pending:0})};
}

async function main(){
  const config=join(tunnelDir,'config.yml');
  if(!existsSync(config))throw Error('먼저 setup-tunnel.bat을 실행해 주세요.');
  const credentials=loadRemoteCredentials();
  const controller=createController();
  let tunnel=null,power=null,timer,closing=false,tunnelState='connecting';
  const cloudflared=[join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','cloudflared/cloudflared.exe'),join(process.env.ProgramFiles||'C:/Program Files','cloudflared/cloudflared.exe')].find(existsSync)||'cloudflared';
  function launchTunnel(){
    if(closing)return;tunnelState='connecting';
    const child=spawn(cloudflared,['tunnel','--config',config,'run'],{stdio:['ignore','pipe','pipe'],windowsHide:true});tunnel=child;
    const log=chunk=>{const line=chunk.toString();if(line.includes('Registered tunnel connection'))tunnelState='connected';if(/\bERR\b/.test(line))console.error('[터널]',line.trim().slice(0,300));};
    child.stdout.on('data',log);child.stderr.on('data',log);
    child.on('error',error=>console.error('[터널]',error.message));
    child.on('close',()=>{tunnelState='offline';if(!closing)timer=setTimeout(launchTunnel,5000);});
  }
  const admin=createRemoteAdminServer({credentials,getSnapshot:()=>({...controller.getSnapshot(),tunnel:tunnelState}),onCommand:action=>controller.command(action)});
  const kill=child=>new Promise(r=>{if(!child?.pid)return r();execFile('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,timeout:5000},()=>r());});
  async function close(){
    if(closing)return;closing=true;clearTimeout(timer);
    admin.close();admin.closeIdleConnections();await controller.close();await Promise.all([kill(tunnel),kill(power)]);process.exit(0);
  }
  admin.on('error',error=>{console.error('관리 프로그램 실행 실패:',error.message);close();});
  admin.listen(8788,'127.0.0.1',async()=>{
    launchTunnel();
    if(process.platform==='win32'){
      const script=`Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class DokdoRemotePower { [DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint flags); }'; if([DokdoRemotePower]::SetThreadExecutionState(2147483649) -eq 0){exit 1}; while($true){Start-Sleep -Seconds 30}`;
      power=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{stdio:'ignore',windowsHide:true});
      power.on('error',()=>console.error('절전 방지를 실행하지 못했습니다. Windows 전원 설정을 확인해 주세요.'));
    }
    await controller.command('start');
    console.log('관리 페이지: http://127.0.0.1:8788/');
    console.log(`원격 관리 주소: https://${credentials.hostname}/`);
    console.log('관리 페이지의 서버 종료는 퀴즈만 종료합니다. 관리 프로그램 전체 종료: Q + Enter 또는 Ctrl+C');
    if(process.env.DOKDO_NO_OPEN!=='1'&&process.platform==='win32')spawn('explorer.exe',['http://127.0.0.1:8788/'],{stdio:'ignore',windowsHide:true}).on('error',()=>{});
  });
  const input=createInterface({input:process.stdin,output:process.stdout});
  input.on('line',line=>{if(['q','exit'].includes(line.trim().toLowerCase()))close();else if(line.trim().toLowerCase()==='r')controller.command('refresh').catch(console.error);});
  for(const signal of ['SIGINT','SIGTERM','SIGBREAK'])process.on(signal,close);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
