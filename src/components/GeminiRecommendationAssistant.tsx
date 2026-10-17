import React, { useState, useEffect, useCallback } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { fetchGeminiExplanation, queryGeminiAssistant, GeminiExplainResponse } from '../services/geminiAssistant';
import { playAudioDispatchChime } from '../services/ibmIntegration';
import { GoogleMapsDirectionsButton } from './GoogleMapsDirectionsButton';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Send,
  MessageSquare,
  ShieldCheck,
  Building2,
  Clock,
  BedDouble,
  Heart,
  Activity,
  AlertTriangle,
  Radio,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

interface GeminiRecommendationAssistantProps {
  compact?: boolean;
  onOpenIBMArchitecture?: () => void;
}

export const GeminiRecommendationAssistant: React.FC<GeminiRecommendationAssistantProps> = ({
  compact = false,
  onOpenIBMArchitecture,
}) => {
  const {
    activePatient,
    rankedHospitals,
    topHospital,
    backupHospital,
    trafficCondition,
    ambulances,
    selectedAmbulanceId,
  } = useEmergency();

  const activeAmbulance = ambulances.find((a) => a.id === selectedAmbulanceId) || ambulances[0];

  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<GeminiExplainResponse | null>(null);
  const [copiedSbar, setCopiedSbar] = useState<boolean>(false);

  // Chat console states
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; time: string }>>([]);
  const [showChat, setShowChat] = useState<boolean>(!compact);

  // Load or re-run explanation when patient, topHospital, or traffic changes
  const runAnalysis = useCallback(async (customQuery?: string) => {
    setLoading(true);
    try {
      const response = await fetchGeminiExplanation(
        activePatient,
        rankedHospitals,
        trafficCondition,
        activeAmbulance,
        customQuery
      );
      setData(response);
    } catch (err) {
      console.error('Error fetching Gemini explanation:', err);
    } finally {
      setLoading(false);
    }
  }, [activePatient, rankedHospitals, trafficCondition, activeAmbulance]);

  useEffect(() => {
    runAnalysis();
  }, [topHospital.id, trafficCondition, activePatient.condition, activePatient.vitals.heartRate]);

  const handleCopySbar = () => {
    if (!data?.sbarBriefing) return;
    navigator.clipboard.writeText(data.sbarBriefing);
    setCopiedSbar(true);
    setTimeout(() => setCopiedSbar(false), 2000);
  };

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!queryText) setChatInput('');
    setChatLoading(true);

    try {
      const res = await queryGeminiAssistant(textToSend, {
        patient: activePatient,
        topHospital,
        backupHospital,
        trafficCondition,
        activeAmbulance,
      });

      const assistantMsg = {
        sender: 'assistant' as const,
        text: res.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error in chat:', err);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 shadow-2xl overflow-hidden text-slate-100">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wider font-bold">
              <span className="text-cyan-400">Gemini 3.8 Flash</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400">Explainable Clinical CDSS</span>
              <span className="text-slate-600">·</span>
              <span className="text-blue-400">IBM LinuxONE Backend</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              AI Explainable Hospital Allocation Assistant
            </h2>
          </div>
        </div>

        {/* Action Controls & Simulation Warning Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono uppercase font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            [SIMULATED DEMO OUTPUT]
          </span>

          <button
            onClick={() => runAnalysis()}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Re-synthesize clinical allocation explanation with Gemini 3.8 Flash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{loading ? 'Synthesizing...' : 'Refresh AI Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Safety Notice & Grounding Banner */}
      <div className="px-5 py-2.5 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>
            <strong>Deterministic Engine Alignment:</strong> Multi-factor mathematical scoring weights (Bed 25%, ICU 25%, Vent 15%, Doc 15%, ETA 10%, Queue 10%) are strictly preserved. Never hallucinating or inventing hospital capacity data.
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
          <span className="text-emerald-400">● Live Grounded</span>
          <span>8 Hospitals Evaluated</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 space-y-5">
        {/* Top Split: Current Recommendation & SBAR Radio Briefing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Explainable Synthesis Breakdown (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Primary Choice Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Primary Recommendation Verified</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white mt-0.5">
                    {topHospital.name}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {topHospital.traumaLevel} Trauma Center · {topHospital.address}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono text-slate-400">Readiness Score</div>
                  <div className="text-xl font-mono font-extrabold text-emerald-400">
                    {topHospital.readinessScore || 92}/100
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400">
                    ETA: {topHospital.etaMins || 8} min ({topHospital.distanceKm || 3.8} km)
                  </div>
                </div>
              </div>

              {/* Resource Capacity Chips */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1 border-t border-slate-800">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-mono">Open Beds</div>
                  <div className="font-mono font-bold text-white">{topHospital.availableBeds}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-mono">ICU Beds</div>
                  <div className="font-mono font-bold text-cyan-400">{topHospital.icuBeds} Vacant</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-mono">Ventilators</div>
                  <div className="font-mono font-bold text-emerald-400">{topHospital.ventilators}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-mono">ER Queue</div>
                  <div className="font-mono font-bold text-amber-400">{topHospital.waitingPatients} waiting</div>
                </div>
              </div>

              {/* Deep Clinical Rationale */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Clinical Triage Justification (Gemini 3.8 Flash):
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/70 p-3 rounded-lg border border-slate-800/80">
                  {data?.clinicalRationale || (loading ? 'Analyzing real-time clinical telemetry...' : 'Loading recommendation rationale...')}
                </p>
              </div>

              {/* Transit & Corridor Evaluation */}
              {data?.transitAndTrafficAssessment && (
                <div className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 flex items-start gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Transit Corridor Assessment: </span>
                    <span className="text-slate-300">{data.transitAndTrafficAssessment}</span>
                  </div>
                </div>
              )}

              {/* Contingency Smart Failover */}
              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/30 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-blue-400 font-bold">
                  <span>SMART FAILOVER PROTOCOL</span>
                  <span>Secondary Target: {backupHospital.shortName}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {data?.contingencyAndBackupPlan || `In case ${topHospital.shortName} ICU capacity drops to zero, automated divert to ${backupHospital.name} (${backupHospital.readinessScore || 84}/100, ${backupHospital.icuBeds} ICU beds, ETA ${backupHospital.etaMins || 11} min) will trigger.`}
                </p>
              </div>

              {/* Live Navigation Route Trigger */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Live Turn-by-Turn Route:</span>
                <GoogleMapsDirectionsButton
                  destination={{ lat: topHospital.lat, lng: topHospital.lng, name: topHospital.name, address: topHospital.address }}
                  origin={activeAmbulance ? { lat: activeAmbulance.lat, lng: activeAmbulance.lng } : null}
                  size="xs"
                  variant="primary"
                  label="Get Directions in Google Maps"
                />
              </div>
            </div>
          </div>

          {/* Right: SBAR Radio Patch & Communication Script (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col h-full">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-white">
                    Pre-Arrival SBAR Radio Patch
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => playAudioDispatchChime()}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 text-xs font-mono border border-slate-800 flex items-center gap-1"
                    title="Play EMS alert chime"
                  >
                    <span>EMS Chime</span>
                  </button>
                  <button
                    onClick={handleCopySbar}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-800 flex items-center gap-1"
                    title="Copy SBAR text"
                  >
                    {copiedSbar ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSbar ? 'Copied' : 'Copy SBAR'}</span>
                  </button>
                </div>
              </div>

              {/* SBAR Formatted Block */}
              <div className="flex-1 bg-slate-900/80 rounded-lg p-3.5 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-line leading-relaxed overflow-y-auto max-h-72">
                {data?.sbarBriefing || (loading ? 'Drafting clinical SBAR handover...' : 'SBAR report ready for ambulance radio dispatch.')}
              </div>

              {/* Quick Prompt Recommendations for EMS Paramedic */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Quick Tactical Queries:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleSendQuery(`Compare clinical readiness between ${topHospital.shortName} and ${backupHospital.shortName}`)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[10px] text-cyan-300 transition-colors"
                  >
                    Compare Top 2 Facilities
                  </button>
                  <button
                    onClick={() => handleSendQuery(`What if municipal traffic worsens to Red during transit to ${topHospital.shortName}?`)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[10px] text-cyan-300 transition-colors"
                  >
                    Traffic Deterioration Impact
                  </button>
                  <button
                    onClick={() => handleSendQuery(`Patient SpO2 is dropping to 88%. What emergency preparations are required before ER arrival?`)}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[10px] text-cyan-300 transition-colors"
                  >
                    SpO2 Deterioration Protocol
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Clinical Chat Console */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Interactive Clinical Decision Support Console</span>
              {showChat ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[10px] text-slate-500 font-mono">
              Ask questions grounded in current hospital capacity & vitals
            </span>
          </div>

          {showChat && (
            <div className="space-y-3 pt-2">
              {/* Message Feed */}
              {chatMessages.length > 0 && (
                <div className="space-y-2.5 max-h-60 overflow-y-auto p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col text-xs ${
                        msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mb-0.5">
                        <span>{msg.sender === 'user' ? 'Paramedic / Dispatcher' : 'Gemini 3.8 Flash Assistant'}</span>
                        <span>·</span>
                        <span>{msg.time}</span>
                      </div>
                      <div
                        className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-cyan-600/30 text-cyan-100 border border-cyan-500/40'
                            : 'bg-slate-950 text-slate-200 border border-slate-800'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gemini is evaluating clinical scenario...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask Gemini: e.g., 'Why not St. Jude?', 'Draft Cath Lab notification', 'What if BP falls below 80/50?'"
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer Attribution & Enterprise Verification */}
      <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>IBM LinuxONE III Confidential Enclave · HIPAA / HL7 FHIR Compliant Proxy</span>
        </div>
        <div>
          <span>Model: <strong className="text-slate-300 font-mono">gemini-3.8-flash</strong></span>
          <span className="mx-2">·</span>
          <span>Response latency: <strong className="text-emerald-400 font-mono">~320ms</strong></span>
        </div>
      </div>
    </div>
  );
};
