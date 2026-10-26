import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, rmSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createQuizServer} from '../home-server/server.mjs';
import {createPreviewServer} from './dev.mjs';
import {loadRoster} from '../home-server/roster.mjs';

// This test never uses the event database or the live API.
const directory = mkdtempSync(join(tmpdir(),'dokdo-ui-'));
const roster=loadRoster();
const questions = JSON.parse(readFileSync(new URL('../public/data/questions.json',import.meta.url),'utf8'));
const api = createQuizServer({directory});
await new Promise(resolve => api.listen(0,'127.0.0.1',resolve));
const preview = createPreviewServer({apiPort:api.address().port});
await new Promise(resolve => preview.listen(0,'127.0.0.1',resolve));
const base = `http://127.0.0.1:${preview.address().port}`;
const browser = await chromium.launch(process.platform === 'win32' ? {channel:'chrome'} : {});
const output = new URL('../preview/ui/',import.meta.url);
mkdirSync(output,{recursive:true});
try {
  const sizes = [[390,844],[844,390],[1280,800],[1920,1080],[360,640],[768,1024]];
  for (const [index,[width,height]] of sizes.entries()) {
    const page = await browser.newPage({viewport:{width,height}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('#nickname, #ack, #privacy-copy').count(),0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,'Home overflows');
    assert.equal(await page.locator('#student-form').evaluate(node => node.checkValidity()),false,'Empty form is valid');
    assert.equal(await page.evaluate(() => {
      const facts = document.querySelector('.facts').getBoundingClientRect();
      const form = document.getElementById('student-form').getBoundingClientRect();
      return facts.left < form.right && facts.right > form.left && facts.top < form.bottom && facts.bottom > form.top;
    }),false,'Facts overlap student form');
    for (const image of await page.locator('img[src]').all()) {
      assert.ok(await image.evaluate(node => node.complete && node.naturalWidth > 0),'Image is missing');
    }
    await page.screenshot({path:fileURLToPath(new URL(`home-${width}x${height}.png`,output)),fullPage:true});
    await page.selectOption('#grade','1');
    await page.fill('#classroom','1');
    await page.fill('#number',String(index + 1));
    await page.click('#start-button');
    await page.waitForFunction(() => document.body.dataset.view === 'quiz');
    const name=roster.get(`1-1-${index+1}`);
    assert.ok((await page.locator('#student-chip').textContent()).includes(name));
    await page.waitForFunction(() => document.getElementById('hint-image').naturalWidth > 0);
    await page.locator('#hint-image').evaluate(node => node.decode());
    await page.screenshot({path:fileURLToPath(new URL(`quiz-${width}x${height}.png`,output)),fullPage:true});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,'Quiz overflows');
    await page.locator('.q-dot').last().click();
    await page.click('#next');
    assert.match(await page.locator('#quiz-error').textContent(),/答|답/);
    assert.match(await page.locator('#question-title').textContent(),/^Q1\./);
    for (const [questionIndex,question] of questions.entries()) {
      await page.locator('.q-dot').nth(questionIndex).click();
      const hinted = ['q1','q3','q5','q8','q9'].includes(question.id);
      assert.equal(await page.locator('#question-hint').isVisible(),hinted,`Hint visibility: ${question.id}`);
      if (hinted) {
        const extension = ['q1','q5'].includes(question.id) ? 'webp' : 'jpg';
        await page.waitForFunction(expected => {
          const image = document.getElementById('hint-image');
          return image.src.endsWith(expected) && image.complete && image.naturalWidth > 0;
        },`${question.id}.${extension}`);
        await page.locator('#hint-image').evaluate(node => node.decode());
        if (index === 0) {
          await page.click('#hint-open');
          assert.equal(await page.locator('#hint-dialog').evaluate(node => node.open),true);
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#hint-dialog').evaluate(node => node.open),false);
        }
      }
      await page.locator('.option').nth(question.answer).click();
    }
    await page.click('#previous');
    await page.click('#next');
    assert.equal(await page.locator('.q-dot.answered').count(),questions.length);
    let retryId;
    if (index === 0) {
      await page.route('**/api/submit', async route => {
        retryId = route.request().postDataJSON().id;
        await route.fulfill({status:503,json:{error:'테스트 연결 실패'}});
      });
      await page.click('#next');
      await page.waitForSelector('#quiz-error:not([hidden])');
      assert.equal(await page.locator('.q-dot.answered').count(),questions.length);
      await page.unroute('**/api/submit');
      page.on('request', request => {
        if (request.url().endsWith('/api/submit')) assert.equal(request.postDataJSON().id,retryId);
      });
    }
    await page.click('#next');
    await page.waitForFunction(() => document.body.dataset.view === 'result');
    assert.equal(await page.locator('#score-value').textContent(),'100');
    assert.equal(await page.locator('#result-greeting').textContent(),`${name}님, 수고했어요!`);
    assert.equal(await page.locator('.review').count(),questions.length);
    await page.locator('.review summary').first().click();
    assert.equal(await page.locator('.review[open]').count(),1);
    await page.screenshot({path:fileURLToPath(new URL(`result-${width}x${height}.png`,output)),fullPage:true});
    const rankLink = await page.locator('.result-summary a').getAttribute('href');
    assert.equal(rankLink,'./ranking.html');
    await page.click('#restart');
    await page.selectOption('#grade','1');
    await page.fill('#classroom','1');
    await page.fill('#number',String(index+1));
    await page.click('#start-button');
    await page.waitForSelector('#start-error:not([hidden])');
    assert.match(await page.locator('#start-error').textContent(),/이미 참여/);
    await page.goto(base + '/ranking.html');
    await page.waitForSelector('.rank-row-asset');
    assert.equal(await page.locator('.rank-row-asset').count(),index+1);
    assert.equal(await page.locator(`[data-student-key="1-1-${index+1}"] .student-nickname`).textContent(),name);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,'Rankings overflow');
    await page.screenshot({path:fileURLToPath(new URL(`ranking-${width}x${height}.png`,output)),fullPage:true});
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(`PASS ${width}×${height}: start, answers, navigation, submit, result, review, restart, duplicate, rankings`);
  }
} finally {
  await browser.close();
  await new Promise(resolve => {preview.close(resolve);preview.closeIdleConnections();});
  await new Promise(resolve => {api.close(resolve);api.closeIdleConnections();});
  rmSync(directory,{recursive:true,force:true});
}
