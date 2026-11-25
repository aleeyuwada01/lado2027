import type { TransitionProjectPin } from '../types/campaign';

export const TRANSITION_LGA_PROJECTS: TransitionProjectPin[] = [
  {
    id: 'tp-01',
    lgaId: 'rimi',
    lgaName: 'Rimi',
    zone: 'Katsina Central',
    title: 'Rimi Wind Mill 10MW+ Rehabilitation & Hybrid Solar Feeders',
    sector: 'Clean Energy & Rimi Wind',
    window: 'Days 1–30',
    budgetEst: 'Flagship PPP / Clean Energy Track',
    summary:
      'Restore flagship Rimi wind turbines paired with utility battery storage to power regional water works, hospitals, and industrial clusters.',
  },
  {
    id: 'tp-02',
    lgaId: 'katsina',
    lgaName: 'Katsina',
    zone: 'Katsina Central',
    title: 'State AI Command Hub, Open E-Procurement & Zonal Campus Free Wi-Fi',
    sector: 'AI, Digital & Free Internet',
    window: 'Days 31–60',
    budgetEst: 'Medium Capital',
    summary:
      'Central AI engineering fellowship campus, open citizens contracting portal, and free high-speed public Wi-Fi corridors.',
  },
  {
    id: 'tp-03',
    lgaId: 'daura',
    lgaName: 'Daura',
    zone: 'Katsina North',
    title: 'Katsina North Free Public Wi-Fi Hub & Zonal Solar Specialist Hospital',
    sector: 'Healthcare',
    window: 'Days 31–60',
    budgetEst: 'Medium Capital',
    summary:
      '24/7 hybrid-solar medical diagnostics center paired with youth digital literacy and library broadband access.',
  },
  {
    id: 'tp-04',
    lgaId: 'funtua',
    lgaName: 'Funtua',
    zone: 'Katsina South',
    title: 'Katsina South Zonal Specialist Upgrade & Agro-Innovation Wi-Fi Zone',
    sector: 'Healthcare',
    window: 'Days 61–100',
    budgetEst: 'Medium Capital',
    summary:
      'Referral surgical theater solarization plus Funtua commercial agro-exchange & youth engineering hub.',
  },
  {
    id: 'tp-05',
    lgaId: 'batsari',
    lgaName: 'Batsari',
    zone: 'Katsina Central',
    title: 'Frontline Early-Warning Peace Desk & Safe School Transit Protocol',
    sector: 'Security & Peace',
    window: 'Days 1–30',
    budgetEst: 'Day-1 Priority',
    summary:
      '24/7 VHF/satellite rapid dispatch fusion post protecting rural schools, farms, and grazing corridors.',
  },
  {
    id: 'tp-06',
    lgaId: 'faskari',
    lgaName: 'Faskari',
    zone: 'Katsina South',
    title: 'South Frontline Security Fusion Node & Rural Solar Boreholes',
    sector: 'Security & Peace',
    window: 'Days 1–30',
    budgetEst: 'Day-1 Priority',
    summary:
      'Encrypted community-to-security response desk alongside solar lighting and water access points.',
  },
  {
    id: 'tp-07',
    lgaId: 'bakori',
    lgaName: 'Bakori',
    zone: 'Katsina South',
    title: 'Bakori Irrigated Tomato & Maize Solar Cold-Storage Cluster',
    sector: 'Agriculture & Economy',
    window: 'Days 61–100',
    budgetEst: 'Medium Capital',
    summary:
      'Zero-spoilage solar walk-in cold rooms and Hausa AI extension pricing advisory for smallholder cooperatives.',
  },
  {
    id: 'tp-08',
    lgaId: 'zango',
    lgaName: 'Zango',
    zone: 'Katsina North',
    title: 'Sabke Dam Solar Drip Irrigation & Border Agro-Export Hub',
    sector: 'Agriculture & Economy',
    window: 'Days 61–100',
    budgetEst: 'Medium Capital',
    summary:
      'Dry-season cooperative solar pumps, onion/pepper cold chain, and rural feeder access.',
  },
  {
    id: 'tp-09',
    lgaId: 'malumfashi',
    lgaName: 'Malumfashi',
    zone: 'Katsina South',
    title: 'Regional STEM Technical College Lab & Public Internet Zone',
    sector: 'Education & STEM',
    window: 'Days 31–60',
    budgetEst: 'Low Cost / Quick Win',
    summary:
      'Free public broadband hub and modern STEM laboratory equipment supporting tuition-free schools.',
  },
  {
    id: 'tp-10',
    lgaId: 'kankara',
    lgaName: 'Kankara',
    zone: 'Katsina South',
    title: 'Kankara Security Corridor Station & Girls STEM Re-Integration Grant',
    sector: 'Education & STEM',
    window: 'Days 1–30',
    budgetEst: 'Medium Capital',
    summary:
      'Coordinated highway & rural school protection linked to accelerated classroom rehabilitation.',
  },
  {
    id: 'tp-11',
    lgaId: 'dutsin-ma',
    lgaName: 'Dutsin-Ma',
    zone: 'Katsina Central',
    title: 'Zobe Dam Agro-Processing Cluster & Campus Free Wi-Fi Zone',
    sector: 'AI, Digital & Free Internet',
    window: 'Days 31–60',
    budgetEst: 'Medium Capital',
    summary:
      'Student & researcher public broadband zone alongside Zobe reservoir dry-season crop off-take support.',
  },
  {
    id: 'tp-12',
    lgaId: 'safana',
    lgaName: 'Safana',
    zone: 'Katsina Central',
    title: 'Frontline Vigilance Node & Ward PHC 24/7 Solar Upgrade',
    sector: 'Security & Peace',
    window: 'Days 1–30',
    budgetEst: 'Day-1 Priority',
    summary:
      'Dedicated rural peace corridor communications and lithium-solar backup for primary healthcare clinics.',
  },
];

export const TRANSITION_PROJECTS_BY_LGA_ID: Record<string, TransitionProjectPin[]> =
  TRANSITION_LGA_PROJECTS.reduce<Record<string, TransitionProjectPin[]>>((acc, pin) => {
    acc[pin.lgaId] = acc[pin.lgaId] ? [...acc[pin.lgaId], pin] : [pin];
    return acc;
  }, {});
