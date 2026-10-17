import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { InteractiveMap } from './InteractiveMap';
import { FutureBedPrediction } from './FutureBedPrediction';
import { calculateEmergencyReadinessScore } from '../services/aiReadiness';
import { playAudioDispatchChime } from '../services/ibmIntegration';
import { GeminiRecommendationAssistant } from './GeminiRecommendationAssistant';
import { getGoogleMapsDirectionsUrl } from '../utils/mapLinks';
import { GoogleMapsDirectionsButton } from './GoogleMapsDirectionsButton';
import {
  LayoutDashboard,
  Ambulance,
  Building2,
  ShieldAlert,
  Activity,
  Heart,
  Navigation,
  Sparkles,
  BedDouble,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Flame,
  Clock,
  ChevronRight,
  Radio,
  Cpu,
  CheckCircle2,
  MapPin,
  Volume2,
} from 'lucide-react';

interface UnifiedDashboardProps {
  onNavigateTab: (tab: 'ambulance' | 'hospital' | 'admin' | 'workflow') => void;
  onOpenIBMArchitecture?: () => void;
  onOpenIBMDemo?: () => void;
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  onNavigateTab,
  onOpenIBMArchitecture,
  onOpenIBMDemo,
}) => {
  const {
    hospitals,
    ambulances,
    activePatient,
    topHospital,
    backupHospital,
    trafficCondition,
    setTrafficCondition,
    disasterMode,
    toggleDisasterMode,
    isNavigating,
    startNavigation,
    pauseNavigation,
    requestBackupHospital,
    simulateHospitalFullSurge,
    setExplainModalOpen,
    selectedAmbulanceId,
    selectedHospitalId,
    setSelectedHospitalId,
    admitPatient,
  } = useEmergency();

  const [filterFacility, setFilterFacility] = useState<string>('all');

  const activeAmbulance = ambulances.find((a) => a.id === selectedAmbulanceId) || ambulances[0];
  const readiness = calculateEmergencyReadinessScore(topHospital, topHospital.etaMins || 8);

  // Aggregates
  const totalBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
  const availableBeds = hospitals.reduce((sum, h) => sum + h.availableBeds, 0);
  const totalIcu = hospitals.reduce((sum, h) => sum + h.icuTotal, 0);
  const availableIcu = hospitals.reduce((sum, h) => sum + h.icuBeds, 0);
  const activeFleetCount = ambulances.filter(
    (a) => a.status === 'transporting' || a.status === 'dispatched'
  ).length;
  const totalERQueue = hospitals.reduce((sum, h) => sum + h.waitingPatients, 0);
  const avgReadiness = Math.round(
    hospitals.reduce((sum, h) => sum + (h.readinessScore || 85), 0) / hospitals.length
  );

  return (
    <div className="space-y-6">
      {/* Executive Command Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              <span>METROPOLITAN EMERGENCY DASHBOARD</span>
              <span className="text-slate-500">·</span>
              <span className="text-blue-400">watsonx.ai Granite 3.0</span>
              <span className="text-slate-500">·</span>
              <span className="text-cyan-300">Gemini 3.8 Flash CDSS</span>
              <span className="text-slate-500">·</span>
              <span className="text-amber-400 font-mono">[SIMULATED DEMO OUTPUT]</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Hospital Bed & Ambulance Command Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time emergency allocation, dynamic route rerouting, and predictive bed availability (Simulated Telemetry)
            </p>
          </div>
        </div>

        {/* Quick Launchers */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setExplainModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
            title="Open Gemini AI Clinical Recommendation Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            <span>Gemini AI Assistant</span>
          </button>

          {onOpenIBMDemo && (
            <button
              onClick={onOpenIBMDemo}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>Launch Demo Script</span>
            </button>
          )}

          {onOpenIBMArchitecture && (
            <button
              onClick={onOpenIBMArchitecture}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/40 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>IBM Architecture</span>
            </button>
          )}

          <button
            onClick={() => toggleDisasterMode()}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border shadow-sm ${
              disasterMode
                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-rose-500/60 hover:text-rose-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>{disasterMode ? 'Disable MCI' : 'Disaster Mode'}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* City Beds Available */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>City Beds Available</span>
            <BedDouble className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-white">
            {availableBeds}
            <span className="text-xs text-slate-500 font-sans ml-1">/ {totalBeds}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {Math.round(((totalBeds - availableBeds) / totalBeds) * 100)}% System Load
          </div>
        </div>

        {/* ICU Beds Open */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>ICU Open</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-cyan-400">
            {availableIcu}
            <span className="text-xs text-slate-500 font-sans ml-1">/ {totalIcu}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Critical care buffer</div>
        </div>

        {/* Active Ambulances */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Fleet Dispatched</span>
            <Ambulance className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-rose-400">
            {activeFleetCount}
            <span className="text-xs text-slate-500 font-sans ml-1">/ {ambulances.length}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {ambulances.length - activeFleetCount} Base Ready
          </div>
        </div>

        {/* City ER Queue */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total ER Queue</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-amber-400">{totalERQueue}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Triage wait pool</div>
        </div>

        {/* Average Readiness Score */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Avg. Readiness</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-2xl font-extrabold text-emerald-400">{avgReadiness}/100</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">watsonx.ai benchmark</div>
        </div>

        {/* Traffic Corridor Speed */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Corridor Traffic</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-mono text-xl font-extrabold text-white uppercase flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                trafficCondition === 'green'
                  ? 'bg-emerald-500 animate-pulse'
                  : trafficCondition === 'yellow'
                  ? 'bg-amber-500'
                  : 'bg-rose-500 animate-pulse'
              }`}
            />
            <span>{trafficCondition}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {trafficCondition === 'green' ? '65 km/h' : trafficCondition === 'yellow' ? '42 km/h' : '26 km/h'}
          </div>
        </div>
      </div>

      {/* Main Command Workspace: 2-Column High-Density Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Master City Map & Live Navigation Controller */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Live Metropolitan Hospital & Fleet Topology
            </h2>
            <div className="text-xs text-slate-400">
              Corridor Flow:{' '}
              <span className="font-bold uppercase text-white font-mono">{trafficCondition}</span>
            </div>
          </div>

          <InteractiveMap height="h-[460px]" focusTarget="all" />

          {/* Active Navigation & Controller Strip */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-slate-400">PRIMARY DISPATCH CORRIDOR</div>
                <div className="font-semibold text-sm text-white flex items-center gap-2">
                  <span>Unit {activeAmbulance.callSign}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-emerald-400 font-bold">{topHospital.name}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {!isNavigating ? (
                  <button
                    onClick={() => {
                      playAudioDispatchChime();
                      startNavigation();
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Navigation className="w-4 h-4 fill-slate-950" />
                    Start Navigation
                  </button>
                ) : (
                  <button
                    onClick={pauseNavigation}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all"
                  >
                    Pause Navigation
                  </button>
                )}

                <button
                  onClick={() => {
                    playAudioDispatchChime();
                    requestBackupHospital();
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 text-xs font-semibold rounded-lg transition-all flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Request Backup
                </button>

                <button
                  onClick={() => simulateHospitalFullSurge(topHospital.id)}
                  title="Simulate sudden bed exhaustion to test auto backup divert"
                  className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 font-mono text-xs rounded-lg transition-all"
                >
                  Simulate Full Surge
                </button>

                <a
                  href={getGoogleMapsDirectionsUrl(
                    { lat: topHospital.lat, lng: topHospital.lng, name: topHospital.name, address: topHospital.address },
                    activeAmbulance ? { lat: activeAmbulance.lat, lng: activeAmbulance.lng } : null
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                  title="Open official Google Maps turn-by-turn directions"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions in Google Maps</span>
                </a>
              </div>
            </div>

            {/* In-Transit Progress Bar */}
            {isNavigating && (
              <div className="space-y-1.5 pt-1 border-t border-slate-800">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Transit Progress: {activeAmbulance.routeProgress}%</span>
                  <span className="text-cyan-400 font-bold">
                    Est. Remaining:{' '}
                    {Math.max(
                      1,
                      Math.round(
                        ((100 - activeAmbulance.routeProgress) / 100) * (topHospital.etaMins || 8)
                      )
                    )}{' '}
                    mins
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${activeAmbulance.routeProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): AI Hospital Recommendation, Patient Vitals & Predictions */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Patient Vitals Card with ECG */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span className="font-mono text-slate-400">ACTIVE PRIORITY 1 ENCOUNTER</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                {activePatient.severity} · STEMI
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-bold text-white text-base">
                  {activePatient.name}, {activePatient.age}M
                </div>
                <div className="text-xs text-slate-300">{activePatient.condition}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  Origin: {activePatient.pickupLocation.name}
                </div>
              </div>

              {/* Vitals Grid */}
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs text-center shrink-0">
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[9px] text-slate-400">HR</div>
                  <div className="text-rose-400 font-bold flex items-center justify-center gap-0.5">
                    <Heart className="w-2.5 h-2.5 fill-rose-500 animate-pulse" />
                    {activePatient.vitals.heartRate}
                  </div>
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[9px] text-slate-400">BP</div>
                  <div className="text-white font-bold">{activePatient.vitals.bloodPressure}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[9px] text-slate-400">SpO2</div>
                  <div className="text-cyan-400 font-bold">{activePatient.vitals.oxygenSat}%</div>
                </div>
                <div className="p-1.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[9px] text-slate-400">GCS</div>
                  <div className="text-emerald-400 font-bold">{activePatient.vitals.gcsScore}</div>
                </div>
              </div>
            </div>

            {/* Live ECG Waveform */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-rose-400 shrink-0">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>LEAD II ECG</span>
              </div>
              <div className="flex-1 h-4 overflow-hidden opacity-80">
                <svg className="w-full h-full" viewBox="0 0 500 24" fill="none" preserveAspectRatio="none">
                  <path
                    d="M0 12 L40 12 L45 8 L50 12 L70 12 L75 14 L80 2 L85 22 L90 12 L105 8 L120 12 L160 12 L165 8 L170 12 L190 12 L195 14 L200 2 L205 22 L210 12 L225 8 L240 12 L280 12 L285 8 L290 12 L310 12 L315 14 L320 2 L325 22 L330 12 L345 8 L360 12 L400 12 L405 8 L410 12 L430 12 L435 14 L440 2 L445 22 L450 12 L465 8 L500 12"
                    stroke="#f43f5e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <button
                onClick={() => playAudioDispatchChime()}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800"
                title="Play Audio Chime"
              >
                <Volume2 className="w-3 h-3" />
                Chime
              </button>
            </div>
          </div>

          {/* AI Optimal Hospital Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    RECOMMENDED TARGET
                  </div>
                  <h3 className="text-sm font-extrabold text-white">{topHospital.name}</h3>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400">ETA</div>
                <div className="text-lg font-mono font-extrabold text-cyan-400">
                  {topHospital.etaMins || 8} min
                </div>
              </div>
            </div>

            {/* Score & Capacity Snapshot */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Readiness</div>
                <div className="font-mono font-bold text-emerald-400 text-base">
                  {readiness.score}/100
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Available Beds</div>
                <div className="font-mono font-bold text-white text-base">
                  {topHospital.availableBeds}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">ICU Bays</div>
                <div className="font-mono font-bold text-cyan-400 text-base">
                  {topHospital.icuBeds} Open
                </div>
              </div>
            </div>

            {/* Why Selected Bullet Points */}
            <div className="space-y-1 text-xs text-slate-300 pt-1">
              {(topHospital.whySelected || [
                `Score: ${readiness.score}/100 (Highest in metro zone)`,
                `ICU Available: ${topHospital.icuBeds} dedicated bays open`,
                `ETA: ${topHospital.etaMins || 8} min via ${trafficCondition.toUpperCase()} corridor`,
                `Lowest waiting queue (${topHospital.waitingPatients} waiting)`,
              ]).slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setExplainModalOpen(true)}
                  className="text-cyan-400 hover:underline font-medium text-[11px]"
                >
                  Inspect AI Factor Weights
                </button>
                <GoogleMapsDirectionsButton
                  destination={{ lat: topHospital.lat, lng: topHospital.lng, name: topHospital.name, address: topHospital.address }}
                  origin={activeAmbulance ? { lat: activeAmbulance.lat, lng: activeAmbulance.lng } : null}
                  size="xs"
                  variant="primary"
                />
              </div>
              <button
                onClick={() => onNavigateTab('hospital')}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                <span>Hospital Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* AI Future Bed Prediction */}
          <FutureBedPrediction hospitalId={topHospital.id} />
        </div>
      </div>

      {/* Gemini AI Explainable Hospital Recommendation Assistant */}
      <GeminiRecommendationAssistant onOpenIBMArchitecture={onOpenIBMArchitecture} />

      {/* Hospital Network Grid (8 Hospitals Live Matrix) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Metropolitan Hospital Grid (8 Trauma Facilities)
            </h2>
            <p className="text-xs text-slate-400">
              Live capacity and readiness tracking across all district hospital nodes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('hospital')}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Manage Hospital Beds & Resources</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {hospitals.map((hosp) => {
            const isTarget = hosp.id === topHospital.id;
            const isBackup = hosp.id === backupHospital.id;
            const isFull = hosp.availableBeds === 0;

            return (
              <div
                key={hosp.id}
                onClick={() => {
                  setSelectedHospitalId(hosp.id);
                  onNavigateTab('hospital');
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  isTarget
                    ? 'bg-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                    : isBackup
                    ? 'bg-slate-900 border-cyan-500/40 shadow-sm'
                    : isFull
                    ? 'bg-rose-950/20 border-rose-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-1.5">
                  <div className="truncate">
                    <h3 className="font-bold text-xs text-white truncate">{hosp.name}</h3>
                    <div className="text-[10px] text-slate-400">{hosp.traumaLevel} Trauma</div>
                  </div>
                  {isTarget && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-emerald-500 text-slate-950">
                      Optimal
                    </span>
                  )}
                  {isBackup && !isTarget && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-cyan-500 text-slate-950">
                      Backup
                    </span>
                  )}
                  {isFull && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-rose-500 text-white">
                      Full
                    </span>
                  )}
                </div>

                {/* Occupancy Progress */}
                <div className="space-y-1 py-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Available Beds:</span>
                    <span
                      className={`font-bold ${
                        isFull ? 'text-rose-400' : hosp.availableBeds <= 4 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {hosp.availableBeds} / {hosp.totalBeds}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        isFull ? 'bg-rose-500' : hosp.availableBeds <= 4 ? 'bg-amber-500' : 'bg-cyan-500'
                      }`}
                      style={{
                        width: `${Math.round(((hosp.totalBeds - hosp.availableBeds) / hosp.totalBeds) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>ICU: <strong className="text-cyan-300">{hosp.icuBeds}</strong></span>
                  <span>Docs: <strong className="text-slate-200">{hosp.emergencyDoctors}</strong></span>
                  <span>Score: <strong className="text-emerald-400">{hosp.readinessScore || 88}</strong></span>
                </div>

                {/* Get Directions in Google Maps Button */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                  <GoogleMapsDirectionsButton
                    destination={{ lat: hosp.lat, lng: hosp.lng, name: hosp.name, address: hosp.address }}
                    origin={activeAmbulance ? { lat: activeAmbulance.lat, lng: activeAmbulance.lng } : null}
                    size="xs"
                    variant={isTarget ? 'primary' : 'secondary'}
                    className="w-full text-center"
                    label="Get Directions in Google Maps"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Role & Tab Entry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div
          onClick={() => onNavigateTab('ambulance')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Ambulance className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-sm text-white">Ambulance Paramedic Cockpit</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Turn-by-turn navigation, live STEMI 12-lead ECG telemetry, and one-touch backup rerouting.
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('hospital')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-sm text-white">Hospital Resource Portal</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live capacity modifiers (+/- beds, ICU, vents), incoming ambulance radar, and patient admission.
            </p>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('admin')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="mt-3">
            <h3 className="font-bold text-sm text-white">Admin Command & Disaster Grid</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mass Casualty Incident (MCI) 20-victim distribution, analytics charts, and HL7 FHIR payload audit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
