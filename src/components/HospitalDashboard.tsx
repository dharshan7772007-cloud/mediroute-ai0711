import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { FutureBedPrediction } from './FutureBedPrediction';
import { GoogleMapsDirectionsButton } from './GoogleMapsDirectionsButton';
import {
  Building2,
  BedDouble,
  ShieldCheck,
  Wind,
  Stethoscope,
  Users,
  Plus,
  Minus,
  Ambulance as AmbulanceIcon,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const {
    hospitals,
    selectedHospitalId,
    setSelectedHospitalId,
    ambulances,
    activePatient,
    updateHospitalResource,
    simulateHospitalFullSurge,
    admitPatient,
    isNavigating,
  } = useEmergency();

  const currentHospital = hospitals.find((h) => h.id === selectedHospitalId) || hospitals[0];

  // Incoming ambulances heading to this hospital
  const incomingAmbulances = ambulances.filter(
    (a) => (a.status === 'transporting' || a.status === 'dispatched') && (a.targetHospitalId === currentHospital.id || (!a.targetHospitalId && currentHospital.id === 'hosp-1'))
  );

  return (
    <div className="space-y-6">
      {/* Hospital Switcher & Status Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-2">
              <span>HOSPITAL RESOURCE COORDINATION PORTAL</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-300 font-normal">{currentHospital.traumaLevel}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">{currentHospital.name}</h2>
            <p className="text-xs text-slate-400">{currentHospital.address}</p>
          </div>
        </div>

        {/* Facility Selector & Quick Surge Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
              Select Hospital Node:
            </label>
            <select
              value={currentHospital.id}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs font-semibold text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.availableBeds} beds open)
                </option>
              ))}
            </select>
          </div>

          <GoogleMapsDirectionsButton
            destination={{ lat: currentHospital.lat, lng: currentHospital.lng, name: currentHospital.name, address: currentHospital.address }}
            size="sm"
            variant="primary"
            className="mt-4"
            label="Get Directions in Google Maps"
          />

          <button
            onClick={() => simulateHospitalFullSurge(currentHospital.id)}
            className="mt-4 px-3 py-2 bg-rose-950/50 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            title="Simulate sudden zero available beds to trigger backup rerouting"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Simulate Capacity Full Surge
          </button>
        </div>
      </div>

      {/* Real-time Hospital Resource Cards with Instant Modifiers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
            Real-Time Resource Allocation & Live Adjustment
          </h3>
          <span className="text-xs text-slate-400">
            Use <strong className="text-emerald-400">+</strong> / <strong className="text-rose-400">-</strong> controls to simulate capacity changes instantly
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Beds */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Beds</span>
              <BedDouble className="w-4 h-4 text-slate-500" />
            </div>
            <div className="font-mono text-2xl font-extrabold text-white">
              {currentHospital.totalBeds}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Licensed capacity</div>
          </div>

          {/* Available Beds (Interactive) */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/40 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="text-emerald-400 font-semibold">Available Beds</span>
              <BedDouble className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-mono text-2xl font-extrabold text-emerald-400">
              {currentHospital.availableBeds}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => updateHospitalResource(currentHospital.id, 'availableBeds', -1)}
                className="p-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition-colors"
                title="Decrease available beds"
                aria-label="Decrease available beds"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateHospitalResource(currentHospital.id, 'availableBeds', 1)}
                className="p-1 rounded bg-slate-800 hover:bg-emerald-900/60 text-slate-300 hover:text-white transition-colors"
                title="Increase available beds"
                aria-label="Increase available beds"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-500 ml-auto">Instant</span>
            </div>
          </div>

          {/* ICU Beds (Interactive) */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/40 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="text-cyan-400 font-semibold">ICU Beds Open</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="font-mono text-2xl font-extrabold text-cyan-400">
              {currentHospital.icuBeds}
              <span className="text-xs text-slate-500 font-sans ml-1">/ {currentHospital.icuTotal}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => updateHospitalResource(currentHospital.id, 'icuBeds', -1)}
                className="p-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition-colors"
                title="Decrease ICU beds"
                aria-label="Decrease ICU beds"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateHospitalResource(currentHospital.id, 'icuBeds', 1)}
                className="p-1 rounded bg-slate-800 hover:bg-cyan-900/60 text-slate-300 hover:text-white transition-colors"
                title="Increase ICU beds"
                aria-label="Increase ICU beds"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-500 ml-auto">Instant</span>
            </div>
          </div>

          {/* Ventilators (Interactive) */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Ventilators</span>
              <Wind className="w-4 h-4 text-blue-400" />
            </div>
            <div className="font-mono text-2xl font-extrabold text-blue-400">
              {currentHospital.ventilators}
              <span className="text-xs text-slate-500 font-sans ml-1">/ {currentHospital.ventilatorsTotal}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => updateHospitalResource(currentHospital.id, 'ventilators', -1)}
                className="p-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition-colors"
                title="Decrease ventilators"
                aria-label="Decrease ventilators"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateHospitalResource(currentHospital.id, 'ventilators', 1)}
                className="p-1 rounded bg-slate-800 hover:bg-blue-900/60 text-slate-300 hover:text-white transition-colors"
                title="Increase ventilators"
                aria-label="Increase ventilators"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-500 ml-auto">Instant</span>
            </div>
          </div>

          {/* Emergency Doctors Available (Interactive) */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>ER Doctors</span>
              <Stethoscope className="w-4 h-4 text-amber-400" />
            </div>
            <div className="font-mono text-2xl font-extrabold text-amber-400">
              {currentHospital.emergencyDoctors}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => updateHospitalResource(currentHospital.id, 'emergencyDoctors', -1)}
                className="p-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition-colors"
                title="Decrease doctors"
                aria-label="Decrease doctors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateHospitalResource(currentHospital.id, 'emergencyDoctors', 1)}
                className="p-1 rounded bg-slate-800 hover:bg-amber-900/60 text-slate-300 hover:text-white transition-colors"
                title="Increase doctors"
                aria-label="Increase doctors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-500 ml-auto">On Floor</span>
            </div>
          </div>

          {/* Waiting Patients (Interactive) */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Waiting Patients</span>
              <Users className="w-4 h-4 text-rose-400" />
            </div>
            <div className="font-mono text-2xl font-extrabold text-rose-400">
              {currentHospital.waitingPatients}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => updateHospitalResource(currentHospital.id, 'waitingPatients', -1)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Decrease waiting patients"
                aria-label="Decrease waiting patients"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateHospitalResource(currentHospital.id, 'waitingPatients', 1)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Increase waiting patients"
                aria-label="Increase waiting patients"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-500 ml-auto">Queue</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Incoming Ambulances & Future Bed Prediction AI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Incoming Ambulances Live Radar */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <AmbulanceIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Incoming Emergency Ambulances
                    <span className="text-xs font-mono px-2 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {incomingAmbulances.length} Inbound
                    </span>
                  </h4>
                  <div className="text-[11px] text-slate-400">
                    Live telemetry link with municipal dispatch
                  </div>
                </div>
              </div>
            </div>

            {/* List of Incoming Vehicles */}
            <div className="space-y-3">
              {incomingAmbulances.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                  No ambulances currently inbound to {currentHospital.shortName}.
                </div>
              ) : (
                incomingAmbulances.map((amb) => {
                  const isPatientAssigned = amb.assignedPatientId === activePatient.id;
                  const patientInfo = isPatientAssigned ? activePatient : null;

                  return (
                    <div
                      key={amb.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                          <span className="font-mono font-bold text-white text-sm">
                            {amb.callSign} ({amb.vehicleType})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                            ETA: {currentHospital.etaMins || 8} min
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            Speed: {amb.speedKmH} km/h
                          </span>
                        </div>
                      </div>

                      {patientInfo && (
                        <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">
                              Patient: {patientInfo.name} ({patientInfo.age}M)
                            </span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                              {patientInfo.severity}
                            </span>
                          </div>
                          <div className="text-slate-300">{patientInfo.condition}</div>
                          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 pt-1">
                            <span>HR: <strong className="text-rose-400">{patientInfo.vitals.heartRate}</strong></span>
                            <span>BP: <strong className="text-white">{patientInfo.vitals.bloodPressure}</strong></span>
                            <span>SpO2: <strong className="text-cyan-400">{patientInfo.vitals.oxygenSat}%</strong></span>
                            <span>GCS: <strong className="text-emerald-400">{patientInfo.vitals.gcsScore}</strong></span>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-slate-500 font-mono">
                          Location: {amb.currentStreet}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <GoogleMapsDirectionsButton
                            destination={{ lat: currentHospital.lat, lng: currentHospital.lng, name: currentHospital.name, address: currentHospital.address }}
                            origin={{ lat: amb.lat, lng: amb.lng }}
                            size="xs"
                            variant="secondary"
                            label="Get Directions in Google Maps"
                          />
                          <button
                            onClick={() => admitPatient(currentHospital.id, 'ICU')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Admit to ICU Bay
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Future Bed Prediction AI Panel */}
        <div className="lg:col-span-5 space-y-4">
          <FutureBedPrediction hospitalId={currentHospital.id} />

          {/* Specialty Capabilities Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Specialized Units & Emergency Services
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {currentHospital.specialties.map((spec, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 border border-slate-800 text-slate-300 font-medium"
                >
                  {spec}
                </span>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Overall Hospital Readiness:</span>
              <span className="font-bold text-emerald-400">{currentHospital.readinessScore || 90}/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
