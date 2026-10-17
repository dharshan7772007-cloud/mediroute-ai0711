import { Patient, Hospital, Ambulance, IBMWatsonxFactSheet, IBMDemoStep } from '../types';

/**
 * Generates an HL7 FHIR (Fast Healthcare Interoperability Resources) Release 4 Transaction Bundle
 * representing the live emergency encounter, patient vitals observations, and target hospital destination.
 */
export function generateHL7FHIRBundle(
  patient: Patient,
  hospital: Hospital,
  ambulance: Ambulance,
  readinessScore: number
) {
  const timestamp = new Date().toISOString();
  const birthYear = 2026 - patient.age;

  return {
    resourceType: 'Bundle',
    id: `fhir-bundle-${patient.id}`,
    meta: {
      lastUpdated: timestamp,
      profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-emergency-encounter'],
      source: 'urn:ibm:watsonx:mediroute-emergency-gateway',
    },
    type: 'transaction',
    entry: [
      {
        fullUrl: `urn:uuid:patient-${patient.id}`,
        resource: {
          resourceType: 'Patient',
          id: patient.id,
          identifier: [
            {
              system: 'urn:oid:2.16.840.1.113883.4.1',
              value: `EMS-PAT-${patient.id}`,
            },
          ],
          active: true,
          name: [
            {
              use: 'official',
              text: patient.name,
              family: patient.name.split(' ')[1] || 'Patient',
              given: [patient.name.split(' ')[0] || 'Unknown'],
            },
          ],
          gender: patient.gender === 'M' ? 'male' : patient.gender === 'F' ? 'female' : 'other',
          birthDate: `${birthYear}-05-14`,
          extension: [
            {
              url: 'http://ibm.com/fhir/StructureDefinition/emergency-severity',
              valueString: patient.severity,
            },
          ],
        },
      },
      {
        fullUrl: `urn:uuid:encounter-${patient.id}`,
        resource: {
          resourceType: 'Encounter',
          id: `enc-${patient.id}`,
          status: 'in-progress',
          class: {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'EMER',
            display: 'emergency',
          },
          priority: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActPriority',
                code: 'CR',
                display: 'Callback results (Critical)',
              },
            ],
          },
          subject: {
            reference: `urn:uuid:patient-${patient.id}`,
            display: patient.name,
          },
          participant: [
            {
              type: [
                {
                  coding: [
                    {
                      system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                      code: 'PPRF',
                      display: 'primary performer',
                    },
                  ],
                },
              ],
              individual: {
                display: ambulance.paramedicName,
              },
            },
          ],
          serviceProvider: {
            display: hospital.name,
          },
          reasonCode: [
            {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '401303003',
                  display: patient.condition,
                },
              ],
            },
          ],
        },
      },
      {
        fullUrl: `urn:uuid:obs-heart-rate-${patient.id}`,
        resource: {
          resourceType: 'Observation',
          id: `obs-hr-${patient.id}`,
          status: 'final',
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: 'vital-signs',
                  display: 'Vital Signs',
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '8867-4',
                display: 'Heart rate',
              },
            ],
          },
          subject: {
            reference: `urn:uuid:patient-${patient.id}`,
          },
          effectiveDateTime: timestamp,
          valueQuantity: {
            value: patient.vitals.heartRate,
            unit: 'beats/minute',
            system: 'http://unitsofmeasure.org',
            code: '/min',
          },
        },
      },
      {
        fullUrl: `urn:uuid:obs-spo2-${patient.id}`,
        resource: {
          resourceType: 'Observation',
          id: `obs-spo2-${patient.id}`,
          status: 'final',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '59408-5',
                display: 'Oxygen saturation in Arterial blood by Pulse oximetry',
              },
            ],
          },
          valueQuantity: {
            value: patient.vitals.oxygenSat,
            unit: '%',
            system: 'http://unitsofmeasure.org',
            code: '%',
          },
        },
      },
      {
        fullUrl: `urn:uuid:location-${hospital.id}`,
        resource: {
          resourceType: 'Location',
          id: hospital.id,
          status: 'active',
          name: hospital.name,
          mode: 'instance',
          type: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
                  code: 'ER',
                  display: 'Emergency room',
                },
              ],
            },
          ],
          position: {
            longitude: hospital.lng,
            latitude: hospital.lat,
          },
          extension: [
            {
              url: 'http://ibm.com/fhir/StructureDefinition/watsonx-readiness-score',
              valueDecimal: readinessScore,
            },
            {
              url: 'http://ibm.com/fhir/StructureDefinition/trauma-accreditation',
              valueString: hospital.traumaLevel,
            },
          ],
        },
      },
    ],
  };
}

