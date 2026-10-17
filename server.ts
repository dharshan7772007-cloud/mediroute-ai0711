import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

function safeCompareTokens(providedToken: string, expectedToken: string): boolean {
  const providedBuffer = Buffer.from(providedToken, 'utf-8');
  const expectedBuffer = Buffer.from(expectedToken, 'utf-8');

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client securely on the server
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'operational',
    geminiConfigured: !!apiKey,
    ibmArchitecture: 'IBM LinuxONE III & Cloud Satellite Edge Triage Gateway',
    timestamp: new Date().toISOString(),
    simulationMode: true,
    notice: 'All pre-hospital capacity and traffic telemetry are simulated demo test data.',
  });
});

/**
 * POST /api/gemini/explain-recommendation
 * Explains why a specific hospital was chosen using grounded telemetry
 * without overriding the deterministic readiness scoring engine.
 */
app.post('/api/gemini/explain-recommendation', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      patient,
      rankedHospitals,
      trafficCondition,
      activeAmbulance,
      customQuery,
    } = req.body;

    if (!patient || !rankedHospitals || !rankedHospitals.length) {
      res.status(400).json({ error: 'Missing required emergency context data' });
      return;
    }

    const topHospital = rankedHospitals[0];
    const backupHospital = rankedHospitals[1] || topHospital;

    // If Gemini API key is not present in environment, return a high-fidelity simulated response
    if (!aiClient) {
      res.json({
        source: 'simulated_fallback',
        isSimulated: true,
        model: 'gemini-3.8-flash (simulated mode - GEMINI_API_KEY not configured)',
        timestamp: new Date().toISOString(),
        disclaimer: 'SIMULATED DEMO OUTPUT: For demonstration and clinical drill purposes only. Not verified for real patient care.',
        primaryChoice: {
          id: topHospital.id,
          name: topHospital.name,
          readinessScore: topHospital.readinessScore || 92,
          etaMins: topHospital.etaMins || 8,
        },
        backupChoice: {
          id: backupHospital.id,
          name: backupHospital.name,
          readinessScore: backupHospital.readinessScore || 84,
          etaMins: backupHospital.etaMins || 11,
        },
        clinicalRationale: `For a ${patient.age}-year-old presenting with ${patient.condition} and unstable vitals (HR ${patient.vitals?.heartRate} bpm, BP ${patient.vitals?.bloodPressure}), ${topHospital.name} is the optimal receiving destination. The deterministic readiness engine scored this facility at ${topHospital.readinessScore || 92}/100 based on ${topHospital.icuBeds} available ICU beds, ${topHospital.ventilators} open ventilators, and active ${topHospital.traumaLevel} catheterization capability.`,
        resourceVerification: `${topHospital.name} maintains ${topHospital.availableBeds} total open beds (${topHospital.icuBeds} dedicated ICU bays). With ${topHospital.emergencyDoctors} trauma physicians on duty and an ER queue of ${topHospital.waitingPatients} waiting patients, door-to-balloon time is minimized.`,
        transitAndTrafficAssessment: `Current municipal corridor traffic is rated ${String(trafficCondition).toUpperCase()}. At an estimated travel time of ${topHospital.etaMins || 8} minutes (${topHospital.distanceKm || 3.8} km), this route avoids saturated central bottlenecks.`,
        contingencyAndBackupPlan: `${backupHospital.name} is designated as the active smart failover (${backupHospital.readinessScore || 84}/100 readiness, ${backupHospital.icuBeds} ICU beds, ETA ${backupHospital.etaMins || 11} min). If ${topHospital.shortName} capacity exhausts in-transit, automatic divert will engage immediately.`,
        sbarBriefing: `SITUATION: Unit ${activeAmbulance?.callSign || 'MED-101'} transporting ${patient.name}, ${patient.age}M with ${patient.condition}. ETA ${topHospital.etaMins || 8} minutes.\nBACKGROUND: Onset 10:42 AM. STEMI protocol activated.\nASSESSMENT: HR ${patient.vitals?.heartRate}, BP ${patient.vitals?.bloodPressure}, SpO2 ${patient.vitals?.oxygenSat}%, GCS ${patient.vitals?.gcsScore}/15.\nRECOMMENDATION: Requesting Cath Lab activation and trauma bay 4 prep upon arrival at ${topHospital.shortName}.`,
        deterministicAlignment: `100% aligned with the mathematical multi-factor scoring formula (25% Bed, 25% ICU, 15% Vent, 15% Doc, 10% ETA, 10% Queue).`,
      });
      return;
    }

    // Build strictly grounded prompt
    const prompt = `
You are the MediRoute AI Emergency Clinical Triage & Allocation Assistant, running securely within the IBM LinuxONE enterprise infrastructure.

CRITICAL INSTRUCTIONS:
1. DO NOT invent or fabricate hospital beds, ICU counts, physician numbers, distances, or traffic conditions. Ground your entire evaluation strictly on the provided real-time data payload below.
2. DO NOT replace or contradict the deterministic readiness scoring engine. The mathematical engine has already calculated the scores and ranked the candidate hospitals. Your mission is to provide clinically sound, explainable reasoning that justifies and clarifies why this hospital is the superior choice for this specific patient.
3. Every recommendation must be clearly identified as a [SIMULATED DEMO OUTPUT] for training and decision-support simulation.
4. Output your analysis in valid JSON format matching the schema requested below.

---
CURRENT INCIDENT DATA (SIMULATED TELEMETRY):
Patient:
- Name: ${patient.name}
- Age: ${patient.age}
- Gender: ${patient.gender}
- Condition / Chief Complaint: ${patient.condition}
- Severity: ${patient.severity}
- Triage Tag: ${patient.triageTag || 'red'}
- Vitals: Heart Rate ${patient.vitals?.heartRate} bpm, Blood Pressure ${patient.vitals?.bloodPressure}, SpO2 ${patient.vitals?.oxygenSat}%, Respiratory Rate ${patient.vitals?.respiratoryRate}/min, GCS ${patient.vitals?.gcsScore}/15
- Pickup Location: ${patient.pickupLocation?.name}

Responding Ambulance:
- Call Sign: ${activeAmbulance?.callSign || 'MED-101'}
- Type: ${activeAmbulance?.vehicleType || 'Advanced Life Support (ALS)'}
- Paramedic: ${activeAmbulance?.paramedicName || 'EMS Officer'}

Traffic Condition:
- Municipal Corridor Traffic Flow: ${String(trafficCondition).toUpperCase()}

Deterministic Engine Ranking (Top Candidate Facilities):
${rankedHospitals.slice(0, 4).map((h: any, idx: number) => `
Rank #${idx + 1}: ${h.name} (${h.shortName})
  - Trauma Accreditation: ${h.traumaLevel}
  - Readiness Score: ${h.readinessScore || 'N/A'}/100
  - Available Beds: ${h.availableBeds} / ${h.totalBeds}
  - Dedicated ICU Beds: ${h.icuBeds} / ${h.icuTotal}
  - Mechanical Ventilators: ${h.ventilators} / ${h.ventilatorsTotal}
  - Emergency Doctors on floor: ${h.emergencyDoctors}
  - Waiting ER Queue: ${h.waitingPatients} patients
  - Distance: ${h.distanceKm || 'N/A'} km
  - Estimated Travel Time (ETA): ${h.etaMins || 'N/A'} mins
  - Specialties: ${h.specialties?.join(', ')}
  - Engine Factor Rationale: ${h.whySelected?.join('; ') || 'Scored highest on bed-to-queue ratio'}
