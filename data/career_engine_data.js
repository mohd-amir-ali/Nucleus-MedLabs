window.NUCLEUS_DATA = {
  brand: {
    name: "Nucleus",
    suffix: "MedLabs",
    fullName: "Nucleus MedLabs",
    productTitle: "Nucleus CareerShift",
    tagline: "Career Transition Navigator for Healthcare Professionals",
    city: "Hyderabad, Telangana, India"
  },

  heroBanners: [
    {id:"slide_careershift",layout:"text-left",badge:"12 career directions",title:"Your next chapter in healthcare",desc:"Turn your experience into a clear career pathway, with skills and practical next steps.",image:"Banner-Images/career-pathways.jpg"},
    {id:"slide_medical_access",layout:"text-right",badge:"Global perspective",title:"Healthcare beyond borders",desc:"Explore the wider world of clinical advisory, medical access and hospital partnerships.",image:"Banner-Images/medical-advisory.jpg"},
    {id:"slide_academic_licensure",layout:"text-left",badge:"Learning and advancement",title:"Build on what you know",desc:"Find learning directions for your next professional milestone. Check eligibility with the provider.",image:"Banner-Images/learning-advancement.jpg"},
    {id:"slide_compliance_nutra",layout:"text-right",badge:"Quality and innovation",title:"Make your expertise count",desc:"Discover pathways in regulatory affairs, quality systems and nutraceutical development.",image:"Banner-Images/quality-regulatory.jpg"}
  ],

  popularTransitions: [
    {
      id: "pop_pharm_ra",
      fromId: "pharmacist",
      toDirectionId: "regulatory_affairs",
      toRoleId: "regulatory_affairs_associate",
      fromLabel: "Pharmacist",
      toLabel: "Regulatory Affairs",
      iconType: "pill",
      tone: "blue"
    },
    {
      id: "pop_nurse_pv",
      fromId: "nurse",
      toDirectionId: "pharmacovigilance",
      toRoleId: "pharmacovigilance_associate",
      fromLabel: "Nurse",
      toLabel: "Patient Safety",
      iconType: "heart_pulse",
      tone: "teal"
    },
    {
      id: "pop_nutri_qa",
      fromId: "nutritionist",
      toDirectionId: "nutraceuticals_rd",
      toRoleId: "nutraceutical_formulation_scientist",
      fromLabel: "Nutritionist",
      toLabel: "Nutraceutical R&D",
      iconType: "leaf",
      tone: "emerald"
    },
    {
      id: "pop_lab_cr",
      fromId: "lab_scientist",
      toDirectionId: "clinical_research",
      toRoleId: "clinical_research_associate",
      fromLabel: "Lab Scientist",
      toLabel: "Clinical Research",
      iconType: "flask",
      tone: "purple"
    }
  ],

  // Point 5: Expanded 14 Professions (7 Symmetric 2-Column Rows) Including Fresh Graduate / Clinical Intern & Clinical Pharmacist (Pharm.D.)
  professions: [
    {
      id: "fresh_graduate",
      title: "Fresh Graduate / Clinical Intern",
      subtitle: "B.Pharm., Pharm.D., B.Sc., M.Sc., M.B.B.S., B.D.S., Nursing, or Allied Fresher",
      defaultQualification: "B.Pharm. (Bachelor of Pharmacy)",
      defaultExperience: "Fresher / Internship (0-1 year)",
      defaultSetting: "Academic Institution / Fresh Graduate",
      icon: "grad_cap",
      color: "emerald",
      coreSkills: [
        "Academic pharmacology & pathophysiology foundation",
        "Clinical rotation & internship case charting",
        "Scientific literature & PubMed abstract review",
        "Good Laboratory & Clinical Practice (GLP / GCP) basics",
        "Dissertation & academic project documentation",
        "Medical terminology & anatomical classification",
        "Basic biostatistics & MS Excel data tabulation",
        "Adverse drug reaction (ADR) academic case logging",
        "Standard Operating Procedure (SOP) comprehension",
        "Patient history intake & internship counselling",
        "Drug mechanism of action (MOA) analysis",
        "Healthcare regulatory & ethics fundamentals"
      ],
      transferableSkills: [
        "Rapid corporate life sciences trainability",
        "Structured scientific & technical writing",
        "Digital health & EDC software adaptability",
        "Analytical literature synthesis",
        "Cross-functional academic team collaboration",
        "Attention to regulatory compliance guidelines",
        "Evidence-based clinical reasoning",
        "Quantitative data organization",
        "Presentation & seminar communication",
        "Quality documentation mindset"
      ]
    },
    {
      id: "pharmacist",
      title: "Pharmacist",
      subtitle: "Hospital, Retail, Community, or Industrial Pharmacy",
      defaultQualification: "B.Pharm. (Bachelor of Pharmacy)",
      defaultSetting: "Hospital / Clinical",
      icon: "user_rx",
      color: "indigo",
      coreSkills: [
        "Pharmacology & therapeutics mastery",
        "Drug safety & contraindication screening",
        "Scientific literature evaluation",
        "Clinical & batch documentation",
        "Attention to regulatory compliance",
        "Prescription & formulary auditing",
        "Dosage & pharmacokinetic calculation",
        "Adverse Drug Reaction (ADR) detection",
        "Good Manufacturing Practice (cGMP) basics",
        "Patient medication counselling",
        "Drug-drug interaction analysis",
        "Formulation & stability fundamentals"
      ],
      transferableSkills: [
        "Regulatory compliance mindset",
        "Critical analytical reasoning",
        "Benefit-risk evaluation",
        "Scientific & medical communication",
        "Pharmaceutical product lifecycle insight",
        "Cross-functional team coordination",
        "Standard Operating Procedure (SOP) adherence",
        "Clinical trial data interpretation",
        "Ethical governance compliance",
        "Quality assurance documentation review"
      ]
    },
    {
      id: "clinical_pharmacist",
      title: "Clinical Pharmacist (Pharm.D.)",
      subtitle: "Ward Rounds, ICU Pharmacotherapy, M.T.M. & Stewardship",
      defaultQualification: "Pharm.D. (Doctor of Pharmacy)",
      defaultSetting: "Hospital / Clinical",
      icon: "shield_pill",
      color: "blue",
      coreSkills: [
        "Medication Therapy Management (MTM)",
        "ICU & inpatient ward round pharmacotherapy",
        "Serious Adverse Event (SAE) causality evaluation",
        "Antimicrobial stewardship & therapeutic drug monitoring",
        "Clinical trial protocol & investigator brochure review",
        "Evidence-based drug information monograph authoring",
        "Renal & hepatic dose adjustment calculation",
        "Hospital Pharmacy & Therapeutics (P&T) formulary review",
        "Polypharmacy & drug interaction reconciliation",
        "Patient discharge counselling & adherence auditing",
        "Pharmacoeconomic cost-effectiveness evaluation",
        "Clinical case narrative documentation"
      ],
      transferableSkills: [
        "Medical safety review & pharmacovigilance narratives",
        "Medical Science Liaison (MSL) scientific exchange",
        "Health Economics & Outcomes Research (HEOR) analysis",
        "Clinical Study Report (CSR) medical writing",
        "Phase I-IV clinical trial site monitoring",
        "Physician & Key Opinion Leader (KOL) communication",
        "Regulatory benefit-risk dossier evaluation",
        "Clinical protocol compliance auditing",
        "Multidisciplinary clinical leadership",
        "Real-World Evidence (RWE) data interpretation"
      ]
    },
    {
      id: "nurse",
      title: "Nurse",
      subtitle: "Registered Nurse, I.C.U., Ward, or Clinical Care",
      defaultQualification: "B.Sc. Nursing (Bachelor of Science in Nursing)",
      defaultSetting: "Hospital / Clinical",
      icon: "heart",
      color: "teal",
      coreSkills: [
        "Patient triage & acute monitoring",
        "Medication administration safety",
        "Adverse drug reaction charting",
        "Electronic Health Record (EHR) documentation",
        "Hospital infection control compliance",
        "Clinical care plan execution",
        "Emergency protocol adherence",
        "Vital signs trend interpretation",
        "Patient & family health education",
        "Multidisciplinary ward handoffs",
        "Informed consent facilitation",
        "Clinical quality audit charting"
      ],
      transferableSkills: [
        "High-pressure clinical decision making",
        "Safety case narrative authoring",
        "Patient safety & ethics advocacy",
        "Strict protocol compliance",
        "Root-cause clinical investigation",
        "Empathy-driven stakeholder communication",
        "Time-critical task prioritization",
        "Clinical team supervision",
        "Medical terminology fluency",
        "Confidential health data stewardship"
      ]
    },
    {
      id: "doctor",
      title: "Doctor",
      subtitle: "M.B.B.S., M.D., B.A.M.S., B.H.M.S., or Resident Medical Officer",
      defaultQualification: "M.B.B.S. (Bachelor of Medicine & Bachelor of Surgery)",
      defaultSetting: "Hospital / Clinical",
      icon: "stethoscope",
      color: "blue",
      coreSkills: [
        "Differential diagnosis & clinical triage",
        "Evidence-based pharmacotherapy",
        "Serious Adverse Event (SAE) causality review",
        "Inpatient & outpatient clinical management",
        "Diagnostic imaging & lab interpretation",
        "Clinical protocol implementation",
        "Discharge summary & medico-legal charting",
        "Patient risk stratification",
        "Multi-specialty case consultation",
        "Emergency resuscitation protocols",
        "Medical ethics & informed consent",
        "Clinical audit leadership"
      ],
      transferableSkills: [
        "Medical monitor & safety review authority",
        "Key Opinion Leader (KOL) scientific dialogue",
        "Clinical study protocol design",
        "Executive hospital operations insight",
        "Health economics & outcome evaluation",
        "High-stakes clinical decision making",
        "Medical writing & publication review",
        "Regulatory risk-benefit analysis",
        "Cross-functional team leadership",
        "Digital health clinical validation"
      ]
    },
    {
      id: "dentist",
      title: "Dentist",
      subtitle: "B.D.S., M.D.S., Oral Surgery, or Public Health Dentistry",
      defaultQualification: "B.D.S. / M.D.S. (Dental Surgery)",
      defaultSetting: "Clinic / Outpatient Practice",
      icon: "tooth",
      color: "cyan",
      coreSkills: [
        "Oral pathology differential diagnosis",
        "Minor surgical procedure execution",
        "Local anesthesia pharmacology",
        "Dental radiography interpretation",
        "Sterilization & infection control",
        "Craniofacial anatomy mastery",
        "Biomaterial & implant compatibility",
        "Analgesic & antibiotic prescribing",
        "Patient case history documentation",
        "Medical emergency management",
        "Treatment plan cost estimation",
        "Clinical charting accuracy"
      ],
      transferableSkills: [
        "High-level clinical diagnostic reasoning",
        "Medical safety & adverse event triage",
        "Practice operations & clinic management",
        "Scientific manuscript interpretation",
        "Medical & dental coding familiarity",
        "Patient consultation & informed consent",
        "Precision quality auditing",
        "Cross-functional healthcare leadership",
        "Regulatory licensing compliance",
        "Structured clinical reporting"
      ]
    },
    {
      id: "lab_scientist",
      title: "Medical Laboratory Scientist",
      subtitle: "Pathology, Biochemistry, Microbiology, or Molecular Lab",
      defaultQualification: "B.Sc. / M.Sc. M.L.T. (Medical Laboratory Technology)",
      defaultSetting: "Diagnostic Laboratory",
      icon: "microscope",
      color: "blue",
      coreSkills: [
        "Diagnostic assay calibration",
        "Hematology & biochemistry analysis",
        "Good Laboratory Practice (GLP)",
        "Biospecimen chain-of-custody tracking",
        "Internal Quality Control (IQC) plotting",
        "PCR & molecular diagnostics",
        "Lab Information Management Systems (LIMS)",
        "Microbial culture & sensitivity testing",
        "Standard curve validation",
        "Analytical instrument troubleshooting",
        "NABL accreditation documentation",
        "Biohazard safety compliance"
      ],
      transferableSkills: [
        "High analytical precision",
        "Clinical data integrity validation",
        "Root-cause deviation logging",
        "Protocol-driven execution",
        "Batch record verification",
        "Quantitative statistical review",
        "Technical SOP authoring",
        "Regulatory audit readiness",
        "Central lab sample lifecycle tracking",
        "Biomedical vendor coordination"
      ]
    },
    {
      id: "biotech",
      title: "Biotechnology Professional",
      subtitle: "Biotech, Microbiology, Biochemistry, or Life Sciences",
      defaultQualification: "B.Tech. / M.Sc. Biotechnology & Life Sciences",
      defaultSetting: "Research / Biopharma Lab",
      icon: "dna",
      color: "purple",
      coreSkills: [
        "Upstream & downstream bioprocessing",
        "Cell culture & aseptic technique",
        "ELISA, HPLC & analytical characterization",
        "Molecular cloning & genomic assays",
        "Experimental Design (DoE) & biostatistics",
        "CMC (Chemistry, Manufacturing & Controls)",
        "Biosimilar & biologics assay validation",
        "Technical batch record authoring",
        "Scientific literature mining",
        "Good Manufacturing Practice (cGMP) workflows",
        "Stability study testing",
        "Reagent & inventory lifecycle control"
      ],
      transferableSkills: [
        "CMC regulatory dossier compilation",
        "Quality assurance & deviation analysis",
        "Preclinical-to-clinical translation insight",
        "Technical scientific writing",
        "Quantitative data modeling",
        "Process validation compliance",
        "Cross-lab project coordination",
        "Patent & intellectual property review",
        "Vendor specification auditing",
        "Systematic problem solving"
      ]
    },
    {
      id: "nutritionist",
      title: "Nutritionist / Dietitian",
      subtitle: "Clinical Dietetics, Sports, or Public Health Nutrition",
      defaultQualification: "B.Sc. / M.Sc. Clinical Nutrition & Dietetics",
      defaultSetting: "Hospital / Clinical",
      icon: "apple_heart",
      color: "coral",
      coreSkills: [
        "Medical nutrition therapy (MNT)",
        "Micronutrient deficiency assessment",
        "Dietary recall & anthropometry",
        "Nutraceutical ingredient evaluation",
        "Food safety & hygiene standards",
        "Metabolic disorder diet planning",
        "Nutritional & FSSAI labeling review",
        "Patient lifestyle counselling",
        "Evidence-based diet formulation",
        "Public health nutrition education",
        "Supplement interaction screening",
        "Longitudinal outcome tracking"
      ],
      transferableSkills: [
        "FSSAI & Codex standards literacy",
        "Consumer health communication",
        "Functional claim verification",
        "Clinical research data synthesis",
        "Preventive healthcare strategy",
        "Client consultation workflow",
        "Cross-departmental collaboration",
        "Quality assurance mindset",
        "Behavioral change coaching",
        "Structured clinical reporting"
      ]
    },
    {
      id: "physiotherapist",
      title: "Physiotherapist",
      subtitle: "Orthopedic, Neurological, Cardiopulmonary, or Rehab",
      defaultQualification: "B.P.T. / M.P.T. (Physiotherapy)",
      defaultSetting: "Hospital / Clinical",
      icon: "activity_person",
      color: "amber",
      coreSkills: [
        "Musculoskeletal functional assessment",
        "Biomechanical gait analysis",
        "Post-operative rehabilitation protocols",
        "Pain management modalities",
        "Ergonomic risk evaluation",
        "Neurological motor recovery scoring",
        "Patient mobility outcome tracking",
        "Assistive medical device fitting",
        "Clinical progress documentation",
        "Cardiopulmonary endurance testing",
        "Exercise prescription design",
        "Manual therapy safety"
      ],
      transferableSkills: [
        "Medical device usability evaluation",
        "Longitudinal outcome measurement",
        "Patient adherence coaching",
        "Clinical trial functional endpoint scoring",
        "Anatomy & kinesiology mastery",
        "Interdisciplinary rehabilitation planning",
        "Case documentation accuracy",
        "Healthcare quality improvement",
        "Client relationship management",
        "Structured goal setting"
      ]
    },
    {
      id: "healthcare_admin",
      title: "Healthcare Administrator",
      subtitle: "Hospital Operations, Front Office, T.P.A., or Quality Desk",
      defaultQualification: "M.H.A. / M.B.A. (Healthcare Management)",
      defaultSetting: "Hospital / Corporate Healthcare",
      icon: "building_med",
      color: "indigo",
      coreSkills: [
        "Hospital Information System (HIS) workflows",
        "NABH & JCI accreditation coordination",
        "Revenue cycle & insurance TPA claims",
        "Outpatient & inpatient capacity planning",
        "Clinical department KPI tracking",
        "Vendor & biomedical procurement",
        "Patient grievance resolution",
        "Medical records compliance auditing",
        "Staff rostering & resource allocation",
        "Standard Operating Procedure (SOP) rollout",
        "Healthcare budgeting & cost control",
        "Regulatory licensing renewals"
      ],
      transferableSkills: [
        "Project & program governance",
        "Stakeholder & vendor negotiation",
        "Operational process optimization",
        "Healthcare data analytics reporting",
        "Quality Management System (QMS) leadership",
        "Change management in clinical settings",
        "Cross-functional team supervision",
        "Risk & compliance auditing",
        "International patient care coordination",
        "Executive presentation & reporting"
      ]
    },
    {
      id: "psychologist",
      title: "Psychologist",
      subtitle: "Clinical Psychology, Behavioral Health, or Counseling",
      defaultQualification: "M.Sc. Clinical Psychology / M.P.H. (Public Health)",
      defaultSetting: "Clinic / Outpatient Practice",
      icon: "brain",
      color: "amber",
      coreSkills: [
        "Psychometric & cognitive assessment",
        "Diagnostic interviewing (DSM-5 / ICD-11)",
        "Behavioral intervention planning",
        "Patient-Reported Outcome (PRO) evaluation",
        "Confidential clinical case documentation",
        "Crisis intervention & de-escalation",
        "Longitudinal behavioral data tracking",
        "Corporate wellness program design",
        "Neuropsychological screening",
        "Therapeutic alliance building",
        "Research methodology & psychometrics",
        "Group facilitation & training"
      ],
      transferableSkills: [
        "CNS clinical trial scale administration",
        "Patient-centric UX & digital health design",
        "Organizational development & consulting",
        "Qualitative & quantitative research analysis",
        "Empathetic stakeholder communication",
        "Ethical compliance & data privacy",
        "Training curriculum development",
        "Patient advocacy & adherence strategy",
        "Structured behavioral reporting",
        "Conflict resolution"
      ]
    },
    {
      id: "medical_coder",
      title: "Medical Coder",
      subtitle: "ICD-10-CM, CPT, HCPCS, or Revenue Cycle Billing",
      defaultQualification: "B.Sc. Life Sciences + C.P.C. Certification",
      defaultSetting: "Healthcare B.P.O. / Corporate",
      icon: "code_file",
      color: "orange",
      coreSkills: [
        "ICD-10-CM diagnostic coding accuracy",
        "CPT & HCPCS procedural coding",
        "Medical chart abstraction",
        "HIPAA privacy & security compliance",
        "DRG (Diagnosis Related Group) validation",
        "Insurance claim scrubbing & denial analysis",
        "Anatomy & pathophysiology terminology",
        "Coding quality audit compliance (98%+ SLA)",
        "Electronic Medical Record (EMR) navigation",
        "National Correct Coding Initiative (NCCI) edits",
        "Physician query formulation",
        "Healthcare reimbursement rules"
      ],
      transferableSkills: [
        "MedDRA & WHODrug clinical dictionary coding",
        "Clinical Data Management (CDM) discrepancy review",
        "High-volume data quality assurance",
        "Structured clinical database querying",
        "Regulatory audit trail maintenance",
        "Rapid medical narrative comprehension",
        "SLA & productivity metrics management",
        "Process documentation",
        "Cross-team quality calibration",
        "Attention to granular clinical detail"
      ]
    },
    {
      id: "other_health",
      title: "Other Healthcare Professional",
      subtitle: "Optometry, Radiology, Public Health, Biomedical, or Allied",
      defaultQualification: "B.Sc. Allied Health Sciences / M.P.H.",
      defaultSetting: "Hospital / Clinical",
      icon: "plus_shield",
      color: "emerald",
      coreSkills: [
        "Clinical patient care & safety",
        "Medical terminology & anatomy",
        "Diagnostic equipment operation",
        "Healthcare documentation standards",
        "Infection prevention protocols",
        "Interdisciplinary care coordination",
        "Patient education & intake",
        "Quality assurance checks",
        "Standard Operating Procedure adherence",
        "Health data recording",
        "Ethical clinical conduct",
        "Emergency response readiness"
      ],
      transferableSkills: [
        "Clinical workflow literacy",
        "Analytical problem solving",
        "Structured regulatory documentation",
        "Cross-functional teamwork",
        "Adaptability to digital health tools",
        "Risk awareness & mitigation",
        "Clear stakeholder communication",
        "Time & priority management",
        "Continuous compliance learning",
        "Quality service delivery"
      ]
    }
  ],

  qualifications: [
    "B.Pharm. (Bachelor of Pharmacy)",
    "M.Pharm. (Master of Pharmacy)",
    "Pharm.D. (Doctor of Pharmacy)",
    "B.Sc. Nursing (Bachelor of Science in Nursing)",
    "G.N.M. / M.Sc. Nursing",
    "M.B.B.S. (Bachelor of Medicine & Bachelor of Surgery)",
    "B.D.S. / M.D.S. (Dental Surgery)",
    "B.A.M.S. / B.H.M.S. (AYUSH Medical Degree)",
    "B.P.T. / M.P.T. (Physiotherapy)",
    "B.Sc. / M.Sc. Clinical Nutrition & Dietetics",
    "B.Sc. / M.Sc. M.L.T. (Medical Laboratory Technology)",
    "B.Tech. / M.Sc. Biotechnology & Life Sciences",
    "M.H.A. / M.B.A. (Healthcare Management)",
    "M.Sc. Clinical Psychology / M.P.H. (Public Health)",
    "B.Sc. Life Sciences + C.P.C. Certification"
  ],

  experienceRanges: [
    "Fresher / Internship (0-1 year)",
    "1-3 years",
    "3-5 years",
    "5-8 years",
    "8+ years"
  ],

  workSettings: [
    "Hospital / Clinical",
    "Retail / Community Pharmacy",
    "Diagnostic Laboratory",
    "Clinic / Outpatient Practice",
    "Research / Biopharma Lab",
    "Healthcare B.P.O. / Corporate",
    "Academic Institution / Fresh Graduate"
  ],

  // Point 6: Dedicated Purpose-Built Clinical Icons for All 8 Current Responsibilities
  responsibilitiesList: [
    { label: "Patient Counselling", icon: "chat_heart", tone: "blue" },
    { label: "Medication Safety", icon: "shield_pill", tone: "teal" },
    { label: "Inventory Management", icon: "boxes_inventory", tone: "amber" },
    { label: "Clinical Documentation", icon: "file_clinical", tone: "indigo" },
    { label: "Team Supervision", icon: "users_team", tone: "purple" },
    { label: "Regulatory Compliance", icon: "clipboard_check", tone: "emerald" },
    { label: "Diagnostic Sample Analysis", icon: "microscope", tone: "cyan" },
    { label: "Adverse Event Reporting", icon: "alert_ecg", tone: "coral" }
  ],

  // Point 6: 10 Distinct Technical Additional Skills (Zero Overlap with Current Responsibilities)
  suggestedAdditionalSkills: [
    "ICH-GCP Guidelines",
    "MedDRA & ICD-10 Coding",
    "Pharmacovigilance (ICSR)",
    "CTD / eCTD Dossier Basics",
    "MS Excel & Biostatistics",
    "SOP Writing & cGMP Audit",
    "PubMed Literature Review",
    "Clinical Data (EDC / CDISC)",
    "Electronic Health Records (EHR)",
    "Medical & Scientific Writing"
  ],

  directions: [
    {
      id: "clinical_research",
      title: "Clinical Research",
      subtitle: "Trials, site monitoring, protocol operations",
      icon: "flask_user",
      tone: "emerald"
    },
    {
      id: "regulatory_affairs",
      title: "Regulatory Affairs",
      subtitle: "Submissions, CDSCO/FDA compliance, dossiers",
      icon: "doc_check",
      tone: "blue"
    },
    {
      id: "pharmacovigilance",
      title: "Pharmacovigilance",
      subtitle: "Drug safety, ICSR processing, risk management",
      icon: "shield_alert",
      tone: "orange"
    },
    {
      id: "quality_compliance",
      title: "Quality & Compliance",
      subtitle: "GxP, CAPA audits, quality systems",
      icon: "clipboard_check",
      tone: "teal"
    },
    {
      id: "healthcare_technology",
      title: "Healthcare Technology",
      subtitle: "EHR, clinical data, digital health",
      icon: "cpu_health",
      tone: "purple"
    },
    {
      id: "medical_affairs",
      title: "Medical Affairs",
      subtitle: "Scientific communication, medical writing",
      icon: "presentation_med",
      tone: "indigo"
    },
    {
      id: "healthcare_management",
      title: "Healthcare Management",
      subtitle: "Hospital operations, consulting, medical access",
      icon: "briefcase_med",
      tone: "emerald"
    },
    {
      id: "education_training",
      title: "Education & Training",
      subtitle: "OET coaching, CME curriculum, academic roles",
      icon: "grad_cap",
      tone: "blue"
    },
    {
      id: "heor_market_access",
      title: "Health Economics (HEOR)",
      subtitle: "Market access, pricing, outcomes research",
      icon: "activity_person",
      tone: "cyan"
    },
    {
      id: "medical_coding_billing",
      title: "Medical Coding & Billing",
      subtitle: "ICD-10-CM, CPT, revenue cycle auditing",
      icon: "code_file",
      tone: "amber"
    },
    {
      id: "nutraceuticals_rd",
      title: "Nutraceuticals & R&D",
      subtitle: "Formulation science, FSSAI/FDA supplements",
      icon: "leaf",
      tone: "teal"
    },
    {
      id: "public_health_policy",
      title: "Public Health & Policy",
      subtitle: "Epidemiology, biostatistics, global health",
      icon: "plus_shield",
      tone: "coral"
    }
  ],

  careerRoles: [
    {
      id: "regulatory_affairs_associate",
      title: "Regulatory Affairs Associate",
      directionId: "regulatory_affairs",
      baseScore: 72,
      matchLabel: "High Match",
      difficulty: "Moderate Difficulty",
      difficultyShort: "Moderate Difficulty",
      timeline: "6 - 10 months",
      salaryRange: "INR 4.5 - 8.2 LPA",
      bestFor: ["pharmacist", "clinical_pharmacist", "biotech", "fresh_graduate", "lab_scientist", "dentist", "doctor"],
      relevantResp: ["Regulatory Compliance", "Clinical Documentation", "Medication Safety"],
      relevantSkillKeywords: ["Regulatory", "Dossier", "Documentation", "SOP", "ICH"],
      overviewSummary: "Your knowledge of medicines, therapeutic areas, and regulatory concepts provides a strong foundation for Regulatory Affairs. Your clinical and documentation experience is highly valued in global dossier submissions.",
      keyInsights: [
        "High relevance of existing pharmacology and clinical documentation knowledge",
        "Growing demand across global pharmaceutical, biologics, and med-device firms",
        "Multiple entry-level associate opportunities in India GCCs",
        "Clear career progression path toward Regulatory Lead and Strategy Director"
      ],
      newSkillsToAcquire: [
        "Regulatory submission processes (NDA, ANDA, IND)",
        "ICH guidelines (Q, S, E, M series)",
        "Dossier preparation (CTD / ACTD Modules 1-5)",
        "Global regulatory intelligence & tracking",
        "eCTD publishing & submission systems",
        "CDSCO Sugam & US FDA 510(k) filings",
        "CMC post-approval change control assessment",
        "Product labeling & SmPC compliance"
      ],
      roadmap: [
        { step: 1, title: "Build Foundational Knowledge", desc: "Learn regulatory basics, ICH guidelines, and global regulatory frameworks (CDSCO, US FDA, EMA).", duration: "1-2 months" },
        { step: 2, title: "Develop Practical Dossier Skills", desc: "Hands-on training in CTD dossier assembly, eCTD publishing, and CMC documentation.", duration: "2-3 months" },
        { step: 3, title: "Gain Real-World Case Experience", desc: "Work on regulatory gap analysis case studies, mock ANDA submissions, or internships.", duration: "2-3 months" },
        { step: 4, title: "Earn Regulatory Certification", desc: "Complete accredited Global Regulatory Affairs certification modules.", duration: "1-2 months" },
        { step: 5, title: "Apply for Associate Roles", desc: "Target Regulatory Affairs Associate and CMC Documentation positions.", duration: "Ongoing" }
      ],
      courses: [
        {"id": "course_ra_1", "title": "Global Regulatory Affairs & eCTD Submissions", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_ra_2", "title": "ICH Q, E, S & M Guidelines for Pharmaceutical Registration", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_ra_3", "title": "Drug Development, FDA Regulation & Compliance Specialization", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"}
      ],
      jobs: []
    },
    {
      id: "pharmacovigilance_associate",
      title: "Pharmacovigilance & Drug Safety Associate",
      directionId: "pharmacovigilance",
      baseScore: 72,
      matchLabel: "High Match",
      difficulty: "Low-Moderate",
      difficultyShort: "Low-Moderate Difficulty",
      timeline: "4 - 7 months",
      salaryRange: "INR 4.2 - 7.5 LPA",
      bestFor: ["clinical_pharmacist", "pharmacist", "fresh_graduate", "nurse", "doctor", "dentist", "medical_coder", "physiotherapist"],
      relevantResp: ["Adverse Event Reporting", "Medication Safety", "Patient Counselling", "Clinical Documentation"],
      relevantSkillKeywords: ["Pharmacovigilance", "MedDRA", "Safety", "Clinical", "EHR"],
      overviewSummary: "Your frontline clinical exposure to patient medications, adverse drug reactions, and medical charting makes you an immediate fit for Drug Safety and Pharmacovigilance operations.",
      keyInsights: [
        "Direct application of your pharmacology, nursing, or clinical triage skills",
        "India is the global hub for CRO Pharmacovigilance case processing",
        "Fastest onboarding timeline among corporate life sciences roles",
        "Clear progression to Drug Safety Specialist, Signal Analyst, or PV Team Lead"
      ],
      newSkillsToAcquire: [
        "ICSR (Individual Case Safety Report) end-to-end processing",
        "MedDRA & WHODrug dictionary coding",
        "ICH E2A, E2B(R3) & GVP Module guidelines",
        "Oracle Argus Safety & ArisG database workflow",
        "Seriousness & causality assessment (WHO-UMC / Naranjo)",
        "Medical safety narrative authoring",
        "Aggregate reporting (PSUR / PBRER / DSUR)",
        "Signal detection & Risk Management Plans (RMP)"
      ],
      roadmap: [
        { step: 1, title: "Master Drug Safety Fundamentals", desc: "Learn ICH E2A-E2F standards, GVP modules, and adverse event vs. ADR criteria.", duration: "1 month" },
        { step: 2, title: "Hands-On ICSR & MedDRA Practice", desc: "Practice case triage, MedDRA Lowest Level Term (LLT/PT) coding, and safety narrative writing.", duration: "1-2 months" },
        { step: 3, title: "Safety Database Simulation", desc: "Train on Oracle Argus / ArisG mock workflows and E2B XML regulatory timelines.", duration: "1-2 months" },
        { step: 4, title: "Complete PV Certification", desc: "Obtain specialized Pharmacovigilance & Clinical Safety certification with mock evaluations.", duration: "1 month" },
        { step: 5, title: "Apply to Global CROs & Pharma GCCs", desc: "Target Drug Safety Associate (DSA) and PV Case Processor openings.", duration: "Ongoing" }
      ],
      courses: [
        {"id": "course_pv_1", "title": "Pharmacovigilance, Argus Safety & MedDRA Case Lab", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_pv_2", "title": "Pharmacovigilance & Clinical Safety Narrative", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_pv_3", "title": "WHO-UMC Causality Assessment & Global Drug Monitoring", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"}
      ],
      jobs: []
    },
    {
      id: "clinical_research_associate",
      title: "Clinical Research Associate (CRA / CRC)",
      directionId: "clinical_research",
      baseScore: 72,
      matchLabel: "High Match",
      difficulty: "Moderate Difficulty",
      difficultyShort: "Moderate Difficulty",
      timeline: "5 - 9 months",
      salaryRange: "INR 4.8 - 8.6 LPA",
      bestFor: ["clinical_pharmacist", "lab_scientist", "fresh_graduate", "nurse", "pharmacist", "doctor", "dentist", "biotech", "physiotherapist"],
      relevantResp: ["Diagnostic Sample Analysis", "Clinical Documentation", "Patient Counselling", "Adverse Event Reporting"],
      relevantSkillKeywords: ["ICH-GCP", "Clinical", "PubMed", "EHR"],
      overviewSummary: "Your familiarity with hospital protocols, diagnostic reporting, and patient ethics enables a seamless move into monitoring Phase I-IV clinical trials as a Clinical Research Coordinator (CRC) or CRA.",
      keyInsights: [
        "Strong hospital and diagnostic background translates directly to site monitoring",
        "Rapidly expanding multi-center clinical trials across Tier-1 Indian hospitals",
        "High upward mobility toward Senior CRA and Clinical Trial Manager (CTM)",
        "Combines scientific rigor with cross-site clinical project management"
      ],
      newSkillsToAcquire: [
        "ICH E6(R3) Good Clinical Practice (GCP)",
        "Trial Master File (eTMF) & Investigator Site File (ISF) auditing",
        "Source Data Verification (SDV) & Source Data Review (SDR)",
        "Electronic Data Capture (Medidata Rave / Veeva Vault)",
        "Ethics Committee (IEC/IRB) & NDCT Rules 2019 submissions",
        "Protocol deviation & CAPA management",
        "Investigational Product (IP) accountability",
        "Site initiation, monitoring, and close-out visits"
      ],
      roadmap: [
        { step: 1, title: "Master ICH-GCP E6(R3) & NDCT Rules", desc: "Complete Good Clinical Practice training, Belmont Report ethics, and India NDCT Rules.", duration: "1-2 months" },
        { step: 2, title: "Train on eTMF, EDC & Site Monitoring", desc: "Learn Veeva Vault eTMF artifact filing, Medidata Rave CRF review, and SDV checklists.", duration: "2-3 months" },
        { step: 3, title: "Site Operations or CRC Practicum", desc: "Gain hands-on exposure to informed consent logs, query resolution, and SAE reporting.", duration: "2 months" },
        { step: 4, title: "Earn Clinical Research Certification", desc: "Complete accredited CRC / CRA certification with mock monitoring visit reports.", duration: "1 month" },
        { step: 5, title: "Target CRC, In-House CRA & CTA Roles", desc: "Apply to global CROs (IQVIA, Parexel, Syneos, ICON) and hospital research units.", duration: "Ongoing" }
      ],
      courses: [
        {"id": "course_cr_1", "title": "Clinical Research, GCP & Veeva eTMF", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_cr_2", "title": "Good Clinical Practice (ICH E6) Investigator & Monitor Track", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_cr_3", "title": "Design and Interpretation of Clinical Trials", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"}
      ],
      jobs: []
    },
    {
      id: "medical_writer",
      title: "Medical Writer & Scientific Communicator",
      directionId: "medical_affairs",
      baseScore: 72,
      matchLabel: "High Match",
      difficulty: "Moderate Difficulty",
      difficultyShort: "Moderate Difficulty",
      timeline: "5 - 8 months",
      salaryRange: "INR 5.2 - 9.2 LPA",
      bestFor: ["doctor", "clinical_pharmacist", "dentist", "pharmacist", "biotech", "fresh_graduate", "psychologist", "nutritionist"],
      relevantResp: ["Clinical Documentation", "Patient Counselling", "Adverse Event Reporting"],
      relevantSkillKeywords: ["PubMed", "Writing", "ICH-GCP", "Dossier"],
      overviewSummary: "Your ability to synthesize clinical literature, interpret therapeutic outcomes, and communicate complex medical concepts clearly makes you a strong candidate for Regulatory and MedComms Medical Writing.",
      keyInsights: [
        "High demand for Clinical Study Reports (CSRs), slide decks, and CME modules",
        "Strong remote and hybrid flexibility across global pharma medical affairs teams",
        "Leverages your academic research and scientific literature review background",
        "Direct pathway to Senior Medical Writer or Medical Science Liaison (MSL)"
      ],
      newSkillsToAcquire: [
        "ICH E3 Clinical Study Report (CSR) structure",
        "Investigator Brochure (IB) & clinical protocol authoring",
        "ICMJE publication ethics & CONSORT guidelines",
        "PubMed / Embase systematic literature review",
        "Plain Language Summaries (PLS) & patient education design",
        "CME slide deck & medical congress abstract creation",
        "AMA Manual of Style & reference management (EndNote)",
        "Statistical data table interpretation (p-values, CI, HR)"
      ],
      roadmap: [
        { step: 1, title: "Learn Regulatory vs. MedComms Formats", desc: "Study ICH E3 guidelines for Clinical Study Reports alongside ICMJE publication standards.", duration: "1-2 months" },
        { step: 2, title: "Build a 3-Piece Writing Portfolio", desc: "Draft a clinical trial executive summary, a CME slide deck, and a patient health guide.", duration: "2 months" },
        { step: 3, title: "Master Literature Search & Biostatistics", desc: "Practice Boolean PubMed queries, PRISMA flowcharts, and interpreting clinical plots.", duration: "1-2 months" },
        { step: 4, title: "Medical Writing Portfolio Review", desc: "Refine your writing samples and profile with Nucleus MedLabs Medical Affairs mentors.", duration: "1 month" },
        { step: 5, title: "Apply to MedComms Agencies & Pharma GCCs", desc: "Target Associate Medical Writer openings at Indegene, Cactus, Sanofi, and Novartis.", duration: "Ongoing" }
      ],
      courses: [
        {"id": "course_mw_1", "title": "Regulatory & Scientific Medical Writing Portfolio", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_mw_2", "title": "Writing in the Sciences (Clinical & Medical Manuscripts)", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"}
      ],
      jobs: []
    },
    {
      id: "clinical_data_coordinator",
      title: "Clinical Data Management (CDM) Specialist",
      directionId: "healthcare_technology",
      baseScore: 72,
      matchLabel: "High Match",
      difficulty: "Moderate Difficulty",
      difficultyShort: "Moderate Difficulty",
      timeline: "4 - 8 months",
      salaryRange: "INR 4.5 - 8.0 LPA",
      bestFor: ["medical_coder", "lab_scientist", "fresh_graduate", "pharmacist", "clinical_pharmacist", "nurse", "biotech", "physiotherapist", "other_health"],
      relevantResp: ["Clinical Documentation", "Diagnostic Sample Analysis", "Regulatory Compliance"],
      relevantSkillKeywords: ["Excel", "CDISC", "Coding", "EHR", "MedDRA"],
      overviewSummary: "Your precision with clinical charts, diagnostic parameters, and structured documentation positions you strongly for Clinical Data Management (CDM) and EHR Health Informatics.",
      keyInsights: [
        "Ideal non-bedside analytical role with strong hybrid work-life balance",
        "Directly builds on medical coding, lab data, and clinical documentation accuracy",
        "Strong demand for CDISC SDTM and Medidata Rave data managers",
        "Clear trajectory to Lead Data Manager or Clinical Trial Programmer"
      ],
      newSkillsToAcquire: [
        "CDISC standards (CDASH & SDTM fundamentals)",
        "Electronic Data Capture (Medidata Rave, Oracle Inform, Veeva EDC)",
        "Data Validation Plan (DVP) & edit check specification",
        "Discrepancy management & clinical query writing",
        "Case Report Form (eCRF) design & annotation",
        "SAE reconciliation between Safety and Clinical databases",
        "Database Lock (DBL) & freeze checklists",
        "SQL & advanced Excel clinical data validation"
      ],
      roadmap: [
        { step: 1, title: "Understand End-to-End CDM Lifecycle", desc: "Learn study startup (CRF design), conduct (discrepancy management), and closeout (Database Lock).", duration: "1-2 months" },
        { step: 2, title: "Master EDC Systems & CDISC Standards", desc: "Practice eCRF annotation, edit check logic, and Medidata Rave query generation.", duration: "2 months" },
        { step: 3, title: "Lab Data & SAE Reconciliation Practice", desc: "Work on clinical lab range normalization and reconciling SAEs with PV teams.", duration: "1-2 months" },
        { step: 4, title: "Complete GCDMP & SQL Data Readiness", desc: "Obtain Good Clinical Data Management Practices certification and clinical SQL proficiency.", duration: "1 month" },
        { step: 5, title: "Apply for Clinical Data Coordinator Roles", desc: "Target CDA / Junior Clinical Data Manager roles at ICON, IQVIA, Eli Lilly, and GSK.", duration: "Ongoing" }
      ],
      courses: [
        {"id": "course_cdm_1", "title": "Clinical Data Management, Medidata Rave & CDISC SDTM", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_cdm_2", "title": "Clinical Data Models and Data Quality Assessments", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"}
      ],
      jobs: []
    },
    {
      id: "food_nutra_regulatory_specialist",
      title: "Quality Assurance & GxP Compliance Specialist",
      directionId: "quality_compliance",
      baseScore: 72,
      matchLabel: "High Match",
      difficulty: "Moderate Difficulty",
      difficultyShort: "Moderate Difficulty",
      timeline: "5 - 8 months",
      salaryRange: "INR 4.4 - 7.8 LPA",
      bestFor: ["biotech", "lab_scientist", "pharmacist", "fresh_graduate", "nutritionist", "healthcare_admin"],
      relevantResp: ["Regulatory Compliance", "Inventory Management", "Diagnostic Sample Analysis", "Clinical Documentation"],
      relevantSkillKeywords: ["SOP", "cGMP", "Dossier", "ICH-GCP"],
      overviewSummary: "Your grounding in laboratory standards, formulation safety, or clinical governance makes you an ideal fit for GxP Quality Assurance, CAPA Investigation, and ISO/cGMP Auditing.",
      keyInsights: [
        "High demand for CAPA, eQMS, and cGMP/GLP quality compliance specialists",
        "Strong stability across biopharma manufacturing, CROs, and medical devices",
        "Direct pathway to Lead QA Auditor and Quality Management System (QMS) Manager",
        "Leverages your existing SOP and laboratory documentation discipline"
      ],
      newSkillsToAcquire: [
        "ICH Q9 (Quality Risk Management) & ICH Q10 (Pharma QMS)",
        "CAPA (Corrective and Preventive Action) & Root Cause Analysis",
        "21 CFR Part 11 electronic records & data integrity (ALCOA+)",
        "ISO 13485 (Medical Devices) & ISO 9001 QMS auditing",
        "TrackWise / MasterControl eQMS software workflows",
        "Internal audit readiness & deviation investigation",
        "Vendor qualification & stability batch release review",
        "Change control & validation master planning"
      ],
      roadmap: [
        { step: 1, title: "Master cGMP, GxP & ICH Q8-Q10 Frameworks", desc: "Learn pharmaceutical quality systems, ALCOA+ data integrity, and 21 CFR Part 11 rules.", duration: "1-2 months" },
        { step: 2, title: "Develop CAPA & Deviation Investigation Skills", desc: "Practice Fishbone/Ishikawa root-cause analysis, 5-Why documentation, and change control.", duration: "2 months" },
        { step: 3, title: "eQMS & Audit Checklist Simulation", desc: "Hands-on training with TrackWise / MasterControl QMS templates and mock internal audits.", duration: "1-2 months" },
        { step: 4, title: "Quality & Compliance Certification", desc: "Earn ISO 13485 Internal Auditor or Pharmaceutical GxP Quality certification.", duration: "1 month" },
        { step: 5, title: "Apply for QA Executive & Compliance Roles", desc: "Target Quality Assurance Specialist and GxP Compliance roles across pharma leaders.", duration: "Ongoing" }
      ],
      courses: [
        {"id": "course_qa_1", "title": "Pharmaceutical GxP Quality Systems, CAPA & eQMS", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_qa_2", "title": "Good Manufacturing Practices (cGMP) & ALCOA+ Data Integrity", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"}
      ],
      jobs: []
    },
    {
      id: "healthcare_consulting_lead",
      title: "Healthcare Operations & Consulting Specialist",
      directionId: "healthcare_management",
      baseScore: 72,
      matchLabel: "High Match",
      difficulty: "Low-Moderate",
      difficultyShort: "Low-Moderate Difficulty",
      timeline: "3 - 6 months",
      salaryRange: "INR 4.8 - 9.0 LPA",
      bestFor: ["healthcare_admin", "doctor", "dentist", "clinical_pharmacist", "nurse", "physiotherapist", "other_health"],
      relevantResp: ["Team Supervision", "Patient Counselling", "Inventory Management", "Regulatory Compliance"],
      relevantSkillKeywords: ["Excel", "EHR", "SOP"],
      overviewSummary: "Your clinical coordination, patient counseling, and hospital workflow knowledge fit directly into International Patient Access, Hospital Operations, and Healthcare Management Consulting.",
      keyInsights: [
        "Strong demand across multi-specialty hospital groups and healthcare advisory firms",
        "Fast transition for clinicians seeking corporate leadership and international patient management",
        "Combines clinical triage with strategic hospital partnership operations",
        "Clear growth path to Hospital Operations Manager or Healthcare Strategy Consultant"
      ],
      newSkillsToAcquire: [
        "International patient triage & treatment cost estimation",
        "NABH / JCI hospital accreditation quality standards",
        "Medical visa (M-Visa) & international insurance coordination",
        "Hospital KPI analytics (ALOS, ARPOB, Bed Occupancy)",
        "B2B healthcare partner & specialist onboarding",
        "Cross-border patient data privacy compliance",
        "Post-treatment telemedicine follow-up protocols",
        "Organizational wellness & preventive health program design"
      ],
      roadmap: [
        { step: 1, title: "Healthcare Operations & Global Patient Foundations", desc: "Learn international patient pathways, JCI/NABH standards, and treatment estimation.", duration: "1 month" },
        { step: 2, title: "Hospital KPIs, TPA & Global Compliance", desc: "Master hospital revenue metrics, cross-border health insurance workflows, and privacy rules.", duration: "1-2 months" },
        { step: 3, title: "Case Coordination Practicum", desc: "Build end-to-end care coordination plans for international cardiology and oncology cases.", duration: "1-2 months" },
        { step: 4, title: "Healthcare Consulting Certification", desc: "Complete Healthcare Management & Global Patient Access certification.", duration: "1 month" },
        { step: 5, title: "Launch Into Consulting & Hospital Leadership", desc: "Apply for International Patient Coordinator, Hospital Operations Analyst, and Consultant roles.", duration: "Ongoing" }
      ],
      courses: [
        {"id": "course_hc_1", "title": "Patient Access, Hospital Operations & Healthcare Consulting", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_hc_2", "title": "Healthcare Organization Operations & Quality Specialization", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"}
      ],
      jobs: []
    },
    {
      id: "clinical_education_specialist",
      title: "Clinical Trainer & OET / CME Education Specialist",
      directionId: "education_training",
      baseScore: 72,
      matchLabel: "High Match",
      difficulty: "Low-Moderate",
      difficultyShort: "Low-Moderate Difficulty",
      timeline: "3 - 6 months",
      salaryRange: "INR 4.2 - 7.4 LPA",
      bestFor: ["nurse", "doctor", "dentist", "clinical_pharmacist", "pharmacist", "psychologist", "nutritionist", "physiotherapist"],
      relevantResp: ["Patient Counselling", "Team Supervision", "Clinical Documentation"],
      relevantSkillKeywords: ["Writing", "PubMed", "ICH-GCP"],
      overviewSummary: "Your clinical teaching aptitude, patient communication skills, and domain authority align closely with Clinical Process Training, Continuing Medical Education (CME), and OET Licensure Coaching.",
      keyInsights: [
        "High demand for Clinical Process Trainers in global CROs and hospital nursing academies",
        "Strong remote and flexible instruction opportunities",
        "Ideal for clinicians passionate about mentoring and global licensure pathways (OET, USMLE, PLAB, AMC)",
        "Combines clinical expertise with structured curriculum design"
      ],
      newSkillsToAcquire: [
        "Instructional Design (ADDIE model) for clinical education",
        "Continuing Medical Education (CME / CPD) credit accreditation",
        "Occupational English Test (OET) clinical communication rubrics",
        "Learning Management System (LMS) curriculum authoring",
        "Simulation-based clinical competency assessment",
        "Corporate CRO process onboarding (PV / CDM / Coding training)",
        "Academic counseling for clinical licensing pathways",
        "Clinical presentation & webinar facilitation"
      ],
      roadmap: [
        { step: 1, title: "Clinical Instructional Design & CME Standards", desc: "Learn adult medical learning principles, CME accreditation rules, and competency rubrics.", duration: "1 month" },
        { step: 2, title: "Develop Training Modules & Assessment Rubrics", desc: "Create structured training decks for clinical workflows, OET roleplays, or PV onboarding.", duration: "1-2 months" },
        { step: 3, title: "Facilitate Mock Cohorts & Mentorship Sessions", desc: "Deliver recorded micro-teaching demonstrations and clinical case walkthroughs.", duration: "1-2 months" },
        { step: 4, title: "Certified Clinical Trainer Credential", desc: "Complete Train-the-Trainer certification with the Clinical Education Division.", duration: "1 month" },
        { step: 5, title: "Apply for Clinical Trainer & Academic Advisor Roles", desc: "Target Process Trainer roles at healthcare GCCs, med-ed platforms, and licensing academies.", duration: "Ongoing" }
      ],
      courses: [
        {"id": "course_ed_1", "title": "OET Licensure Mastery & Clinical Educator", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_ed_2", "title": "Health Professions Education & Clinical Teaching", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"}
      ],
      jobs: []
    },
    {
      id: "heor_market_access_analyst",
      title: "Health Economics & Outcomes Research (HEOR) Analyst",
      directionId: "heor_market_access",
      baseScore: 72,
      matchLabel: "High Match",
      difficulty: "Moderate Difficulty",
      difficultyShort: "Moderate Difficulty",
      timeline: "5 - 9 months",
      salaryRange: "INR 5.5 - 9.8 LPA",
      bestFor: ["clinical_pharmacist", "pharmacist", "doctor", "dentist", "healthcare_admin", "biotech", "psychologist"],
      relevantResp: ["Clinical Documentation", "Medication Safety", "Inventory Management"],
      relevantSkillKeywords: ["Excel", "Biostatistics", "PubMed", "ICH-GCP"],
      overviewSummary: "Your clinical therapy knowledge and analytical skills align directly with Health Economics & Outcomes Research (HEOR), Real-World Evidence (RWE), and Global Market Access consulting.",
      keyInsights: [
        "One of the highest-paying corporate life sciences tracks across Pharma GCCs and consulting firms",
        "Evaluates cost-effectiveness, Quality-Adjusted Life Years (QALYs), and drug reimbursement dossiers",
        "Strong fit for Pharm.D., M.Pharm., M.B.B.S., M.P.H., and Healthcare Management graduates",
        "Rapid growth in Real-World Evidence (RWE) and Health Technology Assessment (HTA)"
      ],
      newSkillsToAcquire: [
        "Pharmacoeconomic modeling (Cost-Effectiveness & Budget Impact Models)",
        "Systematic Literature Review (SLR) & Network Meta-Analysis (NMA)",
        "Health Technology Assessment (HTA) submissions (NICE, ICER, CADTH)",
        "Real-World Evidence (RWE) & claims database analysis",
        "Patient-Reported Outcomes (PRO) & QALY utility scoring",
        "Global Value Dossier (GVD) authoring",
        "Advanced Excel decision-tree & Markov modeling",
        "Pharmaceutical pricing & reimbursement strategy"
      ],
      roadmap: [
        { step: 1, title: "Learn HEOR & Pharmacoeconomic Foundations", desc: "Study QALYs, ICER thresholds, HTA agencies, and cost-utility frameworks.", duration: "1-2 months" },
        { step: 2, title: "Master Systematic Reviews (PRISMA) & Meta-Analysis", desc: "Practice PICOS framework design, PubMed/Embase screening, and evidence tables.", duration: "2 months" },
        { step: 3, title: "Build Excel Budget Impact & Markov Models", desc: "Construct hands-on pharmacoeconomic decision trees and Global Value Dossier sections.", duration: "2 months" },
        { step: 4, title: "Complete HEOR & Market Access Certification", desc: "Earn ISPOR-aligned HEOR & Real-World Evidence certification.", duration: "1 month" },
        { step: 5, title: "Apply to Life Sciences Consulting & Pharma GCCs", desc: "Target HEOR Analyst roles at ZS, IQVIA, Novartis, Sanofi, and Parexel.", duration: "Ongoing" }
      ],
      courses: [
        {"id": "course_heor_1", "title": "Health Economics (HEOR), Market Access & Real-World Evidence", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_heor_2", "title": "Economic Evaluation in Global Health & Pharmacoeconomics", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"}
      ],
      jobs: []
    },
    {
      id: "medical_coding_auditor",
      title: "Medical Coding & DRG Revenue Cycle Specialist",
      directionId: "medical_coding_billing",
      baseScore: 72,
      matchLabel: "High Match",
      difficulty: "Low-Moderate",
      difficultyShort: "Low-Moderate Difficulty",
      timeline: "3 - 5 months",
      salaryRange: "INR 3.8 - 7.2 LPA",
      bestFor: ["medical_coder", "fresh_graduate", "nurse", "physiotherapist", "dentist", "pharmacist", "lab_scientist", "other_health"],
      relevantResp: ["Clinical Documentation", "Diagnostic Sample Analysis", "Regulatory Compliance"],
      relevantSkillKeywords: ["Coding", "MedDRA", "EHR"],
      overviewSummary: "Your mastery of human anatomy, physiology, and clinical chart documentation makes transitioning into Certified Medical Coding (CPC / CCS) and Inpatient DRG Auditing fast and rewarding.",
      keyInsights: [
        "Shortest certification-to-employment timeline (3-5 months) with massive hiring volume in India",
        "Strong demand for Inpatient IP-DRG, Surgery, Radiology, and E/M coders across US Healthcare MNCs",
        "Clear salary jumps upon earning AAPC CPC or AHIMA CCS credentials",
        "Abundant day-shift and hybrid opportunities in Hyderabad, Bengaluru, Chennai, and Mumbai"
      ],
      newSkillsToAcquire: [
        "ICD-10-CM diagnostic coding guidelines & conventions",
        "CPT-4 procedural coding & modifier application",
        "HCPCS Level II & National Correct Coding Initiative (NCCI) edits",
        "Inpatient MS-DRG / APR-DRG grouping & PCS coding",
        "US HIPAA privacy compliance & revenue cycle workflow",
        "Medical chart abstraction & physician query writing",
        "Evaluation & Management (E/M) multi-specialty auditing",
        "Denial management & insurance claim scrubbing"
      ],
      roadmap: [
        { step: 1, title: "Anatomy, Pathophysiology & ICD-10-CM Mastery", desc: "Learn chapter-specific ICD-10-CM diagnostic rules and clinical abstraction.", duration: "1 month" },
        { step: 2, title: "CPT-4 Procedural & HCPCS Level II Coding", desc: "Practice surgical, radiology, pathology, and E/M procedural coding cases.", duration: "1-2 months" },
        { step: 3, title: "Mock CPC Exam & Chart Auditing Practicum", desc: "Complete 300+ real-world anonymized medical chart coding simulations at 98% accuracy.", duration: "1 month" },
        { step: 4, title: "AAPC CPC / AHIMA Certification Readiness", desc: "Prepare for Certified Professional Coder (CPC) or specialty DRG credentials.", duration: "1 month" },
        { step: 5, title: "Apply to US Healthcare MNCs & Hospital RCM Hubs", desc: "Target Medical Coder and DRG Analyst openings at Optum, Omega, CorroHealth, and Access Healthcare.", duration: "Ongoing" }
      ],
      courses: [
        {"id": "course_mc_1", "title": "CPC Medical Coding, ICD-10-CM & Inpatient DRG Fast-Track", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_mc_2", "title": "US Healthcare Revenue Cycle & HIPAA Compliance Foundations", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"}
      ],
      jobs: []
    },
    {
      id: "nutraceutical_formulation_scientist",
      title: "Nutraceutical R&D & Regulatory Formulation Specialist",
      directionId: "nutraceuticals_rd",
      baseScore: 72,
      matchLabel: "High Match",
      difficulty: "Moderate Difficulty",
      difficultyShort: "Moderate Difficulty",
      timeline: "4 - 8 months",
      salaryRange: "INR 4.5 - 8.4 LPA",
      bestFor: ["nutritionist", "pharmacist", "biotech", "fresh_graduate", "lab_scientist", "doctor"],
      relevantResp: ["Patient Counselling", "Regulatory Compliance", "Inventory Management", "Diagnostic Sample Analysis"],
      relevantSkillKeywords: ["Dossier", "PubMed", "SOP", "cGMP"],
      overviewSummary: "Your expertise in clinical nutrition, bioactive ingredients, or pharmaceutical formulation aligns directly with the booming $722B global Nutraceutical, Functional Food, and Preventive Wellness industry.",
      keyInsights: [
        "Direct alignment with Nucleus MedLabs' flagship Nutraceutical Consulting & Advocacy vertical",
        "High demand for evidence-based supplement formulation, stability testing, and FSSAI/FDA claim substantiation",
        "Bridges clinical nutrition science with commercial product development",
        "Strong career growth across wellness D2C brands, pharma consumer health divisions, and contract manufacturers"
      ],
      newSkillsToAcquire: [
        "FSSAI Health Supplements & Nutraceuticals Regulations (2022)",
        "US FDA DSHEA & EFSA health claim substantiation dossiers",
        "Bioavailability enhancement & excipient compatibility",
        "Recommended Dietary Allowance (RDA) & tolerable upper limit formulation",
        "Clean-label ingredient sourcing & heavy metal / microbial COA auditing",
        "Accelerated & real-time shelf-life stability protocols (ICH Q1A)",
        "Sensory evaluation & delivery format design (gummies, effervescents, liposomes)",
        "Nutraceutical label compliance & clinical claim verification"
      ],
      roadmap: [
        { step: 1, title: "Nutraceutical Regulations & FSSAI / DSHEA Standards", desc: "Master FSSAI nutraceutical schedules, permitted botanicals, and RDA limits.", duration: "1-2 months" },
        { step: 2, title: "Evidence-Based Formulation & Delivery Design", desc: "Learn active ingredient synergy, excipient selection, and COA quality specifications.", duration: "2 months" },
        { step: 3, title: "Claim Substantiation & Labeling Dossier Lab", desc: "Build scientific dossiers backing immunity, metabolic, and cognitive product claims.", duration: "1-2 months" },
        { step: 4, title: "Nutraceutical R&D & Compliance Certification", desc: "Complete Nucleus MedLabs Nutraceutical Formulation & Regulatory Strategy certification.", duration: "1 month" },
        { step: 5, title: "Apply to Consumer Health & Nutraceutical Leaders", desc: "Target R&D Formulation and Regulatory Specialist roles across wellness and pharma brands.", duration: "Ongoing" }
      ],
      courses: [
        {"id": "course_nu_1", "title": "Nutraceutical Formulation, FSSAI Compliance & Claim Substantiation", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_nu_2", "title": "Functional Foods, Bioactives & Stability Testing", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"}
      ],
      jobs: []
    },
    {
      id: "public_health_epidemiologist",
      title: "Public Health & Clinical Epidemiology Specialist",
      directionId: "public_health_policy",
      baseScore: 72,
      matchLabel: "High Match",
      difficulty: "Moderate Difficulty",
      difficultyShort: "Moderate Difficulty",
      timeline: "4 - 8 months",
      salaryRange: "INR 4.5 - 8.2 LPA",
      bestFor: ["doctor", "dentist", "clinical_pharmacist", "nurse", "nutritionist", "psychologist", "physiotherapist", "other_health"],
      relevantResp: ["Patient Counselling", "Adverse Event Reporting", "Clinical Documentation", "Team Supervision"],
      relevantSkillKeywords: ["PubMed", "Excel", "Biostatistics", "Writing"],
      overviewSummary: "Your community health awareness, clinical screening background, and preventive care mindset make you a strong fit for Public Health Program Management, Epidemiology, and Global Health Advisory.",
      keyInsights: [
        "Directly aligned with Nucleus MedLabs' Public Health Campaigns & Preventive Advocacy pillar",
        "High impact across WHO/UNICEF partner programs, public health foundations, and CSR health initiatives",
        "Combines biostatistics and disease surveillance with community health intervention design",
        "Strong pathway for M.B.B.S., B.D.S., Nursing, Nutrition, and Allied Health professionals"
      ],
      newSkillsToAcquire: [
        "Epidemiological study design (Cohort, Case-Control, Cross-Sectional)",
        "Biostatistics & public health data analysis (R / SPSS / Epi Info / Excel)",
        "Disease surveillance & outbreak investigation protocols",
        "Monitoring & Evaluation (M&E) logframe & KPI design",
        "Public health policy briefs & grant proposal writing",
        "Maternal, child & micronutrient deficiency program management",
        "Health equity & social determinants of health assessment",
        "Digital public health & HMIS reporting workflows"
      ],
      roadmap: [
        { step: 1, title: "Epidemiology & Biostatistics Foundations", desc: "Learn incidence/prevalence metrics, odds ratios, relative risk, and study design.", duration: "1-2 months" },
        { step: 2, title: "Public Health Data Analysis & M&E Frameworks", desc: "Practice analyzing demographic health surveys (NFHS) and building M&E dashboards.", duration: "2 months" },
        { step: 3, title: "Preventive Health Campaign & Policy Practicum", desc: "Design an evidence-based intervention for anemia, Vitamin D, or chronic disease prevention.", duration: "1-2 months" },
        { step: 4, title: "Public Health & Epidemiology Certification", desc: "Complete Public Health Program Management & Epidemiology certification.", duration: "1 month" },
        { step: 5, title: "Apply to Global Health Agencies, NGOs & Advisory Firms", desc: "Target Public Health Specialist and Research Officer roles across India and global agencies.", duration: "Ongoing" }
      ],
      courses: [
        {"id": "course_ph_1", "title": "Applied Epidemiology, Public Health Advocacy &  M&E", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"},
        {"id": "course_ph_2", "title": "Epidemiology in Public Health Practice Specialization", "provider": "Provider catalogue search", "duration": "Self-paced research", "format": "Learning topic", "tag": "Explore"}
      ],
      jobs: []
    }
  ]
};
