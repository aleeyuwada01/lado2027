import React, { useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Globe,
  MapPin,
  Search,
  Upload,
  Users,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { NIGERIA_STATES } from '../data/nigeriaGeo';
import {
  KATSINA_INEC_LGAS,
  KATSINA_INEC_META,
  type KatsinaLgaINEC,
  type KatsinaSenatorialZone,
} from '../data/katsinaInecData';
import type { GeopoliticalZone } from '../types/campaign';

const GEOPOLITICAL_ZONES: Array<'All' | GeopoliticalZone> = [
  'All',
  'North-West',
  'North-East',
  'North-Central',
  'South-West',
  'South-East',
  'South-South',
];

const KATSINA_ZONES: Array<'All' | KatsinaSenatorialZone> = [
  'All',
  'Katsina South',
  'Katsina Central',
  'Katsina North',
];

export const AdminGeographyWardsTab: React.FC = () => {
  const { geoUnits, setActiveModule } = useCampaign();

  // Default to Katsina State ('KT') so clicking straight into the tab immediately shows all 34 Katsina LGAs & 361 Wards
  const [selectedStateCode, setSelectedStateCode] = useState<string>('KT');
  const [stateSearch, setStateSearch] = useState<string>('');
  const [stateZoneFilter, setStateZoneFilter] = useState<'All' | GeopoliticalZone>('All');

  // Katsina LGA & Ward explorer controls
  const [ktZoneFilter, setKtZoneFilter] = useState<'All' | KatsinaSenatorialZone>('All');
  const [lgaWardSearch, setLgaWardSearch] = useState<string>('');
  const [expandedLgaIds, setExpandedLgaIds] = useState<Record<string, boolean>>({
    katsina: true,
    funtua: true,
  });

  // Other state LGA inspection + mobile state browser toggle
  const [selectedOtherLga, setSelectedOtherLga] = useState<string | null>(null);
  const [mobileStateBrowserOpen, setMobileStateBrowserOpen] = useState<boolean>(false);

  // Ordered states list with Katsina pinned first for instant access
  const filteredStates = useMemo(() => {
    const q = stateSearch.trim().toLowerCase();
    const list = NIGERIA_STATES.filter((st) => {
      if (stateZoneFilter !== 'All' && st.zone !== stateZoneFilter) return false;
      if (q && !`${st.name} ${st.code} ${st.capital} ${st.zone}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (a.code === 'KT') return -1;
      if (b.code === 'KT') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [stateSearch, stateZoneFilter]);

  const activeState = useMemo(
    () => NIGERIA_STATES.find((s) => s.code === selectedStateCode) ?? NIGERIA_STATES.find((s) => s.code === 'KT')!,
    [selectedStateCode]
  );

  // Katsina filtered LGAs (searches both LGA name and all 361 ward names!)
  const filteredKatsinaLgas = useMemo(() => {
    const q = lgaWardSearch.trim().toLowerCase();
    return KATSINA_INEC_LGAS.filter((lga) => {
      if (ktZoneFilter !== 'All' && lga.zone !== ktZoneFilter) return false;
      if (!q) return true;
      const lgaMatch = `${lga.name} ${lga.inecCode} ${lga.zone}`.toLowerCase().includes(q);
      const wardMatch = lga.wards.some((w) => `${w.name} ${w.code}`.toLowerCase().includes(q));
      return lgaMatch || wardMatch;
    });
  }, [ktZoneFilter, lgaWardSearch]);

  // Imported custom wards/polling units for non-Katsina states from CampaignContext
  const importedUnitsForState = useMemo(
    () => geoUnits.filter((u) => u.stateCode === activeState.code),
    [geoUnits, activeState.code]
  );

  const filteredOtherLgas = useMemo(() => {
    const q = lgaWardSearch.trim().toLowerCase();
    if (!q) return activeState.lgas;
    return activeState.lgas.filter((name) => name.toLowerCase().includes(q));
  }, [activeState.lgas, lgaWardSearch]);

  const toggleLgaExpand = (lgaId: string) => {
    setExpandedLgaIds((prev) => ({ ...prev, [lgaId]: !prev[lgaId] }));
  };

  const expandAllKatsinaLgas = () => {
    const next: Record<string, boolean> = {};
    for (const lga of KATSINA_INEC_LGAS) next[lga.id] = true;
    setExpandedLgaIds(next);
  };

  const collapseAllKatsinaLgas = () => {
    setExpandedLgaIds({});
  };

  const handleExportKatsinaWardsCsv = () => {
    const headers = [
      'State',
      'SenatorialZone',
      'LGA_INEC_Code',
      'LGA_Name',
      'Ward_INEC_Code',
      'Ward_Name',
      'Polling_Units',
      'Oct2026_Registered_Voters',
      'PVC_Collection_Rate_Pct',
    ];
    const rows: string[] = [];
    for (const lga of filteredKatsinaLgas) {
      for (const ward of lga.wards) {
        rows.push(
          [
            'Katsina',
            `"${lga.zone}"`,
            lga.inecCode,
            `"${lga.name}"`,
            ward.code,
            `"${ward.name}"`,
            ward.pollingUnits,
            ward.registeredVoters,
            (ward.pvcCollectionRate * 100).toFixed(1),
          ].join(',')
        );
      }
    }
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `katsina-inec-34-lgas-361-wards-oct2026.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalVisibleWards = useMemo(
    () => filteredKatsinaLgas.reduce((sum, lga) => sum + lga.wards.length, 0),
    [filteredKatsinaLgas]
  );

  const renderKatsinaLgaCard = (lga: KatsinaLgaINEC) => {
    const q = lgaWardSearch.trim().toLowerCase();
    const lgaNameMatches =
      !q || `${lga.name} ${lga.inecCode} ${lga.zone}`.toLowerCase().includes(q);
    const matchingWards = q && !lgaNameMatches
      ? lga.wards.filter((w) => `${w.name} ${w.code}`.toLowerCase().includes(q))
      : lga.wards;
    const isExpanded = Boolean(expandedLgaIds[lga.id]) || Boolean(q && !lgaNameMatches);

    return (
      <div
        key={lga.id}
        data-testid={`admin-kt-lga-${lga.id}`}
        className="border border-slate-200/90 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0F172A] overflow-hidden"
      >
        <button
          type="button"
          onClick={() => toggleLgaExpand(lga.id)}
          aria-expanded={isExpanded}
          data-testid={`admin-kt-lga-toggle-${lga.id}`}
          className="w-full px-3 sm:px-4 py-3 sm:py-3.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 text-left hover:bg-slate-50/90 dark:hover:bg-slate-900/60 transition-colors"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/70 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {lga.inecCode}
                </span>
                <span className="text-sm font-bold text-slate-950 dark:text-white">
                  {lga.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {lga.zone}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                {lga.wardCount} Wards · {lga.pollingUnits.toLocaleString()} PUs · +
                {lga.cvr2026NewVoters.toLocaleString()} CVR
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto pl-9 sm:pl-0 shrink-0">
            <div className="text-left sm:text-right tabular-nums">
              <div className="text-xs font-bold text-slate-950 dark:text-white">
                {lga.registeredVoters.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500">Oct 2026 Voters</div>
            </div>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70 whitespace-nowrap">
              {isExpanded ? 'Hide Wards' : `View ${lga.wardCount} Wards`}
            </span>
          </div>
        </button>

        {isExpanded && (
          <div
            data-testid={`admin-kt-lga-wards-${lga.id}`}
            className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-[#0B1120] overflow-x-auto"
          >
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-2.5 sm:px-4 font-semibold">Code</th>
                  <th className="py-2.5 px-2.5 sm:px-4 font-semibold">INEC Ward Name</th>
                  <th className="py-2.5 px-2.5 sm:px-4 font-semibold text-right">PUs</th>
                  <th className="py-2.5 px-2.5 sm:px-4 font-semibold text-right">Voters</th>
                  <th className="py-2.5 px-2.5 sm:px-4 font-semibold text-right">PVC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/70">
                {matchingWards.map((ward) => (
                  <tr
                    key={ward.id}
                    className="hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors"
                  >
                    <td className="py-2 px-2.5 sm:px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {ward.code}
                    </td>
                    <td className="py-2 px-2.5 sm:px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {ward.name}
                    </td>
                    <td className="py-2 px-2.5 sm:px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {ward.pollingUnits.toLocaleString()}
                    </td>
                    <td className="py-2 px-2.5 sm:px-4 text-right tabular-nums font-semibold text-slate-950 dark:text-white whitespace-nowrap">
                      {ward.registeredVoters.toLocaleString()}
                    </td>
                    <td className="py-2 px-2.5 sm:px-4 text-right tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold whitespace-nowrap">
                      {(ward.pvcCollectionRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div data-testid="admin-wards-explorer" className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
      {/* Compact Mobile & Tablet State Switcher (puts Katsina 34 LGAs & 361 Wards immediately above the fold!) */}
      <div className="xl:hidden bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="mobile-admin-state-select"
            className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            Active State (36 States + FCT)
          </label>
          <button
            type="button"
            onClick={() => setMobileStateBrowserOpen((v) => !v)}
            className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
          >
            {mobileStateBrowserOpen ? 'Hide 37-State List' : 'Browse All 37 States'}
          </button>
        </div>

        <select
          id="mobile-admin-state-select"
          value={activeState.code}
          onChange={(e) => {
            setSelectedStateCode(e.target.value);
            setSelectedOtherLga(null);
            setLgaWardSearch('');
          }}
          data-testid="mobile-admin-state-select"
          className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-950 dark:text-white"
        >
          {[...NIGERIA_STATES]
            .sort((a, b) => (a.code === 'KT' ? -1 : b.code === 'KT' ? 1 : a.name.localeCompare(b.name)))
            .map((st) => (
              <option key={st.code} value={st.code}>
                {st.code} — {st.name} ({st.lgas.length} LGAs{st.code === 'KT' ? ' · 361 INEC Wards' : ''})
              </option>
            ))}
        </select>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['KT', 'KN', 'KD', 'LA', 'FC'] as const).map((code) => {
            const st = NIGERIA_STATES.find((s) => s.code === code);
            if (!st) return null;
            const active = activeState.code === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setSelectedStateCode(code);
                  setSelectedOtherLga(null);
                  setLgaWardSearch('');
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[#0D5C38] text-white border-[#0D5C38]'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {code === 'KT' ? 'Katsina (34)' : code === 'FC' ? 'FCT' : st.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Left Column: Clickable 36 States + FCT Directory (Always visible on xl desktop; toggleable on mobile) */}
      <aside
        className={`${
          mobileStateBrowserOpen ? 'block' : 'hidden xl:block'
        } xl:col-span-4 bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/70 dark:bg-[#0B1120]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              Select State (36 States + FCT)
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {filteredStates.length}/37
            </span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              placeholder="Search Nigerian state..."
              aria-label="Search Nigerian states"
              data-testid="admin-state-search"
              className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {GEOPOLITICAL_ZONES.map((zone) => (
              <button
                key={zone}
                type="button"
                onClick={() => setStateZoneFilter(zone)}
                className={`px-2 py-1 rounded text-[10px] font-semibold border transition-colors ${
                  stateZoneFilter === zone
                    ? 'bg-[#0D5C38] text-white border-[#0D5C38]'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>

        <div
          data-testid="admin-state-list"
          className="max-h-[340px] xl:max-h-[680px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80"
        >
          {filteredStates.map((st) => {
            const active = st.code === activeState.code;
            const isKatsina = st.code === 'KT';
            return (
              <button
                key={st.code}
                type="button"
                onClick={() => {
                  setSelectedStateCode(st.code);
                  setSelectedOtherLga(null);
                  setLgaWardSearch('');
                  setMobileStateBrowserOpen(false);
                }}
                data-testid={`admin-state-btn-${st.code}`}
                className={`w-full px-4 py-3 text-left flex items-center justify-between gap-2 transition-colors ${
                  active
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-l-4 border-l-emerald-600'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      {st.code}
                    </span>
                    <span className="text-xs font-bold text-slate-950 dark:text-white truncate">
                      {st.name}
                    </span>
                    {isKatsina && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wide shrink-0">
                        361 Wards
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {st.zone} · Capital: {st.capital}
                  </div>
                </div>
                <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                  {st.lgas.length} LGAs
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Column: Selected State's Local Governments & Wards Inspector */}
      <div className="xl:col-span-8 space-y-4">
        {activeState.code === 'KT' ? (
          <>
            {/* Katsina Oct 2026 INEC Summary Header */}
            <div className="bg-white dark:bg-[#0F172A] border border-emerald-200/90 dark:border-emerald-800/70 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {KATSINA_INEC_META.registerRelease} · INEC State Code {KATSINA_INEC_META.stateCode}
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white mt-0.5 font-display">
                    Katsina State — All 34 Local Governments & 361 Electoral Wards
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Click any Katsina Local Government below to inspect its authentic INEC wards, polling unit counts, and Oct 2026 registered voters.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportKatsinaWardsCsv}
                  data-testid="admin-export-kt-wards-csv"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0D5C38] hover:bg-[#09452A] rounded-lg transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export 361 Wards CSV
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70">
                  <div className="text-[11px] text-slate-500">Oct 2026 Voters</div>
                  <div className="text-base font-bold tabular-nums text-slate-950 dark:text-white">
                    {KATSINA_INEC_META.totalRegisteredVoters.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    #4 Nationally
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70">
                  <div className="text-[11px] text-slate-500">Local Governments</div>
                  <div className="text-base font-bold tabular-nums text-slate-950 dark:text-white">
                    {KATSINA_INEC_META.totalLgas} LGAs
                  </div>
                  <div className="text-[10px] text-slate-500">3 Senatorial Zones</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70">
                  <div className="text-[11px] text-slate-500">Electoral Wards</div>
                  <div className="text-base font-bold tabular-nums text-slate-950 dark:text-white">
                    {KATSINA_INEC_META.totalWards} Wards
                  </div>
                  <div className="text-[10px] text-slate-500">Complete INEC Registry</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70">
                  <div className="text-[11px] text-slate-500">Polling Units</div>
                  <div className="text-base font-bold tabular-nums text-slate-950 dark:text-white">
                    {KATSINA_INEC_META.totalPollingUnits.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                    +{KATSINA_INEC_META.cvr2026NetAdditions.toLocaleString()} CVR
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Expand Controls for Katsina 34 LGAs */}
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {KATSINA_ZONES.map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setKtZoneFilter(zone)}
                      data-testid={`admin-kt-zone-${zone.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        ktZoneFilter === zone
                          ? 'bg-[#0D5C38] text-white border-[#0D5C38]'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {zone === 'All' ? 'All 34 LGAs' : zone}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={expandAllKatsinaLgas}
                    data-testid="admin-expand-all-lgas"
                    className="px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/80"
                  >
                    Expand All Wards
                  </button>
                  <button
                    type="button"
                    onClick={collapseAllKatsinaLgas}
                    className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={lgaWardSearch}
                    onChange={(e) => setLgaWardSearch(e.target.value)}
                    placeholder="Search any Katsina LGA or Ward name (e.g., Funtua, Sabon Gari, Makera, Daura)..."
                    aria-label="Search Katsina LGAs and wards"
                    data-testid="admin-lga-ward-search"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <span className="text-xs text-slate-500 tabular-nums shrink-0">
                  Showing <strong className="text-slate-900 dark:text-white">{filteredKatsinaLgas.length}</strong> LGAs ·{' '}
                  <strong className="text-slate-900 dark:text-white">{totalVisibleWards}</strong> Wards
                </span>
              </div>

              {/* At-a-Glance Clickable Grid of All 34 Katsina Local Governments */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Quick-Jump: Click any of Katsina&rsquo;s {filteredKatsinaLgas.length} Local Governments to open its wards
                </div>
                <div
                  data-testid="admin-kt-lga-quick-grid"
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5"
                >
                  {filteredKatsinaLgas.map((lga) => {
                    const isOpen = Boolean(expandedLgaIds[lga.id]);
                    return (
                      <button
                        key={lga.id}
                        type="button"
                        onClick={() => {
                          setExpandedLgaIds((prev) => ({ ...prev, [lga.id]: true }));
                          const target = document.querySelector(`[data-testid="admin-kt-lga-${lga.id}"]`);
                          target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] border transition-colors flex items-center justify-between gap-1 ${
                          isOpen
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold'
                            : 'bg-slate-50/80 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        <span className="truncate">{lga.name}</span>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          {lga.wardCount}W
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* All 34 Katsina LGAs & Expandable Wards */}
            <div data-testid="admin-kt-lga-list" className="space-y-3">
              {filteredKatsinaLgas.length === 0 ? (
                <div className="p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-2">
                  <MapPin className="w-5 h-5 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    No Katsina LGA or Ward matches &ldquo;{lgaWardSearch}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setKtZoneFilter('All');
                      setLgaWardSearch('');
                    }}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    Show all 34 Katsina LGAs
                  </button>
                </div>
              ) : (
                filteredKatsinaLgas.map(renderKatsinaLgaCard)
              )}
            </div>
          </>
        ) : (
          /* Non-Katsina State Directory View (All 36 States + FCT LGAs + Imported Wards) */
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {activeState.zone} · State Code: {activeState.code} · Capital: {activeState.capital}
                  </div>
                  <h3 className="text-lg font-bold text-slate-950 dark:text-white mt-0.5 font-display">
                    {activeState.name} State — {activeState.lgas.length} Local Government Areas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official Nigerian administrative LGAs for {activeState.name}. Click any LGA to inspect imported INEC wards or upload official ward files via Geographic Operations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModule('geographic-ops')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0D5C38] hover:bg-[#09452A] rounded-lg transition-colors shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import {activeState.name} Wards
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={lgaWardSearch}
                    onChange={(e) => setLgaWardSearch(e.target.value)}
                    placeholder={`Filter ${activeState.name} Local Governments...`}
                    aria-label={`Filter ${activeState.name} LGAs`}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStateCode('KT')}
                  className="px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg"
                >
                  Switch to Katsina (361 Wards)
                </button>
              </div>
            </div>

            <div
              data-testid="admin-other-state-lga-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {filteredOtherLgas.map((lgaName) => {
                const lgaImportedUnits = importedUnitsForState.filter(
                  (u) => u.lga.toLowerCase() === lgaName.toLowerCase()
                );
                const uniqueWards = Array.from(new Set(lgaImportedUnits.map((u) => u.ward)));
                const isSelected = selectedOtherLga === lgaName;
                return (
                  <button
                    key={lgaName}
                    type="button"
                    onClick={() => setSelectedOtherLga(isSelected ? null : lgaName)}
                    className={`p-3.5 rounded-xl border text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500'
                        : 'bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        {lgaName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {uniqueWards.length > 0 ? `${uniqueWards.length} wards` : 'LGA'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {lgaImportedUnits.length > 0
                        ? `${lgaImportedUnits.length} imported polling units`
                        : 'No wards imported yet'}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedOtherLga && (
              <div className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    {selectedOtherLga} LGA ({activeState.name}) — Ward Registry
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveModule('geographic-ops')}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    Import CSV / GeoJSON Wards →
                  </button>
                </div>
                {importedUnitsForState.filter(
                  (u) => u.lga.toLowerCase() === selectedOtherLga.toLowerCase()
                ).length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {importedUnitsForState
                      .filter((u) => u.lga.toLowerCase() === selectedOtherLga.toLowerCase())
                      .map((u) => (
                        <div key={u.id} className="py-2 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {u.ward}
                            </span>{' '}
                            <span className="text-slate-500">· {u.pollingUnitName}</span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-500">{u.pollingUnitCode}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Official wards are not fabricated for non-Katsina states. Use Geographic Operations to import official INEC ward & polling unit datasets for {selectedOtherLga} LGA.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
