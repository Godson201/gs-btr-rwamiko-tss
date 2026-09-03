'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'rw';

const translations = {
  en: {
    'language.name': 'English', 'language.label': 'Language', 'language.settings': 'Language settings',
    'language.description': 'Choose the language used on this device.', 'language.saved': 'Your preference is saved automatically.',
    'nav.dashboard': 'Dashboard', 'nav.students': 'Students', 'nav.teachers': 'Teachers', 'nav.classes': 'Classes',
    'nav.modules': 'Modules', 'nav.parentApprovals': 'Parent Approvals', 'nav.admissions': 'Admissions',
    'nav.announcements': 'Announcements', 'nav.messages': 'Messages', 'nav.settings': 'Settings',
    'nav.schoolPosts': 'School Posts', 'nav.apply': 'Apply for Admission', 'account': 'Account', 'profile': 'Profile', 'logout': 'Log out',
    'portal.admin': 'Admin Portal', 'portal.teacher': 'Teacher Portal', 'portal.parent': 'Parent Portal',
    'message.admin': 'Leadership turns a shared vision into opportunities for every learner.',
    'message.teacher': 'A great teacher does more than share knowledge—they awaken possibility.',
    'message.parent': 'When school and family walk together, every learner moves forward.',
  },
  rw: {
    'language.name': 'Kinyarwanda', 'language.label': 'Ururimi', 'language.settings': 'Igenamiterere ry’ururimi',
    'language.description': 'Hitamo ururimi ruzakoreshwa kuri iki gikoresho.', 'language.saved': 'Ururimi wahisemo ruhita rubikwa.',
    'nav.dashboard': 'Ahabanza', 'nav.students': 'Abanyeshuri', 'nav.teachers': 'Abarimu', 'nav.classes': 'Amashuri',
    'nav.modules': 'Amasomo', 'nav.parentApprovals': 'Kwemeza ababyeyi', 'nav.admissions': 'Kwakira abanyeshuri',
    'nav.announcements': 'Amatangazo', 'nav.messages': 'Ubutumwa', 'nav.settings': 'Igenamiterere',
    'nav.schoolPosts': 'Inkuru z’ishuri', 'nav.apply': 'Saba kwiga hano', 'account': 'Konti', 'profile': 'Umwirondoro', 'logout': 'Sohoka',
    'portal.admin': 'Urubuga rw’ubuyobozi', 'portal.teacher': 'Urubuga rw’umwarimu', 'portal.parent': 'Urubuga rw’umubyeyi',
    'message.admin': 'Ubuyobozi bwiza buhindura icyerekezo rusange amahirwe ya buri munyeshuri.',
    'message.teacher': 'Umwarimu mwiza ntiyigisha gusa; akangura ubushobozi bw’umunyeshuri.',
    'message.parent': 'Iyo ishuri n’umuryango bifatanyije, buri mwana atera imbere.',
  },
} as const;

