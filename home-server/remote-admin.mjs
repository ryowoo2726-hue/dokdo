import http from 'node:http';
import {randomBytes,scryptSync,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tunnelDir} from './paths.mjs';

const derive=promisify(scrypt);
export function loadRemoteCredentials(directory=join(tunnelDir,'..','remote')){
  mkdirSync(directory,{recursive:true});const file=join(directory,'credentials.json');
  if(!existsSync(file)){
    const password=randomBytes(24).toString('base64url'),salt=randomBytes(16).toString('hex');
    writeFileSync(file,JSON.stringify({hostname:'dokdo-admin.sangsangbar.com',username:'admin',salt,hash:scryptSync(password,salt,32).toString('hex')},null,2),{mode:0o600,flag:'wx'});
    writeFileSync(join(directory,'login-password.txt'),password+'\n',{mode:0o600,flag:'wx'});
  }
  const config=JSON.parse(readFileSync(file,'utf8'));
  if(!/^[a-z0-9.-]+$/.test(config.hostname)||!/^[a-f0-9]{32}$/.test(config.salt)||!/^[a-f0-9]{64}$/.test(config.hash)||!/^[A-Za-z0-9._@-]{1,64}$/.test(config.username||'admin'))throw Error('원격 관리 인증 설정을 확인해 주세요.');
  return {...config,username:config.username||'admin',passwordFile:join(directory,'login-password.txt')};
}
const loginPage=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>독도 퀴즈 관리자 로그인</title><style>body{font:16px system-ui;background:#edf5fc;color:#18324d;margin:0;padding:24px}main{max-width:360px;margin:12vh auto;background:white;padding:28px;border-radius:20px}input,button{box-sizing:border-box;width:100%;padding:14px;font:inherit;margin:8px 0 16px;border:1px solid #bdcfdf;border-radius:10px}button{background:#1762a0;color:white}p{line-height:1.6}</style><main><h1>독도 퀴즈 서버 관리</h1><p>관리 아이디와 비밀번호를 입력해 주세요.</p><form><label for="username">아이디</label><input id="username" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required><label for="password">비밀번호</label><input id="password" name="password" type="password" autocomplete="current-password" required><button>로그인</button></form><p id="message" role="status"></p></main><script>document.querySelector('form').onsubmit=async e=>{e.preventDefault();const button=document.querySelector('button');button.disabled=true;try{const r=await fetch('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:document.getElementById('username').value,password:document.getElementById('password').value})});if(r.ok)location.reload();else document.getElementById('message').textContent=(await r.json()).error;}catch{document.getElementById('message').textContent='연결을 확인한 뒤 다시 시도해 주세요.';}finally{button.disabled=false;}};</script></html>`;

export function createRemoteAdminServer({credentials,getSnapshot,onCommand,sessionMs=8*60*60*1000}){
  const sessions=new Map(),localToken=randomBytes(32).toString('hex');let attempts=0,windowStart=Date.now();
  const template=readFileSync(new URL('./remote-admin.html',import.meta.url),'utf8');
  return http.createServer(async(req,res)=>{
    const localHost=`127.0.0.1:${req.socket.localPort}`;
    const local=req.headers.host===localHost&&!req.headers['cf-connecting-ip']&&!req.headers['cf-access-jwt-assertion'];
    const origin=local?`http://${localHost}`:`https://${credentials.hostname}`;
    const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'"};
    const send=(status,body,type='application/json; charset=utf-8',extra={})=>{res.writeHead(status,{...headers,'Content-Type':type,...extra});res.end(type.startsWith('application/json')?JSON.stringify(body):body);};
    if((!local&&req.headers.host!==credentials.hostname)||(req.headers.origin&&req.headers.origin!==origin)){send(403,{error:'허용되지 않은 연결입니다.'});req.resume();return;}
    let path;try{path=new URL(req.url,origin).pathname;}catch{send(400,{error:'Invalid URL'});return;}
    for(const [key,value]of sessions)if(value.expires<Date.now())sessions.delete(key);
    const cookie=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('__Host-dokdo='))?.slice(13);
    const session=cookie?sessions.get(cookie):null;
    if(req.method==='GET'&&path==='/favicon.ico'){send(204,'','text/plain');return;}
    if(req.method==='POST'&&path==='/login'&&!local){
      if(req.headers.origin!==origin||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')){send(403,{error:'로그인 페이지에서 다시 시도해 주세요.'});req.resume();return;}
      if(Date.now()-windowStart>60000){attempts=0;windowStart=Date.now();}
      if(++attempts>10){send(429,{error:'로그인 시도가 많습니다. 1분 뒤 다시 시도해 주세요.'});req.resume();return;}
      let size=0,chunks=[];
      try{
        for await(const chunk of req){size+=chunk.length;if(size>2048){send(413,{error:'입력이 너무 깁니다.'});req.resume();return;}chunks.push(chunk);}
        const {username,password}=JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if(typeof username!=='string'||username.length>64||typeof password!=='string'||password.length>256)throw Error();
        const hash=await derive(password,credentials.salt,32);
        if(!timingSafeEqual(hash,Buffer.from(credentials.hash,'hex'))||username!==(credentials.username||'admin')){send(401,{error:'아이디와 비밀번호를 확인해 주세요.'});return;}
        const id=randomBytes(32).toString('hex');
        if(sessions.size>=100)sessions.delete(sessions.keys().next().value);
        sessions.set(id,{token:randomBytes(32).toString('hex'),expires:Date.now()+sessionMs});
        send(200,{ok:true},undefined,{'Set-Cookie':`__Host-dokdo=${id}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${Math.floor(sessionMs/1000)}`});
      }catch{if(!res.writableEnded)send(400,{error:'아이디와 비밀번호를 입력해 주세요.'});}return;
    }
    if(!local&&!session){send(path==='/'&&req.method==='GET'?200:401,path==='/'&&req.method==='GET'?loginPage:{error:'다시 로그인해 주세요.'},path==='/'&&req.method==='GET'?'text/html; charset=utf-8':undefined);req.resume();return;}
    const token=local?localToken:session.token;
    if(req.method==='GET'&&path==='/'){
      const connection=local?`<section class="card"><h2>휴대폰에서 접속하기</h2><p>주소: <a href="https://${credentials.hostname}/" target="_blank" rel="noopener">https://${credentials.hostname}/</a></p><p>관리 아이디: <code>${credentials.username||'admin'}</code></p><p>관리 비밀번호: <button id="show-password" type="button">이 노트북에서 확인</button> <code id="password-value"></code></p><p>퀴즈 서버를 꺼도 이 관리 프로그램과 원격 연결은 유지됩니다.</p></section>`:'';
      send(200,template.replace('__ADMIN_TOKEN__',token).replace('__LOCAL_CONNECTION__',connection),'text/html; charset=utf-8');return;
    }
    if(req.headers['x-admin-token']!==token){send(403,{error:'관리 페이지를 다시 열어 주세요.'});req.resume();return;}
    try{
      if(req.method==='GET'&&path==='/connection'&&local){send(200,{password:readFileSync(credentials.passwordFile,'utf8').trim()});return;}
      if(req.method==='GET'&&path==='/status'){send(200,getSnapshot());return;}
      if(req.method==='POST'&&path==='/logout'){
        if(cookie)sessions.delete(cookie);send(200,{ok:true},undefined,{'Set-Cookie':'__Host-dokdo=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'});req.resume();return;
      }
      if(req.method==='POST'&&['/start','/stop','/restart','/refresh'].includes(path)){
        req.resume();await onCommand(path.slice(1));send(200,getSnapshot());return;
      }
      send(404,{error:'Not found'});req.resume();
    }catch(error){send(409,{error:error.message});}
  });
}
