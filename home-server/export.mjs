import {DatabaseSync} from 'node:sqlite';
import {writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';
const directory=process.env.DOKDO_DATA_DIR||join(process.env.LOCALAPPDATA||homedir(),'MaseokDokdo');
const db=new DatabaseSync(join(directory,'responses.sqlite'),{readOnly:true});
const rows=[['접수번호','제출시각(UTC)','학년','반','번호','점수','소요초',...Array.from({length:10},(_,i)=>`${i+1}번 선택번호`)]];
for(const r of db.prepare('SELECT * FROM responses ORDER BY received,id').iterate()){
  const p=JSON.parse(r.payload),result=JSON.parse(r.result),s=p.student;
  rows.push([r.id,r.received,s.grade,s.classroom,s.number,result.score,result.seconds,...Object.values(p.answers).map(n=>n+1)]);
}
db.close();mkdirSync(join(directory,'exports'),{recursive:true});
const output=join(directory,'exports',`dokdo-${new Date().toISOString().replace(/[:.]/g,'-')}.csv`);
writeFileSync(output,'\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\r\n'));
console.log(`CSV 저장 완료 (${rows.length-1}건): ${output}`);
