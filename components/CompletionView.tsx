'use client';

import { CheckCircle, Clock, Phone, UserCheck, RotateCcw, AlertTriangle, HelpCircle } from 'lucide-react';

interface CompletionViewProps {
  summary: string;
  goals?: {
    terminDauer: "15min" | "30min";
    rueckrufNoetig: boolean;
    bestaetigungNoetig: boolean;
  };
  onRestart: () => void;
}

const IMMEDIATE_TIPS = {
  vomiting: [
    "💧 Continue offering water, but only in small amounts",
    "🍽️ Fast for 12-24 hours",
    "🚫 Don't force feed",
    "👀 Monitor general condition"
  ],
  diarrhea: [
    "💧 Provide adequate fluids",
    "🍚 Bland diet (rice with chicken) in small portions",
    "🚫 Avoid dairy products and fatty foods",
    "🧼 Pay attention to hygiene when cleaning"
  ],
  limping: [
    "🛌 Rest and limited movement",
    "❄️ For swelling: Cool (max. 15min)",
    "🚫 No human pain medication",
    "📏 Keep walks short"
  ],
  routine: [
    "📄 Bring vaccination record",
    "📝 Prepare list of questions",
    "🍽️ Feed normally before appointment",
    "😌 Keep pet calm and don't stress"
  ],
  general: [
    "😌 Keep pet calm and stay relaxed",
    "📞 Call immediately if symptoms worsen",
    "📄 Have vaccination records and medication list ready",
    "🚗 Secure transport carrier for the journey"
  ]
};

function getImmediateTips(summary: string): string[] {
  const summaryLower = summary.toLowerCase();
  
  if (summaryLower.includes('vomit') || summaryLower.includes('throw up')) {
    return IMMEDIATE_TIPS.vomiting;
  }
  if (summaryLower.includes('diarrhea') || summaryLower.includes('loose stool')) {
    return IMMEDIATE_TIPS.diarrhea;
  }
  if (summaryLower.includes('limp') || summaryLower.includes('lame') || summaryLower.includes('hobble')) {
    return IMMEDIATE_TIPS.limping;
  }
  if (summaryLower.includes('routine') || summaryLower.includes('checkup') || summaryLower.includes('wellness')) {
    return IMMEDIATE_TIPS.routine;
  }
  
  return IMMEDIATE_TIPS.general;
}

export function CompletionView({ summary, goals, onRestart }: CompletionViewProps) {
  const immediateTips = getImmediateTips(summary);

  return (
    <div className="text-center">
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Perfect! All Done ✅
      </h2>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
        <h3 className="font-semibold text-gray-800 mb-3 text-center">📋 Summary of Your Information:</h3>
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
          {summary}
        </div>
      </div>

      {/* Immediate Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
        <h4 className="font-semibold text-blue-800 mb-4 flex items-center justify-center gap-2">
          💡 Immediate Tips for You
        </h4>
        <ul className="space-y-2">
          {immediateTips.map((tip, index) => (
            <li key={index} className="text-blue-700 flex items-start gap-2">
              <span className="text-blue-500 font-bold">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Goals & Duration */}
      {goals && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-green-800 mb-4 text-center">🎯 Your Appointment Details:</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center justify-center gap-2 text-green-700 font-medium mb-2">
                <Clock className="w-4 h-4" />
                Duration
              </div>
              <p className="text-green-800 font-bold text-center">
                {goals.terminDauer === '30min' ? '⏰ 30 Minutes' : '⚡ 15 Minutes'}
              </p>
              <p className="text-xs text-green-600 text-center mt-1">
                {goals.terminDauer === '30min' 
                  ? 'Comprehensive examination' 
                  : 'Standard examination'
                }
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center justify-center gap-2 text-green-700 font-medium mb-2">
                <Phone className="w-4 h-4" />
                Callback
              </div>
              <p className="text-green-800 font-bold text-center">
                {goals.rueckrufNoetig ? '📞 Yes, planned' : '✅ Not needed'}
              </p>
              <p className="text-xs text-green-600 text-center mt-1">
                {goals.rueckrufNoetig 
                  ? 'We will contact you' 
                  : 'Come directly to appointment'
                }
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <div className="flex items-center justify-center gap-2 text-green-700 font-medium mb-2">
                <UserCheck className="w-4 h-4" />
                Confirmation
              </div>
              <p className="text-green-800 font-bold text-center">
                {goals.bestaetigungNoetig ? '📋 Manual' : '✅ Automatic'}
              </p>
              <p className="text-xs text-green-600 text-center mt-1">
                {goals.bestaetigungNoetig 
                  ? 'Manual review required' 
                  : 'Appointment is confirmed'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning for critical symptoms */}
      {goals?.rueckrufNoetig && (
        <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-orange-800 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Important Notice:</span>
          </div>
          <p className="text-orange-700 text-sm">
            If symptoms worsen, contact us immediately or visit the emergency service.
          </p>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center justify-center gap-2">
          <HelpCircle className="w-5 h-5" />
          📋 Next Steps
        </h4>
        <div className="text-left space-y-2 text-blue-700">
          <p>✅ Your appointment request has been automatically processed</p>
          <p>📱 You will receive an SMS confirmation with all details</p>
          <p>📧 An email confirmation will follow in a few minutes</p>
          <p>📞 For questions, reach us at: <strong>0800 VETERINARY</strong></p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-blue-600 text-sm font-medium">
            🏥 <strong>Clinic Address:</strong> Sample Street 123, 12345 Sample City
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Request New Appointment
        </button>
        <button className="btn-primary">
          📧 Receive Email Confirmation
        </button>
      </div>

      {/* Footer Note */}
      <p className="text-sm text-gray-500 mt-8">
        🔒 Your data has been securely transmitted and will be handled confidentially
      </p>
    </div>
  );
} 