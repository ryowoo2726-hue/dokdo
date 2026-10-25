import {createQuizServer} from './server.mjs';
import {attachSubmissionLog,printSummary} from './monitor.mjs';

const server=createQuizServer();
attachSubmissionLog(server);
const send=message=>{if(process.connected)process.send(message,()=>{});};
let stopping=false;
function stop(){
  if(stopping)return;stopping=true;clearInterval(timer);
  server.close(()=>process.exit(0));server.closeIdleConnections();
  setTimeout(()=>process.exit(1),10000).unref();
}
server.on('error',error=>{console.error(error.message);process.exit(error.code==='EADDRINUSE'?78:1);});
server.listen(Number(process.env.DOKDO_API_PORT||8787),'127.0.0.1',()=>send({type:'ready'}));
const timer=setInterval(()=>{if(!stopping)send({type:'snapshot',snapshot:server.getMonitorSnapshot()});},1000);
process.on('message',message=>{
  if(message?.type!=='command')return;
  if(message.command==='stop')stop();
  if(message.command==='refresh'&&!stopping){printSummary(server);send({type:'snapshot',snapshot:server.getMonitorSnapshot()});}
});
process.on('disconnect',stop);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,stop);
