import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { Sparkles, TrendingUp, TrendingDown, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface FutureBedPredictionProps {
  hospitalId: string;
}

export const FutureBedPrediction: React.FC<FutureBedPredictionProps> = ({ hospitalId }) => {
  const { getHospitalPrediction, hospitals } = useEmergency();
  const hosp = hospitals.find((h) => h.id === hospitalId) || hospitals[0];
  const prediction = getHospitalPrediction(hospitalId);

  const delta30 = prediction.predicted30m - prediction.currentBeds;
  const delta60 = prediction.predicted60m - prediction.currentBeds;

  const maxBeds = Math.max(hosp.totalBeds, prediction.predicted60m, 30);
  const currentPct = Math.min(100, Math.round((prediction.currentBeds / maxBeds) * 100));
  const pct30 = Math.min(100, Math.round((prediction.predicted30m / maxBeds) * 100));
  const pct60 = Math.min(100, Math.round((prediction.predicted60m / maxBeds) * 100));

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Future Bed Availability Prediction
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                AI FORECAST
              </span>
            </h4>
            <div className="text-[11px] text-slate-400">
              Discharge regression model for {hosp.shortName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{prediction.confidence}% Confidence</span>
        </div>
      </div>

      {/* 3-Pillar Animated Comparison Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Current Beds */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold mb-1">
            Current Beds
          </div>
          <div className="font-mono text-3xl font-extrabold text-white tracking-tight">
            {prediction.currentBeds}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Immediate live count</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${currentPct}%` }}
            />
          </div>
        </div>

        {/* Predicted 30 mins */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-semibold mb-1 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            +30 Minutes
          </div>
          <div className="font-mono text-3xl font-extrabold text-cyan-400 tracking-tight flex items-center justify-center gap-1">
            {prediction.predicted30m}
            <span className="text-xs font-semibold">
              {delta30 >= 0 ? `+${delta30}` : `${delta30}`}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            {delta30 >= 0 ? 'Net discharges opening' : 'Incoming caseload load'}
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct30}%` }}
            />
          </div>
        </div>

        {/* Predicted 60 mins */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 font-semibold mb-1 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            +60 Minutes
          </div>
          <div className="font-mono text-3xl font-extrabold text-emerald-400 tracking-tight flex items-center justify-center gap-1">
            {prediction.predicted60m}
            <span className="text-xs font-semibold">
              {delta60 >= 0 ? `+${delta60}` : `${delta60}`}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">Post-shift ward turnover</div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct60}%` }}
            />
          </div>
        </div>
      </div>

      {/* Explanatory AI details */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {prediction.trend === 'increasing' ? (
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <TrendingDown className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>
            Discharge Velocity: <strong className="text-white font-mono">{prediction.dischargeRatePerHour} beds/hr</strong> · Inflow Rate: <strong className="text-white font-mono">{prediction.incomingRatePerHour} cases/hr</strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          Model: Gradient-Boosted ER Turnover
        </div>
      </div>
    </div>
  );
};
