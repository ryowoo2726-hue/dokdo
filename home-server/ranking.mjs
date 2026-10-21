import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

export function loadRankingQuiz() {
  const questions=JSON.parse(readFileSync(new URL('../public/data/questions.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
  const quizVersion=createHash('sha256').update(JSON.stringify(questions)).digest('hex').slice(0,16);
  return {questions,quizVersion};
}

// 저장된 답안을 현재 문제 버전으로만 집계합니다. 응답 원문은 공개하지 않습니다.
export function buildRankings(rows,{questions,quizVersion}) {
  const entries=[];
  for(const row of rows) {
    try {
      const p=JSON.parse(row.payload);
      if(p.quizVersion!==quizVersion || !p.student || !p.answers ||
        !questions.every(q=>Number.isInteger(p.answers[q.id]) && p.answers[q.id]>=0 && p.answers[q.id]<q.options.length))continue;
      const correct=questions.filter(q=>p.answers[q.id]===q.answer).length;
      const {grade,classroom,number}=p.student;
      const student={grade,classroom,number};
      if(typeof p.student.nickname==='string')student.nickname=p.student.nickname;
      entries.push({student,score:Math.round(correct/questions.length*100),received:row.received});
    } catch { /* 이전 형식이나 손상된 기록은 랭킹에서 제외합니다. */ }
  }
  entries.sort((a,b)=>b.score-a.score || a.received.localeCompare(b.received));
  let rank=0;
  return entries.map((entry,i)=>{
    if(i===0 || entries[i-1].score!==entry.score)rank=i+1;
    return {rank,student:entry.student,score:entry.score};
  });
}
