const {test,expect}=require('@playwright/test');
for(const [width,height] of [[320,740],[360,800],[390,844],[412,915],[640,360],[800,1280],[1280,800]]){
 test(`Phone and tablet flow at ${width}x${height}`,async({page},info)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height});await page.goto('/app.html');
  async function signIn(){
   await expect(page.locator('#screen-login')).toHaveClass(/active/);
   await page.locator('#login-name-input').fill('Amir');await expect(page.locator('#login-contact-input')).toHaveValue('amirali@nml.com');await expect(page.locator('#login-contact-input')).toHaveAttribute('readonly','');await page.locator('#btn-login-submit').click();
   await expect(page.locator('#screen-welcome')).toHaveClass(/active/);await expect(page.locator('#welcome-user-greeting')).toContainText('Amir');
  }
  await signIn();
  async function fits(){
   const result=await page.evaluate(()=>({root:document.documentElement.scrollWidth,viewport:innerWidth,scroll:document.querySelector('.screen-viewport').scrollWidth,inner:document.querySelector('.screen-viewport').clientWidth}));
   expect(result.root).toBeLessThanOrEqual(result.viewport+1);expect(result.scroll).toBeLessThanOrEqual(result.inner+1);
  }
  await expect(page.locator('#welcome-user-greeting')).toHaveCSS('outline-style','none');
  await fits();await page.screenshot({path:info.outputPath('home.png')});
  for(let i=0;i<4;i++){
   await page.locator('.hero-dot').nth(i).click();const image=page.locator('.hero-slide-bg-img').nth(i);
   await expect(image).toHaveJSProperty('complete',true);expect(await image.evaluate(img=>img.naturalWidth)).toBeGreaterThan(0);
   const box=await image.boundingBox();expect(box.height).toBeGreaterThan(100);expect(await image.evaluate(img=>img.naturalWidth/img.naturalHeight)).toBeCloseTo(4/3,1);await expect(image).toHaveCSS('object-fit','contain');
   const text=await page.locator('.hero-slide-text').nth(i).boundingBox(),slide=await page.locator('.hero-slide').nth(i).boundingBox();
   expect(text.y).toBeGreaterThanOrEqual(slide.y-1);expect(text.y+text.height).toBeLessThanOrEqual(slide.y+slide.height+1);
  }
  for(const key of ['start','skills','compare','roadmap','courses','counselling']){await page.locator('[data-tile-action="'+key+'"]').click();await expect(page.locator('#app-modal-backdrop')).toHaveClass(/open/);await expect(page.locator('#screen-welcome')).toHaveClass(/active/);await page.locator('#btn-close-modal').click();}
  await expect(page.locator('#workspace-save-notice')).toBeHidden();await expect(page.locator('#dashboard-requests')).toHaveCount(0);
  await page.locator('#btn-start-journey').click();await page.locator('[data-prof-id="nurse"]').click();await page.locator('#btn-step1-proceed').click();
  const dropdown=page.locator('#dd-qualification-host .select-trigger');await dropdown.click();await expect(dropdown).toHaveAttribute('aria-expanded','true');await dropdown.click();await expect(dropdown).toHaveAttribute('aria-expanded','false');
  await dropdown.click();await page.keyboard.press('Escape');await expect(dropdown).toBeFocused();
  for(const id of ['dd-qualification-host','dd-experience-host','dd-setting-host']){await page.locator('#'+id+' .select-trigger').click();await page.locator('#'+id+' [role="option"]').first().click();}
  await fits();await page.screenshot({path:info.outputPath('profile.png')});await page.locator('#btn-profile-next').click();
  await page.locator('[data-dir-id]').first().click();await page.locator('#btn-direction-next').click();await expect(page.locator('#screen-matches')).toHaveClass(/active/);
  await page.locator('.career-match-card').first().click();await page.locator('#btn-step4-proceed').click();
  for(const tab of ['overview','skills','roadmap','jobs','courses']){await page.locator(`[data-report-tab="${tab}"]`).click();await fits();}
  await page.locator('#btn-share-report').click();const download=page.waitForEvent('download');await page.locator('#btn-download-pdf').click();expect((await download).suggestedFilename()).toMatch(/\.pdf$/);await page.locator('#btn-close-modal').click();
  for(const screen of ['compare','saved','updates']){await page.locator(`[data-nav="${screen}"]`).click();await expect(page.locator('#screen-'+screen)).toHaveClass(/active/);await fits();await page.screenshot({path:info.outputPath(screen+'.png')});}
  await page.locator('#btn-open-settings').click();for(const row of await page.locator('.settings-row-stacked').all()){expect((await row.boundingBox()).height).toBeLessThan(400);}
  await page.screenshot({path:info.outputPath('settings.png')});await page.locator('#btn-settings-consultation').click();await expect(page.locator('#app-modal-body .feature-action')).toHaveAttribute('href','https://nucleusmedlabs.com/contact');await page.locator('#btn-close-modal').click();await page.locator('#btn-settings-toggle-theme').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await fits();
  await page.reload();await signIn();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');expect(errors).toEqual([]);
 });
}
