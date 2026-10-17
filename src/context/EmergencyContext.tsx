import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Hospital,
  Ambulance,
  Patient,
  Role,
  TrafficCondition,
  NotificationItem,
  EmergencyWorkflowStep,
  DisasterAllocation,
  BedPrediction,
} from '../types';
import {
  INITIAL_HOSPITALS,
  INITIAL_AMBULANCES,
  INITIAL_PATIENT,
  WORKFLOW_STEPS,
  INITIAL_NOTIFICATIONS,
} from '../services/mockData';
import {
  evaluateAndRankHospitals,
  predictFutureBeds,
  generateDisasterModeAllocation,
} from '../services/aiReadiness';

interface EmergencyContextType {
  // Roles and navigation
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  selectedHospitalId: string;
  setSelectedHospitalId: (id: string) => void;
  selectedAmbulanceId: string;
  setSelectedAmbulanceId: (id: string) => void;

  // Data
  hospitals: Hospital[];
  ambulances: Ambulance[];
  activePatient: Patient;
  rankedHospitals: Hospital[];
  topHospital: Hospital;
  backupHospital: Hospital;
  trafficCondition: TrafficCondition;
  setTrafficCondition: (cond: TrafficCondition) => void;
  disasterMode: boolean;
  toggleDisasterMode: (enabled?: boolean) => void;
  disasterAllocations: DisasterAllocation[];

  // Workflow & Navigation
  workflowSteps: EmergencyWorkflowStep[];
  isNavigating: boolean;
  startNavigation: () => void;
  pauseNavigation: () => void;
  resetEmergencyScenario: () => void;
  requestBackupHospital: () => void;

  // Hospital Resource Management
  updateHospitalResource: (
    hospitalId: string,
    field: 'availableBeds' | 'icuBeds' | 'ventilators' | 'emergencyDoctors' | 'waitingPatients',
    delta: number
  ) => void;
  simulateHospitalFullSurge: (hospitalId: string) => void;
  admitPatient: (hospitalId: string, bedType?: string) => void;

  // Bed Predictions
  getHospitalPrediction: (hospitalId: string) => BedPrediction;

