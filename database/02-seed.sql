-- ============================================================================
-- Attachment Placement Agent - Seed Data
-- Run this SECOND in Supabase SQL Editor (after 01-schema.sql).
--
-- FIXES APPLIED vs. the original seed:
--   * Deadlines moved to the 2027 attachment cycle. Every original deadline
--     (2026-04-30 .. 2026-06-30) had already passed.
--   * Finance internships no longer require "Hospitality Management", and the
--     logistics role no longer requires it either. Added the actual
--     Accounting / Finance / Supply Chain programmes.
--   * Courses added for all 5 universities. Previously only TUK had courses,
--     so selecting Kenyatta University produced an empty dropdown.
--   * opportunity_industries is now populated, so the industry shown on every
--     opportunity card is actually present.
--   * Idempotent: safe to re-run.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Universities
-- ----------------------------------------------------------------------------
INSERT INTO public.universities (name, location, abbreviation, description, website)
VALUES
  ('Technical University of Kenya', 'Nairobi', 'TUK',
   'Leading technical university in East Africa, known for engineering and computing.',
   'https://www.tukenya.ac.ke'),
  ('Kenyatta University', 'Nairobi', 'KU',
   'Premier public university with the largest enrolment in Kenya.',
   'https://www.ku.ac.ke'),
  ('University of Nairobi', 'Nairobi', 'UoN',
   'Oldest and largest university in Kenya.',
   'https://www.uonbi.ac.ke'),
  ('Jomo Kenyatta University of Agriculture and Technology', 'Nairobi', 'JKUAT',
   'Agricultural, engineering and technology focus.',
   'https://www.jkuat.ac.ke'),
  ('Kenya Methodist University', 'Nairobi', 'KeMU',
   'Private university with strong business and hospitality programmes.',
   'https://www.kemu.ac.ke'),
  ('Kenyatta University Teaching, Testing & Research Campus', 'Nairobi', null,
   null, null)
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Industries
-- ----------------------------------------------------------------------------
INSERT INTO public.industries (name, description) VALUES
  ('Technology & Software', 'Software development, IT services, SaaS'),
  ('Engineering', 'Mechanical, civil, electrical and structural engineering'),
  ('Finance & Banking', 'Banking, insurance, accounting and fintech'),
  ('Telecommunications', 'Telecom services and mobile networks'),
  ('Manufacturing', 'Industrial production and automotive'),
  ('Hospitality & Tourism', 'Hotels, restaurants and tourism'),
  ('Logistics & Supply Chain', 'Shipping, warehousing and distribution'),
  ('Energy & Utilities', 'Power generation, transmission and water'),
  ('Healthcare', 'Hospitals, clinics and pharmaceuticals'),
  ('Retail & E-commerce', 'Retail, online marketplaces and distribution'),
  ('Agriculture', 'Agribusiness, food processing and agritech'),
  ('Construction & Real Estate', 'Contracting, property development and surveying')
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Courses
-- ----------------------------------------------------------------------------
INSERT INTO public.courses (university_id, name, code, department, duration_years, description)
SELECT u.id, v.name, v.code, v.department, v.years, v.description
FROM (VALUES
  -- Technical University of Kenya
  ('TUK',  'Mechanical Engineering',      'ME-101',  'Engineering', 4, 'Design, analysis and manufacture of mechanical systems.'),
  ('TUK',  'Electrical & Electronic Engineering', 'EE-101', 'Engineering', 4, 'Power systems, control and electronics.'),
  ('TUK',  'Civil Engineering',           'CE-101',  'Engineering', 4, 'Structural, water and transport infrastructure.'),
  ('TUK',  'Software Engineering',        'SE-101',  'Computing',   4, 'Software design, development and maintenance.'),
  ('TUK',  'Information Technology',      'IT-101',  'Computing',   4, 'IT infrastructure, systems administration and support.'),
  ('TUK',  'Hospitality Management',      'HM-101',  'Hospitality', 3, 'Hotel, food service and event operations.'),
  ('TUK',  'Accounting & Finance',        'AF-101',  'Commerce',    4, 'Financial accounting, reporting and corporate finance.'),
  ('TUK',  'Supply Chain & Logistics',    'SC-101',  'Commerce',    4, 'Procurement, warehousing and distribution.'),
  ('TUK',  'Business Administration',     'BA-101',  'Commerce',    3, 'Management, marketing and organisational studies.'),
  ('TUK',  'Food Production & Technology','FP-101',  'Engineering', 4, 'Food science, processing and safety.'),
  -- Kenyatta University
  ('KU',   'Computer Science',            'CS-201',  'Science',     4, 'Computing theory, algorithms and systems.'),
  ('KU',   'Accounting & Finance',        'AF-201',  'Business',    4, 'Financial accounting and corporate finance.'),
  ('KU',   'Hospitality Management',      'HM-201',  'Hospitality', 3, 'Food and beverage plus accommodation management.'),
  ('KU',   'Actuarial Science',           'AC-201',  'Mathematics', 4, 'Quantitative finance and risk analysis.'),
  -- University of Nairobi
  ('UoN',  'Mechanical Engineering',      'ME-301',  'Engineering', 4, 'Design and thermal systems.'),
  ('UoN',  'Electrical & Electronic Engineering', 'EE-301', 'Engineering', 4, 'Power and electronic systems.'),
  ('UoN',  'Civil Engineering',           'CE-301',  'Engineering', 4, 'Infrastructure and environmental engineering.'),
  ('UoN',  'BSc Finance',                 'FI-301',  'Commerce',    4, 'Corporate and public finance.'),
  ('UoN',  'Supply Chain Management',     'SC-301',  'Commerce',    4, 'Integrated supply chain and operations.'),
  -- JKUAT
  ('JKUAT','Electrical & Electronic Engineering', 'EE-401', 'Engineering', 4, 'Power systems with an agriculture bias.'),
  ('JKUAT','Water Engineering',          'WE-401',  'Engineering', 4, 'Water resources, treatment and irrigation.'),
  ('JKUAT','Food Science & Technology',   'FS-401',  'Food Science', 4, 'Food processing, safety and quality.'),
  ('JKUAT','Agribusiness Management',     'AB-401',  'Agribusiness',4, 'Agricultural economics and enterprise.'),
  ('JKUAT','Mathematics & Statistics',    'MS-401',  'Mathematics', 4, 'Quantitative skills with data analysis.'),
  -- Kenya Methodist University
  ('KeMU', 'Accounting & Finance',        'AF-501',  'Commerce',    4, 'Accounting, auditing and finance.'),
  ('KeMU', 'Hospitality Management',      'HM-501',  'Hospitality', 3, 'Hotel and restaurant operations.'),
  ('KeMU', 'BSc Information Communication Technology', 'ICT-501', 'Computing', 4, 'Systems and support.'),
  ('KeMU', 'Supply Chain & Logistics',    'SC-501',  'Commerce',    4, 'Logistics and distribution.'),
  ('KeMU', 'Business Administration',     'BA-501',  'Commerce',    3, 'General business and management.')
) AS v(uni, name, code, department, years, description)
JOIN public.universities u ON u.abbreviation = v.uni
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. Skills
-- ----------------------------------------------------------------------------
INSERT INTO public.skills (name, category, description) VALUES
  ('AutoCAD',              'Technical',    '2D and 3D computer-aided drafting.'),
  ('SolidWorks',           'Technical',    '3D parametric CAD and simulation.'),
  ('CATIA',                'Technical',    'CAD/CAE used in automotive design.'),
  ('FEA / ANSYS',          'Technical',    'Finite element analysis.'),
  ('Thermal Systems',      'Technical',    'Heat transfer and thermodynamics.'),
  ('Fluid Mechanics',      'Technical',    'Hydraulics, pneumatics and flow.'),
  ('Structural Design',    'Technical',    'Reinforced concrete and steel design.'),
  ('Surveying',            'Technical',    'Total station and GPS surveying.'),
  ('AutoCAD Civil 3D',     'Technical',    'Civil and infrastructure drafting.'),
  ('Power Systems',        'Technical',    'Generation, transmission and distribution.'),
  ('Renewable Energy',     'Technical',    'Solar and wind energy systems.'),
  ('PLC & Control Systems','Technical',    'Programmable logic controllers.'),
  ('Embedded Systems',     'Technical',    'Microcontrollers and firmware.'),
  ('Python',               'Programming',  'Python programming language.'),
  ('JavaScript',           'Programming',  'JavaScript and TypeScript.'),
  ('TypeScript',           'Programming',  'Typed JavaScript.'),
  ('Java',                 'Programming',  'Java programming language.'),
  ('C / C++',              'Programming',  'Systems and object-oriented programming.'),
  ('C# / .NET',            'Programming',  'Enterprise application development.'),
  ('React',                'Programming',  'React.js frontend development.'),
  ('Node.js',              'Programming',  'Server-side JavaScript.'),
  ('Mobile App Development','Programming',  'Android and iOS development.'),
  ('Git & Version Control','Technical',    'GitHub, GitLab, branching strategies.'),
  ('Database Design',      'Technical',    'Relational modelling and normalisation.'),
  ('SQL',                  'Technical',    'Query writing for reporting and analytics.'),
  ('API Development',      'Technical',    'REST and GraphQL services.'),
  ('Machine Learning',     'Technical',    'ML model development and deployment.'),
  ('Data Analysis',        'Technical',    'Statistical analysis of datasets.'),
  ('Cloud Computing',      'Technical',    'AWS, Azure and Google Cloud.'),
  ('Cybersecurity',        'Technical',    'Security operations and hardening.'),
  ('Linux & Networking',   'Technical',    'Linux administration and networking.'),
  ('Technical Writing',    'Soft Skills',  'Clear written technical communication.'),
  ('Project Management',   'Soft Skills',  'Planning, scheduling and delivery.'),
  ('Leadership',           'Soft Skills',  'Team leadership.'),
  ('Communication',        'Soft Skills',  'Verbal and written communication.'),
  ('Problem Solving',       'Soft Skills',  'Analytical and critical thinking.'),
  ('Customer Service',     'Soft Skills',  'Customer relations and support.'),
  ('Time Management',      'Soft Skills',  'Working to deadlines.'),
  ('Excel & Data Reporting','Technical',   'Spreadsheet modelling and reporting.'),
  ('Financial Modelling',  'Technical',    'Forecasting and valuation models.'),
  ('Bookkeeping',          'Technical',    'Double-entry bookkeeping.'),
  ('Auditing',             'Technical',    'Internal and external audit.'),
  ('Procurement',          'Technical',    'Sourcing and supplier management.'),
  ('Inventory Management', 'Technical',    'Stock control and warehousing.'),
  ('Front Office',         'Soft Skills',  'Reception and guest relations.'),
  ('Food Safety',          'Technical',    'HACCP and hygiene standards.'),
  ('Quality Assurance',    'Technical',    'Testing, standards and continuous improvement.'),
  ('Front of House',       'Soft Skills',  'Restaurant service.'),
  ('Digital Marketing',    'Soft Skills',  'Online promotion and social media.'),
  ('Report Writing',       'Soft Skills',  'Formal report and proposal writing.')
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. Companies
-- ----------------------------------------------------------------------------
INSERT INTO public.companies
  (name, industry_id, location, website, email, phone, description, size, year_founded, verified, source)
