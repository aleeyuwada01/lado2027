import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box, Flame, Layers, Map as MapIcon, MapPin, RotateCcw } from 'lucide-react';
import {
  buildKatsinaCorridorsGeoJson,
  buildKatsinaGeoJson,
  buildKatsinaZonePolygonsGeoJson,
  type KatsinaSimulationOutput,
  type LgaSimulationResult,
} from '../lib/electionSimulator';
import type { KatsinaSenatorialZone } from '../data/katsinaInecData';
import { CampaignLoader } from './CampaignLoader';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

export type KatsinaVizMode = 'simulation' | 'density' | 'wards' | 'reach';

interface KatsinaMapboxVizProps {
  simulation: KatsinaSimulationOutput;
  selectedLgaId: string;
  onSelectLga: (lgaId: string) => void;
  heightClass?: string;
}

const KATSINA_CENTER: [number, number] = [7.72, 12.24];
const KATSINA_DEFAULT_ZOOM = 7.4;
const RAW_MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined)?.trim() || '';
const HAS_VALID_MAPBOX_TOKEN = RAW_MAPBOX_TOKEN.startsWith('pk.');

const ZONE_CAMERA: Record<'ALL' | KatsinaSenatorialZone, { center: [number, number]; zoom: number }> = {
  ALL: { center: KATSINA_CENTER, zoom: KATSINA_DEFAULT_ZOOM },
  'Katsina South': { center: [7.42, 11.62], zoom: 8.35 },
  'Katsina Central': { center: [7.52, 12.74], zoom: 8.4 },
  'Katsina North': { center: [8.18, 12.84], zoom: 8.35 },
};

const LGA_SHORT_CODES: Record<string, string> = {
  bakori: 'BAK',
  batagarawa: 'BTG',
  batsari: 'BTS',
  baure: 'BAU',
  bindawa: 'BND',
  charanchi: 'CHR',
  dandume: 'DDM',
  danja: 'DNJ',
  'dan-musa': 'DMS',
  daura: 'DRA',
  dutsi: 'DTS',
  'dutsin-ma': 'DTM',
  faskari: 'FSK',
  funtua: 'FNT',
  ingawa: 'ING',
  jibia: 'JIB',
  kafur: 'KFR',
  kaita: 'KTA',
  kankara: 'KKR',
  kankia: 'KKI',
  katsina: 'KTS',
  kurfi: 'KRF',
  kusada: 'KSD',
  'mai-adua': 'MAD',
  malumfashi: 'MLF',
  mani: 'MNI',
  mashi: 'MSH',
  matazu: 'MTZ',
  musawa: 'MSW',
  rimi: 'RMI',
  sabuwa: 'SBW',
  safana: 'SFN',
  sandamu: 'SND',
  zango: 'ZNG',
};

