import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useEmergency } from '../context/EmergencyContext';
import { InteractiveMap } from './InteractiveMap';
import { playAudioDispatchChime } from '../services/ibmIntegration';
import { Hospital, Ambulance, TrafficCondition } from '../types';
import { GoogleMapsDirectionsButton } from './GoogleMapsDirectionsButton';
import {
  CheckCircle2,
  CircleDot,
  Clock,
  Navigation,
  ShieldCheck,
  Building2,
  Ambulance as AmbulanceIcon,
  MapPin,
  TrendingUp,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Radio,
  Activity,
  Cpu,
  ArrowRight,
  Terminal,
  Zap,
  Check,
  Volume2,
} from 'lucide-react';

interface StageDefinition {
  step: number;
  title: string;
  category: string;
  defaultDescription: string;
  logMessage: (ctx: SimContext) => string;
}

interface SimContext {
  hospital: Hospital;
  ambulance: Ambulance;
  patientName: string;
  condition: string;
  severity: string;
  traffic: TrafficCondition;
  eta: number;
  availableBeds: number;
  icuBeds: number;
  confidence: number;
  responseTime: string;
}

const STAGES: StageDefinition[] = [
  {
    step: 1,
    title: 'Emergency Report Received',
    category: 'Ingestion',
    defaultDescription: '911 Emergency dispatch call received; digital triage record initiated.',
    logMessage: (ctx) => `Emergency call received for ${ctx.patientName} (${ctx.severity} ${ctx.condition}). Ingested into dispatch broker.`,
  },
  {
    step: 2,
    title: 'AI Severity Classification',
    category: 'Triage AI',
    defaultDescription: 'IBM watsonx.ai Granite 3.0 analyzes patient symptoms and assigns high-acuity priority.',
    logMessage: (ctx) => `watsonx.ai classified acuity: Priority 1 Critical (${ctx.condition}). AI confidence: ${ctx.confidence}%.`,
  },
  {
    step: 3,
    title: 'GPS Location Detection',
    category: 'Telemetry',
    defaultDescription: 'Caller geospatial coordinates captured; pickup zone calibrated.',
    logMessage: (ctx) => `GPS fix verified at Civic Center Corridor. Geofence established.`,
  },
  {
    step: 4,
    title: 'Nearby Ambulances Found',
    category: 'Fleet Scan',
    defaultDescription: 'Scanning metropolitan fleet telemetry for active Advanced Life Support vehicles.',
    logMessage: (ctx) => `Scanning fleet: 4 ALS vehicles within 3.5 km radius. Polling telemetry...`,
  },
  {
    step: 5,
    title: 'Best Ambulance Assigned',
    category: 'Dispatch',
    defaultDescription: 'Optimal vehicle dispatched based on proximity and paramedic ALS certifications.',
    logMessage: (ctx) => `Unit ${ctx.ambulance.callSign} (${ctx.ambulance.vehicleType}) assigned. Paramedic crew acknowledged.`,
  },
  {
    step: 6,
    title: 'Live Route Optimization',
    category: 'Corridor Routing',
    defaultDescription: 'Analyzing municipal traffic sensors; dynamic route recalculated for emergency corridor.',
    logMessage: (ctx) => `Traffic evaluated (${ctx.traffic.toUpperCase()}). Emergency green corridor route calculated. ETA: ${ctx.eta} min.`,
  },
  {
    step: 7,
    title: 'Nearby Hospitals Loaded',
    category: 'Capacity Scan',
    defaultDescription: 'Querying live electronic health record bed capacities across 8 trauma centers.',
    logMessage: (ctx) => `Querying 8 hospital nodes. Scanning bed counts, ICU vacancies, and on-duty ER physicians.`,
  },
  {
    step: 8,
    title: 'AI Hospital Readiness Score Calculated',
    category: 'Scoring Engine',
    defaultDescription: 'Multi-variable formula computes real-time score based on beds, ICU, and travel time.',
    logMessage: (ctx) => `Calculating Emergency Readiness Scores. Top candidate: ${ctx.hospital.shortName} (Score: ${ctx.hospital.readinessScore || 94}/100).`,
  },
  {
    step: 9,
    title: 'Best Hospital Selected & Gemini Synthesis',
    category: 'Decision & XAI',
    defaultDescription: 'Optimal destination hospital locked; Gemini 3.8 Flash generates explainable clinical justification & SBAR radio report.',
    logMessage: (ctx) => `Selected: ${ctx.hospital.name}. Gemini 3.8 Flash CDSS validated clinical match (${ctx.icuBeds} ICU bays open, ETA ${ctx.eta} min). SBAR radio patch primed.`,
  },
  {
    step: 10,
    title: 'Hospital Notified',
    category: 'Interoperability',
    defaultDescription: 'HL7 FHIR R4 encounter payload transmitted to receiving hospital emergency department.',
    logMessage: (ctx) => `HL7 FHIR R4 encounter bundle sent to ${ctx.hospital.shortName}. Cath lab and Trauma Bay 4 pre-alerted.`,
  },
  {
    step: 11,
    title: 'Patient Successfully Allocated',
    category: 'Admission',
    defaultDescription: 'Vehicle arrives at ambulance bay; immediate bed transfer and clinical admission completed.',
    logMessage: (ctx) => `Patient admitted to ${ctx.hospital.shortName} (${ctx.icuBeds} ICU bay reserved). Total response time: ${ctx.responseTime}.`,
  },
];

