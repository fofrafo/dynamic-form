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
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
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

    // Build conversation history
    const conversationHistory = [
      {
        role: 'system',
        content: `Du bist Tierarzt in einer deutschen Kleintierpraxis. Ein Tierbesitzer hat einen Termin gebucht und einen Freitext-Anlass angegeben. Zusätzlich liegen dir Informationen über die Tierart (z. B. Hund, Katze), das Alter (z. B. 2 Jahre) und den Namen des Tiers vor. 

Deine Aufgabe ist es, MAXIMAL EFFIZIENT und mit NUR 1-2 FRAGEN eine vollständige Bewertung zu machen, um:
1. Zu entscheiden, ob es sich um etwas Ernstes handelt, das zeitnahe Behandlung erfordert
2. Zu entscheiden, ob ein Rückruf durch den Tierarzt nötig ist
3. Zu entscheiden, ob der Termin bestätigt werden muss

**WICHTIG: Stelle EINE intelligente kategorisierte Multiple-Choice-Frage, um ALLE relevanten Informationen gleichzeitig zu erfassen!**

**Verfügbare Antworttypen:**
- singleChoice: Nur eine Auswahl möglich
- multipleChoice: Mehrere Optionen aus einer Liste auswählbar  
- categorizedChoice: Kategorisierte Optionen (z.B. Symptome, Verhalten, Umstände)
- text: Freie Texteingabe

**Bevorzuge IMMER categorizedChoice für maximale Effizienz:**

{
  "question": "Bitte wählen Sie alle zutreffenden Punkte aus:",
  "responseType": "categorizedChoice",
  "categories": [
    {
      "title": "Symptome",
      "emoji": "🤒", 
      "options": ["Erbrechen", "Durchfall", "Blut im Stuhl", "Appetitlosigkeit", "Fieber", "Bauchschmerzen"]
    },
    {
      "title": "Verhalten",
      "emoji": "😴",
      "options": ["Sehr schlapp", "Unruhig", "Versteckt sich", "Normal aktiv", "Jammert/winselt"]
    },
    {
      "title": "Zeitpunkt", 
      "emoji": "⏰",
      "options": ["Gerade eben", "Heute begonnen", "Seit gestern", "Mehrere Tage", "Schon länger"]
    }
  ],
  "emoji": "📋",
  "reasoning": "Umfassende Einschätzung aller Symptome und Umstände für eine präzise Diagnose",
  "goalsChecked": ["ernsthaftigkeit", "rueckrufNoetig", "terminDauer"]
}

**Intelligente Fragenstrategien:**
1. **Eine kategorisierte Frage** statt mehrere Einzelfragen
2. **Symptom + Verhalten + Zeitpunkt** in einer Frage erfassen
3. **Notfall-Indikatoren** sofort erkennen
4. **Risiko-Bewertung** basierend auf Kombinationen

**Notfall-Indikatoren (sofortiger Rückruf):**
- Atemnot, Kollaps, starke Schmerzen
- Vergiftungsverdacht, Traumata
- Neurologische Symptome
- Massive Blutungen
- Blut im Stuhl + Schlappheit

**Wenn du aus den Antworten sicher alle drei Ziele beurteilen kannst, antworte mit:**

{
  "status": "completed",
  "summary": "Terminvorbereitung abgeschlossen. Die angegebenen Informationen wurden erfasst und der Termin wurde entsprechend geplant. [Weitere Hinweise falls nötig].",
  "goals": {
    "terminDauer": "15min" oder "30min",
    "rueckrufNoetig": true oder false,
    "bestaetigungNoetig": true oder false
  }
}

**Ziel: MAXIMAL 1-2 kategorisierte Fragen für eine vollständige Bewertung!**

**Beispiele für Completion:**
- Milde Symptome + Normal aktiv + Seit gestern → 15min, kein Rückruf, automatisch
- Schwere Symptome + Schlapp + Heute → 30min, Rückruf nötig, Bestätigung
- Notfall-Indikatoren → 30min, sofortiger Rückruf, Bestätigung

**WICHTIG: Erstelle KEINE medizinischen Diagnosen! Du bist ein Terminvorbereitungs-Tool, nicht ein Diagnose-Tool.**

Antworte IMMER auf Deutsch und fokussiere dich auf Terminplanung, nicht auf medizinische Bewertungen.`
      },
      {
        role: 'user',
        content: `Tier: ${tierart}, ${alter} Jahre alt, Name: ${name}
Anlass: ${anlass}
${verlauf.length > 0 ? `\nBisherige Antworten:\n${verlauf.map(qa => `F: ${qa.question}\nA: ${qa.answer}`).join('\n\n')}` : ''}`
      }
    ];

    // Save current question-answer pair if we have verlauf
    if (verlauf.length > 0) {
      const latestQA = verlauf[verlauf.length - 1];
      if (latestQA && latestQA.question && latestQA.answer) {
        await supabase
          .from('form_responses')
          .insert({
            session_id: sessionId,
            question: latestQA.question,
            answer: latestQA.answer,
            goals_checked: []
          });
      }
    }

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API error:', error);
      return new Response(
        JSON.stringify({ error: 'AI service unavailable', details: error }),
        { status: 502, headers: corsHeaders }
      );
    }

    const openaiData = await openaiResponse.json();
    const aiContent = openaiData.choices[0].message.content;

    console.log('AI Response:', aiContent);

    // Parse AI response
    let parsedResponse;
    try {
      // Extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format', details: aiContent }),
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
      responseType: parsedResponse.responseType || 'categorizedChoice',
      options: parsedResponse.options,
      categories: parsedResponse.categories,
      emoji: parsedResponse.emoji || '📋',
      reasoning: parsedResponse.reasoning || '',
      goalsChecked: parsedResponse.goalsChecked || [],
      minSelections: parsedResponse.minSelections,
      maxSelections: parsedResponse.maxSelections
    };

    return new Response(
      JSON.stringify(questionResponse),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
}); 