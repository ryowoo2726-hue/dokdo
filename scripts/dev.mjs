import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

export function createPreviewServer({apiPort=8787,root=fileURLToPath(new URL('../public/',import.meta.url))}={}){
  const publicRoot=resolve(root);
  const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
  return http.createServer(async(req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname.startsWith('/api/')||pathname==='/health'){
      const headers={...req.headers};delete headers.origin;delete headers.host;
      const upstream=http.request({hostname:'127.0.0.1',port:apiPort,path:req.url,method:req.method,headers},reply=>{res.writeHead(reply.statusCode,reply.headers);reply.pipe(res);});
      upstream.setTimeout(15000,()=>upstream.destroy());
      upstream.on('error',()=>{if(res.headersSent){res.destroy();return;}res.writeHead(503,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:'로컬 API 서버를 먼저 실행해 주세요.'}));});
      req.on('aborted',()=>upstream.destroy());req.pipe(upstream);return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    let file;
    try{file=resolve(publicRoot,'.'+decodeURIComponent(pathname==='/'?'/index.html':pathname));}catch{res.writeHead(400);res.end();return;}
    if(!file.startsWith(publicRoot+sep)){res.writeHead(403);res.end();return;}
    try{const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);}catch{res.writeHead(404);res.end();}
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const server=createPreviewServer();
  server.listen(4173,'127.0.0.1',()=>console.log('Local quiz: http://127.0.0.1:4173/\nLocal ranking: http://127.0.0.1:4173/ranking.html\nRun npm start in another terminal for the local API.'));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close(()=>process.exit(0));server.closeIdleConnections();});
}
