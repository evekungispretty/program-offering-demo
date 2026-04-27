/**
 * data.js
 * --------
 * Source data from the existing UF COE backend (legacy schema), plus migration
 * logic that converts each record into the new per-degree schema.
 *
 * KEY DESIGN MOVE
 * In the legacy schema, delivery mode was a program-level array (e.g.,
 * "Educational Leadership" is `["On Campus","Online"]`), which made it impossible
 * for the public filter to know that the *Ph.D.* is on-campus while the
 * *Online M.Ed.* is online. The new schema attaches a delivery mode to *each*
 * degree, which is the smallest change that unlocks the filter behavior the
 * editorial team actually wants.
 *
 * The migration is intentionally lossy-but-conservative: it infers delivery mode
 * from (1) the degree name prefix, then (2) the URL slug, then (3) the
 * program-level types array. Ambiguous cases default to "on-campus" — editors
 * can fix these in the CMS in seconds.
 */

/* ---------------------------------------------------------------------------
   Three COE schools → category strings
--------------------------------------------------------------------------- */

export const SCHOOL_TO_CATEGORY = {
  '1': 'School of Teaching & Learning',
  '2': 'Human Development & Organizational Studies',
  '3': 'Special Education, School Psychology & Early Childhood',
}

export const DEFAULT_CATEGORIES = Object.values(SCHOOL_TO_CATEGORY)

/* ---------------------------------------------------------------------------
   Raw data — same shape returned by the existing backend.
--------------------------------------------------------------------------- */