/**
 * Returns watsonx.governance enterprise audit metrics and Shapley feature contributions
 */
export function getWatsonxGovernanceFactSheet(
  topHospital: Hospital,
  readinessScore: number
): IBMWatsonxFactSheet {
  return {
    modelName: 'watsonx.ai Granite 3.0 Clinical-Triage-8B',
    foundationModel: 'IBM Granite 3.0 Instruct (Medical Domain Finetuned)',
    deploymentPlatform: 'Red Hat OpenShift on IBM Cloud Satellite (Sub-50ms Edge)',
    fairnessScore: 99.4,
    driftMetric: 0.018, // well below 0.05 threshold
    complianceStatus: 'HIPAA & HL7 Compliant',
    shapleyContributions: [
      {
        feature: 'ICU Vacancy Buffer',
        weight: 0.28,
        description: `Dedicated critical care bay ready at ${topHospital.shortName} (${topHospital.icuBeds} bays open).`,
      },
      {
        feature: 'Corridor Travel Time (ETA)',
        weight: 0.24,
        description: `Shortest travel trajectory (${topHospital.etaMins || 8} min) through dynamic municipal green corridor.`,
      },
      {
        feature: 'ER Turnaround Velocity',
        weight: 0.21,
        description: `Low waiting queue (${topHospital.waitingPatients} cases) minimizes door-to-balloon time.`,
      },
      {
        feature: 'Trauma & Cath Lab Specialty Match',
        weight: 0.17,
        description: `${topHospital.traumaLevel} accreditation and 24/7 cardiac catheterization on standby.`,
      },
      {
        feature: 'Ventilator & Physician Density',
        weight: 0.10,
        description: `${topHospital.ventilators} mechanical ventilators and ${topHospital.emergencyDoctors} trauma physicians on floor.`,
      },
    ],
  };
}

/**
 * Synthesizes EMS Radio Chime using Web Audio API
 */
export function playAudioDispatchChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    // Emergency dual-tone radio alert (587Hz D5 -> 880Hz A5)
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc1.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12);

    osc2.frequency.setValueAtTime(880.0, ctx.currentTime);
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.36);
    osc2.stop(ctx.currentTime + 0.36);
  } catch {
    // Silently continue if audio context is blocked by browser gesture policy
  }
}

/**
 * 5-Step IBM Hackathon / Executive Presentation Script
 */
export const IBM_DEMO_STEPS: IBMDemoStep[] = [
  {
    id: 1,
    title: '911 Ingestion & Real-Time Telemetry',
    phase: 'IBM Event Streams (Kafka)',
    narration:
      'High-frequency biometric telemetry from Unit MED-101 (STEMI Vitals: HR 114, BP 88/54, SpO2 91%) streams directly via IBM Event Streams to the edge gateway.',
    actionName: 'View Vitals HUD',
    ibmComponent: 'IBM Event Streams + Red Hat OpenShift',
  },
  {
    id: 2,
    title: 'Multi-Factor Readiness Scoring',
    phase: 'watsonx.ai Foundation Models',
    narration:
      'Granite 3.0 Clinical-Triage evaluates 8 hospitals in 32ms using bed capacity, ICU availability, doctor density, and travel time to compute the 92/100 Emergency Readiness Score.',
    actionName: 'Inspect AI Reasoning',
    ibmComponent: 'IBM watsonx.ai + Granite 3.0',
  },
  {
    id: 3,
    title: 'Predictive Bed Regression (30m & 60m)',
    phase: 'IBM Cloud Time-Series Forecaster',
    narration:
      'Machine learning model projects bed turnover +30m and +60m into the future based on surgical transfer velocity and historical discharge cadence, preventing blind diversions.',
    actionName: 'View Bed Forecast',
    ibmComponent: 'IBM Cloud Satellite Analytics',
  },
  {
    id: 4,
    title: 'In-Flight Surge & Smart Failover Divert',
    phase: 'watsonx.governance Automated Guardrails',
    narration:
      'If target hospital capacity depletes mid-transit, watsonx automatically intercepts the route and executes an instantaneous, bias-free divert to the optimal backup hospital.',
    actionName: 'Trigger Surge Divert',
    ibmComponent: 'IBM watsonx.governance',
  },
  {
    id: 5,
    title: 'Mass Casualty (MCI) Multi-Facility Triage',
    phase: 'Enterprise Resource Orchestration',
    narration:
      'Disaster mode orchestrates 20 simultaneous blast and trauma victims across the metropolitan healthcare grid, standardizing data via HL7 FHIR v4 payloads.',
    actionName: 'Launch Disaster Grid',
    ibmComponent: 'IBM Cloud + HL7 FHIR Interoperability',
  },
];