`).join('\n')}

${customQuery ? `Specific User Query: "${customQuery}"` : ''}

---
JSON OUTPUT FORMAT REQUIRED:
Return ONLY a valid JSON object with the following fields:
{
  "primaryChoice": {
    "id": "${topHospital.id}",
    "name": "${topHospital.name}",
    "readinessScore": ${topHospital.readinessScore || 92},
    "etaMins": ${topHospital.etaMins || 8}
  },
  "backupChoice": {
    "id": "${backupHospital.id}",
    "name": "${backupHospital.name}",
    "readinessScore": ${backupHospital.readinessScore || 84},
    "etaMins": ${backupHospital.etaMins || 11}
  },
  "clinicalRationale": "Detailed clinical synthesis connecting the patient's vitals/condition with this specific hospital's trauma level and specialties.",
  "resourceVerification": "Analysis of available beds, ICU bays, ventilators, and emergency physicians vs active ER queue.",
  "transitAndTrafficAssessment": "Analysis of the ${trafficCondition} traffic corridor, ETA, and speed implications.",
  "contingencyAndBackupPlan": "Clear smart failover protocol explaining when and why the backup hospital would receive this patient if primary capacity drops.",
  "sbarBriefing": "Complete SBAR (Situation, Background, Assessment, Recommendation) formatted handover script ready for EMS radio dispatch.",
  "deterministicAlignment": "Concise summary confirming exact mathematical alignment with the deterministic readiness scoring engine."
}
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Fallback if parsing fails
      parsed = {
        primaryChoice: {
          id: topHospital.id,
          name: topHospital.name,
          readinessScore: topHospital.readinessScore || 92,
          etaMins: topHospital.etaMins || 8,
        },
        backupChoice: {
          id: backupHospital.id,
          name: backupHospital.name,
          readinessScore: backupHospital.readinessScore || 84,
          etaMins: backupHospital.etaMins || 11,
        },
        clinicalRationale: text,
      };
    }

    res.json({
      source: 'gemini_api',
      model: 'gemini-3.8-flash',
      isSimulated: true,
      timestamp: new Date().toISOString(),
      disclaimer: 'SIMULATED DEMO OUTPUT: Generated by Gemini 3.8 Flash for pre-hospital training/demonstration. Not a substitute for licensed medical command.',
      ...parsed,
    });
  } catch (error: any) {
    console.error('Gemini Explain Error:', error);
    res.status(500).json({
      error: 'Failed to generate explainable recommendation with Gemini AI',
      message: error?.message || 'Internal server error',
      isSimulated: true,
    });
  }
});

/**
 * POST /api/gemini/assistant-chat
 * Real-time clinical conversational assistant for paramedics and ER directors
 */
app.post('/api/gemini/assistant-chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, context } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    if (!aiClient) {
      res.json({
        source: 'simulated_fallback',
        isSimulated: true,
        reply: `[SIMULATED DEMO OUTPUT · Gemini API key not configured] In this simulated emergency scenario for ${context?.patient?.name || 'the patient'} (${context?.patient?.condition || 'STEMI'}), the system recommends destination ${context?.topHospital?.name || 'Metro General'}. Travel time is ${context?.topHospital?.etaMins || 8} minutes with ${context?.topHospital?.icuBeds || 6} ICU beds available. All operational data is simulated.`,
      });
      return;
    }

    const systemPrompt = `
