# 🐾 Tierarzt.ai – Dynamisches Formular mit KI-Unterstützung

## 🎯 Ziel

Ein intelligentes, dynamisch generiertes Formular, das vor einem Tierarzttermin an Tierbesitzer geschickt wird. Die KI generiert schrittweise sinnvolle Fragen auf Basis eines Freitext-Anlasses und bekannter Tierdaten. Ziel ist es, automatisiert zu entscheiden:

- Ist der Termin mit 15 oder 30 Minuten korrekt gebucht?
- Ist ein Rückruf des Tierarztes notwendig?
- Muss der Termin manuell bestätigt werden?

Sobald diese drei Punkte zuverlässig beantwortet wurden, wird der Prozess automatisch abgeschlossen.

---

## 🧱 Architektur

- **Frontend:** Einfache Web-App oder mobile Oberfläche (nicht Teil dieser Datei)
- **Backend:** Supabase Functions (Edge Functions, optional REST-Wrapper)
- **Datenbank:** Supabase PostgreSQL
- **KI-Modell:** OpenAI `gpt-4o`, Chat Completions API (via Supabase Edge Function)

---

## 📄 Datenstruktur (Supabase)

### `form_sessions`

| Feld            | Typ         | Beschreibung                                  |
|------------------|-------------|-----------------------------------------------|
| `id`            | uuid (PK)   | Eindeutige ID der Session                     |
| `tierart`       | text        | Hund, Katze, etc.                             |
| `alter`         | text        | Alter des Tieres in lesbarer Form            |
| `name`          | text        | Name des Tieres                               |
| `anlass`        | text        | Freitext vom Besitzer                         |
| `status`        | text        | `in_progress` / `completed`                  |
| `created_at`    | timestamp   | automatisch von Supabase gesetzt              |

### `form_responses`

| Feld            | Typ         | Beschreibung                                  |
|------------------|-------------|-----------------------------------------------|
| `id`            | uuid (PK)   | Eindeutige Antwort-ID                         |
| `session_id`    | uuid (FK)   | Referenz zu `form_sessions.id`                |
| `question`      | text        | Von der KI gestellte Frage                    |
| `answer`        | text        | Antwort des Besitzers                         |
| `goalsChecked`  | jsonb       | Liste: `["terminDauer", "rueckrufNoetig"]` etc. |
| `created_at`    | timestamp   | automatisch gesetzt                           |

---

## ⚙️ Ablauf

1. Tierbesitzer bucht Termin mit Freitext-Angabe.
2. Backend erstellt `form_session`-Eintrag.
3. Erste Frage wird von OpenAI generiert.
4. Nach jeder Antwort:
   - Antwort wird in `form_responses` gespeichert.
   - Historie wird an OpenAI übergeben → nächste Frage oder Abschluss.
5. Wenn alle drei Ziele sicher abgedeckt sind:
   - `status = completed`
   - Optional: Zusammenfassung für Backend-Team generieren.

---

## 🤖 System Prompt (OpenAI)

```txt
Du bist Tierarzt in einer deutschen Kleintierpraxis. Ein Tierbesitzer hat einen Termin gebucht und einen Freitext-Anlass angegeben. Zusätzlich liegen dir Informationen über die Tierart (z. B. Hund, Katze), das Alter (z. B. 2 Jahre) und den Namen des Tiers vor. 

Deine Aufgabe ist es, nacheinander sinnvolle, strukturierte Fragen an den Besitzer zu stellen, um:
1. Die Art und Dauer des Termins korrekt einschätzen zu können (15 oder 30 Minuten).
2. Zu entscheiden, ob ein Rückruf durch den Tierarzt nötig ist.
3. Zu entscheiden, ob der Termin bestätigt werden muss.

Gib die nächste Frage **immer** als JSON im folgenden Format zurück:

{
  "question": "...",
  "responseType": "singleChoice",
  "options": ["...", "..."],
  "emoji": "...",
  "reasoning": "...",
  "goalsChecked": ["..."]
}

Wenn du aus den bisherigen Antworten sicher alle drei Punkte beurteilen kannst, antworte stattdessen mit:

{
  "status": "completed",
  "summary": "15 Minuten reichen aus. Rückruf ist nicht nötig. Termin kann ohne Rückfrage stattfinden.",
  "goals": {
    "terminDauer": "15min",
    "rueckrufNoetig": false,
    "bestaetigungNoetig": false
  }
}

Halte den Dialog möglichst kurz, aber stelle sicher, dass du diese drei Punkte sicher bewerten kannst.
