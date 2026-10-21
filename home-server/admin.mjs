import http from 'node:http';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';

export function createAdminServer({getSnapshot,onRefresh=()=>{},onStop=()=>{}}){
  const token=randomBytes(32).toString('hex');
  const page=readFileSync(new URL('./admin.html',import.meta.url),'utf8').replace('__ADMIN_TOKEN__',token);
  return http.createServer((req,res)=>{
    const port=req.socket.localPort,host=`127.0.0.1:${port}`,origin=`http://${host}`;
    const send=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
    // Never expose controls through the public tunnel, preview proxy, or another origin.
    if(req.headers.host!==host || (req.headers.origin&&req.headers.origin!==origin)){send(403,{error:'노트북의 관리 창에서 이용해 주세요.'});req.resume();return;}
    const path=new URL(req.url,origin).pathname;
    if(req.method==='GET'&&path==='/favicon.ico'){res.writeHead(204);res.end();return;}
    if(req.method==='GET'&&path==='/'){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'",'Referrer-Policy':'no-referrer'});res.end(page);return;
    }
    if(req.headers['x-admin-token']!==token){send(403,{error:'관리 창을 새로 열어 주세요.'});req.resume();return;}
    if(req.method==='GET'&&path==='/status'){send(200,getSnapshot());return;}
    if(req.method==='POST'&&path==='/refresh'){onRefresh();send(200,getSnapshot());req.resume();return;}
    if(req.method==='POST'&&path==='/stop'){
      send(200,{stopping:true});req.resume();
      setTimeout(onStop,200).unref();return;
    }
    send(404,{error:'Not found'});req.resume();
  });
}
