import type { AppLanguage } from '../types/campaign';

export const TRANSLATIONS = {
  en: {
    brandSubtitle: 'Katsina State 2027 Victory Command',
    navSimulator: 'Victory Simulator',
    navLeadership: 'Leadership',
    navAgenda: 'Agenda',
    navMap: 'Operations Map',
    navTransition: 'Transition Portal',
    navWards: 'States & Wards',
    navSentiment: 'Voter Sentiment',
    navCitizenDesk: 'Volunteer & Ideas',
    enterSituationRoom: 'Enter Situation Room',
    enterSituationShort: 'Situation Room',
    heroHeadline: 'Welcome — See How Senator Yakubu Lado Wins Katsina State.',
    citizenDeskEyebrow: 'Public Participation & Post-Election Delivery',
    citizenDeskTitle: 'Join the Grassroots Network, Share Governance Ideas & Track 100-Day Delivery',
    citizenDeskDesc:
      'Every citizen across Katsina State’s 34 LGAs and 361 wards can volunteer for ward mobilization, propose actionable governance ideas, and track first-100-day delivery milestones.',
    volunteerFormTitle: 'Volunteer & Grassroots Coordinator Sign-Up',
    volunteerFormBtn: 'Register as Volunteer',
    ideaFormTitle: 'Propose Citizen Idea for Katsina Governance',
    ideaFormBtn: 'Submit Governance Idea',
    promiseTrackerTitle: 'Public First 100-Day Promise & Transition Meter',
    fieldOpsTitle: 'Field Operations & Mobile PWA Console',
    fieldOpsSubtitle:
      'Permission-disclosed field check-ins, offline-first reporting queue, and real-time operational dispatch.',
    fieldCheckInHeading: 'Field Personnel Check-In',
    fieldSubmitCheckIn: 'Record Field Check-In',
    fieldOfflineOn: 'Offline Field Simulation: ON',
    fieldOfflineOff: 'Connection: Online',
    electionDayTitle: 'Election-Day Operations, Form EC8A Collation & Verification Desk',
    electionDaySubtitle:
      'Real-time agent check-ins, multi-stage submission verification, and PU-by-PU Form EC8A vote collation with automatic over-voting guards.',
    ec8aTabQueue: 'Submission Verification Queue',
    ec8aTabCollation: 'Form EC8A Collation & 25% Spread',
    ec8aSubmitBtn: 'Submit Form EC8A Sheet',
  },
  ha: {
    brandSubtitle: 'Kwamitin Nasarar Jihar Katsina 2027',
    navSimulator: 'Hasashen Zabe',
    navLeadership: 'Jagoranci',
    navAgenda: 'Manufofi 8',
    navMap: 'Taswirar Aiki',
    navTransition: 'Shirin Mulki',
    navWards: 'Jihohi & Mazabu',
    navSentiment: 'Ra’ayin Masu Zabe',
    navCitizenDesk: 'Masu Sa-Kai & Shawara',
    enterSituationRoom: 'Shiga Dakin Umurni',
    enterSituationShort: 'Dakin Umurni',
    heroHeadline: 'Barka da Zuwa — Duba Yadda Sanata Yakubu Lado Zai Lashe Jihar Katsina.',
    citizenDeskEyebrow: 'Shigar Jama’a & Aiwatar da Alkawura',
    citizenDeskTitle: 'Shiga Tawagar Sa-Kai, Bada Shawarar Mulki & Bibiya Ayyukan Kwanaki 100',
    citizenDeskDesc:
      'Kowane dan kasa a kananan hukumomi 34 da mazabu 361 na Jihar Katsina na iya yin rajistar sa-kai, tura shawarar ci gaba, da bibiyar ayyukan kwanaki 100 na farko.',
    volunteerFormTitle: 'Rijistar Masu Sa-Kai & Jami’an Mazabu',
    volunteerFormBtn: 'Yi Rijistar Sa-Kai',
    ideaFormTitle: 'Tura Shawarar Ci Gaban Gwamnatin Katsina',
    ideaFormBtn: 'Aika Shawara',
    promiseTrackerTitle: 'Ma’aunin Alkawuran Kwanaki 100 na Farko',
    fieldOpsTitle: 'Ayyukan Kasa & Manhajar Wakilan Filin Zabe (PWA)',
    fieldOpsSubtitle:
      'Tabbatar da zuwan wakilai da izini, adana rahoto ko da babu intanet, da aika sako kai tsaye.',
    fieldCheckInHeading: 'Rajistar Zuwan Wakilin Filin Zabe',
    fieldSubmitCheckIn: 'Aika Rajistar Zuwa',
    fieldOfflineOn: 'Yanayin Rashin Intanet: A KUNNE',
    fieldOfflineOff: 'Intanet: Akwai Sadarwa',
    electionDayTitle: 'Ayyukan Ranar Zabe, Tattara Sakamakon Form EC8A & Tabbatarwa',
    electionDaySubtitle:
      'Bibiyar wakilai a rumfunan zabe, tantance rahotanni, da tattara kuri’un Form EC8A tare da gano kura-kuran kididdiga nan take.',
    ec8aTabQueue: 'Jerin Tantance Rahotanni',
    ec8aTabCollation: 'Tattara Form EC8A & Kason 25%',
    ec8aSubmitBtn: 'Aika Takardar Form EC8A',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.en;

export function t(lang: AppLanguage, key: TranslationKey): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key];
}
