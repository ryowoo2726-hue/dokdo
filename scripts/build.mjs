import {mkdirSync, copyFileSync, unlinkSync, rmdirSync, writeFileSync, readdirSync, readFileSync, existsSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../',import.meta.url));
const source = join(root,'public');
const output = join(root,'dist');
if (resolve(output) !== resolve(root,'dist')) throw Error('Invalid build output directory');

// Copy individual files: recursive fs.cp/fs.rm can crash on Google Drive's virtual filesystem.
const expected = new Set(['_headers']);
function copyDirectory(from, to, relative = '') {
  mkdirSync(to,{recursive:true});
  for (const entry of readdirSync(from,{withFileTypes:true})) {
    const key = join(relative,entry.name);
    const target = join(to,entry.name);
    expected.add(key);
    if (entry.isDirectory()) copyDirectory(join(from,entry.name),target,key);
    else if (entry.isFile()) {
      if (entry.name.endsWith('.css')) {
        const css = readFileSync(join(from,entry.name),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').trim();
        writeFileSync(target,css+'\n');
      } else copyFileSync(join(from,entry.name),target);
    } else throw Error(`Unsupported source entry: ${key}`);
  }
}

function removeStale(directory, relative = '') {
  for (const entry of readdirSync(directory,{withFileTypes:true})) {
    const key = join(relative,entry.name);
    const target = join(directory,entry.name);
    if (entry.isDirectory()) {
      removeStale(target,key);
      if (!expected.has(key)) rmdirSync(target);
    } else if (!expected.has(key)) unlinkSync(target);
  }
}

copyDirectory(source,output);
if (existsSync(output)) removeStale(output);
writeFileSync(join(output,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Cache-Control: no-cache\n/assets/*\n  Cache-Control: public, max-age=86400\n');
console.log('Pages build ready: dist');
