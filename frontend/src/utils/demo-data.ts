/**
 * In-process demo dataset.
 *
 * Mirrors database/02-seed.sql so the app is fully usable (and demoable) with
 * no Supabase project. State lives on globalThis so it survives Next.js dev
 * hot-reloads. This module is only ever touched when dataMode === 'demo'.
 */

import type {
  Application,
  ApplicationNote,
  Company,
  Course,
  Industry,
  Opportunity,
  Skill,
  StudentProfile,
  University,
} from './types';

const iso = (d: Date) => d.toISOString();

/** Offset from "today" so demo deadlines are always in the future. */
const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export const demoUniversities: University[] = [
  {
    id: 'uni-tuk',
    name: 'Technical University of Kenya',
    abbreviation: 'TUK',
    location: 'Nairobi',
    description: 'Leading technical university in East Africa.',
    website: 'https://www.tukenya.ac.ke',
  },
  {
    id: 'uni-ku',
    name: 'Kenyatta University',
    abbreviation: 'KU',
    location: 'Nairobi',
    description: 'Premier public university with the largest enrolment in Kenya.',
    website: 'https://www.ku.ac.ke',
  },
  {
    id: 'uni-uon',
    name: 'University of Nairobi',
    abbreviation: 'UoN',
    location: 'Nairobi',
    description: 'Oldest and largest university in Kenya.',
    website: 'https://www.uonbi.ac.ke',
  },
  {
    id: 'uni-jkuat',
    name: 'Jomo Kenyatta University of Agriculture and Technology',
    abbreviation: 'JKUAT',
    location: 'Nairobi',
    description: 'Agricultural, engineering and technology focus.',
    website: 'https://www.jkuat.ac.ke',
  },
  {
    id: 'uni-kemu',
    name: 'Kenya Methodist University',
    abbreviation: 'KeMU',
    location: 'Nairobi',
    description: 'Private university with strong business and hospitality programmes.',
    website: 'https://www.kemu.ac.ke',
  },
];

export const demoIndustries: Industry[] = [
  { id: 'ind-tech', name: 'Technology & Software', description: 'Software development, IT services, SaaS' },
  { id: 'ind-eng', name: 'Engineering', description: 'Mechanical, civil, electrical and structural engineering' },
  { id: 'ind-fin', name: 'Finance & Banking', description: 'Banking, insurance, accounting and fintech' },
  { id: 'ind-tel', name: 'Telecommunications', description: 'Telecom services and mobile networks' },
  { id: 'ind-man', name: 'Manufacturing', description: 'Industrial production and automotive' },
  { id: 'ind-hos', name: 'Hospitality & Tourism', description: 'Hotels, restaurants and tourism' },
  { id: 'ind-log', name: 'Logistics & Supply Chain', description: 'Shipping, warehousing and distribution' },
  { id: 'ind-energy', name: 'Energy & Utilities', description: 'Power generation, transmission and water' },
  { id: 'ind-health', name: 'Healthcare', description: 'Hospitals, clinics and pharmaceuticals' },
  { id: 'ind-retail', name: 'Retail & E-commerce', description: 'Retail, online marketplaces and distribution' },
  { id: 'ind-agri', name: 'Agriculture', description: 'Agribusiness, food processing and agritech' },
  { id: 'ind-con', name: 'Construction & Real Estate', description: 'Contracting, property development and surveying' },
];

type CourseSeed = [code: string, uni: string, name: string, dept: string];

const COURSE_SEEDS: CourseSeed[] = [
  ['ME-101', 'uni-tuk', 'Mechanical Engineering', 'Engineering'],
  ['EE-101', 'uni-tuk', 'Electrical & Electronic Engineering', 'Engineering'],
  ['CE-101', 'uni-tuk', 'Civil Engineering', 'Engineering'],
  ['SE-101', 'uni-tuk', 'Software Engineering', 'Computing'],
  ['IT-101', 'uni-tuk', 'Information Technology', 'Computing'],
  ['HM-101', 'uni-tuk', 'Hospitality Management', 'Hospitality'],
  ['AF-101', 'uni-tuk', 'Accounting & Finance', 'Commerce'],
  ['SC-101', 'uni-tuk', 'Supply Chain & Logistics', 'Commerce'],
  ['BA-101', 'uni-tuk', 'Business Administration', 'Commerce'],
  ['FP-101', 'uni-tuk', 'Food Production & Technology', 'Engineering'],
  ['CS-201', 'uni-ku', 'Computer Science', 'Science'],
  ['AF-201', 'uni-ku', 'Accounting & Finance', 'Business'],
  ['HM-201', 'uni-ku', 'Hospitality Management', 'Hospitality'],
  ['AC-201', 'uni-ku', 'Actuarial Science', 'Mathematics'],
  ['ME-301', 'uni-uon', 'Mechanical Engineering', 'Engineering'],
  ['EE-301', 'uni-uon', 'Electrical & Electronic Engineering', 'Engineering'],
  ['CE-301', 'uni-uon', 'Civil Engineering', 'Engineering'],
  ['FI-301', 'uni-uon', 'BSc Finance', 'Commerce'],
  ['SC-301', 'uni-uon', 'Supply Chain Management', 'Commerce'],
  ['EE-401', 'uni-jkuat', 'Electrical & Electronic Engineering', 'Engineering'],
  ['WE-401', 'uni-jkuat', 'Water Engineering', 'Engineering'],
  ['FS-401', 'uni-jkuat', 'Food Science & Technology', 'Food Science'],
  ['AB-401', 'uni-jkuat', 'Agribusiness Management', 'Agribusiness'],
  ['MS-401', 'uni-jkuat', 'Mathematics & Statistics', 'Mathematics'],
  ['AF-501', 'uni-kemu', 'Accounting & Finance', 'Commerce'],
  ['HM-501', 'uni-kemu', 'Hospitality Management', 'Hospitality'],
  ['ICT-501', 'uni-kemu', 'BSc Information Communication Technology', 'Computing'],
  ['SC-501', 'uni-kemu', 'Supply Chain & Logistics', 'Commerce'],
  ['BA-501', 'uni-kemu', 'Business Administration', 'Commerce'],
];

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const demoCourses: Course[] = COURSE_SEEDS.map(([code, uni, name, dept]) => ({
  id: `crs-${slug(code)}`,
  university_id: uni,
  name,
  code,
  department: dept,
  duration_years: code.startsWith('HM') ? 3 : 4,
  description: null,
}));