SELECT v.name, i.id, v.location, v.website, v.email, v.phone, v.description,
       v.size, v.founded, TRUE, 'manual'
FROM (VALUES
  -- Technology
  ('Safaricom Limited',   'Telecommunications',     'Nairobi', 'https://www.safaricom.co.ke', 'careers@safaricom.co.ke', '+254711000000', 'Leading telecommunications company in East Africa.', 'enterprise', 1997),
  ('Microsoft Kenya',     'Technology & Software',  'Nairobi', 'https://www.microsoft.com/ke', 'careers@microsoft.com', '+254720000000', 'Software, cloud and enterprise services.', 'enterprise', 2010),
  ('Google Kenya',        'Technology & Software',  'Nairobi', 'https://www.google.com/about/careers/applications/jobs/results', 'careers-ke@google.com', '+254720000001', 'Search, advertising and Google Cloud.', 'enterprise', 2013),
  ('Ushahidi',            'Technology & Software',  'Nairobi', 'https://www.ushahidi.com', 'jobs@ushahidi.com', '+254720000002', 'Open-source crisis mapping and information platform.', 'small', 2008),
  ('Access Kenya',        'Technology & Software',  'Nairobi', 'https://www.accesskenya.com', 'hr@accesskenya.com', '+254720000003', 'ISP, networking and web hosting.', 'medium', 1998),
  ('iHub Nairobi',        'Technology & Software',  'Nairobi', 'https://ihub.co.ke', 'careers@ihub.co.ke', '+254720000004', 'Innovation hub and technology community.', 'small', 2010),
  ('Sendy',               'Technology & Software',  'Nairobi', 'https://www.sendyit.com', 'careers@sendyit.com', '+254720000005', 'On-demand logistics and fulfilment technology.', 'small', 2015),
  ('M-KOPA',              'Technology & Software',  'Nairobi', 'https://www.m-kopa.com', 'careers@m-kopa.com', '+254720000006', 'Asset financing and connected services.', 'large', 2011),
  -- Finance
  ('Equity Group Limited','Finance & Banking',      'Nairobi', 'https://www.equitygroup.co.ke', 'careers@equitygroup.co.ke', '+254711000001', 'Largest bank in Kenya by market capitalisation.', 'enterprise', 1984),
  ('KCB Bank',            'Finance & Banking',      'Nairobi', 'https://www.kcbgroup.com', 'careers@kcbgroup.com', '+254711000002', 'Largest bank in East Africa by assets.', 'enterprise', 1896),
  ('I&M Bank',            'Finance & Banking',      'Nairobi', 'https://www.imbank.com', 'careers@imbank.com', '+254711000003', 'Commercial banking and financial services.', 'large', 1974),
  ('Britam Group',        'Finance & Banking',      'Nairobi', 'https://www.britam.com', 'careers@britam.com', '+254711000004', 'Insurance, asset management and retirement planning.', 'large', 1965),
  ('KPMG East Africa',    'Finance & Banking',      'Nairobi', 'https://kpmg.com/ke', 'careers.ke@kpmg.com', '+254711000005', 'Audit, tax and advisory professional services.', 'large', 1997),
  ('Deloitte Kenya',      'Finance & Banking',      'Nairobi', 'https://www.deloitte.com/ke', 'careers.ke@deloitte.com', '+254711000006', 'Audit, consulting and financial advisory.', 'large', 2005),
  ('PwC Kenya',           'Finance & Banking',      'Nairobi', 'https://www.pwc.com/ke', 'careers@pwc.com', '+254711000007', 'Assurance, tax and deals advisory.', 'large', 2009),
  ('Centum Business Company','Finance & Banking',   'Nairobi', 'https://www.centumgroup.com', 'careers@centumgroup.com', '+254711000008', 'Business services and financial technology.', 'medium', 1971),
  -- Manufacturing
  ('Toyota Kenya',        'Manufacturing',          'Nairobi', 'https://www.toyota.co.ke', 'hr@toyota.co.ke', '+254711000009', 'Automotive manufacturing, assembly and distribution.', 'large', 1960),
  ('East African Breweries','Manufacturing',        'Nairobi', 'https://www.eabl.com', 'careers@eabl.com', '+254711000010', 'Beverage manufacturing and distribution.', 'large', 1922),
  ('Eveready East Africa', 'Manufacturing',         'Nairobi', 'https://www.eve.co.ke', 'careers@eve.co.ke', '+254711000011', 'Battery and lighting manufacturer.', 'large', 1950),
  ('Kenya Bakeries',      'Food Production & Technology', 'Nairobi', 'https://www.kenyabakeries.com', 'careers@kenyabakeries.com', '+254711000012', 'Largest baked goods manufacturer in East Africa.', 'large', 1972),
  ('Unga Group',          'Manufacturing',          'Nairobi', 'https://www.ungafoods.co.ke', 'careers@ungafoods.co.ke', '+254711000013', 'Food manufacturing across East Africa.', 'large', 1908),
  -- Energy & utilities
  ('Kenya Power',         'Energy & Utilities',     'Nairobi', 'https://www.kplc.co.ke', 'careers@kplc.co.ke', '+254711000014', 'Electricity transmission, distribution and retail.', 'enterprise', 1997),
  ('Kenya Water',         'Energy & Utilities',     'Nairobi', 'https://www.kwasafowater.com', 'careers@kwasafowater.com', '+254711000015', 'Urban water and sewerage services.', 'medium', 1973),
  ('Kenya Geothermal Development', 'Energy & Utilities', 'Nairobi', 'https://www.gdc.co.ke', 'careers@gdc.co.ke', '+254711000016', 'Geothermal steam and power production.', 'medium', 2011),
  -- Logistics
  ('Gantad Logistics',    'Logistics & Supply Chain','Nairobi', 'https://www.gantad.co.ke', 'careers@gantad.co.ke', '+254711000017', 'Freight forwarding, warehousing and last-mile delivery.', 'medium', 2007),
  ('Kenya Ports Authority','Logistics & Supply Chain','Mombasa', 'https://www.kpa.co.ke', 'careers@kpa.co.ke', '+254711000018', 'Port, harbour and logistics infrastructure.', 'enterprise', 1994),
  ('Twiga Foods',         'Retail & E-commerce',    'Nairobi', 'https://twigafoods.com', 'careers@twigafoods.com', '+254711000019', 'B2B food supply and distribution platform.', 'large', 2014),
  -- Retail & e-commerce
  ('Jumia Kenya',         'Retail & E-commerce',    'Nairobi', 'https://www.jumia.co.ke', 'careers@jumia.co.ke', '+254711000020', 'Pan-African e-commerce marketplace.', 'large', 2012),
  ('Safaricom M-PESA',    'Telecommunications',     'Nairobi', 'https://www.safaricom.co.ke', 'careers@safaricom.co.ke', '+254711000021', 'Mobile money and digital services.', 'enterprise', 2007),
  ('Naivas Supermarket',   'Retail & E-commerce',    'Nairobi', 'https://naivas.co.ke', 'careers@naivas.co.ke', '+254711000022', 'Retail chain operating across Kenya.', 'large', 1985),
  -- Hospitality & tourism
  ('Kempinski Hotels',    'Hospitality & Tourism',  'Nairobi', 'https://www.kempinski.com', 'careers@kempinski.com', '+254711000023', 'International five-star hotel group.', 'enterprise', 1970),
  ('Villa Hotels',        'Hospitality & Tourism',  'Nairobi', 'https://www.villahotels.co.ke', 'careers@villahotels.co.ke', '+254711000024', 'Largest locally owned hotel group in Kenya.', 'large', 1983),
  ('Sarova Hotels',       'Hospitality & Tourism',  'Nairobi', 'https://www.sarovahotels.com', 'careers@sarova.co.ke', '+254711000025', 'East African hotel and hospitality group.', 'large', 1971),
  -- Construction
  ('Kenya Roads Board',   'Construction & Real Estate', 'Nairobi', 'https://www.krb.go.ke', 'careers@krb.go.ke', '+254711000026', 'National road network development and maintenance.', 'enterprise', 2007),
  ('National Housing Corporation', 'Construction & Real Estate', 'Nairobi', 'https://www.nhdc.co.ke', 'careers@nhdc.co.ke', '+254711000027', 'Housing development and urban renewal.', 'enterprise', 1965),
  ('Surbis Construction','Construction & Real Estate', 'Nairobi', 'https://www.surbis.co.ke', 'careers@surbis.co.ke', '+254711000028', 'Building, civil works and project management.', 'large', 1976),
  -- Healthcare
  ('Aga Khan University Hospital','Healthcare',       'Nairobi', 'https://hospitals.aku.edu/nairobi', 'careers@aku.edu', '+254711000029', 'Tertiary teaching and referral hospital.', 'enterprise', 1958),
  ('Kenya Red Cross Society','Healthcare',           'Nairobi', 'https://www.redcross.or.ke', 'careers@redcross.or.ke', '+254711000030', 'Humanitarian health and emergency response.', 'large', 1965),
  -- Agriculture
  ('Kenya Seed Company',  'Agriculture',             'Nairobi', 'https://www.kenyaseed.co.ke', 'careers@kenyaseed.co.ke', '+254711000031', 'Seed production and agricultural inputs.', 'medium', 1982),
  ('KALRO',               'Agriculture',             'Nairobi', 'https://www.kalro.org', 'careers@kalro.org', '+254711000032', 'Kenya Agricultural and Livestock Research Organisation.', 'medium', 1979)
) AS v(name, industry, location, website, email, phone, description, size, founded)
JOIN public.industries i ON i.name = v.industry
ON CONFLICT (name) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. Opportunities
--    Deadlines sit in the 2026/2027 attachment window (Nov 2026 - Jun 2027).
-- ----------------------------------------------------------------------------
INSERT INTO public.opportunities
  (company_id, title, description, position_type, required_course_ids, aligned_course_ids,
   required_skills, preferred_skills, location, duration_months, stipend,
   application_deadline, application_url, application_method, contact_email,
   contact_person, is_active, source, posted_date)
