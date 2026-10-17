import React, { useState } from 'react';
import { EmergencyProvider, useEmergency } from './context/EmergencyContext';
import { Header } from './components/Header';
import { UnifiedDashboard } from './components/UnifiedDashboard';
import { AmbulanceDashboard } from './components/AmbulanceDashboard';
import { HospitalDashboard } from './components/HospitalDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { WorkflowStepper } from './components/WorkflowStepper';
import { SmartBackupAlertModal } from './components/SmartBackupAlertModal';
import { ExplainableModal } from './components/ExplainableModal';
import { LoginModal } from './components/LoginModal';
import { IBMArchitectureModal } from './components/IBMArchitectureModal';
import { IBMDemoWalkthrough } from './components/IBMDemoWalkthrough';
import { Cpu, Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ambulance' | 'hospital' | 'admin' | 'workflow'>('workflow');
  const [ibmArchitectureOpen, setIbmArchitectureOpen] = useState(false);
  const [ibmDemoOpen, setIbmDemoOpen] = useState(false);

  const { isSimulationActive, setIsSimulationActive, setLoginModalOpen } = useEmergency();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Header with Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenIBMArchitecture={() => setIbmArchitectureOpen(true)}
        onOpenIBMDemo={() => setIbmDemoOpen(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <UnifiedDashboard
            onNavigateTab={setActiveTab}
            onOpenIBMArchitecture={() => setIbmArchitectureOpen(true)}
            onOpenIBMDemo={() => setIbmDemoOpen(true)}
          />
        )}
        {activeTab === 'ambulance' && <AmbulanceDashboard />}
        {activeTab === 'hospital' && <HospitalDashboard />}
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'workflow' && <WorkflowStepper />}
      </main>

      {/* Global Modals */}
      <SmartBackupAlertModal />
      <ExplainableModal />
      <LoginModal />
      <IBMArchitectureModal
        isOpen={ibmArchitectureOpen}
        onClose={() => setIbmArchitectureOpen(false)}
      />
      <IBMDemoWalkthrough
        isOpen={ibmDemoOpen}
        onClose={() => setIbmDemoOpen(false)}
        setActiveTab={setActiveTab}
      />

      {/* Footer with IBM Enterprise Attribution & Actions */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-300">MediRoute AI</span>
            <span>·</span>
            <span>IBM LinuxONE III & watsonx.ai Granite 3.0</span>
            <span>·</span>
            <span className="text-cyan-400">Gemini 3.8 Flash CDSS</span>
            <span>·</span>
            <span className="text-emerald-400 font-mono">HL7 FHIR R4 Ready</span>
            <span>·</span>
            <span className="text-amber-400 font-mono text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              [SIMULATED DEMO OUTPUT]
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setIbmArchitectureOpen(true)}
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 font-medium"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>IBM Architecture Blueprint</span>
            </button>
            <span>·</span>
            <button
              onClick={() => setIbmDemoOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Hackathon Runner</span>
            </button>
            <span>·</span>
            <button
              onClick={() => setLoginModalOpen(true)}
              className="text-slate-400 hover:underline"
            >
              Demo Credentials
            </button>
            <span>·</span>
            <button
              onClick={() => setIsSimulationActive(!isSimulationActive)}
              className="hover:text-slate-300 transition-colors"
            >
              Simulation: <strong className={isSimulationActive ? 'text-emerald-400' : 'text-slate-500'}>
                {isSimulationActive ? 'Live (4s ticker)' : 'Paused'}
              </strong>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <EmergencyProvider>
      <AppContent />
    </EmergencyProvider>
  );
}