const skillSeeds: Array<[name: string, category: string]> = [
  ['AutoCAD', 'Technical'],
  ['SolidWorks', 'Technical'],
  ['CATIA', 'Technical'],
  ['FEA / ANSYS', 'Technical'],
  ['Thermal Systems', 'Technical'],
  ['Fluid Mechanics', 'Technical'],
  ['Structural Design', 'Technical'],
  ['Surveying', 'Technical'],
  ['AutoCAD Civil 3D', 'Technical'],
  ['Power Systems', 'Technical'],
  ['Renewable Energy', 'Technical'],
  ['PLC & Control Systems', 'Technical'],
  ['Embedded Systems', 'Technical'],
  ['Python', 'Programming'],
  ['JavaScript', 'Programming'],
  ['TypeScript', 'Programming'],
  ['Java', 'Programming'],
  ['C / C++', 'Programming'],
  ['C# / .NET', 'Programming'],
  ['React', 'Programming'],
  ['Node.js', 'Programming'],
  ['Mobile App Development', 'Programming'],
  ['Git & Version Control', 'Technical'],
  ['Database Design', 'Technical'],
  ['SQL', 'Technical'],
  ['API Development', 'Technical'],
  ['Machine Learning', 'Technical'],
  ['Data Analysis', 'Technical'],
  ['Cloud Computing', 'Technical'],
  ['Cybersecurity', 'Technical'],
  ['Linux & Networking', 'Technical'],
  ['Technical Writing', 'Soft Skills'],
  ['Project Management', 'Soft Skills'],
  ['Leadership', 'Soft Skills'],
  ['Communication', 'Soft Skills'],
  ['Problem Solving', 'Soft Skills'],
  ['Customer Service', 'Soft Skills'],
  ['Time Management', 'Soft Skills'],
  ['Excel & Data Reporting', 'Technical'],
  ['Financial Modelling', 'Technical'],
  ['Bookkeeping', 'Technical'],
  ['Auditing', 'Technical'],
  ['Procurement', 'Technical'],
  ['Inventory Management', 'Technical'],
  ['Front Office', 'Soft Skills'],
  ['Food Safety', 'Technical'],
  ['Quality Assurance', 'Technical'],
  ['Front of House', 'Soft Skills'],
  ['Digital Marketing', 'Soft Skills'],
  ['Report Writing', 'Soft Skills'],
];

export const demoSkills: Skill[] = skillSeeds.map(([name, category]) => ({
  id: `skl-${slug(name)}`,
  name,
  category,
  description: null,
}));

const skillId = (name: string) => `skl-${slug(name)}`;
const courseId = (code: string) => `crs-${slug(code)}`;

type CompanySeed = [
  name: string,
  industry: string,
  location: string,
  size: string,
  description: string,
];

