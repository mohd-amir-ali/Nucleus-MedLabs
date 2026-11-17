(function (root) {
  'use strict';
  let feed={articles:[],curatedAt:null},loaded=false,loading=null,category='All';
  const archive=new Map();
  const allowedHosts=new Set(['fda.gov','www.fda.gov','nucleusmedlabs.com','www.nucleusmedlabs.com','who.int','www.who.int','ich.org','www.ich.org','clinicaltrials.gov','openwho.org']);
  const covers=new Set(["career-transitions", "cv-preparation", "professional-profiles", "interviews", "counselling", "healthcare-privacy", "digital-health", "clinical-research", "regulatory-affairs", "medical-devices", "patient-safety", "professional-learning"]);
  const cacheKey='nucleus-public-updates-v1';
  function validate(input) {
    if(input?.schemaVersion!==1||!Array.isArray(input.articles))throw new Error('Unsupported reading list');
    const ids=new Set();
    const articles=input.articles.slice(0,100).flatMap(item=>{
      try {
        const url=new URL(item.url);
        if(url.protocol!=='https:'||!allowedHosts.has(url.hostname)||url.username||url.password||url.port||!/^[a-zA-Z0-9_-]{1,100}$/.test(item.id)||ids.has(item.id))return [];
        if(typeof item.title!=='string'||!item.title.trim())return [];
        ids.add(item.id);
        return [{id:item.id,title:item.title.slice(0,180),summary:String(item.summary||'').slice(0,400),source:String(item.source||url.hostname).slice(0,70),category:String(item.category||'Reading').slice(0,40),kind:['News','Article'].includes(item.kind)?item.kind:'Resource',url:url.href,publishedAt:item.publishedAt&&!isNaN(Date.parse(item.publishedAt))?new Date(item.publishedAt).toISOString():null,image:covers.has(item.image)?item.image:'clinical-research'}];
      }catch{return [];}
    });
    return {schemaVersion:1,articles,curatedAt:input.curatedAt&&!isNaN(Date.parse(input.curatedAt))?new Date(input.curatedAt).toISOString():null};
  }
  async function load() {
    if(loading)return loading;if(loaded)return feed;
    loading=(async()=>{
      // Keep previously saved sources reachable without letting an old feed replace this edition.
      try{for(const item of validate(JSON.parse(localStorage.getItem(cacheKey)||'null')).articles)archive.set(item.id,item);}catch{}
      function useEdition(input){
        const edition=validate(input);
        if(!edition.articles.length)throw new Error('Empty reading list');
        feed=edition;
        for(const item of validate({schemaVersion:1,articles:input.archive||[]}).articles)archive.set(item.id,item);
        for(const item of feed.articles)archive.set(item.id,item);
        loaded=true;
      }
      if(root.location?.protocol==='file:'){
        try{useEdition(root.NucleusBundledUpdates);}catch{loaded=false;}
        return feed;
      }
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
      try{
        const response=await fetch('data/updates.json',{signal:controller.signal,credentials:'omit'});
        if(!response.ok)throw new Error('Reading list unavailable');
        const text=await response.text();if(text.length>250000)throw new Error('Reading list too large');
        useEdition(JSON.parse(text));
      }catch{
        try{useEdition(root.NucleusBundledUpdates);}catch{loaded=false;}
      }finally{clearTimeout(timer);}
      return feed;
    })();
    try{return await loading;}finally{loading=null;}
  }
  function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
  function cover(item){return covers.has(item.image)?item.image:'clinical-research';}
  function savedItems(ids,items=[]) {
    const preserved=new Map(validate({schemaVersion:1,articles:items}).articles.map(item=>[item.id,item]));
    return ids.map(id=>archive.get(id)||preserved.get(id)).filter(Boolean);
  }
  function cards(host,articles,saved,toggle,emptyText) {
    host.replaceChildren();
    if(!articles.length){host.append(element('p','empty-state',emptyText||'No saved articles yet. Save something from Updates to find it here.'));return;}
    for(const item of articles){
      const card=element('article','update-card'),media=element('div','update-media'),image=element('img','update-cover'),body=element('div','update-body');
      image.src='assets/updates/'+cover(item)+'.jpg';image.alt='';image.width=1120;image.height=630;image.loading='lazy';image.decoding='async';
      const save=element('button','update-bookmark');save.type='button';save.dataset.articleBookmark=item.id;
      save.setAttribute('aria-pressed',String(saved.includes(item.id)));save.setAttribute('aria-label',(saved.includes(item.id)?'Unsave ':'Save ')+item.title);
      save.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/></svg>';
      save.onclick=()=>{toggle(item.id);queueMicrotask(()=>host.querySelector('[data-article-bookmark="'+item.id+'"]')?.focus({preventScroll:true}));};
      media.append(image,save);card.append(media,body);
      body.append(element('span','update-category',item.category),element('h2','',item.title),element('p','',item.summary));
      body.append(element('small','',item.source+' | '+(item.publishedAt?new Date(item.publishedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):item.kind)));
      const actions=element('div','update-actions'),read=element('a','btn-secondary');read.href=item.url;read.target='_blank';read.rel='noopener noreferrer';read.dataset.externalLink='';
      read.append(element('span','','Read source'));read.insertAdjacentHTML('beforeend','<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 17 17 7M7 7h10v10"/></svg>');
      read.setAttribute('aria-label','Read source: '+item.title);actions.append(read);card.append(actions);host.append(card);
    }
  }
  function render(saved,toggle) {
    const filters=document.getElementById('updates-filters');filters.replaceChildren();
    if(category!=='All'&&!feed.articles.some(item=>item.category===category))category='All';
    for(const name of ['All',...new Set(feed.articles.map(item=>item.category))]){
      const button=element('button','',name);button.type='button';button.setAttribute('aria-pressed',String(category===name));
      button.onclick=()=>{category=name;render(saved,toggle);};filters.append(button);
    }
    document.getElementById('updates-status').textContent=feed.articles.length?feed.articles.length+' selected reads | Career guidance, job readiness and MedTech.':'The reading list could not be opened. Return to Updates to try again.';
    cards(document.getElementById('updates-list'),feed.articles.filter(a=>category==='All'||a.category===category),saved,toggle,'No articles available in this view.');
  }
  function renderSaved(host,saved,toggle,preserved=[]) {
    host.replaceChildren(element('h2','screen-title','Saved articles'));
    const grid=element('div','updates-grid');host.append(grid);cards(grid,savedItems(saved,preserved),saved,toggle);
  }
  root.NucleusUpdates={load,render,renderSaved,validate,cover,savedItems};
})(window);
