// 이 파일과 Bridge.html 두 개를 Apps Script에 넣습니다. 학생 화면은 GitHub Pages입니다.
const SPREADSHEET_ID = '1HoeMq08uSliTMTdgUy1EZznjR_9Mdmu5C1JoTshQUCI';
const SHEET_ID = 0;
const QUIZ_VERSION = 'dokdo-choice-v1';
const PAGES_ORIGIN = 'https://ryowoo2726-hue.github.io';
const QUESTIONS = [{"id":"q1","category":"역사 · 기념일","type":"choice","question":"1900년 독도를 울도군의 관할 구역으로 명시한 칙령 제41호를 재가한 황제는 누구일까요?","options":["세종대왕","정조","고종","순종"],"answer":2,"explanation":"고종 황제는 1900년 10월 25일 칙령 제41호를 재가했습니다. 제2조는 울도군의 관할 구역에 울릉전도·죽도·석도를 명시했습니다.","source":"https://dokdo.mofa.go.kr/kor/dokdo/faq.jsp?q=5"},{"id":"q2","category":"지리 · 섬의 구성","type":"choice","question":"독도는 단 1개의 큰 섬으로만 이루어져 있다?","options":["O","X"],"answer":1,"explanation":"독도는 동도와 서도라는 2개의 큰 섬과 주변의 89개 부속 바위섬을 합쳐 총 91개의 섬으로 이루어져 있습니다.","source":"https://dokdo.mofa.go.kr/kor/introduce/management.jsp"},{"id":"q3","category":"지리 · 행정구역","type":"choice","question":"독도의 행정구역으로 알맞은 것은 무엇일까요?","options":["강원특별자치도 강릉시 독도리","경상북도 포항시 독도읍","경상북도 울릉군 울릉읍 독도리","부산광역시 기장군 독도리"],"answer":2,"explanation":"독도는 경상북도 울릉군 울릉읍 독도리에 속합니다.","source":"https://www.dokdo.re.kr/home/cms/cmsCont.do?cntnts_sn=63"},{"id":"q4","category":"역사 · 우산국","type":"choice","question":"512년 신라의 이사부가 복속시킨, 울릉도와 독도에 관련된 나라는 무엇일까요?","options":["우산국","탐라국","가야국","동예"],"answer":0,"explanation":"『삼국사기』에는 512년 이사부가 우산국을 복속시켰다는 기록이 있습니다.","source":"https://theme.archives.go.kr/next/dokdo/primary.do"},{"id":"q5","category":"역사 · 우리 인물","type":"choice","question":"조선 숙종 때 일본에 건너가 울릉도와 독도가 조선의 영토임을 주장한 인물은 누구일까요?","options":["장보고","안용복","최무선","김정호"],"answer":1,"explanation":"안용복은 1693년과 1696년 일본에 건너갔으며, 울릉도와 독도에 대한 조선의 영유권을 주장한 인물입니다.","source":"https://theme.archives.go.kr/next/dokdo/primary.do"},{"id":"q6","category":"역사 · 섬의 이름","type":"choice","question":"다음 중 독도의 옛 이름이 아닌 것은 무엇일까요?","options":["우산도(于山島)","삼봉도(三峰島)","가지도(可支島)","이어도(離於島)"],"answer":3,"explanation":"독도는 역사 기록에서 우산도·삼봉도·가지도·석도 등으로 불렸습니다. 이어도는 제주도 남서쪽 해역에 있는 수중 암초입니다.","source":"https://dokdo.mofa.go.kr/kor/dokdo/faq.jsp"},{"id":"q7","category":"자연 · 화산섬","type":"choice","question":"제주도, 울릉도, 독도 중 가장 먼저 만들어진 화산섬은 제주도이다?","options":["O","X"],"answer":1,"explanation":"세 화산섬 중 가장 먼저 형성된 섬은 독도입니다. 독도는 약 460만~250만 년 전 화산 활동으로 만들어져 울릉도와 제주도보다 먼저 형성되었습니다.","source":"https://www.dokdo.re.kr/"},{"id":"q8","category":"자연 · 해양 자원","type":"choice","question":"동해 해저에서 발견되며, 메탄 등이 물 분자와 결합해 얼음처럼 보이는 ‘불타는 얼음’은 무엇일까요?","options":["셰일가스","가스 하이드레이트","역청탄","망간단괴"],"answer":1,"explanation":"가스 하이드레이트는 낮은 온도와 높은 압력에서 가스와 물이 결합한 고체 물질입니다. 메탄은 온실가스이므로 자원 개발과 환경 영향을 함께 살펴야 합니다.","source":"https://www.kigam.re.kr/"},{"id":"q9","category":"생태 · 기억할 생명","type":"choice","question":"과거 독도에 살았으나 무분별한 포획 등으로 사라진 바다사자류는 무엇일까요?","options":["독도강치","하프물범","북극곰","상괭이"],"answer":0,"explanation":"독도강치는 독도를 대표하던 해양 포유류였습니다. 강치의 역사는 해양 생태계와 생명 보호의 중요성을 알려 줍니다.","source":"https://www.dokdo.re.kr/"},{"id":"q10","category":"현대사 · 독도 수호","type":"choice","question":"홍순칠을 비롯한 울릉도 청년들이 자발적으로 결성해 독도를 지킨 민간 수비대의 이름은 독도의용수비대이다?","options":["O","X"],"answer":0,"explanation":"독도의용수비대는 홍순칠을 비롯한 울릉도 주민들이 자발적으로 결성하여 독도 수호에 힘쓴 민간 조직입니다.","source":"https://www.dokdofoundation.or.kr/"}]; // __GENERATED_QUESTIONS__
const HEADERS = ['제출 시각','학년','반','번호','점수','정답 수','소요 시간(초)',...QUESTIONS.map((_,i)=>'문항 '+(i+1)+' 응답'),'응시 ID','결과 JSON'];