export const RAW_PROGRAMS = [
  {"id":"1","title":"ALTERNATIVE CERTIFICATION FOR TEACHER EDUCATION K-6","programs":"[{\"name\":\"Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/secondary-teacher-prep\\/\"},{\"name\":\"M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/site\\/\"}]","types":"[\"Educator Certification\",\"On Campus\",\"Online\"]","school":"1","intro":"Site-based Implementation of Teacher Education (SITE) offers an accelerated, hands-on master's program tailored for career-changers transitioning into K-6 teaching, with online instruction, mentoring, and a year-long classroom internship.","image":"https://education.ufl.edu/program-directory/files/2024/01/Alt-Cert-for-K-6.jpg"},
  {"id":"2","title":"BILINGUAL/ESOL EDUCATION","programs":"[{\"name\":\"M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/esol\\/\"},{\"name\":\"M.Ed.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/esol\\/degrees\\/#masters\"},{\"name\":\"Ed.S.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/esol\\/degrees\\/#specialist\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/esol\\/degrees\\/#doctorate\"}]","types":"[\"On Campus\"]","school":"1","intro":"The ESOL/Bilingual Education program integrates linguistics and psychology with practical teaching practica and research, advancing language teaching practices and policies.","image":"https://education.ufl.edu/program-directory/files/2024/01/Bilingual_ESOL-PhD.png"},
  {"id":"3","title":"COMPUTER SCIENCE EDUCATION","programs":"[{\"name\":\"Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/computer-science-education\\/programs\\/online-certificate\\/\"},{\"name\":\"M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/computer-science-education\\/programs\\/online-mae\\/\"},{\"name\":\"Ed.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/computer-science-education\\/programs\\/online-ed-d\\/\"},{\"name\":\"Undergraduate Minor\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/computer-science-education\\/undergrad-minor-pto\\/\"}]","types":"[\"Online\"]","school":"1","intro":"Fully online graduate certificate, MAE, and Ed.D. designed for educators teaching evidence-based, equitable, accessible computer science curricula in K-12.","image":"https://education.ufl.edu/program-directory/files/2024/01/Comp-Sci-MAE.jpg"},
  {"id":"4","title":"COUNSELOR EDUCATION","programs":"[{\"name\":\"M.Ed.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/counselor-education\\/prospective-students\\/on-campus-m-ed\\/\"},{\"name\":\"Ed.S.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/counselor-education\\/prospective-students\\/on-campus-m-ed\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/counselor-education\\/prospective-students\\/on-campus-ph-d\\/\"}]","types":"[\"Educator Certification\",\"On Campus\"]","school":"2","intro":"A doctoral program and dual master's/specialist degrees that prepare students for professional counseling and encourage research through a thesis option.","image":"https://education.ufl.edu/program-directory/files/2024/01/Counselor-Ed-PhD.png"},
  {"id":"6","title":"Dyslexia","programs":"[{\"name\":\"Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/special-education\\/programs\\/dyslexia\\/\"}]","types":"[\"Educator Certification\",\"Online\"]","school":"3","intro":"A fully online certificate designed for practicing educators and related service professionals supporting students with dyslexia.","image":"https://education.ufl.edu/program-directory/files/2024/01/UFTeach.png"},
  {"id":"7","title":"EARLY CHILDHOOD EDUCATION","programs":"[{\"name\":\"B.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/early-childhood\\/bachelors\\/\"},{\"name\":\"M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/early-childhood\\/prospective-students\\/early-childhood-masters-degree\\/\"},{\"name\":\"Graduate Minor\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/early-childhood\\/prospective-students\\/phd-graduate-minor\\/\"},{\"name\":\"Undergraduate Minor\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/early-childhood\\/early-childhood-studies-undergrad-minor\\/\"},{\"name\":\"Early Childhood Care and Education Policy Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/early-childhood\\/prospective-students\\/early-childhood-certificate\\/\"},{\"name\":\"Early Childhood Studies Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/early-childhood\\/prospective-students\\/graduate-certificate\\/\"}]","types":"[\"Educator Certification\",\"On Campus\",\"Online\"]","school":"3","intro":"Thorough training in developmentally appropriate practices and evidence-based approaches supporting young children and their families.","image":"https://education.ufl.edu/program-directory/files/2024/01/Early-Childhood-Education-MED.png"},
  {"id":"8","title":"EDUCATIONAL LEADERSHIP AND POLICY","programs":"[{\"name\":\"Ed.S.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-leadership\\/prospective-students\\/ed-s\\/\"},{\"name\":\"Ed.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-leadership\\/prospective-students\\/online-ed-d\\/\"},{\"name\":\"Online M.Ed.- School Leadership Track\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-leadership\\/prospective-students\\/online-m-ed\\/\"},{\"name\":\"Online M.Ed.- Systems Leadership Track\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-leadership\\/prospective-students\\/online-m-ed-systems-leadership-track\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-leadership\\/prospective-students\\/on-campus-ph-d\\/\"},{\"name\":\"On-Campus M.Ed.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-leadership\\/prospective-students\\/on-campus-m-ed\\/\"}]","types":"[\"Educator Certification\",\"On Campus\",\"Online\"]","school":"2","intro":"Prepares you to lead and shape the future of K-12 education through practice, research, and policy engagement.","image":"https://education.ufl.edu/program-directory/files/2024/01/Ed-Admin-and-Policy_Ed-Leadership.png"},
  {"id":"9","title":"EDUCATIONAL TECHNOLOGY","programs":"[{\"name\":\"Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-technology\\/prospective-students\\/graduate-certificate\\/\"},{\"name\":\"Ed.S.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-technology\\/prospective-students\\/online-eds\\/\"},{\"name\":\"M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-technology\\/prospective-students\\/on-campus-mae\\/\"},{\"name\":\"M.Ed.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-technology\\/prospective-students\\/online-med\\/\"},{\"name\":\"Ed.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-technology\\/prospective-students\\/online-edd\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-technology\\/prospective-students\\/on-campus-phd\\/\"},{\"name\":\"Undergraduate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-technology\\/prospective-students\\/baes-specialization\\/\"},{\"name\":\"Undergraduate Minor\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-technology\\/prospective-students\\/undergraduate-minor\\/\"},{\"name\":\"EdTech 4+1\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/educational-technology\\/prospective-students\\/online-edtech-41\\/\"}]","types":"[\"On Campus\",\"Online\"]","school":"1","intro":"Collaborate globally to research and implement innovative technologies, with on-campus M.A.E. and Ph.D. options and online M.Ed., Ed.S., and Ed.D. degrees.","image":"https://education.ufl.edu/program-directory/files/2024/01/Ed-Tech-B-Roll-65.jpg"},
  {"id":"10","title":"Education Sciences","programs":"[{\"name\":\"B.A.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/education-sciences\\/\"}]","types":"[\"On Campus\",\"Online\"]","school":"1","intro":"A versatile foundation in education with on-campus and UF Online options, allowing students to tailor a specialization.","image":"https://education.ufl.edu/program-directory/files/2024/01/Ed-Sciences.jpg"},
  {"id":"11","title":"Education Studies","programs":"[{\"name\":\"Minor\",\"sublink\":\"https:\\/\\/catalog.ufl.edu\\/UGRD\\/colleges-schools\\/UGEDU\\/EDS_UMN\\/\"}]","types":"[\"On Campus\"]","school":"1","intro":"Explores the purpose and dynamics of education and the social and psychological influences on youth. Does not lead to teacher certification.","image":"https://education.ufl.edu/program-directory/files/2024/01/Counselor-Ed.png"},
  {"id":"12","title":"Elementary Education","programs":"[{\"name\":\"On Campus B.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/elementary-education\\/bachelors\\/\"},{\"name\":\"Online B.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/elementary-education\\/prospective-students\\/elementary-online\\/\"}]","types":"[\"Educator Certification\",\"On Campus\",\"Online\"]","school":"1","intro":"Hands-on clinical experiences, a year-long internship, and specialized coursework to foster inclusive classrooms and obtain professional certification.","image":"https://education.ufl.edu/program-directory/files/2024/01/Elem-Ed.jpg"},
  {"id":"13","title":"English Education","programs":"[{\"name\":\"Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/english-education\\/degrees\\/certificate\\/\"},{\"name\":\"Ed.S.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/english-education\\/degrees\\/specialist\\/\"},{\"name\":\"M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/english-education\\/degrees\\/masters\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/english-education\\/prospective-students\\/on-campus-ph-d\\/\"}]","types":"[\"Educator Certification\",\"On Campus\",\"Online\"]","school":"1","intro":"Prepares teachers and scholars with a deep understanding of language, texts, and culture, emphasizing literacy skills for meaningful societal participation.","image":"https://education.ufl.edu/program-directory/files/2024/01/English-Ed.png"},
  {"id":"14","title":"HIGHER EDUCATION ADMINISTRATION","programs":"[{\"name\":\"Online M.Ed.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/higher-education\\/prospective-students\\/online-med\\/\"},{\"name\":\"On Campus M.Ed.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/higher-education\\/prospective-students\\/on-campus-med\\/\"},{\"name\":\"Ed.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/higher-education\\/prospective-students\\/hybrid-edd\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/higher-education\\/prospective-students\\/on-campus-phd\\/\"}]","types":"[\"On Campus\",\"Online\"]","school":"2","intro":"Prepares future leaders for research, faculty, policy, and administrative roles, integrating coursework with high-quality scholarship and faculty mentoring.","image":"https://education.ufl.edu/program-directory/files/2024/01/Higher-Ed-Admin-EdD.png"},
  {"id":"15","title":"Florida Teaching","programs":"[{\"name\":\"Minor\",\"sublink\":\"https:\\/\\/catalog.ufl.edu\\/UGRD\\/colleges-schools\\/UGEDU\\/FLT_UMN\\/\"}]","types":"[\"Educator Certification\",\"On Campus\"]","school":"1","intro":"Alternative certification minor (Professional Training Option) for temporary Florida teacher certification, with extensive classroom experience.","image":"https://education.ufl.edu/program-directory/files/2024/01/Florida-Teaching.jpg"},
  {"id":"16","title":"MATHEMATICS EDUCATION","programs":"[{\"name\":\"Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/secondary-teacher-prep\\/\"},{\"name\":\"M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/math-education\\/prospective-students\\/masters\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/math-education\\/doctorate\\/\"},{\"name\":\"Undergraduate Minor\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/uf-teach\\/\"}]","types":"[\"Educator Certification\",\"On Campus\",\"Online\"]","school":"1","intro":"Tailored degrees for math teachers and aspiring scholars, working with faculty to fit the program to specific career goals.","image":"https://education.ufl.edu/program-directory/files/2024/01/Math-ed-Cert.png"},
  {"id":"17","title":"RESEARCH AND EVALUATION METHODOLOGY","programs":"[{\"name\":\"On-Campus M.Ed.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/research-evaluation-methods\\/prospective-students\\/on-campus-med\\/\"},{\"name\":\"On Campus M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/research-evaluation-methods\\/prospective-students\\/on-campus-mae\\/\"},{\"name\":\"Online M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/research-evaluation-methods\\/prospective-students\\/online-mae\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/research-evaluation-methods\\/prospective-students\\/on-campus-phd\\/\"},{\"name\":\"Undergraduate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/research-evaluation-methods\\/prospective-students\\/baes\\/\"},{\"name\":\"Minor\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/research-evaluation-methods\\/prospective-students\\/minor\\/\"},{\"name\":\"Online M.Ed.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/research-evaluation-methods\\/prospective-students\\/online-med\\/\"}]","types":"[\"On Campus\",\"Online\"]","school":"2","intro":"Skills in data analysis, AI research, and program evaluation for careers across many sectors. Ph.D., master's, bachelor's, and graduate minor.","image":"https://education.ufl.edu/program-directory/files/2024/01/Research-and-Eval-Methodology.png"},
  {"id":"18","title":"READING AND LITERACY EDUCATION","programs":"[{\"name\":\"Ed.S.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/reading-education\\/specialist\\/\"},{\"name\":\"M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/reading-education\\/masters\\/\"},{\"name\":\"M.Ed.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/reading-education\\/masters\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/reading-education\\/doctorate\\/\"},{\"name\":\"Reading Endorsement\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/reading-education\\/reading-endorsement\\/\"}]","types":"[\"On Campus\",\"Online\"]","school":"1","intro":"Fosters experts in teaching reading, writing, and language, preparing researchers, teachers, and teacher educators committed to literacy for all learners.","image":"https://education.ufl.edu/program-directory/files/2024/01/Reading-and-Lit-Ed-EdS.png"},
  {"id":"19","title":"School Psychology","programs":"[{\"name\":\"Ed.S.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/school-psychology\\/prospective-students\\/on-campus-eds\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/school-psychology\\/prospective-students\\/on-campus-phd\\/\"}]","types":"[\"Educator Certification\",\"On Campus\"]","school":"3","intro":"Trains practitioners and scholars in children's psychological and educational development through a scientist-practitioner model.","image":"https://education.ufl.edu/program-directory/files/2024/01/School-Psych.png"},
  {"id":"20","title":"SOCIAL STUDIES EDUCATION","programs":"[{\"name\":\"Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/social-studies-education\\/degrees\\/epi-certification\\/\"},{\"name\":\"Online M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/social-studies-education\\/degrees\\/mae-online\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/social-studies-education\\/degrees\\/doctorate\\/\"},{\"name\":\"Secondary Teaching Preparation Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/school-teaching-learning\\/secondary-teaching-preparation\\/\"}]","types":"[\"On Campus\",\"Online\"]","school":"1","intro":"Nationally accredited program with immersive internships, preparing teachers for grades 6-12 with best teaching practices.","image":"https://education.ufl.edu/program-directory/files/2024/01/iStock-1248521963.jpg"},
  {"id":"21","title":"SCIENCE OR MATHEMATICS TEACHING","programs":"[{\"name\":\"Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/school-teaching-learning\\/science-or-mathematics-teaching-certificate\\/\"}]","types":"[\"Online\"]","school":"1","intro":"Online graduate certificate offering certified secondary teachers advanced strategies for inquiry-based math or science instruction.","image":"https://education.ufl.edu/program-directory/files/2024/01/Sci-or-Math-Teaching.png"},
  {"id":"22","title":"SECONDARY TEACHING PREPARATION","programs":"[{\"name\":\"Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/school-teaching-learning\\/secondary-teaching-preparation\\/\"}]","types":"[\"Educator Certification\",\"Online\"]","school":"1","intro":"Online program with interdisciplinary coursework and a supervised field experience leading to Florida Teacher Professional Certification at the secondary level.","image":"https://education.ufl.edu/program-directory/files/2024/01/Sec-Teaching-Prep.png"},
  {"id":"23","title":"SCIENCE EDUCATION","programs":"[{\"name\":\"Secondary Teaching Preparation Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/science-education\\/certificate\\/\"},{\"name\":\"Ed.S.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/science-education\\/education-specialist\\/\"},{\"name\":\"M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/science-education\\/master-of-arts\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/science-education\\/doctor-of-philosophy\\/\"},{\"name\":\"Undergraduate Minor\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/uf-teach\\/\"}]","types":"[\"Educator Certification\",\"On Campus\",\"Online\"]","school":"1","intro":"Tailored science education degrees with strong field experience and faculty mentoring.","image":"https://education.ufl.edu/program-directory/files/2024/01/Social-Studies-Ed.png"},
  {"id":"25","title":"STUDENT PERSONNEL IN HIGHER EDUCATION","programs":"[{\"name\":\"M.Ed.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/higher-education\\/prospective-students\\/on-campus-med\\/\"}]","types":"[\"On Campus\",\"Online\"]","school":"2","intro":"Prepares leaders for student affairs and academic affairs roles, blending counseling skills, student development theory, legal aspects, and finance.","image":"https://education.ufl.edu/program-directory/files/2024/01/Student-Pers-in-HE.png"},
  {"id":"26","title":"TEACHER LEADERSHIP FOR SCHOOL IMPROVEMENT","programs":"[{\"name\":\"M.Ed.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/tlsi\\/prospective-students\\/online-m-ed\\/\"},{\"name\":\"Ed.S.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/tlsi\\/prospective-students\\/online-ed-s\\/\"},{\"name\":\"Certificate\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/tlsi\\/prospective-students\\/teacher-leadership-certificate\\/\"}]","types":"[\"Online\"]","school":"1","intro":"Empowers PK-12 educators with knowledge, skills, and leadership through an award-winning, job-embedded online curriculum.","image":"https://education.ufl.edu/program-directory/files/2024/01/Teacher-Leadership-for-School-Imp-MED.png"},
  {"id":"27","title":"SPECIAL EDUCATION","programs":"[{\"name\":\"Ed.S.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/special-education\\/prospective-students\\/online-eds\\/\"},{\"name\":\"M.Ed.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/special-education\\/prospective-students\\/online-med\\/\"},{\"name\":\"Ed.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/special-education\\/prospective-students\\/online-edd\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/special-education\\/prospective-students\\/on-campus-phd\\/\"}]","types":"[\"On Campus\",\"Online\"]","school":"3","intro":"Top-ranked program equipping students to provide individualized educational support to learners with diverse needs.","image":"https://education.ufl.edu/program-directory/files/2024/01/Special-Ed-MED.png"},
  {"id":"28","title":"UFTEACH \u2013 MATHEMATICS, SCIENCE, & COMPUTER SCIENCE","programs":"[{\"name\":\"Minor\",\"sublink\":\"https:\\/\\/catalog.ufl.edu\\/UGRD\\/colleges-schools\\/UGEDU\\/UF_TEACH\\/\"}]","types":"[\"On Campus\"]","school":"1","intro":"Minor for students wishing to teach math, science, or computer science at middle or high school in Florida (Professional Training Option).","image":"https://education.ufl.edu/program-directory/files/2024/01/Special-Ed.png"},
  {"id":"29","title":"TEACHERS, SCHOOLS AND SOCIETY","programs":"[{\"name\":\"M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/curriculum-teaching\\/mae\\/\"},{\"name\":\"Ed.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/curriculum-teaching\\/edd\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/curriculum-teaching\\/on-campus-ph-d\\/\"}]","types":"[\"On Campus\",\"Online\"]","school":"1","intro":"Graduate study of curriculum, teaching, and the social context of schools.","image":"https://education.ufl.edu/program-directory/files/2024/01/TSS-MAE-1.png"},
  {"id":"37","title":"Media & Digital Literacy Education","programs":"[{\"name\":\"M.A.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/english-education\\/specializations\\/media-literacy-education\\/\"},{\"name\":\"Ph.D.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/english-education\\/specializations\\/media-literacy-education\\/\"}]","types":"[\"On Campus\",\"Online\"]","school":"1","intro":"Investigate the processes of using popular media culture and Internet texts to support literacy growth.","image":"https://education.ufl.edu/wp-content/uploads/2024/07/CSEd-Wk-PKY-04.jpg"},
  {"id":"38","title":"Program Evaluation in Educational Environments","programs":"[{\"name\":\"Online M.A.E.\",\"sublink\":\"https:\\/\\/education.ufl.edu\\/research-evaluation-methods\\/program-evaluation-in-educational-environments\\/\"}]","types":"[\"Online\"]","school":"2","intro":"Apply evaluation theory and tools to develop and assess the impact of social science programs.","image":"https://education.ufl.edu/wp-content/uploads/2024/11/Ed-Admin-and-Policy-Ed-Lead-PhD.jpg"},
]

