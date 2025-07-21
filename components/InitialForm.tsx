'use client';

import { useState } from 'react';
import { ChevronDown, Loader2, PawPrint, Shuffle, Zap } from 'lucide-react';
import { InitialFormData, TIERARTEN, FormState } from '@/types/form';
import { generateQuestion } from '@/lib/api';
import { generateTestData, TEST_SZENARIEN } from '@/lib/test-data-generator';
import { logTestStart, logFormSubmit } from '@/lib/test-logger';

interface InitialFormProps {
  onSubmit: (updates: Partial<FormState>) => void;
  isLoading: boolean;
}

export function InitialForm({ onSubmit, isLoading }: InitialFormProps) {
  const [formData, setFormData] = useState<InitialFormData>({
    tierart: '',
    alter: '',
    name: '',
    anlass: '',
  });

  const [errors, setErrors] = useState<Partial<InitialFormData>>({});

  const handleInputChange = (field: keyof InitialFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const fillTestData = (data?: InitialFormData) => {
    const testData = data || generateTestData();
    setFormData(testData);
    setErrors({});
    logTestStart(testData);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<InitialFormData> = {};
    
    if (!formData.tierart) newErrors.tierart = 'Please select an animal type';
    if (!formData.alter.trim()) newErrors.alter = 'Please provide the age';
    if (!formData.name.trim()) newErrors.name = 'Please enter the name';
    if (!formData.anlass.trim()) newErrors.anlass = 'Please describe the reason for the visit';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSubmit({ isLoading: true });
    
    // Logging
    logFormSubmit(formData);

    try {
      const response = await generateQuestion(formData);
      
      if ('status' in response && response.status === 'completed') {
        onSubmit({
          step: 'completed',
          sessionId: response.session_id,
          currentQuestion: response,
          initialData: formData,
          isLoading: false,
        });
      } else {
        onSubmit({
          step: 'questions',
          sessionId: response.session_id,
          currentQuestion: response,
          initialData: formData,
          isLoading: false,
        });
      }
    } catch (error) {
      onSubmit({
        error: error instanceof Error ? error.message : 'An error occurred',
        isLoading: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PawPrint className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">
          Tell us about your pet
        </h3>
        <p className="text-gray-600">
          This information helps us ask relevant questions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Tierart */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Animal type *
            </label>
            <div className="relative">
              <select
                className={`form-select appearance-none pr-10 ${errors.tierart ? 'border-red-300 focus:ring-red-500' : ''}`}
                value={formData.tierart}
                onChange={(e) => handleInputChange('tierart', e.target.value)}
              >
                <option value="">Please select...</option>
                {TIERARTEN.map(tier => (
                  <option key={tier} value={tier}>{tier}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.tierart && (
              <p className="mt-1 text-sm text-red-600">{errors.tierart}</p>
            )}
          </div>

          {/* Alter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age *
            </label>
            <input
              type="text"
              className={`form-input ${errors.alter ? 'border-red-300 focus:ring-red-500' : ''}`}
              placeholder="e.g. 3 years, 6 months"
              value={formData.alter}
              onChange={(e) => handleInputChange('alter', e.target.value)}
            />
            {errors.alter && (
              <p className="mt-1 text-sm text-red-600">{errors.alter}</p>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pet name *
          </label>
          <input
            type="text"
            className={`form-input ${errors.name ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="e.g. Clifford, Luna, Bello"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Anlass */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for veterinary visit *
          </label>
          <textarea
            rows={4}
            className={`form-input resize-none ${errors.anlass ? 'border-red-300 focus:ring-red-500' : ''}`}
            placeholder="Briefly describe the reason for the visit, e.g. vaccination for travel to Spain, limping since yesterday, routine examination..."
            value={formData.anlass}
            onChange={(e) => handleInputChange('anlass', e.target.value)}
          />
          {errors.anlass && (
            <p className="mt-1 text-sm text-red-600">{errors.anlass}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI is analyzing your information...
            </>
          ) : (
            <>
              <span>🤖</span>
              Start Questionnaire
            </>
          )}
        </button>
      </form>

      {/* Test Data Buttons */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          Quick test with AI-generated data:
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => fillTestData()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-colors text-sm font-medium"
          >
            <Shuffle className="w-4 h-4" />
            Random Test Data
          </button>
          
          <button
            onClick={() => fillTestData(TEST_SZENARIEN.notfall)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors text-sm font-medium"
          >
            🚨 Emergency Scenario
          </button>
          
          <button
            onClick={() => fillTestData(TEST_SZENARIEN.routine)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition-colors text-sm font-medium"
          >
            ✅ Routine Check
          </button>
          
          <button
            onClick={() => fillTestData(TEST_SZENARIEN.magenDarm)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg transition-colors text-sm font-medium"
          >
            🤒 Stomach Issue
          </button>
        </div>
        
        <p className="text-xs text-gray-500 text-center">
          These buttons automatically fill the form with realistic test data for quick AI testing
        </p>
      </div>

      <p className="text-sm text-gray-500 text-center">
        * Required fields • Your data is processed securely
      </p>
    </div>
  );
} 