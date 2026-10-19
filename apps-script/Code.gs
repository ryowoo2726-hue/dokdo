const QUIZ_VERSION = 'dokdo-2026-v1';
const QUESTIONS = [
  {
    "id": "q1",
    "category": "역사 · 기념일",
    "type": "choice",
    "question": "1900년 독도를 울도군의 관할 구역으로 명시한 칙령 제41호를 재가한 황제는 누구일까요?",
    "options": [
      "세종",
      "정조",
      "고종",
      "순종"
    ],
    "answer": 2,
    "explanation": "고종 황제는 1900년 10월 25일 칙령 제41호를 재가했습니다. 제2조는 울도군의 관할 구역에 울릉전도·죽도·석도를 명시했습니다.",
    "source": "https://dokdo.mofa.go.kr/kor/dokdo/faq.jsp?q=5"
  },
  {
    "id": "q2",
    "category": "지리 · 섬의 구성",
    "type": "text",
    "question": "독도를 이루는 두 개의 큰 섬 이름을 모두 적어 주세요.",
    "hint": "두 이름 사이에 쉼표나 띄어쓰기를 넣어도 괜찮아요.",
    "answer": "동도, 서도",
    "accepted": [
      "동도서도",
      "서도동도"
    ],
    "explanation": "독도는 동도와 서도, 주변의 부속 바위섬으로 이루어져 있습니다.",
    "source": "https://dokdo.mofa.go.kr/kor/introduce/management.jsp"
  },
  {
    "id": "q3",
    "category": "지리 · 행정구역",
    "type": "choice",
    "question": "독도의 행정구역으로 알맞은 것은 무엇일까요?",
    "options": [
      "강원특별자치도 강릉시 독도리",
      "경상북도 포항시 독도읍",
      "경상북도 울릉군 울릉읍 독도리",
      "부산광역시 기장군 독도리"
    ],
    "answer": 2,
    "explanation": "독도는 경상북도 울릉군 울릉읍 독도리에 속합니다.",
    "source": "https://www.dokdo.re.kr/home/cms/cmsCont.do?cntnts_sn=63"
  },
  {
    "id": "q4",
    "category": "역사 · 우산국",
    "type": "choice",
    "question": "512년 신라의 이사부가 복속시킨, 울릉도와 독도에 관련된 나라는 무엇일까요?",
    "options": [
      "우산국",
      "탐라국",
      "가야국",
      "동예"
    ],
    "answer": 0,
    "explanation": "『삼국사기』에는 512년 이사부가 우산국을 복속시켰다는 기록이 있습니다.",
    "source": "https://theme.archives.go.kr/next/dokdo/primary.do"
  },
  {
    "id": "q5",
    "category": "역사 · 우리 인물",
    "type": "text",
    "question": "조선 숙종 때 일본에 건너가 울릉도와 독도가 조선의 영토임을 주장한 인물은 누구일까요?",
    "hint": "세 글자 이름을 적어 주세요.",
    "answer": "안용복",
    "accepted": [
      "안용복"
    ],
    "explanation": "안용복은 1693년과 1696년 일본에 건너갔으며, 울릉도와 독도에 대한 조선의 영유권을 주장한 인물입니다.",
    "source": "https://theme.archives.go.kr/next/dokdo/primary.do"
  },
  {
    "id": "q6",
    "category": "역사 · 섬의 이름",
    "type": "choice",
    "question": "다음 중 독도를 가리킨 이름이 아닌 것은 무엇일까요?",
    "options": [
      "우산도",
      "가지도",
      "석도",
      "이어도"
    ],
    "answer": 3,
    "explanation": "이어도는 제주도 남서쪽 해역에 있는 수중 암초입니다. 우산도·가지도·석도는 독도와 관련된 역사적 이름입니다.",
    "source": "https://dokdo.mofa.go.kr/kor/dokdo/faq.jsp"
  },
  {
    "id": "q7",
    "category": "자연 · 화산섬",
    "type": "text",
    "question": "제주도, 울릉도, 독도 중 가장 먼저 형성된 화산섬은 어디일까요?",
    "hint": "섬 이름을 적어 주세요.",
    "answer": "독도",
    "accepted": [
      "독도"
    ],
    "explanation": "독도는 약 460만~250만 년 전 화산 활동으로 만들어져, 울릉도와 제주도보다 먼저 형성되었습니다.",
    "source": "https://www.dokdo.re.kr/"
  },
  {
    "id": "q8",
    "category": "자연 · 해양 자원",
    "type": "choice",
    "question": "동해 해저에서 발견되며, 메탄 등이 물 분자와 결합해 얼음처럼 보이는 ‘불타는 얼음’은 무엇일까요?",
    "options": [
      "셰일가스",
      "가스 하이드레이트",
      "역청탄",
      "망간단괴"
    ],
    "answer": 1,
    "explanation": "가스 하이드레이트는 낮은 온도와 높은 압력에서 가스와 물이 결합한 고체 물질입니다. 메탄은 온실가스이므로 자원 개발과 환경 영향을 함께 살펴야 합니다.",
    "source": "https://www.kigam.re.kr/"
  },
  {
    "id": "q9",
    "category": "생태 · 기억할 생명",
    "type": "choice",
    "question": "과거 독도에 살았으나 무분별한 포획 등으로 사라진 바다사자류는 무엇일까요?",
    "options": [
      "독도강치",
      "하프물범",
      "북극곰",
      "상괭이"
    ],
    "answer": 0,
    "explanation": "독도강치는 독도를 대표하던 해양 포유류였습니다. 강치의 역사는 해양 생태계와 생명 보호의 중요성을 알려 줍니다.",
    "source": "https://www.dokdo.re.kr/"
  },
  {
    "id": "q10",
    "category": "현대사 · 독도 수호",
    "type": "text",
    "question": "홍순칠을 비롯한 울릉도 주민들이 자발적으로 조직해 독도를 지킨 민간 수비대의 이름은 무엇일까요?",
    "hint": "‘독도’로 시작하는 단체 이름이에요.",
    "answer": "독도의용수비대",
    "accepted": [
      "독도의용수비대"
    ],
    "explanation": "독도의용수비대는 홍순칠을 비롯한 울릉도 주민들이 결성하여 독도 수호에 힘쓴 민간 조직입니다.",
    "source": "https://www.dokdofoundation.or.kr/"
  }
];
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
