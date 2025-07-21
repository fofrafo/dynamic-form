'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Stethoscope, Check, User, Bot, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FormState, FormQA, ApiResponse, QuestionResponse, InitialFormData } from '@/types/form';
import { generateQuestion } from '@/lib/api';
import { logUserAnswer, logQuestionAnalysis } from '@/lib/test-logger';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot' | 'form' | 'system';
  content: string;
  timestamp: Date;
  formData?: any;
}

interface ChatFormInterfaceProps {
  onComplete: (summary: string, goals: any) => void;
}

export function ChatFormInterface({ onComplete }: ChatFormInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    step: 'initial',
    answers: [],
    isLoading: false,
  });
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [categorizedSelections, setCategorizedSelections] = useState<Record<string, string[]>>({});
  const [showFormOptions, setShowFormOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Begrüßungsnachricht
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'bot',
      content: `Hallo! 👋 Ich bin Dr. KI, Ihr Tierarzt-Assistent.\n\n**Ich helfe Ihnen bei der optimalen Terminvorbereitung.**\n\nBitte füllen Sie zunächst die Grunddaten aus:`,
      timestamp: new Date()
    };
    
    // Initial-Formular als Chat-Nachricht
    const formMessage: ChatMessage = {
      id: 'initial-form',
      type: 'form',
      content: 'Grunddaten Ihres Tieres',
      timestamp: new Date(),
      formData: {
        type: 'initial-form'
      }
    };
    
    setMessages([welcomeMessage, formMessage]);
    setShowFormOptions(true);
  }, []);

  // Initial form state
  const [initialFormData, setInitialFormData] = useState<Partial<InitialFormData>>({});
  
  const handleInitialFormSubmit = async () => {
    const { tierart, alter, name, anlass } = initialFormData;
    
    if (!tierart || !alter || !name || !anlass) {
      return; // Validierung - alle Felder erforderlich
    }
    
    const completeData = initialFormData as InitialFormData;
    
    // Setze den FormState
    setFormState(prev => ({
      ...prev,
      step: 'questions',
      initialData: completeData
    }));
    
    // User-Nachricht mit den eingegebenen Daten
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `**${name}** (${tierart}, ${alter})\n**Grund:** ${anlass}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setShowFormOptions(false);
    setIsLoading(true);
    
    try {
      const response = await generateQuestion(completeData);
      if ('session_id' in response) {
        const questionResponse = response as QuestionResponse;
        setCurrentQuestion(questionResponse);
        
        const confirmMessage: ChatMessage = {
          id: Date.now().toString() + '_confirm',
          type: 'bot',
          content: `Perfect! Lassen Sie uns mit den Details für **${name}** beginnen:`,
          timestamp: new Date()
        };
        
        const questionMessage: ChatMessage = {
          id: Date.now().toString() + '_question',
          type: 'form',
          content: questionResponse.question,
          timestamp: new Date(),
          formData: questionResponse
        };
        
        setMessages(prev => [...prev, confirmMessage, questionMessage]);
        setShowFormOptions(true);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '_error',
        type: 'bot',
        content: '⚠️ Entschuldigung, es gab ein Problem. Bitte versuchen Sie es erneut.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSelection = (type: 'single' | 'multiple' | 'categorized', value: string, category?: string) => {
    if (type === 'single') {
      // Sofort senden bei Single Choice
      handleQuestionSubmit(value);
    } else if (type === 'multiple') {
      setSelectedOptions(prev => 
        prev.includes(value) 
          ? prev.filter(v => v !== value)
          : [...prev, value]
      );
    } else if (type === 'categorized' && category) {
      setCategorizedSelections(prev => {
        const categorySelections = prev[category] || [];
        const newSelections = categorySelections.includes(value)
          ? categorySelections.filter(v => v !== value)
          : [...categorySelections, value];
        
        return { ...prev, [category]: newSelections };
      });
    }
  };

  const handleQuestionSubmit = async (answer: string) => {
    if (!currentQuestion || !formState.initialData) return;
    
    setIsLoading(true);
    logUserAnswer(answer);

    const newQA: FormQA = {
      question: currentQuestion.question,
      answer: answer.trim(),
    };

    const updatedAnswers = [...formState.answers, newQA];

    try {
      const response = await generateQuestion({
        session_id: currentQuestion.session_id,
        tierart: formState.initialData.tierart || '',
        alter: formState.initialData.alter || '',
        name: formState.initialData.name || '',
        anlass: formState.initialData.anlass || '',
        verlauf: updatedAnswers,
      });

      if ('status' in response && response.status === 'completed') {
        // Chat beendet
        const completionMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'bot',
          content: `✅ **Terminvorbereitung abgeschlossen!**\n\n${response.summary}\n\n**Nächste Schritte:**\n• Sie erhalten eine Bestätigungs-E-Mail\n• Bringen Sie den Impfpass mit\n• Bei Fragen können Sie gerne chatten`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completionMessage]);
        setCurrentQuestion(null);
        setShowFormOptions(false);
        onComplete(response.summary, response.goals);
      } else {
        // Nächste Frage
        const questionResponse = response as QuestionResponse;
        setCurrentQuestion(questionResponse);
        setFormState(prev => ({ ...prev, answers: updatedAnswers }));
        
        const questionMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'form',
          content: questionResponse.question,
          timestamp: new Date(),
          formData: questionResponse
        };
        setMessages(prev => [...prev, questionMessage]);
        setShowFormOptions(true);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        content: '⚠️ Entschuldigung, es gab ein technisches Problem. Bitte versuchen Sie es erneut.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedOptions([]);
      setCategorizedSelections({});
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = currentMessage.trim();
    setCurrentMessage('');

    if (currentQuestion) {
      // Wir sind in einer Frage - behandle als freie Antwort
      handleQuestionSubmit(messageContent);
    }
  };

  const submitMultipleChoice = () => {
    if (selectedOptions.length === 0) return;
    const answer = selectedOptions.join(', ');
    handleQuestionSubmit(answer);
  };

  const submitCategorizedChoice = () => {
    const allSelections = Object.entries(categorizedSelections)
      .filter(([, selections]) => selections.length > 0)
      .map(([category, selections]) => `${category}: ${selections.join(', ')}`)
      .join(' | ');
    
    if (!allSelections) return;
    handleQuestionSubmit(allSelections);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col max-w-md mx-auto border-x border-slate-200">
      {/* Header */}
      <div className="bg-blue-100 border-b border-blue-200 p-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
          <Stethoscope className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h2 className="font-semibold text-blue-900 text-sm">Dr. KI Assistent</h2>
          <p className="text-xs text-blue-700">Terminvorbereitung</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex items-start gap-2 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-blue-500' 
                  : message.type === 'form'
                  ? 'bg-purple-100'
                  : 'bg-blue-100'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : message.type === 'form' ? (
                  <Plus className="w-4 h-4 text-purple-600" />
                ) : (
                  <Bot className="w-4 h-4 text-blue-600" />
                )}
              </div>
              
              {/* Message Content */}
              <div className={`px-3 py-2 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : message.type === 'form'
                  ? 'bg-purple-50 text-purple-900 rounded-bl-md border border-purple-200'
                  : 'bg-white text-slate-800 rounded-bl-md border border-slate-200'
              }`}>
                <div className="text-sm leading-relaxed">
                  {message.type === 'user' ? (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
                
                {/* Form Options */}
                {message.type === 'form' && message.formData && showFormOptions && (
                  <div className="mt-3 space-y-3">
                    {/* Initial Form */}
                    {message.formData.type === 'initial-form' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-purple-700">Tierart</label>
                          <select
                            value={initialFormData.tierart || ''}
                            onChange={(e) => setInitialFormData(prev => ({ ...prev, tierart: e.target.value }))}
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                          >
                            <option value="">Bitte wählen...</option>
                            <option value="Hund">Hund</option>
                            <option value="Katze">Katze</option>
                            <option value="Kaninchen">Kaninchen</option>
                            <option value="Hamster">Hamster</option>
                            <option value="Meerschweinchen">Meerschweinchen</option>
                            <option value="Vogel">Vogel</option>
                            <option value="Reptil">Reptil</option>
                            <option value="Fisch">Fisch</option>
                            <option value="Sonstiges">Sonstiges</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-purple-700">Name Ihres Tieres</label>
                          <input
                            type="text"
                            value={initialFormData.name || ''}
                            onChange={(e) => setInitialFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="z.B. Max, Luna, Bello..."
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-purple-700">Alter</label>
                          <input
                            type="text"
                            value={initialFormData.alter || ''}
                            onChange={(e) => setInitialFormData(prev => ({ ...prev, alter: e.target.value }))}
                            placeholder="z.B. 3 Jahre, 6 Monate, 2 Wochen..."
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-purple-700">Grund für den Besuch</label>
                          <input
                            type="text"
                            value={initialFormData.anlass || ''}
                            onChange={(e) => setInitialFormData(prev => ({ ...prev, anlass: e.target.value }))}
                            placeholder="z.B. Impfung, Kontrolle, Erbrechen, Husten..."
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                          />
                        </div>
                        
                        <button
                          onClick={handleInitialFormSubmit}
                          disabled={!initialFormData.tierart || !initialFormData.name || !initialFormData.alter || !initialFormData.anlass || isLoading}
                          className="w-full mt-3 p-3 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Terminvorbereitung starten
                        </button>
                      </div>
                    )}

                    {message.formData.responseType === 'singleChoice' && message.formData.options && (
                      <div className="space-y-2">
                        {message.formData.options.map((option: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => handleFormSelection('single', option)}
                            className="w-full p-2 text-left bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                            disabled={isLoading}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}

                    {message.formData.responseType === 'multipleChoice' && message.formData.options && (
                      <div className="space-y-2">
                        <p className="text-xs text-purple-600 mb-2">Mehrfachauswahl möglich:</p>
                        {message.formData.options.map((option: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => handleFormSelection('multiple', option)}
                            className={`w-full p-2 text-left border rounded-lg transition-colors text-sm flex items-center justify-between ${
                              selectedOptions.includes(option)
                                ? 'bg-blue-100 border-blue-300'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                            disabled={isLoading}
                          >
                            <span>{option}</span>
                            {selectedOptions.includes(option) && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                        ))}
                        {selectedOptions.length > 0 && (
                          <button
                            onClick={submitMultipleChoice}
                            className="w-full mt-2 p-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                            disabled={isLoading}
                          >
                            Auswahl bestätigen ({selectedOptions.length})
                          </button>
                        )}
                      </div>
                    )}

                    {message.formData.responseType === 'categorizedChoice' && message.formData.categories && (
                      <div className="space-y-3">
                        <p className="text-xs text-purple-600 mb-2">Wählen Sie aus den Kategorien:</p>
                        {message.formData.categories.map((category: any, categoryIndex: number) => (
                          <div key={categoryIndex} className="border border-slate-200 rounded-lg p-2 bg-white">
                            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                              <span>{category.emoji}</span>
                              {category.title}
                            </h4>
                            <div className="space-y-1">
                              {category.options.map((option: string, optionIndex: number) => (
                                <button
                                  key={optionIndex}
                                  onClick={() => handleFormSelection('categorized', option, category.title)}
                                  className={`w-full p-2 text-left border rounded text-xs transition-colors flex items-center justify-between ${
                                    categorizedSelections[category.title]?.includes(option)
                                      ? 'bg-blue-100 border-blue-300'
                                      : 'border-slate-200 hover:bg-slate-50'
                                  }`}
                                  disabled={isLoading}
                                >
                                  <span>{option}</span>
                                  {categorizedSelections[category.title]?.includes(option) && (
                                    <Check className="w-3 h-3 text-blue-600" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        {Object.values(categorizedSelections).some(selections => selections.length > 0) && (
                          <button
                            onClick={submitCategorizedChoice}
                            className="w-full mt-2 p-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                            disabled={isLoading}
                          >
                            Auswahl bestätigen ({Object.values(categorizedSelections).flat().length} ausgewählt)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-bl-md flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-slate-600">Dr. KI tippt...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-3">
        {currentQuestion && (
          <div className="mb-2 text-xs text-slate-500 text-center">
            Sie können auch frei antworten anstatt die Optionen zu wählen
          </div>
        )}
        
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                currentQuestion
                  ? "Ihre Antwort oder weitere Details..."
                  : "Schreiben Sie eine Nachricht..."
              }
              className="w-full p-3 border border-slate-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
              rows={Math.min(3, Math.max(1, currentMessage.split('\n').length))}
              disabled={isLoading}
              style={{ minHeight: '44px', maxHeight: '100px' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="w-11 h-11 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}