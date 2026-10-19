export function validateStudent(s){
  if(!s||!Number.isInteger(s.grade)||s.grade<1||s.grade>3||!Number.isInteger(s.classroom)||s.classroom<1||s.classroom>30||!Number.isInteger(s.number)||s.number<1||s.number>50)throw Error('학년·반·번호를 확인해 주세요.');
  return {grade:s.grade,classroom:s.classroom,number:s.number};
}
export const studentKey=s=>`${s.grade}-${s.classroom}-${s.number}`;
export function validate(p){
  if(!p||!/^\w{8}-\w{4}-4\w{3}-[89ab]\w{3}-\w{12}$/i.test(p.id||''))throw Error('접수번호가 올바르지 않습니다.');
  if(!/^[a-f0-9]{16}$/i.test(p.quizVersion||''))throw Error('문제 버전이 올바르지 않습니다.');
  const student=validateStudent(p.student);
  if(!Number.isSafeInteger(p.started)||p.started<0||p.started>Date.now()+60000)throw Error('시작 시간이 올바르지 않습니다.');
  const entries=p.answers&&typeof p.answers==='object'&&!Array.isArray(p.answers)?Object.entries(p.answers):[];
  if(entries.length<1||entries.length>100||entries.some(([id,value])=>!/^[-\w]{1,64}$/.test(id)||!Number.isInteger(value)||value<0||value>99))throw Error('답안 형식이 올바르지 않습니다.');
  return {id:p.id,quizVersion:p.quizVersion,student,started:p.started,answers:Object.fromEntries(entries.sort(([a],[b])=>a.localeCompare(b,'en',{numeric:true})))};
}
export const savedReceipt=p=>({saved:true,storage:'local',receipt:p.id});
