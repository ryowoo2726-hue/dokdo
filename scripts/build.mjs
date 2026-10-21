import {mkdirSync,cpSync,rmSync,writeFileSync,readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=join(root,'dist');
rmSync(output,{recursive:true,force:true});
mkdirSync(output,{recursive:true});
// Deploy public files only; never copy server data, credentials or design references.
cpSync(join(root,'public'),output,{recursive:true});
for(const file of readdirSync(join(output,'css'))){
  if(!file.endsWith('.css'))continue;
  const target=join(output,'css',file);
  const css=readFileSync(target,'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').trim();
  writeFileSync(target,css+'\n');
}
writeFileSync(join(output,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Cache-Control: no-cache\n/assets/*\n  Cache-Control: public, max-age=86400\n');
console.log('Pages build ready: dist');
