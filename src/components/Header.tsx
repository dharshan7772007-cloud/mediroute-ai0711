import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { Role } from '../types';
import {
  Activity,
  Ambulance as AmbulanceIcon,
  Building2,
  ShieldAlert,
  Bell,
  Radio,
  RotateCcw,
  UserCheck,
  ChevronDown,
  Flame,
  CheckCircle2,
  Cpu,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'ambulance' | 'hospital' | 'admin' | 'workflow';
  setActiveTab: (tab: 'dashboard' | 'ambulance' | 'hospital' | 'admin' | 'workflow') => void;
  onOpenIBMArchitecture?: () => void;
  onOpenIBMDemo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenIBMArchitecture,
  onOpenIBMDemo,
}) => {
  const {
    currentRole,
    setCurrentRole,
    disasterMode,
    toggleDisasterMode,
    notifications,
    markAllNotificationsRead,
    resetEmergencyScenario,
    setLoginModalOpen,
    setExplainModalOpen,
  } = useEmergency();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRoleSelect = (role: Role) => {
    setCurrentRole(role);
    if (role === 'ambulance') setActiveTab('ambulance');
    if (role === 'hospital') setActiveTab('hospital');
    if (role === 'admin') setActiveTab('admin');
    setRoleDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Wordmark Element */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('workflow');
              }}
              className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors"
            >
              MediRoute AI
            </a>
            {disasterMode && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                MCI DISASTER ACTIVE
              </span>
            )}
          </div>

          {/* Zone 2: Navigation Links (single-line, whitespace-nowrap) */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-300">
            <button
              onClick={() => setActiveTab('workflow')}
              className={`flex items-center gap-2 pb-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                activeTab === 'workflow'
                  ? 'border-cyan-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              Emergency Pipeline
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 pb-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                activeTab === 'dashboard'
                  ? 'border-cyan-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              Command Dashboard
            </button>

            <button
              onClick={() => {
                setActiveTab('ambulance');
                setCurrentRole('ambulance');
              }}
              className={`flex items-center gap-2 pb-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                activeTab === 'ambulance'
                  ? 'border-cyan-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <AmbulanceIcon className="w-4 h-4 text-cyan-400" />
              Ambulance HUD
            </button>

            <button
              onClick={() => {
                setActiveTab('hospital');
                setCurrentRole('hospital');
              }}
              className={`flex items-center gap-2 pb-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                activeTab === 'hospital'
                  ? 'border-cyan-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              Hospital Portal
            </button>

            <button
              onClick={() => {
                setActiveTab('admin');
                setCurrentRole('admin');
              }}
              className={`flex items-center gap-2 pb-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                activeTab === 'admin'
                  ? 'border-cyan-400 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              Admin Command
            </button>
          </nav>

          {/* Zone 3: Actions - Notifications, Role Switcher, Scenario Reset */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Gemini AI Assistant Trigger */}
            <button
              onClick={() => setExplainModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 transition-all shadow-sm"
              title="Open Gemini AI Clinical Recommendation Assistant [Simulated Output]"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Gemini AI Assistant</span>
              <span className="sm:hidden">Gemini</span>
            </button>

            {/* IBM Architecture & watsonx modal trigger */}
            {onOpenIBMArchitecture && (
              <button
                onClick={onOpenIBMArchitecture}
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/30 transition-all shadow-sm"
                title="View IBM watsonx Architecture, SHAP explainability, and HL7 FHIR payload"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>IBM Architecture</span>
              </button>
            )}

            {/* IBM Live Demo Script Runner */}
            {onOpenIBMDemo && (
              <button
                onClick={onOpenIBMDemo}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-600/30 transition-all shadow-sm"
                title="Launch guided 5-step live presentation runner"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hackathon Demo</span>
              </button>
            )}

            {/* Disaster Mode Quick Toggle */}
            <button
              onClick={() => toggleDisasterMode()}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                disasterMode
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-rose-500/60 hover:text-rose-300'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>{disasterMode ? 'Disable MCI' : 'Disaster Mode'}</span>
            </button>

            {/* Notifications Popover Toggle */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="font-semibold text-sm text-slate-100 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-cyan-400" />
                      Live Incident Notifications
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-cyan-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80 mt-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">No notifications yet.</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="py-2.5 px-1 hover:bg-slate-800/50 rounded-lg transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                n.type === 'hospital_full' || n.type === 'disaster_mode'
                                  ? 'text-rose-400'
                                  : n.type === 'backup_activated'
                                  ? 'text-cyan-400'
                                  : 'text-slate-200'
                              }`}
                            >
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">{n.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Reset Scenario */}
            <button
              onClick={resetEmergencyScenario}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Reset Scenario to Initial Baseline"
              aria-label="Reset Scenario"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 text-xs font-semibold text-white hover:border-cyan-500/50 transition-colors shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span className="capitalize">{currentRole} Role</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-slate-800">
                    Switch Demo Account
                  </div>
                  <button
                    onClick={() => handleRoleSelect('ambulance')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                      currentRole === 'ambulance'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <AmbulanceIcon className="w-4 h-4 text-cyan-400" />
                    Ambulance Crew (MED-101)
                  </button>
                  <button
                    onClick={() => handleRoleSelect('hospital')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                      currentRole === 'hospital'
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    Hospital ER Director
                  </button>
                  <button
                    onClick={() => handleRoleSelect('admin')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg transition-colors ${
                      currentRole === 'admin'
                        ? 'bg-blue-500/20 text-blue-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-blue-400" />
                    City Command Admin
                  </button>
                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        setLoginModalOpen(true);
                      }}
                      className="w-full text-center py-1.5 text-[11px] text-cyan-400 hover:underline"
                    >
                      View Demo Credentials
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
