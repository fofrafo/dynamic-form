import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// CORS headers for public access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept-language',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// Language detection helper
function detectLanguage(acceptLanguageHeader: string | null): 'en' | 'de' {
  if (!acceptLanguageHeader) return 'en';
  const languages = acceptLanguageHeader.toLowerCase();
  
  if (languages.includes('de')) return 'de';
  return 'en';
}

// Generate question using OpenAI
async function generateQuestion(tierart: string, alter: string, name: string, anlass: string, language: 'en' | 'de') {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = language === 'de' 
    ? `Du bist ein erfahrener Tierarzt-Assistent. Basierend auf den Informationen über das Tier, stelle eine spezifische, medizinisch relevante Frage, die dir hilft, die Situation besser zu verstehen. Stelle nur EINE Frage. Formatiere deine Antwort als JSON mit: {"question": "deine frage", "type": "multiple_choice", "options": ["Option 1", "Option 2", "Option 3"]}`
    : `You are an experienced veterinary assistant. Based on the information about the pet, ask a specific, medically relevant question that helps you better understand the situation. Ask only ONE question. Format your response as JSON with: {"question": "your question", "type": "multiple_choice", "options": ["Option 1", "Option 2", "Option 3"]}`;

  const userPrompt = language === 'de'
    ? `Tierart: ${tierart}, Alter: ${alter}, Name: ${name}, Anlass: ${anlass}`
    : `Animal type: ${tierart}, Age: ${alter}, Name: ${name}, Reason: ${anlass}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  try {
    return JSON.parse(content);
  } catch {
    // Fallback if JSON parsing fails
    return {
      question: content,
      type: 'text',
      options: []
    };
  }
}

// Generate complete HTML page
function generateHTML(questionData: any, initialData: any, language: 'en' | 'de'): string {
  const texts = {
    en: {
      title: 'Dynamic Veterinary Form',
      petInfo: 'Pet Information',
      question: 'Question',
      next: 'Next Question',
      loading: 'Loading next question...',
      complete: 'Complete Form',
      error: 'Error occurred. Please try again.',
    },
    de: {
      title: 'Dynamischer Tierarzt Fragebogen',
      petInfo: 'Tierinformationen',
      question: 'Frage',
      next: 'Nächste Frage',
      loading: 'Lade nächste Frage...',
      complete: 'Fragebogen abschließen',
      error: 'Fehler aufgetreten. Bitte versuchen Sie es erneut.',
    }
  };

  const t = texts[language];

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${t.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 100%;
            animation: slideUp 0.5s ease-out;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        h1 {
            color: #2d3748;
            text-align: center;
            margin-bottom: 2rem;
            font-size: 1.8rem;
        }
        
        .pet-info {
            background: #f7fafc;
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            border: 2px solid #e2e8f0;
        }
        
        .pet-info h3 {
            color: #4a5568;
            margin-bottom: 1rem;
            font-size: 1.2rem;
        }
        
        .pet-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
            font-size: 0.9rem;
        }
        
        .pet-detail {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .pet-detail strong {
            color: #2d3748;
        }
        
        .question-container {
            margin-bottom: 2rem;
        }
        
        .question {
            background: #fff;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        
        .question h3 {
            color: #2d3748;
            margin-bottom: 1rem;
            font-size: 1.1rem;
        }
        
        .options {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        .option {
            display: flex;
            align-items: center;
            padding: 0.75rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: white;
        }
        
        .option:hover {
            border-color: #667eea;
            background: #f7fafc;
        }
        
        .option input[type="radio"] {
            margin-right: 0.75rem;
            cursor: pointer;
        }
        
        .option.selected {
            border-color: #667eea;
            background: #ebf4ff;
        }
        
        .text-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s ease;
        }
        
        .text-input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .action-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
        }
        
        .btn {
            padding: 0.75rem 2rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .loading {
            text-align: center;
            color: #718096;
            font-style: italic;
        }
        
        .error {
            background: #fed7d7;
            color: #c53030;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 1rem;
        }
        
        @media (max-width: 640px) {
            .pet-details {
                grid-template-columns: 1fr;
            }
            
            .pet-detail {
                flex-direction: column;
                gap: 0.25rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${t.title}</h1>
        
        <div class="pet-info">
            <h3>${t.petInfo}</h3>
            <div class="pet-details">
                <div class="pet-detail">
                    <span>${language === 'de' ? 'Tierart:' : 'Animal:'}</span>
                    <strong>${initialData.tierart}</strong>
                </div>
                <div class="pet-detail">
                    <span>${language === 'de' ? 'Alter:' : 'Age:'}</span>
                    <strong>${initialData.alter}</strong>
                </div>
                <div class="pet-detail">
                    <span>${language === 'de' ? 'Name:' : 'Name:'}</span>
                    <strong>${initialData.name}</strong>
                </div>
                <div class="pet-detail">
                    <span>${language === 'de' ? 'Anlass:' : 'Reason:'}</span>
                    <strong>${initialData.anlass}</strong>
                </div>
            </div>
        </div>
        
        <div class="question-container">
            <div class="question">
                <h3>${t.question} 1:</h3>
                <p>${questionData.question}</p>
                
                <div style="margin-top: 1rem;">
                    ${questionData.type === 'multiple_choice' && questionData.options?.length 
                        ? `<div class="options">
                            ${questionData.options.map((option: string, index: number) => `
                                <label class="option" onclick="selectOption(this)">
                                    <input type="radio" name="answer" value="${option}">
                                    ${option}
                                </label>
                            `).join('')}
                           </div>`
                        : `<input type="text" class="text-input" placeholder="${language === 'de' ? 'Ihre Antwort...' : 'Your answer...'}" id="textAnswer">`
                    }
                </div>
            </div>
        </div>
        
        <div class="action-buttons">
            <button class="btn btn-primary" onclick="nextQuestion()" id="nextBtn">
                ${t.next}
            </button>
        </div>
        
        <div id="loading" class="loading" style="display: none;">
            ${t.loading}
        </div>
        
        <div id="error" class="error" style="display: none;">
            ${t.error}
        </div>
    </div>

    <script>
        let questionCount = 1;
        let answers = [];
        
        function selectOption(element) {
            // Remove selected class from all options
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Add selected class to clicked option
            element.classList.add('selected');
            
            // Check the radio button
            const radio = element.querySelector('input[type="radio"]');
            radio.checked = true;
        }
        
        async function nextQuestion() {
            const nextBtn = document.getElementById('nextBtn');
            const loading = document.getElementById('loading');
            const error = document.getElementById('error');
            
            // Get current answer
            let currentAnswer;
            const selectedRadio = document.querySelector('input[name="answer"]:checked');
            const textAnswer = document.getElementById('textAnswer');
            
            if (selectedRadio) {
                currentAnswer = selectedRadio.value;
            } else if (textAnswer) {
                currentAnswer = textAnswer.value.trim();
            }
            
            if (!currentAnswer) {
                alert('${language === 'de' ? 'Bitte beantworten Sie die Frage' : 'Please answer the question'}');
                return;
            }
            
            // Store answer
            answers.push(currentAnswer);
            
            // Show loading
            nextBtn.style.display = 'none';
            loading.style.display = 'block';
            error.style.display = 'none';
            
            try {
                // For demo purposes, we'll show a completion message after 3 questions
                if (questionCount >= 3) {
                    showCompletion();
                    return;
                }
                
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // For now, show completion after first question for demo
                showCompletion();
                
            } catch (err) {
                console.error('Error:', err);
                error.style.display = 'block';
                nextBtn.style.display = 'inline-block';
                loading.style.display = 'none';
            }
        }
        
        function showCompletion() {
            const container = document.querySelector('.container');
            const thankYou = '${language === 'de' ? 'Vielen Dank!' : 'Thank you!'}';
            const message = '${language === 'de' ? 'Ihre Angaben wurden erfasst. Ein Tierarzt wird sich mit Ihnen in Verbindung setzen.' : 'Your information has been recorded. A veterinarian will contact you.'}';
            const answersTitle = '${language === 'de' ? 'Ihre Antworten:' : 'Your answers:'}';
            const questionLabel = '${language === 'de' ? 'Frage' : 'Question'}';
            
            container.innerHTML = \`
                <h1>${t.title}</h1>
                <div style="text-align: center; padding: 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                    <h2 style="color: #2d3748; margin-bottom: 1rem;">
                        \${thankYou}
                    </h2>
                    <p style="color: #718096; margin-bottom: 2rem;">
                        \${message}
                    </p>
                    <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; text-align: left;">
                        <h3 style="margin-bottom: 0.5rem;">\${answersTitle}</h3>
                        \${answers.map((answer, index) => \`
                            <div style="margin-bottom: 0.5rem;">
                                <strong>\${questionLabel} \${index + 1}:</strong> \${answer}
                            </div>
                        \`).join('')}
                    </div>
                </div>
            \`;
        }
    </script>
</body>
</html>`;
}

