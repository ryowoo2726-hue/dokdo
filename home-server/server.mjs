import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {homedir} from 'node:os';
import {validate,validateStudent,studentKey,savedReceipt} from './core.mjs';
import {loadRankingQuiz,buildRankings} from './ranking.mjs';
export const dataDir=process.env.DOKDO_DATA_DIR||join(process.env.LOCALAPPDATA||homedir(),'MaseokDokdo');
export function createQuizServer({directory=dataDir,allowedOrigins=(process.env.DOKDO_ALLOWED_ORIGINS||'https://dokdo.sangsangbar.com,https://maseok-dokdo.pages.dev,http://localhost:8787,http://127.0.0.1:8787').split(',').map(s=>s.trim())}={}){
  mkdirSync(directory,{recursive:true});
  const db=new DatabaseSync(join(directory,'responses.sqlite'));
  db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS responses(id TEXT PRIMARY KEY, received TEXT NOT NULL, payload TEXT NOT NULL, result TEXT NOT NULL)');
  const find=db.prepare('SELECT payload,result FROM responses WHERE id=?'),put=db.prepare('INSERT INTO responses VALUES(?,?,?,?)');
  db.exec('CREATE TABLE IF NOT EXISTS participants(student TEXT PRIMARY KEY, response_id TEXT NOT NULL)');
  const remember=db.prepare('INSERT OR IGNORE INTO participants VALUES(?,?)');
  db.exec('BEGIN IMMEDIATE');
  try{for(const row of db.prepare('SELECT id,payload FROM responses ORDER BY received,id').iterate())remember.run(studentKey(JSON.parse(row.payload).student),row.id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');db.close();throw e;}
  const participated=db.prepare('SELECT response_id FROM participants WHERE student=?');
  const rankingQuiz=loadRankingQuiz();
  const rankingRows=db.prepare('SELECT payload,received FROM responses ORDER BY received,id');
  let rankingCache=null;
  const duplicate={status:409,body:{error:'이미 참여한 학생입니다. 학년·반·번호를 확인해 주세요.',code:'ALREADY_PARTICIPATED'}};
  const queue=[];let timer;
  function send(res,status,body){if(!res.destroyed){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(status===503?{'Retry-After':'5'}:{})});res.end(JSON.stringify(body));}}
  function flush(){
    timer=null;const batch=queue.splice(0,200),results=[];
    try{
      db.exec('BEGIN IMMEDIATE');
      for(const item of batch){
        const payload=JSON.stringify(item.payload),existing=find.get(item.payload.id);
        if(existing){results.push(existing.payload===payload?{status:200,body:JSON.parse(existing.result)}:{status:409,body:{error:'같은 접수번호의 다른 답안이 있습니다.'}});}
        else if(participated.get(studentKey(item.payload.student))){results.push(duplicate);}
        else{const result=savedReceipt(item.payload);put.run(item.payload.id,new Date().toISOString(),payload,JSON.stringify(result));remember.run(studentKey(item.payload.student),item.payload.id);results.push({status:200,body:result});}
      }
      db.exec('COMMIT');rankingCache=null;batch.forEach((item,i)=>send(item.res,results[i].status,results[i].body));
    }catch(e){try{db.exec('ROLLBACK');}catch{}console.error('저장 실패:',e.code||'database');batch.forEach(item=>send(item.res,503,{error:'저장하지 못했습니다. 다시 제출해 주세요.'}));}
    if(queue.length)timer=setTimeout(flush,10);
  }
  const server=http.createServer(async(req,res)=>{
    const origin=req.headers.origin;
    res.setHeader('Vary','Origin');
    if(origin&&!allowedOrigins.includes(origin)){send(res,403,{error:'퀴즈 화면에서 제출해 주세요.'});req.resume();return;}
    if(origin)res.setHeader('Access-Control-Allow-Origin',origin);
    if(req.method==='OPTIONS'){
      if(!origin||!['GET','POST'].includes(req.headers['access-control-request-method'])||(req.headers['access-control-request-headers']||'').split(',').some(h=>h.trim()&&h.trim().toLowerCase()!=='content-type')){send(res,403,{error:'허용되지 않은 요청입니다.'});return;}
      res.writeHead(204,{'Access-Control-Allow-Methods':'GET, POST','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'});res.end();return;
    }
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(req.method==='GET'&&req.url==='/health'){send(res,200,{ok:true});return;}
    if(pathname==='/api/rankings'){
      if(req.method!=='GET'){send(res,405,{error:'GET required'});req.resume();return;}
      try{
        if(!rankingCache){
          const rankings=buildRankings(rankingRows.iterate(),rankingQuiz);
          rankingCache={rankings,participants:rankings.length};
        }
        send(res,200,rankingCache);
      }catch{send(res,503,{error:'랭킹을 불러오지 못했습니다.'});}
      return;
    }
    if(!['/api/submit','/api/start'].includes(pathname)){send(res,404,{error:'Not found'});req.resume();return;}
    if(req.method!=='POST'){send(res,405,{error:'POST required'});req.resume();return;}
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){send(res,415,{error:'JSON required'});req.resume();return;}
    let size=0,chunks=[];
    try{for await(const chunk of req){size+=chunk.length;if(size>8192){send(res,413,{error:'답안이 너무 큽니다.'});req.resume();return;}chunks.push(chunk);}}catch{return;}
    let payload;try{const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));payload=pathname==='/api/start'?validateStudent(body):validate(body);}catch(e){send(res,400,{error:e instanceof SyntaxError?'잘못된 JSON입니다.':e.message});return;}
    if(pathname==='/api/start'){
      if(participated.get(studentKey(payload))){send(res,duplicate.status,duplicate.body);return;}
      send(res,200,{eligible:true});return;
    }
    if(queue.length>=5000){send(res,503,{error:'제출이 몰리고 있습니다. 잠시 후 다시 시도해 주세요.'});return;}
    queue.push({payload,res});if(!timer)timer=setTimeout(flush,10);
  });
  server.requestTimeout=15000;server.headersTimeout=10000;
  server.on('close',()=>{if(timer)clearTimeout(timer);while(queue.length)flush();if(timer)clearTimeout(timer);db.close();});
  return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const server=createQuizServer();server.listen(8787,'127.0.0.1',()=>console.log(`독도 퀴즈 실행 중: http://localhost:8787\n저장 폴더: ${dataDir}\n종료: Ctrl+C`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close(()=>process.exit(0));server.closeIdleConnections();});
}