const COMPANY_SEEDS: CompanySeed[] = [
  ['Safaricom Limited', 'ind-tel', 'Nairobi', 'enterprise', 'Leading telecommunications company in East Africa.'],
  ['Microsoft Kenya', 'ind-tech', 'Nairobi', 'enterprise', 'Software, cloud and enterprise services.'],
  ['Google Kenya', 'ind-tech', 'Nairobi', 'enterprise', 'Search, advertising and Google Cloud.'],
  ['Ushahidi', 'ind-tech', 'Nairobi', 'small', 'Open-source crisis mapping and information platform.'],
  ['Access Kenya', 'ind-tech', 'Nairobi', 'medium', 'ISP, networking and web hosting.'],
  ['iHub Nairobi', 'ind-tech', 'Nairobi', 'small', 'Innovation hub and technology community.'],
  ['Sendy', 'ind-tech', 'Nairobi', 'small', 'On-demand logistics and fulfilment technology.'],
  ['M-KOPA', 'ind-tech', 'Nairobi', 'large', 'Asset financing and connected services.'],
  ['Equity Group Limited', 'ind-fin', 'Nairobi', 'enterprise', 'Largest bank in Kenya by market capitalisation.'],
  ['KCB Bank', 'ind-fin', 'Nairobi', 'enterprise', 'Largest bank in East Africa by assets.'],
  ['I&M Bank', 'ind-fin', 'Nairobi', 'large', 'Commercial banking and financial services.'],
  ['Britam Group', 'ind-fin', 'Nairobi', 'large', 'Insurance, asset management and retirement planning.'],
  ['KPMG East Africa', 'ind-fin', 'Nairobi', 'large', 'Audit, tax and advisory professional services.'],
  ['Deloitte Kenya', 'ind-fin', 'Nairobi', 'large', 'Audit, consulting and financial advisory.'],
  ['PwC Kenya', 'ind-fin', 'Nairobi', 'large', 'Assurance, tax and deals advisory.'],
  ['Centum Business Company', 'ind-fin', 'Nairobi', 'medium', 'Business services and financial technology.'],
  ['Toyota Kenya', 'ind-man', 'Nairobi', 'large', 'Automotive manufacturing, assembly and distribution.'],
  ['East African Breweries', 'ind-man', 'Nairobi', 'large', 'Beverage manufacturing and distribution.'],
  ['Eveready East Africa', 'ind-man', 'Nairobi', 'large', 'Battery and lighting manufacturer.'],
  ['Kenya Bakeries', 'ind-food', 'Nairobi', 'large', 'Largest baked goods manufacturer in East Africa.'],
  ['Unga Group', 'ind-man', 'Nairobi', 'large', 'Food manufacturing across East Africa.'],
  ['Kenya Power', 'ind-energy', 'Nairobi', 'enterprise', 'Electricity transmission, distribution and retail.'],
  ['Kenya Water', 'ind-energy', 'Nairobi', 'medium', 'Urban water and sewerage services.'],
  ['Kenya Geothermal Development', 'ind-energy', 'Nairobi', 'medium', 'Geothermal steam and power production.'],
  ['Gantad Logistics', 'ind-log', 'Nairobi', 'medium', 'Freight forwarding, warehousing and last-mile delivery.'],
  ['Kenya Ports Authority', 'ind-log', 'Mombasa', 'enterprise', 'Port, harbour and logistics infrastructure.'],
  ['Twiga Foods', 'ind-retail', 'Nairobi', 'large', 'B2B food supply and distribution platform.'],
  ['Jumia Kenya', 'ind-retail', 'Nairobi', 'large', 'Pan-African e-commerce marketplace.'],
  ['Naivas Supermarket', 'ind-retail', 'Nairobi', 'large', 'Retail chain operating across Kenya.'],
  ['Villa Hotels', 'ind-hos', 'Nairobi', 'large', 'Largest locally owned hotel group in Kenya.'],
  ['Sarova Hotels', 'ind-hos', 'Nairobi', 'large', 'East African hotel and hospitality group.'],
  ['Kenya Roads Board', 'ind-con', 'Nairobi', 'enterprise', 'National road network development and maintenance.'],
  ['National Housing Corporation', 'ind-con', 'Nairobi', 'enterprise', 'Housing development and urban renewal.'],
  ['Surbis Construction', 'ind-con', 'Nairobi', 'large', 'Building, civil works and project management.'],
  ['Aga Khan University Hospital', 'ind-health', 'Nairobi', 'enterprise', 'Tertiary teaching and referral hospital.'],
  ['Kenya Red Cross Society', 'ind-health', 'Nairobi', 'large', 'Humanitarian health and emergency response.'],
  ['Kenya Seed Company', 'ind-agri', 'Nairobi', 'medium', 'Seed production and agricultural inputs.'],
  ['KALRO', 'ind-agri', 'Nairobi', 'medium', 'Kenya Agricultural and Livestock Research Organisation.'],
];

// Food manufacturing gets its own industry in the seed; mirror it here.
demoIndustries.push({
  id: 'ind-food',
  name: 'Food Production & Technology',
  description: 'Food manufacturing, processing and quality assurance',
});

export const demoCompanies: Company[] = COMPANY_SEEDS.map(
  ([name, industry, location, size, description]) => ({
    id: `co-${slug(name)}`,
    name,
    industry_id: industry,
    location,
    website: null,
    email: `careers@${slug(name).replace(/-/g, '')}.com`,
    phone: null,
    description,
    size,
    verified: true,
  }),
);

const companyId = (name: string) => `co-${slug(name)}`;

type OppSeed = {
  company: string;
  title: string;
  description: string;
  requiredCourses: string[];
  alignedCourses: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  location: string;
  months: number;
  stipend: string;
  deadlineDays: number;
  method: 'email' | 'form' | 'portal' | 'other';
};

