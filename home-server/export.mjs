import {DatabaseSync} from 'node:sqlite';
import {writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';
const directory=process.env.DOKDO_DATA_DIR||join(process.env.LOCALAPPDATA||homedir(),'MaseokDokdo');
const db=new DatabaseSync(join(directory,'responses.sqlite'),{readOnly:true});
const records=db.prepare('SELECT id,received,payload FROM responses ORDER BY received,id').all().map(r=>({...r,payload:JSON.parse(r.payload)}));
const questionIds=[...new Set(records.flatMap(r=>Object.keys(r.payload.answers)))].sort((a,b)=>a.localeCompare(b,'en',{numeric:true}));
const rows=[['접수번호','제출시각(UTC)','학년','반','번호','문제 버전',...questionIds.map(id=>`${id} 선택번호`)]];
for(const r of records){
  const p=r.payload,s=p.student;
  rows.push([r.id,r.received,s.grade,s.classroom,s.number,p.quizVersion,...questionIds.map(id=>Number.isInteger(p.answers[id])?p.answers[id]+1:'')]);
}
db.close();mkdirSync(join(directory,'exports'),{recursive:true});
const output=join(directory,'exports',`dokdo-${new Date().toISOString().replace(/[:.]/g,'-')}.csv`);
writeFileSync(output,'\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n'));
console.log(`CSV 저장 완료 (${rows.length-1}건): ${output}`);
