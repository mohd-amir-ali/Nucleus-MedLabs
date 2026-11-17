/* Transparent pilot heuristics. These scores are not validated hiring probabilities. */
(function (root) {
  'use strict';
  const academic = {
    regulatory_affairs: /pharm|biotech|life sciences|m\.b\.b\.s|b\.d\.s|nutrition/i,
    pharmacovigilance: /pharm|nurs|m\.b\.b\.s|b\.d\.s|life sciences/i,
    clinical_research: /pharm|nurs|m\.b\.b\.s|b\.d\.s|biotech|life sciences|m\.l\.t/i,
    quality_compliance: /pharm|biotech|life sciences|m\.l\.t|nutrition/i,
    healthcare_technology: /biotech|m\.l\.t|pharm|life sciences|management/i,
    medical_affairs: /pharm|m\.b\.b\.s|b\.d\.s|biotech/i,
    healthcare_management: /management|m\.h\.a|m\.b\.a|nurs|m\.b\.b\.s/i,
    education_training: /pharm|nurs|m\.b\.b\.s|m\.sc|m\.pharm|physiotherapy/i,
    heor_market_access: /pharm|public health|management|biotech/i,
    medical_coding_billing: /c\.p\.c|coding|nurs|m\.b\.b\.s|pharm|life sciences/i,
    nutraceuticals_rd: /nutrition|pharm|biotech|life sciences/i,
    public_health_policy: /public health|m\.p\.h|nurs|m\.b\.b\.s|nutrition/i
  };
  const setting = {
    regulatory_affairs: /biopharma|corporate/i, pharmacovigilance: /hospital|clinical|corporate/i,
    clinical_research: /hospital|research|clinical/i, quality_compliance: /laboratory|research|biopharma/i,
    healthcare_technology: /corporate|laboratory/i, medical_affairs: /hospital|clinical|biopharma/i,
    healthcare_management: /hospital|corporate/i, education_training: /academic/i,
    heor_market_access: /research|corporate/i, medical_coding_billing: /corporate|hospital/i,
    nutraceuticals_rd: /research|laboratory/i, public_health_policy: /clinic|hospital|research/i
  };
  const normalized = text => String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  function unique(items) {
    const seen = new Set();
    return (items || []).filter(item => { const key = normalized(item); if (!key || seen.has(key)) return false; seen.add(key); return true; });
  }
  function breakdown(role, profile) {
    const index = role.bestFor.indexOf(profile.professionId);
    const profession = profile.professionId ? (index === 0 ? 25 : index > 0 ? 20 : 6) : 0;
    const education = profile.qualification ? ((academic[role.directionId] || /$^/).test(profile.qualification) ? 15 : 4) : 0;
    const exp = profile.experience || '';
    const experience = exp.includes('8+') ? 10 : exp.includes('5-8') ? 8 : exp.includes('3-5') ? 6 : exp.includes('1-3') ? 4 : 0;
    const workplace = profile.workSetting ? ((setting[role.directionId] || /$^/).test(profile.workSetting) ? 10 : 2) : 0;
    const responsibilities = role.relevantResp || [];
    const selected = new Set((profile.responsibilities || []).map(normalized));
    const responsibility = responsibilities.length ? Math.round(15 * responsibilities.filter(r => selected.has(normalized(r))).length / responsibilities.length) : 0;
    const keywords = role.relevantSkillKeywords || [];
    const skills = unique([...(profile.additionalSkills || []), ...((profile.confirmedSkills || {})[role.id] || [])]).map(normalized);
    const hits = keywords.filter(keyword => skills.some(skill => (' ' + skill + ' ').includes(' ' + normalized(keyword) + ' '))).length;
    const technical = keywords.length ? Math.round(25 * hits / keywords.length) : 0;
    return [
      {label:'Profession alignment', points:profession, max:25}, {label:'Academic alignment', points:education, max:15},
      {label:'Experience', points:experience, max:10}, {label:'Work setting', points:workplace, max:10},
      {label:'Selected responsibilities', points:responsibility, max:15}, {label:'Self-reported technical skills', points:technical, max:25}
    ];
  }
  function rank(data, profile) {
    return data.careerRoles.map(role => {
      const factors = breakdown(role, profile);
      const score = factors.reduce((sum, f) => sum + f.points, 0);
      return {...role, computedScore:score, factors, interestSelected:(profile.selectedDirections || []).includes(role.directionId), scaledSalaryRange:role.salaryRange,
        readinessLabel:score >= 75 ? 'Stronger starting point' : score >= 45 ? 'Developing foundation' : 'Explore the foundations'};
    }).sort((a,b) => b.computedScore-a.computedScore || Number(b.interestSelected)-Number(a.interestSelected) || a.title.localeCompare(b.title));
  }
  function skillsFor(role, profile, profession) {
    const confirmed = ((profile.confirmedSkills || {})[role.id] || []);
    const current = unique([...(profile.additionalSkills || []), ...(profile.responsibilities || []), ...confirmed]);
    const known = new Set(current.map(normalized));
    return {current, transferable:unique(profession.transferableSkills || []), suggested:unique(profession.coreSkills || []),
      gaps:role.newSkillsToAcquire.filter(skill => !known.has(normalized(skill)))};
  }
  function filterJobs(jobs, location, type) {
    return jobs.filter(job => (location === 'All Locations' || job.location === location) &&
      (type === 'All Types' || job.expTag === type || job.typeTag === type));
  }
  root.NucleusEngine = {rank, skillsFor, filterJobs, unique};
})(typeof window !== 'undefined' ? window : globalThis);
