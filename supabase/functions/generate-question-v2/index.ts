import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { tierart, alter, name, anlass, verlauf = [], session_id } = await req.json();

    // Validate required fields
    if (!tierart || !alter || !name || !anlass) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tierart, alter, name, anlass' }),
        { status: 400, headers: corsHeaders }
      );
    }

    let sessionId = session_id;
    
    // Create or get session
    if (!sessionId) {
      const { data: sessionData, error: sessionError } = await supabase
        .from('form_sessions')
        .insert({
          tierart,
          alter,
          name,
          anlass,
          status: 'in_progress'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: corsHeaders }
        );
      }

      sessionId = sessionData.id;
    }

    // Build conversation history with improved system prompt
    const isFollowUp = verlauf && verlauf.length > 0;
    const systemPrompt = isFollowUp ? 
      // Follow-up System Prompt
      `Du bist ein Tierarzt-Assistent. Der Besitzer hat bereits eine erste Frage beantwortet. Jetzt stellst du eine ZWEITE und LETZTE Frage, um alle Informationen für die Terminplanung zu sammeln.

**ZWEITE FRAGE sollte fokussieren auf:**
- Allgemeinbefinden und Verhalten
- Zeitlicher Verlauf und Dringlichkeit  
- Weitere wichtige Details

**Nach dieser zweiten Antwort MUSST du zur Completion!**` :
      // Initial System Prompt  
      `Du bist ein intelligenter Tierarzt-Assistent für die Terminvorbereitung. Basierend auf dem angegebenen Anlass erstellst du SPEZIFISCHE, DYNAMISCHE Fragen.`;
    
    const conversationHistory = [
      {
        role: 'system',
        content: systemPrompt + `

**KERNZIELE:**
1. Terminlänge bestimmen (15min vs 30min)
2. Rückruf-Notwendigkeit bewerten  
3. Dringlichkeit einschätzen

**WICHTIG: Analysiere den Anlass und erstelle PASSENDE Optionen!**

**Für "Erbrechen" beispielsweise:**
- Aktuelle Situation: "Erbricht Blut", "Erbricht Schleim", "Erbricht Futter", "Erbricht Flüssigkeit", "Würgt nur", "Mit Schaum"
- Häufigkeit: "Einmalig", "Mehrmals heute", "Dauerhaft", "Nach dem Fressen", "Nüchtern"
- Begleitumstände: "Mit Durchfall", "Mit Fieber", "Mit Schmerzen", "Frisst noch", "Trinkt noch"

**Für "Humpeln/Lahmen":**
- Bewegung: "Hinkt dauerhaft", "Nur nach Aufstehen", "Beim Laufen", "Hält Pfote hoch", "Belastet nicht"
- Intensität: "Leichte Schonhaltung", "Deutlich sichtbar", "Berührt Boden nicht", "Nur bei schnellen Bewegungen"
- Schmerzen: "Jault bei Berührung", "Zuckt zurück", "Leckt Pfote", "Keine Schmerzreaktion"

**Für "Routine/Impfung":**
- Termine: "Jahresimpfung", "Reiseimpfung", "Welpenimpfung", "Auffrischung", "Erstimpfung"
- Zusätzlich: "Nur Impfung", "Mit Gesundheitscheck", "Entwurmung dazu", "Zahnkontrolle", "Blutbild gewünscht"

**IMMER kategorizedChoice verwenden mit 2-4 relevanten Kategorien basierend auf dem spezifischen Anlass:**

**Für AKUTE SYMPTOME (Erbrechen, Durchfall, Humpeln, Husten, etc.):**
{
  "question": "Details zu [SPEZIFISCHER ANLASS] - bitte alle zutreffenden Punkte auswählen:",
  "responseType": "categorizedChoice",
  "categories": [
    {
      "title": "[SYMPTOM-SPEZIFISCH]",
      "emoji": "🎯",
      "options": ["[DYNAMISCHE OPTIONEN BASIEREND AUF SYMPTOM]"]
    },
    {
      "title": "Zeitlicher Verlauf",
      "emoji": "⏰", 
      "options": ["Gerade eben", "Heute begonnen", "Seit gestern", "Mehrere Tage", "Schon länger", "Wird schlimmer", "Bleibt gleich"]
    },
    {
      "title": "Allgemeinzustand",
      "emoji": "😺",
      "options": ["Frisst normal", "Trinkt normal", "Spielt noch", "Sehr schlapp", "Versteckt sich", "Unruhig", "Wie immer"]
    }
  ]
}

**Für ROUTINE-TERMINE (Impfung, Check-up, Entwurmung, etc.):**
{
  "question": "Details zu Ihrem [ROUTINE-TERMIN] - bitte alle zutreffenden Punkte auswählen:",
  "responseType": "categorizedChoice", 
  "categories": [
    {
      "title": "Gewünschte Leistungen",
      "emoji": "💉",
      "options": ["Nur [HAUPTLEISTUNG]", "Mit Gesundheitscheck", "Zusätzliche Beratung", "Blutbild gewünscht", "Zahnkontrolle"]
    },
    {
      "title": "Vorgeschichte",
      "emoji": "📋",
      "options": ["Letzte Impfung bekannt", "Impfpass vorhanden", "Neue Praxis", "Ersttermin", "Regelmäßiger Patient"]
    },
    {
      "title": "Besonderheiten",
      "emoji": "⭐",
      "options": ["Ängstliches Tier", "Besondere Wünsche", "Zeitpräferenz", "Reiseplanung", "Alles normal"]
    }
  ]
}

**Notfall-Indikatoren (sofortiger Rückruf):**
- Atemnot, Kollaps, starke Schmerzen
- Vergiftungsverdacht, Traumata
- Neurologische Symptome
- Massive Blutungen

**NUR nach 2 Fragen zur Completion! Erst nach der ZWEITEN Antwort kannst du mit completion antworten:**

{
  "status": "completed",
  "summary": "Terminvorbereitung abgeschlossen. Basierend auf [SPEZIFISCHE SYMPTOME] wurde eine [TERMINLÄNGE] geplant. [WEITERE DETAILS]",
  "goals": {
    "terminDauer": "15min" oder "30min",
    "rueckrufNoetig": true oder false,
    "bestaetigungNoetig": true oder false
  }
}

**WICHTIG: 
- Erste Frage = Spezifische Symptom-Details
- Zweite Frage = Allgemeinbefinden & Follow-up  
- Dann = Completion mit Empfehlung**

Antworte IMMER auf Deutsch und fokussiere dich auf Terminplanung, nicht auf medizinische Bewertungen.

WICHTIG: Deine Antwort muss IMMER in gültigem JSON-Format sein!`
      },
      {
        role: 'user',
        content: `Tier: ${tierart}, Alter: ${alter}, Name: ${name}, Anlass: ${anlass}`
      }
    ];

    // Add conversation history
    console.log('📋 Verlauf length:', verlauf?.length || 0);
    verlauf.forEach((qa: any, index: number) => {
      console.log(`📋 QA ${index + 1}:`, qa);
      conversationHistory.push({
        role: 'assistant',
        content: qa.question
      });
      conversationHistory.push({
        role: 'user',
        content: qa.answer
      });
    });

    // Call OpenAI API with GPT-4o-mini (optimized and faster)
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationHistory,
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error('OpenAI API error:', openAiResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API error', 
          status: openAiResponse.status,
          details: errorText 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const openAiData = await openAiResponse.json();
    const content = openAiData.choices[0].message.content;

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError, 'Content:', content);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON response from AI' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Handle completion
    if (parsedResponse.status === 'completed') {
      // Update session status
      await supabase
        .from('form_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      return new Response(
        JSON.stringify({
          session_id: sessionId,
          status: 'completed',
          summary: parsedResponse.summary,
          goals: parsedResponse.goals
        }),
        { headers: corsHeaders }
      );
    }

    // Handle question response
    const questionResponse = {
      session_id: sessionId,
      question: parsedResponse.question,
      responseType: parsedResponse.responseType || 'singleChoice',
      options: parsedResponse.options,
      categories: parsedResponse.categories,
      emoji: parsedResponse.emoji || '🤔',
      reasoning: parsedResponse.reasoning || '',
      goalsChecked: parsedResponse.goalsChecked || [],
      minSelections: parsedResponse.minSelections,
      maxSelections: parsedResponse.maxSelections
    };

    return new Response(JSON.stringify(questionResponse), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});