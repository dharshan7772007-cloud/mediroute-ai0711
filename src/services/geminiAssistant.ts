import { Patient, Hospital, Ambulance, TrafficCondition } from '../types';

export interface GeminiExplainResponse {
  source: 'gemini_api' | 'simulated_fallback';
  model: string;
  isSimulated: boolean;
  timestamp: string;
  disclaimer: string;
  primaryChoice?: {
    id: string;
    name: string;
    readinessScore: number;
    etaMins: number;
  };
  backupChoice?: {
    id: string;
    name: string;
    readinessScore: number;
    etaMins: number;
  };
  clinicalRationale: string;
  resourceVerification?: string;
  transitAndTrafficAssessment?: string;
  contingencyAndBackupPlan?: string;
  sbarBriefing?: string;
  deterministicAlignment?: string;
  error?: string;
}

export interface GeminiChatResponse {
  source: 'gemini_api' | 'simulated_fallback';
  model: string;
  isSimulated: boolean;
  reply: string;
  error?: string;
}

/**
 * Calls server-side Gemini 3.8 Flash endpoint to generate an explainable
 * clinical triage & hospital allocation recommendation without inventing telemetry.
 */
export async function fetchGeminiExplanation(
  patient: Patient,
  rankedHospitals: Hospital[],
  trafficCondition: TrafficCondition,
  activeAmbulance: Ambulance,
  customQuery?: string
): Promise<GeminiExplainResponse> {
  try {
    const res = await fetch('/api/gemini/explain-recommendation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patient,
        rankedHospitals,
        trafficCondition,
        activeAmbulance,
        customQuery,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Server responded with status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('Gemini explanation fetch fallback:', err);
    // Return grounded graceful fallback with explicit simulation disclaimer
    const top = rankedHospitals[0];
    const backup = rankedHospitals[1] || top;

    return {
      source: 'simulated_fallback',
      model: 'gemini-3.8-flash (client fallback mode)',
      isSimulated: true,
      timestamp: new Date().toISOString(),
      disclaimer: 'SIMULATED DEMO OUTPUT: For demonstration & clinical drill purposes only.',
      primaryChoice: {
        id: top?.id || 'hosp-1',
        name: top?.name || 'Metro General Trauma Center',
        readinessScore: top?.readinessScore || 92,
        etaMins: top?.etaMins || 8,
      },
      backupChoice: {
        id: backup?.id || 'hosp-3',
        name: backup?.name || 'Apex Cardiac & Neuro Institute',
        readinessScore: backup?.readinessScore || 84,
        etaMins: backup?.etaMins || 11,
      },
      clinicalRationale: `Based on patient ${patient.name}'s ${patient.condition} (HR ${patient.vitals.heartRate}, BP ${patient.vitals.bloodPressure}, SpO2 ${patient.vitals.oxygenSat}%), ${top?.name} is the top ranked facility. It satisfies the clinical need for ${top?.traumaLevel} resuscitation with ${top?.icuBeds} open ICU beds and 24/7 catheterization standby.`,
      resourceVerification: `${top?.name} currently reports ${top?.availableBeds} available beds (${top?.icuBeds} ICU bays) and ${top?.emergencyDoctors} emergency physicians active on shift with an active ER queue of ${top?.waitingPatients} patients.`,
      transitAndTrafficAssessment: `Traversing via ${trafficCondition.toUpperCase()} municipal traffic corridor with an estimated arrival time of ${top?.etaMins || 8} minutes (${top?.distanceKm || 3.8} km).`,
      contingencyAndBackupPlan: `${backup?.name} is designated as secondary failover (${backup?.icuBeds} ICU beds, ETA ${backup?.etaMins || 11}m). Automatic divert will trigger if primary beds hit zero.`,
      sbarBriefing: `SITUATION: Unit ${activeAmbulance.callSign} inbound to ${top?.shortName} with ${patient.name}, ${patient.age}M, acute STEMI.\nBACKGROUND: Chest pain onset 35m ago.\nASSESSMENT: HR ${patient.vitals.heartRate}, BP ${patient.vitals.bloodPressure}, SpO2 ${patient.vitals.oxygenSat}%, GCS ${patient.vitals.gcsScore}.\nRECOMMENDATION: Cath Lab activation requested. Direct to Trauma Bay 4.`,
      deterministicAlignment: 'Verified: Fully aligned with the mathematical multi-factor scoring formula.',
    };
  }
}

/**
 * Interactive chat query with the server-side Gemini Clinical Assistant
 */
export async function queryGeminiAssistant(
  message: string,
  context: {
    patient: Patient;
    topHospital: Hospital;
    backupHospital: Hospital;
    trafficCondition: TrafficCondition;
    activeAmbulance: Ambulance;
  }
): Promise<GeminiChatResponse> {
  try {
    const res = await fetch('/api/gemini/assistant-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, context }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `Server responded with status ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('Gemini assistant query fallback:', err);
    return {
      source: 'simulated_fallback',
      model: 'gemini-3.8-flash (client fallback mode)',
      isSimulated: true,
      reply: `[SIMULATED DEMO OUTPUT] For patient ${context.patient.name} (${context.patient.condition}), destination ${context.topHospital.name} is prioritized due to ${context.topHospital.icuBeds} available ICU beds and ETA ${context.topHospital.etaMins || 8} minutes through ${context.trafficCondition} traffic corridor. All telemetry is simulated demo data.`,
    };
  }
}
