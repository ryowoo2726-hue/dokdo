const QUIZ_VERSION = 'dokdo-2026-v1';
const QUESTIONS = /*__QUESTIONS__*/;
const HEADERS = ['제출 시각','퀴즈 버전','응시 ID','학년','반','번호','이름','점수','정답 수','전체 문항 수','소요 시간(초)', ...QUESTIONS.map((q,i)=>'문항 '+(i+1)+' 응답'), '결과 JSON'];

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('마석중학교 독도 탐험 퀴즈').addMetaTag('viewport','width=device-width, initial-scale=1');
}

// 편집기에서 한 번 실행하세요. 끝에 _가 있는 함수는 학생의 브라우저에서 호출할 수 없습니다.
function setup_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SPREADSHEET_ID');
  if (!id) {
    const book = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('마석중학교 독도 퀴즈 응답');
    id = book.getId(); props.setProperty('SPREADSHEET_ID', id);
  }
  if (!props.getProperty('SIGNING_SECRET')) props.setProperty('SIGNING_SECRET', Utilities.getUuid()+Utilities.getUuid());
  const book = SpreadsheetApp.openById(id);
  let sheet = book.getSheetByName('퀴즈응답');
  if (!sheet) sheet = book.insertSheet('퀴즈응답');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,HEADERS.length).setBackground('#123d53').setFontColor('#ffffff').setFontWeight('bold');
    sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.autoResizeColumns(1,HEADERS.length-1);
    sheet.hideColumns(HEADERS.length);
  }
  Logger.log('응답 시트: '+book.getUrl());
}

function settings_() {
  const p=PropertiesService.getScriptProperties();
  const id=p.getProperty('SPREADSHEET_ID'), secret=p.getProperty('SIGNING_SECRET');
  if(!id || !secret) throw new Error('선생님이 아직 응답 시트를 연결하지 않았습니다.');
  return {id:id,secret:secret};
}
function validateStudent_(s) {
  if(!s || !Number.isInteger(s.grade) || s.grade<1 || s.grade>3 || !Number.isInteger(s.classroom) || s.classroom<1 || s.classroom>30 || !Number.isInteger(s.number) || s.number<1 || s.number>50 || typeof s.name!=='string' || !s.name.trim() || s.name.trim().length>20 || /[\x00-\x1f\x7f]/.test(s.name)) throw new Error('학년·반·번호·이름을 확인해 주세요.');
  return {grade:s.grade,classroom:s.classroom,number:s.number,name:s.name.trim()};
}
function startAttempt(student) {
  const cfg=settings_();
  const body={student:validateStudent_(student),started:Date.now(),id:Utilities.getUuid(),version:QUIZ_VERSION};
  const encoded=Utilities.base64EncodeWebSafe(JSON.stringify(body),Utilities.Charset.UTF_8);
  return {token:encoded+'.'+sign_(encoded,cfg.secret),questions:QUESTIONS.map(q=>({id:q.id,category:q.category,type:q.type,question:q.question,options:q.options||null,hint:q.hint||null}))};
}
function sign_(text,secret) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(text,secret)); }
function normalize_(value) { return String(value).normalize('NFKC').replace(/[\s,，·ㆍ、.\/&와과]/g,''); }
function grade_(answers) {
  if(!answers || typeof answers!=='object' || Array.isArray(answers)) throw new Error('응답 형식이 올바르지 않습니다.');
  return QUESTIONS.map(q=>{
    const value=answers[q.id];
    if(q.type==='choice' ? (!Number.isInteger(value)||value<0||value>=q.options.length) : (typeof value!=='string'||!value.trim()||value.length>100)) throw new Error('모든 문항에 답해 주세요.');
    const correct=q.type==='choice' ? value===q.answer : q.accepted.includes(normalize_(value));
    return {id:q.id,question:q.question,correct:correct,response:q.type==='choice'?q.options[value]:value,answer:q.type==='choice'?q.options[q.answer]:q.answer,explanation:q.explanation,source:q.source};
  });
}
function safeCell_(value) { return typeof value==='string' && /^[=+\-@\t\r\n]/.test(value) ? "'"+value : value; }
function submitAttempt(payload) {
  const cfg=settings_();
  if(!payload || typeof payload.token!=='string' || payload.token.length>3000) throw new Error('응시 정보가 올바르지 않습니다.');
  const parts=payload.token.split('.');
  if(parts.length!==2 || sign_(parts[0],cfg.secret)!==parts[1]) throw new Error('응시 정보가 올바르지 않습니다. 처음부터 다시 시작해 주세요.');
  let attempt;
  try { attempt=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString('UTF-8')); } catch(e) { throw new Error('응시 정보를 읽을 수 없습니다.'); }
  if(attempt.version!==QUIZ_VERSION || !Number.isFinite(attempt.started) || attempt.started>Date.now() || Date.now()-attempt.started>86400000) throw new Error('응시가 만료되었습니다. 처음부터 다시 시작해 주세요.');
  const student=validateStudent_(attempt.student);
  const details=grade_(payload.answers);
  const correct=details.filter(r=>r.correct).length;
  const result={saved:true,correct:correct,total:QUESTIONS.length,score:Math.round(correct/QUESTIONS.length*100),seconds:Math.max(1,Math.round((Date.now()-attempt.started)/1000)),details:details};
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(20000)) throw new Error('제출이 몰리고 있어요. 잠시 후 다시 제출해 주세요.');
  try {
    const sheet=SpreadsheetApp.openById(cfg.id).getSheetByName('퀴즈응답');
    if(!sheet || sheet.getRange(1,1,1,HEADERS.length).getValues()[0].join('|')!==HEADERS.join('|')) throw new Error('응답 시트의 열 구성이 변경되었습니다. 선생님에게 알려 주세요.');
    const last=sheet.getLastRow();
    const existing=last>1?sheet.getRange(2,3,last-1,1).createTextFinder(attempt.id).matchEntireCell(true).findNext():null;
    if(existing) return JSON.parse(sheet.getRange(existing.getRow(),HEADERS.length).getValue());
    const row=[new Date(),QUIZ_VERSION,attempt.id,student.grade,student.classroom,student.number,student.name,result.score,correct,QUESTIONS.length,result.seconds,...details.map(r=>r.response),JSON.stringify(result)];
    sheet.getRange(last+1,1,1,row.length).setValues([row.map(safeCell_)]);
    SpreadsheetApp.flush();
    return result;
  } finally { lock.releaseLock(); }
}
