import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { calculateEmergencyReadinessScore } from '../services/aiReadiness';
import { GeminiRecommendationAssistant } from './GeminiRecommendationAssistant';
import {
  Sparkles,
  X,
  CheckCircle,
  ShieldCheck,
  Clock,
  BedDouble,
  Stethoscope,
  Wind,
  AlertCircle,
  Layers,
  Cpu,
} from 'lucide-react';

export const ExplainableModal: React.FC = () => {
  const { explainModalOpen, setExplainModalOpen, topHospital, backupHospital, rankedHospitals, activePatient } = useEmergency();
  const [activeTab, setActiveTab] = useState<'gemini' | 'deterministic'>('gemini');

  if (!explainModalOpen) return null;

  const topBreakdown = calculateEmergencyReadinessScore(topHospital, topHospital.etaMins || 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                <span>Explainable AI (XAI) Intelligence Report</span>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400">[SIMULATED DEMO OUTPUT]</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Why {topHospital.name} was Selected
              </h3>
            </div>
          </div>
          <button
            onClick={() => setExplainModalOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 gap-2">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`py-3 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'gemini'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Gemini Clinical Assistant (Explainable AI)
          </button>

          <button
            onClick={() => setActiveTab('deterministic')}
            className={`py-3 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'deterministic'
                ? 'border-blue-400 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Deterministic Factor Weights & watsonx
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'gemini' ? (
            <GeminiRecommendationAssistant compact={false} />
          ) : (
            <div className="space-y-6">
              {/* Patient Acuity Context */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                  <span>PATIENT PROFILE & TRIAGE CONTEXT</span>
                  <span className="text-amber-400 text-[10px]">[SIMULATED DEMO TELEMETRY]</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-white">{activePatient.name} ({activePatient.age}M)</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40">
                    {activePatient.severity} Priority
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Condition: <span className="text-white font-medium">{activePatient.condition}</span>
                </p>
              </div>

              {/* Primary AI Decision Factor Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Scoring Weights Breakdown (Readiness: {topBreakdown.score}/100)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <BedDouble className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Available Beds</span>
                    </div>
                    <div className="mt-1 font-mono font-bold text-lg text-emerald-400">
                      {topBreakdown.bedScore} <span className="text-xs text-slate-500">/ 25</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{topHospital.availableBeds} beds vacant</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ICU Availability</span>
                    </div>
                    <div className="mt-1 font-mono font-bold text-lg text-emerald-400">
                      {topBreakdown.icuScore} <span className="text-xs text-slate-500">/ 25</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{topHospital.icuBeds} ICU bays open</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Wind className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Ventilators</span>
                    </div>
                    <div className="mt-1 font-mono font-bold text-lg text-emerald-400">
                      {topBreakdown.ventilatorScore} <span className="text-xs text-slate-500">/ 15</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{topHospital.ventilators} ready</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Doctor Capacity</span>
                    </div>
                    <div className="mt-1 font-mono font-bold text-lg text-emerald-400">
                      {topBreakdown.doctorScore} <span className="text-xs text-slate-500">/ 15</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{topHospital.emergencyDoctors} active on floor</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Travel Factor</span>
                    </div>
                    <div className="mt-1 font-mono font-bold text-lg text-emerald-400">
                      {topBreakdown.travelPenalty} <span className="text-xs text-slate-500">/ 10</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">ETA {topHospital.etaMins || 8} min</div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Queue Factor</span>
                    </div>
                    <div className="mt-1 font-mono font-bold text-lg text-emerald-400">
                      {topBreakdown.queuePenalty} <span className="text-xs text-slate-500">/ 10</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{topHospital.waitingPatients} waiting in ER</div>
                  </div>
                </div>
              </div>

              {/* AI Decision Bullet Points */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Key Decisive Rationale
                </h4>
                <div className="space-y-1.5">
                  {(topHospital.whySelected || [
                    `Highest composite Readiness Score: ${topBreakdown.score}/100`,
                    `Dedicated ICU beds vacant and reserved for immediate catheterization`,
                    `Fastest calculated emergency corridor travel time (${topHospital.etaMins || 8} min)`,
                    `Low ER waiting turnaround time (< 15 mins)`,
                  ]).map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hospital Ranking Comparison Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Multi-Facility Ranking Matrix (Top 4)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Rank</th>
                        <th className="py-2 px-3">Facility</th>
                        <th className="py-2 px-3">Readiness</th>
                        <th className="py-2 px-3">Open Beds</th>
                        <th className="py-2 px-3">ICU</th>
                        <th className="py-2 px-3">ETA</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                      {rankedHospitals.slice(0, 4).map((h, i) => (
                        <tr key={h.id} className={i === 0 ? 'bg-emerald-950/20 font-bold text-emerald-300' : 'hover:bg-slate-800/40'}>
                          <td className="py-2 px-3">#{i + 1}</td>
                          <td className="py-2 px-3 font-sans font-medium text-slate-100">{h.shortName}</td>
                          <td className="py-2 px-3">{h.readinessScore || 85}/100</td>
                          <td className="py-2 px-3">{h.availableBeds}</td>
                          <td className="py-2 px-3">{h.icuBeds}</td>
                          <td className="py-2 px-3">{h.etaMins || 8}m</td>
                          <td className="py-2 px-3">
                            {i === 0 ? (
                              <span className="text-emerald-400">Selected</span>
                            ) : i === 1 ? (
                              <span className="text-cyan-400">Smart Backup</span>
                            ) : (
                              <span className="text-slate-500">Standby</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            Powered by Google Gemini 3.8 Flash · IBM LinuxONE Enclave · watsonx.ai
          </div>
          <button
            onClick={() => setExplainModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
