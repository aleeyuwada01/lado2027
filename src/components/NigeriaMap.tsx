import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Compass, Layers, RotateCcw } from 'lucide-react';
import { NIGERIA_STATES, STATE_BY_CODE } from '../data/nigeriaGeo';
import type { StateOperationalSummary } from '../lib/analytics';
import { CampaignLoader } from './CampaignLoader';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

export type MapLayerMode = 'coverage' | 'incidents' | 'reports';

interface NigeriaMapProps {
  stateSummaries: Record<string, StateOperationalSummary>;
  selectedStateCode: string;
  onSelectState: (stateCode: string) => void;
  layer: MapLayerMode;
  compact?: boolean;
}

const NIGERIA_CENTER: [number, number] = [8.15, 9.05];
const RAW_MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim() || '';
const HAS_VALID_MAPBOX_TOKEN = RAW_MAPBOX_TOKEN.startsWith('pk.');

function createNationalStyle(theme: 'dark' | 'light'): maplibregl.StyleSpecification {
  if (HAS_VALID_MAPBOX_TOKEN) {
    const styleId = theme === 'dark' ? 'dark-v11' : 'light-v11';
    return {
      version: 8,
      sources: {
        mapboxRaster: {
          type: 'raster',
          tiles: [
            `https://api.mapbox.com/styles/v1/mapbox/${styleId}/tiles/512/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(
              RAW_MAPBOX_TOKEN
            )}`,
          ],
          tileSize: 512,
          attribution: '© Mapbox · © OpenStreetMap contributors',
        },
      },
      layers: [
        { id: 'mapbox-base-layer', type: 'raster', source: 'mapboxRaster', minzoom: 0, maxzoom: 18 },
      ],
    };
  }

  const isDark = theme === 'dark';
  const baseService = isDark ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base';
  const refService = isDark ? 'World_Dark_Gray_Reference' : 'World_Light_Gray_Reference';

  return {
    version: 8,
    sources: {
      esriBase: {
        type: 'raster',
        tiles: [
          `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${baseService}/MapServer/tile/{z}/{y}/{x}`,
        ],
        tileSize: 256,
        attribution: 'Tiles © Esri — Esri, HERE, Garmin, OpenStreetMap contributors',
      },
      esriLabels: {
        type: 'raster',
        tiles: [
          `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${refService}/MapServer/tile/{z}/{y}/{x}`,
        ],
        tileSize: 256,
      },
    },
    layers: [
      { id: 'esri-base', type: 'raster', source: 'esriBase', minzoom: 0, maxzoom: 16 },
      { id: 'esri-labels', type: 'raster', source: 'esriLabels', minzoom: 0, maxzoom: 16 },
    ],
  };
}

