'use strict';
import {apiBase} from './api.mjs';

/* ==========================================================================
   마석중학교 10월 독도의 달 퀴즈 - 실시간 랭킹 대시보드 에셋 모듈 (ranking.js)
   요청하신 4가지 디자인 요소를 각각 독립된 에셋 생성 함수로 분리하여 관리합니다.
   ========================================================================== */

/**
 * [요소 2] 1등~3등 금·은·동 숫자 표시 에셋 생성
 * 1~3등은 전용 SVG 금·은·동 숫자 에셋(assets/rank-1-gold.svg 등)을 사용하고,
 * 4등 이하는 원형 숫자 배지로 렌더링합니다.
 * @param {number} rank 순위 (1, 2, 3, 4...)
 * @returns {HTMLElement}
 */
export function createRankBadgeAsset(rank) {
  const badge = document.createElement('div');
  badge.setAttribute('aria-label', `${rank}등`);

  if (rank === 1) {
    badge.className = 'rank-badge-asset';
    const img = document.createElement('img');
    img.src = './assets/rank-1-gold.svg';
    img.alt = '1등 금메달';
    badge.append(img);
  } else if (rank === 2) {
    badge.className = 'rank-badge-asset';
    const img = document.createElement('img');
    img.src = './assets/rank-2-silver.svg';
    img.alt = '2등 은메달';
    badge.append(img);
  } else if (rank === 3) {
    badge.className = 'rank-badge-asset';
    const img = document.createElement('img');
    img.src = './assets/rank-3-bronze.svg';
    img.alt = '3등 동메달';
    badge.append(img);
  } else {
    badge.className = 'rank-badge-asset normal';
    badge.textContent = String(rank);
  }

  return badge;
}

/**
 * [요소 3] 학생 학번과 닉네임이 들어갈 칸 에셋 생성
 * @param {{ studentId: string, gradeText?: string, nickname: string, isMe?: boolean, standalone?: boolean }} data
 * @returns {HTMLElement}
 */
export function createStudentSlotAsset({ studentId, gradeText = '', nickname, isMe = false, standalone = false }) {
  const slot = document.createElement('div');
  slot.className = standalone ? 'rank-student-slot standalone-box' : 'rank-student-slot';

  const metaLine = document.createElement('div');
  metaLine.className = 'student-meta-line';

  const idChip = document.createElement('span');
  idChip.className = 'student-id-chip';
  idChip.textContent = studentId;
  metaLine.append(idChip);

  if (gradeText) {
    const gradeSpan = document.createElement('span');
    gradeSpan.className = 'student-grade-label';
    gradeSpan.textContent = gradeText;
    metaLine.append(gradeSpan);
  }

  if (isMe) {
    const meTag = document.createElement('span');
    meTag.className = 'student-me-tag';
    meTag.textContent = '내 순위';
    metaLine.append(meTag);
  }

  const nickEl = document.createElement('strong');
  nickEl.className = 'student-nickname';
  nickEl.textContent = nickname;

  slot.append(metaLine, nickEl);
  return slot;
}

/**
 * [요소 4] 점수가 들어갈 칸 에셋 생성
 * @param {{ score: number, timeText?: string, isTop?: boolean }} data
 * @returns {HTMLElement}
 */
export function createScoreSlotAsset({ score, timeText = '', isTop = false }) {
  const wrap = document.createElement('div');
  wrap.className = 'rank-score-slot';

  const pill = document.createElement('div');
  pill.className = isTop ? 'rank-score-pill is-top-score' : 'rank-score-pill';

  const num = document.createElement('span');
  num.className = 'rank-score-number';
  num.textContent = String(score);

  const unit = document.createElement('small');
  unit.className = 'rank-score-unit';
  unit.textContent = '점';

  pill.append(num, unit);
  wrap.append(pill);

  if (timeText) {
    const timeEl = document.createElement('span');
    timeEl.className = 'rank-score-time';
    timeEl.textContent = timeText;
    wrap.append(timeEl);
  }

  return wrap;
}

/**
 * [요소 1] 현재 UI 기반 단일 랭킹 행(Row) 조합 에셋 생성
 * 요소 2(순위 배지) + 요소 3(학번/닉네임 칸) + 요소 4(점수 칸)를 하나의 카드로 결합합니다.
 * @param {{ rank: number, studentId: string, gradeText?: string, nickname: string, score: number, timeText?: string, isMe?: boolean }} entry
 * @returns {HTMLLIElement}
 */
export function createRankRowAsset(entry) {
  const li = document.createElement('li');
  const topCls = entry.rank === 1 ? ' is-top-1' : entry.rank === 2 ? ' is-top-2' : entry.rank === 3 ? ' is-top-3' : '';
  const meCls = entry.isMe ? ' is-me' : '';
  li.className = `rank-row-asset${topCls}${meCls}`;

  const badgeAsset = createRankBadgeAsset(entry.rank);
  const studentAsset = createStudentSlotAsset({
    studentId: entry.studentId,
    gradeText: entry.gradeText,
    nickname: entry.gradeText,
    isMe: entry.isMe
  });
  const scoreAsset = createScoreSlotAsset({
    score: entry.score,
    timeText: entry.timeText,
    isTop: entry.rank <= 3
  });

  const nicknameAsset=document.createElement('div');
  nicknameAsset.className='rank-nickname-slot';
  nicknameAsset.textContent=entry.nickname||'—';
  li.append(badgeAsset, studentAsset, nicknameAsset, scoreAsset);
  return li;
}

