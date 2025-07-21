'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowRight, MessageCircle, Check } from 'lucide-react';
import { QuestionResponse, FormQA, FormState, ApiResponse } from '@/types/form';
import { generateQuestion } from '@/lib/api';
import { logUserAnswer, logQuestionAnalysis } from '@/lib/test-logger';

interface QuestionFormProps {
  question: ApiResponse;
  onAnswer: (updates: Partial<FormState>) => void;
  answers: FormQA[];
  isLoading: boolean;
  initialData?: any;
}

export function QuestionForm({ question, onAnswer, answers, isLoading, initialData }: QuestionFormProps) {
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [categorizedSelections, setCategorizedSelections] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Type guard to ensure we have a QuestionResponse
  if ('status' in question && question.status === 'completed') {
    return null; // This shouldn't happen, but just in case
  }

  const questionResponse = question as QuestionResponse;
  
  // Log question analysis when component loads
  useEffect(() => {
    logQuestionAnalysis(questionResponse);
  }, [questionResponse]);

  const handleSubmit = async (answer: string) => {
    if (!answer.trim()) return;

    setIsSubmitting(true);
    onAnswer({ isLoading: true });
    
    // Log user answer
    logUserAnswer(answer);

    const newQA: FormQA = {
      question: questionResponse.question,
      answer: answer.trim(),
    };

    const updatedAnswers = [...answers, newQA];

    try {
      const response = await generateQuestion({
        session_id: questionResponse.session_id,
        tierart: initialData?.tierart || '',
        alter: initialData?.alter || '',
        name: initialData?.name || '',
        anlass: initialData?.anlass || '',
        verlauf: updatedAnswers,
      });

      if ('status' in response && response.status === 'completed') {
        onAnswer({
          step: 'completed',
          currentQuestion: response,
          answers: updatedAnswers,
          isLoading: false,
        });
      } else {
        onAnswer({
          currentQuestion: response as QuestionResponse,
          answers: updatedAnswers,
          isLoading: false,
        });
      }
    } catch (error) {
      onAnswer({
        error: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        isLoading: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOptionClick = (option: string) => {
    if (isSubmitting) return;
    handleSubmit(option);
  };

  const handleMultipleChoiceToggle = (option: string) => {
    if (isSubmitting) return;
    setSelectedOptions(prev => {
      const newSelected = prev.includes(option)
        ? prev.filter(o => o !== option)
        : [...prev, option];
      
      // Check limits
      if (questionResponse.maxSelections && newSelected.length > questionResponse.maxSelections) {
        return prev; // Don't allow more than max
      }
      
      return newSelected;
    });
  };

  const handleCategorizedToggle = (category: string, option: string) => {
    if (isSubmitting) return;
    setCategorizedSelections(prev => {
      const categorySelections = prev[category] || [];
      const newSelections = categorySelections.includes(option)
        ? categorySelections.filter(o => o !== option)
        : [...categorySelections, option];
      
      return {
        ...prev,
        [category]: newSelections
      };
    });
  };

  const submitMultipleChoice = () => {
    if (selectedOptions.length === 0) return;
    if (questionResponse.minSelections && selectedOptions.length < questionResponse.minSelections) return;
    
    const answer = selectedOptions.join(', ');
    handleSubmit(answer);
  };

  const submitCategorizedChoice = () => {
    const allSelections = Object.entries(categorizedSelections)
      .filter(([, selections]) => selections.length > 0)
      .map(([category, selections]) => `${category}: ${selections.join(', ')}`)
      .join(' | ');
    
    if (!allSelections) return;
    handleSubmit(allSelections);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAnswer.trim() && !isSubmitting) {
      handleSubmit(currentAnswer);
    }
  };

  const canSubmitMultiple = selectedOptions.length > 0 && 
    (!questionResponse.minSelections || selectedOptions.length >= questionResponse.minSelections);

  const canSubmitCategorized = Object.values(categorizedSelections).some(selections => selections.length > 0);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
        <span>Frage {answers.length + 1}</span>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {Array.from({ length: Math.min(answers.length, 5) }).map((_, i) => (
              <div key={i} className="w-3 h-3 bg-secondary-400 rounded-full border-2 border-white" />
            ))}
          </div>
          {answers.length > 5 && (
            <span className="text-xs">+{answers.length - 5}</span>
          )}
        </div>
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">{questionResponse.emoji}</div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-3">
          {questionResponse.question}
        </h3>
        {questionResponse.reasoning && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm text-blue-700">
            <MessageCircle className="w-4 h-4" />
            {questionResponse.reasoning}
          </div>
        )}
      </div>

      {/* Answer Options */}
      <div className="space-y-4">
        {questionResponse.responseType === 'singleChoice' && questionResponse.options && (
          <div className="space-y-3">
            {questionResponse.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                disabled={isSubmitting}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-all duration-200 flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-medium">{option}</span>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
              </button>
            ))}
          </div>
        )}

        {questionResponse.responseType === 'multipleChoice' && questionResponse.options && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <strong>Mehrfachauswahl möglich:</strong> Wählen Sie alle zutreffenden Optionen aus
              {questionResponse.minSelections && (
                <span className="block mt-1">Mindestens {questionResponse.minSelections} Auswahl(en) erforderlich</span>
              )}
              {questionResponse.maxSelections && (
                <span className="block mt-1">Maximal {questionResponse.maxSelections} Auswahl(en) möglich</span>
              )}
            </div>
            
            <div className="space-y-2">
              {questionResponse.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleMultipleChoiceToggle(option)}
                  disabled={isSubmitting}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedOptions.includes(option)
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{option}</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedOptions.includes(option)
                      ? 'border-primary-400 bg-primary-400'
                      : 'border-gray-300'
                  }`}>
                    {selectedOptions.includes(option) && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={submitMultipleChoice}
              disabled={!canSubmitMultiple || isSubmitting}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Antworten werden verarbeitet...
                </>
              ) : (
                <>
                  <span>Auswahl bestätigen ({selectedOptions.length})</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {questionResponse.responseType === 'categorizedChoice' && questionResponse.categories && (
          <div className="space-y-6">
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <strong>Kategorisierte Auswahl:</strong> Wählen Sie aus den verschiedenen Kategorien alle zutreffenden Optionen aus.
              <br />
              <span className="text-blue-700 font-medium">💡 Nach der Auswahl unten auf "Auswahl bestätigen" klicken!</span>
            </div>
            
            {questionResponse.categories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <span className="text-2xl">{category.emoji}</span>
                  {category.title}
                </h4>
                
                <div className="space-y-2">
                  {category.options.map((option, optionIndex) => (
                    <button
                      key={optionIndex}
                      onClick={() => handleCategorizedToggle(category.title, option)}
                      disabled={isSubmitting}
                      className={`w-full p-3 text-left border-2 rounded-lg transition-all duration-200 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                        categorizedSelections[category.title]?.includes(option)
                          ? 'border-primary-400 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-200 hover:bg-gray-50'
                      }`}
                    >
                      <span>{option}</span>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        categorizedSelections[category.title]?.includes(option)
                          ? 'border-primary-400 bg-primary-400'
                          : 'border-gray-300'
                      }`}>
                        {categorizedSelections[category.title]?.includes(option) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={submitCategorizedChoice}
              disabled={!canSubmitCategorized || isSubmitting}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Antworten werden verarbeitet...
                </>
              ) : (
                <>
                  <span>✅ Auswahl bestätigen ({Object.values(categorizedSelections).flat().length} ausgewählt)</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {questionResponse.responseType === 'text' && (
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Ihre Antwort..."
              rows={4}
              className="form-input resize-none"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={!currentAnswer.trim() || isSubmitting}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Antwort wird verarbeitet...
                </>
              ) : (
                <>
                  <span>Antwort senden</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Loading State */}
      {(isSubmitting || isLoading) && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border">
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            <span className="text-sm text-gray-600">
              KI analysiert Ihre Antwort und bereitet die nächste Frage vor...
            </span>
          </div>
        </div>
      )}

      {/* Previous Questions */}
      {answers.length > 0 && (
        <details className="mt-8 p-4 bg-gray-50 rounded-lg">
          <summary className="font-medium text-gray-700 cursor-pointer hover:text-gray-900">
            Bisherige Antworten ({answers.length})
          </summary>
          <div className="mt-4 space-y-3">
            {answers.map((qa, index) => (
              <div key={index} className="p-3 bg-white rounded border">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {qa.question}
                </p>
                <p className="text-sm text-gray-600">
                  {qa.answer}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
} 