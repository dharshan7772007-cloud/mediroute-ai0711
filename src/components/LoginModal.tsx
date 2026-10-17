import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { Role } from '../types';
import { Ambulance, Building2, ShieldAlert, X, ArrowRight, KeyRound, Check } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { loginModalOpen, setLoginModalOpen, currentRole, setCurrentRole } = useEmergency();

  if (!loginModalOpen) return null;

  const handleSelectRole = (role: Role) => {
    setCurrentRole(role);
    setLoginModalOpen(false);
  };

  const credentials = [
    {
      role: 'ambulance' as Role,
      title: 'Ambulance Crew (EMS)',
      unit: 'MED-101 (Advanced Life Support)',
      email: 'paramedic.unit101@mediroute.ai',
      pass: 'ems-rescue-911',
      icon: Ambulance,
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:border-cyan-400',
      features: ['Turn-by-turn live navigation', 'Patient vitals & STEMI telemetry', 'Instant Backup Hospital requests'],
    },
    {
      role: 'hospital' as Role,
      title: 'Hospital ER Director',
      unit: 'Metro General Trauma Center (Level 1)',
      email: 'chief.er@metrogeneral.org',
      pass: 'trauma-er-2026',
      icon: Building2,
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-400',
      features: ['Instant bed & ICU resource modifier', 'Future AI bed prediction forecast', 'Incoming ambulance patient admit control'],
    },
    {
      role: 'admin' as Role,
      title: 'City Command Admin',
      unit: 'Metropolitan Emergency Command Hub',
      email: 'commander@emergencydispatch.gov',
      pass: 'citywide-mci-admin',
      icon: ShieldAlert,
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10 hover:border-blue-400',
      features: ['Live metropolitan fleet & hospital map', 'Disaster / Mass Casualty Incident (MCI) switch', 'System-wide analytics & bed distribution'],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">MediRoute AI Demo Access</h3>
              <p className="text-xs text-slate-400">Select any role to instantly experience that user workflow</p>
            </div>
          </div>
          <button
            onClick={() => setLoginModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          {credentials.map((cred) => {
            const Icon = cred.icon;
            const isCurrent = currentRole === cred.role;

            return (
              <div
                key={cred.role}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent ? 'border-cyan-400 bg-slate-800/80 shadow-lg shadow-cyan-500/10' : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cred.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{cred.title}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{cred.unit}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectRole(cred.role)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <span>Switch Role</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                  <div>
                    Demo Email: <span className="text-slate-200">{cred.email}</span>
                  </div>
                  <div>
                    Password: <span className="text-slate-200">{cred.pass}</span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {cred.features.map((feat, i) => (
                    <span key={i} className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Check className="w-3 h-3 text-cyan-400" />
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setLoginModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
