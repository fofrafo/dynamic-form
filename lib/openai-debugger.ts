interface OpenAIRequest {
  id: string;
  timestamp: Date;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: any;
}

interface OpenAIResponse {
  id: string;
  timestamp: Date;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
}

interface DebugLog {
  id: string;
  request: OpenAIRequest;
  response?: OpenAIResponse;
  error?: string;
}

class OpenAIDebugger {
  private logs: DebugLog[] = [];
  private listeners: Array<(logs: DebugLog[]) => void> = [];

  logRequest(url: string, method: string, headers: Record<string, string>, body: any): string {
    const id = crypto.randomUUID();
    const request: OpenAIRequest = {
      id,
      timestamp: new Date(),
      url,
      method,
      headers,
      body: this.sanitizeBody(body)
    };

    const log: DebugLog = {
      id,
      request,
    };

    this.logs.unshift(log);
    this.notifyListeners();
    
    console.log('🔍 [OpenAI Debugger] Request:', {
      id,
      url,
      method,
      body: this.sanitizeBody(body)
    });

    return id;
  }

  logResponse(id: string, status: number, statusText: string, headers: Record<string, string>, data: any, duration: number): void {
    const log = this.logs.find(l => l.id === id);
    if (log) {
      log.response = {
        id,
        timestamp: new Date(),
        status,
        statusText,
        headers,
        data: this.sanitizeResponse(data),
        duration
      };
    }
    
    console.log('🔍 [OpenAI Debugger] Response:', {
      id,
      status,
      statusText,
      duration: `${duration}ms`,
      data: this.sanitizeResponse(data)
    });

    this.notifyListeners();
  }

  logError(id: string, error: string): void {
    const log = this.logs.find(l => l.id === id);
    if (log) {
      log.error = error;
    }
    
    console.log('🔍 [OpenAI Debugger] Error:', { id, error });
    this.notifyListeners();
  }

  getLogs(): DebugLog[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }

  onLogsChanged(callback: (logs: DebugLog[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  private sanitizeBody(body: any): any {
    if (typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        return this.sanitizeObject(parsed);
      } catch {
        return body;
      }
    }
    return this.sanitizeObject(body);
  }

  private sanitizeResponse(data: any): any {
    return this.sanitizeObject(data);
  }

  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = { ...obj };
    
    // Hide sensitive fields
    if (sanitized.api_key) sanitized.api_key = '[REDACTED]';
    if (sanitized.authorization) sanitized.authorization = '[REDACTED]';
    
    return sanitized;
  }
}

export const openaiDebugger = new OpenAIDebugger();
export type { DebugLog, OpenAIRequest, OpenAIResponse }; 