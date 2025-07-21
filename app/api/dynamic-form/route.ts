import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://hayhcvdromexsuibenwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhheWhjdmRyb21leHN1aWJlbndoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyNDU0MDYsImV4cCI6MjA1NzgyMTQwNn0.fH4P1K_NcMPzDz7BSHq8B2sCImN8FAbAycK3VKJtkJk';

export async function GET(request: NextRequest) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const tierart = searchParams.get('tierart');
    const alter = searchParams.get('alter');
    const name = searchParams.get('name');
    const anlass = searchParams.get('anlass');

    // Validate required parameters
    if (!tierart || !alter || !name || !anlass) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html><head><title>Missing Parameters</title><style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
        .error { background: #fee; border: 1px solid #fcc; padding: 1rem; border-radius: 0.5rem; }
        .example { background: #f9f9f9; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; }
        code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 0.2rem; }
        </style></head><body>
        <div class="error">
        <h1>🙅 Missing Parameters</h1>
        <p><strong>Required parameters:</strong> tierart, alter, name, anlass</p>
        </div>
        <div class="example">
        <h3>📝 Example URLs:</h3>
        <p><strong>English:</strong><br>
        <code>/api/dynamic-form?tierart=Dog&alter=2%20years&name=Buddy&anlass=limping</code></p>
        <p><strong>German:</strong><br>
        <code>/api/dynamic-form?tierart=Hund&alter=2%20Jahre&name=Max&anlass=Lahmheit</code></p>
        </div>
        </body></html>`,
        { 
          status: 400, 
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

    // Build the Supabase Edge Function URL with parameters
    const edgeFunctionUrl = new URL(`${SUPABASE_URL}/functions/v1/dynamic-form`);
    edgeFunctionUrl.searchParams.set('tierart', tierart);
    edgeFunctionUrl.searchParams.set('alter', alter);
    edgeFunctionUrl.searchParams.set('name', name);
    edgeFunctionUrl.searchParams.set('anlass', anlass);

    console.log('🔗 Calling Supabase Edge Function:', edgeFunctionUrl.toString());

    // Call the Supabase Edge Function with proper authorization
    const response = await fetch(edgeFunctionUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept-Language': request.headers.get('accept-language') || 'en-US,en;q=0.9',
        'User-Agent': request.headers.get('user-agent') || 'Dynamic-Form-Wrapper',
      },
    });

    console.log('📡 Edge Function Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🚨 Edge Function Error:', response.status, errorText);
      
      return new NextResponse(
        `<!DOCTYPE html>
        <html><head><title>Service Error</title><style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
        .error { background: #fee; border: 1px solid #fcc; padding: 2rem; border-radius: 0.5rem; text-align: center; }
        </style></head><body>
        <div class="error">
        <h1>⚠️ Service Temporarily Unavailable</h1>
        <p>The dynamic form service is currently unavailable.</p>
        <p><small>Error ${response.status}: ${response.statusText}</small></p>
        <p><small>Please try again in a few moments.</small></p>
        </div>
        </body></html>`,
        { 
          status: 500, 
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

    // Get the HTML content from the edge function
    const htmlContent = await response.text();
    
    console.log('✅ Successfully received HTML content');

    // Return the HTML directly to the browser
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('🚨 Wrapper API Error:', error);
    
    return new NextResponse(
      `<!DOCTYPE html>
      <html><head><title>Unexpected Error</title><style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
      .error { background: #fee; border: 1px solid #fcc; padding: 2rem; border-radius: 0.5rem; text-align: center; }
      </style></head><body>
      <div class="error">
      <h1>⚠️ Unexpected Error</h1>
      <p><strong>Something went wrong:</strong></p>
      <p>${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
      <p><small>Please check your parameters and try again.</small></p>
      </div>
      </body></html>`,
      { 
        status: 500, 
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
} 