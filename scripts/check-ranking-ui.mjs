import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createPreviewServer} from './dev.mjs';

const server=createPreviewServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch(process.platform==='win32'?{channel:'chrome'}:{});
try {
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  let entries=Array.from({length:50},(_,i)=>({rank:i+1,student:{grade:1,classroom:1,number:i+1},score:100-i,seconds:84+i}));
  let calls=0,offline=false;
  const times=[];
  await page.route('**/api/rankings',async route=>{
    calls++;times.push(Date.now());
    await route.fulfill(offline?{status:503,json:{error:'test'}}:{json:{participants:entries.length,rankings:entries}});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/ranking.html`);
  await page.waitForSelector('.rank-row-asset');
  assert.equal(await page.locator('.rank-duration').first().textContent(),'01분 24초');
  await page.locator('.rank-page-title img').evaluate(node=>node.decode());
  await page.evaluate(()=>Promise.all(document.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
  const alignment=await page.evaluate(()=>{
    const center=node=>{const r=node.getBoundingClientRect();return r.left+r.width/2;};
    const title=document.querySelector('.rank-columns > span:nth-child(2)');
    const range=document.createRange();range.selectNodeContents(title);
    const text=range.getBoundingClientRect();
    const ids=[...document.querySelectorAll('.student-id-chip')].map(center);
    const nameCenter=center(document.querySelector('.student-nickname'));
    return {idSpread:Math.max(...ids)-Math.min(...ids),nameDelta:Math.abs(text.left+text.width/2-nameCenter),screenDelta:Math.abs(nameCenter-innerWidth/2),titleDelta:Math.abs(center(document.getElementById('rank-title'))-innerWidth/2),countDelta:Math.abs(center(document.querySelector('.rank-dashboard-meta'))-innerWidth/2)};
  });
  assert.ok(alignment.idSpread<1,'Student IDs do not align');
  assert.ok(alignment.nameDelta<2,'Student header does not align with name column');
  assert.ok(alignment.screenDelta<2&&alignment.titleDelta<2&&alignment.countDelta<2,'Title, count and students are not centered');
  mkdirSync(new URL('../preview/ui/',import.meta.url),{recursive:true});
  await page.screenshot({path:fileURLToPath(new URL('../preview/ui/ranking-tablet.png',import.meta.url))});
  await page.click('#rank-scroll-toggle');
  const before=await page.evaluate(()=>{
    const viewport=document.getElementById('rank-scroll-window');viewport.scrollTop=420;
    const top=viewport.getBoundingClientRect().top;
    window.keptRow=[...document.querySelectorAll('.rank-row-asset')].find(node=>node.getBoundingClientRect().top>=top);
    return {key:keptRow.dataset.studentKey,top:keptRow.getBoundingClientRect().top};
  });
  entries=[{rank:1,student:{grade:2,classroom:1,number:1},score:100,seconds:42},...entries.map(e=>({...e,rank:e.rank+1}))];
  await page.waitForSelector('[data-student-key="2-1-1"]');
  const after=await page.evaluate(key=>({same:document.querySelector(`[data-student-key="${key}"]`)===keptRow,top:keptRow.getBoundingClientRect().top,scroll:document.getElementById('rank-scroll-window').scrollTop,newAnimation:document.querySelector('[data-student-key="2-1-1"]').getAnimations().length}),before.key);
  assert.ok(after.same,'Existing row replaced');
  assert.ok(Math.abs(after.top-before.top)<3,'Visible student jumped');
  assert.ok(after.scroll>400,'Scroll reset');
  assert.ok(after.newAnimation>0,'No entrance effect');
  assert.ok(times[1]-times[0]>=2500&&times[1]-times[0]<4000,'Polling interval is not 3 seconds');
  offline=true;
  const previousCalls=calls;
  await page.waitForFunction(()=>document.getElementById('rank-connection').dataset.state==='offline');
  assert.ok(calls>previousCalls);
  assert.equal(await page.locator('.rank-row-asset').count(),51,'Offline refresh cleared rows');
  assert.ok(await page.locator('#rank-scroll-window').evaluate(node=>node.scrollTop>400));
  offline=false;
  await page.click('#rank-scroll-toggle');
  const start=await page.locator('#rank-scroll-window').evaluate(node=>node.scrollTop);
  await page.waitForFunction(scroll=>document.getElementById('rank-scroll-window').scrollTop>scroll+20,start);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.getElementById('rank-scroll-toggle').disabled);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Phone overflow');
  console.log('PASS: 3s refresh, stable row identity/viewport, pop animation, offline preservation, continuous scrolling, reduced motion, mobile width');
} finally {
  await browser.close();
  await new Promise(resolve=>{server.close(resolve);server.closeIdleConnections();});
}
