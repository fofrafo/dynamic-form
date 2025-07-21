import { InitialFormData, TIERARTEN } from '@/types/form';

const BEISPIEL_ANLAESSE = [
  // Notfälle
  "Humpelt seit heute morgen stark und will nicht mehr laufen",
  "Erbricht seit gestern Abend mehrmals und frisst nichts",
  "Atmet schwer und ist sehr unruhig seit einer Stunde",
  "Hat Durchfall mit Blut seit heute früh",
  "Kollabiert immer wieder und ist sehr schlapp",
  
  // Routine
  "Jährliche Routineimpfung und Gesundheitscheck",
  "Entwurmung und Flohbehandlung fällig",
  "Kastration nach Absprache mit dem Tierarzt",
  "Zahnreinigung - Mundgeruch und Zahnstein",
  "Kontrolluntersuchung nach Operation vor 2 Wochen",
  
  // Haut/Fell
  "Kratzt sich ständig und hat kahle Stellen am Bauch",
  "Rote, entzündete Stellen zwischen den Zehen",
  "Fellausfall und schuppige Haut seit einigen Tagen",
  "Allergie-Verdacht - juckt sich sehr viel",
  "Warze am Ohr wird größer",
  
  // Verhalten
  "Versteckt sich seit 3 Tagen und ist sehr ängstlich",
  "Frisst deutlich weniger als sonst seit einer Woche",
  "Trinkt viel mehr Wasser als normal",
  "Schläft sehr viel und ist weniger aktiv",
  "Aggressives Verhalten gegenüber anderen Tieren",
  
  // Augen/Ohren
  "Augen tränen stark und sind gerötet",
  "Kopf schütteln und Kratzen am Ohr",
  "Dunkler Ausfluss aus dem Ohr mit Geruch",
  "Blinzelt ständig und kneift ein Auge zu",
  "Hörprobleme - reagiert nicht auf Rufe",
  
  // Bewegung
  "Steifheit beim Aufstehen, besonders morgens",
  "Hinkt abwechselnd auf verschiedenen Beinen",
  "Will nicht mehr Treppen steigen",
  "Lahmt nach dem Spaziergang",
  "Zittert an den Hinterbeinen beim Stehen",
  
  // Speziell Katzen
  "Benutzt das Katzenklo nicht mehr richtig",
  "Niest häufig und hat Nasenausfluss",
  "Faucht und versteckt sich ungewöhnlich",
  "Erbricht Haarballen sehr häufig",
  "Maunzt nachts ständig ohne ersichtlichen Grund",
  
  // Speziell Hunde
  "Bellt nachts viel mehr als sonst",
  "Zieht stark an der Leine - Verhaltensproblem",
  "Frisst Kot oder andere ungenießbare Dinge",
  "Sabbertmehr als gewöhnlich",
  "Wälzt sich ständig auf dem Rücken",
  
  // Exotische Tiere
  "Hamster bewegt sich sehr langsam und schläft viel",
  "Kaninchen frisst das Heu nicht mehr",
  "Meerschweinchen quietscht beim Urinieren",
  "Vogel plustet Federn auf und sitzt nur noch",
  "Reptil verweigert das Fressen seit Wochen",
];

const TIER_NAMEN = {
  Hund: ["Bello", "Luna", "Max", "Bella", "Charlie", "Lucy", "Rocky", "Mia", "Bruno", "Lola", "Rex", "Emma", "Buddy", "Nala", "Zeus"],
  Katze: ["Mimi", "Felix", "Luna", "Whiskers", "Simba", "Nala", "Tiger", "Princess", "Shadow", "Cleo", "Oscar", "Bella", "Smokey", "Angel", "Mittens"],
  Kaninchen: ["Hoppel", "Schnuffi", "Coco", "Bunny", "Flöckchen", "Nibbles", "Thumper", "Cotton", "Mocha", "Pepper"],
  Hamster: ["Krümel", "Nuss", "Peanut", "Gizmo", "Speedy", "Buttons", "Cookie", "Nibbles", "Squeaky", "Tiny"],
  Meerschweinchen: ["Porky", "Wheeker", "Fuzzy", "Cocoa", "Patches", "Snuggles", "Squeaky", "Buttercup", "Oreo", "Pippin"],
  Vogel: ["Tweety", "Rio", "Sunny", "Kiwi", "Mango", "Blue", "Phoenix", "Storm", "Sky", "Echo"],
  Reptil: ["Spike", "Scales", "Verde", "Gecko", "Rex", "Dragon", "Emerald", "Viper", "Slither", "Jade"],
  Fisch: ["Nemo", "Goldie", "Bubbles", "Flash", "Neptune", "Coral", "Azure", "Pearl", "Tsunami", "Splash"],
  Sonstiges: ["Buddy", "Pet", "Freund", "Liebling", "Schatz", "Baby", "Sweetie", "Honey", "Precious", "Angel"]
};

const ALTER_OPTIONEN = [
  "2 Monate", "4 Monate", "6 Monate", "8 Monate", 
  "1 Jahr", "1,5 Jahre", "2 Jahre", "3 Jahre", "4 Jahre", "5 Jahre",
  "6 Jahre", "7 Jahre", "8 Jahre", "9 Jahre", "10 Jahre",
  "11 Jahre", "12 Jahre", "13 Jahre", "14 Jahre", "15 Jahre"
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateTestData(): InitialFormData {
  const tierart = getRandomElement(TIERARTEN);
  const name = getRandomElement(TIER_NAMEN[tierart] || TIER_NAMEN.Sonstiges);
  const alter = getRandomElement(ALTER_OPTIONEN);
  const anlass = getRandomElement(BEISPIEL_ANLAESSE);

  return {
    tierart,
    name,
    alter,
    anlass
  };
}

// Spezifische Test-Szenarien für bestimmte Fälle
export const TEST_SZENARIEN = {
  notfall: {
    tierart: "Hund",
    name: "Rex",
    alter: "5 Jahre", 
    anlass: "Kollabiert immer wieder und atmet schwer - sehr dringend!"
  },
  routine: {
    tierart: "Katze",
    name: "Mimi",
    alter: "2 Jahre",
    anlass: "Jährliche Routineimpfung und Gesundheitscheck"
  },
  magenDarm: {
    tierart: "Hund", 
    name: "Bello",
    alter: "3 Jahre",
    anlass: "Erbricht seit gestern mehrmals - erst Futter, dann Schleim mit etwas Blut. Hat auch Durchfall."
  },
  verhalten: {
    tierart: "Katze",
    name: "Shadow", 
    alter: "7 Jahre",
    anlass: "Versteckt sich seit Tagen und frisst nicht mehr"
  },
  bewegung: {
    tierart: "Hund",
    name: "Luna",
    alter: "8 Jahre", 
    anlass: "Humpelt und zeigt Steifheit beim Aufstehen"
  }
};