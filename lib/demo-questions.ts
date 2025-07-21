import { QuestionResponse } from '@/types/form';

// Generiere spezifische Fragen basierend auf dem Anlass
export function generateSpecificQuestion(tierart: string, anlass: string): QuestionResponse {
  const anlassLower = anlass.toLowerCase();
  
  // Erstelle spezifische Symptom-Optionen basierend auf dem Anlass
  let symptomOptions: string[] = [];
  let fragenText = `Zur Vorbereitung des Termins für "${anlass}" - bitte wählen Sie alle zutreffenden Punkte aus:`;
  
  if (anlassLower.includes('erbrechen') || anlassLower.includes('durchfall') || anlassLower.includes('magen')) {
    symptomOptions = [
      "Erbrechen (häufig)",
      "Erbrechen (selten)", 
      "Durchfall (wässrig)",
      "Durchfall (schleimig)",
      "Blut im Stuhl",
      "Appetitlosigkeit",
      "Bauchschmerzen",
      "Trinkt viel mehr"
    ];
  } else if (anlassLower.includes('husten') || anlassLower.includes('atmen') || anlassLower.includes('niesen')) {
    symptomOptions = [
      "Trockener Husten",
      "Husten mit Auswurf",
      "Schwere Atmung",
      "Pfeifende Geräusche",
      "Nasenausfluss",
      "Niesen"
    ];
  } else if (anlassLower.includes('lahm') || anlassLower.includes('humpel') || anlassLower.includes('hinkt')) {
    symptomOptions = [
      "Hinkt auf einem Bein",
      "Steifheit nach Aufstehen",
      "Schmerzen beim Berühren",
      "Schwellung sichtbar",
      "Will nicht springen/rennen",
      "Hält Pfote hoch"
    ];
  } else if (anlassLower.includes('impf') || anlassLower.includes('routine') || anlassLower.includes('check')) {
    symptomOptions = [
      "Keine besonderen Symptome",
      "Allgemeine Müdigkeit", 
      "Frisst weniger als sonst",
      "Verhält sich anders als sonst",
      "Alles wie immer"
    ];
  } else {
    // Generische Optionen für unbekannte Anlässe
    symptomOptions = [
      "Veränderte Aktivität",
      "Veränderte Fresslust",
      "Verhaltensänderung",
      "Körperliche Auffälligkeiten",
      "Keine weiteren Symptome"
    ];
  }

  return {
    session_id: 'demo-session-dynamic',
    question: fragenText,
    responseType: "categorizedChoice",
    categories: [
      {
        title: "Aktuelle Situation",
        emoji: "🎯",
        options: symptomOptions
      },
      {
        title: "Allgemeinzustand",
        emoji: "😴",
        options: [
          "Frisst und trinkt normal",
          "Frisst weniger als sonst",
          "Sehr aktiv und spielfreudig",
          "Weniger aktiv als sonst",
          "Schlapp und müde",
          "Versteckt sich"
        ]
      },
      {
        title: "Dringlichkeit",
        emoji: "⏰",
        options: [
          "Termin kann warten",
          "Sollte bald untersucht werden", 
          "Dringend abklären",
          "Verschlechtert sich sichtbar",
          "Bleibt unverändert"
        ]
      }
    ],
    emoji: "📋",
    reasoning: "Diese Informationen helfen uns, den Termin optimal vorzubereiten",
    goalsChecked: ["ernsthaftigkeit", "rueckrufNoetig", "terminDauer"]
  };
}