SELECT
  c.id, v.title, v.description, v.position_type,
  ARRAY(SELECT x.id FROM public.courses x WHERE x.code = ANY (v.required_course_codes)),
  ARRAY(SELECT x.id FROM public.courses x WHERE x.code = ANY (v.aligned_course_codes)),
  ARRAY(SELECT s.id FROM public.skills s WHERE s.name = ANY (v.required_skill_names)),
  ARRAY(SELECT s.id FROM public.skills s WHERE s.name = ANY (v.preferred_skill_names)),
  v.location, v.months, v.stipend, v.deadline, v.apply_url, v.apply_method,
  c.email, v.contact, TRUE, 'manual', v.posted
FROM (VALUES
  -- ---------------------------------------------------------------- Engineering
  ('Toyota Kenya', 'Mechanical Engineering Internship',
   'Support the design and manufacture of vehicle components. You will use CAD to model parts, support production trials, and work alongside the manufacturing engineering team on quality and process improvement.',
   'attachment',
   ARRAY['ME-101','ME-301'],
   ARRAY['ME-101','ME-301','EE-101'],
   ARRAY['AutoCAD','SolidWorks'],
   ARRAY['FEA / ANSYS','Technical Writing'],
   'Nairobi', 4, 'KES 20,000 - 25,000 / month', DATE '2027-01-31',
   'https://www.toyota.co.ke/careers', 'portal', 'Mr. Njoroge', DATE '2026-10-01'),

  ('Surbis Construction', 'Civil Engineering Attachment',
   'Site-based attachment covering structural drawing, setting out, quantity surveying and quality control on a live commercial project. You will be supervised by a site engineer and rotate through project management.',
   'attachment',
   ARRAY['CE-101','CE-301'],
   ARRAY['CE-101','CE-301','WE-401'],
   ARRAY['AutoCAD','Structural Design'],
   ARRAY['Surveying','AutoCAD Civil 3D'],
   'Nairobi', 6, 'KES 18,000 - 22,000 / month', DATE '2027-02-15',
   'https://www.surbis.co.ke/careers', 'email', 'Ms. Wanjiku', DATE '2026-10-01'),

  ('Kenya Ports Authority', 'Civil Engineering Attachment - Marine Works',
   'Assist the marine engineering department with quay wall maintenance, dredging surveys and materials testing at the Port of Mombasa.',
   'attachment',
   ARRAY['CE-101','CE-301'],
   ARRAY['CE-101','CE-301'],
   ARRAY['Structural Design','Surveying'],
   ARRAY['AutoCAD','Project Management'],
   'Mombasa', 3, 'KES 20,000 - 26,000 / month', DATE '2026-12-15',
   'https://www.kpa.co.ke/careers', 'portal', 'Mr. Otieno', DATE '2026-10-02'),

  ('Kenya Power', 'Electrical Engineering Attachment - Transmission',
   'Support power transmission line construction and maintenance, including switching operations, safety documentation and preventive maintenance on the national grid.',
   'attachment',
   ARRAY['EE-101','EE-301','EE-401'],
   ARRAY['EE-101','EE-301','EE-401','WE-401'],
   ARRAY['Power Systems','Technical Writing'],
   ARRAY['PLC & Control Systems','Renewable Energy'],
   'Multiple Locations', 3, 'KES 19,000 - 24,000 / month', DATE '2027-01-20',
   'https://www.kplc.co.ke/careers', 'email', 'Ms. Akinyi', DATE '2026-09-28'),

  ('Kenya Water', 'Water Engineering Attachment',
   'Work with the water quality and operations team: sampling, treatment plant process monitoring, and maintenance of distribution network assets.',
   'attachment',
   ARRAY['WE-401','CE-101'],
   ARRAY['WE-401','CE-101','EE-401'],
   ARRAY['Fluid Mechanics','Technical Writing'],
   ARRAY['Renewable Energy','Project Management'],
   'Nairobi', 3, 'KES 17,000 - 21,000 / month', DATE '2027-03-01',
   'https://www.kwasafowater.com', 'email', 'Mr. Kamau', DATE '2026-09-30'),

  ('Kenya Geothermal Development', 'Geothermal Engineering Attachment',
   'Field attachment at geothermal wellfields supporting well testing, drilling operations and plant maintenance alongside the subsurface and production engineering teams.',
   'attachment',
   ARRAY['ME-101','EE-101','ME-301'],
   ARRAY['ME-101','EE-101','ME-301'],
   ARRAY['Fluid Mechanics','Thermal Systems'],
   ARRAY['AutoCAD','Project Management'],
   'Naivasha', 4, 'KES 22,000 - 28,000 / month', DATE '2027-02-28',
   'https://www.gdc.co.ke', 'portal', 'Dr. Wanjiku', DATE '2026-10-03'),

  ('Kenya Roads Board', 'Civil Engineering Attachment - Road Design',
   'In the materials testing and designs office: lab testing of aggregates, review of road drawings, and GIS-based mapping of the road network.',
   'attachment',
   ARRAY['CE-101','CE-301'],
   ARRAY['CE-101','CE-301'],
   ARRAY['AutoCAD Civil 3D','Structural Design'],
   ARRAY['Surveying','Data Analysis'],
   'Nairobi', 6, 'KES 21,000 - 25,000 / month', DATE '2026-11-30',
   'https://www.krb.go.ke', 'email', 'Mr. Kiptoo', DATE '2026-09-25'),

  -- ---------------------------------------------------------------- Technology
  ('Safaricom Limited', 'Software Engineering Internship - Backend',
   'Build and maintain backend services powering M-PESA and other telecom products. You will work in an agile team on Java and Python services backed by PostgreSQL and cloud infrastructure.',
   'attachment',
   ARRAY['SE-101','CS-201'],
   ARRAY['SE-101','CS-201','IT-101','ICT-501'],
   ARRAY['Java','Database Design'],
   ARRAY['Cloud Computing','Git & Version Control','API Development'],
   'Nairobi', 3, 'KES 25,000 - 32,000 / month', DATE '2026-12-20',
   'https://www.safaricom.co.ke/careers', 'portal', 'Ms. Chebet', DATE '2026-10-02'),

  ('Microsoft Kenya', 'Frontend Developer Internship',
   'Develop accessible, responsive web interfaces with React and TypeScript as part of the regional engineering group. You will pair with senior engineers and participate in code review.',
   'attachment',
   ARRAY['SE-101','CS-201'],
   ARRAY['SE-101','CS-201'],
   ARRAY['React','TypeScript'],
   ARRAY['Git & Version Control','API Development'],
   'Nairobi', 3, 'KES 23,000 - 30,000 / month', DATE '2027-01-15',
   'https://jobs.careers.microsoft.com', 'portal', 'Mr. Mwangi', DATE '2026-10-01'),

  ('Google Kenya', 'Software Engineering Internship',
   'Work on Google Cloud tooling and internal developer platform projects. Expect strong fundamentals work, code review and exposure to production systems.',
   'attachment',
   ARRAY['SE-101','CS-201'],
   ARRAY['SE-101','CS-201'],
   ARRAY['Python','C / C++'],
   ARRAY['Machine Learning','Cloud Computing'],
   'Nairobi', 3, 'KES 30,000 - 40,000 / month', DATE '2027-02-01',
   'https://www.google.com/about/careers/applications/jobs/results', 'portal', 'Ms. Kariuki', DATE '2026-10-01'),

  ('Ushahidi', 'Junior Software Engineer',
   'Contribute to an open-source crisis-mapping platform used by NGOs and governments across Africa. Python and JavaScript stack, small team, high ownership.',
   'attachment',
   ARRAY['SE-101','CS-201'],
   ARRAY['SE-101','CS-201','IT-101'],
   ARRAY['Python','JavaScript'],
   ARRAY['React','Git & Version Control','API Development'],
   'Nairobi', 3, 'KES 20,000 - 26,000 / month', DATE '2026-11-20',
   'https://www.ushahidi.com/careers', 'email', 'Ms. Achieng', DATE '2026-09-27'),

  ('Sendy', 'Software Engineering Internship - Logistics Platform',
   'Full-stack engineering on an on-demand logistics platform serving thousands of Kenyan businesses. Python, Django, PostgreSQL and React.',
   'attachment',
   ARRAY['SE-101','CS-201'],
   ARRAY['SE-101','CS-201','SC-501'],
   ARRAY['Python','API Development'],
   ARRAY['React','Database Design','Git & Version Control'],
   'Nairobi', 3, 'KES 22,000 - 28,000 / month', DATE '2026-12-05',
   'https://www.sendyit.com/careers', 'portal', 'Mr. Njuguna', DATE '2026-10-02'),

  ('iHub Nairobi', 'Web Development Attachment',
   'Build open-source web tools and community projects with the Nairobi developer community. Mentorship included; strong portfolio value.',
   'attachment',
   ARRAY['SE-101','IT-101','ICT-501','CS-201'],
   ARRAY['SE-101','IT-101','ICT-501','CS-201'],
   ARRAY['JavaScript','React'],
   ARRAY['Technical Writing','Git & Version Control'],
   'Nairobi', 3, 'Unpaid / stipend negotiated', DATE '2026-11-15',
   'https://ihub.co.ke', 'form', 'Ms. Wambui', DATE '2026-09-20'),

  ('M-KOPA', 'Data Science Internship',
   'Build and evaluate models supporting credit risk and customer analytics for a fast-growing fintech. Strong pathway for analytics-focused engineers.',
   'attachment',
   ARRAY['CS-201','MS-401','SE-101'],
   ARRAY['CS-201','MS-401'],
   ARRAY['Data Analysis','Python'],
   ARRAY['Machine Learning','SQL' ],
   'Nairobi', 4, 'KES 28,000 - 35,000 / month', DATE '2027-01-10',
   'https://www.m-kopa.com/careers', 'portal', 'Dr. Otieno', DATE '2026-10-03'),

  -- ------------------------------------------------------------------- IT / IS
  ('Access Kenya', 'IT Support & Infrastructure Internship',
   'Provide technical support, maintain Linux and Windows server environments, and manage the network infrastructure for a busy ISP.',
   'attachment',
   ARRAY['IT-101','ICT-501'],
   ARRAY['IT-101','ICT-501'],
   ARRAY['Linux & Networking','Customer Service'],
   ARRAY['Cybersecurity','Technical Writing'],
   'Nairobi', 3, 'KES 18,000 - 23,000 / month', DATE '2026-12-10',
   'https://www.accesskenya.com/careers', 'email', 'Mr. Kimani', DATE '2026-09-26'),

  ('Twiga Foods', 'IT & ERP Systems Attachment',
   'Support ERP and operations tooling for a high-volume food distribution platform, including reporting, integrations and user support.',
   'attachment',
   ARRAY['IT-101','ICT-501'],
   ARRAY['IT-101','ICT-501','SC-101'],
   ARRAY['Database Design','Customer Service'],
   ARRAY['Python','Excel & Data Reporting'],
   'Nairobi', 3, 'KES 20,000 - 26,000 / month', DATE '2027-01-08',
   'https://twigafoods.com/careers', 'email', 'Ms. Atieno', DATE '2026-10-01'),

  -- ---------------------------------------------------------------- Finance
  ('Equity Group Limited', 'Finance & Accounting Internship',
   'Support financial analysis, reporting and regulatory submissions within the finance team of a large commercial bank. Strong exposure to IFRS and audit processes.',
   'attachment',
   ARRAY['AF-101','AF-201','FI-301','AF-501'],
   ARRAY['AF-101','AF-201','FI-301','AF-501','AC-201'],
   ARRAY['Excel & Data Reporting','Bookkeeping'],
   ARRAY['Auditing','Financial Modelling'],
   'Nairobi', 4, 'KES 22,000 - 28,000 / month', DATE '2027-02-20',
   'https://www.equitygroup.co.ke/careers', 'portal', 'Ms. Mwaura', DATE '2026-10-02'),

  ('KCB Bank', 'Banking Operations & Risk Internship',
   'Learn banking operations, customer service and regulatory compliance at one of East Africa largest banks. Includes rotation through credit risk and operations.',
   'attachment',
   ARRAY['AF-101','AF-201','FI-301','BA-101'],
   ARRAY['AF-101','AF-201','FI-301','BA-101','AF-501'],
   ARRAY['Communication','Customer Service'],
   ARRAY['Excel & Data Reporting','Auditing'],
   'Nairobi', 3, 'KES 20,000 - 25,000 / month', DATE '2026-12-15',
   'https://www.kcbgroup.com/careers', 'email', 'Mr. Kipchoge', DATE '2026-09-29'),

  ('KPMG East Africa', 'Audit & Assurance Internship',
   'Support audit engagements for banking, manufacturing and technology clients. Includes testing, working paper preparation and client communication.',
   'attachment',
   ARRAY['AF-101','AF-201','AF-501','FI-301'],
   ARRAY['AF-101','AF-201','AF-501','FI-301'],
   ARRAY['Auditing','Excel & Data Reporting'],
   ARRAY['Communication','Bookkeeping'],
   'Nairobi', 4, 'KES 25,000 - 32,000 / month', DATE '2027-01-31',
   'https://kpmg.com/ke/careers', 'portal', 'Ms. Waweru', DATE '2026-10-03'),

  ('Deloitte Kenya', 'Technology Risk & Advisory Internship',
   'Assist technology audit and advisory engagements, working on IT general controls, data analytics and client reporting.',
   'attachment',
   ARRAY['AF-201','AF-501','SE-101','CS-201'],
   ARRAY['AF-201','AF-501','SE-101','CS-201','ICT-501'],
   ARRAY['Excel & Data Reporting','Auditing'],
   ARRAY['Data Analysis','Cybersecurity','Python'],
   'Nairobi', 4, 'KES 26,000 - 33,000 / month', DATE '2027-02-10',
   'https://www.deloitte.com/ke/careers', 'portal', 'Mr. Kilonzo', DATE '2026-10-01'),

  ('Britam Group', 'Insurance & Actuarial Internship',
   'Support underwriting and actuarial teams in an insurance group, contributing to portfolio analysis and policy documentation.',
   'attachment',
   ARRAY['AC-201','AF-201','MS-401'],
   ARRAY['AC-201','AF-201','MS-401'],
   ARRAY['Data Analysis','Communication'],
   ARRAY['Financial Modelling','Excel & Data Reporting'],
   'Nairobi', 3, 'KES 21,000 - 27,000 / month', DATE '2027-03-15',
   'https://www.britam.com/careers', 'portal', 'Ms. Ndungu', DATE '2026-09-25'),

  ('Centum Business Company', 'Business Analyst Attachment',
   'Analyse business performance data, support process improvement, and produce dashboards for operations leaders.',
   'attachment',
   ARRAY['BA-101','BA-501','MS-401','AF-201'],
   ARRAY['BA-101','BA-501','MS-401','AF-201'],
   ARRAY['Excel & Data Reporting','Communication'],
   ARRAY['Data Analysis','SQL' ],
   'Nairobi', 3, 'KES 19,000 - 24,000 / month', DATE '2027-01-25',
   'https://www.centumgroup.com/careers', 'email', 'Ms. Mwaigi', DATE '2026-10-02'),

  -- ---------------------------------------------------------------- Logistics
  ('Gantad Logistics', 'Supply Chain & Logistics Attachment',
   'Optimise logistics operations: warehouse layout, route planning, fleet scheduling and stock control across a national distribution network.',
   'attachment',
   ARRAY['SC-101','SC-301','SC-501'],
   ARRAY['SC-101','SC-301','SC-501','AF-101'],
   ARRAY['Inventory Management','Project Management'],
   ARRAY['Excel & Data Reporting','Procurement','Customer Service'],
   'Nairobi', 3, 'KES 19,000 - 24,000 / month', DATE '2026-12-01',
   'https://www.gantad.co.ke/careers', 'email', 'Ms. Wanjiru', DATE '2026-09-28'),

  ('Kenya Ports Authority', 'Port Operations & Logistics Attachment',
   'Support port operations, cargo documentation and throughput planning at Mombasa port. Exposure to customs, clearing and forwarding processes.',
   'attachment',
   ARRAY['SC-101','SC-301','SC-501'],
   ARRAY['SC-101','SC-301','SC-501'],
   ARRAY['Inventory Management','Communication'],
   ARRAY['Procurement','Excel & Data Reporting'],
   'Mombasa', 3, 'KES 20,000 - 25,000 / month', DATE '2027-02-25',
   'https://www.kpa.co.ke/careers', 'portal', 'Mr. Bakari', DATE '2026-10-01'),

  ('Jumia Kenya', 'Supply Chain & Marketplace Operations Attachment',
   'Work with marketplace operations on vendor onboarding, inventory health and delivery performance metrics.',
   'attachment',
   ARRAY['SC-101','SC-301','BA-501'],
   ARRAY['SC-101','SC-301','BA-501','SC-501'],
   ARRAY['Data Analysis','Communication'],
   ARRAY['Inventory Management','Digital Marketing'],
   'Nairobi', 3, 'KES 18,000 - 23,000 / month', DATE '2027-01-20',
   'https://www.jumia.co.ke/careers', 'portal', 'Ms. Achieng', DATE '2026-09-30'),

  -- ---------------------------------------------------------------- Hospitality
  ('Villa Hotels', 'Hotel Operations & Food Service Attachment',
   'Rotate through front office, food and beverage, and guest relations functions in a busy Nairobi hotel group.',
   'attachment',
   ARRAY['HM-101','HM-201','HM-501'],
   ARRAY['HM-101','HM-201','HM-501','BA-501'],
   ARRAY['Front Office','Communication'],
   ARRAY['Front of House','Food Safety','Customer Service'],
   'Nairobi', 4, 'KES 15,000 - 20,000 / month', DATE '2027-01-30',
   'https://www.villahotels.co.ke/careers', 'form', 'Ms. Njoki', DATE '2026-09-27'),

  ('Sarova Hotels', 'Hospitality Management Attachment',
   'Hospitality operations attachment covering guest experience, event coordination and quality of service delivery.',
   'attachment',
   ARRAY['HM-101','HM-201','HM-501'],
   ARRAY['HM-101','HM-201','HM-501'],
   ARRAY['Customer Service','Communication'],
   ARRAY['Front of House','Food Safety'],
   'Nairobi', 4, 'KES 16,000 - 21,000 / month', DATE '2027-02-05',
   'https://www.sarovahotels.com', 'email', 'Mr. Otieno', DATE '2026-10-02'),

  ('Naivas Supermarket', 'Retail Operations Attachment',
   'Work on store operations, merchandising, stock control and customer service in a fast-moving retail environment.',
   'attachment',
   ARRAY['BA-101','SC-101','BA-501'],
   ARRAY['BA-101','SC-101','BA-501','SC-501'],
   ARRAY['Customer Service','Inventory Management'],
   ARRAY['Communication','Digital Marketing'],
   'Nairobi', 3, 'KES 15,000 - 19,000 / month', DATE '2026-12-12',
   'https://naivas.co.ke', 'email', 'Ms. Mulwa', DATE '2026-09-29'),

  -- ---------------------------------------------------------------- Manufacturing
  ('East African Breweries', 'Mechanical Engineering - Production Support',
   'Production line optimisation and equipment maintenance within a beverage manufacturing plant, including planned maintenance scheduling and downtime analysis.',
   'attachment',
   ARRAY['ME-101','ME-301'],
   ARRAY['ME-101','ME-301','FP-101'],
   ARRAY['Fluid Mechanics','Problem Solving'],
   ARRAY['PLC & Control Systems','Project Management'],
   'Nairobi', 4, 'KES 19,000 - 24,000 / month', DATE '2027-01-31',
   'https://www.eabl.com/careers', 'form', 'Mr. Odhiambo', DATE '2026-09-30'),

  ('Eveready East Africa', 'Electrical Engineering - Maintenance Attachment',
   'Maintenance engineering on production lines, including PLC troubleshooting, preventive maintenance and root cause analysis.',
   'attachment',
   ARRAY['EE-101','EE-301','EE-401'],
   ARRAY['EE-101','EE-301','EE-401','ME-101'],
   ARRAY['PLC & Control Systems','Problem Solving'],
   ARRAY['Embedded Systems','Technical Writing'],
   'Nairobi', 4, 'KES 18,000 - 23,000 / month', DATE '2027-02-14',
   'https://www.eve.co.ke', 'email', 'Mr. Mutiso', DATE '2026-10-01'),

  ('Kenya Bakeries', 'Food Production & Technology Attachment',
   'Support food production operations at scale: process control, quality assurance, HACCP compliance and packaging line performance.',
   'attachment',
   ARRAY['FP-101','FS-401'],
   ARRAY['FP-101','FS-401','ME-101'],
   ARRAY['Food Safety','Problem Solving'],
   ARRAY['Project Management','Quality Assurance'],
   'Nairobi', 3, 'KES 17,000 - 21,000 / month', DATE '2026-12-18',
   'https://www.kenyabakeries.com/careers', 'portal', 'Ms. Kariuki', DATE '2026-09-28'),

  ('Unga Group', 'Food Science & Technology Attachment',
   'R&D and quality attachment in a food manufacturing group, working on product development trials and laboratory analysis.',
   'attachment',
   ARRAY['FS-401','FP-101'],
   ARRAY['FS-401','FP-101','AB-401'],
   ARRAY['Food Safety','Data Analysis'],
   ARRAY['Technical Writing','Project Management'],
   'Nairobi', 3, 'KES 18,000 - 22,000 / month', DATE '2027-03-01',
   'https://www.ungafoods.co.ke', 'email', 'Dr. Mwange', DATE '2026-10-02'),

  -- ---------------------------------------------------------------- Healthcare
  ('Aga Khan University Hospital', 'Clinical Engineering & Hospital Systems Attachment',
   'Support biomedical equipment maintenance, clinical systems and hospital information workflows in a teaching hospital.',
   'attachment',
   ARRAY['EE-101','EE-301','IT-101'],
   ARRAY['EE-101','EE-301','IT-101','ICT-501'],
   ARRAY['Technical Writing','Communication'],
   ARRAY['Data Analysis','Cybersecurity'],
   'Nairobi', 3, 'KES 20,000 - 26,000 / month', DATE '2027-01-22',
   'https://hospitals.aku.edu/nairobi', 'form', 'Ms. Said', DATE '2026-09-26'),

  ('Kenya Red Cross Society', 'Community Health Attachment',
   'Support community health programmes: field data collection, reporting, and coordination with county health management teams.',
   'attachment',
   ARRAY['BA-501','AB-401'],
   ARRAY['BA-501','AB-401','MS-401'],
   ARRAY['Communication','Report Writing'],
   ARRAY['Data Analysis','Problem Solving'],
   'Multiple Locations', 3, 'KES 16,000 - 20,000 / month', DATE '2026-11-25',
   'https://www.redcross.or.ke', 'email', 'Mr. Karani', DATE '2026-09-22'),

  -- ---------------------------------------------------------------- Agriculture
  ('Kenya Seed Company', 'Agronomy & Supply Chain Attachment',
   'Support seed production operations, quality testing and distribution planning across East Africa.',
   'attachment',
   ARRAY['AB-401','FS-401','SC-101'],
   ARRAY['AB-401','FS-401','SC-101','MS-401'],
   ARRAY['Problem Solving','Communication'],
   ARRAY['Data Analysis','Inventory Management'],
   'Nairobi', 3, 'KES 16,000 - 20,000 / month', DATE '2027-02-18',
   'https://www.kenyaseed.co.ke', 'email', 'Ms. Njeri', DATE '2026-10-03'),

  ('KALRO', 'Research & Data Analyst Attachment',
   'Data collection, analysis and reporting for agricultural research programmes, including preparation of research findings for policy audiences.',
   'attachment',
   ARRAY['MS-401','AB-401','AF-201'],
   ARRAY['MS-401','AB-401','AF-201','CS-201'],
   ARRAY['Data Analysis','Excel & Data Reporting'],
   ARRAY['Python','Report Writing'],
   'Nairobi', 4, 'KES 18,000 - 22,000 / month', DATE '2027-03-20',
   'https://www.kalro.org', 'portal', 'Dr. Kimani', DATE '2026-09-24')
) AS v(company, title, description, position_type, required_course_codes, aligned_course_codes,
       required_skill_names, preferred_skill_names, location, months, stipend, deadline,
       apply_url, apply_method, contact, posted)
