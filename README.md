# EduMarket Scorecard

Diese lokale Web-App bewertet eine Universität oder Hochschule nach dem Bewertungsmodell aus `Arlinghaus Präsi.xlsx`. Sie nutzt die Kategorien, Gewichtungen, 1-bis-5-Scorelogik und den Gesamtscore-Roll-up aus der Excel-Datei.

## Lokal starten

Öffne `index.html` direkt im Browser. Es wird kein Server und kein Framework benötigt.

## Was die App macht

- Eingabe eines Hochschulnamens
- Demo-Daten für FOM Hochschule, IU Internationale Hochschule, FH Münster und TU Dortmund
- Suchvorschläge für Demo-Institutionen und neue manuelle Bewertungen
- Automatisches neutrales Bewertungsformular mit Standardwerten für nicht hinterlegte Institutionen
- Vergleich von zwei Universitäten/Hochschulen nebeneinander
- Editierbare Scores in 0,5-Schritten
- Editierbare Kurzbegründungen
- Live-Berechnung von Gesamtscore, Kategorie-Scores, Empfehlung und Beiträgen
- JSON-Export, Zurücksetzen und Druckansicht

## Score-Berechnung

Jeder Indikator erhält einen Score von 1 bis 5. Der normierte Score ist:

```text
Score / 5
```

Das Gesamtgewicht eines Indikators ist:

```text
Kategoriegewicht × Indikatorgewicht innerhalb der Kategorie
```

Der Beitrag zum Gesamtscore ist:

```text
normierter Score × Gesamtgewicht × 100
```

Der Gesamtscore ergibt sich aus der Summe aller Indikatorbeiträge und wird zusätzlich auf eine 1-bis-5-Skala umgerechnet:

```text
Gesamtscore / 100 × 5
```

## Empfehlungslogik

- 0-39: Nicht empfehlenswert
- 40-59: Nur mit hoher Vorsicht / begrenzter Einstieg
- 60-74: Pilot / selektiver Einstieg
- 75-89: Attraktiver Einstieg
- 90-100: Sehr attraktiver Einstieg / klare Priorität

## Vergleichsfunktion

Im Bereich `Vergleich` können zwei Institutionen eingegeben werden. Die App berechnet automatisch:

- Gesamtscore A vs. B
- Empfehlung A vs. B
- stärkste und schwächste Kategorie je Institution
- Kategorie-Scores nebeneinander
- Differenz je Hauptkategorie
- kurze automatische Zusammenfassung

Die Vergleichsfunktion nutzt Demo-Daten, falls eine Institution hinterlegt ist. Wird eine nicht hinterlegte Institution eingegeben, erstellt die App eine neutrale manuelle Bewertung mit Standardwerten.

Wenn die aktuell geöffnete Einzelbewertung editiert wird und dieselbe Institution im Vergleich verwendet wird, aktualisiert sich der Vergleich mit den geänderten Scores.

## Manuelle Institutionen

Wenn du im Suchfeld z. B. `RWTH Aachen` eingibst, erscheint ein Vorschlag:

```text
RWTH Aachen - neue manuelle Bewertung erstellen
```

Mit Enter oder Klick auf den Vorschlag wird eine neue Bewertung mit neutralen Standardwerten angelegt. Danach können Scores und Begründungen manuell bearbeitet werden.

## Neue Hochschulen in `data.js` hinzufügen

1. Öffne `data.js`.
2. Ergänze im Objekt `demos` einen neuen Eintrag mit einem eindeutigen Schlüssel, z. B. `"beispiel-hochschule"`.
3. Setze `name`, `comparisonNote`, `researchNotes`, `assessments`, `chanceRisks` und `sources`.
4. In `assessments` kann jeder Indikator über seine ID befüllt werden, z. B.:

```js
"market-growth": [4, "Kurze Begründung"]
```

Wenn ein Indikator fehlt, verwendet die App automatisch den neutralen Standardwert 3.

## Hinweis zu Demo-Daten

Die Demo-Bewertungen sind Platzhalter für einen realistischen Prototyp. Für echte wissenschaftliche, strategische oder investitionsbezogene Nutzung müssen alle Annahmen mit belastbaren Quellen validiert und dokumentiert werden.
