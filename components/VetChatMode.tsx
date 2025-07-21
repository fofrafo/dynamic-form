'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Loader2, Stethoscope, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { FormQA, InitialFormData } from '@/types/form';

interface VetChatModeProps {
  initialData: InitialFormData;
  formAnswers: FormQA[];
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function VetChatMode({ initialData, formAnswers, onBack }: VetChatModeProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!hasInitialized) {
      // Begrüßungsnachricht mit Kontext
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: `Hallo! 👋 Ich bin Dr. KI, Ihr virtueller Tierarzt-Assistent. 

Ich habe Ihre Terminanfrage für **${initialData.name}** (${initialData.tierart}, ${initialData.alter}) bezüglich "${initialData.anlass}" bereits gesehen.

Basierend auf Ihren bisherigen Antworten kann ich Ihnen jetzt:
• 🩺 Spezifische Sofort-Tipps geben  
• ❓ Ihre Fragen zum Zustand Ihres Tieres beantworten
• 🚨 Warnsignale erklären, auf die Sie achten sollten
• 📋 Empfehlungen für die Zeit bis zum Termin geben

**Wichtig:** Ich ersetze keinen echten Tierarztbesuch, kann Ihnen aber fundierte Hilfestellungen geben!

Wie kann ich Ihnen helfen? 🐾`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      setHasInitialized(true);
    }
  }, [hasInitialized, initialData, formAnswers]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user', 
      content: currentMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // API Call für KI-Tierarzt Chat
      const response = await fetch('/api/vet-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: {
            tierart: initialData.tierart,
            alter: initialData.alter,
            name: initialData.name,
            anlass: initialData.anlass,
            formAnswers: formAnswers,
            chatHistory: messages.slice(-6) // Letzten 6 Nachrichten für Kontext
          }
        })
      });

      if (!response.ok) {
        throw new Error('Chat API error');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '_assistant',
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '_error',
        type: 'assistant', 
        content: '⚠️ Entschuldigung, es gab ein technisches Problem. Bitte versuchen Sie es erneut oder kontaktieren Sie direkt die Praxis.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header - Fixed */}
      <div className="bg-green-600 text-white p-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={onBack}
          className="p-2 hover:bg-green-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Dr. KI - Tierarzt-Assistent</h2>
            <p className="text-xs text-green-100">
              Chat zu {initialData.name} ({initialData.tierart})
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container - Scrollable */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-green-600 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                  {message.type === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        // Custom components for better chat styling
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">{children}</code>,
                        h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-sm font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-green-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-2xl rounded-bl-md flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                <span className="text-sm">Dr. KI tippt...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t bg-white p-3">
        {/* Warning - Compact */}
        <div className="mb-2 px-3 py-1 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-orange-700 text-xs">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span>Ersetzt keinen Tierarztbesuch • Bei Notfällen sofort Praxis/Notdienst kontaktieren</span>
          </div>
        </div>
        
        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Häufige Fragen:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentMessage("Was soll ich bis zum Termin beachten?")}
                className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs hover:bg-green-100 transition-colors"
              >
                📋 Verhalten bis Termin
              </button>
              <button
                onClick={() => setCurrentMessage("Ist das ein Notfall?")}
                className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs hover:bg-orange-100 transition-colors"
              >
                🚨 Notfall?
              </button>
              <button
                onClick={() => setCurrentMessage("Was kann ich zur Linderung tun?")}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs hover:bg-blue-100 transition-colors"
              >
                💊 Erste Hilfe
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Fragen Sie Dr. KI alles über Ihr Tier..."
              className="w-full p-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              rows={Math.min(4, Math.max(1, currentMessage.split('\n').length))}
              disabled={isLoading}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isLoading}
            className="w-11 h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
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