// 실제 서버의 집계 결과만 표시합니다. 연결 실패 시 이전 데이터도 비웁니다.
const list=document.getElementById('rank-list');
const viewport=document.getElementById('rank-scroll-window');
const toggle=document.getElementById('rank-scroll-toggle');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let signature='',paused=false,pauseUntil=performance.now()+2500,lastFrame=0,scrollPosition=0,hovered=false,focused=false,animationFrame=0;

function resetScroll(){viewport.scrollTop=0;scrollPosition=0;pauseUntil=performance.now()+2500;}
function updateScrollControl(){
  const overflow=viewport.scrollHeight>viewport.clientHeight+1;
  toggle.hidden=!overflow;
  const stopped=paused||reducedMotion.matches;
  toggle.disabled=reducedMotion.matches;
  toggle.textContent=reducedMotion.matches?'동작 줄이기 설정 적용 중':stopped?'자동 스크롤 시작하기':'자동 스크롤 멈추기';
  toggle.setAttribute('aria-pressed',String(stopped));
  if(overflow&&!stopped&&!document.hidden){
    if(!animationFrame)animationFrame=requestAnimationFrame(animate);
  }else if(animationFrame){
    cancelAnimationFrame(animationFrame);animationFrame=0;lastFrame=0;
  }
}
function clearRankings(message){
  signature='';list.replaceChildren();resetScroll();
  document.getElementById('rank-participant-count').textContent='—';
  document.getElementById('rank-status').textContent=message;
  document.getElementById('rank-connection').dataset.state='offline';
  document.getElementById('rank-connection-text').textContent='연결 대기 중';
  updateScrollControl();
}
async function refresh(){
  if(document.hidden)return;
  try {
    const response=await fetch(apiBase+'/api/rankings',{cache:'no-store',signal:AbortSignal.timeout(7000)});
    if(!response.ok)throw Error('unavailable');
    const data=await response.json();
    if(!Array.isArray(data.rankings)||data.participants!==data.rankings.length||!data.rankings.every(e=>Number.isInteger(e.rank)&&e.rank>0&&Number.isInteger(e.score)&&e.score>=0&&e.score<=100&&e.student&&Number.isInteger(e.student.grade)&&Number.isInteger(e.student.classroom)&&Number.isInteger(e.student.number)))throw Error('invalid');
    const nextSignature=JSON.stringify(data.rankings);
    if(signature!==nextSignature){
      signature=nextSignature;
      const rows=data.rankings.map(e=>{
        const {grade,classroom,number}=e.student;
        return createRankRowAsset({rank:e.rank,studentId:`${grade}${String(classroom).padStart(2,'0')}${String(number).padStart(2,'0')}`,gradeText:`${grade}학년 ${classroom}반 ${number}번`,nickname:e.student.nickname||'',score:e.score});
      });
      const previousScroll=viewport.scrollTop;
      list.replaceChildren(...rows);
      viewport.scrollTop=previousScroll;scrollPosition=viewport.scrollTop;
    }
    document.getElementById('rank-participant-count').textContent=`${data.participants}명`;
    document.getElementById('rank-status').textContent=data.participants?'독도를 알아간 친구들을 만나 보세요.':'아직 등록된 랭킹이 없어요.';
    document.getElementById('rank-connection').dataset.state='live';
    document.getElementById('rank-connection-text').textContent='실시간 랭킹 보드';
    updateScrollControl();
  }catch{clearRankings('서버 연결을 기다리고 있어요.');}
}
function animate(now){
  animationFrame=0;
  const elapsed=Math.min((now-lastFrame)/1000,.1);lastFrame=now;
  const max=viewport.scrollHeight-viewport.clientHeight;
  if(max>1&&!paused&&!reducedMotion.matches&&!document.hidden&&!hovered&&!focused&&now>pauseUntil){
    if(viewport.scrollTop>=max-1){resetScroll();}
    else {scrollPosition=Math.min(max,scrollPosition+elapsed*18);viewport.scrollTop=scrollPosition;if(scrollPosition>=max-1)pauseUntil=now+3500;}
  }
  if(max>1&&!paused&&!reducedMotion.matches&&!document.hidden)animationFrame=requestAnimationFrame(animate);
}
toggle.addEventListener('click',()=>{paused=!paused;updateScrollControl();});
viewport.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hovered=true;});
viewport.addEventListener('pointerleave',()=>{hovered=false;pauseUntil=performance.now()+2000;});
viewport.addEventListener('focusin',()=>{focused=true;});
viewport.addEventListener('focusout',()=>{focused=false;pauseUntil=performance.now()+2000;});
for(const event of ['wheel','touchstart','keydown'])viewport.addEventListener(event,()=>{pauseUntil=performance.now()+5000;},{passive:true});
viewport.addEventListener('scroll',()=>{scrollPosition=viewport.scrollTop;},{passive:true});
new ResizeObserver(updateScrollControl).observe(viewport);
reducedMotion.addEventListener('change',updateScrollControl);
document.addEventListener('visibilitychange',()=>{updateScrollControl();if(!document.hidden){pauseUntil=performance.now()+2500;refresh();}});
refresh();setInterval(refresh,10000);