You are the MediRoute AI Assistant, an AI clinical advisor for pre-hospital emergency logistics running securely on an IBM LinuxONE enterprise infrastructure.

Rules:
1. Always ground your answers strictly on the provided patient vitals, hospital capacities, and traffic data. Never invent beds, physicians, or traffic status.
2. The deterministic readiness engine is the authoritative mathematical ranking system; your job is to explain, validate, and support decision making with clinical and logistical reasoning.
3. Keep answers concise, direct, professional, and formatted in clear bullet points or short paragraphs suitable for high-acuity EMS environments.
4. Always include the tag [SIMULATED DEMO OUTPUT] at the end of every answer to remind staff this is a drill/demo system.

Active Telemetry Context:
- Patient: ${context?.patient?.name || 'Patient'} (${context?.patient?.age}M), ${context?.patient?.condition}, Severity: ${context?.patient?.severity}
- Vitals: HR ${context?.patient?.vitals?.heartRate}, BP ${context?.patient?.vitals?.bloodPressure}, SpO2 ${context?.patient?.vitals?.oxygenSat}%, GCS ${context?.patient?.vitals?.gcsScore}
- Current Destination: ${context?.topHospital?.name} (Readiness: ${context?.topHospital?.readinessScore}/100, Open Beds: ${context?.topHospital?.availableBeds}, ICU: ${context?.topHospital?.icuBeds}, ETA: ${context?.topHospital?.etaMins}m)
- Backup Destination: ${context?.backupHospital?.name} (Readiness: ${context?.backupHospital?.readinessScore}/100, Open Beds: ${context?.backupHospital?.availableBeds}, ICU: ${context?.backupHospital?.icuBeds}, ETA: ${context?.backupHospital?.etaMins}m)
- Corridor Traffic: ${context?.trafficCondition?.toUpperCase()}
- Ambulance: ${context?.activeAmbulance?.callSign} (${context?.activeAmbulance?.paramedicName})
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    res.json({
      source: 'gemini_api',
      model: 'gemini-3.8-flash',
      isSimulated: true,
      reply: response.text || 'No response generated.',
    });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    res.status(500).json({
      error: 'Failed to query Gemini AI assistant',
      message: error?.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/linuxone/triage
 * Secure server-side proxy route forwarding triage requests to the IBM LinuxONE FastAPI backend.
 * Expects JSON: { "symptoms": string, "location": string }
 * Requires incoming Authorization: Bearer <token> matching LINUXONE_API_TOKEN.
 */
app.post('/api/linuxone/triage', async (req: Request, res: Response): Promise<void> => {
  const backendUrl = process.env.LINUXONE_BACKEND_URL;
  const apiToken = process.env.LINUXONE_API_TOKEN;

  // 1. Require both LINUXONE_BACKEND_URL and LINUXONE_API_TOKEN to be configured
  if (!backendUrl || !apiToken) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'IBM LinuxONE proxy service is not configured on this server.',
    });
    return;
  }

  // 2. Require valid Bearer token on incoming request and compare safely
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. A valid Bearer token is required.',
    });
    return;
  }

  const incomingToken = authHeader.slice(7).trim();
  if (!safeCompareTokens(incomingToken, apiToken)) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authorization token.',
    });
    return;
  }

  // 3. Validate symptoms and location as non-empty strings with reasonable size limits
  const { symptoms, location } = req.body || {};
  if (!symptoms || typeof symptoms !== 'string' || !symptoms.trim()) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Field "symptoms" is required and must be a non-empty string.',
    });
    return;
  }

  if (!location || typeof location !== 'string' || !location.trim()) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Field "location" is required and must be a non-empty string.',
    });
    return;
  }

  // Enforce reasonable input size limits (4,000 chars for symptoms, 500 chars for location)
  if (symptoms.length > 4000 || location.length > 500) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Payload exceeds allowed field size limits.',
    });
    return;
  }

  // 4. Construct target URL without exposing it in client responses or sensitive logs
  const cleanBaseUrl = backendUrl.replace(/\/+$/, '');
  const targetUrl = `${cleanBaseUrl}/triage`;

  // 5. 10-second timeout with AbortController and guaranteed cleanup
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        symptoms: symptoms.trim(),
        location: location.trim(),
      }),
      signal: controller.signal,
    });

    const contentType = upstreamRes.headers.get('content-type') || '';
    const responseData = contentType.includes('application/json')
      ? await upstreamRes.json().catch(() => ({}))
      : await upstreamRes.text().catch(() => '');

    if (!upstreamRes.ok) {
      console.error('[LinuxONE Proxy] Upstream returned non-OK status:', upstreamRes.status);
      res.status(upstreamRes.status >= 500 ? 502 : upstreamRes.status).json({
        error: 'Upstream Service Error',
        message: 'The upstream IBM LinuxONE service encountered an error processing the triage request.',
      });
      return;
    }

    res.status(200).json(responseData);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error('[LinuxONE Proxy] Upstream request timed out after 10s');
      res.status(504).json({
        error: 'Gateway Timeout',
        message: 'The IBM LinuxONE service did not respond within the allocated time limit.',
      });
      return;
    }

    console.error('[LinuxONE Proxy] Connection failure:', err.name || 'NetworkError');
    res.status(502).json({
      error: 'Bad Gateway',
      message: 'Unable to communicate with the IBM LinuxONE service.',
    });
  } finally {
    clearTimeout(timeoutId);
  }
});

// Production vs Development setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // In dev mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve static files
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MediRoute AI server running on http://0.0.0.0:${port}`);
    console.log(`Gemini AI status: ${apiKey ? 'Configured (Live)' : 'Simulated Fallback Mode'}`);
    console.log(`Architecture: IBM LinuxONE & Red Hat OpenShift edge hybrid cloud`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MediRoute AI server:', err);
  process.exit(1);
});
