import { GenerateQuestionRequest, ApiResponse } from '@/types/form';
import { demoQuestions, demoCompletions, getDemoScenario, generateSpecificQuestion } from './demo-questions';
import { logApiRequest, logApiResponse, logError } from './test-logger';
import { openaiDebugger } from './openai-debugger';

// Use production Supabase for actual OpenAI integration
const SUPABASE_URL = 'https://hayhcvdromexsuibenwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhheWhjdmRyb21leHN1aWJlbndoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNDU0MDYsImV4cCI6MjA1NzgyMTQwNn0.fH4P1K_NcMPzDz7BSHq8B2sCImN8FAbAycK3VKJtkJk';

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/generate-question-v2`;

// Use actual Supabase Edge Function with OpenAI
const USE_DEMO_MODE = false;

// Demo-State für Fragen-Tracking
let demoState: Record<string, { scenario: string; questionIndex: number; answers: Array<{ question: string; answer: string }> }> = {};

export async function generateQuestion(
  requestData: Partial<GenerateQuestionRequest>
): Promise<ApiResponse> {
  const startTime = Date.now();
  
  // Logging
  logApiRequest(requestData);
  
  // Demo-Modus für lokale Entwicklung
  if (USE_DEMO_MODE) {
    const result = handleDemoMode(requestData);
    logApiResponse(result, Date.now() - startTime);
    return result;
  }
  
  // Normal API call using Supabase Edge Function with OpenAI

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    };

    // Log the request with debugger
    const debugId = openaiDebugger.logRequest(
      EDGE_FUNCTION_URL, 
      'POST', 
      headers, 
      requestData
    );
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
    });

    console.log('📡 Response Status:', response.status, response.statusText);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚨 API Error:', response.status, response.statusText, errorText);
      
      // Log error with debugger
      openaiDebugger.logError(debugId, `${response.status}: ${errorText || response.statusText}`);
      
      throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const duration = Date.now() - startTime;
    
    // Log successful response with debugger
    openaiDebugger.logResponse(
      debugId,
      response.status,
      response.statusText,
      responseHeaders,
      data,
      duration
    );
    
    // Logging
    logApiResponse(data, duration);
    
    // Validate response structure
    if ('status' in data && data.status === 'completed') {
      if (!data.summary || !data.goals) {
        throw new Error('Invalid completion response structure');
      }
      return data;
    } else {
      if (!data.question || !data.responseType || !data.emoji) {
        throw new Error('Invalid question response structure');
      }
      return data;
    }
  } catch (error) {
    logError('API_CALL', error);
    throw error;
  }
}

function handleDemoMode(requestData: Partial<GenerateQuestionRequest>): ApiResponse {
  const { tierart, alter, name, anlass, verlauf = [], session_id } = requestData;
  
  // Für initialen Call brauchen wir alle Felder, für Follow-up nur session_id
  if (!session_id && (!tierart || !alter || !name || !anlass)) {
    throw new Error('Missing required fields');
  }

  const sessionKey = session_id || `${tierart}-${name}-${Date.now()}`;
  
  // Verwende spezifische Fragen basierend auf Anlass
  if (!demoState[sessionKey]) {
    const scenario = getDemoScenario(tierart || 'Hund', anlass || 'Routinecheck');
    demoState[sessionKey] = {
      scenario,
      questionIndex: 0,
      answers: []
    };
    console.log('🎭 Demo Mode - Scenario:', scenario);
  }
  
  const state = demoState[sessionKey];
  
  // Füge aktuelle Antwort hinzu (falls vorhanden)
  if (verlauf && verlauf.length > state.answers.length) {
    state.answers = [...verlauf];
  }
  
  // Erste Frage: Spezifische Symptom-Details
  // Zweite Frage: Follow-up oder direkt Completion
  if (state.questionIndex >= 2) {
    console.log('🎯 Demo Complete - Returning completion');
    const scenario = state.scenario;
    const completion = demoCompletions[scenario as keyof typeof demoCompletions];
    return {
      ...completion,
      session_id: sessionKey
    };
  }
  
  // Erste oder zweite Frage?
  if (state.questionIndex === 0) {
    // Erste Frage: Spezifische Symptom-Details
    const specificQuestion = generateSpecificQuestion(tierart || 'Hund', anlass || 'Routinecheck');
    state.questionIndex++;
    
    console.log('❓ Demo Question 1 (spezifisch):', specificQuestion.question);
    
    return {
      ...specificQuestion,
      session_id: sessionKey
    };
  } else {
    // Zweite Frage: Follow-up basierend auf erster Antwort
    const followUpQuestion = {
      session_id: sessionKey,
      question: "Noch ein paar wichtige Details:",
      responseType: "categorizedChoice" as const,
      categories: [
        {
          title: "Allgemeinbefinden heute",
          emoji: "😺",
          options: [
            "Frisst und trinkt normal",
            "Weniger Appetit als sonst", 
            "Gar kein Interesse an Futter",
            "Trinkt viel mehr als normal",
            "Versteckt sich"
          ]
        },
        {
          title: "Verhalten",
          emoji: "🎾",
          options: [
            "Spielt und ist aktiv wie immer",
            "Etwas ruhiger als sonst",
            "Sehr schlapp und müde",
            "Unruhig und nervös",
            "Sucht mehr Nähe als sonst"
          ]
        }
      ],
      emoji: "🔍",
      reasoning: "Diese Details helfen bei der finalen Einschätzung der Dringlichkeit",
      goalsChecked: ["terminDauer", "rueckrufNoetig"]
    };
    
    state.questionIndex++;
    
    console.log('❓ Demo Question 2 (Follow-up):', followUpQuestion.question);
    
    return followUpQuestion;
  }
}

// Helper function to create session ID for initial requests
export function generateSessionId(): string {
  return crypto.randomUUID();
}

// Reset demo state (für Testing)
export function resetDemoMode(): void {
  demoState = {};
}

// Type guard functions
export function isCompletionResponse(response: ApiResponse): response is Extract<ApiResponse, { status: 'completed' }> {
  return 'status' in response && response.status === 'completed';
}

export function isQuestionResponse(response: ApiResponse): response is Extract<ApiResponse, { question: string }> {
  return 'question' in response;
} 