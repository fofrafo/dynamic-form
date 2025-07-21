export interface GenerateQuestionRequest {
  session_id?: string;
  tierart: string;
  alter: string;
  name: string;
  anlass: string;
  verlauf?: FormQA[];
}

export interface FormQA {
  question: string;
  answer: string;
}

// Neue Struktur für kategorisierte Optionen
export interface QuestionCategory {
  title: string;
  emoji: string;
  options: string[];
  allowMultiple?: boolean;
  maxSelections?: number;
}

export interface QuestionResponse {
  session_id: string;
  question: string;
  responseType: "singleChoice" | "text" | "multipleChoice" | "categorizedChoice";
  options?: string[];
  categories?: QuestionCategory[];
  emoji: string;
  reasoning: string;
  goalsChecked: string[];
  minSelections?: number;
  maxSelections?: number;
}

export interface CompletionResponse {
  session_id: string;
  status: "completed";
  summary: string;
  goals: {
    terminDauer: "15min" | "30min";
    rueckrufNoetig: boolean;
    bestaetigungNoetig: boolean;
  };
}

export type ApiResponse = QuestionResponse | CompletionResponse;

export interface FormState {
  step: 'initial' | 'questions' | 'completed';
  sessionId?: string;
  currentQuestion?: ApiResponse;
  answers: FormQA[];
  isLoading: boolean;
  error?: string;
  initialData?: InitialFormData;
}

export interface InitialFormData {
  tierart: string;
  alter: string;
  name: string;
  anlass: string;
}

export const TIERARTEN = [
  'Hund',
  'Katze', 
  'Kaninchen',
  'Hamster',
  'Meerschweinchen',
  'Vogel',
  'Reptil',
  'Fisch',
  'Sonstiges'
] as const;

export type Tierart = typeof TIERARTEN[number]; 