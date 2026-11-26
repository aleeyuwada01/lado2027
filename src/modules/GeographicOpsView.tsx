import React, { useMemo, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  Map as MapIcon,
  RotateCcw,
  Search,
  Table,
  Upload,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import {
  getTotalLgaCount,
  NIGERIA_STATES,
  searchNigeriaGeography,
  STATE_BY_CODE,
} from '../data/nigeriaGeo';
import { NigeriaMap } from '../components/NigeriaMap';
import {
  exportRowsToCsv,
  parseAndValidateGeoImport,
  type GeoImportValidationResult,
} from '../lib/analytics';

const SAMPLE_CSV_TEMPLATE = [
  'state_code,lga,ward,polling_unit_name,polling_unit_code',
  'KT,Katsina,Wakilin Gabas I,Central Primary School Gate,INEC-KT-01-001',
  'KT,Daura,Sarkin Yara A,Daura Model School Courtyard,INEC-KT-02-001',
  'KN,Kano Municipal,Sharada Ward,Sharada Community Center,INEC-KN-01-001',
].join('\n');

export const GeographicOpsView: React.FC = () => {
  const {
    selectedStateCode,
    setSelectedStateCode,
    stateSummaries,
    personnel,
    geoUnits,
    importGeoUnits,
    importJobs,
    rollbackImportJob,
    branding,
  } = useCampaign();

  const [viewMode, setViewMode] = useState<'map' | 'list' | 'import'>('map');
  const [selectedLga, setSelectedLga] = useState<string>('');
  const [geoSearch, setGeoSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('All');

  // Import Wizard State
  const [importFormat, setImportFormat] = useState<'CSV' | 'JSON' | 'GeoJSON'>('CSV');
  const [importFileName, setImportFileName] = useState('official_wards_polling_units.csv');
  const [rawImportText, setRawImportText] = useState(SAMPLE_CSV_TEMPLATE);
  const [previewResult, setPreviewResult] = useState<GeoImportValidationResult | null>(null);

  const selectedState = STATE_BY_CODE[selectedStateCode];
  const totalLgas = useMemo(() => getTotalLgaCount(), []);

  const searchResults = useMemo(() => searchNigeriaGeography(geoSearch), [geoSearch]);

  const filteredStates = useMemo(
    () =>
      NIGERIA_STATES.filter((s) => zoneFilter === 'All' || s.zone === zoneFilter),
    [zoneFilter]
  );

  const stateGeoUnits = useMemo(
    () =>
      geoUnits.filter(
        (u) =>
          u.stateCode === selectedStateCode &&
          (!selectedLga || u.lga.toLowerCase() === selectedLga.toLowerCase())
      ),
    [geoUnits, selectedStateCode, selectedLga]
  );

  const statePersonnel = useMemo(
    () =>
      personnel.filter(
        (p) =>
          p.stateCode === selectedStateCode &&
          (!selectedLga || p.lga.toLowerCase() === selectedLga.toLowerCase())
      ),
    [personnel, selectedStateCode, selectedLga]
  );

  const handleValidateImport = () => {
    const existingCodes = new Set(geoUnits.map((u) => u.pollingUnitCode));
    const res = parseAndValidateGeoImport(rawImportText, importFormat, existingCodes);
    setPreviewResult(res);
  };

  const handleCommitImport = () => {
    if (!previewResult || previewResult.validRecords.length === 0) return;
    importGeoUnits(previewResult.validRecords, {
      fileName: importFileName,
      format: importFormat,
      duplicatesSkipped: previewResult.duplicates.length,
      errorsCount: previewResult.errors.length,
    });
    setPreviewResult(null);
    setViewMode('map');
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nigeria_wards_polling_units_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportStateGeo = () => {
    const csv = exportRowsToCsv(
      ['State Code', 'State Name', 'Zone', 'LGA Count', 'Personnel Assigned', 'Polling Units Imported', 'Open Incidents'],
      NIGERIA_STATES.map((s) => {
        const sum = stateSummaries[s.code];
        return [
          s.code,
          s.name,
          s.zone,
          s.lgas.length,
          sum?.personnelAssigned ?? 0,
          sum?.pollingUnitsImported ?? 0,
          sum?.openIncidents ?? 0,
        ];
      })
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nigeria_campaign_geographic_summary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Nigeria Geographic Operations & Geo-Database
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified hierarchy: Federal Republic of Nigeria → 36 States & FCT (37) → {totalLgas} Authentic LGAs → Imported Wards & Polling Units
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Interactive Map
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> 37-State Directory
            </button>
            <button
              type="button"
              onClick={() => setViewMode('import')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded ${
                viewMode === 'import'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Geo Import System
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportStateGeo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Administrative Search Bar across all 37 States & 774 LGAs */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={geoSearch}
            onChange={(e) => setGeoSearch(e.target.value)}
            placeholder="Search any Nigerian State, capital, or any of the 774 LGAs (e.g., Kankara, Daura, Ikeja, AMAC, Maiduguri)..."
            aria-label="Search Nigerian states and LGAs"
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          {geoSearch && (
            <button
              type="button"
              onClick={() => setGeoSearch('')}
              className="text-xs text-slate-500 hover:text-slate-900"
            >
              Clear
            </button>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="mt-1 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {searchResults.map((res, idx) => (
              <button
                key={`${res.stateCode}-${res.lgaName || 's'}-${idx}`}
                type="button"
                onClick={() => {
                  setSelectedStateCode(res.stateCode);
                  setSelectedLga(res.lgaName || '');
                  setGeoSearch('');
                  setViewMode('map');
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <span>
                  <strong className="text-slate-900 dark:text-white">
                    {res.type === 'LGA' ? `${res.lgaName} LGA` : `${res.stateName} State`}
                  </strong>
                  <span className="text-slate-500"> · {res.stateName} · {res.zone}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">{res.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mode 1: Map & Hierarchical Drill-Down */}
      {viewMode === 'map' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <div className="xl:col-span-7 space-y-4">
            <NigeriaMap
              stateSummaries={stateSummaries}
              selectedStateCode={selectedStateCode}
              onSelectState={(code) => {
                setSelectedStateCode(code);
                setSelectedLga('');
              }}
              layer="coverage"
            />

            {/* Imported Wards & Polling Units for Selected Area */}
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Wards & Polling Units — {selectedState?.name} {selectedLga ? `→ ${selectedLga} LGA` : '(All LGAs)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Official polling units are never fabricated. Upload official CSV/JSON/GeoJSON datasets via Geo Import System.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('import')}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Import Wards / PUs
                </button>
              </div>
              {stateGeoUnits.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No wards or polling units imported for {selectedLga || selectedState?.name} yet. Use the Geo Import System to upload verified INEC registers.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2 px-4 font-semibold">Code</th>
                        <th className="py-2 px-3 font-semibold">LGA / Ward</th>
                        <th className="py-2 px-3 font-semibold">Polling Unit</th>
                        <th className="py-2 px-4 font-semibold">Source Label</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {stateGeoUnits.map((u) => (
                        <tr key={u.id}>
                          <td className="py-2 px-4 font-mono text-[11px]">{u.pollingUnitCode}</td>
                          <td className="py-2 px-3">{u.lga} · {u.ward}</td>
                          <td className="py-2 px-3 font-medium">{u.pollingUnitName}</td>
                          <td className="py-2 px-4 text-[11px] text-slate-500">{u.sourceLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right: 774-LGA Drill-Down Selector & Assigned Personnel */}
          <div className="xl:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedState?.name} Local Government Areas ({selectedState?.lgas.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Click an LGA to filter wards, polling units, and assigned personnel
                  </p>
                </div>
                {selectedLga && (
                  <button
                    type="button"
                    onClick={() => setSelectedLga('')}
                    className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    Show All LGAs
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
                {selectedState?.lgas.map((lga) => {
                  const active = selectedLga === lga;
                  const count = personnel.filter(
                    (p) => p.stateCode === selectedStateCode && p.lga.toLowerCase() === lga.toLowerCase()
                  ).length;
                  return (
                    <button
                      key={lga}
                      type="button"
                      onClick={() => setSelectedLga(active ? '' : lga)}
                      className={`flex items-center justify-between px-2.5 py-2 rounded text-left text-xs border transition-colors ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-700 dark:border-emerald-700'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <span className="truncate pr-2">{lga}</span>
                      <span className="font-mono text-[10px] opacity-75 shrink-0">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold">
                  Assigned Personnel — {selectedLga || selectedState?.name} ({statePersonnel.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                {statePersonnel.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-500">
                    No personnel currently assigned to this area.
                  </div>
                ) : (
                  statePersonnel.map((p) => (
                    <div key={p.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{p.fullName}</div>
                        <div className="text-[11px] text-slate-500">{p.role} · {p.lga}</div>
                      </div>
                      <span className={p.checkedIn ? 'text-emerald-700 dark:text-emerald-400 text-[11px] font-medium' : 'text-slate-500 text-[11px]'}>
                        {p.checkedIn ? 'Checked In' : p.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Full 37-State Directory */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold">All 36 States & Federal Capital Territory ({filteredStates.length})</span>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              aria-label="Filter states by geopolitical zone"
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
            >
              <option value="All">All Geopolitical Zones</option>
              <option value="North-West">North-West</option>
              <option value="North-East">North-East</option>
              <option value="North-Central">North-Central</option>
              <option value="South-West">South-West</option>
              <option value="South-East">South-East</option>
              <option value="South-South">South-South</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">State</th>
                  <th className="py-2.5 px-3 font-semibold">Capital</th>
                  <th className="py-2.5 px-3 font-semibold">Zone</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Verified LGAs</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Personnel</th>
                  <th className="py-2.5 px-3 font-semibold text-right">PUs Imported</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStates.map((st) => {
                  const sum = stateSummaries[st.code];
                  return (
                    <tr key={st.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                        <span className="font-mono text-slate-400 mr-2">{st.code}</span>
                        {st.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{st.capital}</td>
                      <td className="py-2.5 px-3 text-slate-500">{st.zone}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{st.lgas.length}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{sum?.personnelAssigned ?? 0}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">{sum?.pollingUnitsImported ?? 0}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStateCode(st.code);
                            setSelectedLga('');
                            setViewMode('map');
                          }}
                          className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          Inspect LGAs
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode 3: CSV / JSON / GeoJSON Bulk Import System */}
      {viewMode === 'import' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Bulk Geography Import (Wards, Polling Units & Boundaries)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Validates every row against Nigeria&apos;s official 37 states & 774 LGAs with duplicate detection and rollback.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Download CSV Template
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Dataset Format</label>
                <select
                  value={importFormat}
                  onChange={(e) => setImportFormat(e.target.value as 'CSV' | 'JSON' | 'GeoJSON')}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                >
                  <option value="CSV">CSV (Comma-Separated Values)</option>
                  <option value="JSON">JSON Array</option>
                  <option value="GeoJSON">GeoJSON FeatureCollection</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Source File Name</label>
                <input
                  type="text"
                  value={importFileName}
                  onChange={(e) => setImportFileName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Paste Dataset Content or Upload File</label>
              <textarea
                rows={7}
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleValidateImport}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 rounded-md"
              >
                Validate & Preview Import
              </button>
              {previewResult && previewResult.validRecords.length > 0 && (
                <button
                  type="button"
                  onClick={handleCommitImport}
                  className="px-4 py-2 text-xs font-semibold text-white rounded-md"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Commit {previewResult.validRecords.length} Valid Record(s)
                </button>
              )}
            </div>

            {previewResult && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md space-y-2 text-xs">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Validation Summary: {previewResult.validRecords.length} Valid ·{' '}
                  {previewResult.duplicates.length} Duplicate(s) Skipped · {previewResult.errors.length} Error(s)
                </div>
                {previewResult.errors.length > 0 && (
                  <ul className="list-disc pl-5 text-red-700 dark:text-red-400 space-y-0.5">
                    {previewResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Import History & Rollback */}
          <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Import History & Rollback Ledger
            </h3>
            {importJobs.length === 0 ? (
              <p className="text-xs text-slate-500">
                No official geographic dataset imports executed in this session yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {importJobs.map((job) => (
                  <div key={job.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">{job.fileName}</div>
                      <div className="text-[11px] text-slate-500">
                        {job.format} · {job.recordsImported} imported · {job.duplicatesSkipped} skipped · {job.status}
                      </div>
                    </div>
                    {job.status === 'Completed' && (
                      <button
                        type="button"
                        onClick={() => rollbackImportJob(job.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-red-700 border border-red-200 rounded hover:bg-red-50"
                      >
                        <RotateCcw className="w-3 h-3" /> Rollback
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
