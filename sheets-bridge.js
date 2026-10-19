// GitHub Pages 화면 ↔ Apps Script 사이의 저장 요청 연결.
// 개인정보는 URL에 넣지 않고 postMessage로 전달합니다.
'use strict';
window.QuizSheets = (()=>{
  let connection=null;
  const allowedOrigin=origin=>{try{const u=new URL(origin);return u.protocol==='https:'&&(u.hostname==='script.google.com'||u.hostname==='script.googleusercontent.com'||u.hostname.endsWith('-script.googleusercontent.com'));}catch{return false;}};
  function connect(){
    if(connection)return connection.promise;
    const endpoint=window.QUIZ_CONFIG?.webAppUrl;
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint||''))return Promise.reject(Error('Apps Script 웹 앱 주소를 확인해 주세요.'));
    const channel=crypto.randomUUID().replaceAll('-','');
    const frame=document.createElement('iframe');frame.hidden=true;frame.title='구글 시트 저장 연결';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');
    const pending=new Map();let target=null,targetOrigin=null,ready=false;
    let resolveReady,rejectReady;
    const promise=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
    const timer=setTimeout(()=>fail(Error('저장 서버 연결이 지연되고 있어요. 잠시 후 다시 시작해 주세요.')),30000);
    function fail(error){clearTimeout(timer);window.removeEventListener('message',onMessage);frame.remove();connection=null;rejectReady(error);}
    function onMessage(event){
      const d=event.data;if(!d||d.channel!==channel||!allowedOrigin(event.origin))return;
      if(d.type==='DOKDO_READY'&&!ready){target=event.source;targetOrigin=event.origin;if(!target)return;ready=true;clearTimeout(timer);resolveReady({call});return;}
      if(!ready||event.source!==target||event.origin!==targetOrigin||d.type!=='DOKDO_RESULT')return;
      const p=pending.get(d.id);if(!p)return;pending.delete(d.id);clearTimeout(p.timer);d.error?p.reject(Error(d.error)):p.resolve(d.result);
    }
    function call(method,payload){return new Promise((resolve,reject)=>{const id=crypto.randomUUID();const timer=setTimeout(()=>{pending.delete(id);reject(Error('저장 응답이 지연되고 있어요. 작성한 답으로 다시 제출해 주세요.'));},45000);pending.set(id,{resolve,reject,timer});try{target.postMessage({type:'DOKDO_CALL',channel,id,method,payload},targetOrigin);}catch(e){clearTimeout(timer);pending.delete(id);reject(e);}});}
    connection={promise};window.addEventListener('message',onMessage);frame.addEventListener('error',()=>{if(!ready)fail(Error('저장 서버를 불러오지 못했어요.'));});frame.src=endpoint+'?channel='+channel;document.body.append(frame);
    return promise;
  }
  return {async call(method,payload){return (await connect()).call(method,payload);}};
})();
