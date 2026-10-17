import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEmergency } from '../context/EmergencyContext';
import { Hospital, Ambulance } from '../types';
import { getGoogleMapsDirectionsUrl } from '../utils/mapLinks';
import { Navigation, Hospital as HospitalIcon, AlertTriangle, Layers, Crosshair, Sparkles } from 'lucide-react';

interface InteractiveMapProps {
  height?: string;
  focusTarget?: 'ambulance' | 'hospital' | 'all';
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  height = 'h-[500px]',
  focusTarget = 'all',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const backupRouteLayerRef = useRef<L.Polyline | null>(null);

  const {
    hospitals,
    ambulances,
    activePatient,
    topHospital,
    backupHospital,
    trafficCondition,
    selectedAmbulanceId,
    setSelectedAmbulanceId,
    selectedHospitalId,
    setSelectedHospitalId,
    isNavigating,
  } = useEmergency();

  const [activeLayer, setActiveLayer] = useState<'all' | 'ambulances' | 'hospitals'>('all');

  const activeAmbulance = ambulances.find((a) => a.id === selectedAmbulanceId) || ambulances[0];

  // Initialize Leaflet Map with OpenStreetMap (No Google Maps API key needed)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center of Metro Medical District
    const map = L.map(mapContainerRef.current, {
      center: [37.7749, -122.42],
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
    });

