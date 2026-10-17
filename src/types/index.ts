export type Role = 'ambulance' | 'hospital' | 'admin';

export type Severity = 'critical' | 'urgent' | 'moderate';

export type TrafficCondition = 'green' | 'yellow' | 'red';

export type AmbulanceStatus = 
  | 'idle' 
  | 'dispatched' 
  | 'at_scene' 
  | 'transporting' 
  | 'arrived' 
  | 'returning';

export interface Vitals {
  heartRate: number;
  bloodPressure: string;
  oxygenSat: number;
  respiratoryRate: number;
  gcsScore: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  condition: string;
  severity: Severity;
  vitals: Vitals;
  pickupLocation: {
    name: string;
    lat: number;
    lng: number;
  };
  reportedTime: string;
  assignedHospitalId?: string;
  backupHospitalId?: string;
  status: 'reported' | 'dispatched' | 'transporting' | 'arrived' | 'admitted';
  triageTag?: 'red' | 'yellow' | 'green' | 'black';
}

export interface Hospital {
  id: string;
  name: string;
  shortName: string;
  address: string;
  lat: number;
  lng: number;
  totalBeds: number;
  availableBeds: number;
  icuTotal: number;
  icuBeds: number;
  ventilatorsTotal: number;
  ventilators: number;
  emergencyDoctors: number;
  waitingPatients: number;
  traumaLevel: 'Level I' | 'Level II' | 'Level III';
  specialties: string[];
  status: 'operational' | 'busy' | 'full';
  readinessScore?: number;
  distanceKm?: number;
  travelTimeMins?: number;
  etaMins?: number;
  whySelected?: string[];
}

export interface Ambulance {
  id: string;
  callSign: string;
  vehicleType: 'Advanced Life Support (ALS)' | 'Critical Care Transport (CCT)' | 'Basic Life Support (BLS)';
  paramedicName: string;
  driverName: string;
  lat: number;
  lng: number;
  currentStreet: string;
  status: AmbulanceStatus;
  speedKmH: number;
  assignedPatientId?: string;
  targetHospitalId?: string;
  routeProgress: number; // 0 to 100%
}

export interface ReadinessScoreBreakdown {
  score: number;
  rating: 'Excellent' | 'Good' | 'Moderate' | 'Critical';
  ratingColor: string;
  bedScore: number; // out of 25
  icuScore: number; // out of 25
  ventilatorScore: number; // out of 15
  doctorScore: number; // out of 15
  travelPenalty: number; // out of 10
  queuePenalty: number; // out of 10
}

export interface BedPrediction {
  currentBeds: number;
  predicted30m: number;
  predicted60m: number;
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  dischargeRatePerHour: number;
  incomingRatePerHour: number;
}

export interface DisasterAllocation {
  id: string;
  patientName: string;
  age: number;
  injury: string;
  triageCategory: 'Immediate (Red)' | 'Delayed (Yellow)' | 'Minimal (Green)' | 'Expectant (Black)';
  triageColor: 'red' | 'yellow' | 'green' | 'black';
  assignedHospitalId: string;
  assignedHospitalName: string;
  etaMinutes: number;
  aiExplanation: string;
  bedType: 'ICU' | 'Trauma / Surgical' | 'General Emergency' | 'Observation';
}

export interface NotificationItem {
  id: string;
  type: 'emergency' | 'hospital_full' | 'backup_activated' | 'ambulance_arrived' | 'patient_admitted' | 'disaster_mode';
  title: string;
  message: string;
  timestamp: string;
  timeAgo: string;
  read: boolean;
  priority: 'high' | 'normal';
}

export interface EmergencyWorkflowStep {
  step: number;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'upcoming';
}

export interface IBMWatsonxFactSheet {
  modelName: string;
  foundationModel: string;
  deploymentPlatform: string;
  fairnessScore: number; // 0 - 100
  driftMetric: number; // e.g. 0.02
  complianceStatus: 'HIPAA & HL7 Compliant' | 'Audit Verified';
  shapleyContributions: {
    feature: string;
    weight: number;
    description: string;
  }[];
}

export interface IBMDemoStep {
  id: number;
  title: string;
  phase: string;
  narration: string;
  actionName: string;
  ibmComponent: string;
}
