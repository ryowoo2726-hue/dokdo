import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const questions=JSON.parse(readFileSync(new URL('../questions.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
export const quizVersion=createHash('sha256').update(JSON.stringify(questions)).digest('hex').slice(0,16);
export function validateStudent(s){
  if(!s||!Number.isInteger(s.grade)||s.grade<1||s.grade>3||!Number.isInteger(s.classroom)||s.classroom<1||s.classroom>30||!Number.isInteger(s.number)||s.number<1||s.number>50)throw Error('학년·반·번호를 확인해 주세요.');
  return {grade:s.grade,classroom:s.classroom,number:s.number};
}
export const studentKey=s=>`${s.grade}-${s.classroom}-${s.number}`;
export function validate(p){
  if(!p||!/^\w{8}-\w{4}-4\w{3}-[89ab]\w{3}-\w{12}$/i.test(p.id||''))throw Error('접수번호가 올바르지 않습니다.');
  if(p.quizVersion!==quizVersion)throw Error('문제가 변경되었습니다. 새로고침 후 다시 시작해 주세요.');
  const s=validateStudent(p.student);
  if(!Number.isSafeInteger(p.started)||p.started<0||p.started>Date.now()+60000)throw Error('시작 시간이 올바르지 않습니다.');
  if(!p.answers||Object.keys(p.answers).length!==questions.length||questions.some(q=>!Number.isInteger(p.answers[q.id])||p.answers[q.id]<0||p.answers[q.id]>=q.options.length))throw Error('모든 문제에 답해 주세요.');
  return {id:p.id,quizVersion,student:{grade:s.grade,classroom:s.classroom,number:s.number},started:p.started,answers:Object.fromEntries(questions.map(q=>[q.id,p.answers[q.id]]))};
}
export function grade(p){
  const details=questions.map(q=>({id:q.id,question:q.question,correct:p.answers[q.id]===q.answer,response:q.options[p.answers[q.id]],answer:q.options[q.answer],explanation:q.explanation,source:q.source}));
  const correct=details.filter(d=>d.correct).length;
  return {saved:true,storage:'local',receipt:p.id,correct,score:correct*10,total:questions.length,seconds:Math.max(1,Math.round((Date.now()-p.started)/1000)),details};
}
