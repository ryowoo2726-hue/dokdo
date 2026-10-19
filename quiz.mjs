export async function loadQuiz(){
  const response=await fetch(new URL('./questions.json',import.meta.url),{cache:'no-cache',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('문제를 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.');
  const questions=await response.json();
  if(!Array.isArray(questions)||!questions.length||questions.some(q=>!Array.isArray(q.options)||!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.options.length))throw Error('문제 파일을 확인해 주세요.');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(questions)));
  const quizVersion=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('').slice(0,16);
  return {questions,quizVersion};
}
export function gradeQuiz(questions,answers,seconds){
  const details=questions.map(q=>({id:q.id,question:q.question,correct:answers[q.id]===q.answer,response:q.options[answers[q.id]],answer:q.options[q.answer],explanation:q.explanation,source:q.source}));
  const correct=details.filter(d=>d.correct).length;
  return {correct,score:Math.round(correct/questions.length*100),total:questions.length,seconds,details};
}
