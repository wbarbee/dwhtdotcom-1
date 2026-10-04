// Start the site, then run: node scripts/check-mobile.cjs
// Uses an available Playwright installation (or PLAYWRIGHT_MODULE path).
// BROWSER_CDP_URL can reuse an existing test browser; BROWSER=webkit tests WebKit.
const assert = require('node:assert/strict');
const {chromium, webkit, devices} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = process.env.BROWSER_CDP_URL
    ? await chromium.connectOverCDP(process.env.BROWSER_CDP_URL)
    : await (process.env.BROWSER === 'webkit' ? webkit : chromium).launch();
  try {
  const context = await browser.newContext({...devices['iPhone 13']});
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  const origin=process.env.BASE_URL || 'http://localhost:3107';
  const start=Date.now();
  await page.goto(origin, {waitUntil:'domcontentloaded'});
  const opener=page.getByRole('button',{name:'View full schedule'});
  await opener.waitFor();
  console.log('mobile content visible',Date.now()-start,'ms');
  await page.evaluate(() => {
    window.nativeTouches = 0;
    document.addEventListener('touchend', event => { if (event.isTrusted) window.nativeTouches++; });
  });
  assert.equal(await page.locator('.glass-card').first().evaluate(el=>getComputedStyle(el).backdropFilter),'none');
  const close=async(selector, expected=0, via='tap')=>{
    await page.evaluate(()=>{ window.dismissStart=0; document.addEventListener('pointerup',()=>{window.dismissStart=performance.now()}, {once:true,capture:true}); });
    if(via==='tap') await selector.tap();
    else if(via==='keyboard') { await selector.focus(); await page.keyboard.press('Enter'); }
    else await selector.evaluate((el, pointerType) => el.dispatchEvent(
      new PointerEvent('click', {bubbles:true, pointerType})
    ), via);
    await page.waitForFunction(n=>document.querySelectorAll('[role=dialog]').length===n,expected,{timeout:1000});
    const elapsed=await page.evaluate(()=>window.dismissStart?performance.now()-window.dismissStart:0);
    assert(elapsed<500,`slow close ${elapsed} ms`);
    console.log('closed',via,Math.round(elapsed),'ms; dialogs remaining',expected);
  };
  for (const target of ['X','Close']) {
    await opener.tap();
    const dialog=page.getByRole('dialog');
    await dialog.waitFor();
    const button=dialog.getByRole('button',{name:'Close',exact:true})[target==='X'?'first':'last']();
    await button.dispatchEvent('touchstart', {bubbles:true, cancelable:true, touches:[]});
    assert.equal(await page.locator('[role=dialog]').count(), 1, 'contact alone must not dismiss');
    const box=await button.boundingBox();
    assert(box.height>=44 && box.width>=44);
    await close(button);
  }
  // A supported touch/pen click must not be discarded if there was no touchstart.
  for(const type of ['touch','pen','keyboard']) {
    await opener.tap();
    await close(page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).first(),0,type);
  }
  await opener.tap();
  const schedule=page.getByRole('dialog');
  const row=schedule.getByRole('button',{name:/View game stats/}).first();
  await row.tap();
  await page.waitForFunction(()=>document.querySelectorAll('[role=dialog]').length===2);
  await close(page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).first(),1);
  assert(await schedule.getByRole('button',{name:/View game stats/}).first().isVisible());
  await close(schedule.getByRole('button',{name:'Close',exact:true}).last());
  await page.getByRole('tab',{name:'Hook Thems (to Date)'}).tap();
  await page.getByRole('tabpanel').getByRole('button',{name:/View game stats/}).first().tap();
  await close(page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).last());
  await page.evaluate(()=>window.scrollTo(0,300));
  assert(await page.evaluate(()=>window.scrollY)>0,'page scroll restored');
  if(process.env.SCREENSHOT_PATH) await page.screenshot({path:process.env.SCREENSHOT_PATH,fullPage:true});
  assert.deepEqual(errors,[]);
  assert(await page.evaluate(() => window.nativeTouches) > 0, 'trusted touch input exercised');
  // Stall the browser request itself, then retry with the real API.
  await page.route('**/api/schedule?*',()=>{});
  const stalled=Date.now();
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Try again',exact:true}).waitFor({timeout:12000});
  console.log('stalled request exposed retry',Date.now()-stalled,'ms');
  await page.unroute('**/api/schedule?*');
  await page.getByRole('button',{name:'Try again',exact:true}).tap();
  await opener.waitFor({timeout:5000});
  assert.deepEqual(errors,[]);
  console.log('retry recovered; no unhandled page errors');
  await context.close();
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1)});
