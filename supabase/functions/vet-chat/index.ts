const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();

    if (!message || !context) {
      return new Response(
        JSON.stringify({ error: 'Message and context are required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Baue Kontext für Tierarzt-KI
    const chatHistory = context.chatHistory || [];
    const conversationHistory = [
      {
        role: 'system',
        content: `Du bist Dr. KI, ein erfahrener deutscher Tierarzt-Assistent. Du hilfst Tierbesitzern mit fundierten, verantwortungsvollen Ratschlägen.

**KONTEXT ZUM TIER:**
- Name: ${context.name}
- Tierart: ${context.tierart}  
- Alter: ${context.alter}
- Anlass des Besuchs: ${context.anlass}

**BISHERIGE ANTWORTEN AUS DER TERMINVORBEREITUNG:**
${context.formAnswers?.map((qa: any) => `Frage: ${qa.question}\nAntwort: ${qa.answer}`).join('\n\n')}

**DEINE ROLLE:**
- Gib praktische, sofort umsetzbare Tipps
- Erkläre Warnsignale und wann sofortige Hilfe nötig ist
- Beruhige bei unbegründeten Sorgen
- Verweise bei ernsten Symptomen auf echte Tierärzte
- Antworte einfühlsam und verständlich

**WICHTIGE REGELN:**
- KEINE Diagnosen stellen!
- KEINE Medikamente verschreiben!
- Bei Notfällen: Sofort echten Tierarzt/Notdienst kontaktieren
- Immer darauf hinweisen, dass du echte Tierärzte nicht ersetzt
- Konkrete, praktische Hilfe geben

**STIL:**
- Freundlich und professionell
- Verwende gelegentlich passende Emojis
- Strukturiere längere Antworten mit Markdown (Listen, **Fettschrift**, etc.)
- Antworte auf Deutsch
- Nutze Markdown für bessere Lesbarkeit: **wichtige Punkte**, - Aufzählungen, etc.

Antworte hilfreich auf die folgende Nachricht des Tierbesitzers:`
      }
    ];

    // Füge Chat-Verlauf hinzu
    chatHistory.forEach((msg: any) => {
      conversationHistory.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Aktuelle Benutzer-Nachricht
    conversationHistory.push({
      role: 'user',
      content: message
    });

    // OpenAI API Call
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationHistory,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!openAiResponse.ok) {
      const errorText = await openAiResponse.text();
      console.error('OpenAI API error:', openAiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'KI-Service temporarily unavailable' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const openAiData = await openAiResponse.json();
    const response = openAiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ response }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Vet chat function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});