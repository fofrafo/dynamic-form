interface TestLog {
  timestamp: string;
  phase: string;
  data: any;
  type: 'info' | 'success' | 'error' | 'warning';
}

class TestLogger {
  private logs: TestLog[] = [];
  private isEnabled = true;

  log(phase: string, data: any, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    if (!this.isEnabled) return;

    const logEntry: TestLog = {
      timestamp: new Date().toISOString(),
      phase,
      data,
      type
    };

    this.logs.push(logEntry);
    
    // Console logging mit Emojis
    const emoji = {
      info: '📋',
      success: '✅', 
      error: '❌',
      warning: '⚠️'
    }[type];

    console.log(`${emoji} [${phase}]`, data);
    
    // Strukturiertes Logging für Edge Function Aufrufe
    if (phase === 'API_REQUEST' || phase === 'API_RESPONSE') {
      console.group(`🔍 ${phase} Details (GPT-4o-mini):`);
      console.log(JSON.stringify(data, null, 2));
      console.groupEnd();
    }
  }

  logTestStart(testData: any) {
    this.log('TEST_START', {
      scenario: 'User Test',
      testData,
      timestamp: new Date().toISOString()
    }, 'info');
  }

  logFormSubmit(formData: any) {
    this.log('FORM_SUBMIT', {
      tierart: formData.tierart,
      anlass: formData.anlass,
      characters: formData.anlass?.length || 0
    }, 'info');
  }

  logApiRequest(requestData: any) {
    this.log('API_REQUEST', {
      url: 'Edge Function',
      method: 'POST',
      hasSessionId: !!requestData.session_id,
      hasVerlauf: !!requestData.verlauf?.length,
      verlaufLength: requestData.verlauf?.length || 0,
      fields: Object.keys(requestData)
    }, 'info');
  }

  logApiResponse(response: any, duration?: number) {
    const isCompletion = 'status' in response && response.status === 'completed';
    const isQuestion = 'question' in response;
    
    this.log('API_RESPONSE', {
      type: isCompletion ? 'COMPLETION' : 'QUESTION',
      duration: duration ? `${duration}ms` : 'unknown',
      hasCategories: isQuestion && !!response.categories,
      categoryCount: isQuestion ? response.categories?.length || 0 : 0,
      questionType: isQuestion ? response.responseType : null,
      summary: isCompletion ? response.summary?.substring(0, 100) + '...' : null
    }, 'success');
  }

  logError(phase: string, error: any) {
    this.log('ERROR', {
      phase,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null
    }, 'error');
  }

  logQuestionAnalysis(question: any) {
    if (question.categories) {
      this.log('QUESTION_ANALYSIS', {
        responseType: question.responseType,
        categoriesCount: question.categories.length,
        categories: question.categories.map((cat: any) => ({
          title: cat.title,
          optionsCount: cat.options.length,
          options: cat.options
        })),
        reasoning: question.reasoning
      }, 'info');
    }
  }

  logUserAnswer(answer: string) {
    this.log('USER_ANSWER', {
      answer,
      length: answer.length,
      categories: answer.includes('|') ? answer.split('|').length : 1
    }, 'info');
  }

  getSummary() {
    const summary = {
      totalLogs: this.logs.length,
      errors: this.logs.filter(l => l.type === 'error').length,
      apiCalls: this.logs.filter(l => l.phase === 'API_REQUEST').length,
      questions: this.logs.filter(l => l.phase === 'API_RESPONSE' && l.data.type === 'QUESTION').length,
      completions: this.logs.filter(l => l.phase === 'API_RESPONSE' && l.data.type === 'COMPLETION').length,
      recentLogs: this.logs.slice(-10)
    };

    this.log('TEST_SUMMARY', summary, 'success');
    return summary;
  }

  exportLogs() {
    return {
      logs: this.logs,
      summary: this.getSummary(),
      exportTime: new Date().toISOString()
    };
  }

  clear() {
    this.logs = [];
    this.log('LOGGER_CLEARED', { timestamp: new Date().toISOString() }, 'info');
  }

  toggle(enabled: boolean) {
    this.isEnabled = enabled;
    console.log(`${enabled ? '🔛' : '🔇'} Test Logger ${enabled ? 'activated' : 'deactivated'}`);
  }
}

// Singleton Instance
export const testLogger = new TestLogger();

// Globale Funktionen für einfache Nutzung
export const logTestStart = (data: any) => testLogger.logTestStart(data);
export const logFormSubmit = (data: any) => testLogger.logFormSubmit(data);
export const logApiRequest = (data: any) => testLogger.logApiRequest(data);
export const logApiResponse = (data: any, duration?: number) => testLogger.logApiResponse(data, duration);
export const logError = (phase: string, error: any) => testLogger.logError(phase, error);
export const logQuestionAnalysis = (question: any) => testLogger.logQuestionAnalysis(question);
export const logUserAnswer = (answer: string) => testLogger.logUserAnswer(answer);
export const getTestSummary = () => testLogger.getSummary();
export const clearLogs = () => testLogger.clear();

// Browser Console Helper
if (typeof window !== 'undefined') {
  (window as any).testLogger = {
    summary: () => testLogger.getSummary(),
    export: () => testLogger.exportLogs(),
    clear: () => testLogger.clear(),
    toggle: (enabled: boolean) => testLogger.toggle(enabled)
  };
}