export const WorkflowStepper: React.FC = () => {
  const { hospitals, ambulances, setTrafficCondition, setExplainModalOpen } = useEmergency();

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStage, setCurrentStage] = useState(0); // 0 = not started, 1..11 = active stage, 12 = complete
  const [logs, setLogs] = useState<{ id: string; time: string; text: string; step: number }[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Dynamic simulation context generated on each run to guarantee realistic variability
  const [simContext, setSimContext] = useState<SimContext>(() => {
    const hosp = hospitals[0] || {
      id: 'hosp-1',
      name: 'Metro General Trauma Center',
      shortName: 'Metro General',
      readinessScore: 94,
    } as Hospital;
    const amb = ambulances[0] || {
      id: 'amb-1',
      callSign: 'MED-101',
      vehicleType: 'Advanced Life Support (ALS)',
    } as Ambulance;
    return {
      hospital: hosp,
      ambulance: amb,
      patientName: 'David Miller',
      condition: 'Acute STEMI Anterior Elevation',
      severity: 'Critical Priority 1',
      traffic: 'green',
      eta: 8,
      availableBeds: hosp.availableBeds || 18,
      icuBeds: hosp.icuBeds || 6,
      confidence: 97.8,
      responseTime: '7.2 minutes',
    };
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Generate randomized but realistic data for each simulation run
  const generateNewScenarioContext = (): SimContext => {
    // Pick a hospital (weighted towards trauma/cardiac capable)
    const shuffledHospitals = [...hospitals].sort(() => 0.5 - Math.random());
    const hosp = shuffledHospitals[0] || hospitals[0];

    // Pick an ambulance
    const shuffledAmbs = [...ambulances].sort(() => 0.5 - Math.random());
    const amb = shuffledAmbs[0] || ambulances[0];

    // Random traffic state
    const trafficOptions: TrafficCondition[] = ['green', 'green', 'yellow', 'red'];
    const traffic = trafficOptions[Math.floor(Math.random() * trafficOptions.length)];

    // Realistic conditions
    const conditions = [
      { name: 'Marcus Chen', condition: 'Acute STEMI Anterior Wall', severity: 'Critical Priority 1', baseEta: 7 },
      { name: 'Sarah Jenkins', condition: 'Severe Polytrauma & Crush Injury', severity: 'Immediate Red Priority', baseEta: 9 },
      { name: 'Robert Vance', condition: 'Acute Ischemic Stroke (LVO)', severity: 'Critical Priority 1', baseEta: 8 },
      { name: 'Elena Rostova', condition: 'Traumatic Hemopneumothorax', severity: 'Critical Priority 1', baseEta: 6 },
    ];
    const pickedCondition = conditions[Math.floor(Math.random() * conditions.length)];

    const etaModifier = traffic === 'green' ? 0 : traffic === 'yellow' ? 2 : 4;
    const finalEta = pickedCondition.baseEta + etaModifier;

    const dynamicBeds = Math.max(4, (hosp.availableBeds || 12) + (Math.floor(Math.random() * 5) - 2));
    const dynamicIcu = Math.max(2, (hosp.icuBeds || 4) + (Math.floor(Math.random() * 3) - 1));
    const confidence = Number((96.2 + Math.random() * 3.3).toFixed(1));
    const responseMin = (finalEta * 0.9).toFixed(1);

    return {
      hospital: {
        ...hosp,
        availableBeds: dynamicBeds,
        icuBeds: dynamicIcu,
        readinessScore: Math.min(99, Math.max(82, (hosp.readinessScore || 90) + (Math.floor(Math.random() * 6) - 2))),
      },
      ambulance: amb,
      patientName: pickedCondition.name,
      condition: pickedCondition.condition,
      severity: pickedCondition.severity,
      traffic,
      eta: finalEta,
      availableBeds: dynamicBeds,
      icuBeds: dynamicIcu,
      confidence,
      responseTime: `${responseMin} minutes`,
    };
  };

  // Start Simulation Handler
  const startSimulation = () => {
    // Generate fresh randomized scenario parameters
    const newCtx = generateNewScenarioContext();
    setSimContext(newCtx);
    setTrafficCondition(newCtx.traffic);

    setIsComplete(false);
    setIsSimulating(true);
    setCurrentStage(1);
    setLogs([]);

    playAudioDispatchChime();

    // Add first stage log
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const initialLog = {
      id: `log-1-${Date.now()}`,
      time: now,
      text: STAGES[0].logMessage(newCtx),
      step: 1,
    };
    setLogs([initialLog]);
  };

  // Step progression effect (Every 2 seconds move to next stage)
  useEffect(() => {
    if (!isSimulating) return;

    if (currentStage >= 1 && currentStage <= 11) {
      timerRef.current = setTimeout(() => {
        const nextStage = currentStage + 1;

        if (nextStage <= 11) {
          setCurrentStage(nextStage);

          // Update context or trigger visual events at specific milestones
          if (nextStage === 6) {
            // Live route optimization - simulate audio chime or route check
            playAudioDispatchChime();
          }

          // Add decision log
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const stageDef = STAGES[nextStage - 1];
          const newLog = {
            id: `log-${nextStage}-${Date.now()}`,
            time: now,
            text: stageDef.logMessage(simContext),
            step: nextStage,
          };

          setLogs((prev) => [newLog, ...prev]);
        } else {
          // Finished all 11 stages!
          setCurrentStage(12);
          setIsSimulating(false);
          setIsComplete(true);
          playAudioDispatchChime();
        }
      }, 2000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isSimulating, currentStage, simContext]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  // Calculate Progress percentage (0 - 100%)
  const progressPercent = currentStage === 0 ? 0 : currentStage > 11 ? 100 : Math.round(((currentStage - 1) / 10) * 100);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>AUTONOMOUS EMERGENCY INTELLIGENCE PIPELINE</span>
            <span className="text-slate-500">·</span>
            <span className="text-blue-400">watsonx.ai Granite 3.0</span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-0.5">
            11-Stage Emergency Allocation & Care Workflow
          </h2>
          <p className="text-xs text-slate-400">
            Real-time automated decision orchestration from 911 intake to clinical bed allocation
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {!isSimulating && !isComplete && (
            <button
              onClick={startSimulation}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Start Emergency Simulation</span>
            </button>
          )}

          {isSimulating && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 font-mono text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-bold">Simulating: Stage {currentStage} of 11</span>
            </div>
          )}

          {isComplete && (
            <button
              onClick={startSimulation}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Run Again</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Progress Bar & Stage Indicator */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
        <div className="flex flex-wrap items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Pipeline Status:</span>
            <span
              className={`font-bold ${
                isComplete
                  ? 'text-emerald-400'
                  : isSimulating
                  ? 'text-cyan-400'
                  : 'text-slate-400'
              }`}
            >
              {isComplete
                ? 'All 11 Stages Successfully Managed'
                : isSimulating
                ? `Stage ${currentStage} of 11: ${STAGES[currentStage - 1]?.title}`
                : 'Ready to Run'}
            </span>
          </div>

          <div className="text-slate-400 flex items-center gap-3">
            <span>Progress: <strong className="text-white font-mono">{progressPercent}%</strong></span>
            {isSimulating && (
              <span className="text-cyan-400 font-mono text-[11px] animate-pulse">
                Auto-advancing every 2s
              </span>
            )}
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Completion Banner (Displayed upon 100% completion) */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-5 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500/80 shadow-2xl space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                    WORKFLOW PIPELINE COMPLETED
                  </div>
                  <h3 className="text-lg font-extrabold text-white">
                    Emergency Successfully Managed
                  </h3>
                  <p className="text-xs text-slate-300">
                    Patient safely allocated and pre-admitted through autonomous multi-variable routing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExplainModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Inspect Gemini CDSS</span>
                </button>

                <button
                  onClick={startSimulation}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Run Again</span>
                </button>
              </div>
            </div>

            {/* 4 Summary Verification Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Total Response Time</div>
                <div className="font-mono text-lg font-bold text-emerald-400 mt-0.5">
                  {simContext.responseTime}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">Intake to arrival</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Selected Hospital</div>
                <div className="font-bold text-sm text-white mt-0.5 truncate" title={simContext.hospital.name}>
                  {simContext.hospital.shortName}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  {simContext.icuBeds} ICU Bay Reserved
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">Dispatched Unit</div>
                <div className="font-mono text-sm font-bold text-cyan-400 mt-0.5">
                  {simContext.ambulance.callSign}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {simContext.ambulance.vehicleType}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">AI Model Confidence</div>
                <div className="font-mono text-lg font-bold text-cyan-400 mt-0.5">
                  {simContext.confidence}%
                </div>
                <div className="text-[10px] text-slate-400 font-mono">watsonx.ai Granite 3.0</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dual Panel: Live Interactive Map Telemetry + Streaming AI Decision Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map with animated route progression */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Live Route Optimization & Fleet Topology
            </h3>
            <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <span>Dynamic ETA: <strong className="text-cyan-400">{simContext.eta} min</strong></span>
              <span>·</span>
              <span className="uppercase text-slate-300 font-bold">{simContext.traffic} Traffic</span>
            </div>
          </div>

          <InteractiveMap height="h-[380px]" focusTarget="all" />

          {/* Real-time Status Card below map */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-300">Target Facility: <strong className="text-white font-sans">{simContext.hospital.name}</strong></span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-slate-400">
              <span>Beds Open: <strong className="text-emerald-400">{simContext.availableBeds}</strong></span>
              <span>ICU: <strong className="text-cyan-400">{simContext.icuBeds}</strong></span>
              <span>Readiness: <strong className="text-emerald-400">{simContext.hospital.readinessScore || 94}/100</strong></span>
              <GoogleMapsDirectionsButton
                destination={{ lat: simContext.hospital.lat, lng: simContext.hospital.lng, name: simContext.hospital.name, address: simContext.hospital.address }}
                origin={{ lat: simContext.ambulance.lat, lng: simContext.ambulance.lng }}
                size="xs"
                variant="primary"
                label="Get Directions in Google Maps"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Live AI Decision Logs Terminal */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Live AI Decision Logs (watsonx.ai)
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              {logs.length} events logged
            </span>
          </div>

          <div
            ref={logContainerRef}
            className="h-[432px] rounded-xl border border-slate-800 bg-slate-950 p-3.5 overflow-y-auto space-y-2 font-mono text-xs"
          >
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Radio className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs">No active simulation running.</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Click "Start Emergency Simulation" above to observe live AI decision events.
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className="text-cyan-400 font-bold">Stage {log.step}: {STAGES[log.step - 1]?.title}</span>
                    <span>{log.time}</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed font-sans">{log.text}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 11 Stage Progression Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
          <span>End-to-End Autonomous Pipeline Architecture (11 Stages)</span>
          <span className="text-slate-500 font-normal">Step-by-step lifecycle verification</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STAGES.map((stage) => {
            const isStageCompleted = currentStage > stage.step || isComplete;
            const isStageActive = currentStage === stage.step && isSimulating;
            const isUpcoming = currentStage < stage.step && !isComplete;

            return (
              <motion.div
                key={stage.step}
                layout
                className={`p-4 rounded-xl border transition-all relative overflow-hidden ${
                  isStageActive
                    ? 'bg-slate-900/90 border-cyan-400 shadow-xl shadow-cyan-500/20 ring-2 ring-cyan-500/30'
                    : isStageCompleted
                    ? 'bg-slate-900/70 border-emerald-500/40'
                    : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                }`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                        isStageCompleted
                          ? 'bg-emerald-500 text-slate-950'
                          : isStageActive
                          ? 'bg-cyan-500 text-slate-950 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {stage.step}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                      {stage.category}
                    </span>
                  </div>

                  <div>
                    {isStageCompleted && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        COMPLETED
                      </span>
                    )}

                    {isStageActive && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 font-bold animate-pulse">
                        <CircleDot className="w-3.5 h-3.5" />
                        PROCESSING...
                      </span>
                    )}

                    {isUpcoming && (
                      <span className="text-[10px] font-mono text-slate-500">QUEUED</span>
                    )}
                  </div>
                </div>

                {/* Stage Body */}
                <div className="pt-3 space-y-1">
                  <h4
                    className={`text-sm font-bold transition-colors ${
                      isStageActive
                        ? 'text-cyan-300'
                        : isStageCompleted
                        ? 'text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {stage.defaultDescription}
                  </p>
                </div>

                {/* Dynamic Data Highlights when active or completed */}
                {stage.step === 5 && (isStageCompleted || isStageActive) && (
                  <div className="mt-3 p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex justify-between">
                    <span>Assigned Ambulance:</span>
                    <span className="text-cyan-400 font-bold">{simContext.ambulance.callSign}</span>
                  </div>
                )}

                {stage.step === 6 && (isStageCompleted || isStageActive) && (
                  <div className="mt-3 p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex justify-between">
                    <span>Calculated ETA:</span>
                    <span className="text-cyan-400 font-bold">{simContext.eta} mins ({simContext.traffic.toUpperCase()})</span>
                  </div>
                )}

                {stage.step === 8 && (isStageCompleted || isStageActive) && (
                  <div className="mt-3 p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex justify-between">
                    <span>Hospital Readiness:</span>
                    <span className="text-emerald-400 font-bold">{simContext.hospital.readinessScore || 94} / 100</span>
                  </div>
                )}

                {stage.step === 9 && (isStageCompleted || isStageActive) && (
                  <div className="mt-3 p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex justify-between">
                    <span>Selected Target:</span>
                    <span className="text-emerald-400 font-bold">{simContext.hospital.shortName}</span>
                  </div>
                )}

                {stage.step === 10 && (isStageCompleted || isStageActive) && (
                  <div className="mt-3 p-2 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 flex justify-between">
                    <span>HL7 FHIR R4:</span>
                    <span className="text-cyan-400 font-bold">Transmitted to EHR</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
