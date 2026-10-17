import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { InteractiveMap } from './InteractiveMap';
import {
  ShieldAlert,
  Flame,
  Activity,
  BedDouble,
  Ambulance as AmbulanceIcon,
  Users,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  PieChart,
  Layers,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    hospitals,
    ambulances,
    disasterMode,
    toggleDisasterMode,
    disasterAllocations,
    trafficCondition,
    activePatient,
  } = useEmergency();

  const [activeChartTab, setActiveChartTab] = useState<'beds' | 'cases' | 'fleet' | 'readiness'>('beds');

  // Aggregate Metrics
  const totalCityBeds = hospitals.reduce((sum, h) => sum + h.totalBeds, 0);
  const totalAvailableBeds = hospitals.reduce((sum, h) => sum + h.availableBeds, 0);
  const totalIcuBeds = hospitals.reduce((sum, h) => sum + h.icuTotal, 0);
  const totalAvailableIcu = hospitals.reduce((sum, h) => sum + h.icuBeds, 0);
  const totalWaiting = hospitals.reduce((sum, h) => sum + h.waitingPatients, 0);
  const avgReadiness = Math.round(
    hospitals.reduce((sum, h) => sum + (h.readinessScore || 85), 0) / hospitals.length
  );

  const activeAmbulanceCount = ambulances.filter((a) => a.status === 'transporting' || a.status === 'dispatched').length;

  return (
    <div className="space-y-6">
      {/* Top Command Banner with Disaster Mode Toggle */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold flex items-center gap-2">
              <span>CITY EMERGENCY OPERATIONS & DISASTER COMMAND</span>
              <span className="text-slate-500">|</span>
              <span className="text-emerald-400">DEFCON 5 · NOMINAL</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">Metropolitan Dispatch & Healthcare Grid</h2>
            <p className="text-xs text-slate-400">
              Coordinating 8 hospital trauma centers, 10 ALS/CCT ambulances, and municipal green traffic corridors
            </p>
          </div>
        </div>

        {/* Disaster Mode (Mass Casualty Incident) Switch */}
        <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-xs font-bold text-white flex items-center justify-end gap-1.5">
              <Flame className={`w-4 h-4 ${disasterMode ? 'text-rose-500 animate-bounce' : 'text-slate-500'}`} />
              <span>Mass Casualty Disaster Mode</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {disasterMode ? '20 patients AI triaged & load-balanced' : 'Toggle for 20-victim surge simulation'}
            </div>
          </div>

          <button
            onClick={() => toggleDisasterMode()}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg ${
              disasterMode
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <span>{disasterMode ? 'DISABLE MCI' : 'ENABLE MCI'}</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${disasterMode ? 'bg-white animate-ping' : 'bg-slate-500'}`}
            />
          </button>
        </div>
      </div>

      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400 mb-1">Total System Beds</div>
          <div className="font-mono text-2xl font-extrabold text-white">
            {totalAvailableBeds}
            <span className="text-xs text-slate-500 font-sans ml-1">/ {totalCityBeds}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {Math.round(((totalCityBeds - totalAvailableBeds) / totalCityBeds) * 100)}% City Occupancy
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400 mb-1">ICU Beds Open</div>
          <div className="font-mono text-2xl font-extrabold text-cyan-400">
            {totalAvailableIcu}
            <span className="text-xs text-slate-500 font-sans ml-1">/ {totalIcuBeds}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Critical care buffer</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400 mb-1">Active Ambulances</div>
          <div className="font-mono text-2xl font-extrabold text-emerald-400">
            {activeAmbulanceCount}
            <span className="text-xs text-slate-500 font-sans ml-1">/ {ambulances.length}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {ambulances.length - activeAmbulanceCount} Available for dispatch
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400 mb-1">Total ER Queue</div>
          <div className="font-mono text-2xl font-extrabold text-amber-400">{totalWaiting}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Triage wait pool</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400 mb-1">Avg. Readiness Score</div>
          <div className="font-mono text-2xl font-extrabold text-emerald-400">{avgReadiness}/100</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Good operational status</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-xs text-slate-400 mb-1">Traffic Condition</div>
          <div className="font-mono text-2xl font-extrabold uppercase text-white flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                trafficCondition === 'green'
                  ? 'bg-emerald-500'
                  : trafficCondition === 'yellow'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-base">{trafficCondition}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Municipal corridors</div>
        </div>
      </div>

      {/* Main Command View: Master Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
            Live Citywide Fleet & Hospital Map
          </h3>
          <span className="text-xs text-slate-400">8 Hospitals · 10 Ambulances · Dynamic Traffic Routing</span>
        </div>
        <InteractiveMap height="h-[480px]" focusTarget="all" />
      </div>

      {/* Disaster Mode Allocation Table (Shows when disaster mode is ON) */}
      {disasterMode && (
        <div className="p-5 rounded-2xl bg-rose-950/20 border-2 border-rose-500/60 shadow-2xl space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-rose-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Mass Casualty Incident (MCI) AI Distribution Matrix
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    20 Patients Triaged
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Automated START Triage load-balancing prevents saturation of primary trauma facilities
                </p>
              </div>
            </div>

            <button
              onClick={() => toggleDisasterMode(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-optimize Allocations
            </button>
          </div>

          {/* Allocation Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Triage Tag</th>
                  <th className="py-2.5 px-3">Injury Severity</th>
                  <th className="py-2.5 px-3">Assigned Facility</th>
                  <th className="py-2.5 px-3">Bed Unit</th>
                  <th className="py-2.5 px-3">ETA</th>
                  <th className="py-2.5 px-3">AI Allocation Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-sans text-slate-300">
                {disasterAllocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-400">{alloc.id}</td>
                    <td className="py-2.5 px-3 font-medium text-white">
                      {alloc.patientName} ({alloc.age})
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          alloc.triageColor === 'red'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : alloc.triageColor === 'yellow'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : alloc.triageColor === 'green'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {alloc.triageCategory}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-[200px] truncate" title={alloc.injury}>
                      {alloc.injury}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">{alloc.assignedHospitalName}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-400">{alloc.bedType}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-200">{alloc.etaMinutes}m</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] leading-relaxed max-w-[280px]">
                      {alloc.aiExplanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Analytics & Charts Grid */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            AI Emergency Analytics & Resource Visualization
          </h3>

          {/* Interactive Chart Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveChartTab('beds')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeChartTab === 'beds' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bed Usage
            </button>
            <button
              onClick={() => setActiveChartTab('cases')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeChartTab === 'cases' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Emergency Cases
            </button>
            <button
              onClick={() => setActiveChartTab('fleet')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeChartTab === 'fleet' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ambulance Fleet
            </button>
            <button
              onClick={() => setActiveChartTab('readiness')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeChartTab === 'readiness' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Readiness Scores
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          {/* Chart 1: Hospital Bed Usage */}
          {activeChartTab === 'beds' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Facility Occupancy Comparison (Available vs Occupied Beds)</span>
                <span className="font-mono text-cyan-400">Live Telemetry Sync</span>
              </div>
              <div className="space-y-3">
                {hospitals.map((h) => {
                  const occupiedBeds = h.totalBeds - h.availableBeds;
                  const occupancyPct = Math.round((occupiedBeds / h.totalBeds) * 100);

                  return (
                    <div key={h.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200">{h.name}</span>
                        <div className="font-mono text-xs text-slate-400 flex items-center gap-3">
                          <span>
                            {h.availableBeds} beds open <span className="text-slate-600">({h.icuBeds} ICU)</span>
                          </span>
                          <span className={`font-bold ${occupancyPct > 90 ? 'text-rose-400' : 'text-slate-300'}`}>
                            {occupancyPct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 flex">
                        <div
                          className={`h-full transition-all duration-700 ${
                            occupancyPct > 90 ? 'bg-rose-500' : occupancyPct > 75 ? 'bg-amber-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${occupancyPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chart 2: Emergency Cases Distribution */}
          {activeChartTab === 'cases' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Active Citywide Emergency Incident Categories</span>
                <span className="font-mono text-cyan-400">911 Dispatch Feed</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400">Cardiovascular & STEMI</div>
                  <div className="font-mono text-2xl font-bold text-rose-400">34%</div>
                  <div className="text-[11px] text-slate-500">12 Active Cases · Priority Red</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: '34%' }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400">Severe Trauma & Surgical</div>
                  <div className="font-mono text-2xl font-bold text-amber-400">28%</div>
                  <div className="text-[11px] text-slate-500">9 Active Cases · Level 1 Resus</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '28%' }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400">Neuro & Stroke Intervention</div>
                  <div className="font-mono text-2xl font-bold text-cyan-400">22%</div>
                  <div className="text-[11px] text-slate-500">7 Active Cases · Thrombectomy</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: '22%' }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400">Respiratory & Critical Care</div>
                  <div className="font-mono text-2xl font-bold text-emerald-400">16%</div>
                  <div className="text-[11px] text-slate-500">5 Active Cases · Ventilator Req</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '16%' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chart 3: Ambulance Fleet Distribution */}
          {activeChartTab === 'fleet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Fleet Operational Status (10 Dedicated Metropolitan Units)</span>
                <span className="font-mono text-cyan-400">Live GPS Polling</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 font-mono">IDLE / BASE</div>
                  <div className="font-mono text-2xl font-bold text-emerald-400 mt-1">
                    {ambulances.filter((a) => a.status === 'idle').length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Ready for dispatch</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 font-mono">DISPATCHED</div>
                  <div className="font-mono text-2xl font-bold text-cyan-400 mt-1">
                    {ambulances.filter((a) => a.status === 'dispatched').length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">En route to scene</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 font-mono">AT SCENE</div>
                  <div className="font-mono text-2xl font-bold text-amber-400 mt-1">
                    {ambulances.filter((a) => a.status === 'at_scene').length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Stabilizing patient</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 font-mono">TRANSPORTING</div>
                  <div className="font-mono text-2xl font-bold text-rose-400 mt-1">
                    {ambulances.filter((a) => a.status === 'transporting').length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Heading to hospital</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 font-mono">RETURNING</div>
                  <div className="font-mono text-2xl font-bold text-slate-300 mt-1">
                    {ambulances.filter((a) => a.status === 'returning').length}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Post-handover</div>
                </div>
              </div>
            </div>
          )}

          {/* Chart 4: Readiness Score Comparison */}
          {activeChartTab === 'readiness' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>AI Emergency Readiness Score Comparison Across All Facilities</span>
                <span className="font-mono text-cyan-400">Scores updated every 4s</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {hospitals.map((h) => {
                  const score = h.readinessScore || 88;
                  return (
                    <div key={h.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-white truncate">{h.shortName}</span>
                        <span
                          className={`font-mono text-sm font-bold ${
                            score >= 85
                              ? 'text-emerald-400'
                              : score >= 70
                              ? 'text-cyan-400'
                              : score >= 50
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {score}/100
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            score >= 85
                              ? 'bg-emerald-400'
                              : score >= 70
                              ? 'bg-cyan-400'
                              : score >= 50
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between font-mono">
                        <span>{h.availableBeds} beds</span>
                        <span>{h.icuBeds} ICU</span>
                        <span>{h.emergencyDoctors} docs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
