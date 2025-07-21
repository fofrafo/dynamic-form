'use client';

import { useState } from 'react';
import { InitialForm } from '@/components/InitialForm';
import { QuestionForm } from '@/components/QuestionForm';
import { CompletionView } from '@/components/CompletionView';
import { OpenAIDebugPanel } from '@/components/OpenAIDebugPanel';
import { FormState } from '@/types/form';
import { getTestSummary, clearLogs } from '@/lib/test-logger';

export default function HomePage() {
  const [formState, setFormState] = useState<FormState>({
    step: 'initial',
    answers: [],
    isLoading: false,
  });

  const handleFormStateUpdate = (updates: Partial<FormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormState({
      step: 'initial',
      answers: [],
      isLoading: false,
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div className="text-center" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Welcome to Intelligent Appointment Preparation
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
          Our AI assistant will ask you a few quick questions to optimally prepare 
          your veterinary appointment and determine the appropriate appointment duration.
        </p>
      </div>

      <div className="card">
        {/* Initial Form */}
        {formState.step === 'initial' && (
          <InitialForm
            onSubmit={handleFormStateUpdate}
            isLoading={formState.isLoading}
          />
        )}

        {/* Question Form */}
        {formState.step === 'questions' && formState.currentQuestion && 'question' in formState.currentQuestion && (
          <QuestionForm
            question={formState.currentQuestion}
            onAnswer={handleFormStateUpdate}
            answers={formState.answers}
            isLoading={formState.isLoading}
            initialData={formState.initialData}
          />
        )}

        {/* Completion View */}
        {formState.step === 'completed' && formState.currentQuestion && 'summary' in formState.currentQuestion && (
          <CompletionView
            summary={formState.currentQuestion.summary}
            goals={formState.currentQuestion.goals}
            onRestart={resetForm}
          />
        )}

        {/* Error State */}
        {formState.error && (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            backgroundColor: '#fef2f2',
            borderRadius: '0.5rem',
            border: '1px solid #fecaca'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#dc2626' }}>
              An Error Occurred
            </h3>
            <p style={{ color: '#7f1d1d', marginBottom: '1.5rem' }}>
              {formState.error}
            </p>
            <button
              onClick={resetForm}
              className="btn-primary"
              style={{ backgroundColor: '#dc2626' }}
            >
              Restart
            </button>
          </div>
        )}
      </div>

      {/* Logger Controls */}
      <div className="text-center mt-6 p-4 bg-gray-50 rounded-lg border">
        <h4 className="text-sm font-medium text-gray-700 mb-2">🔍 Test-Logging</h4>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => {
              const summary = getTestSummary();
              alert(`Test Summary:\n\nAPI Calls: ${summary.apiCalls}\nQuestions: ${summary.questions}\nErrors: ${summary.errors}\n\nDetails in console!`);
            }}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-xs font-medium"
          >
            📊 Summary
          </button>
          <button
            onClick={clearLogs}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-medium"
          >
            🗑️ Clear Logs
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Logging runs automatically • Open browser console (F12) for details
        </p>
      </div>

      {/* Footer Info */}
      <div className="text-center mt-4" style={{ fontSize: '0.875rem', color: '#666' }}>
        <p>
          🤖 <strong>GPT-4o-mini AI active:</strong> Intelligent, dynamic questions based on reason for visit!
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          ✅ Context-dependent options • ✅ Categorized selection • ✅ 93% fewer questions
        </p>
      </div>

      {/* OpenAI Debug Panel */}
      <OpenAIDebugPanel />
    </div>
  );
} 