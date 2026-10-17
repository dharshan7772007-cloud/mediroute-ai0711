import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { AlertTriangle, ArrowRight, Hospital as HospitalIcon, ShieldAlert, Check } from 'lucide-react';
import { GoogleMapsDirectionsButton } from './GoogleMapsDirectionsButton';

export const SmartBackupAlertModal: React.FC = () => {
  const { smartBackupAlert, closeSmartBackupAlert, ambulances, selectedAmbulanceId } = useEmergency();

  if (!smartBackupAlert || !smartBackupAlert.isOpen) return null;

  const { previousHospital, newHospital, reason } = smartBackupAlert;
  const activeAmbulance = ambulances.find((a) => a.id === selectedAmbulanceId) || ambulances[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-rose-500 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100">
        {/* Glow backdrop */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">
              Dynamic Auto-Reroute Activated
            </span>
            <h3 className="text-xl font-extrabold text-white">
              Hospital Full. Switching to {newHospital?.shortName || 'Backup Hospital'}.
            </h3>
          </div>
        </div>

        <div className="py-4 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 font-mono text-xs">
            {reason}
          </p>

          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Previous Hospital (Full) */}
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/60 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
                ORIGINAL TARGET (DIVERTED)
              </span>
              <div className="font-semibold text-sm text-slate-200 truncate">
                {previousHospital?.name || 'Previous Hospital'}
              </div>
              <div className="text-xs text-rose-400 font-mono font-bold">
                0 Available Beds (Capacity Exhausted)
              </div>
            </div>

            {/* New Hospital (Backup) */}
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/60 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                NEW TARGET (CONFIRMED)
              </span>
              <div className="font-semibold text-sm text-slate-100 truncate">
                {newHospital?.name || 'Backup Hospital'}
              </div>
              <div className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {newHospital?.availableBeds || 12} Beds Open · {newHospital?.icuBeds || 4} ICU
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Recalculated Arrival Time:</span>
              <span className="font-mono font-bold text-cyan-400">
                {newHospital?.etaMins || 8} Minutes
              </span>
            </div>
            <div className="flex justify-between">
              <span>Emergency Corridor Traffic:</span>
              <span className="font-mono font-bold text-emerald-400">Green Wave Priority</span>
            </div>
            <div className="flex justify-between">
              <span>Hospital Notification:</span>
              <span className="font-mono font-bold text-slate-200">Cath Lab & ER Team Pre-Alerted</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {newHospital && (
            <GoogleMapsDirectionsButton
              destination={{ lat: newHospital.lat, lng: newHospital.lng, name: newHospital.name, address: newHospital.address }}
              origin={activeAmbulance ? { lat: activeAmbulance.lat, lng: activeAmbulance.lng } : null}
              size="md"
              variant="secondary"
              label="Get Directions in Google Maps"
            />
          )}
          <button
            onClick={closeSmartBackupAlert}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
          >
            Acknowledge & Continue Navigation
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