/* ---------------------------------------------------------------------------
   Migration helpers
--------------------------------------------------------------------------- */

const ACRONYMS = new Set(['ESOL', 'UFTEACH', 'UF', 'AI', 'TLSI', 'STEM', 'TSS', 'COE'])

function smartTitle(s) {
  if (!s) return s
  // String already mixed-case → leave alone
  if (/[a-z]/.test(s)) return s
  return s.split(/(\s+|[\/&,])/).map((token) => {
    const upper = token.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (ACRONYMS.has(upper)) return token.toUpperCase()
    if (/^\s+$/.test(token) || /^[\/&,]$/.test(token)) return token
    if (token.length === 0) return token
    return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()
  }).join('')
}

function inferDelivery(name, sublink, typesList) {
  const text = (name + ' ' + (sublink || '')).toLowerCase()
  if (/\bhybrid\b/.test(text)) return 'hybrid'
  if (/\bonline\b/.test(text)) return 'online'
  if (/\bon[\s-]?campus\b/.test(text)) return 'on-campus'

  const hasOnline = typesList.includes('Online')
  const hasOnCampus = typesList.includes('On Campus')
  if (hasOnline && !hasOnCampus) return 'online'
  if (hasOnCampus && !hasOnline) return 'on-campus'
  return 'on-campus' // ambiguous default; editor can fix
}

