import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const questions=JSON.parse(readFileSync('questions.json','utf8'));
const template=readFileSync('app.template.html','utf8');
const server=readFileSync('server.template.gs','utf8');
mkdirSync('dist',{recursive:true});mkdirSync('apps-script',{recursive:true});
writeFileSync('dist/index.html',template.replace('/*__DEMO_QUESTIONS__*/',JSON.stringify(questions)));
// Production HTML contains questions only when requested through startAttempt.
writeFileSync('apps-script/Index.html',template.replace('/*__DEMO_QUESTIONS__*/','null').replace('const PRODUCTION = false','const PRODUCTION = true'));
writeFileSync('apps-script/Code.gs',server.replace('/*__QUESTIONS__*/',JSON.stringify(questions,null,2)));
console.log('Built preview and Google Apps Script bundle (10 questions).');
