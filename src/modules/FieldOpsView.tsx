import React, { useState } from 'react';
import {
  CheckCircle2,
  CloudOff,
  CloudUpload,
  MapPin,
  Monitor,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { NIGERIA_STATES, STATE_BY_CODE } from '../data/nigeriaGeo';
import type { FieldCheckIn, FieldReport } from '../types/campaign';

export const FieldOpsView: React.FC = () => {
  const {
    branding,
    personnel,
    checkIns,
    submitCheckIn,
    fieldReports,
    submitFieldReport,
    isOfflineMode,
    setIsOfflineMode,
    offlineQueue,
    syncOfflineQueue,
    currentUser,
  } = useCampaign();

  const [mobilePreviewMode, setMobilePreviewMode] = useState(false);

  // Check-In Form State
  const fieldAgents = personnel.filter((p) => p.isFieldAgent || p.role.includes('Coordinator'));
  const [selectedPersonnelId, setSelectedPersonnelId] = useState(fieldAgents[0]?.id || 'per-06');
  const [checkInState, setCheckInState] = useState('KT');
  const [checkInLga, setCheckInLga] = useState('Kankara');
  const [checkInWard, setCheckInWard] = useState('Kankara Central');
  const [checkInStatus, setCheckInStatus] = useState<FieldCheckIn['status']>('Checked In');
  const [locationConsent, setLocationConsent] = useState(false);
  const [capturedCoords, setCapturedCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [checkInNote, setCheckInNote] = useState('');
  const [checkInMsg, setCheckInMsg] = useState<string | null>(null);

  // Field Report Form State
  const [reportType, setReportType] = useState<FieldReport['reportType']>('Routine Situation');
  const [reportState, setReportState] = useState('KT');
  const [reportLga, setReportLga] = useState('Katsina');
  const [reportWard, setReportWard] = useState('');
  const [reportUnit, setReportUnit] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const handleCaptureGps = () => {
    if (!locationConsent) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCapturedCoords({
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
          });
        },
        () => {
          const st = STATE_BY_CODE[checkInState];
          if (st) setCapturedCoords({ lat: st.lat, lng: st.lng });
        }
      );
    } else {
      const st = STATE_BY_CODE[checkInState];
      if (st) setCapturedCoords({ lat: st.lat, lng: st.lng });
    }
  };

  const handleSubmitCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInNote.trim()) {
      setCheckInMsg('Please enter brief operational notes before submitting check-in.');
      return;
    }
    const person = personnel.find((p) => p.id === selectedPersonnelId);
    submitCheckIn({
      personnelId: selectedPersonnelId,
      personnelName: person?.fullName || currentUser.displayName,
      stateCode: checkInState,
      lga: checkInLga,
      ward: checkInWard.trim() || 'General Ward Desk',
      status: checkInStatus,
      operationalNote: checkInNote.trim(),
      locationShared: locationConsent,
      coordinates: locationConsent ? capturedCoords : undefined,
      isDemo: false,
    });
    setCheckInNote('');
    setCheckInMsg(
      isOfflineMode
        ? 'Saved locally to Offline Sync Queue. Tap Sync Now when connectivity returns.'
        : 'Field check-in recorded and reflected in Situation Room.'
    );
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportError(null);
    setReportSuccess(null);
    if (reportSummary.trim().length < 10) {
      setReportError('Please provide an operational summary of at least 10 characters.');
      return;
    }
    submitFieldReport({
      reportType,
      stateCode: reportState,
      lga: reportLga,
      ward: reportWard.trim() || 'Unspecified Ward',
      pollingUnit: reportUnit.trim() || 'Ward Coordination Desk',
      summary: reportSummary.trim(),
      dataLabel: 'Campaign-Reported Data',
      status: 'Submitted',
      submitterName: currentUser.displayName,
      submitterUid: currentUser.uid,
      isDemo: false,
    });
    setReportSummary('');
    setReportWard('');
    setReportUnit('');
    setReportSuccess(
      isOfflineMode
        ? 'Field report stored in Offline Sync Queue.'
        : 'Field report submitted to Verification Desk.'
    );
  };

  const checkInLgas = STATE_BY_CODE[checkInState]?.lgas ?? [];
  const reportLgas = STATE_BY_CODE[reportState]?.lgas ?? [];

  return (
    <div className="space-y-5">
      {/* Header & Offline/Mobile Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Field Operations & Mobile PWA Console
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Permission-disclosed field check-ins, offline-first reporting queue, and real-time operational dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap ${
              isOfflineMode
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            {isOfflineMode ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            {isOfflineMode ? 'Offline Field Simulation: ON' : 'Connection: Online'}
          </button>

          {offlineQueue.length > 0 && (
            <button
              type="button"
              onClick={syncOfflineQueue}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-md whitespace-nowrap"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <CloudUpload className="w-3.5 h-3.5" /> Sync Queue ({offlineQueue.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobilePreviewMode((m) => !m)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 dark:bg-slate-800 text-white rounded-md whitespace-nowrap"
          >
            {mobilePreviewMode ? (
              <>
                <Monitor className="w-3.5 h-3.5" /> Desktop Operations View
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" /> Mobile Agent PWA View
              </>
            )}
          </button>
        </div>
      </div>

      {/* Offline Sync Queue Banner if pending items exist */}
      {offlineQueue.length > 0 && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <CloudOff className="w-4 h-4 shrink-0" />
            <span>
              <strong>{offlineQueue.length} item(s) stored locally in PWA Offline Queue.</strong> Ready for background sync when signal stabilizes.
            </span>
          </div>
          <button
            type="button"
            onClick={syncOfflineQueue}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 rounded-md"
          >
            Flush & Sync Now
          </button>
        </div>
      )}

      {/* Main Content: Either Mobile Field Frame or Full Desktop Split */}
      <div className={mobilePreviewMode ? 'max-w-md mx-auto space-y-4' : 'grid grid-cols-1 lg:grid-cols-12 gap-5'}>
        {/* Field Check-In Form */}
        <form
          onSubmit={handleSubmitCheckIn}
          className={`${mobilePreviewMode ? '' : 'lg:col-span-5'} bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-3.5`}
        >
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Field Personnel Check-In</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Location sharing is strictly opt-in, disclosed, and limited to operational coordination.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Field Agent / Coordinator</label>
            <select
              value={selectedPersonnelId}
              onChange={(e) => setSelectedPersonnelId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
            >
              {fieldAgents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName} ({a.role} · {a.stateCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">State</label>
              <select
                value={checkInState}
                onChange={(e) => {
                  const code = e.target.value;
                  setCheckInState(code);
                  setCheckInLga(STATE_BY_CODE[code]?.lgas[0] || '');
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                {NIGERIA_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">LGA</label>
              <select
                value={checkInLga}
                onChange={(e) => setCheckInLga(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                {checkInLgas.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Ward / Station</label>
              <input
                type="text"
                value={checkInWard}
                onChange={(e) => setCheckInWard(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Operational Status</label>
              <select
                value={checkInStatus}
                onChange={(e) => setCheckInStatus(e.target.value as FieldCheckIn['status'])}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                <option value="Checked In">Checked In</option>
                <option value="Checked Out">Checked Out</option>
                <option value="Assistance Requested">Assistance Requested</option>
                <option value="Connectivity Issue">Connectivity Issue</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md space-y-2">
            <label className="flex items-start gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={locationConsent}
                onChange={(e) => setLocationConsent(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-slate-700 dark:text-slate-300">
                I explicitly consent to attach my current GPS coordinates to this check-in for operational verification.
              </span>
            </label>
            {locationConsent && (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                >
                  <MapPin className="w-3 h-3" /> Capture GPS Point
                </button>
                {capturedCoords && (
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                    {capturedCoords.lat}, {capturedCoords.lng}
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Field Operational Notes</label>
            <textarea
              rows={3}
              value={checkInNote}
              onChange={(e) => setCheckInNote(e.target.value)}
              placeholder="Station readiness, comms status, or assistance details..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
            />
          </div>

          {checkInMsg && (
            <div className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {checkInMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 text-xs font-semibold text-white rounded-md"
            style={{ backgroundColor: branding.primaryColor }}
          >
            Submit Field Check-In
          </button>
        </form>

        {/* Submit Operational Field Report */}
        <form
          onSubmit={handleSubmitReport}
          className={`${mobilePreviewMode ? '' : 'lg:col-span-7'} bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md p-5 space-y-3.5`}
        >
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Submit Operational Field Report
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              All field reports enter the Verification Desk pipeline clearly labeled as Campaign-Reported Data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as FieldReport['reportType'])}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                <option>Routine Situation</option>
                <option>Logistics Status</option>
                <option>Community Engagement</option>
                <option>Polling Unit Opening</option>
                <option>Accreditation Update</option>
                <option>Closing & Counting Observation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">State</label>
              <select
                value={reportState}
                onChange={(e) => {
                  const code = e.target.value;
                  setReportState(code);
                  setReportLga(STATE_BY_CODE[code]?.lgas[0] || '');
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                {NIGERIA_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">LGA</label>
              <select
                value={reportLga}
                onChange={(e) => setReportLga(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                {reportLgas.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Ward</label>
              <input
                type="text"
                value={reportWard}
                onChange={(e) => setReportWard(e.target.value)}
                placeholder="Enter ward name"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Polling Unit / Desk Reference</label>
              <input
                type="text"
                value={reportUnit}
                onChange={(e) => setReportUnit(e.target.value)}
                placeholder="Optional unit code or venue"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Operational Report Summary *</label>
            <textarea
              rows={4}
              value={reportSummary}
              onChange={(e) => setReportSummary(e.target.value)}
              placeholder="Document objective field observations, attendance, logistics status, or coordination updates..."
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md"
            />
          </div>

          {reportError && <p className="text-xs text-red-600">{reportError}</p>}
          {reportSuccess && <p className="text-xs text-emerald-700 dark:text-emerald-400">{reportSuccess}</p>}

          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-semibold text-white rounded-md"
            style={{ backgroundColor: branding.primaryColor }}
          >
            Submit Field Report
          </button>
        </form>
      </div>

      {/* Live Check-In & Field Reports Log */}
      {!mobilePreviewMode && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold">Recent Field Check-In Stream ({checkIns.length})</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {checkIns.map((c) => (
                <div key={c.id} className="p-3.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">{c.personnelName}</span>
                    <span
                      className={`text-[11px] font-medium ${
                        c.status === 'Assistance Requested'
                          ? 'text-red-700 dark:text-red-400'
                          : c.status === 'Connectivity Issue'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {c.status} · {c.syncStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {c.stateCode} / {c.lga} · {c.ward}
                    {c.locationShared && c.coordinates && ` · GPS ${c.coordinates.lat}, ${c.coordinates.lng}`}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{c.operationalNote}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold">Submitted Field Reports ({fieldReports.length})</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {fieldReports.map((r) => (
                <div key={r.id} className="p-3.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-500">{r.refCode} · {r.reportType}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{r.status}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {r.stateCode} / {r.lga} · {r.dataLabel} · {r.syncStatus}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{r.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
