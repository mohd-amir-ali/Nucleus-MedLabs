const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {jsPDF}=require('jspdf');
const root=path.resolve(__dirname,'..');
const context={window:{NucleusPDFDocument:jsPDF,addEventListener(){}},document:{addEventListener(){}},btoa,Date,Math};
for(const file of ['data/career_engine_data.js','scripts/career_engine.js','scripts/pdf_export.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const controller=fs.readFileSync(root+'/scripts/app_controller.js','utf8').replace(/\}\)\(\);\s*$/, 'window.reportTest={state:()=>state,buildTransitionReport,getSvgIcon};})();');
vm.runInNewContext(controller,context);
const data=context.window.NUCLEUS_DATA,api=context.window.reportTest,resources=['fonts/NotoSans-Regular.ttf','fonts/NotoSans-Bold.ttf','Logo-Brandkit/icons/app-dark-192x192.png'].map(p=>fs.readFileSync(root+'/'+p));
let count=0,sample;
for(const profession of data.professions)for(const role of data.careerRoles){
 const state=api.state();state.user.fullName='A'.repeat(60);state.displayName=state.user.fullName;state.isGuest=true;state.assessment={...state.assessment,professionId:profession.id,qualification:data.qualifications.reduce((a,b)=>a.length>b.length?a:b),experience:data.experienceRanges.at(-1),workSetting:data.workSettings[0],selectedRoleId:role.id,completedRoadmapSteps:{[role.id]:Object.fromEntries(role.roadmap.map(s=>[s.step,'2026-11-10']))}};
 const report=api.buildTransitionReport(),pdf=context.window.NucleusPDF.create(report,resources);
 assert.equal(pdf.getNumberOfPages(),2);
 assert.equal(report.meta[0],'Prepared for: '+'A'.repeat(60));
 const roadmap=context.window.NucleusPDF.layout(pdf,report,1,9).rows.filter(row=>row.marker);
 assert.equal(roadmap.length,role.roadmap.length);assert(roadmap.every(row=>row.completed));
 const pendingReport=JSON.parse(JSON.stringify(report));pendingReport.pages[1][0].items.forEach(item=>{item.completed=false;item.completedAt='';});
 assert(context.window.NucleusPDF.layout(pdf,pendingReport,1,9).rows.filter(row=>row.marker).every(row=>!row.completed));
 for(let page=0;page<2;page++)assert(context.window.NucleusPDF.layout(pdf,report,page,9).height<=276,profession.id+'/'+role.id+' overflows');
 const bytes=Buffer.from(pdf.output('arraybuffer'));assert(bytes.subarray(0,4).equals(Buffer.from('%PDF')));sample=bytes;count++;
}
const names=[...data.professions,...data.directions,...data.professions.flatMap(p=>p.responsibilities||[])].map(x=>x.icon).filter(Boolean);
const source=fs.readFileSync(root+'/scripts/app_controller.js','utf8');for(const name of names)assert(source.includes(name+':'), 'Missing icon: '+name);
if(process.env.NUCLEUS_PDF_SAMPLE){
 const state=api.state();state.displayName='Amir';state.user.fullName='Amir';state.assessment.professionId='nurse';state.assessment.selectedRoleId=data.careerRoles.at(-1).id;
 state.assessment.completedRoadmapSteps={[state.assessment.selectedRoleId]:{1:'2026-11-10',3:'2026-11-10'}};
 const report=api.buildTransitionReport();assert.equal(report.meta[0],'Prepared for: Amir');
 const preview=context.window.NucleusPDF.create(report,resources);fs.writeFileSync(process.env.NUCLEUS_PDF_SAMPLE,Buffer.from(preview.output('arraybuffer')));preview.deletePage(1);fs.writeFileSync(process.env.NUCLEUS_PDF_SAMPLE+'.page2.pdf',Buffer.from(preview.output('arraybuffer')));
}
console.info('PASS '+count+' profession/pathway reports fit two A4 pages, with all referenced icons defined.');
