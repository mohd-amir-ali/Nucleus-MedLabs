(function(){
 'use strict';
 const frame=document.getElementById('application'),stage=document.querySelector('.platform-stage');
 let view='website',landscape=false;
 function layout(){
  if(window.innerWidth<=760){view='website';landscape=false;}
  const dimensions=view==='phone'?[390,844]:[820,1180];if(landscape)dimensions.reverse();
  const width=view==='website'?stage.clientWidth:dimensions[0],height=view==='website'?stage.clientHeight:dimensions[1];
  const scale=view==='website'?1:Math.min(1,(stage.clientWidth-24)/width,(stage.clientHeight-24)/height);
  frame.style.width=width+'px';frame.style.height=height+'px';frame.style.transform='scale('+Math.max(.1,scale)+')';
  document.body.dataset.view=view;document.getElementById('viewport-size').textContent=width+' × '+height+' CSS px';
  document.getElementById('rotate-view').hidden=view==='website';
  for(const button of document.querySelectorAll('[data-view]'))button.setAttribute('aria-pressed',String(button.dataset.view===view));
 }
 for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{view=button.dataset.view;landscape=false;layout();};
 document.getElementById('rotate-view').onclick=()=>{landscape=!landscape;layout();};
 new ResizeObserver(layout).observe(stage);layout();
})();