JOIN public.companies c ON c.name = v.company
WHERE NOT EXISTS (SELECT 1 FROM public.opportunities o WHERE o.company_id = c.id AND o.title = v.title);

-- ----------------------------------------------------------------------------
-- 7. opportunity_industries
--    The original seed left this join table empty, so every opportunity card
--    rendered with a blank industry even though the UI asked for one.
-- ----------------------------------------------------------------------------
INSERT INTO public.opportunity_industries (opportunity_id, industry_id)
SELECT DISTINCT o.id, i.id
FROM public.opportunities o
JOIN public.companies c ON c.id = o.company_id
JOIN public.industries i ON i.id = c.industry_id
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. Course -> industry alignment
--    Drives the "why does this industry suit your course?" reasoning.
-- ----------------------------------------------------------------------------
INSERT INTO public.course_industry_alignments (course_id, industry_id, alignment_score, description)
SELECT c.id, i.id, v.score, v.reason
FROM (VALUES
  ('ME-101','Manufacturing',95,'Core mechanical manufacturing and design discipline.'),
  ('ME-101','Engineering',100,'Core engineering discipline.'),
  ('ME-101','Energy & Utilities',85,'Plant machinery and power generation equipment.'),
  ('ME-301','Manufacturing',96,'Design and thermal systems for industrial plant.'),
  ('ME-301','Engineering',100,'Core engineering discipline.'),
  ('EE-101','Energy & Utilities',97,'Power generation, transmission and distribution.'),
  ('EE-101','Engineering',100,'Core engineering discipline.'),
  ('EE-101','Telecommunications',80,'Telecom networks and embedded systems.'),
  ('EE-301','Energy & Utilities',97,'Power systems engineering.'),
  ('EE-301','Engineering',100,'Core engineering discipline.'),
  ('EE-401','Agriculture',85,'Irrigation, pumping and farm power systems.'),
  ('EE-401','Energy & Utilities',95,'Rural electrification and grid systems.'),
  ('CE-101','Construction & Real Estate',98,'Structural design and contracting.'),
  ('CE-101','Engineering',100,'Core engineering discipline.'),
  ('CE-101','Energy & Utilities',78,'Transmission line and utility civil works.'),
  ('CE-301','Construction & Real Estate',98,'Structural, water and transport infrastructure.'),
  ('CE-301','Engineering',100,'Core engineering discipline.'),
  ('WE-401','Energy & Utilities',92,'Water treatment and distribution infrastructure.'),
  ('WE-401','Engineering',95,'Hydraulics and water resources engineering.'),
  ('SE-101','Technology & Software',100,'Direct software engineering alignment.'),
  ('SE-101','Finance & Banking',70,'Fintech and core banking systems.'),
  ('SE-101','Telecommunications',82,'Telecom software platforms.'),
  ('CS-201','Technology & Software',98,'Computing theory and systems.'),
  ('CS-201','Finance & Banking',68,'Financial computing and fintech.'),
  ('CS-201','Healthcare',60,'Health informatics.'),
  ('IT-101','Technology & Software',95,'Infrastructure, systems and support.'),
  ('IT-101','Telecommunications',90,'Network infrastructure.'),
  ('IT-101','Finance & Banking',70,'Banking systems and core banking.'),
  ('ICT-501','Technology & Software',93,'Systems and support.'),
  ('ICT-501','Telecommunications',85,'Telecom and network operations.'),
  ('AF-101','Finance & Banking',98,'Accounting and corporate finance.'),
  ('AF-201','Finance & Banking',99,'Accounting, audit and finance.'),
  ('AF-501','Finance & Banking',99,'Accounting and financial services.'),
  ('FI-301','Finance & Banking',100,'Corporate and public finance.'),
  ('AC-201','Finance & Banking',100,'Actuarial and risk analysis.'),
  ('SC-101','Logistics & Supply Chain',100,'Procurement and distribution.'),
  ('SC-301','Logistics & Supply Chain',100,'Integrated supply chain management.'),
  ('SC-501','Logistics & Supply Chain',100,'Logistics and distribution.'),
  ('SC-101','Retail & E-commerce',75,'Distribution and fulfilment.'),
  ('SC-501','Retail & E-commerce',72,'E-commerce fulfilment.'),
  ('HM-101','Hospitality & Tourism',100,'Hotel and food service operations.'),
  ('HM-201','Hospitality & Tourism',100,'Food, beverage and accommodation.'),
  ('HM-501','Hospitality & Tourism',100,'Hotel and restaurant management.'),
  ('HM-101','Logistics & Supply Chain',70,'Food service supply chain.'),
  ('BA-101','Finance & Banking',70,'Business and management fundamentals.'),
  ('BA-101','Retail & E-commerce',75,'Retail and merchandising.'),
  ('BA-501','Retail & E-commerce',78,'Retail operations and management.'),
  ('BA-501','Finance & Banking',72,'Business analysis and reporting.'),
  ('MS-401','Finance & Banking',80,'Quantitative finance and analytics.'),
  ('MS-401','Technology & Software',75,'Data science and analytics.'),
  ('MS-401','Agriculture',70,'Agricultural data analysis.'),
  ('FP-101','Food Production & Technology',100,'Food science and processing.'),
  ('FS-401','Food Production & Technology',100,'Food processing and safety.'),
  ('FS-401','Agriculture',85,'Post-harvest processing.'),
  ('AB-401','Agriculture',100,'Agricultural enterprise and economics.'),
  ('AB-401','Logistics & Supply Chain',75,'Agri supply chains.')
) AS v(code, industry, score, reason)
JOIN public.courses c ON c.code = v.code
JOIN public.industries i ON i.name = v.industry
WHERE v.score > 0
ON CONFLICT (course_id, industry_id) DO UPDATE SET alignment_score = EXCLUDED.alignment_score;

-- ----------------------------------------------------------------------------
-- 9. Verification
-- ----------------------------------------------------------------------------
SELECT 'universities' AS entity, count(*) FROM public.universities
UNION ALL SELECT 'industries', count(*) FROM public.industries
UNION ALL SELECT 'courses', count(*) FROM public.courses
UNION ALL SELECT 'skills', count(*) FROM public.skills
UNION ALL SELECT 'companies', count(*) FROM public.companies
UNION ALL SELECT 'opportunities', count(*) FROM public.opportunities
UNION ALL SELECT 'opportunity_industries', count(*) FROM public.opportunity_industries
UNION ALL SELECT 'course_industry_alignments', count(*) FROM public.course_industry_alignments
UNION ALL SELECT 'open opportunities (deadline in future)', count(*)
  FROM public.opportunities WHERE is_active AND application_deadline >= CURRENT_DATE;