function cleanDegreeName(name) {
  return name
    .replace(/^online\s+/i, '')
    .replace(/^on[\s-]?campus\s+/i, '')
    .replace(/^hybrid\s+/i, '')
    .replace(/^\s*[-–—]\s*/, '')
    .trim()
}

/* ---------------------------------------------------------------------------
   migrate(rawList) — runs once at module load
--------------------------------------------------------------------------- */

export function migrate(rawList) {
  return rawList.map((raw) => {
    let degreeList = []
    let typesList = []
    try { degreeList = JSON.parse(raw.programs) } catch {}
    try { typesList = JSON.parse(raw.types) } catch {}

    const degrees = degreeList.map((d, i) => ({
      id: `d_${raw.id}_${i}`,
      type: cleanDegreeName(d.name),
      deliveryMode: inferDelivery(d.name, d.sublink, typesList),
      url: d.sublink || '',
    }))

    return {
      id: `p_${raw.id}`,
      title: smartTitle(raw.title),
      category: SCHOOL_TO_CATEGORY[raw.school] || 'Uncategorized',
      description: raw.intro || '',
      image: raw.image || '',
      status: 'published', // 'draft' | 'published' | 'archived'
      degrees,
    }
  })
}

export const SEED_PROGRAMS = migrate(RAW_PROGRAMS)
