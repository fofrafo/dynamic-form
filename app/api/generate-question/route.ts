import { NextRequest, NextResponse } from 'next/server';
import { generateQuestion } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📧 API Request received:', body);
    
    const response = await generateQuestion(body);
    
    console.log('📤 API Response:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('🚨 API Error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
} 