// Main Edge Function handler
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Parse URL parameters
    const url = new URL(req.url);
    const tierart = url.searchParams.get('tierart');
    const alter = url.searchParams.get('alter');
    const name = url.searchParams.get('name');
    const anlass = url.searchParams.get('anlass');

    // Validate required parameters
    if (!tierart || !alter || !name || !anlass) {
      return new Response(
        `<!DOCTYPE html>
        <html><head><title>Missing Parameters</title><style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
        .error { background: #fee; border: 1px solid #fcc; padding: 1rem; border-radius: 0.5rem; }
        </style></head><body>
        <div class="error">
        <h1>🙅 Missing Parameters</h1>
        <p><strong>Required parameters:</strong> tierart, alter, name, anlass</p>
        <p><strong>Example:</strong> ?tierart=Dog&alter=2%20years&name=Buddy&anlass=limping</p>
        </div>
        </body></html>`,
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

    // Detect language from Accept-Language header
    const language = detectLanguage(req.headers.get('accept-language'));
    
    console.log(`🌍 Detected language: ${language}`);
    console.log(`📝 Processing: ${tierart}, ${alter}, ${name}, ${anlass}`);

    // Generate initial question using OpenAI
    const questionData = await generateQuestion(tierart, alter, name, anlass, language);
    
    console.log(`❓ Generated question:`, questionData);

    // Generate complete HTML page
    const initialData = { tierart, alter, name, anlass };
    const htmlContent = generateHTML(questionData, initialData, language);

    // Return HTML response
    return new Response(htmlContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('🚨 Edge Function Error:', error);

    const errorHtml = `<!DOCTYPE html>
    <html><head><title>Service Error</title><style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
    .error { background: #fee; border: 1px solid #fcc; padding: 2rem; border-radius: 0.5rem; text-align: center; }
    </style></head><body>
    <div class="error">
    <h1>⚠️ Service Error</h1>
    <p>The dynamic form service encountered an error.</p>
    <p><small>Error: ${error instanceof Error ? error.message : 'Unknown error'}</small></p>
    <p><small>Please try again in a few moments.</small></p>
    </div>
    </body></html>`;

    return new Response(errorHtml, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}); 