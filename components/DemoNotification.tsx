'use client';

import { X, Zap, CheckCircle } from 'lucide-react';

interface DemoNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

export function DemoNotification({ isVisible, onClose }: DemoNotificationProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg z-50 animate-slideIn">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Zap className="w-5 h-5 text-yellow-200" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">🎯 Multiple-Choice Demo aktiv!</h3>
          <p className="text-xs text-blue-100 mb-2">
            Erleben Sie die neuen effizienten Fragentypen:
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-200" />
              <span>Kategorisierte Fragen</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-200" />
              <span>Multiple-Choice Auswahl</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-200" />
              <span>80% weniger Fragen</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// CSS für Animation
const styles = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
`;

// Stelle sicher, dass die Styles hinzugefügt werden
if (typeof document !== 'undefined' && !document.getElementById('demo-notification-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'demo-notification-styles';
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
} 