const phraseRw: Record<string, string> = {
  'Home': 'Ahabanza', 'Our story': 'Inkuru yacu', 'Programmes': 'Amashami', 'Student life': 'Ubuzima bw’abanyeshuri',
  'Apply now': 'Saba kwiga hano', 'Portal login': 'Injira muri sisitemu', 'Access school portal': 'Injira ku rubuga rw’ishuri',
  'Apply for admission': 'Saba kwiga hano', 'Discover our school': 'Menya ishuri ryacu', 'Learning today.': 'Kwiga uyu munsi.',
  'Building tomorrow.': 'Kubaka ejo hazaza.', 'Excellent education, practical skills': 'Uburezi bwiza n’ubumenyi ngiro',
  'Our purpose': 'Intego yacu', 'A school where potential becomes purpose.': 'Ishuri rihindura ubushobozi intego ifatika.',
  'Technical pathways': 'Amashami ya tekiniki', 'Skills built for the real world.': 'Ubumenyi bugenewe isi nyakuri.',
  'Learn by doing': 'Kwiga ukora', 'Excellent education': 'Uburezi bwiza', 'Practice-led learning': 'Kwiga ushyira mu bikorwa',
  'Digital confidence': 'Ubushobozi mu ikoranabuhanga', 'Safe community': 'Umuryango utekanye', 'Career pathways': 'Amashami y’imyuga',
  'Your journey can start here.': 'Urugendo rwawe rushobora gutangirira hano.', 'View Google Map': 'Reba ikarita ya Google',
  'Hide Google Map': 'Hisha ikarita ya Google', 'Open directions in Google Maps': 'Fungura inzira muri Google Maps',
  'Enter the school portal': 'Injira ku rubuga rw’ishuri', 'Welcome back': 'Murakaza neza nanone',
  'Sign in to the School Management System': 'Injira muri sisitemu y’imicungire y’ishuri', 'Email or phone number': 'Imeyili cyangwa nimero ya telefoni',
  'Password': 'Ijambo ry’ibanga', 'Forgot password?': 'Wibagiwe ijambo ry’ibanga?', 'Sign in': 'Injira',
  'Signing in…': 'Birimo kwinjira…', 'Are you a parent?': 'Uri umubyeyi?', 'Create an account': 'Fungura konti',
  'Create parent account': 'Fungura konti y’umubyeyi', 'Personal details': 'Amakuru bwite', 'Next': 'Komeza', 'Back': 'Subira inyuma',
  'First name': 'Izina', 'Last name': 'Izina ry’umuryango', 'Phone number': 'Nimero ya telefoni', 'Email address': 'Imeyili',
  'Date of birth': 'Itariki y’amavuko', 'Gender': 'Igitsina', 'Male': 'Gabo', 'Female': 'Gore', 'Other': 'Ikindi',
  'Profile': 'Umwirondoro', 'Log out': 'Sohoka', 'Settings': 'Igenamiterere', 'Dashboard': 'Ahabanza',
  'Students': 'Abanyeshuri', 'Teachers': 'Abarimu', 'Parents': 'Ababyeyi', 'Classes': 'Amashuri', 'Modules': 'Amasomo',
  'Announcements': 'Amatangazo', 'Messages': 'Ubutumwa', 'Admissions': 'Kwakira abanyeshuri', 'Loading…': 'Birimo gutegurwa…',
  'No records found.': 'Nta makuru abonetse.', 'Save changes': 'Bika impinduka', 'Saving…': 'Birimo kubikwa…',
  'Who is completing this form?': 'Ni nde wuzuza iyi fomu?',
  'Parent or guardian': 'Umubyeyi cyangwa umurera', 'Student': 'Umunyeshuri', 'Student information': 'Amakuru y’umunyeshuri',
  'Previous school': 'Ishuri yigagamo', 'Previous school location': 'Aho ishuri yigagamo riherereye',
  'Average marks obtained (%)': 'Impuzandengo y’amanota yabonye (%)', 'Level applying for': 'Icyiciro asaba kujyamo',
  'Preferred programme': 'Ishami yifuza', 'Reason for changing school': 'Impamvu yo guhindura ishuri',
  'Relationship to student': 'Isano afitanye n’umunyeshuri', 'Current residence of student or parent': 'Aho umunyeshuri cyangwa umubyeyi atuye',
  'Province': 'Intara', 'District': 'Akarere', 'Sector': 'Umurenge', 'Cell': 'Akagari', 'Village': 'Umudugudu',
  'Additional information': 'Andi makuru', 'Submit application': 'Ohereza ubusabe', 'Submitting…': 'Birimo koherezwa…',
  'Application received': 'Ubusabe bwakiriwe', 'Application number': 'Nimero y’ubusabe', 'Return to homepage': 'Subira ahabanza',
  'Admission applications': 'Ubusabe bwo kwiga', 'Current residence': 'Aho atuye ubu',
  'Guardian': 'Umubyeyi/umurera', 'Contact': 'Aho wababariza', 'Reason for transfer': 'Impamvu yo kwimuka', 'Average marks': 'Impuzandengo y’amanota',
  'PENDING': 'BIRATEGEREJE', 'UNDER REVIEW': 'BIRASUZUMWA', 'ACCEPTED': 'BYEMEWE', 'REJECTED': 'BYANZWE',
  'Welcome,': 'Murakaza neza,', 'Your linked children': 'Abana bahujwe na konti yawe', 'Your assigned classes and modules': 'Amashuri n’amasomo washinzwe',
  'Overview of G.S BTR RWAMIKO TSS': 'Incamake ya G.S BTR RWAMIKO TSS', 'No admission applications yet': 'Nta busabe bwo kwiga buraboneka',
  'Select province': 'Hitamo intara', 'Select district': 'Hitamo akarere', 'Select sector': 'Hitamo umurenge', 'Select cell': 'Hitamo akagari', 'Select village': 'Hitamo umudugudu',
  'About': 'Ibyerekeye ishuri', 'Academics': 'Amasomo', 'Skills • Character • Future': 'Ubumenyi • Indangagaciro • Ejo hazaza',
  'At G.S BTR Rwamiko TSS, knowledge meets practice. We prepare young people to think boldly, master real skills, and create a prosperous Rwanda.': 'Muri G.S BTR Rwamiko TSS, ubumenyi bujyana n’ibikorwa. Dutegura urubyiruko gutekereza kure, kumenya imyuga no kubaka u Rwanda ruteye imbere.',
  'Rooted in Rwamiko and focused on the future, our learning community combines strong academics, technical mastery, discipline, and collaboration.': 'Dushingiye i Rwamiko kandi duharanira ejo hazaza, duhuza amasomo meza, ubumenyi bwa tekiniki, ikinyabupfura n’ubufatanye.',
  'Join a community shaped by ambition, practical knowledge, and a shared commitment to progress.': 'Injira mu muryango urangwa n’intego, ubumenyi ngiro n’ubwitange mu iterambere.',
  'Create a parent account': 'Fungura konti y’umubyeyi', 'New password': 'Ijambo ry’ibanga rishya', 'Confirm password': 'Emeza ijambo ry’ibanga',
  'Nickname (optional)': 'Izina bakwita (si ngombwa)', 'Job title': 'Umurimo ukora', 'Occupation': 'Umwuga',
  'Where do you currently live?': 'Utuye he ubu?', 'Where do you work? (optional)': 'Ukora he? (si ngombwa)',
  'Admission number': 'Nimero y’umunyeshuri', "Student's last name": 'Izina ry’umuryango ry’umunyeshuri', "Student's full name": 'Amazina yose y’umunyeshuri',
  'Browse the public website': 'Reba urubuga rusange', 'Set a new password': 'Shyiraho ijambo ry’ibanga rishya',
  'This link is valid for 1 hour': 'Iyi link imara isaha imwe', 'Reset your password': 'Hindura ijambo ry’ibanga',
  'Enter your account email address': 'Andika imeyili ya konti yawe', 'My Profile': 'Umwirondoro wanjye',
  'Manage your personal details and photo.': 'Genzura amakuru yawe bwite n’ifoto.', 'Chat with the school administration': 'Ganira n’ubuyobozi bw’ishuri',
  'Updates from the administration': 'Amakuru aturuka ku buyobozi', 'Updates from the school': 'Amakuru aturuka ku ishuri',
  'School Posts': 'Inkuru z’ishuri', 'Publish school-wide posts shown on every dashboard': 'Tangaza inkuru z’ishuri zigaragara kuri buri rubuga',
  'Featured': 'Byatoranyijwe', 'Featured Posts': 'Inkuru z’ingenzi', 'Close': 'Funga', 'None': 'Nta na kimwe',
  'Manage teaching staff records': 'Genzura amakuru y’abarimu', 'Add Teacher': 'Ongeraho umwarimu', 'Department': 'Ishami',
  'Qualification': 'Impamyabumenyi', 'Specialization': 'Umwihariko', 'Manage student records and class placement': 'Genzura amakuru y’abanyeshuri n’amashuri bigamo',
  'Add Student': 'Ongeraho umunyeshuri', 'Temporary password': 'Ijambo ry’ibanga ry’agateganyo', 'Class': 'Ishuri',
  'Academic year': 'Umwaka w’amashuri', 'Address (optional)': 'Aderesi (si ngombwa)', 'Parent (optional)': 'Umubyeyi (si ngombwa)',
  'Conversations with parents and teachers': 'Ibiganiro n’ababyeyi n’abarimu', 'Control what parents can see on their dashboard': 'Genzura ibyo ababyeyi babona ku rubuga rwabo',
  'Announcement categories visible to parents': 'Ibyiciro by’amatangazo ababyeyi babona', 'Review student and parent submissions and their academic documents.': 'Suzuma ubusabe bw’abanyeshuri n’ababyeyi hamwe n’inyandiko z’amasomo.',
  'Loading applications…': 'Ubusabe burimo gutegurwa…', 'Applying for': 'Icyiciro asaba', 'Manage class groups and capacity': 'Genzura amashuri n’umubare w’abanyeshuri',
  'Add Class': 'Ongeraho ishuri', 'Class name': 'Izina ry’ishuri', 'Level': 'Icyiciro', 'Section (optional)': 'Ishami (si ngombwa)',
  'Capacity (optional)': 'Umubare ntarengwa (si ngombwa)', 'Manage course modules (code, credits, competences)': 'Genzura amasomo, amanota n’ubushobozi',
  'Add Module': 'Ongeraho isomo', 'Module code': 'Kode y’isomo', 'Module name': 'Izina ry’isomo', 'Credits': 'Amanota',
  'Learning hours': 'Amasaha yo kwiga', 'Competences (one per line)': 'Ubushobozi (bumwe kuri buri murongo)', 'Core module': 'Isomo ry’ingenzi',
  'Post updates shared with parents and teachers': 'Tangaza amakuru ahabwa ababyeyi n’abarimu', 'Matched': 'Byahujwe',
  'Unverified claim': 'Amakuru ataremezwa', 'Pending': 'Birategereje', 'Approved': 'Byemewe', 'Rejected': 'Byanzwe',
  'Unassigned': 'Ntabwo irahabwa', 'Assign Module to Class': 'Shyira isomo mu ishuri', 'Module': 'Isomo',
  'Teacher (optional)': 'Umwarimu (si ngombwa)', 'Assigned Modules': 'Amasomo yatanzwe', 'Title': 'Umutwe', 'Content': 'Ibirimo',
  'Category': 'Icyiciro', 'Audience': 'Abagenewe', 'Expires on (optional)': 'Bizarangirira (si ngombwa)', 'Published': 'Byatangajwe',
  'Feature on all dashboards': 'Bigaragaze ku mbuga zose', 'Profile photo': 'Ifoto y’umwirondoro',
  'Teacher details': 'Amakuru y’umwarimu', 'Other school name': 'Izina ry’irindi shuri', 'Parent / guardian details': 'Amakuru y’umubyeyi cyangwa umurera',
  'Emergency contact': 'Telefoni y’ubutabazi', 'Residence': 'Aho atuye', 'Workplace': 'Aho akorera', 'Media': 'Amafoto n’inyandiko',
  'No messages yet. Say hello!': 'Nta butumwa buraboneka. Tangira ikiganiro!', 'Loading announcements…': 'Amatangazo arimo gutegurwa…',
  'Classes & Trades': 'Amashuri n’amashami', 'Teaching Modules': 'Amasomo yigishwa', 'Attendance': 'Kwitabira ishuri',
  'Assessments': 'Isuzumabumenyi', 'Marks': 'Amanota', 'Question Bank': 'Ikigega cy’ibibazo', 'Notes & Manuals': 'Inyandiko n’imfashanyigisho',
  'Good Conduct': 'Imyitwarire myiza', 'Teacher command centre': 'Ihuriro ry’imirimo y’umwarimu', 'Welcome back,': 'Murakaza neza nanone,',
  'Teaching tools': 'Ibikoresho by’umwarimu', 'Assigned classes': 'Amashuri washinzwe', 'Teaching modules': 'Amasomo wigisha',
  'Active learners': 'Abanyeshuri biga', 'Current term': 'Igihembwe turimo', 'Take attendance': 'Andika abitabiriye',
  'Assessments & exams': 'Isuzumabumenyi n’ibizamini', 'Marks management': 'Imicungire y’amanota', 'Question bank': 'Ikigega cy’ibibazo',
  'Notes & manuals': 'Inyandiko n’imfashanyigisho', 'Student conduct': 'Imyitwarire y’abanyeshuri', 'My teaching allocation': 'Amasomo n’amashuri nshinzwe',
  'View all': 'Reba byose', 'Class Attendance': 'Kwitabira ishuri', 'Learner Conduct': 'Imyitwarire y’abanyeshuri',
  'Marks Management': 'Imicungire y’amanota', 'Assessments & Exams': 'Isuzumabumenyi n’ibizamini', 'Workspace records': 'Inyandiko zakozwe',
  'Class and module': 'Ishuri n’isomo', 'Date': 'Itariki', 'Mark all present': 'Shyiraho ko bose bahari', 'Learner': 'Umunyeshuri',
  'Attendance status': 'Uko yitabiriye', 'Select status': 'Hitamo uko yitabiriye', 'Present': 'Yahari', 'Absent': 'Yasibye',
  'Late': 'Yakererewe', 'Excused': 'Yasabwe uruhushya', 'Save attendance register': 'Bika urutonde rw’abitabiriye',
  'Add question': 'Ongeraho ikibazo', 'Upload resource': 'Ohereza imfashanyigisho', 'Add conduct record': 'Andika imyitwarire',
  'Create assessment': 'Kora isuzumabumenyi', 'Enter marks': 'Andika amanota', 'Plan module': 'Tegura isomo', 'Type': 'Ubwoko',
  'Save draft': 'Bika umushinga', 'Cancel': 'Hagarika', 'Filter': 'Shungura', 'Manage': 'Genzura',
};

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function translatePage(language: Language) {
  const translate = (value: string) => {
    const leading = value.match(/^\s*/)?.[0] ?? '';
    const trailing = value.match(/\s*$/)?.[0] ?? '';
    const core = value.trim();
    if (!core) return value;
    if (phraseRw[core]) return `${leading}${language === 'rw' ? phraseRw[core] : core}${trailing}`;
    if (core.startsWith('Welcome, ')) return `${leading}${language === 'rw' ? core.replace('Welcome, ', 'Murakaza neza, ') : core}${trailing}`;
    return value;
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (!parent || ['SCRIPT', 'STYLE'].includes(parent.tagName) || parent.closest('[data-no-translate]')) continue;
    if (!originalText.has(textNode)) originalText.set(textNode, textNode.nodeValue ?? '');
    const source = originalText.get(textNode) ?? '';
    textNode.nodeValue = language === 'rw' ? translate(source) : source;
  }
  document.querySelectorAll('[placeholder], [title], [aria-label]').forEach(element => {
    let originals = originalAttributes.get(element);
    if (!originals) { originals = new Map(); originalAttributes.set(element, originals); }
    for (const attribute of ['placeholder', 'title', 'aria-label']) {
      const current = element.getAttribute(attribute); if (!current) continue;
      if (!originals.has(attribute)) originals.set(attribute, current);
      const source = originals.get(attribute) ?? current;
      element.setAttribute(attribute, language === 'rw' ? (phraseRw[source] ?? source) : source);
    }
  });
}

export type TranslationKey = keyof typeof translations.en;
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  useEffect(() => { const saved = localStorage.getItem('school-language'); if (saved === 'en' || saved === 'rw') setLanguageState(saved); }, []);
  const setLanguage = (value: Language) => { setLanguageState(value); localStorage.setItem('school-language', value); document.documentElement.lang = value; };
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  useEffect(() => {
    translatePage(language);
    const observer = new MutationObserver(() => translatePage(language));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key: TranslationKey) => translations[language][key] ?? translations.en[key] }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { const context = useContext(LanguageContext); if (!context) throw new Error('useLanguage must be used within LanguageProvider'); return context; }
