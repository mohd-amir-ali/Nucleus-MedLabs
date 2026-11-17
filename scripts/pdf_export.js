(function (root) {
  'use strict';
  const margin=16, width=210, bottom=276;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let loadedAssets;
  function base64(bytes) { let value='';for(const byte of new Uint8Array(bytes))value+=String.fromCharCode(byte);return btoa(value); }
  async function assets() {
    if(!loadedAssets)loadedAssets=Promise.all(['fonts/NotoSans-Regular.ttf','fonts/NotoSans-Bold.ttf','Logo-Brandkit/icons/app-dark-192x192.png'].map(async path=>{
      const result=await fetch(path);if(!result.ok)throw new Error('A report asset is unavailable.');return new Uint8Array(await result.arrayBuffer());
    })).catch(error=>{loadedAssets=null;throw error;});
    return loadedAssets;
  }
  function layout(doc,report,page,size) {
    const rows=[];let y=43;
    function text(value,fontSize,bold=false,gap=2,color='#334E68',indent=0) {
      doc.setFont('NotoSans',bold?'bold':'normal');doc.setFontSize(fontSize);
      const lines=doc.splitTextToSize(String(value),width-margin*2-indent);
      const lineHeight=fontSize*0.352778*1.4;
      rows.push({lines,x:margin+indent,y,fontSize,bold,color,lineHeight});y+=lines.length*lineHeight+gap;
    }
    text(page===0?report.title:'Your action plan',15,true,4,'#0B253A');
    if(page===0)report.meta.forEach(line=>text(line,size,false,1));
    else {text(report.title,size,false,2);text(report.meta[0],size,false,3);}
    for(const section of report.pages[page]){
      y+=3;text(section.title,size+1.5,true,2,'#00786B');
      (section.lines||[]).forEach(line=>text(line,size,false,2));
      (section.items||[]).forEach(item=>{
        rows.push({marker:true,x:margin+2,y:y-1.2,completed:item.completed});
        text(item.title+' ('+item.duration+')',size,true,1,'#0B253A',7);
        text(item.description,size,false,1,'#334E68',7);
        if(item.completedAt)text('Completed '+item.completedAt,size-1,false,1,'#00786B',7);
        y+=2;
      });
    }
    return {rows,height:y};
  }
  function create(report,resources) {
    if(!Array.isArray(report.pages)||report.pages.length!==2)throw new Error('The report must contain two planned pages.');
    const doc=new root.NucleusPDFDocument({unit:'mm',format:'a4',compress:true});
    doc.addFileToVFS('NotoSans-Regular.ttf',base64(resources[0]));doc.addFont('NotoSans-Regular.ttf','NotoSans','normal');
    doc.addFileToVFS('NotoSans-Bold.ttf',base64(resources[1]));doc.addFont('NotoSans-Bold.ttf','NotoSans','bold');
    doc.setProperties({title:'Nucleus MedLabs - Career transition plan',author:'Nucleus MedLabs',subject:report.title});
    for(let page=0;page<2;page++){
      if(page)doc.addPage();
      let result,size=10.25;
      do{result=layout(doc,report,page,size);if(result.height<=bottom)break;size-=0.25;}while(size>=9);
      if(result.height>bottom)throw new Error('This profile exceeds the two-page layout. Export a workspace backup while we review the report.');
      doc.setFillColor('#081F32');doc.rect(0,0,210,31,'F');
      doc.addImage(resources[2],'PNG',margin,6,19,19);
      doc.setFont('NotoSans','bold');doc.setFontSize(17);doc.setTextColor('#FFFFFF');doc.text('Nucleus MedLabs',40,14);
      doc.setFontSize(8);doc.text('CAREERSHIFT / PERSONAL TRANSITION PLAN',40,21);
      for(const row of result.rows){
        if(row.marker){
          doc.setLineWidth(0.4);doc.setDrawColor('#00786B');doc.setFillColor('#00786B');doc.circle(row.x,row.y,1.8,row.completed?'FD':'S');
          if(row.completed){doc.setDrawColor('#FFFFFF');doc.setLineWidth(0.45);doc.line(row.x-0.9,row.y,row.x-0.2,row.y+0.7);doc.line(row.x-0.2,row.y+0.7,row.x+1,row.y-0.7);}
          continue;
        }
        doc.setFont('NotoSans',row.bold?'bold':'normal');doc.setFontSize(row.fontSize);doc.setTextColor(row.color);
        row.lines.forEach((line,i)=>doc.text(line,row.x,row.y+i*row.lineHeight));
      }
      doc.setDrawColor('#D4E3F0');doc.line(margin,282,194,282);
      doc.setFont('NotoSans','normal');doc.setTextColor('#627D98');doc.setFontSize(7);
      doc.text('Planning guidance. Salary, timelines and learning tracks are illustrative.',margin,287);
      doc.text(report.date+' | Page '+(page+1)+' of 2',194,292,{align:'right'});
    }
    return doc;
  }
  function preview(report) {
    return '<p class="content-note">A two-page plan with selectable text and your saved milestone status.</p><div class="report-preview">'+report.pages.map((sections,i)=>'<section><span class="eyebrow">PAGE '+(i+1)+'</span><h3>'+esc(i===0?'Your starting point':'Your action plan')+'</h3><ul>'+sections.map(section=>'<li>'+esc(section.title)+'</li>').join('')+'</ul></section>').join('')+'</div>';
  }
  async function download(report) {
    const doc=create(report,await assets());
    return root.NucleusPlatform.download(doc.output('arraybuffer'),'Nucleus-MedLabs-Career-Plan.pdf','application/pdf');
  }
  root.NucleusPDF={create,layout,preview,download};
})(typeof window!=='undefined'?window:globalThis);
