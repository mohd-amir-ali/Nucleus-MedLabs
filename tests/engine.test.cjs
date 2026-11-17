const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),context={window:{},TextEncoder};
for(const file of ['data/career_engine_data.js','scripts/career_engine.js','scripts/pdf_export.js'])vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const data=context.window.NUCLEUS_DATA,engine=context.window.NucleusEngine;
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
const base={professionId:'fresh_graduate',qualification:'B.Pharm. (Bachelor of Pharmacy)',experience:'Fresher / Internship (0-1 year)',workSetting:'Academic Institution / Fresh Graduate',responsibilities:[],additionalSkills:[],selectedDirections:['clinical_research']};
test('An unassessed profile never gets a fabricated minimum score',()=>assert(engine.rank(data,{}).every(r=>r.computedScore===0)));
test('An interest alone does not inflate readiness',()=>{
 const a=engine.rank(data,base),b=engine.rank(data,{...base,selectedDirections:[]});
 a.forEach(role=>assert.equal(role.computedScore,b.find(r=>r.id===role.id).computedScore));
});
test('Fresh graduates without technical evidence do not receive near-perfect scores',()=>assert(engine.rank(data,base).every(r=>r.computedScore<60)));
test('Academic and workplace selections influence the estimate',()=>{
 const a=engine.rank(data,base),b=engine.rank(data,{...base,qualification:'M.H.A. / M.B.A. (Healthcare Management)',workSetting:'Hospital / Clinical'});
 assert(a.some(role=>role.computedScore!==b.find(r=>r.id===role.id).computedScore));
});
test('Score factors add up and salary is not inflated for experience',()=>engine.rank(data,{...base,experience:'8+ years'}).forEach(role=>{
 assert.equal(role.computedScore,role.factors.reduce((s,f)=>s+f.points,0));assert.equal(role.salaryRange,role.scaledSalaryRange);assert(role.computedScore>=0&&role.computedScore<=100);
}));
test('An empty remote filter stays empty',()=>{
 const role=data.careerRoles.find(r=>!r.jobs.some(j=>j.location==='Remote / India'));
 assert.equal(engine.filterJobs(role.jobs,'Remote / India','All Types').length,0);
});
test('Self-confirmed skills reduce gaps without assuming profession skills',()=>{
 const role=data.careerRoles[0],profession=data.professions[1];
 assert.equal(engine.skillsFor(role,base,profession).current.length,0);
 const p={...base,confirmedSkills:{[role.id]:[role.newSkillsToAcquire[0]]}};
 const buckets=engine.skillsFor(role,p,profession);assert.equal(buckets.gaps.length,role.newSkillsToAcquire.length-1);assert.equal(buckets.current.length,1);
});
test('All role references remain valid',()=>data.careerRoles.forEach(r=>{assert(data.directions.some(d=>d.id===r.directionId));r.bestFor.forEach(p=>assert(data.professions.some(prof=>prof.id===p)));}));
console.log(`${count} frontend logic checks passed.`);