  // Alerts & Notifications
  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'timeAgo' | 'read'>) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: string) => void;

  // Modals & UI States
  smartBackupAlert: {
    isOpen: boolean;
    previousHospital: Hospital | null;
    newHospital: Hospital | null;
    reason: string;
  } | null;
  closeSmartBackupAlert: () => void;
  explainModalOpen: boolean;
  setExplainModalOpen: (open: boolean) => void;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;

  // Simulation controls
  isSimulationActive: boolean;
  setIsSimulationActive: (active: boolean) => void;
  simulationTickCount: number;

  // AI Configuration status
  geminiStatus: { isConfigured: boolean; checked: boolean };
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<Role>('ambulance');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp-1');
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('amb-1');

  const [hospitals, setHospitals] = useState<Hospital[]>(INITIAL_HOSPITALS);
  const [ambulances, setAmbulances] = useState<Ambulance[]>(INITIAL_AMBULANCES);
  const [activePatient, setActivePatient] = useState<Patient>(INITIAL_PATIENT);
  const [trafficCondition, setTrafficCondition] = useState<TrafficCondition>('green');

  const [workflowSteps, setWorkflowSteps] = useState<EmergencyWorkflowStep[]>(WORKFLOW_STEPS);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [disasterMode, setDisasterMode] = useState<boolean>(false);
  const [disasterAllocations, setDisasterAllocations] = useState<DisasterAllocation[]>([]);

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [smartBackupAlert, setSmartBackupAlert] = useState<{
    isOpen: boolean;
    previousHospital: Hospital | null;
    newHospital: Hospital | null;
    reason: string;
  } | null>(null);

  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [isSimulationActive, setIsSimulationActive] = useState(true);
  const [simulationTickCount, setSimulationTickCount] = useState(0);

  const [geminiStatus, setGeminiStatus] = useState<{ isConfigured: boolean; checked: boolean }>({
    isConfigured: true,
    checked: false,
  });

  // Verify server-side Gemini AI credentials status on startup
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setGeminiStatus({
          isConfigured: !!data.geminiConfigured,
          checked: true,
        });
      })
      .catch(() => {
        setGeminiStatus({ isConfigured: false, checked: true });
      });
  }, []);

  // Active ambulance instance
  const activeAmbulance = useMemo(() => {
    return ambulances.find((a) => a.id === selectedAmbulanceId) || ambulances[0];
  }, [ambulances, selectedAmbulanceId]);

  // Rank all hospitals using AI logic
  const rankedHospitals = useMemo(() => {
    return evaluateAndRankHospitals(
      hospitals,
      activePatient,
      activeAmbulance.lat,
      activeAmbulance.lng,
      trafficCondition
    );
  }, [hospitals, activePatient, activeAmbulance.lat, activeAmbulance.lng, trafficCondition]);

  const topHospital = rankedHospitals[0] || hospitals[0];
  const backupHospital = rankedHospitals[1] || hospitals[1];

  // Helper to add notifications
  const addNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'timestamp' | 'timeAgo' | 'read'>) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: timeStr,
        timeAgo: 'Just now',
        read: false,
        ...item,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
    },
    []
  );

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const closeSmartBackupAlert = useCallback(() => {
    setSmartBackupAlert(null);
  }, []);

  // Future bed prediction helper
  const getHospitalPrediction = useCallback(
    (hospitalId: string) => {
      const hosp = hospitals.find((h) => h.id === hospitalId) || hospitals[0];
      return predictFutureBeds(hosp);
    },
    [hospitals]
  );

  // Instant Resource Modifier for Hospital Dashboard
  const updateHospitalResource = useCallback(
    (
      hospitalId: string,
      field: 'availableBeds' | 'icuBeds' | 'ventilators' | 'emergencyDoctors' | 'waitingPatients',
      delta: number
    ) => {
      setHospitals((prev) =>
        prev.map((h) => {
          if (h.id !== hospitalId) return h;
          const current = h[field];
          let updated = current + delta;

          // Upper and lower bounds
          if (field === 'availableBeds') updated = Math.max(0, Math.min(h.totalBeds, updated));
          if (field === 'icuBeds') updated = Math.max(0, Math.min(h.icuTotal, updated));
          if (field === 'ventilators') updated = Math.max(0, Math.min(h.ventilatorsTotal, updated));
          if (field === 'emergencyDoctors') updated = Math.max(1, Math.min(30, updated));
          if (field === 'waitingPatients') updated = Math.max(0, Math.min(50, updated));

          const updatedHosp = { ...h, [field]: updated };

          // Automatically set status
          if (updatedHosp.availableBeds === 0) {
            updatedHosp.status = 'full';
          } else if (updatedHosp.availableBeds <= 3) {
            updatedHosp.status = 'busy';
          } else {
            updatedHosp.status = 'operational';
          }

          return updatedHosp;
        })
      );
    },
    []
  );

  // Trigger Smart Backup hospital change
  const triggerSmartBackup = useCallback(
    (targetHospital: Hospital, replacementHospital: Hospital, reasonMsg: string) => {
      // Update ambulance target
      setAmbulances((prev) =>
        prev.map((a) => (a.id === selectedAmbulanceId ? { ...a, targetHospitalId: replacementHospital.id } : a))
      );
      // Update active patient assignment
      setActivePatient((prev) => ({
        ...prev,
        assignedHospitalId: replacementHospital.id,
        backupHospitalId: targetHospital.id,
      }));

      // Trigger high priority modal
      setSmartBackupAlert({
        isOpen: true,
        previousHospital: targetHospital,
        newHospital: replacementHospital,
        reason: reasonMsg,
      });

      // Add high-priority notifications
      addNotification({
        type: 'hospital_full',
        title: `Hospital Full: ${targetHospital.name}`,
        message: `${targetHospital.shortName} capacity reached 0 available beds. Diversion protocol initiated.`,
        priority: 'high',
      });

      addNotification({
        type: 'backup_activated',
        title: `Rerouted to Backup: ${replacementHospital.name}`,
        message: `Ambulance rerouted to ${replacementHospital.shortName}. ETA: ${replacementHospital.etaMins || 8} mins. Bed and surgical team reserved.`,
        priority: 'high',
      });
    },
    [selectedAmbulanceId, addNotification]
  );

  // Manual button: "Request Backup Hospital"
  const requestBackupHospital = useCallback(() => {
    const currentTargetId = activePatient.assignedHospitalId || topHospital.id;
    const currentHosp = hospitals.find((h) => h.id === currentTargetId) || topHospital;
    const alternateHosp = rankedHospitals.find((h) => h.id !== currentHosp.id) || backupHospital;

    triggerSmartBackup(
      currentHosp,
      alternateHosp,
      `Paramedic requested immediate secondary divert. AI re-routed from ${currentHosp.shortName} to ${alternateHosp.shortName} based on optimal secondary readiness (${alternateHosp.readinessScore}/100).`
    );
  }, [activePatient.assignedHospitalId, topHospital, hospitals, rankedHospitals, backupHospital, triggerSmartBackup]);

  // Simulate Surge / Hospital Full
  const simulateHospitalFullSurge = useCallback(
    (hospitalId: string) => {
      setHospitals((prev) =>
        prev.map((h) => (h.id === hospitalId ? { ...h, availableBeds: 0, icuBeds: 0, status: 'full' } : h))
      );
      const targetHosp = hospitals.find((h) => h.id === hospitalId) || topHospital;
      const candidates = hospitals.filter((h) => h.id !== hospitalId && h.availableBeds > 0);
      const nextBest = candidates[0] || hospitals[1];

      triggerSmartBackup(
        targetHosp,
        nextBest,
        `Emergency surge detected at ${targetHosp.shortName}. Zero critical beds remaining. AI diverted in-flight ambulance to ${nextBest.shortName}.`
      );
    },
    [hospitals, topHospital, triggerSmartBackup]
  );

  // Start Navigation animation
  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    addNotification({
      type: 'emergency',
      title: 'Navigation Initiated',
      message: `MED-101 en route with emergency beacon active to ${topHospital.name}. Dynamic green traffic wave requested.`,
      priority: 'normal',
    });

    // Advance workflow step to step 10 (Route displayed)
    setWorkflowSteps((prev) =>
      prev.map((s) => {
        if (s.step <= 10) return { ...s, status: 'completed' };
        if (s.step === 11) return { ...s, status: 'active' };
        return s;
      })
    );
  }, [addNotification, topHospital]);

  const pauseNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  // Patient admission completion
  const admitPatient = useCallback(
    (hospitalId: string, bedType: string = 'ICU') => {
      // Deduct bed from hospital
      updateHospitalResource(hospitalId, bedType === 'ICU' ? 'icuBeds' : 'availableBeds', -1);

      // Update patient status
      setActivePatient((prev) => ({
        ...prev,
        status: 'admitted',
      }));

      // Update ambulance to idle/returning
      setAmbulances((prev) =>
        prev.map((a) =>
          a.id === selectedAmbulanceId
            ? { ...a, status: 'idle', routeProgress: 100, speedKmH: 0 }
            : a
        )
      );

      setIsNavigating(false);

      // Complete workflow step 11
      setWorkflowSteps((prev) =>
        prev.map((s) => ({ ...s, status: 'completed' }))
      );

      const targetHosp = hospitals.find((h) => h.id === hospitalId) || topHospital;

      addNotification({
        type: 'patient_admitted',
        title: 'Patient Successfully Admitted',
        message: `${activePatient.name} admitted to ${targetHosp.name} (${bedType} Bay). Turnaround time: 14 mins. Emergency handover complete.`,
        priority: 'high',
      });
    },
    [updateHospitalResource, selectedAmbulanceId, topHospital, hospitals, activePatient.name, addNotification]
  );

  // Reset demo emergency
  const resetEmergencyScenario = useCallback(() => {
    setHospitals(INITIAL_HOSPITALS);
    setAmbulances(INITIAL_AMBULANCES);
    setActivePatient(INITIAL_PATIENT);
    setIsNavigating(false);
    setWorkflowSteps(WORKFLOW_STEPS);
    setTrafficCondition('green');
    addNotification({
      type: 'emergency',
      title: 'Scenario Reset',
      message: 'Initial emergency test scenario reset. System calibrated to baseline.',
      priority: 'normal',
    });
  }, [addNotification]);

  // Disaster Mode Toggle
  const toggleDisasterMode = useCallback(
    (enabled?: boolean) => {
      const nextState = enabled !== undefined ? enabled : !disasterMode;
      setDisasterMode(nextState);

      if (nextState) {
        const allocations = generateDisasterModeAllocation(hospitals);
        setDisasterAllocations(allocations);

        // Put ambulances in mass casualty response
        setAmbulances((prev) =>
          prev.map((a, i) => ({
            ...a,
            status: i % 2 === 0 ? 'transporting' : 'dispatched',
            speedKmH: 58,
          }))
        );

        addNotification({
          type: 'disaster_mode',
          title: '🚨 MASS CASUALTY INCIDENT (MCI) ACTIVATED',
          message: 'Level 4 Disaster Protocol initiated. 20 patients triaged and load-balanced across 8 hospital facilities.',
          priority: 'high',
        });
      } else {
        setDisasterAllocations([]);
        addNotification({
          type: 'disaster_mode',
          title: 'Disaster Mode Deactivated',
          message: 'City emergency operations returned to Standard Readiness protocol.',
          priority: 'normal',
        });
      }
    },
    [disasterMode, hospitals, addNotification]
  );

  // Active high-frequency navigation animation ticker
  useEffect(() => {
    if (!isNavigating) return;

    const originLat = INITIAL_PATIENT.pickupLocation.lat;
    const originLng = INITIAL_PATIENT.pickupLocation.lng;

    const navInterval = setInterval(() => {
      setAmbulances((prev) =>
        prev.map((a) => {
          if (a.id === selectedAmbulanceId) {
            const newProgress = Math.min(100, a.routeProgress + 10);
            const targetId = a.targetHospitalId || activePatient.assignedHospitalId || topHospital.id;
            const targetHosp = hospitals.find((h) => h.id === targetId) || topHospital;

            // Interpolate position along route
            const ratio = newProgress / 100;
            const newLat = originLat + (targetHosp.lat - originLat) * ratio;
            const newLng = originLng + (targetHosp.lng - originLng) * ratio;

            if (newProgress >= 100) {
              setTimeout(() => {
                admitPatient(targetHosp.id, 'ICU');
              }, 600);
              return {
                ...a,
                lat: targetHosp.lat,
                lng: targetHosp.lng,
                routeProgress: 100,
                status: 'arrived',
                speedKmH: 0,
              };
            }

            return {
              ...a,
              lat: Number(newLat.toFixed(5)),
              lng: Number(newLng.toFixed(5)),
              routeProgress: newProgress,
              status: 'transporting',
              speedKmH: trafficCondition === 'green' ? 62 : trafficCondition === 'yellow' ? 44 : 28,
            };
          }
          return a;
        })
      );
    }, 1200);

    return () => clearInterval(navInterval);
  }, [isNavigating, selectedAmbulanceId, activePatient.assignedHospitalId, topHospital, hospitals, trafficCondition, admitPatient]);

  // General simulation ticker: fluctuations in hospital beds, waiting queue, traffic
  useEffect(() => {
    if (!isSimulationActive) return;

    const interval = setInterval(() => {
      setSimulationTickCount((c) => c + 1);

      // Subtle organic fluctuations in hospital beds and waiting counts
      setHospitals((prev) =>
        prev.map((h) => {
          const rand = Math.random();
          let deltaBeds = 0;
          let deltaWait = 0;

          if (rand > 0.75) {
            deltaBeds = Math.random() > 0.5 ? 1 : -1;
          }
          if (rand < 0.25) {
            deltaWait = Math.random() > 0.5 ? 1 : -1;
          }

          const newBeds = Math.max(0, Math.min(h.totalBeds, h.availableBeds + deltaBeds));
          const newWait = Math.max(1, Math.min(30, h.waitingPatients + deltaWait));

          return {
            ...h,
            availableBeds: newBeds,
            waitingPatients: newWait,
            status: newBeds === 0 ? 'full' : newBeds <= 3 ? 'busy' : 'operational',
          };
        })
      );

      // Occasionally cycle city traffic conditions
      if (Math.random() > 0.85) {
        setTrafficCondition((prev) => {
          if (prev === 'green') return 'yellow';
          if (prev === 'yellow') return Math.random() > 0.5 ? 'red' : 'green';
          return 'yellow';
        });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isSimulationActive]);

  // Watchdog: If current targeted hospital drops to 0 beds while ambulance is transporting, trigger auto smart backup!
  useEffect(() => {
    if (activePatient.status === 'transporting' || isNavigating) {
      const assignedId = activePatient.assignedHospitalId || topHospital.id;
      const targetHosp = hospitals.find((h) => h.id === assignedId);

      if (targetHosp && targetHosp.availableBeds === 0 && !smartBackupAlert?.isOpen) {
        const alt = rankedHospitals.find((h) => h.id !== targetHosp.id && h.availableBeds > 0) || backupHospital;
        triggerSmartBackup(
          targetHosp,
          alt,
          `Automated telemetry detected ${targetHosp.shortName} capacity dropped to 0 available beds in real-time. MediRoute AI automatically rerouted patient to ${alt.shortName}.`
        );
      }
    }
  }, [hospitals, activePatient.status, activePatient.assignedHospitalId, isNavigating, topHospital.id, rankedHospitals, backupHospital, triggerSmartBackup, smartBackupAlert]);

  return (
    <EmergencyContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        selectedHospitalId,
        setSelectedHospitalId,
        selectedAmbulanceId,
        setSelectedAmbulanceId,
        hospitals,
        ambulances,
        activePatient,
        rankedHospitals,
        topHospital,
        backupHospital,
        trafficCondition,
        setTrafficCondition,
        disasterMode,
        toggleDisasterMode,
        disasterAllocations,
        workflowSteps,
        isNavigating,
        startNavigation,
        pauseNavigation,
        resetEmergencyScenario,
        requestBackupHospital,
        updateHospitalResource,
        simulateHospitalFullSurge,
        admitPatient,
        getHospitalPrediction,
        notifications,
        addNotification,
        markAllNotificationsRead,
        clearNotification,
        smartBackupAlert,
        closeSmartBackupAlert,
        explainModalOpen,
        setExplainModalOpen,
        loginModalOpen,
        setLoginModalOpen,
        isSimulationActive,
        setIsSimulationActive,
        simulationTickCount,
        geminiStatus,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export function useEmergency() {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
}
