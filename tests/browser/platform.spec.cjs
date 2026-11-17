const {test,expect}=require('@playwright/test');
test('Website, tablet and phone previews retain the same signed-in application',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('/');
 const app=page.frameLocator('#application');await expect(app.locator('#screen-login')).toHaveClass(/active/);
 await app.locator('#login-name-input').fill('Amir');await app.locator('#btn-login-submit').click();await expect(app.locator('#screen-welcome')).toHaveClass(/active/);
 for(const [mode,width,height] of [['phone',390,844],['tablet',820,1180],['website',1440,934]]){
  await page.locator(`[data-view="${mode}"]`).click();await expect(app.locator('#screen-welcome')).toHaveClass(/active/);
  const actual=await app.locator('body').evaluate(()=>({width:innerWidth,height:innerHeight}));expect(actual.width).toBe(width);
  if(mode!=='website')expect(actual.height).toBe(height);
 }
 await page.locator('[data-view="tablet"]').click();await page.locator('#rotate-view').click();expect(await app.locator('body').evaluate(()=>innerWidth)).toBe(1180);
});
