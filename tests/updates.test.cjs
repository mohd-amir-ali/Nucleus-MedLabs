const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const edition=JSON.parse(fs.readFileSync(path.join(root,'data/updates.json'),'utf8'));

async function check(url,response,expected,withBundle=true){
  const dom=new JSDOM(fs.readFileSync(path.join(root,'app.html'),'utf8'),{url,runScripts:'outside-only'});
  const w=dom.window;
  try{
    let requests=0;
    w.AbortController=AbortController;
    w.fetch=async()=>{requests++;return response();};
    for(const node of w.document.querySelectorAll('script[src]')){
      const src=node.getAttribute('src');
      if(src==='scripts/updates.js'||(withBundle&&src==='data/updates-bundled.js'))w.eval(fs.readFileSync(path.join(root,src),'utf8'));
    }
    const feed=await w.NucleusUpdates.load();
    assert.equal(feed.articles.length,expected);
    const saved=[];
    const toggle=id=>{saved.push(id);w.NucleusUpdates.render(saved,toggle);};
    w.NucleusUpdates.render(saved,toggle);
    assert.equal(w.document.querySelectorAll('#updates-list .update-card').length,expected);
    if(expected){
      assert.match(w.document.getElementById('updates-status').textContent,new RegExp('^'+expected+' selected reads'));
      for(const img of w.document.querySelectorAll('.update-cover'))assert(fs.existsSync(path.join(root,img.getAttribute('src'))));
      w.document.querySelector('.update-bookmark').click();
      assert.equal(w.document.querySelector('.update-bookmark').getAttribute('aria-pressed'),'true');
      assert.equal(w.NucleusUpdates.savedItems(saved).length,1);
      w.document.querySelectorAll('#updates-filters button')[1].click();
      assert(w.document.querySelectorAll('#updates-list .update-card').length<expected);
    }
    if(url.startsWith('file:'))assert.equal(requests,0,'Direct-file preview must not depend on fetch');
  }finally{dom.window.close();}
}

(async()=>{
  const fail=()=>{throw new TypeError('Failed to fetch');};
  await check('file:///project/app.html',fail,12);
  await check('https://nucleus.test/app.html',fail,12);
  await check('https://nucleus.test/app.html',()=>({ok:false}),12);
  await check('https://nucleus.test/app.html',()=>({ok:true,text:async()=>'<html>Not JSON</html>'}),12);
  await check('https://nucleus.test/app.html',()=>({ok:true,text:async()=>JSON.stringify({...edition,articles:edition.articles.slice(0,6)})}),6);
  await check('https://nucleus.test/app.html',fail,0,false);
  console.log('Updates: direct-file, network failure, HTTP error, invalid JSON, served edition, and missing fallback passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
