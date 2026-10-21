const clock=new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
const clean=value=>String(value??'').replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').trim();

export function formatSubmission(entry){
  const s=entry.student;
  return `[${clock.format(new Date(entry.received))}] 저장 완료 | ${s.grade}학년 ${s.classroom}반 ${s.number}번 | ${clean(s.nickname)||'닉네임 없음'} | 누적 ${entry.total}명`;
}

export function attachSubmissionLog(server,write=console.log){
  const listener=entry=>write(formatSubmission(entry));
  server.on('submission-saved',listener);
  return ()=>server.off('submission-saved',listener);
}

export function printSummary(server,write=console.log){
  const snapshot=server.getMonitorSnapshot();
  write(`\n[현황 새로고침] 누적 ${snapshot.total}명 · 저장 대기 ${snapshot.pending}건`);
  for(const [i,entry] of snapshot.recent.slice(0,10).entries())write(formatSubmission({...entry,total:snapshot.total-i}));
  if(!snapshot.recent.length)write('아직 저장된 학생 응답이 없습니다.');
  return snapshot;
}
