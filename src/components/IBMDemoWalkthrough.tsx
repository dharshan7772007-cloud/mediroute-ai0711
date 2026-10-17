import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { IBM_DEMO_STEPS, playAudioDispatchChime } from '../services/ibmIntegration';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  Cpu,
  ChevronRight,
  CheckCircle2,
  X,
  Volume2,
} from 'lucide-react';

interface IBMDemoWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: 'dashboard' | 'ambulance' | 'hospital' | 'admin' | 'workflow') => void;
}

export const IBMDemoWalkthrough: React.FC<IBMDemoWalkthroughProps> = ({
  isOpen,
  onClose,
  setActiveTab,
}) => {
  const {
    startNavigation,
    requestBackupHospital,
    simulateHospitalFullSurge,
    toggleDisasterMode,
    resetEmergencyScenario,
    topHospital,
    setExplainModalOpen,
  } = useEmergency();

  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  if (!isOpen) return null;

  const currentStep = IBM_DEMO_STEPS[currentStepIdx];

  const executeStep = (stepIdx: number) => {
    setCurrentStepIdx(stepIdx);
    playAudioDispatchChime();

    if (stepIdx === 0) {
      // Step 1: 911 Intake & Telemetry
      setActiveTab('ambulance');
    } else if (stepIdx === 1) {
      // Step 2: watsonx.ai Scoring
      setActiveTab('ambulance');
      setExplainModalOpen(true);
    } else if (stepIdx === 2) {
      // Step 3: Future Bed Prediction
      setExplainModalOpen(false);
      setActiveTab('hospital');
    } else if (stepIdx === 3) {
      // Step 4: Mid-Transit Surge & Smart Divert
      setActiveTab('ambulance');
      startNavigation();
      setTimeout(() => {
        simulateHospitalFullSurge(topHospital.id);
      }, 800);
    } else if (stepIdx === 4) {
      // Step 5: Disaster MCI Grid
      setActiveTab('admin');
      toggleDisasterMode(true);
    }
  };

  const handleNext = () => {
    if (currentStepIdx < IBM_DEMO_STEPS.length - 1) {
      executeStep(currentStepIdx + 1);
    } else {
      executeStep(0);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[480px] z-50 bg-slate-900 border-2 border-blue-500 rounded-2xl shadow-2xl p-4 text-slate-100 animate-in slide-in-from-bottom-5">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
              IBM HACKATHON LIVE DEMO RUNNER
            </div>
            <div className="text-xs font-bold text-white">
              Step {currentStep.id} of 5: {currentStep.title}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step Info */}
      <div className="py-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-cyan-400 font-semibold">{currentStep.phase}</span>
          <span className="text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
            {currentStep.ibmComponent}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          {currentStep.narration}
        </p>
      </div>

      {/* Step Pills & Progress */}
      <div className="grid grid-cols-5 gap-1.5 py-1">
        {IBM_DEMO_STEPS.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => executeStep(idx)}
            className={`py-1 rounded text-[10px] font-mono font-bold transition-all ${
              idx === currentStepIdx
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : idx < currentStepIdx
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                : 'bg-slate-950 text-slate-500 hover:text-slate-300'
            }`}
          >
            #{s.id}
          </button>
        ))}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-2">
        <button
          onClick={() => {
            resetEmergencyScenario();
            executeStep(0);
          }}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-colors"
          title="Reset to Step 1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[11px]">Reset</span>
        </button>

        <button
          onClick={handleNext}
          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all"
        >
          <span>Next: {currentStepIdx < 4 ? `Step ${currentStepIdx + 2}` : 'Loop to #1'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
