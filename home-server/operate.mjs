import {spawn,execFileSync} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createInterface} from 'node:readline';
import {createQuizServer} from './server.mjs';
import {dataDir,tunnelDir} from './paths.mjs';
import {createAdminServer} from './admin.mjs';
import {attachSubmissionLog,printSummary} from './monitor.mjs';

const cloudflared=[join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','cloudflared/cloudflared.exe'),join(process.env.ProgramFiles||'C:/Program Files','cloudflared/cloudflared.exe')].find(existsSync)||'cloudflared';
const config=join(tunnelDir,'config.yml');
if(!existsSync(config)){console.error('Tunnel setup required. Run setup-tunnel.bat first.');process.exit(78);}
mkdirSync(dataDir,{recursive:true});
const server=createQuizServer();
attachSubmissionLog(server);
let tunnel,power,admin,stopping=false,tunnelState='connecting';
function notify(message){if(process.connected){try{process.send(message,()=>{});}catch{}}}
function stop(code=0){
  if(stopping)return;stopping=true;
  if(code===0)notify({type:'intentional-stop'});
  console.log('\n[종료] 서버와 외부 연결을 종료합니다.');
  if(admin?.listening){admin.close();admin.closeIdleConnections();}
  for(const child of [tunnel,power])if(child?.pid){try{execFileSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}catch{}}
  server.close(()=>process.exit(code));server.closeIdleConnections();
  setTimeout(()=>process.exit(code),10000).unref();
}
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'이미 서버가 실행 중입니다. 기존 서버 창을 먼저 종료해 주세요.':`서버 실행 실패: ${e.code}`);stop(e.code==='EADDRINUSE'?78:1);});
server.listen(8787,'127.0.0.1',()=>{
  tunnel=spawn(cloudflared,['tunnel','--config',config,'run'],{stdio:['ignore','pipe','pipe'],windowsHide:true});
  if(tunnel.pid)notify({type:'resource',pid:tunnel.pid});
  const connectionLog=chunk=>{
    const text=chunk.toString();
    if(text.includes('Registered tunnel connection')&&tunnelState!=='connected'){tunnelState='connected';console.log('[외부 연결] 학생 사이트와 연결되었습니다.');}
    if(/\bERR\b/.test(text))console.error('[터널 확인]',text.trim().slice(0,300));
  };
  tunnel.stdout.on('data',connectionLog);tunnel.stderr.on('data',connectionLog);
  tunnel.on('error',e=>{console.error('Tunnel failed:',e.message);stop(e.code==='ENOENT'?78:1);});
  tunnel.on('exit',code=>{tunnelState='offline';if(!stopping){console.error('Tunnel stopped. Restart start-event.bat.');stop(code||1);}});
  // Keep the laptop awake only while this child is alive; Windows restores it on exit.
  const script=`Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class DokdoPower { [DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint flags); }'; if([DokdoPower]::SetThreadExecutionState(2147483649) -eq 0){exit 1}; while($true){Start-Sleep -Seconds 30}`;
  power=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{stdio:'ignore',windowsHide:true});
  if(power.pid)notify({type:'resource',pid:power.pid});
  power.on('error',()=>console.error('Sleep prevention failed. Disable sleep manually.'));
  power.on('exit',()=>{if(!stopping)console.error('Sleep prevention stopped. Keep laptop awake manually.');});
  admin=createAdminServer({token:process.env.DOKDO_ADMIN_TOKEN,getSnapshot:()=>({...server.getMonitorSnapshot(),tunnel:tunnelState,dataDir,autoRestart:process.env.DOKDO_SUPERVISED==='1',restarts:Number(process.env.DOKDO_RESTART_COUNT||0)}),onRefresh:()=>printSummary(server),onStop:()=>stop()});
  admin.on('error',e=>{console.error('관리 창 실행 실패:',e.code);stop(e.code==='EADDRINUSE'?78:1);});
  admin.listen(8788,'127.0.0.1',()=>{
    const url='http://127.0.0.1:8788/';
    console.log('\n독도 퀴즈 서버가 실행되었습니다.');
    console.log(`관리 창: ${url}`);
    console.log(`학생 데이터 저장: ${dataDir}`);
    console.log('학생 퀴즈: https://dokdo.sangsangbar.com');
    console.log('R + Enter: 현황 새로고침 / Enter 또는 Ctrl+C: 서버 종료');
    console.log('이 창에 새 학생 응답이 자동으로 표시됩니다.\n');
    notify({type:'ready'});
    printSummary(server);
    if(process.platform==='win32'&&process.env.DOKDO_NO_OPEN!=='1'){
      const browser=spawn('explorer.exe',[url],{stdio:'ignore',windowsHide:true});
      browser.on('error',()=>console.log(`관리 창을 직접 열어 주세요: ${url}`));
    }
  });
});
if(process.env.DOKDO_SUPERVISED==='1'){
  process.on('message',message=>{if(message?.type==='command'&&message.command==='stop')stop();else if(message?.type==='command'&&message.command==='refresh'&&!stopping)printSummary(server);});
  process.on('disconnect',()=>stop());
}else createInterface({input:process.stdin,output:process.stdout}).on('line',line=>{if(line.trim().toLowerCase()==='r')printSummary(server);else if(!line.trim()||['q','exit'].includes(line.trim().toLowerCase()))stop();else console.log('R + Enter: 새로고침 / Enter: 종료');});
for(const signal of ['SIGINT','SIGTERM','SIGBREAK'])process.on(signal,()=>stop());
