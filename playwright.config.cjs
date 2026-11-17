const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'tests/browser',timeout:30000,retries:process.env.CI?1:0,workers:2,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:8765',reducedMotion:'reduce',trace:'retain-on-failure',screenshot:'only-on-failure'},
 webServer:{command:'python3 -m http.server 8765 --bind 127.0.0.1 --directory dist',url:'http://127.0.0.1:8765',reuseExistingServer:false},
 projects:[{name:'chromium',use:{browserName:'chromium'}}]
});
