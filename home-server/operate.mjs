import {spawn,execFileSync} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createInterface} from 'node:readline';
import {createQuizServer,dataDir} from './server.mjs';

const cloudflared=[join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','cloudflared/cloudflared.exe'),join(process.env.ProgramFiles||'C:/Program Files','cloudflared/cloudflared.exe')].find(existsSync)||'cloudflared';
const config=join(dataDir,'tunnel/config.yml');
if(!existsSync(config)){console.error('Tunnel setup required. Run setup-tunnel.bat first.');process.exit(1);}
mkdirSync(dataDir,{recursive:true});
const server=createQuizServer();
let tunnel,power,stopping=false;
function stop(code=0){
  if(stopping)return;stopping=true;
  for(const child of [tunnel,power])if(child?.pid){try{execFileSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});}catch{}}
  server.close(()=>process.exit(code));server.closeIdleConnections();
  setTimeout(()=>process.exit(code),10000).unref();
}
server.on('error',e=>{console.error('Server failed:',e.code);stop(1);});
server.listen(8787,'127.0.0.1',()=>{
  tunnel=spawn(cloudflared,['tunnel','--config',config,'run'],{stdio:['ignore','inherit','inherit'],windowsHide:true});
  tunnel.on('error',e=>{console.error('Tunnel failed:',e.message);stop(1);});
  tunnel.on('exit',code=>{if(!stopping){console.error('Tunnel stopped. Restart start-event.bat.');stop(code||1);}});
  // Keep the laptop awake only while this child is alive; Windows restores it on exit.
  const script=`Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class DokdoPower { [DllImport("kernel32.dll")] public static extern uint SetThreadExecutionState(uint flags); }'; if([DokdoPower]::SetThreadExecutionState(2147483649) -eq 0){exit 1}; while($true){Start-Sleep -Seconds 30}`;
  power=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{stdio:'ignore',windowsHide:true});
  power.on('error',()=>console.error('Sleep prevention failed. Disable sleep manually.'));
  power.on('exit',()=>{if(!stopping)console.error('Sleep prevention stopped. Keep laptop awake manually.');});
  console.log('\nStudent URL: https://dokdo.sangsangbar.com');
  console.log('Wait for cloudflared to show Registered tunnel connection.');
  console.log('Keep charger connected and laptop lid OPEN.');
  console.log('Press ENTER or Ctrl+C here to stop the server and tunnel.\n');
});
createInterface({input:process.stdin,output:process.stdout}).on('line',()=>stop());
for(const signal of ['SIGINT','SIGTERM','SIGBREAK'])process.on(signal,()=>stop());
