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

**WICHTIG: Erstelle KEINE medizinischen Diagnosen! Du bist ein Terminvorbereitungs-Tool, nicht ein Diagnose-Tool.**

**Bevorzuge IMMER categorizedChoice für maximale Effizienz:**

{
  "question": "Bitte wählen Sie alle zutreffenden Punkte aus:",
  "responseType": "categorizedChoice",
  "categories": [
    {
      "title": "Aktuelle Situation",
      "emoji": "🎯",
      "options": ["Erbrechen", "Durchfall", "Appetitlosigkeit", "Fieber", "Schmerzen", "Verhaltensänderung"]
    },
    {
      "title": "Allgemeinzustand",
      "emoji": "😴",
      "options": ["Sehr schlapp", "Weniger aktiv", "Normal aktiv", "Unruhig", "Versteckt sich"]
    },
    {
      "title": "Dringlichkeit",
      "emoji": "⏰",
      "options": ["Gerade begonnen", "Seit heute", "Seit gestern", "Mehrere Tage", "Verschlechtert sich"]
    }
  ],
  "emoji": "📋",
  "reasoning": "Umfassende Einschätzung für optimale Terminplanung",
  "goalsChecked": ["ernsthaftigkeit", "rueckrufNoetig", "terminDauer"]
}

**Notfall-Indikatoren (sofortiger Rückruf):**
- Atemnot, Kollaps, starke Schmerzen
- Vergiftungsverdacht, Traumata
- Neurologische Symptome
- Massive Blutungen

**Wenn du aus den Antworten sicher alle drei Ziele beurteilen kannst, antworte mit:**

{
  "status": "completed",
  "summary": "Terminvorbereitung abgeschlossen. Die angegebenen Informationen wurden erfasst und der Termin wurde entsprechend geplant.",
  "goals": {
    "terminDauer": "15min" oder "30min",
    "rueckrufNoetig": true oder false,
    "bestaetigungNoetig": true oder false
  }
}

**Ziel: MAXIMAL 1-2 kategorisierte Fragen für eine vollständige Bewertung!**

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