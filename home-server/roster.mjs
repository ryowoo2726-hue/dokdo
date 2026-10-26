import {readFileSync} from 'node:fs';
import {studentKey,validateStudent} from './core.mjs';

export function loadRoster(path=process.env.DOKDO_ROSTER_FILE||new URL('../학생 명단.csv',import.meta.url)) {
  const csv=readFileSync(path,'utf8').replace(/^\uFEFF/,'');
  const field='(?:"((?:[^\"]|"\")*)"|([^",\\r\\n]*))';
  const record=new RegExp(Array(5).fill(field).join(',')+'(?:\\r?\\n|$)','y');
  const roster=new Map();
  let position=0,row=0;
  while(position<csv.length) {
    if(csv[position]==='\r'||csv[position]==='\n'){position++;continue;}
    record.lastIndex=position;
    const match=record.exec(csv);
    if(!match)throw Error(`학생 명단 CSV ${row+1}번째 행 형식을 확인해 주세요. 열은 학년,반,번호,성명,비고입니다.`);
    position=record.lastIndex;row++;
    const cells=Array.from({length:5},(_,i)=>(match[i*2+1]??match[i*2+2]).replace(/""/g,'"').trim());
    if(row===1){
      if(cells.join(',')!=='학년,반,번호,성명,비고')throw Error('학생 명단 CSV의 첫 행은 학년,반,번호,성명,비고여야 합니다.');
      continue;
    }
    if(cells.every(cell=>!cell))continue;
    if(cells.slice(0,3).some(cell=>!/^\d+$/.test(cell)))throw Error(`학생 명단 CSV ${row}번째 행의 학년·반·번호를 확인해 주세요.`);
    const student=validateStudent({grade:Number(cells[0]),classroom:Number(cells[1]),number:Number(cells[2])});
    const name=cells[3];
    if(!name||name==='-')continue;
    if(/[\u0000-\u001f\u007f]/.test(name))throw Error(`학생 명단 CSV ${row}번째 행의 성명을 확인해 주세요.`);
    const key=studentKey(student);
    if(roster.has(key))throw Error(`학생 명단에 중복 학번이 있습니다: ${key}`);
    roster.set(key,name);
  }
  if(!roster.size)throw Error('학생 명단을 확인해 주세요. 등록된 학생이 없습니다.');
  return roster;
}
