import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {studentKey} from './core.mjs';

export function loadRankingQuiz() {
  const questions=JSON.parse(readFileSync(new URL('../public/data/questions.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
  const quizVersion=createHash('sha256').update(JSON.stringify(questions)).digest('hex').slice(0,16);
  return {questions,quizVersion};
}

// 저장된 답안을 현재 문제 버전으로만 집계합니다. 응답 원문은 공개하지 않습니다.
export function buildRankings(rows,{questions,quizVersion},roster=new Map()) {
  const entries=[];
  for(const row of rows) {
    try {
      const p=JSON.parse(row.payload);
      if(p.quizVersion!==quizVersion || !p.student || !p.answers ||
        !questions.every(q=>Number.isInteger(p.answers[q.id]) && p.answers[q.id]>=0 && p.answers[q.id]<q.options.length))continue;
      const correct=questions.filter(q=>p.answers[q.id]===q.answer).length;
      const {grade,classroom,number}=p.student;
      const student={grade,classroom,number};
      const name=roster.get(studentKey(student));
      if(name)student.name=name;
      if(typeof p.student.nickname==='string')student.nickname=p.student.nickname;
      const elapsed=(Date.parse(row.received)-p.started)/1000;
      const seconds=Number.isFinite(elapsed)&&Number.isSafeInteger(p.started)&&elapsed>=0?Math.max(1,Math.round(elapsed)):null;
      entries.push({student,score:Math.round(correct/questions.length*100),seconds,received:row.received});
    } catch { /* 이전 형식이나 손상된 기록은 랭킹에서 제외합니다. */ }
  }
  entries.sort((a,b)=>b.score-a.score || a.received.localeCompare(b.received));
  let rank=0;
  return entries.map((entry,i)=>{
    if(i===0 || entries[i-1].score!==entry.score)rank++;
    return {rank,student:entry.student,score:entry.score,seconds:entry.seconds};
  });
}
