'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Bug, Clock, AlertCircle, CheckCircle, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { openaiDebugger, DebugLog } from '@/lib/openai-debugger';

export function OpenAIDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLogs(openaiDebugger.getLogs());
    
    const unsubscribe = openaiDebugger.onLogsChanged((newLogs) => {
      setLogs(newLogs);
    });

    return unsubscribe;
  }, []);

  const toggleLogExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearLogs = () => {
    openaiDebugger.clearLogs();
    setExpandedLogs(new Set());
  };

  const formatJson = (obj: any) => JSON.stringify(obj, null, 2);

  const getStatusColor = (log: DebugLog) => {
    if (log.error) return 'text-red-600';
    if (log.response) {
      if (log.response.status >= 200 && log.response.status < 300) return 'text-green-600';
      if (log.response.status >= 400) return 'text-red-600';
    }
    return 'text-yellow-600';
  };

  const getStatusIcon = (log: DebugLog) => {
    if (log.error) return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (log.response) {
      if (log.response.status >= 200 && log.response.status < 300) {
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      }
      if (log.response.status >= 400) {
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      }
    }
    return <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
      >
        {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        <Bug className="w-4 h-4" />
        <span className="text-sm font-medium">
          OpenAI Debug ({logs.length})
        </span>
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="mt-2 w-96 max-h-96 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Bug className="w-4 h-4" />
              OpenAI Requests ({logs.length})
            </h3>
            <div className="flex gap-1">
              <button
                onClick={clearLogs}
                className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Logs List */}
          <div className="max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No API requests yet
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="border-b border-gray-100 last:border-b-0">
                  {/* Log Header */}
                  <div
                    className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleLogExpanded(log.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getStatusIcon(log)}
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-mono ${getStatusColor(log)}`}>
                          {log.request.method} {log.request.url.split('/').pop()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.request.timestamp.toLocaleTimeString()}
                          {log.response && (
                            <span className="ml-2">
                              {log.response.duration}ms
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedLogs.has(log.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  {/* Log Details */}
                  {expandedLogs.has(log.id) && (
                    <div className="px-3 pb-3 text-xs">
                      {/* Request */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-700">Request</h4>
                          <button
                            onClick={() => copyToClipboard(formatJson(log.request.body))}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Copy request body"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                          {formatJson(log.request.body)}
                        </pre>
                      </div>

                      {/* Response or Error */}
                      {log.response && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-700">
                              Response ({log.response.status})
                            </h4>
                            <button
                              onClick={() => copyToClipboard(formatJson(log.response!.data))}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Copy response data"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
                            {formatJson(log.response.data)}
                          </pre>
                        </div>
                      )}

                      {log.error && (
                        <div className="mb-2">
                          <h4 className="font-semibold text-red-700 mb-1">Error</h4>
                          <div className="bg-red-50 text-red-700 p-2 rounded text-xs">
                            {log.error}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 