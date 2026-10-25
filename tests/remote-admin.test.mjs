import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {scryptSync} from 'node:crypto';
import {createRemoteAdminServer} from '../home-server/remote-admin.mjs';

test('remote management requires login, CSRF token and matching origin; logout revokes the session',async()=>{
 const salt='a'.repeat(32),password='test-only-password',commands=[];
 const admin=createRemoteAdminServer({credentials:{hostname:'admin.example.com',username:'test-admin',salt,hash:scryptSync(password,salt,32).toString('hex')},getSnapshot:()=>({state:'stopped'}),onCommand:async action=>commands.push(action)});
 await new Promise(r=>admin.listen(0,'127.0.0.1',r));
 const port=admin.address().port;
 const request=(path,{method='GET',headers={},body='',host='admin.example.com'}={})=>new Promise((resolve,reject)=>{
  const req=http.request({hostname:'127.0.0.1',port,path,method,headers:{Host:host,...headers}},res=>{let text='';res.setEncoding('utf8');res.on('data',s=>text+=s);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text}));});req.on('error',reject);req.end(body);
 });
 try{
  assert.match((await request('/')).text,/관리자 로그인/);
  assert.equal((await request('/status')).status,401);
  assert.equal((await request('/stop',{method:'POST'})).status,401);
  assert.equal((await request('/',{host:'evil.example'})).status,403);
  const loginHeaders={Origin:'https://admin.example.com','Content-Type':'application/json'};
  assert.equal((await request('/login',{method:'POST',headers:loginHeaders,body:JSON.stringify({username:'test-admin',password:'wrong'})})).status,401);
  assert.equal((await request('/login',{method:'POST',headers:loginHeaders,body:JSON.stringify({username:'wrong',password})})).status,401);
  assert.equal((await request('/login',{method:'POST',headers:loginHeaders,body:JSON.stringify({password})})).status,400);
  const login=await request('/login',{method:'POST',headers:loginHeaders,body:JSON.stringify({username:'test-admin',password})});
  assert.equal(login.status,200);const rawCookie=login.headers['set-cookie'][0];assert.match(rawCookie,/HttpOnly; Secure; SameSite=Strict/);
  const Cookie=rawCookie.split(';')[0];
  const page=await request('/',{headers:{Cookie}});const token=page.text.match(/const token='([a-f0-9]+)'/)[1];assert.doesNotMatch(page.text,/id="show-password"/);
  assert.equal((await request('/connection',{headers:{Cookie,'X-Admin-Token':token}})).status,404);
  assert.equal((await request('/stop',{method:'POST',headers:{Cookie}})).status,403);
  const headers={Cookie,'X-Admin-Token':token,Origin:'https://admin.example.com'};
  assert.equal((await request('/stop',{method:'POST',headers:{...headers,Origin:'https://evil.example'}})).status,403);
  for(const action of ['stop','start','restart','refresh'])assert.equal((await request('/'+action,{method:'POST',headers})).status,200);
  assert.deepEqual(commands,['stop','start','restart','refresh']);
  assert.equal((await request('/status',{headers})).status,200);
  assert.equal((await request('/logout',{method:'POST',headers})).status,200);
  assert.equal((await request('/status',{headers})).status,401);
  const local=await request('/',{host:`127.0.0.1:${port}`});assert.match(local.text,/id="show-password"/);
  assert.equal((await request('/',{host:`127.0.0.1:${port}`,headers:{'CF-Connecting-IP':'1.2.3.4'}})).status,403);
 }finally{await new Promise(r=>{admin.close(r);admin.closeIdleConnections();});}
});

test('remote login is rate limited',async()=>{
 const admin=createRemoteAdminServer({credentials:{hostname:'admin.example.com',salt:'a'.repeat(32),hash:'b'.repeat(64)},getSnapshot:()=>({}),onCommand:async()=>{}});
 await new Promise(r=>admin.listen(0,'127.0.0.1',r));
 try{
  for(let i=0;i<11;i++){
   const status=await new Promise((resolve,reject)=>{const req=http.request({hostname:'127.0.0.1',port:admin.address().port,path:'/login',method:'POST',headers:{Host:'admin.example.com',Origin:'https://admin.example.com','Content-Type':'application/json'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);req.end('{}');});
   assert.equal(status,i===10?429:400);
  }
 }finally{await new Promise(r=>{admin.close(r);admin.closeIdleConnections();});}
});