function createBasemapStyle(theme: 'dark' | 'light'): maplibregl.StyleSpecification {
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
        {
          id: 'mapbox-base-layer',
          type: 'raster',
          source: 'mapboxRaster',
          minzoom: 0,
          maxzoom: 18,
        },
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

function getLgaVisualAccent(
  item: LgaSimulationResult,
  mode: KatsinaVizMode
): { fill: string; border: string } {
  if (mode === 'simulation') {
    if (item.winner === 'PDP') {
      if (item.pdpSharePct >= 58) return { fill: '#0D5C38', border: '#6EE7B7' };
      return { fill: '#15803D', border: '#86EFAC' };
    }
    if (item.winner === 'APC') return { fill: '#0284C7', border: '#7DD3FC' };
    return { fill: '#D97706', border: '#FDE68A' };
  }
  if (mode === 'density') {
    if (item.lga.registeredVoters >= 145000) return { fill: '#0F766E', border: '#5EEAD4' };
    if (item.lga.registeredVoters >= 100000) return { fill: '#0D5C38', border: '#6EE7B7' };
    return { fill: '#334155', border: '#94A3B8' };
  }
  if (mode === 'wards') {
    if (item.wardCapturePct >= 82) return { fill: '#0D5C38', border: '#6EE7B7' };
    if (item.wardCapturePct >= 65) return { fill: '#15803D', border: '#86EFAC' };
    return { fill: '#B45309', border: '#FCD34D' };
  }
  const remainingWards = item.lga.wardCount - item.pdpWardsWon;
  if (remainingWards >= 3 && item.lga.registeredVoters >= 95000) {
    return { fill: '#B91C1C', border: '#FCA5A5' };
  }
  if (remainingWards >= 2) {
    return { fill: '#D97706', border: '#FDE68A' };
  }
  return { fill: '#0D5C38', border: '#6EE7B7' };
}

export const KatsinaMapboxViz: React.FC<KatsinaMapboxVizProps> = ({
  simulation,
  selectedLgaId,
  onSelectLga,
  heightClass = 'h-[360px] sm:h-[460px] xl:h-[540px]',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const styleReadyRef = useRef<boolean>(false);
  const markersRef = useRef<
    Array<{ id: string; marker: maplibregl.Marker; el: HTMLButtonElement; labelSpan: HTMLSpanElement }>
  >([]);
  const onSelectRef = useRef(onSelectLga);
  onSelectRef.current = onSelectLga;

  const [vizMode, setVizMode] = useState<KatsinaVizMode>('simulation');
  const [zoneFilter, setZoneFilter] = useState<'ALL' | KatsinaSenatorialZone>('ALL');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showTerritories, setShowTerritories] = useState<boolean>(true);
  const [is3dTilt, setIs3dTilt] = useState<boolean>(false);
  const [basemap, setBasemap] = useState<'dark' | 'light'>('dark');
  const [hoveredLgaId, setHoveredLgaId] = useState<string | null>(null);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);

  const geoJson = useMemo(() => buildKatsinaGeoJson(simulation), [simulation]);
  const territoriesGeoJson = useMemo(() => buildKatsinaZonePolygonsGeoJson(simulation), [simulation]);
  const corridorsGeoJson = useMemo(() => buildKatsinaCorridorsGeoJson(simulation), [simulation]);

  const geoJsonRef = useRef(geoJson);
  geoJsonRef.current = geoJson;
  const territoriesRef = useRef(territoriesGeoJson);
  territoriesRef.current = territoriesGeoJson;
  const corridorsRef = useRef(corridorsGeoJson);
  corridorsRef.current = corridorsGeoJson;

  const activeLga =
    (hoveredLgaId ? simulation.lgaById[hoveredLgaId] : null) ??
    simulation.lgaById[selectedLgaId] ??
    simulation.lgas[0];

  // Mount Executive Mapbox GL Viewport with Territory Polygons, Command Corridors, Heatmap & Multi-Ring Radar Circles
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    styleReadyRef.current = false;
    setMapReady(false);
    let map: maplibregl.Map | null = null;
    const readyFallback = window.setTimeout(() => setMapReady(true), 1800);

    try {
      const isMobileViewport = window.innerWidth < 640;
      map = new maplibregl.Map({
        container,
        style: createBasemapStyle(basemap),
        center: isMobileViewport ? [7.68, 12.16] : KATSINA_CENTER,
        zoom: isMobileViewport ? 6.55 : KATSINA_DEFAULT_ZOOM,
        minZoom: 6.0,
        maxZoom: 11.5,
        pitch: is3dTilt ? 42 : 0,
        bearing: is3dTilt ? -10 : 0,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
      mapRef.current = map;

      const mountGeoLayers = () => {
        if (!map) return;

        // Source 1: Katsina State Perimeter + 3 Senatorial Zone Territory Polygons
        if (!map.getSource('katsina-territories')) {
          map.addSource('katsina-territories', {
            type: 'geojson',
            data: territoriesRef.current as unknown as Parameters<maplibregl.GeoJSONSource['setData']>[0],
          });
        }

        // Source 2: Strategic Zonal Command Corridors
        if (!map.getSource('katsina-corridors')) {
          map.addSource('katsina-corridors', {
            type: 'geojson',
            data: corridorsRef.current as unknown as Parameters<maplibregl.GeoJSONSource['setData']>[0],
          });
        }

        // Source 3: All 34 Katsina LGA INEC Telemetry Points
        if (!map.getSource('katsina-lgas')) {
          map.addSource('katsina-lgas', {
            type: 'geojson',
            data: geoJsonRef.current as unknown as Parameters<maplibregl.GeoJSONSource['setData']>[0],
          });
        }

        // Layer 1: Senatorial Zone Soft Territory Fills
        if (!map.getLayer('katsina-zone-fill')) {
          map.addLayer({
            id: 'katsina-zone-fill',
            type: 'fill',
            source: 'katsina-territories',
            filter: ['==', ['get', 'kind'], 'zone'],
            paint: {
              'fill-color': [
                'match',
                ['get', 'name'],
                'Katsina South',
                '#10B981',
                'Katsina Central',
                '#059669',
                'Katsina North',
                '#0D9488',
                '#10B981',
              ],
              'fill-opacity': basemap === 'dark' ? 0.13 : 0.11,
            },
          });
        }

        // Layer 2: Dashed Senatorial Zone Outlines
        if (!map.getLayer('katsina-zone-outline')) {
          map.addLayer({
            id: 'katsina-zone-outline',
            type: 'line',
            source: 'katsina-territories',
            filter: ['==', ['get', 'kind'], 'zone'],
            paint: {
              'line-color': basemap === 'dark' ? '#34D399' : '#047857',
              'line-width': 1.25,
              'line-dasharray': [3, 2],
              'line-opacity': 0.52,
            },
          });
        }

        // Layer 3: Crisp Katsina State Outer Perimeter
        if (!map.getLayer('katsina-state-border')) {
          map.addLayer({
            id: 'katsina-state-border',
            type: 'line',
            source: 'katsina-territories',
            filter: ['==', ['get', 'kind'], 'state'],
            paint: {
              'line-color': basemap === 'dark' ? '#6EE7B7' : '#065F46',
              'line-width': 2.2,
              'line-opacity': 0.78,
            },
          });
        }

        // Layer 4: Strategic Zonal Command Corridor Glow & Line
        if (!map.getLayer('katsina-corridors-glow')) {
          map.addLayer({
            id: 'katsina-corridors-glow',
            type: 'line',
            source: 'katsina-corridors',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': '#10B981',
              'line-width': 5.5,
              'line-opacity': 0.18,
            },
          });
        }

        if (!map.getLayer('katsina-corridors-line')) {
          map.addLayer({
            id: 'katsina-corridors-line',
            type: 'line',
            source: 'katsina-corridors',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': basemap === 'dark' ? '#A7F3D0' : '#0D5C38',
              'line-width': 1.6,
              'line-dasharray': [2, 2],
              'line-opacity': 0.75,
            },
          });
        }

        // Layer 5: Native WebGL Heatmap Layer for voter density & Lado victory intensity
        if (!map.getLayer('katsina-heatmap')) {
          map.addLayer({
            id: 'katsina-heatmap',
            type: 'heatmap',
            source: 'katsina-lgas',
            paint: {
              'heatmap-weight': ['interpolate', ['linear'], ['get', 'pdpStrengthWeight'], 0, 0.28, 1, 1],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 6, 0.9, 10, 1.35],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 6, 36, 10, 68],
              'heatmap-opacity': 0.46,
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0,
                'rgba(13, 92, 56, 0)',
                0.22,
                'rgba(16, 185, 129, 0.24)',
                0.52,
                'rgba(13, 92, 56, 0.5)',
                0.78,
                'rgba(245, 158, 11, 0.58)',
                1,
                'rgba(16, 185, 129, 0.82)',
              ],
            },
          });
        }

        // Layer 6: Outer Radar Reach Ring (subtle concentric cartographic echo)
        if (!map.getLayer('katsina-voter-outer-ring')) {
          map.addLayer({
            id: 'katsina-voter-outer-ring',
            type: 'circle',
            source: 'katsina-lgas',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'registeredVoters'],
                60000,
                22,
                140000,
                34,
                296000,
                50,
              ],
              'circle-color': 'rgba(16, 185, 129, 0)',
              'circle-stroke-width': 1,
              'circle-stroke-color': [
                'match',
                ['get', 'winner'],
                'PDP',
                '#34D399',
                'APC',
                '#38BDF8',
                'ADC',
                '#FBBF24',
                '#94A3B8',
              ],
              'circle-stroke-opacity': 0.28,
            },
          });
        }

        // Layer 7: Proportional Inner Reach Halo (scaled strictly by exact INEC registered voters)
        if (!map.getLayer('katsina-voter-halo')) {
          map.addLayer({
            id: 'katsina-voter-halo',
            type: 'circle',
            source: 'katsina-lgas',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'registeredVoters'],
                60000,
                15,
                140000,
                25,
                296000,
                38,
              ],
              'circle-color': [
                'match',
                ['get', 'winner'],
                'PDP',
                '#10B981',
                'APC',
                '#0284C7',
                'ADC',
                '#D97706',
                '#64748B',
              ],
              'circle-opacity': 0.24,
              'circle-stroke-width': 1.35,
              'circle-stroke-color': [
                'match',
                ['get', 'winner'],
                'PDP',
                '#6EE7B7',
                'APC',
                '#7DD3FC',
                'ADC',
                '#FDE68A',
                '#94A3B8',
              ],
              'circle-stroke-opacity': 0.68,
            },
          });
        }

        styleReadyRef.current = true;
        setMapReady(true);
      };

      map.on('load', mountGeoLayers);

      // Mount crisp, non-overlapping interactive markers for all 34 Katsina LGAs
      const created: Array<{
        id: string;
        marker: maplibregl.Marker;
        el: HTMLButtonElement;
        labelSpan: HTMLSpanElement;
      }> = [];

      for (const item of simulation.lgas) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.lgaId = item.lga.id;
        btn.setAttribute(
          'aria-label',
          `Inspect ${item.lga.name} LGA (${item.lga.wardCount} wards, ${item.lga.registeredVoters.toLocaleString()} registered voters)`
        );
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.borderRadius = '9999px';
        btn.style.fontFamily = 'var(--font-display), "Instrument Sans", sans-serif';
        btn.style.fontSize = '9.5px';
        btn.style.fontWeight = '700';
        btn.style.lineHeight = '1';
        btn.style.cursor = 'pointer';
        btn.style.whiteSpace = 'nowrap';
        btn.style.transition = 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1), opacity 140ms ease';

        const labelSpan = document.createElement('span');
        labelSpan.textContent = LGA_SHORT_CODES[item.lga.id] ?? item.lga.name.slice(0, 3).toUpperCase();
        btn.appendChild(labelSpan);

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectRef.current(item.lga.id);
          map?.flyTo({
            center: [item.lga.lng, item.lga.lat],
            zoom: 8.65,
            duration: 600,
            essential: true,
          });
        });

        btn.addEventListener('mouseenter', () => {
          setHoveredLgaId(item.lga.id);
          btn.style.transform = 'scale(1.14)';
        });

        btn.addEventListener('mouseleave', () => {
          setHoveredLgaId(null);
          btn.style.transform = 'scale(1)';
        });

        const marker = new maplibregl.Marker({ element: btn, anchor: 'center' })
          .setLngLat([item.lga.lng, item.lga.lat])
          .addTo(map);

        created.push({ id: item.lga.id, marker, el: btn, labelSpan });
      }

      markersRef.current = created;
      setWebglError(null);
    } catch (err) {
      setWebglError(err instanceof Error ? err.message : 'Interactive Mapbox GL viewport unavailable.');
    }

    return () => {
      window.clearTimeout(readyFallback);
      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current = [];
      if (map) {
        map.remove();
      }
      mapRef.current = null;
      styleReadyRef.current = false;
    };
  }, [basemap]);

  // Synchronize live simulation GeoJSON, Territory Overlays, Heatmap, and 34 LGA marker states
  useEffect(() => {
    const map = mapRef.current;
    if (map && styleReadyRef.current) {
      const lgaSrc = map.getSource('katsina-lgas') as maplibregl.GeoJSONSource | undefined;
      if (lgaSrc) {
        lgaSrc.setData(geoJson as unknown as Parameters<maplibregl.GeoJSONSource['setData']>[0]);
      }

      const terrSrc = map.getSource('katsina-territories') as maplibregl.GeoJSONSource | undefined;
      if (terrSrc) {
        terrSrc.setData(territoriesGeoJson as unknown as Parameters<maplibregl.GeoJSONSource['setData']>[0]);
      }

      const corrSrc = map.getSource('katsina-corridors') as maplibregl.GeoJSONSource | undefined;
      if (corrSrc) {
        corrSrc.setData(corridorsGeoJson as unknown as Parameters<maplibregl.GeoJSONSource['setData']>[0]);
      }

      const territoryVis = showTerritories ? 'visible' : 'none';
      for (const layerId of [
        'katsina-zone-fill',
        'katsina-zone-outline',
        'katsina-state-border',
        'katsina-corridors-glow',
        'katsina-corridors-line',
      ]) {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', territoryVis);
        }
      }

      if (map.getLayer('katsina-heatmap')) {
        map.setLayoutProperty('katsina-heatmap', 'visibility', showHeatmap ? 'visible' : 'none');
        const weightProp =
          vizMode === 'density'
            ? 'voterWeight'
            : vizMode === 'reach'
              ? 'swingOpportunityWeight'
              : 'pdpStrengthWeight';
        map.setPaintProperty('katsina-heatmap', 'heatmap-weight', [
          'interpolate',
          ['linear'],
          ['get', weightProp],
          0,
          0.28,
          1,
          1,
        ]);
      }
    }

    for (const m of markersRef.current) {
      const item = simulation.lgaById[m.id];
      if (!item) continue;
      const isSelected = m.id === selectedLgaId;
      const inZone = zoneFilter === 'ALL' || item.lga.zone === zoneFilter;
      const accent = getLgaVisualAccent(item, vizMode);
      const shortCode = LGA_SHORT_CODES[m.id] ?? item.lga.name.slice(0, 3).toUpperCase();

      if (isSelected) {
        m.labelSpan.textContent = `${item.lga.name} · ${item.pdpWardsWon}/${item.lga.wardCount}`;
        m.el.style.padding = '4px 9px';
        m.el.style.minWidth = 'auto';
        m.el.style.height = '24px';
        m.el.style.fontSize = '10.5px';
      } else {
        m.labelSpan.textContent = shortCode;
        m.el.style.padding = '0 5px';
        m.el.style.minWidth = '28px';
        m.el.style.height = '22px';
        m.el.style.fontSize = '9px';
      }

      m.el.style.backgroundColor = accent.fill;
      m.el.style.color = '#FFFFFF';
      m.el.style.border = isSelected ? '2px solid #F59E0B' : `1.5px solid ${accent.border}`;
      m.el.style.opacity = inZone ? '1' : '0.26';
      m.el.style.zIndex = isSelected ? '15' : inZone ? '5' : '1';
      m.el.style.boxShadow = isSelected
        ? '0 0 0 4px rgba(245, 158, 11, 0.34), 0 4px 12px rgba(0, 0, 0, 0.5)'
        : '0 2px 5px rgba(0, 0, 0, 0.35)';
    }
  }, [geoJson, territoriesGeoJson, corridorsGeoJson, simulation, selectedLgaId, vizMode, zoneFilter, showHeatmap, showTerritories]);

  const handleToggle3d = () => {
    const next = !is3dTilt;
    setIs3dTilt(next);
    mapRef.current?.easeTo({
      pitch: next ? 42 : 0,
      bearing: next ? -10 : 0,
      duration: 550,
    });
  };

  const handleZoneSelect = (zone: 'ALL' | KatsinaSenatorialZone) => {
    setZoneFilter(zone);
    const cam = ZONE_CAMERA[zone];
    mapRef.current?.flyTo({
      center: cam.center,
      zoom: cam.zoom,
      duration: 650,
      essential: true,
    });
  };

  const handleQuickLgaSelect = (lgaId: string) => {
    onSelectLga(lgaId);
    const lga = simulation.lgaById[lgaId]?.lga;
    if (lga) {
      mapRef.current?.flyTo({
        center: [lga.lng, lga.lat],
        zoom: 8.65,
        duration: 600,
        essential: true,
      });
    }
  };

  const handleReset = () => {
    setZoneFilter('ALL');
    setIs3dTilt(false);
    const isMobileViewport = window.innerWidth < 640;
    mapRef.current?.flyTo({
      center: isMobileViewport ? [7.68, 12.16] : KATSINA_CENTER,
      zoom: isMobileViewport ? 6.55 : KATSINA_DEFAULT_ZOOM,
      pitch: 0,
      bearing: 0,
      duration: 650,
    });
  };

  const renderTelemetryBody = () => {
    if (!activeLga) return null;
    return (
      <>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-white text-sm leading-tight truncate">
              {activeLga.lga.name} LGA
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {activeLga.lga.zone} · INEC {activeLga.lga.inecCode}
            </div>
          </div>
          <span
            className={`text-[11px] font-mono font-bold shrink-0 ${
              activeLga.winner === 'PDP'
                ? 'text-emerald-400'
                : activeLga.winner === 'APC'
                  ? 'text-sky-400'
                  : 'text-amber-400'
            }`}
          >
            {activeLga.winner} +{Math.abs(activeLga.marginVotes).toLocaleString()}
          </span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-800 grid grid-cols-3 gap-2 font-mono tabular-nums text-[11px]">
          <div>
            <div className="text-[10px] text-slate-400 font-sans">INEC Voters</div>
            <div className="font-semibold text-white">
              {activeLga.lga.registeredVoters.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-sans">Wards Won</div>
            <div className="font-semibold text-emerald-400">
              {activeLga.pdpWardsWon}/{activeLga.lga.wardCount}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-sans">Polling Units</div>
            <div className="font-semibold text-slate-200">{activeLga.lga.pollingUnits}</div>
          </div>
        </div>

        <div className="mt-2.5 space-y-1">
          <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-slate-800">
            <div style={{ width: `${activeLga.pdpSharePct}%` }} className="bg-emerald-500" />
            <div style={{ width: `${activeLga.apcSharePct}%` }} className="bg-sky-500" />
            <div style={{ width: `${activeLga.adcSharePct}%` }} className="bg-amber-500" />
            <div style={{ width: `${activeLga.othersSharePct}%` }} className="bg-slate-500" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-300">
            <span className="text-emerald-400">PDP {activeLga.pdpSharePct}%</span>
            <span className="text-sky-400">APC {activeLga.apcSharePct}%</span>
            <span className="text-amber-400">ADC {activeLga.adcSharePct}%</span>
            <span className="text-slate-400">OTH {activeLga.othersSharePct}%</span>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="relative w-full bg-[#0A0F1A] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs isolate z-0">
      {/* Top Map Visualization Control Strip (Mobile-First Responsive) */}
      <div className="px-3.5 sm:px-4 py-3 bg-[#0A0F1A] border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 font-semibold text-white whitespace-nowrap">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Katsina Mapbox GL · 34 LGAs
          </span>
          <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
          <div className="inline-flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg overflow-x-auto no-scrollbar max-w-full">
            {(
              [
                ['simulation', 'Victory'],
                ['density', 'Density'],
                ['wards', 'Wards'],
                ['reach', 'Swing'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setVizMode(key)}
                className={`px-2.5 py-1.5 min-h-[36px] sm:min-h-[32px] text-[11px] font-medium rounded-md transition-colors whitespace-nowrap ${
                  vizMode === key
                    ? 'bg-emerald-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full shrink-0">
          <button
            type="button"
            onClick={() => setShowTerritories((t) => !t)}
            data-testid="toggle-territories-btn"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] sm:min-h-[32px] text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showTerritories
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80'
                : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <MapIcon className="w-3 h-3" />
            Zones
          </button>
          <button
            type="button"
            onClick={() => setShowHeatmap((h) => !h)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] sm:min-h-[32px] text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showHeatmap
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80'
                : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Flame className="w-3 h-3" />
            Heat
          </button>
          <button
            type="button"
            onClick={handleToggle3d}
            data-testid="toggle-3d-tilt-btn"
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] sm:min-h-[32px] text-[11px] font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              is3dTilt
                ? 'bg-amber-950/90 text-amber-300 border-amber-700/80'
                : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Box className="w-3 h-3" />
            {is3dTilt ? '3D On' : '3D'}
          </button>
          <button
            type="button"
            onClick={() => setBasemap((b) => (b === 'dark' ? 'light' : 'dark'))}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] sm:min-h-[32px] text-[11px] font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Layers className="w-3 h-3" />
            {basemap === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset map view"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] sm:min-h-[32px] text-[11px] font-medium text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Senatorial Zone Quick-Fly Bar + Mobile-First LGA Jump Select */}
      <div className="px-3.5 sm:px-4 py-2 bg-[#0D1322] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full pb-0.5 sm:pb-0">
          <span className="text-slate-400 mr-0.5 shrink-0 hidden sm:inline">Zone:</span>
          {(
            [
              ['ALL', 'All 34 LGAs'],
              ['Katsina South', 'South · Funtua'],
              ['Katsina Central', 'Central'],
              ['Katsina North', 'North · Daura'],
            ] as const
          ).map(([zKey, zLabel]) => (
            <button
              key={zKey}
              type="button"
              onClick={() => handleZoneSelect(zKey)}
              className={`px-2.5 py-1.5 min-h-[30px] rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
                zoneFilter === zKey
                  ? 'bg-slate-100 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {zLabel}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="quick-jump-lga" className="text-slate-400 shrink-0 text-[11px]">
            Inspect LGA:
          </label>
          <select
            id="quick-jump-lga"
            value={selectedLgaId}
            onChange={(e) => handleQuickLgaSelect(e.target.value)}
            className="flex-1 sm:flex-none sm:w-44 bg-slate-900 text-slate-100 border border-slate-700 rounded-md px-2.5 py-1.5 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {simulation.lgas.map((item) => (
              <option key={item.lga.id} value={item.lga.id}>
                {item.lga.name} ({item.pdpWardsWon}/{item.lga.wardCount} wards)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Isolated, Overflow-Clipped Interactive WebGL Map Canvas */}
      <div className={`relative w-full overflow-hidden isolate ${heightClass}`}>
        {webglError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#0B1324] text-slate-300">
            <p className="text-sm font-semibold text-white">Katsina 34-LGA Mapbox Viewport</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md">{webglError}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-3xl">
              {simulation.lgas.map((item) => (
                <button
                  key={item.lga.id}
                  type="button"
                  onClick={() => onSelectLga(item.lga.id)}
                  className={`px-2.5 py-1 text-[11px] rounded border ${
                    selectedLgaId === item.lga.id
                      ? 'bg-emerald-700 text-white border-emerald-400'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {item.lga.name} ({item.pdpWardsWon}/{item.lga.wardCount})
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div
              ref={containerRef}
              data-testid="katsina-mapbox-canvas"
              className="w-full h-full"
              aria-label="Interactive Mapbox GL Visualization of Katsina State 34 LGAs and INEC Voter Simulation"
            />
            {!mapReady && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#090F1E]/88 backdrop-blur-xs">
                <CampaignLoader
                  variant="inline"
                  tone="dark"
                  statusText="Rendering Katsina 34-LGA Mapbox GL..."
                />
              </div>
            )}
          </>
        )}

        {/* Desktop/Tablet Floating Active LGA Telemetry Overlay (Hidden on mobile so map stays unobstructed) */}
        {activeLga && !webglError && (
          <div className="hidden sm:block pointer-events-none absolute left-3 bottom-3 z-20 bg-[#0A0F1A]/94 backdrop-blur-md border border-slate-700/90 rounded-xl px-4 py-3 text-xs text-slate-100 w-[285px] shadow-xl">
            {renderTelemetryBody()}
          </div>
        )}
      </div>

      {/* Mobile-First Docked Active LGA Telemetry Panel (Visible below canvas on <sm) */}
      {activeLga && !webglError && (
        <div className="sm:hidden bg-[#0D1322] border-t border-slate-800 px-3.5 py-3 text-xs text-slate-100">
          {renderTelemetryBody()}
        </div>
      )}

      {/* Bottom Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 sm:px-4 py-2.5 bg-[#0A0F1A] border-t border-slate-800 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {vizMode === 'simulation' && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D5C38] border border-emerald-300" />
                PDP Stronghold (58%+)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] border border-emerald-200" />
                PDP Lead
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] border border-sky-300" />
                APC Lead
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] border border-amber-300" />
                ADC Lead
              </span>
            </>
          )}
          {vizMode === 'density' && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F766E]" />
                145k+ INEC Voters
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D5C38]" />
                100k–145k Voters
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#334155]" />
                Under 100k Voters
              </span>
            </>
          )}
          {vizMode === 'wards' && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D5C38]" />
                82%+ Wards Captured
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
                65%–81% Wards
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
                Growth Priority (&lt;65%)
              </span>
            </>
          )}
          {vizMode === 'reach' && (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]" />
                Prime Swing LGA
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                Flippable Wards
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D5C38]" />
                Consolidated Base
              </span>
            </>
          )}
        </div>
        <span className="text-slate-500 font-mono text-[10px] sm:text-[11px]">
          {HAS_VALID_MAPBOX_TOKEN ? 'Mapbox GL · ' : ''}Zones + Corridors + 3,876,051 INEC Voters (Oct 2026)
        </span>
      </div>
    </div>
  );
};