export const NigeriaMap: React.FC<NigeriaMapProps> = ({
  stateSummaries,
  selectedStateCode,
  onSelectState,
  layer,
  compact = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Array<{ code: string; marker: maplibregl.Marker; el: HTMLButtonElement }>>([]);
  const onSelectRef = useRef(onSelectState);
  onSelectRef.current = onSelectState;

  const [basemap, setBasemap] = useState<'dark' | 'light'>('dark');
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);

  const selectedSummary = stateSummaries[selectedStateCode];
  const hoveredSummary = hoveredCode ? stateSummaries[hoveredCode] : null;
  const activeInspect = hoveredSummary ?? selectedSummary;

  const getMarkerColors = useMemo(
    () =>
      (code: string, isSelected: boolean): { bg: string; ring: string; text: string } => {
        const s = stateSummaries[code];
        if (!s) return { bg: '#334155', ring: '#64748B', text: '#F8FAFC' };

        if (layer === 'incidents') {
          if (s.criticalIncidents > 0) return { bg: '#B91C1C', ring: '#FCA5A5', text: '#FFFFFF' };
          if (s.openIncidents > 0) return { bg: '#D97706', ring: '#FDE68A', text: '#FFFFFF' };
          return { bg: isSelected ? '#0D5C38' : '#334155', ring: isSelected ? '#6EE7B7' : '#64748B', text: '#F8FAFC' };
        }
        if (layer === 'reports') {
          if (s.reportsSubmitted >= 2) return { bg: '#0D5C38', ring: '#6EE7B7', text: '#FFFFFF' };
          if (s.reportsSubmitted === 1) return { bg: '#1D4ED8', ring: '#93C5FD', text: '#FFFFFF' };
          return { bg: isSelected ? '#0D5C38' : '#334155', ring: isSelected ? '#6EE7B7' : '#64748B', text: '#F8FAFC' };
        }
        if (s.personnelAssigned >= 4) return { bg: '#0D5C38', ring: '#6EE7B7', text: '#FFFFFF' };
        if (s.personnelAssigned >= 1) return { bg: '#15803D', ring: '#86EFAC', text: '#FFFFFF' };
        return { bg: isSelected ? '#1E3A5F' : '#334155', ring: isSelected ? '#93C5FD' : '#64748B', text: '#F1F5F9' };
      },
    [stateSummaries, layer]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: maplibregl.Map | null = null;
    setMapReady(false);
    const readyFallback = window.setTimeout(() => setMapReady(true), 1800);
    try {
      map = new maplibregl.Map({
        container,
        style: createNationalStyle(basemap),
        center: NIGERIA_CENTER,
        zoom: compact ? 4.55 : 4.95,
        minZoom: 4.0,
        maxZoom: 11,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      map.on('load', () => setMapReady(true));
      mapRef.current = map;

      const createdMarkers: Array<{ code: string; marker: maplibregl.Marker; el: HTMLButtonElement }> = [];
      for (const st of NIGERIA_STATES) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', `Select ${st.name} State (${st.lgas.length} LGAs)`);
        btn.dataset.stateCode = st.code;
        btn.textContent = st.code;
        btn.style.width = '28px';
        btn.style.height = '28px';
        btn.style.borderRadius = '9999px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.fontFamily = 'var(--font-mono), monospace';
        btn.style.fontSize = '10px';
        btn.style.fontWeight = '700';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 140ms ease';
        btn.style.border = '2px solid rgba(255,255,255,0.6)';

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectRef.current(st.code);
          map?.flyTo({
            center: [st.lng, st.lat],
            zoom: compact ? 6.1 : 6.6,
            duration: 650,
            essential: true,
          });
        });

        btn.addEventListener('mouseenter', () => {
          setHoveredCode(st.code);
          btn.style.transform = 'scale(1.18)';
        });

        btn.addEventListener('mouseleave', () => {
          setHoveredCode(null);
          btn.style.transform = 'scale(1)';
        });

        const marker = new maplibregl.Marker({ element: btn, anchor: 'center' })
          .setLngLat([st.lng, st.lat])
          .addTo(map);

        createdMarkers.push({ code: st.code, marker, el: btn });
      }
      markersRef.current = createdMarkers;
      setWebglError(null);
    } catch (err) {
      setWebglError(err instanceof Error ? err.message : 'Interactive WebGL map unavailable in this browser.');
    }

    return () => {
      window.clearTimeout(readyFallback);
      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current = [];
      if (map) {
        map.remove();
      }
      mapRef.current = null;
    };
  }, [basemap, compact]);

  useEffect(() => {
    for (const item of markersRef.current) {
      const isSelected = item.code === selectedStateCode;
      const summary = stateSummaries[item.code];
      const colors = getMarkerColors(item.code, isSelected);

      item.el.style.backgroundColor = colors.bg;
      item.el.style.color = colors.text;
      item.el.style.borderColor = isSelected ? '#F59E0B' : colors.ring;
      item.el.style.borderWidth = isSelected ? '2.5px' : '1.5px';
      item.el.style.width = isSelected ? '32px' : '26px';
      item.el.style.height = isSelected ? '32px' : '26px';
      item.el.style.zIndex = isSelected ? '15' : summary && summary.openIncidents > 0 ? '8' : '2';
      item.el.style.boxShadow = isSelected
        ? '0 0 0 4px rgba(245, 158, 11, 0.32), 0 4px 12px rgba(0, 0, 0, 0.45)'
        : '0 2px 6px rgba(0, 0, 0, 0.35)';
    }
  }, [selectedStateCode, stateSummaries, getMarkerColors]);

  useEffect(() => {
    const map = mapRef.current;
    const st = STATE_BY_CODE[selectedStateCode];
    if (!map || !st) return;
    if (map.getZoom() > 5.5) {
      map.easeTo({ center: [st.lng, st.lat], duration: 500 });
    }
  }, [selectedStateCode]);

  const handleResetView = () => {
    mapRef.current?.flyTo({
      center: NIGERIA_CENTER,
      zoom: compact ? 4.55 : 4.95,
      pitch: 0,
      bearing: 0,
      duration: 600,
    });
  };

  return (
    <div className="relative w-full bg-[#0A0F1A] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs isolate z-0">
      {/* Crisp Tactical Map Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 bg-[#0A0F1A] border-b border-slate-800 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 font-semibold text-white">
            <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Nigeria Interactive Mapbox GL
          </span>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <span className="text-slate-400 whitespace-nowrap">36 States & FCT · 774 LGAs</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setBasemap((b) => (b === 'dark' ? 'light' : 'dark'))}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
          >
            <Layers className="w-3 h-3" />
            {basemap === 'dark' ? 'Light Map' : 'Dark Map'}
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3 h-3" />
            Reset View
          </button>
        </div>
      </div>

      {/* Isolated, Overflow-Clipped WebGL Viewport */}
      <div className={`relative w-full overflow-hidden isolate ${compact ? 'h-[340px]' : 'h-[450px]'}`}>
        {webglError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#0B1324] text-slate-300">
            <p className="text-sm font-semibold text-white">Interactive Mapbox GL Viewport</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md">{webglError}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-2xl">
              {NIGERIA_STATES.map((st) => (
                <button
                  key={st.code}
                  type="button"
                  onClick={() => onSelectState(st.code)}
                  className={`px-2 py-1 text-[11px] font-mono rounded border ${
                    selectedStateCode === st.code
                      ? 'bg-emerald-700 text-white border-emerald-500'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {st.code}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div
              ref={containerRef}
              className="w-full h-full"
              aria-label="Interactive Mapbox GL Operations Map of Nigeria 36 States and FCT"
            />
            {!mapReady && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#090F1E]/88 backdrop-blur-xs">
                <CampaignLoader
                  variant="inline"
                  tone="dark"
                  statusText="Loading Nigeria 36+FCT Operations Map..."
                />
              </div>
            )}
          </>
        )}

        {/* Crisp Floating Selected/Hovered State Telemetry Card */}
        {activeInspect && !webglError && (
          <div className="pointer-events-none absolute left-3 bottom-3 z-20 bg-[#0A0F1A]/92 backdrop-blur-sm border border-slate-700/90 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 max-w-[260px] shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-white truncate">
                {activeInspect.stateName} ({activeInspect.stateCode})
              </span>
              <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                {activeInspect.lgaCount} LGAs
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{activeInspect.zone}</div>
            <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 font-mono tabular-nums text-[11px]">
              <div>
                <div className="text-[10px] text-slate-400 font-sans">Personnel</div>
                <div className="font-semibold text-white">{activeInspect.personnelAssigned}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-sans">Checked In</div>
                <div className="font-semibold text-emerald-400">
                  {activeInspect.agentsCheckedIn}/{activeInspect.agentsTotal}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-sans">Incidents</div>
                <div
                  className={`font-semibold ${
                    activeInspect.openIncidents > 0 ? 'text-red-400' : 'text-slate-300'
                  }`}
                >
                  {activeInspect.openIncidents}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0A0F1A] border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          {layer === 'coverage' && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D5C38] border border-emerald-300/60" />
                High Deployment (4+)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] border border-emerald-200/50" />
                Active Presence (1–3)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#334155] border border-slate-500" />
                Standby
              </span>
            </>
          )}
          {layer === 'incidents' && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]" />
                Critical Incident
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                Open Incident
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#334155]" />
                Nominal
              </span>
            </>
          )}
          {layer === 'reports' && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D5C38]" />
                Multiple Field Reports
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]" />
                Report Submitted
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#334155]" />
                Awaiting Reports
              </span>
            </>
          )}
        </div>
        <span className="text-slate-500">
          {HAS_VALID_MAPBOX_TOKEN ? 'Mapbox GL Styles' : 'Mapbox GL Compatible · Click any state marker to zoom'}
        </span>
      </div>
    </div>
  );
};
