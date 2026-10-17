import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { InteractiveMap } from './InteractiveMap';
import { FutureBedPrediction } from './FutureBedPrediction';
import { calculateEmergencyReadinessScore } from '../services/aiReadiness';
import { playAudioDispatchChime } from '../services/ibmIntegration';
import { GeminiRecommendationAssistant } from './GeminiRecommendationAssistant';
import { GoogleMapsDirectionsButton } from './GoogleMapsDirectionsButton';
import {
  Navigation,
  Sparkles,
  ShieldAlert,
  Clock,
  MapPin,
  Heart,
  Activity,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  ArrowRight,
  Flame,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Stethoscope,
  Volume2,
} from 'lucide-react';

export const AmbulanceDashboard: React.FC = () => {
  const {
    ambulances,
    selectedAmbulanceId,
    activePatient,
    topHospital,
    backupHospital,
    rankedHospitals,
    trafficCondition,
    setTrafficCondition,
    isNavigating,
    startNavigation,
    pauseNavigation,
    requestBackupHospital,
    simulateHospitalFullSurge,
    setExplainModalOpen,
    admitPatient,
  } = useEmergency();

  const activeAmbulance = ambulances.find((a) => a.id === selectedAmbulanceId) || ambulances[0];
  const readiness = calculateEmergencyReadinessScore(topHospital, topHospital.etaMins || 8);
  const backupReadiness = calculateEmergencyReadinessScore(backupHospital, backupHospital.etaMins || 11);

  return (
    <div className="space-y-6">
      {/* Top Telemetry Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Ambulance Unit Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1">
            <span>ASSIGNED UNIT</span>
            <span className="text-emerald-400 font-bold uppercase">{activeAmbulance.status}</span>
          </div>
          <div className="text-xl font-extrabold text-white font-mono flex items-center gap-2">
            <span>{activeAmbulance.callSign}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-sans font-medium border border-cyan-500/20">
              ALS Telemetry
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-300 flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{activeAmbulance.currentStreet}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Crew: {activeAmbulance.paramedicName}</div>
        </div>

        {/* Patient Vitals & Condition */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md col-span-1 md:col-span-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-slate-400">PATIENT TRIAGE STATUS</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
              {activePatient.severity} Priority · STEMI Protocol
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
            <div>
              <div className="font-bold text-white text-base">
                {activePatient.name}, {activePatient.age}M
              </div>
              <div className="text-xs text-slate-300">{activePatient.condition}</div>
            </div>
            {/* Vitals Row */}
            <div className="flex items-center gap-2.5 font-mono text-xs">
              <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">HR</div>
                <div className="text-rose-400 font-bold flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500 animate-pulse" />
                  {activePatient.vitals.heartRate}
                </div>
              </div>
              <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">BP</div>
                <div className="text-white font-bold">{activePatient.vitals.bloodPressure}</div>
              </div>
              <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">SpO2</div>
                <div className="text-cyan-400 font-bold">{activePatient.vitals.oxygenSat}%</div>
              </div>
              <div className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400">GCS</div>
                <div className="text-emerald-400 font-bold">{activePatient.vitals.gcsScore}</div>
              </div>
            </div>
          </div>

          {/* Animated 12-Lead ECG STEMI Waveform */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-rose-400 shrink-0">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>ECG LEAD II (ST ELEVATION)</span>
            </div>
            
            {/* SVG Waveform Graphic */}
            <div className="flex-1 h-5 overflow-hidden relative opacity-85">
              <svg className="w-full h-full" viewBox="0 0 500 24" fill="none" preserveAspectRatio="none">
                <path
                  d="M0 12 L40 12 L45 8 L50 12 L70 12 L75 14 L80 2 L85 22 L90 12 L105 8 L120 12 L160 12 L165 8 L170 12 L190 12 L195 14 L200 2 L205 22 L210 12 L225 8 L240 12 L280 12 L285 8 L290 12 L310 12 L315 14 L320 2 L325 22 L330 12 L345 8 L360 12 L400 12 L405 8 L410 12 L430 12 L435 14 L440 2 L445 22 L450 12 L465 8 L500 12"
                  stroke="#f43f5e"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <button
              onClick={() => playAudioDispatchChime()}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 shrink-0 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 hover:border-cyan-500/40 transition-colors"
              title="Test EMS Radio Siren Chime"
            >
              <Volume2 className="w-3 h-3" />
              <span>Radio Audio</span>
            </button>
          </div>
        </div>

        {/* Live Traffic Simulator */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-xs font-mono text-slate-400 mb-1 flex items-center justify-between">
            <span>CORRIDOR TRAFFIC</span>
            <span className="text-[10px] text-slate-500">Live Municipal Sensor</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setTrafficCondition('green')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                trafficCondition === 'green'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-emerald-300'
              }`}
            >
              Green
            </button>
            <button
              onClick={() => setTrafficCondition('yellow')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                trafficCondition === 'yellow'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-amber-300'
              }`}
            >
              Yellow
            </button>
            <button
              onClick={() => setTrafficCondition('red')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                trafficCondition === 'red'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-rose-300'
              }`}
            >
              Red
            </button>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Speed: {trafficCondition === 'green' ? '65' : trafficCondition === 'yellow' ? '42' : '26'} km/h</span>
            <span>ETA Delta: {trafficCondition === 'green' ? 'Fastest' : trafficCondition === 'yellow' ? '+3 min' : '+8 min'}</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid: Map + Navigation & Hospital Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map & Live Navigation Controls */}
        <div className="lg:col-span-7 space-y-4">
          <InteractiveMap height="h-[460px]" focusTarget="ambulance" />

          {/* Navigation Action Hub */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-mono text-slate-400">NAVIGATION CONTROLLER</div>
                <div className="font-semibold text-sm text-white flex items-center gap-2">
                  <span>En Route to:</span>
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
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-semibold text-xs rounded-lg transition-all flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Request Backup Hospital
                </button>

                <button
                  onClick={() => simulateHospitalFullSurge(topHospital.id)}
                  title="Simulate capacity surge at current target to trigger auto backup"
                  className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 font-mono text-xs rounded-lg transition-all"
                >
                  Simulate Hospital Full
                </button>

                <GoogleMapsDirectionsButton
                  destination={{ lat: topHospital.lat, lng: topHospital.lng, name: topHospital.name, address: topHospital.address }}
                  origin={activeAmbulance ? { lat: activeAmbulance.lat, lng: activeAmbulance.lng } : null}
                  size="sm"
                  variant="primary"
                  label="Get Directions in Google Maps"
                />
              </div>
            </div>

            {/* In-Transit Progress Bar */}
            {isNavigating && (
              <div className="space-y-1.5 pt-1 border-t border-slate-800">
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Transit Progress: {activeAmbulance.routeProgress}%</span>
                  <span className="text-cyan-400 font-bold">
                    Est. Remaining: {Math.max(1, Math.round(((100 - activeAmbulance.routeProgress) / 100) * (topHospital.etaMins || 8)))} mins
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

        {/* Right Column: AI Hospital Recommendation & Readiness Scores */}
        <div className="lg:col-span-5 space-y-4">
          {/* Recommended Hospital Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 shadow-xl space-y-4 relative overflow-hidden">
            {/* Top Banner */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <span>AI OPTIMAL ALLOCATION</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-blue-400">watsonx.ai</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">{topHospital.name}</h3>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400">ETA</div>
                <div className="text-xl font-mono font-extrabold text-cyan-400">
                  {topHospital.etaMins || 8} <span className="text-xs font-sans text-slate-400">mins</span>
                </div>
              </div>
            </div>

            {/* Emergency Readiness Score Gauge */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <span>Emergency Readiness Score</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Granite 3.0
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono text-3xl font-extrabold text-emerald-400">
                    {readiness.score}
                  </span>
                  <span className="text-xs font-mono text-slate-500">/ 100</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${readiness.ratingColor}`}
                >
                  {readiness.rating}
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-1">
                  {topHospital.traumaLevel} Trauma Center
                </span>
              </div>
            </div>

            {/* Resource Snapshot */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Available Beds</div>
                <div className="text-sm font-mono font-bold text-white">
                  {topHospital.availableBeds} / {topHospital.totalBeds}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">ICU Beds</div>
                <div className="text-sm font-mono font-bold text-emerald-400">
                  {topHospital.icuBeds} Open
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Waiting ER</div>
                <div className="text-sm font-mono font-bold text-cyan-400">
                  {topHospital.waitingPatients} patients
                </div>
              </div>
            </div>

            {/* Explainable AI: Why Selected */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Why {topHospital.shortName} was Selected:
                </span>
                <button
                  onClick={() => setExplainModalOpen(true)}
                  className="text-[11px] text-cyan-400 hover:underline font-medium"
                >
                  View Weights
                </button>
              </div>

              <div className="space-y-1.5">
                {(topHospital.whySelected || [
                  `Readiness Score: ${readiness.score}/100 (${readiness.rating})`,
                  `ICU Available: ${topHospital.icuBeds} dedicated bays ready for immediate intake`,
                  `ETA: ${topHospital.etaMins || 8} minutes (${topHospital.distanceKm || 3.8} km via ${trafficCondition.toUpperCase()} corridor)`,
                  `Lowest waiting time: only ${topHospital.waitingPatients} active triaged cases`,
                ]).map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Official Navigation Intent</span>
                <GoogleMapsDirectionsButton
                  destination={{ lat: topHospital.lat, lng: topHospital.lng, name: topHospital.name, address: topHospital.address }}
                  origin={activeAmbulance ? { lat: activeAmbulance.lat, lng: activeAmbulance.lng } : null}
                  size="xs"
                  variant="primary"
                  label="Get Directions in Google Maps"
                />
              </div>
            </div>

            {/* Smart Backup Hospital Preview Card */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-400 font-semibold uppercase text-[10px]">
                  DESIGNATED SMART BACKUP
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ETA: {backupHospital.etaMins || 11} min
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm text-white">{backupHospital.name}</div>
                <div className="font-mono text-xs text-slate-300">
                  Score: <strong className="text-cyan-400">{backupReadiness.score}</strong>/100
                </div>
              </div>
              <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                <span>{backupHospital.availableBeds} beds · {backupHospital.icuBeds} ICU bays</span>
                <div className="flex items-center gap-2">
                  <GoogleMapsDirectionsButton
                    destination={{ lat: backupHospital.lat, lng: backupHospital.lng, name: backupHospital.name, address: backupHospital.address }}
                    origin={activeAmbulance ? { lat: activeAmbulance.lat, lng: activeAmbulance.lng } : null}
                    size="xs"
                    variant="outline"
                    label="Get Directions in Google Maps"
                  />
                  <button
                    onClick={requestBackupHospital}
                    className="text-cyan-400 hover:text-cyan-300 text-[11px] font-semibold underline flex items-center gap-0.5"
                  >
                    Switch Now <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Future Bed Prediction Component */}
          <FutureBedPrediction hospitalId={topHospital.id} />
        </div>
      </div>

      {/* Gemini AI Clinical Triage & Allocation Assistant */}
      <GeminiRecommendationAssistant />
    </div>
  );
};
