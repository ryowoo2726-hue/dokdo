import {mkdirSync,copyFileSync,cpSync,rmSync,writeFileSync} from 'node:fs';
// Only these public assets are deployed. Answers, database, and server stay local.
rmSync('dist',{recursive:true,force:true});
mkdirSync('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js'])copyFileSync(file,`dist/${file}`);
cpSync('assets','dist/assets',{recursive:true});
writeFileSync('dist/_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Cache-Control: no-cache\n');
console.log('Pages build ready: dist');