    // OpenStreetMap standard tiles (Fully open-source, no API key required)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers and Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Render Hospitals
    if (activeLayer === 'all' || activeLayer === 'hospitals') {
      hospitals.forEach((hosp) => {
        const isTop = hosp.id === topHospital.id;
        const isBackup = hosp.id === backupHospital.id;
        const isSelected = hosp.id === selectedHospitalId;
        const isFull = hosp.availableBeds === 0;

        let ringColor = 'border-slate-500';
        let bgBadge = 'bg-slate-800 text-slate-200';
        if (isFull) {
          ringColor = 'border-rose-500 shadow-rose-500/50';
          bgBadge = 'bg-rose-950 text-rose-300 border-rose-500';
        } else if (isTop) {
          ringColor = 'border-emerald-400 shadow-emerald-500/50';
          bgBadge = 'bg-emerald-950 text-emerald-300 border-emerald-400';
        } else if (isBackup) {
          ringColor = 'border-cyan-400 shadow-cyan-500/50';
          bgBadge = 'bg-cyan-950 text-cyan-300 border-cyan-400';
        }

        const iconHtml = `
          <div class="relative cursor-pointer group flex flex-col items-center">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center border-2 ${ringColor} ${
              isTop ? 'bg-emerald-900/90 ring-4 ring-emerald-500/20' : 'bg-slate-900/90'
            } shadow-lg transition-transform hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${
                isFull ? '#f43f5e' : isTop ? '#34d399' : '#38bdf8'
              }" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 6v12m-6-6h12"/>
              </svg>
            </div>
            <div class="mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap border ${bgBadge}">
              ${hosp.shortName} (${hosp.availableBeds} beds)
            </div>
            ${
              isTop
                ? '<div class="absolute -top-2 -right-2 px-1 py-0.2 bg-emerald-500 text-slate-950 text-[9px] font-extrabold rounded shadow uppercase">AI TOP</div>'
                : isBackup
                ? '<div class="absolute -top-2 -right-2 px-1 py-0.2 bg-cyan-500 text-slate-950 text-[9px] font-extrabold rounded shadow uppercase">BACKUP</div>'
                : ''
            }
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-hospital-marker',
          iconSize: [40, 56],
          iconAnchor: [20, 28],
        });

        const marker = L.marker([hosp.lat, hosp.lng], { icon: customIcon });

        const popupContent = `
          <div class="p-2 text-xs space-y-1.5 min-w-[210px]">
            <div class="flex items-center justify-between border-b border-slate-700/60 pb-1">
              <span class="font-bold text-slate-100 text-sm">${hosp.name}</span>
            </div>
            <div class="text-slate-400 text-[11px]">${hosp.address}</div>
            <div class="grid grid-cols-2 gap-1.5 py-1 text-slate-200">
              <div class="bg-slate-800/80 p-1 rounded border border-slate-700">
                <div class="text-[10px] text-slate-400">Available Beds</div>
                <div class="font-mono font-bold text-sm ${hosp.availableBeds === 0 ? 'text-rose-400' : 'text-emerald-400'}">
                  ${hosp.availableBeds} / ${hosp.totalBeds}
                </div>
              </div>
              <div class="bg-slate-800/80 p-1 rounded border border-slate-700">
                <div class="text-[10px] text-slate-400">ICU Open</div>
                <div class="font-mono font-bold text-sm ${hosp.icuBeds === 0 ? 'text-rose-400' : 'text-cyan-400'}">
                  ${hosp.icuBeds} / ${hosp.icuTotal}
                </div>
              </div>
              <div class="bg-slate-800/80 p-1 rounded border border-slate-700">
                <div class="text-[10px] text-slate-400">Ventilators</div>
                <div class="font-mono font-bold">${hosp.ventilators}</div>
              </div>
              <div class="bg-slate-800/80 p-1 rounded border border-slate-700">
                <div class="text-[10px] text-slate-400">ER Doctors</div>
                <div class="font-mono font-bold">${hosp.emergencyDoctors}</div>
              </div>
            </div>
            <div class="text-[11px] text-slate-300 flex items-center justify-between">
              <span>Readiness Score:</span>
              <span class="font-mono font-bold text-emerald-400">${hosp.readinessScore || 88}/100</span>
            </div>
            <a href="${getGoogleMapsDirectionsUrl(
              { lat: hosp.lat, lng: hosp.lng, name: hosp.name, address: hosp.address },
              activeAmbulance ? { lat: activeAmbulance.lat, lng: activeAmbulance.lng } : null
            )}" target="_blank" rel="noopener noreferrer" class="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-center rounded-lg text-[11px] shadow-md transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              Get Directions in Google Maps
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => setSelectedHospitalId(hosp.id));
        markersGroup.addLayer(marker);
      });
    }

    // 2. Render Ambulances
    if (activeLayer === 'all' || activeLayer === 'ambulances') {
      ambulances.forEach((amb) => {
        const isSelected = amb.id === selectedAmbulanceId;
        const isTransporting = amb.status === 'transporting';
        const targetHosp = (amb.targetHospitalId ? hospitals.find((h) => h.id === amb.targetHospitalId) : null) || topHospital;
        const ambDirectionsUrl = targetHosp
          ? getGoogleMapsDirectionsUrl(
              { lat: targetHosp.lat, lng: targetHosp.lng, name: targetHosp.name, address: targetHosp.address },
              { lat: amb.lat, lng: amb.lng }
            )
          : null;

        const iconHtml = `
          <div class="relative cursor-pointer group flex flex-col items-center">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center border ${
              isSelected
                ? 'bg-rose-600 border-rose-300 ring-4 ring-rose-500/30'
                : amb.status === 'idle'
                ? 'bg-slate-800 border-slate-600'
                : 'bg-amber-600 border-amber-300'
            } shadow-lg transition-transform hover:scale-125">
              <span class="text-xs font-mono font-extrabold text-white">🚑</span>
            </div>
            <div class="mt-0.5 px-1 py-0.2 bg-slate-900/95 text-slate-200 border border-slate-700 rounded text-[9px] font-mono whitespace-nowrap">
              ${amb.callSign} ${isTransporting ? `(${amb.speedKmH}km/h)` : ''}
            </div>
            ${
              isTransporting
                ? '<div class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>'
                : ''
            }
          </div>
        `;

        const ambIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-ambulance-marker',
          iconSize: [36, 48],
          iconAnchor: [18, 24],
        });

        const marker = L.marker([amb.lat, amb.lng], { icon: ambIcon });

        const popupContent = `
          <div class="p-2 text-xs space-y-1.5 min-w-[210px]">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1">
              <span class="font-bold text-slate-100 text-sm">${amb.callSign} (${amb.vehicleType})</span>
            </div>
            <div class="text-[11px] text-slate-400">Crew: ${amb.paramedicName}</div>
            <div class="text-[11px] text-slate-400">Location: ${amb.currentStreet}</div>
            <div class="flex items-center justify-between pt-1">
              <span class="text-slate-400">Status:</span>
              <span class="font-mono uppercase font-bold ${
                amb.status === 'transporting' ? 'text-rose-400' : 'text-amber-400'
              }">${amb.status}</span>
            </div>
            ${
              ambDirectionsUrl
                ? `
            <a href="${ambDirectionsUrl}" target="_blank" rel="noopener noreferrer" class="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-center rounded-lg text-[11px] shadow-md transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              Get Directions in Google Maps (${targetHosp?.shortName})
            </a>
            `
                : ''
            }
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => setSelectedAmbulanceId(amb.id));
        markersGroup.addLayer(marker);
      });
    }

    // 3. Render Route from Active Ambulance to Top Hospital
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (backupRouteLayerRef.current) {
      map.removeLayer(backupRouteLayerRef.current);
      backupRouteLayerRef.current = null;
    }

    // Primary route
    let routeStrokeColor = '#10b981'; // green traffic
    if (trafficCondition === 'yellow') routeStrokeColor = '#f59e0b';
    if (trafficCondition === 'red') routeStrokeColor = '#ef4444';

    const startPoint: [number, number] = [activeAmbulance.lat, activeAmbulance.lng];
    const endPoint: [number, number] = [topHospital.lat, topHospital.lng];

    // Midpoint curve simulation
    const midLat = (startPoint[0] + endPoint[0]) / 2 + 0.003;
    const midLng = (startPoint[1] + endPoint[1]) / 2 - 0.004;

    const primaryRouteLine = L.polyline([startPoint, [midLat, midLng], endPoint], {
      color: routeStrokeColor,
      weight: 5,
      opacity: 0.85,
      lineCap: 'round',
      dashArray: isNavigating ? '10, 10' : undefined,
    }).addTo(map);

    routeLayerRef.current = primaryRouteLine;

    // Secondary backup route (dashed cyan)
    if (backupHospital) {
      const backupEndPoint: [number, number] = [backupHospital.lat, backupHospital.lng];
      const backupRouteLine = L.polyline([startPoint, backupEndPoint], {
        color: '#06b6d4',
        weight: 3,
        opacity: 0.55,
        dashArray: '6, 8',
      }).addTo(map);

      backupRouteLayerRef.current = backupRouteLine;
    }

    // Auto-center or fit bounds on focus change
    if (focusTarget === 'ambulance') {
      map.panTo([activeAmbulance.lat, activeAmbulance.lng]);
    }
  }, [
    hospitals,
    ambulances,
    topHospital,
    backupHospital,
    selectedAmbulanceId,
    selectedHospitalId,
    activeLayer,
    trafficCondition,
    isNavigating,
    focusTarget,
  ]);

  const handleCenterOnAmbulance = () => {
    if (mapInstanceRef.current && activeAmbulance) {
      mapInstanceRef.current.setView([activeAmbulance.lat, activeAmbulance.lng], 14, { animate: true });
    }
  };

  const handleFitAll = () => {
    if (mapInstanceRef.current && hospitals.length > 0) {
      const bounds = L.latLngBounds(hospitals.map((h) => [h.lat, h.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  };

  return (
    <div className={`relative w-full ${height} rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl`}>
      {/* Map DOM node */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Top Floating Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Active Corridor & Traffic indicator */}
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg text-xs shadow-lg">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                trafficCondition === 'green'
                  ? 'bg-emerald-500 animate-pulse'
                  : trafficCondition === 'yellow'
                  ? 'bg-amber-500'
                  : 'bg-rose-500 animate-pulse'
              }`}
            />
            <span className="font-semibold text-slate-200">
              Corridor Traffic: <span className="uppercase text-slate-100">{trafficCondition}</span>
            </span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="text-slate-300 font-mono text-[11px]">
            Target: <span className="text-emerald-400 font-semibold">{topHospital.shortName}</span>
          </div>
        </div>

        {/* Map Layer and Recenter Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1 rounded-lg shadow-lg">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              activeLayer === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveLayer('hospitals')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              activeLayer === 'hospitals' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hospitals ({hospitals.length})
          </button>
          <button
            onClick={() => setActiveLayer('ambulances')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              activeLayer === 'ambulances' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fleet ({ambulances.length})
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-1" />
          <button
            onClick={handleCenterOnAmbulance}
            title="Center on active ambulance"
            aria-label="Center on active ambulance"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFitAll}
            title="Fit city overview"
            aria-label="Fit city overview"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map Bottom Legend */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto px-3 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg text-[11px] text-slate-300 shadow-xl flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-400" />
          <span>Optimal Hospital</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-400" />
          <span>Backup Hospital</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-rose-500/20 border border-rose-400" />
          <span>Full / Divert</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 bg-emerald-400 rounded-full inline-block" />
          <span>Primary Route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 border-t-2 border-dashed border-cyan-400 inline-block" />
          <span>Backup Route</span>
        </div>
      </div>
    </div>
  );
};
