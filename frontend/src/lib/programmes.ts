export interface Programme {
  slug: string;
  code: string;
  name: string;
  shortDescription: string;
  overview: string;
  levels: string[];
  accent: string;
  image: string;
  gallery: Array<{ src: string; alt: string }>;
  skills: string[];
  careers: string[];
  furtherStudy: string[];
  projects: string[];
}

const computing = '/images/programmes/computing-lab.png';
const computerSystems = '/images/programmes/computer-systems-students-v2.png';
const computerSystemsPractical = '/images/programmes/computer-systems-practical-v2.png';
const software = '/images/programmes/software-development-students-v2.png';
const networking = '/images/programmes/network-electronics-lab.png';
const construction = '/images/programmes/construction-electrical-workshop.png';
const buildingConstruction = '/images/programmes/building-construction-students-v2.png';
const buildingConstructionSettingOut = '/images/programmes/building-construction-setting-out-v2.png';
const accounting = '/images/programmes/accounting-students-v2.png';

export const programmes: Programme[] = [
  {
    slug: 'computer-systems-architecture', code: 'CSA', name: 'Computer Systems & Architecture',
    shortDescription: 'Understand, assemble, configure, protect, and maintain the computer systems on which modern organisations depend.',
    overview: 'Computer Systems & Architecture develops confident technicians who understand how hardware, operating systems, storage, peripherals, and basic networks work together. Learners move from diagnosis to deployment through structured laboratory practice.',
    levels: ['L3 CSA', 'L4 CSA', 'L5 CSA'], accent: 'from-cyan-500 to-blue-700', image: computerSystems,
    gallery: [{ src: computerSystems, alt: 'CSA students assembling a desktop computer with guidance from their technical instructor' }, { src: computerSystemsPractical, alt: 'CSA students diagnosing computer hardware in a supervised practical lesson' }, { src: computing, alt: 'Computer systems laboratory prepared for practical learning' }],
    skills: ['Computer assembly and component selection', 'Operating-system installation and configuration', 'Preventive maintenance and troubleshooting', 'Data protection, backup, and user support', 'Basic network and peripheral deployment'],
    careers: ['Computer maintenance technician', 'IT support technician', 'Systems support assistant', 'Help-desk technician', 'Junior infrastructure technician'],
    furtherStudy: ['Computer engineering', 'Information technology', 'Cybersecurity', 'Network administration'],
    projects: ['Build and document a working computer', 'Diagnose hardware and operating-system faults', 'Deploy a small office workstation environment'],
  },
  {
    slug: 'software-development', code: 'SWD', name: 'Software Development',
    shortDescription: 'Learn to analyse real problems and create reliable web, mobile, and data-driven software solutions.',
    overview: 'Software Development combines computational thinking, programming, interface design, databases, testing, and collaborative project work. Students learn a disciplined process: understand a user need, design a solution, build it, test it, and explain it.',
    levels: ['L3 SWD', 'L4 SWD', 'L5 SWD'], accent: 'from-violet-500 to-indigo-700', image: software,
    gallery: [{ src: software, alt: 'G.S BTR Rwamiko TSS students developing software together' }, { src: computing, alt: 'Learners working with computer systems in the laboratory' }, { src: networking, alt: 'Students connecting applications to laboratory infrastructure' }],
    skills: ['Programming fundamentals and algorithms', 'Responsive web and application development', 'Database design and data management', 'Software testing and debugging', 'Requirements analysis and team delivery'],
    careers: ['Junior software developer', 'Web developer', 'Application support assistant', 'Quality-assurance tester', 'Database support assistant'],
    furtherStudy: ['Software engineering', 'Computer science', 'Information systems', 'Data science'],
    projects: ['Design a school or community information system', 'Build a responsive web application', 'Create and test a database-backed solution'],
  },
  {
    slug: 'network-internet-technology', code: 'NIT', name: 'Network & Internet Technology',
    shortDescription: 'Build, configure, secure, and support the networks that connect people, devices, and services.',
    overview: 'Network & Internet Technology prepares learners to install physical network infrastructure, configure connected devices, provide internet services, identify faults, and apply foundational security practices in homes, schools, and organisations.',
    levels: ['L3 NIT', 'L4 NIT', 'L5 NIT'], accent: 'from-sky-500 to-cyan-700', image: networking,
    gallery: [{ src: networking, alt: 'Students configuring a network rack and testing circuits' }, { src: computing, alt: 'Learners configuring computers for a network' }, { src: '/students-workshop.png', alt: 'Technical students working together in a laboratory' }],
    skills: ['Structured cabling and network installation', 'Router, switch, and wireless configuration', 'IP addressing and network services', 'Fault isolation and performance testing', 'Foundational network security'],
    careers: ['Network support technician', 'Internet service support assistant', 'Structured-cabling technician', 'Junior network administrator', 'ICT field technician'],
    furtherStudy: ['Network engineering', 'Cybersecurity', 'Cloud computing', 'Telecommunications'],
    projects: ['Cable and test a local-area network', 'Configure secure wired and wireless access', 'Document and troubleshoot a small organisation network'],
  },
  {
    slug: 'electrical-technology', code: 'ELT', name: 'Electrical Technology',
    shortDescription: 'Develop the discipline and practical competence to install, test, and maintain safe electrical systems.',
    overview: 'Electrical Technology joins scientific understanding with safe workshop practice. Learners interpret drawings, select materials, install circuits, use measuring instruments, locate faults, and work according to professional safety procedures.',
    levels: ['L3 ELT', 'L4 ELT', 'L5 ELT'], accent: 'from-amber-400 to-orange-700', image: construction,
    gallery: [{ src: construction, alt: 'Students completing safe electrical and construction practice' }, { src: networking, alt: 'Learners using electronic test instruments' }, { src: '/students-workshop.png', alt: 'Students learning safely in a technical workshop' }],
    skills: ['Domestic and commercial wiring', 'Electrical drawings and material estimation', 'Testing, measurement, and fault finding', 'Motor and control fundamentals', 'Occupational safety and tool care'],
    careers: ['Electrical installation technician', 'Maintenance electrician assistant', 'Solar installation assistant', 'Electrical maintenance technician', 'Industrial wiring assistant'],
    furtherStudy: ['Electrical engineering', 'Renewable energy technology', 'Industrial electricity', 'Electromechanics'],
    projects: ['Install and test a domestic circuit', 'Build a safe motor-control exercise', 'Plan materials for a small electrical installation'],
  },
  {
    slug: 'electronics-telecommunication', code: 'ETE', name: 'Electronics & Telecommunication',
    shortDescription: 'Explore electronic circuits and the communication systems behind modern connected life.',
    overview: 'Electronics & Telecommunication teaches learners to understand components, assemble and test circuits, use diagnostic instruments, maintain devices, and recognise how signals carry voice and data through communication systems.',
    levels: ['L3 ETE', 'L4 ETE', 'L5 ETE'], accent: 'from-emerald-500 to-teal-800', image: networking,
    gallery: [{ src: networking, alt: 'Students testing electronic circuits in a laboratory' }, { src: computing, alt: 'Learners integrating digital and computer equipment' }, { src: '/students-workshop.png', alt: 'Students completing collaborative workshop practice' }],
    skills: ['Electronic component identification and testing', 'Circuit assembly, soldering, and repair', 'Signal measurement and fault diagnosis', 'Communication-system fundamentals', 'Technical documentation and safe practice'],
    careers: ['Electronics repair technician', 'Telecommunication field assistant', 'Device maintenance technician', 'Broadcast equipment assistant', 'Junior instrumentation technician'],
    furtherStudy: ['Electronics engineering', 'Telecommunication engineering', 'Embedded systems', 'Industrial automation'],
    projects: ['Assemble and test an electronic circuit', 'Diagnose a faulty consumer device', 'Demonstrate a basic communication link'],
  },
  {
    slug: 'building-construction', code: 'BDC', name: 'Building Construction',
    shortDescription: 'Learn to transform drawings into safe, accurate structures through setting out, masonry, formwork, concrete, and finishing practice.',
    overview: 'Building Construction takes learners through the complete journey from interpreting a drawing and measuring a site to setting out, building, checking, and finishing a structure. In practical teams, students learn to use surveying and hand tools, prepare materials, construct masonry, assemble formwork, and verify quality while following professional safety procedures and using resources responsibly.',
    levels: ['L3 BDC', 'L4 BDC', 'L5 BDC'], accent: 'from-orange-500 to-red-800', image: buildingConstruction,
    gallery: [{ src: buildingConstruction, alt: 'BDC students interpreting a drawing and constructing a masonry training wall safely' }, { src: buildingConstructionSettingOut, alt: 'BDC students practising levelling, setting out, and reinforced-concrete formwork' }, { src: construction, alt: 'Building Construction learners completing supervised workshop practice' }],
    skills: ['Construction drawing interpretation and site planning', 'Setting out, measurement, surveying, and levelling', 'Masonry, formwork, reinforcement, and concrete work', 'Plastering, finishes, quantities, and material control', 'Site safety, teamwork, workmanship, and quality inspection'],
    careers: ['Masonry technician', 'Construction-site assistant', 'Building maintenance technician', 'Junior quantity-estimation assistant', 'Self-employed construction craftsperson'],
    furtherStudy: ['Civil engineering', 'Construction technology', 'Quantity surveying', 'Architecture'],
    projects: ['Interpret a drawing, set out, and build a demonstration wall', 'Assemble and check formwork for a reinforced-concrete element', 'Prepare a materials estimate and complete a measured finishing exercise'],
  },
  {
    slug: 'professional-accounting', code: 'ACC', name: 'Professional Accounting',
    shortDescription: 'Build trusted financial records, interpret business information, and support responsible decision-making.',
    overview: 'Professional Accounting develops accuracy, integrity, organisation, and business understanding. Learners practise recording transactions, preparing accounts, budgeting, using digital tools, and communicating financial information clearly.',
    levels: ['S4 ACC', 'S5 ACC', 'S6 ACC'], accent: 'from-fuchsia-500 to-purple-800', image: accounting,
    gallery: [{ src: accounting, alt: 'G.S BTR Rwamiko TSS students completing a practical accounting exercise' }, { src: '/students-classroom.png', alt: 'Learners discussing academic work in class' }, { src: computing, alt: 'Students using computers for digital business tasks' }],
    skills: ['Bookkeeping and financial records', 'Budgeting and cost awareness', 'Spreadsheet and accounting-software use', 'Business mathematics and communication', 'Ethics, accuracy, and internal control'],
    careers: ['Accounts assistant', 'Bookkeeper', 'Payroll assistant', 'Cashier or finance clerk', 'Junior audit or tax assistant'],
    furtherStudy: ['Accounting', 'Finance', 'Business administration', 'Economics and entrepreneurship'],
    projects: ['Maintain books for a simulated enterprise', 'Prepare a budget and basic financial statements', 'Use spreadsheets to analyse business performance'],
  },
];

export function findProgramme(slug: string) {
  return programmes.find((programme) => programme.slug === slug);
}
