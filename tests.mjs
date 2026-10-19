import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHmac,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8').replace(/^\uFEFF/,'');
const source=read('apps-script/Code.gs');
const questions=JSON.parse(read('questions.json'));
const right=Object.fromEntries(questions.map(q=>[q.id,q.type==='choice'?q.answer:q.answer]));
const student={grade:2,classroom:3,number:12};
function fixture(){
  const rows=[];let released=0,fail=false,locked=true;let ctx;
  const sheet={getSheetId:()=>0,getLastRow:()=>rows.length+1,getMaxRows:()=>1000,getRange(row,col,height,width){return {getValues(){return row===1?[vm.runInContext('HEADERS',ctx)]:[];},getValue(){return rows[row-2][col-1];},setValues(values){if(fail)throw Error('Sheet failed');rows.push(...values);},createTextFinder(id){return {matchEntireCell(){return this;},findNext(){const index=rows.findIndex(r=>r[17]===id);return index<0?null:{getRow:()=>index+2};}};}};}};
  const props={SIGNING_SECRET:'test-key'};
  ctx=vm.createContext({Date,PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]})},Utilities:{getUuid:randomUUID,Charset:{UTF_8:'UTF-8'},base64EncodeWebSafe:t=>Buffer.from(t).toString('base64url'),base64DecodeWebSafe:t=>Buffer.from(t,'base64url'),computeHmacSha256Signature:(t,s)=>createHmac('sha256',s).update(t).digest(),newBlob:b=>({getDataAsString:()=>Buffer.from(b).toString('utf8')})},LockService:{getScriptLock:()=>({tryLock:()=>locked,releaseLock:()=>released++})},SpreadsheetApp:{openById:id=>{assert.equal(id,'1HoeMq08uSliTMTdgUy1EZznjR_9Mdmu5C1JoTshQUCI');return {getSheets:()=>[sheet]};},flush(){}}});
  vm.runInContext(source,ctx);
  return {ctx,rows,props,fail:()=>fail=true,noLock:()=>locked=false,get released(){return released;}};
}
test('student info contains only grade, classroom and number',()=>{const f=fixture();assert.deepEqual(JSON.parse(JSON.stringify(f.ctx.validateStudent_({...student,name:'discard'}))),student);assert.throws(()=>f.ctx.validateStudent_({...student,grade:4}));assert.throws(()=>f.ctx.validateStudent_({...student,number:1.5}));});
test('start requires notice acknowledgement and does not disclose answer key',()=>{const f=fixture();assert.throws(()=>f.ctx.startAttempt({student,consent:false}));const a=f.ctx.startAttempt({student,consent:true});assert.equal(a.questions.length,10);assert.ok(a.questions.every(q=>!('answer'in q)&&!('accepted'in q)));});
test('successful submission directly saves sheet row without a name field',()=>{const f=fixture();const a=f.ctx.startAttempt({student,consent:true});const r=f.ctx.submitAttempt({token:a.token,answers:right});assert.equal(r.score,100);assert.equal(r.storage,'sheet');assert.equal(r.receipt,'1');assert.equal(f.rows.length,1);assert.equal(f.rows[0].length,19);assert.deepEqual(Array.from(f.rows[0].slice(1,4)),[2,3,12]);assert.equal(f.rows[0][4],100);assert.equal(f.released,1);});
test('same-token retry returns original result and does not write duplicate row',()=>{const f=fixture();const a=f.ctx.startAttempt({student,consent:true});const first=f.ctx.submitAttempt({token:a.token,answers:right});const second=f.ctx.submitAttempt({token:a.token,answers:{...right,q1:0}});assert.equal(second.score,first.score);assert.equal(second.receipt,first.receipt);assert.equal(f.rows.length,1);});
test('failed sheet writes release lock and never return a saved result',()=>{const f=fixture();const a=f.ctx.startAttempt({student,consent:true});f.fail();assert.throws(()=>f.ctx.submitAttempt({token:a.token,answers:right}),/Sheet failed/);assert.equal(f.rows.length,0);assert.equal(f.released,1);});
test('busy lock and tampered token do not write',()=>{const f=fixture();const a=f.ctx.startAttempt({student,consent:true});assert.throws(()=>f.ctx.submitAttempt({token:a.token+'tamper',answers:right}));f.noLock();assert.throws(()=>f.ctx.submitAttempt({token:a.token,answers:right}),/몰리고/);assert.equal(f.rows.length,0);});
test('missing answers and formula-like input are handled',()=>{const f=fixture();assert.throws(()=>f.ctx.grade_({...right,q1:'2'}));assert.throws(()=>f.ctx.grade_({...right,q5:' '}));assert.equal(f.ctx.safeCell_(' =SUM(A1)'),"' =SUM(A1)");delete f.props.SIGNING_SECRET;assert.throws(()=>f.ctx.startAttempt({student,consent:true}),/setup_/);});
test('all questions use the supplied TXT format: seven 4-choice and three OX',()=>{assert.equal(questions.length,10);assert.equal(questions.filter(q=>q.options.length===4).length,7);assert.equal(questions.filter(q=>q.options.length===2).length,3);assert.ok(questions.every(q=>q.type==='choice'&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length));assert.deepEqual([right.q2,right.q7,right.q10],[1,1,0]);new vm.Script(read('app.js'));assert.ok(!read('index.html').includes('student-name'));assert.ok(!read('app.js').includes('student.name'));assert.ok(!read('app.js').includes('short-answer'));});
test('Pages bridge validates handshake, target, channel and response before resolving',async()=>{
  let listener,frame;const messages=[],timers=new Set();
  const window={QUIZ_CONFIG:{webAppUrl:'https://script.google.com/macros/s/test-deployment/exec'},addEventListener:(type,fn)=>listener=fn,removeEventListener(){}};
  const document={createElement:()=>frame={setAttribute(){},addEventListener(){},remove(){}},body:{append(){}}};
  const ctx=vm.createContext({window,document,URL,crypto:globalThis.crypto,Error,setTimeout:fn=>{timers.add(fn);return fn;},clearTimeout:fn=>timers.delete(fn)});
  vm.runInContext(read('sheets-bridge.js'),ctx);
  const result=window.QuizSheets.call('startAttempt',{student,consent:true});
  const channel=new URL(frame.src).searchParams.get('channel');assert.match(channel,/^[a-f0-9]{32}$/);assert.ok(!frame.src.includes('student'));
  const target={postMessage:(data,origin)=>messages.push({data,origin})};const origin='https://n-test-script.googleusercontent.com';
  listener({origin:'https://evil.test',source:target,data:{type:'DOKDO_READY',channel}});await Promise.resolve();assert.equal(messages.length,0);
  listener({origin,source:target,data:{type:'DOKDO_READY',channel}});await Promise.resolve();await Promise.resolve();assert.equal(messages.length,1);
  const id=messages[0].data.id;assert.equal(messages[0].data.method,'startAttempt');assert.equal(messages[0].origin,origin);
  let complete=false;result.then(()=>complete=true);
  listener({origin,source:{},data:{type:'DOKDO_RESULT',channel,id,result:{bad:true}}});await Promise.resolve();assert.equal(complete,false);
  listener({origin,source:target,data:{type:'DOKDO_RESULT',channel,id,result:{ok:true}}});assert.equal((await result).ok,true);assert.equal(timers.size,0);
});
test('Apps Script bridge accepts only the configured Pages origin and allowed methods',()=>{
  const replies=[],calls=[];let listener,success;
  const top={postMessage:(data,origin)=>replies.push({data,origin})};
  const window={top,addEventListener:(type,fn)=>listener=fn};
  const runner={withSuccessHandler(fn){success=fn;return this;},withFailureHandler(){return this;},startAttempt(payload){calls.push(payload);success({ok:true});}};
  const code=read('apps-script/Bridge.html').match(/<script>([\s\S]*?)<\/script>/)[1].replace('<?!= JSON.stringify(channel) ?>',JSON.stringify('a'.repeat(32))).replace('<?!= JSON.stringify(parentOrigin) ?>',JSON.stringify('https://ryowoo2726-hue.github.io'));
  vm.runInNewContext(code,{window,google:{script:{run:runner}}});assert.equal(replies[0].data.type,'DOKDO_READY');
  const data={channel:'a'.repeat(32),type:'DOKDO_CALL',id:'r1',method:'startAttempt',payload:{student}};
  listener({origin:'https://evil.test',source:top,data});assert.equal(calls.length,0);
  listener({origin:'https://ryowoo2726-hue.github.io',source:top,data:{...data,method:'setup_'}});assert.equal(calls.length,0);
  listener({origin:'https://ryowoo2726-hue.github.io',source:top,data});assert.equal(calls.length,1);assert.equal(replies[1].data.result.ok,true);
});
test('production build publishes only static assets without answer keys; URL is required',()=>{
  const previous=new Map(['dist/config.js','dist/questions.js'].filter(existsSync).map(path=>[path,read(path)]));
  try{
    const env={...process.env,APPS_SCRIPT_URL:'https://script.google.com/macros/s/test-deployment/exec'};
    execFileSync(process.execPath,['build.mjs','--require-live'],{env});
    const c={window:{}};vm.runInNewContext(read('dist/questions.js'),c);assert.ok(c.window.QUIZ_QUESTIONS.every(q=>!('answer'in q)&&!('explanation'in q)));assert.equal(c.window.DEMO_QUESTIONS,undefined);assert.ok(read('dist/config.js').includes('test-deployment'));
    assert.throws(()=>execFileSync(process.execPath,['build.mjs','--require-live'],{env:{...process.env,APPS_SCRIPT_URL:''},stdio:'pipe'}));
  }finally{if(previous.size===2){for(const [path,content]of previous)writeFileSync(path,content);}else execFileSync(process.execPath,['build.mjs'],{env:{...process.env,APPS_SCRIPT_URL:''}});}
});