const OPP_SEEDS: OppSeed[] = [
  {
    company: 'Toyota Kenya',
    title: 'Mechanical Engineering Internship',
    description:
      'Support the design and manufacture of vehicle components. You will use CAD to model parts, support production trials, and work alongside the manufacturing engineering team on quality and process improvement.',
    requiredCourses: ['ME-101', 'ME-301'],
    alignedCourses: ['ME-101', 'ME-301', 'EE-101'],
    requiredSkills: ['AutoCAD', 'SolidWorks'],
    preferredSkills: ['FEA / ANSYS', 'Technical Writing'],
    location: 'Nairobi',
    months: 4,
    stipend: 'KES 20,000 - 25,000 / month',
    deadlineDays: 120,
    method: 'portal',
  },
  {
    company: 'Surbis Construction',
    title: 'Civil Engineering Attachment',
    description:
      'Site-based attachment covering structural drawing, setting out, quantity surveying and quality control on a live commercial project. You will be supervised by a site engineer and rotate through project management.',
    requiredCourses: ['CE-101', 'CE-301'],
    alignedCourses: ['CE-101', 'CE-301', 'WE-401'],
    requiredSkills: ['AutoCAD', 'Structural Design'],
    preferredSkills: ['Surveying', 'AutoCAD Civil 3D'],
    location: 'Nairobi',
    months: 6,
    stipend: 'KES 18,000 - 22,000 / month',
    deadlineDays: 138,
    method: 'email',
  },
  {
    company: 'Kenya Ports Authority',
    title: 'Civil Engineering Attachment - Marine Works',
    description:
      'Assist the marine engineering department with quay wall maintenance, dredging surveys and materials testing at the Port of Mombasa.',
    requiredCourses: ['CE-101', 'CE-301'],
    alignedCourses: ['CE-101', 'CE-301'],
    requiredSkills: ['Structural Design', 'Surveying'],
    preferredSkills: ['AutoCAD', 'Project Management'],
    location: 'Mombasa',
    months: 3,
    stipend: 'KES 20,000 - 26,000 / month',
    deadlineDays: 73,
    method: 'portal',
  },
  {
    company: 'Kenya Power',
    title: 'Electrical Engineering Attachment - Transmission',
    description:
      'Support power transmission line construction and maintenance, including switching operations, safety documentation and preventive maintenance on the national grid.',
    requiredCourses: ['EE-101', 'EE-301', 'EE-401'],
    alignedCourses: ['EE-101', 'EE-301', 'EE-401', 'WE-401'],
    requiredSkills: ['Power Systems', 'Technical Writing'],
    preferredSkills: ['PLC & Control Systems', 'Renewable Energy'],
    location: 'Multiple Locations',
    months: 3,
    stipend: 'KES 19,000 - 24,000 / month',
    deadlineDays: 102,
    method: 'email',
  },
  {
    company: 'Kenya Water',
    title: 'Water Engineering Attachment',
    description:
      'Work with the water quality and operations team: sampling, treatment plant process monitoring, and maintenance of distribution network assets.',
    requiredCourses: ['WE-401', 'CE-101'],
    alignedCourses: ['WE-401', 'CE-101', 'EE-401'],
    requiredSkills: ['Fluid Mechanics', 'Technical Writing'],
    preferredSkills: ['Renewable Energy', 'Project Management'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 17,000 - 21,000 / month',
    deadlineDays: 145,
    method: 'email',
  },
  {
    company: 'Kenya Geothermal Development',
    title: 'Geothermal Engineering Attachment',
    description:
      'Field attachment at geothermal wellfields supporting well testing, drilling operations and plant maintenance alongside the subsurface and production engineering teams.',
    requiredCourses: ['ME-101', 'EE-101', 'ME-301'],
    alignedCourses: ['ME-101', 'EE-101', 'ME-301'],
    requiredSkills: ['Fluid Mechanics', 'Thermal Systems'],
    preferredSkills: ['AutoCAD', 'Project Management'],
    location: 'Naivasha',
    months: 4,
    stipend: 'KES 22,000 - 28,000 / month',
    deadlineDays: 152,
    method: 'portal',
  },
  {
    company: 'Kenya Roads Board',
    title: 'Civil Engineering Attachment - Road Design',
    description:
      'In the materials testing and designs office: lab testing of aggregates, review of road drawings, and GIS-based mapping of the road network.',
    requiredCourses: ['CE-101', 'CE-301'],
    alignedCourses: ['CE-101', 'CE-301'],
    requiredSkills: ['AutoCAD Civil 3D', 'Structural Design'],
    preferredSkills: ['Surveying', 'Data Analysis'],
    location: 'Nairobi',
    months: 6,
    stipend: 'KES 21,000 - 25,000 / month',
    deadlineDays: 58,
    method: 'email',
  },
  {
    company: 'Safaricom Limited',
    title: 'Software Engineering Internship - Backend',
    description:
      'Build and maintain backend services powering M-PESA and other telecom products. You will work in an agile team on Java and Python services backed by PostgreSQL and cloud infrastructure.',
    requiredCourses: ['SE-101', 'CS-201'],
    alignedCourses: ['SE-101', 'CS-201', 'IT-101', 'ICT-501'],
    requiredSkills: ['Java', 'Database Design'],
    preferredSkills: ['Cloud Computing', 'Git & Version Control', 'API Development'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 25,000 - 32,000 / month',
    deadlineDays: 78,
    method: 'portal',
  },
  {
    company: 'Microsoft Kenya',
    title: 'Frontend Developer Internship',
    description:
      'Develop accessible, responsive web interfaces with React and TypeScript as part of the regional engineering group. You will pair with senior engineers and participate in code review.',
    requiredCourses: ['SE-101', 'CS-201'],
    alignedCourses: ['SE-101', 'CS-201'],
    requiredSkills: ['React', 'TypeScript'],
    preferredSkills: ['Git & Version Control', 'API Development'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 23,000 - 30,000 / month',
    deadlineDays: 105,
    method: 'portal',
  },
  {
    company: 'Google Kenya',
    title: 'Software Engineering Internship',
    description:
      'Work on Google Cloud tooling and internal developer platform projects. Expect strong fundamentals work, code review and exposure to production systems.',
    requiredCourses: ['SE-101', 'CS-201'],
    alignedCourses: ['SE-101', 'CS-201'],
    requiredSkills: ['Python', 'C / C++'],
    preferredSkills: ['Machine Learning', 'Cloud Computing'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 30,000 - 40,000 / month',
    deadlineDays: 121,
    method: 'portal',
  },
  {
    company: 'Ushahidi',
    title: 'Junior Software Engineer',
    description:
      'Contribute to an open-source crisis-mapping platform used by NGOs and governments across Africa. Python and JavaScript stack, small team, high ownership.',
    requiredCourses: ['SE-101', 'CS-201'],
    alignedCourses: ['SE-101', 'CS-201', 'IT-101'],
    requiredSkills: ['Python', 'JavaScript'],
    preferredSkills: ['React', 'Git & Version Control', 'API Development'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 20,000 - 26,000 / month',
    deadlineDays: 48,
    method: 'email',
  },
  {
    company: 'Sendy',
    title: 'Software Engineering Internship - Logistics Platform',
    description:
      'Full-stack engineering on an on-demand logistics platform serving thousands of Kenyan businesses. Python, Django, PostgreSQL and React.',
    requiredCourses: ['SE-101', 'CS-201'],
    alignedCourses: ['SE-101', 'CS-201', 'SC-501'],
    requiredSkills: ['Python', 'API Development'],
    preferredSkills: ['React', 'Database Design', 'Git & Version Control'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 22,000 - 28,000 / month',
    deadlineDays: 63,
    method: 'portal',
  },
  {
    company: 'iHub Nairobi',
    title: 'Web Development Attachment',
    description:
      'Build open-source web tools and community projects with the Nairobi developer community. Mentorship included; strong portfolio value.',
    requiredCourses: ['SE-101', 'IT-101', 'ICT-501', 'CS-201'],
    alignedCourses: ['SE-101', 'IT-101', 'ICT-501', 'CS-201'],
    requiredSkills: ['JavaScript', 'React'],
    preferredSkills: ['Technical Writing', 'Git & Version Control'],
    location: 'Nairobi',
    months: 3,
    stipend: 'Unpaid / stipend negotiated',
    deadlineDays: 43,
    method: 'form',
  },
  {
    company: 'M-KOPA',
    title: 'Data Science Internship',
    description:
      'Build and evaluate models supporting credit risk and customer analytics for a fast-growing fintech. Strong pathway for analytics-focused engineers.',
    requiredCourses: ['CS-201', 'MS-401', 'SE-101'],
    alignedCourses: ['CS-201', 'MS-401'],
    requiredSkills: ['Data Analysis', 'Python'],
    preferredSkills: ['Machine Learning', 'SQL'],
    location: 'Nairobi',
    months: 4,
    stipend: 'KES 28,000 - 35,000 / month',
    deadlineDays: 68,
    method: 'portal',
  },
  {
    company: 'Access Kenya',
    title: 'IT Support & Infrastructure Internship',
    description:
      'Provide technical support, maintain Linux and Windows server environments, and manage the network infrastructure for a busy ISP.',
    requiredCourses: ['IT-101', 'ICT-501'],
    alignedCourses: ['IT-101', 'ICT-501'],
    requiredSkills: ['Linux & Networking', 'Customer Service'],
    preferredSkills: ['Cybersecurity', 'Technical Writing'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 18,000 - 23,000 / month',
    deadlineDays: 68,
    method: 'email',
  },
  {
    company: 'Twiga Foods',
    title: 'IT & ERP Systems Attachment',
    description:
      'Support ERP and operations tooling for a high-volume food distribution platform, including reporting, integrations and user support.',
    requiredCourses: ['IT-101', 'ICT-501'],
    alignedCourses: ['IT-101', 'ICT-501', 'SC-101'],
    requiredSkills: ['Database Design', 'Customer Service'],
    preferredSkills: ['Python', 'Excel & Data Reporting'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 20,000 - 26,000 / month',
    deadlineDays: 66,
    method: 'email',
  },
  {
    company: 'Equity Group Limited',
    title: 'Finance & Accounting Internship',
    description:
      'Support financial analysis, reporting and regulatory submissions within the finance team of a large commercial bank. Strong exposure to IFRS and audit processes.',
    requiredCourses: ['AF-101', 'AF-201', 'FI-301', 'AF-501'],
    alignedCourses: ['AF-101', 'AF-201', 'FI-301', 'AF-501', 'AC-201'],
    requiredSkills: ['Excel & Data Reporting', 'Bookkeeping'],
    preferredSkills: ['Auditing', 'Financial Modelling'],
    location: 'Nairobi',
    months: 4,
    stipend: 'KES 22,000 - 28,000 / month',
    deadlineDays: 140,
    method: 'portal',
  },
  {
    company: 'KCB Bank',
    title: 'Banking Operations & Risk Internship',
    description:
      'Learn banking operations, customer service and regulatory compliance at one of East Africa largest banks. Includes rotation through credit risk and operations.',
    requiredCourses: ['AF-101', 'AF-201', 'FI-301', 'BA-101'],
    alignedCourses: ['AF-101', 'AF-201', 'FI-301', 'BA-101', 'AF-501'],
    requiredSkills: ['Communication', 'Customer Service'],
    preferredSkills: ['Excel & Data Reporting', 'Auditing'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 20,000 - 25,000 / month',
    deadlineDays: 73,
    method: 'email',
  },
  {
    company: 'KPMG East Africa',
    title: 'Audit & Assurance Internship',
    description:
      'Support audit engagements for banking, manufacturing and technology clients. Includes testing, working paper preparation and client communication.',
    requiredCourses: ['AF-101', 'AF-201', 'AF-501', 'FI-301'],
    alignedCourses: ['AF-101', 'AF-201', 'AF-501', 'FI-301'],
    requiredSkills: ['Auditing', 'Excel & Data Reporting'],
    preferredSkills: ['Communication', 'Bookkeeping'],
    location: 'Nairobi',
    months: 4,
    stipend: 'KES 25,000 - 32,000 / month',
    deadlineDays: 122,
    method: 'portal',
  },
  {
    company: 'Deloitte Kenya',
    title: 'Technology Risk & Advisory Internship',
    description:
      'Assist technology audit and advisory engagements, working on IT general controls, data analytics and client reporting.',
    requiredCourses: ['AF-201', 'AF-501', 'SE-101', 'CS-201'],
    alignedCourses: ['AF-201', 'AF-501', 'SE-101', 'CS-201', 'ICT-501'],
    requiredSkills: ['Excel & Data Reporting', 'Auditing'],
    preferredSkills: ['Data Analysis', 'Cybersecurity', 'Python'],
    location: 'Nairobi',
    months: 4,
    stipend: 'KES 26,000 - 33,000 / month',
    deadlineDays: 130,
    method: 'portal',
  },
  {
    company: 'Britam Group',
    title: 'Insurance & Actuarial Internship',
    description:
      'Support underwriting and actuarial teams in an insurance group, contributing to portfolio analysis and policy documentation.',
    requiredCourses: ['AC-201', 'AF-201', 'MS-401'],
    alignedCourses: ['AC-201', 'AF-201', 'MS-401'],
    requiredSkills: ['Data Analysis', 'Communication'],
    preferredSkills: ['Financial Modelling', 'Excel & Data Reporting'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 21,000 - 27,000 / month',
    deadlineDays: 166,
    method: 'portal',
  },
  {
    company: 'Centum Business Company',
    title: 'Business Analyst Attachment',
    description:
      'Analyse business performance data, support process improvement, and produce dashboards for operations leaders.',
    requiredCourses: ['BA-101', 'BA-501', 'MS-401', 'AF-201'],
    alignedCourses: ['BA-101', 'BA-501', 'MS-401', 'AF-201'],
    requiredSkills: ['Excel & Data Reporting', 'Communication'],
    preferredSkills: ['Data Analysis', 'SQL'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 19,000 - 24,000 / month',
    deadlineDays: 116,
    method: 'email',
  },
  {
    company: 'Gantad Logistics',
    title: 'Supply Chain & Logistics Attachment',
    description:
      'Optimise logistics operations: warehouse layout, route planning, fleet scheduling and stock control across a national distribution network.',
    requiredCourses: ['SC-101', 'SC-301', 'SC-501'],
    alignedCourses: ['SC-101', 'SC-301', 'SC-501', 'AF-101'],
    requiredSkills: ['Inventory Management', 'Project Management'],
    preferredSkills: ['Excel & Data Reporting', 'Procurement', 'Customer Service'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 19,000 - 24,000 / month',
    deadlineDays: 59,
    method: 'email',
  },
  {
    company: 'Kenya Ports Authority',
    title: 'Port Operations & Logistics Attachment',
    description:
      'Support port operations, cargo documentation and throughput planning at Mombasa port. Exposure to customs, clearing and forwarding processes.',
    requiredCourses: ['SC-101', 'SC-301', 'SC-501'],
    alignedCourses: ['SC-101', 'SC-301', 'SC-501'],
    requiredSkills: ['Inventory Management', 'Communication'],
    preferredSkills: ['Procurement', 'Excel & Data Reporting'],
    location: 'Mombasa',
    months: 3,
    stipend: 'KES 20,000 - 25,000 / month',
    deadlineDays: 145,
    method: 'portal',
  },
  {
    company: 'Jumia Kenya',
    title: 'Supply Chain & Marketplace Operations Attachment',
    description:
      'Work with marketplace operations on vendor onboarding, inventory health and delivery performance metrics.',
    requiredCourses: ['SC-101', 'SC-301', 'BA-501'],
    alignedCourses: ['SC-101', 'SC-301', 'BA-501', 'SC-501'],
    requiredSkills: ['Data Analysis', 'Communication'],
    preferredSkills: ['Inventory Management', 'Digital Marketing'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 18,000 - 23,000 / month',
    deadlineDays: 111,
    method: 'portal',
  },
  {
    company: 'Villa Hotels',
    title: 'Hotel Operations & Food Service Attachment',
    description:
      'Rotate through front office, food and beverage, and guest relations functions in a busy Nairobi hotel group.',
    requiredCourses: ['HM-101', 'HM-201', 'HM-501'],
    alignedCourses: ['HM-101', 'HM-201', 'HM-501', 'BA-501'],
    requiredSkills: ['Front Office', 'Communication'],
    preferredSkills: ['Front of House', 'Food Safety', 'Customer Service'],
    location: 'Nairobi',
    months: 4,
    stipend: 'KES 15,000 - 20,000 / month',
    deadlineDays: 121,
    method: 'form',
  },
  {
    company: 'Sarova Hotels',
    title: 'Hospitality Management Attachment',
    description:
      'Hospitality operations attachment covering guest experience, event coordination and quality of service delivery.',
    requiredCourses: ['HM-101', 'HM-201', 'HM-501'],
    alignedCourses: ['HM-101', 'HM-201', 'HM-501'],
    requiredSkills: ['Customer Service', 'Communication'],
    preferredSkills: ['Front of House', 'Food Safety'],
    location: 'Nairobi',
    months: 4,
    stipend: 'KES 16,000 - 21,000 / month',
    deadlineDays: 126,
    method: 'email',
  },
  {
    company: 'Naivas Supermarket',
    title: 'Retail Operations Attachment',
    description:
      'Work on store operations, merchandising, stock control and customer service in a fast-moving retail environment.',
    requiredCourses: ['BA-101', 'SC-101', 'BA-501'],
    alignedCourses: ['BA-101', 'SC-101', 'BA-501', 'SC-501'],
    requiredSkills: ['Customer Service', 'Inventory Management'],
    preferredSkills: ['Communication', 'Digital Marketing'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 15,000 - 19,000 / month',
    deadlineDays: 70,
    method: 'email',
  },
  {
    company: 'East African Breweries',
    title: 'Mechanical Engineering - Production Support',
    description:
      'Production line optimisation and equipment maintenance within a beverage manufacturing plant, including planned maintenance scheduling and downtime analysis.',
    requiredCourses: ['ME-101', 'ME-301'],
    alignedCourses: ['ME-101', 'ME-301', 'FP-101'],
    requiredSkills: ['Fluid Mechanics', 'Problem Solving'],
    preferredSkills: ['PLC & Control Systems', 'Project Management'],
    location: 'Nairobi',
    months: 4,
    stipend: 'KES 19,000 - 24,000 / month',
    deadlineDays: 122,
    method: 'form',
  },
  {
    company: 'Eveready East Africa',
    title: 'Electrical Engineering - Maintenance Attachment',
    description:
      'Maintenance engineering on production lines, including PLC troubleshooting, preventive maintenance and root cause analysis.',
    requiredCourses: ['EE-101', 'EE-301', 'EE-401'],
    alignedCourses: ['EE-101', 'EE-301', 'EE-401', 'ME-101'],
    requiredSkills: ['PLC & Control Systems', 'Problem Solving'],
    preferredSkills: ['Embedded Systems', 'Technical Writing'],
    location: 'Nairobi',
    months: 4,
    stipend: 'KES 18,000 - 23,000 / month',
    deadlineDays: 135,
    method: 'email',
  },
  {
    company: 'Kenya Bakeries',
    title: 'Food Production & Technology Attachment',
    description:
      'Support food production operations at scale: process control, quality assurance, HACCP compliance and packaging line performance.',
    requiredCourses: ['FP-101', 'FS-401'],
    alignedCourses: ['FP-101', 'FS-401', 'ME-101'],
    requiredSkills: ['Food Safety', 'Problem Solving'],
    preferredSkills: ['Project Management', 'Quality Assurance'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 17,000 - 21,000 / month',
    deadlineDays: 76,
    method: 'portal',
  },
  {
    company: 'Unga Group',
    title: 'Food Science & Technology Attachment',
    description:
      'R&D and quality attachment in a food manufacturing group, working on product development trials and laboratory analysis.',
    requiredCourses: ['FS-401', 'FP-101'],
    alignedCourses: ['FS-401', 'FP-101', 'AB-401'],
    requiredSkills: ['Food Safety', 'Data Analysis'],
    preferredSkills: ['Technical Writing', 'Project Management'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 18,000 - 22,000 / month',
    deadlineDays: 148,
    method: 'email',
  },
  {
    company: 'Aga Khan University Hospital',
    title: 'Clinical Engineering & Hospital Systems Attachment',
    description:
      'Support biomedical equipment maintenance, clinical systems and hospital information workflows in a teaching hospital.',
    requiredCourses: ['EE-101', 'EE-301', 'IT-101'],
    alignedCourses: ['EE-101', 'EE-301', 'IT-101', 'ICT-501'],
    requiredSkills: ['Technical Writing', 'Communication'],
    preferredSkills: ['Data Analysis', 'Cybersecurity'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 20,000 - 26,000 / month',
    deadlineDays: 114,
    method: 'form',
  },
  {
    company: 'Kenya Red Cross Society',
    title: 'Community Health Attachment',
    description:
      'Support community health programmes: field data collection, reporting, and coordination with county health management teams.',
    requiredCourses: ['BA-501', 'AB-401'],
    alignedCourses: ['BA-501', 'AB-401', 'MS-401'],
    requiredSkills: ['Communication', 'Report Writing'],
    preferredSkills: ['Data Analysis', 'Problem Solving'],
    location: 'Multiple Locations',
    months: 3,
    stipend: 'KES 16,000 - 20,000 / month',
    deadlineDays: 53,
    method: 'email',
  },
  {
    company: 'Kenya Seed Company',
    title: 'Agronomy & Supply Chain Attachment',
    description:
      'Support seed production operations, quality testing and distribution planning across East Africa.',
    requiredCourses: ['AB-401', 'FS-401', 'SC-101'],
    alignedCourses: ['AB-401', 'FS-401', 'SC-101', 'MS-401'],
    requiredSkills: ['Problem Solving', 'Communication'],
    preferredSkills: ['Data Analysis', 'Inventory Management'],
    location: 'Nairobi',
    months: 3,
    stipend: 'KES 16,000 - 20,000 / month',
    deadlineDays: 137,
    method: 'email',
  },
  {
    company: 'KALRO',
    title: 'Research & Data Analyst Attachment',
    description:
      'Data collection, analysis and reporting for agricultural research programmes, including preparation of research findings for policy audiences.',
    requiredCourses: ['MS-401', 'AB-401', 'AF-201'],
    alignedCourses: ['MS-401', 'AB-401', 'AF-201', 'CS-201'],
    requiredSkills: ['Data Analysis', 'Excel & Data Reporting'],
    preferredSkills: ['Python', 'Report Writing'],
    location: 'Nairobi',
    months: 4,
    stipend: 'KES 18,000 - 22,000 / month',
    deadlineDays: 168,
    method: 'portal',
  },
];

export const demoOpportunities: Opportunity[] = OPP_SEEDS.map((s, i) => {
  const company = demoCompanies.find((c) => c.name === s.company)!;
  return {
    id: `opp-${String(i + 1).padStart(2, '0')}`,
    company_id: company.id,
    title: s.title,
    description: s.description,
    position_type: 'attachment',
    required_course_ids: s.requiredCourses.map(courseId),
    aligned_course_ids: s.alignedCourses.map(courseId),
    required_skills: s.requiredSkills.map(skillId),
    preferred_skills: s.preferredSkills.map(skillId),
    location: s.location,
    duration_months: s.months,
    stipend: s.stipend,
    application_deadline: daysFromNow(s.deadlineDays),
    application_url: null,
    application_method: s.method,
    contact_email: company.email ?? null,
    contact_person: null,
    is_active: true,
    posted_date: daysFromNow(-Math.max(2, s.deadlineDays - 30)),
  };
});

// Course -> industry alignment, used by the rules-based matcher.
export const demoAlignments: Record<string, number> = {
  'ME-101:ind-man': 95,
  'ME-101:ind-eng': 100,
  'ME-101:ind-energy': 85,
  'ME-301:ind-man': 96,
  'ME-301:ind-eng': 100,
  'EE-101:ind-energy': 97,
  'EE-101:ind-eng': 100,
  'EE-101:ind-tel': 80,
  'EE-301:ind-energy': 97,
  'EE-301:ind-eng': 100,
  'EE-401:ind-agri': 85,
  'EE-401:ind-energy': 95,
  'CE-101:ind-con': 98,
  'CE-101:ind-eng': 100,
  'CE-101:ind-energy': 78,
  'CE-301:ind-con': 98,
  'CE-301:ind-eng': 100,
  'WE-401:ind-energy': 92,
  'WE-401:ind-eng': 95,
  'SE-101:ind-tech': 100,
  'SE-101:ind-fin': 70,
  'SE-101:ind-tel': 82,
  'CS-201:ind-tech': 98,
  'CS-201:ind-fin': 68,
  'CS-201:ind-health': 60,
  'IT-101:ind-tech': 95,
  'IT-101:ind-tel': 90,
  'IT-101:ind-fin': 70,
  'ICT-501:ind-tech': 93,
  'ICT-501:ind-tel': 85,
  'AF-101:ind-fin': 98,
  'AF-201:ind-fin': 99,
  'AF-501:ind-fin': 99,
  'FI-301:ind-fin': 100,
  'AC-201:ind-fin': 100,
  'SC-101:ind-log': 100,
  'SC-301:ind-log': 100,
  'SC-501:ind-log': 100,
  'SC-101:ind-retail': 75,
  'SC-501:ind-retail': 72,
  'HM-101:ind-hos': 100,
  'HM-201:ind-hos': 100,
  'HM-501:ind-hos': 100,
  'HM-101:ind-log': 70,
  'BA-101:ind-fin': 70,
  'BA-101:ind-retail': 75,
  'BA-501:ind-retail': 78,
  'BA-501:ind-fin': 72,
  'MS-401:ind-fin': 80,
  'MS-401:ind-tech': 75,
  'MS-401:ind-agri': 70,
  'FP-101:ind-food': 100,
  'FS-401:ind-food': 100,
  'FS-401:ind-agri': 85,
  'AB-401:ind-agri': 100,
  'AB-401:ind-log': 75,
};

// ---------------------------------------------------------------------------
// Mutable state
// ---------------------------------------------------------------------------

/** A saved student profile in demo mode. */
export interface DemoStudentProfile extends StudentProfile {
  /** user_id -> profile */
}

interface DemoStore {
  /** user_id -> profile */
  profiles: Map<string, DemoStudentProfile>;
  /** student_id -> skill ids */
  skills: Map<string, string[]>;
  /** student_id -> preferred locations, in order */
  locations: Map<string, string[]>;
  /** student_id -> preferred industry ids */
  industries: Map<string, string[]>;
  applications: Application[];
  notes: ApplicationNote[];
  /** Demo-mode auth session, keyed by literal 'demo'. */
  sessions: Map<string, { id: string; email: string; fullName: string }>;
  seq: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __apaDemoStore: DemoStore | undefined;
}

/** user_id of the signed-in demo student. */
const DEMO_USER_ID = 'demo-user';
/** student_id of the seeded demo profile. */
const DEMO_STUDENT_ID = 'stu-demo';

/**
 * A fully populated profile so the demo shows meaningful match scores on the
 * very first login, instead of an empty dashboard. Third-year Accounting &
 * Finance at TUK, which lines up with the large banking/audit/professional
 * services block in the seed data.
 */
function seedDemoProfile(store: DemoStore): void {
  const now = nowIso();

  const profile: DemoStudentProfile = {
    id: DEMO_STUDENT_ID,
    user_id: DEMO_USER_ID,
    university_id: 'uni-tuk',
    course_id: courseId('AF-101'),
    year_of_study: 3,
    expected_graduation_date: daysFromNow(420),
    bio: 'Third-year Accounting and Finance student at the Technical University of Kenya. I am strongest in spreadsheet modelling and financial statement preparation, and I am looking for a six-month attachment where I can work on real accounts rather than textbook exercises.',
    portfolio_link: null,
    cv_link: null,
    contact_email: 'student@tukenya.ac.ke',
    phone_number: '+254700000000',
    availability_start_date: daysFromNow(60),
    availability_end_date: daysFromNow(245),
    created_at: now,
    updated_at: now,
  };

  store.profiles.set(DEMO_USER_ID, profile);
  store.skills.set(
    DEMO_STUDENT_ID,
    [
      'Excel & Data Reporting',
      'Financial Modelling',
      'Bookkeeping',
      'Auditing',
      'Communication',
      'Report Writing',
      'Problem Solving',
      'Time Management',
    ].map(skillId),
  );
  store.locations.set(DEMO_STUDENT_ID, ['Nairobi', 'Mombasa']);
  store.industries.set(DEMO_STUDENT_ID, ['ind-fin', 'ind-tech']);
}

function freshStore(): DemoStore {
  const store: DemoStore = {
    profiles: new Map(),
    skills: new Map(),
    locations: new Map(),
    industries: new Map(),
    applications: [],
    notes: [],
    sessions: new Map(),
    seq: 0,
  };

  seedDemoProfile(store);

  return store;
}

export function demoStore(): DemoStore {
  if (!globalThis.__apaDemoStore) globalThis.__apaDemoStore = freshStore();
  return globalThis.__apaDemoStore;
}

export function nextDemoId(prefix: string): string {
  const store = demoStore();
  store.seq += 1;
  return `${prefix}-${store.seq.toString(36)}${Date.now().toString(36).slice(-4)}`;
}

export const nowIso = () => iso(new Date());
export { slug };