// Demo-Fragen für verschiedene Szenarien (Fallback)
export const demoQuestions: Record<string, QuestionResponse[]> = {
  'hund-magen-darm': [
    {
      session_id: 'demo-session-1',
      question: "Bitte wählen Sie alle zutreffenden Punkte aus:",
      responseType: "categorizedChoice",
      categories: [
        {
          title: "Symptome",
          emoji: "🤒",
          options: [
            "Erbrechen",
            "Durchfall", 
            "Blut im Stuhl",
            "Appetitlosigkeit",
            "Fieber",
            "Bauchschmerzen"
          ]
        },
        {
          title: "Verhalten",
          emoji: "😴",
          options: [
            "Sehr schlapp",
            "Unruhig",
            "Versteckt sich",
            "Normal aktiv",
            "Jammert/winselt"
          ]
        },
        {
          title: "Zeitpunkt",
          emoji: "⏰",
          options: [
            "Gerade eben",
            "Heute begonnen",
            "Seit gestern",
            "Mehrere Tage",
            "Schon länger"
          ]
        }
      ],
      emoji: "📋",
      reasoning: "Diese Informationen helfen uns, den Termin optimal vorzubereiten",
      goalsChecked: ["ernsthaftigkeit", "rueckrufNoetig"]
    }
  ],
  
  'katze-atemwege': [
    {
      session_id: 'demo-session-2',
      question: "Welche Atemwegs-Symptome zeigt Ihre Katze?",
      responseType: "multipleChoice",
      options: [
        "Husten",
        "Niesen",
        "Atemnot",
        "Pfeifende Atemgeräusche",
        "Nasenausfluss",
        "Maulöffnung beim Atmen"
      ],
      minSelections: 1,
      maxSelections: 4,
      emoji: "😷",
      reasoning: "Mehrere Atemwegs-Symptome können gleichzeitig auftreten",
      goalsChecked: ["ernsthaftigkeit"]
    },
    {
      session_id: 'demo-session-2',
      question: "Wie verhält sich Ihre Katze aktuell?",
      responseType: "singleChoice",
      options: [
        "Normal aktiv und frisst",
        "Weniger aktiv, frisst noch",
        "Sehr schlapp, frisst wenig",
        "Versteckt sich, frisst gar nicht"
      ],
      emoji: "🐱",
      reasoning: "Das Verhalten gibt Aufschluss über die Schwere der Erkrankung",
      goalsChecked: ["rueckrufNoetig"]
    }
  ],
  
  'notfall': [
    {
      session_id: 'demo-session-3',
      question: "NOTFALL erkannt! Bitte bestätigen Sie die Situation:",
      responseType: "categorizedChoice",
      categories: [
        {
          title: "Akute Symptome",
          emoji: "🚨",
          options: [
            "Atemnot",
            "Kollaps",
            "Bewusstlosigkeit",
            "Starke Schmerzen",
            "Massive Blutung"
          ]
        },
        {
          title: "Zeitpunkt",
          emoji: "⏰",
          options: [
            "Gerade jetzt",
            "Vor wenigen Minuten",
            "Vor einer Stunde"
          ]
        }
      ],
      emoji: "🚨",
      reasoning: "Sofortige Einschätzung für Notfall-Protokoll",
      goalsChecked: ["ernsthaftigkeit", "rueckrufNoetig", "bestaetigungNoetig"]
    }
  ]
};

// Completion-Responses für Demo
export const demoCompletions = {
  'hund-magen-darm': {
    session_id: 'demo-session-1',
    status: 'completed' as const,
    summary: "Terminvorbereitung abgeschlossen. Magen-Darm-Beschwerden erfasst - 15min Termin geplant. Bei Verschlechterung vor dem Termin bitte telefonisch melden.",
    goals: {
      terminDauer: "15min" as const,
      rueckrufNoetig: false,
      bestaetigungNoetig: false
    }
  },
  
  'katze-atemwege': {
    session_id: 'demo-session-2',
    status: 'completed' as const,
    summary: "Terminvorbereitung für Atemwegsprobleme abgeschlossen. Längerer Termin wurde eingeplant. Rückruf zur Abklärung der Dringlichkeit erfolgt heute noch.",
    goals: {
      terminDauer: "30min" as const,
      rueckrufNoetig: true,
      bestaetigungNoetig: true
    }
  },
  
  'notfall': {
    session_id: 'demo-session-3',
    status: 'completed' as const,
    summary: "DRINGEND: Die angegebenen Symptome erfordern eine sofortige Abklärung. Bitte kommen Sie umgehend in die Praxis oder kontaktieren Sie den Notdienst.",
    goals: {
      terminDauer: "30min" as const,
      rueckrufNoetig: true,
      bestaetigungNoetig: true
    }
  }
};

// Bestimme Demo-Szenario basierend auf Eingabe
export function getDemoScenario(tierart: string, anlass: string): string {
  const anlassLower = anlass.toLowerCase();
  
  if (anlassLower.includes('kollaps') || anlassLower.includes('atemnot') || 
      anlassLower.includes('bewusstlos') || anlassLower.includes('blut')) {
    return 'notfall';
  }
  
  if (tierart.toLowerCase() === 'katze' && 
      (anlassLower.includes('husten') || anlassLower.includes('niesen') || 
       anlassLower.includes('atmen'))) {
    return 'katze-atemwege';
  }
  
  if (anlassLower.includes('erbrechen') || anlassLower.includes('durchfall') || 
      anlassLower.includes('magen') || anlassLower.includes('frisst nicht')) {
    return 'hund-magen-darm';
  }
  
  // Default zu Magen-Darm
  return 'hund-magen-darm';
} 