function sheet_(){const sheet=SpreadsheetApp.openById(SPREADSHEET_ID).getSheets().find(s=>s.getSheetId()===SHEET_ID);if(!sheet)throw new Error('응답 시트를 찾지 못했습니다.');return sheet;}
function doGet(e){const template=HtmlService.createTemplateFromFile('Bridge');const channel=e&&e.parameter&&e.parameter.channel;template.channel=/^[a-f0-9]{32}$/.test(channel||'')?channel:'';template.parentOrigin=PAGES_ORIGIN;return template.evaluate().setTitle('독도 퀴즈 저장 연결').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);}

// 편집기에서 한 번 실행합니다. 학생 화면에서는 _로 끝나는 함수를 호출할 수 없습니다.
function setup_(){
  const p=PropertiesService.getScriptProperties();
  if(!p.getProperty('SIGNING_SECRET'))p.setProperty('SIGNING_SECRET',Utilities.getUuid()+Utilities.getUuid());
  const sheet=sheet_();
  if(sheet.getLastRow()===0)sheet.getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
  checkHeaders_(sheet);
  SpreadsheetApp.openById(SPREADSHEET_ID).setSpreadsheetTimeZone('Asia/Seoul');
  sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,HEADERS.length).setBackground('#2282dc').setFontColor('#ffffff').setFontWeight('bold');
  sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sheet.hideColumns(HEADERS.length-1,2);
  Logger.log('설정 완료. 웹 앱으로 배포하세요.');
}
function checkHeaders_(sheet){if(sheet.getRange(1,1,1,HEADERS.length).getValues()[0].join('|')!==HEADERS.join('|'))throw new Error('시트 첫 행의 제목을 변경하지 마세요.');}
function secret_(){const secret=PropertiesService.getScriptProperties().getProperty('SIGNING_SECRET');if(!secret)throw new Error('선생님이 Apps Script에서 setup_ 함수를 먼저 실행해야 합니다.');return secret;}
function validateStudent_(s){
  if(!s||!Number.isInteger(s.grade)||s.grade<1||s.grade>3||!Number.isInteger(s.classroom)||s.classroom<1||s.classroom>30||!Number.isInteger(s.number)||s.number<1||s.number>50)throw new Error('학년·반·번호를 확인해 주세요.');
  return {grade:s.grade,classroom:s.classroom,number:s.number};
}
function sign_(body,secret){return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(body,secret));}
function startAttempt(payload){
  if(!payload||payload.consent!==true)throw new Error('참여 정보 수집 안내를 확인해 주세요.');
  const secret=secret_();
  const attempt={id:Utilities.getUuid(),student:validateStudent_(payload.student),started:Date.now(),version:QUIZ_VERSION};
  const body=Utilities.base64EncodeWebSafe(JSON.stringify(attempt),Utilities.Charset.UTF_8);
  return {token:body+'.'+sign_(body,secret),questions:QUESTIONS.map(q=>({id:q.id,category:q.category,type:q.type,question:q.question,options:q.options||null,hint:q.hint||null}))};
}
function grade_(answers){
  if(!answers||typeof answers!=='object'||Array.isArray(answers))throw new Error('응답 형식이 올바르지 않습니다.');
  return QUESTIONS.map(q=>{const v=answers[q.id];if(!Number.isInteger(v)||v<0||v>=q.options.length)throw new Error('모든 문항에 답해 주세요.');
    return {id:q.id,question:q.question,correct:v===q.answer,response:q.options[v],answer:q.options[q.answer],explanation:q.explanation,source:q.source};});
}
function safeCell_(v){return typeof v==='string'&&/^[\s]*[=+\-@]/.test(v)?"'"+v:v;}
function submitAttempt(payload){
  const secret=secret_();
  if(!payload||typeof payload.token!=='string'||payload.token.length>3000)throw new Error('응시 정보가 올바르지 않습니다.');
  const parts=payload.token.split('.');
  if(parts.length!==2||sign_(parts[0],secret)!==parts[1])throw new Error('응시 정보가 올바르지 않습니다. 처음부터 다시 시작해 주세요.');
  let attempt;
  try{attempt=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString('UTF-8'));}catch(e){throw new Error('응시 정보를 읽을 수 없습니다.');}
  if(attempt.version!==QUIZ_VERSION||!Number.isFinite(attempt.started)||attempt.started>Date.now()||Date.now()-attempt.started>86400000)throw new Error('응시가 만료되었습니다. 처음부터 다시 시작해 주세요.');
  const student=validateStudent_(attempt.student);
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(20000))throw new Error('제출이 몰리고 있어요. 잠시 후 다시 제출해 주세요.');
  try{
    const sheet=sheet_();checkHeaders_(sheet);const last=sheet.getLastRow();
    const found=last>1?sheet.getRange(2,HEADERS.length-1,last-1,1).createTextFinder(attempt.id).matchEntireCell(true).findNext():null;
    if(found)return JSON.parse(sheet.getRange(found.getRow(),HEADERS.length).getValue());
    const details=grade_(payload.answers),correct=details.filter(d=>d.correct).length;
    const result={saved:true,storage:'sheet',receipt:String(last),correct,total:QUESTIONS.length,score:Math.round(correct/QUESTIONS.length*100),seconds:Math.max(1,Math.round((Date.now()-attempt.started)/1000)),details};
    const row=[new Date(),student.grade,student.classroom,student.number,result.score,correct,result.seconds,...details.map(d=>d.response),attempt.id,JSON.stringify(result)];
    if(last+1>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),100);
    sheet.getRange(last+1,1,1,row.length).setValues([row.map(safeCell_)]);
    SpreadsheetApp.flush();
    return result;
  }finally{lock.releaseLock();}
}
