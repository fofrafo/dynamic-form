# 🐾 Tierarzt.ai – Dynamisches Formular mit KI-Unterstützung

Ein intelligentes, dynamisch generiertes Formular für Tierarztpraxen, das vor einem Termin an Tierbesitzer geschickt wird. Die KI generiert schrittweise sinnvolle Fragen auf Basis eines Freitext-Anlasses und bekannter Tierdaten.

## 🎯 Ziel

Das System entscheidet automatisiert:
- Ist der Termin mit 15 oder 30 Minuten korrekt gebucht?
- Ist ein Rückruf des Tierarztes notwendig?
- Muss der Termin manuell bestätigt werden?

## 🚀 Tech Stack

- **Frontend:** Next.js 14 + React 18 + TypeScript
- **Backend:** Supabase Edge Functions + PostgreSQL
- **KI:** OpenAI GPT-4o-mini
- **Styling:** Custom CSS

## 📦 Installation & Setup

### 1. Repository klonen
```bash
git clone <your-repo-url>
cd dynamic-form
npm install
```

### 2. Environment Variables
Erstelle eine `.env.local` Datei:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase Setup
Das Projekt benötigt folgende Datenbank-Tabellen:

```sql
-- form_sessions Tabelle
CREATE TABLE form_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tierart text NOT NULL,
  alter text NOT NULL,
  name text NOT NULL,
  anlass text NOT NULL,
  status text DEFAULT 'in_progress',
  created_at timestamp DEFAULT now()
);

-- form_responses Tabelle
CREATE TABLE form_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES form_sessions(id),
  question text NOT NULL,
  answer text NOT NULL,
  goals_checked jsonb DEFAULT '[]',
  created_at timestamp DEFAULT now()
);

-- RLS Policies aktivieren
ALTER TABLE form_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Public access policies (für Demo-Zwecke)
CREATE POLICY "Allow all operations on form_sessions" ON form_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations on form_responses" ON form_responses FOR ALL USING (true);
```

### 4. Edge Function
Deploy die `generate-question` Edge Function zu Supabase:
- OpenAI API Key in Supabase Secrets konfigurieren
- Function verwendet GPT-4o-mini für kosteneffiziente Verarbeitung

## 🖥️ Entwicklung

```bash
npm run dev
```

Die App startet auf `http://localhost:3000` (oder dem nächsten verfügbaren Port).

## 🌍 Deployment

### Vercel (Empfohlen)
1. Repository zu GitHub pushen
2. Vercel Account erstellen/anmelden
3. Repository mit Vercel verbinden
4. Environment Variables in Vercel Dashboard einstellen
5. Automatisches Deployment startet

### Andere Plattformen
- **Netlify:** Drag & Drop des Build-Ordners
- **Railway:** GitHub Integration
- **Heroku:** Git-basiertes Deployment

## 📁 Projektstruktur

```
├── app/                    # Next.js App Router
│   ├── page.tsx           # Haupt-Komponente
│   ├── layout.tsx         # Layout-Wrapper
│   └── simple-globals.css # Custom Styling
├── components/            # React Komponenten
│   ├── InitialForm.tsx    # Erste Formular-Seite
│   ├── QuestionForm.tsx   # Dynamische Fragen
│   └── CompletionView.tsx # Ergebnis-Anzeige
├── lib/                   # Utilities
│   └── api.ts            # Supabase Client
├── types/                 # TypeScript Definitionen
│   └── form.ts           # Form-Interface
└── prod.md               # Detaillierte Projektbeschreibung
```

## 🔧 Features

- **Intelligente Fragengenerierung:** KI-basierte, kontextuelle Fragen
- **Multi-Step Form:** Schrittweise Datenerfassung
- **Real-time Validation:** Sofortige Fehlerbehandlung
- **Responsive Design:** Mobile-optimierte Benutzeroberfläche
- **Session Management:** Persistente Formular-Sessions
- **Visual Feedback:** Loading-Spinner und Animationen

## 🔐 Sicherheit

- Row Level Security (RLS) in Supabase aktiviert
- Environment Variables für sensitive Daten
- Input-Validierung auf Frontend und Backend
- OpenAI API Rate Limiting

## 📝 Lizenz

Dieses Projekt ist für den privaten/internen Gebrauch bestimmt.

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature Branch
3. Committe deine Änderungen
4. Pushe zum Branch
5. Öffne einen Pull Request

## 📞 Support

Bei Fragen oder Problemen erstelle bitte ein Issue in diesem Repository. 