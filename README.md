# EduMarket Scorecard

Diese Web-App bewertet deutsche Hochschulen mit einem transparenten, datenbasierten Modell. Die Scores werden nicht als frei erfundene Demo-Werte gespeichert, sondern aus strukturierten Institutionsdaten abgeleitet.

## Lokal starten

Die App ist statisch und kann direkt über `index.html` geöffnet werden. Alternativ kann ein lokaler Server genutzt werden:

```text
python3 -m http.server 8791
```

Danach ist die App unter `http://127.0.0.1:8791/` erreichbar.

## Bedienung

Die Oberfläche ist als einfache Scorecard mit vier Bereichen aufgebaut:

- `Einzelbewertung`: Institution laden, KPIs, Kategorie-Scores, Bewertungstabelle, Quellen und leeres Recherche-Notizfeld
- `Institutionen vergleichen`: Zwei Institutionen nebeneinander auswerten, inklusive aufklappbarer Indikatorvergleiche
- `Gewichtung anpassen`: Kategorie- und Indikatorgewichte ändern, normalisieren oder auf Standard zurücksetzen
- `Datenpunkte`: Methodik, Quellenlogik und Proxy-Kriterien

Die Landing Page zeigt keine lange Methodikbox und keine Vergleichsfunktion. Methodik und Quellenlogik stehen nur im Tab `Datenpunkte`.

## Datenmodell

Jede Institution in `data.js` enthält strukturierte Datenpunkte:

- Hochschultyp und Trägerschaft
- QS World University Ranking 2026 und THE World University Ranking 2026, falls vorhanden
- Exzellenzstatus, Forschungsprofil, Praxisorientierung, Internationalität und Reputation
- Kostenzugänglichkeit, digitale Skalierbarkeit und berufsbegleitende Flexibilität
- Studentennachfrage, Arbeitsmarktwert, Netzwerkstärke, Standortvorteil und Fachprofil
- Spezialstärken in Business/Economics/Management sowie Tech/Research
- regulatorische Sicherheit und Daten-/Quellenqualität
- Quellenhinweise und Recherche-Notizen

Fehlende globale QS-/THE-Rankingpositionen werden nicht automatisch negativ bewertet. Für HAWs, private Hochschulen, Business Schools und Online-Anbieter nutzt das Modell alternative Proxy-Kriterien wie Praxisnähe, Flexibilität, Kostenstruktur, Zielgruppenfit, Skalierbarkeit und regulatorische Sicherheit. Spitzenuniversitäten und starke Fachprofile erhalten zusätzliche Plausibilitätsregeln, damit Reputation, Arbeitsmarktwert, Fachstärke und Netzwerke nicht durch geringere Flexibilität unterbewertet werden.

## Score-Berechnung

`app.js` leitet alle Indikatorwerte aus den Datenpunkten ab. Dafür gibt es unter anderem folgende Funktionen:

- `calculateReputationScore`
- `calculateResearchScore`
- `calculatePracticeOrientationScore`
- `calculateCostAccessibilityScore`
- `calculateInternationalVisibilityScore`
- `calculateRegulatorySecurityScore`
- `calculateScalabilityScore`
- `calculateMarketAttractivenessScore`
- `calculateProviderAttractivenessScore`
- `calculateRiskBarrierScore`
- `calculateSustainabilityScalabilityScore`
- `calculateChanceRiskScore`

Die Tabelle zeigt für jeden Indikator den abgeleiteten Score, die Gewichtung, den Beitrag und eine kurze Begründung mit Quellen-/Datenbasis. Score-Werte können manuell überschrieben werden. Erlaubt sind nur Werte von `0.5` bis `5` in `0.5`-Schritten. Der manuelle Score überschreibt den abgeleiteten Score, die datenbasierte Ableitung bleibt sichtbar und `Bewertung zurücksetzen` entfernt die Overrides wieder.

Im Vergleich bleiben die Oberkategorien sichtbar. Darunter gibt es pro Kategorie einen aufklappbaren Detailbereich mit Indikator-Score A, Indikator-Score B, Differenz, Gewinnerkennzeichnung und der jeweiligen Ableitung für beide Institutionen.

## Gewichtungen

Die Standardgewichtung ist:

- Marktattraktivität: 30 %
- Anbieterattraktivität: 25 %
- Regulatorische Risiken & Markteintrittsbarrieren: 20 %
- Nachhaltigkeit & Skalierbarkeit: 15 %
- Chancen-Risiken-Matrix: 10 %

Die Kategoriegewichte können im Bereich `Gewichtung anpassen` geändert werden. Zusätzlich lässt sich jede Kategorie aufklappen, um die Indikatorgewichte innerhalb dieser Kategorie zu bearbeiten. Die App zeigt für Ober- und Untergewichtungen jeweils die Summe, warnt bei Abweichungen von 100 %, kann die Werte normalisieren und die Standardgewichtung wiederherstellen. Einzelbewertung und Vergleich werden sofort neu berechnet.

Die Berechnung je Indikator lautet:

```text
Gesamtgewicht = Kategoriegewicht × Indikatorgewicht
Beitrag = Score / 5 × Gesamtgewicht × 100
```

## GitHub Pages veröffentlichen

Nach Änderungen im Repository:

```text
git status
git add README.md app.js data.js index.html styles.css
git commit -m "Update scorecard navigation and scoring overrides"
git push origin main
```

GitHub Pages aktualisiert danach die öffentliche Seite:

```text
https://cedricrui.github.io/hochschul-bewertungsmodell/
```

## Enthaltene Institutionsprofile

Das Modell enthält 40 Profile:

- 20 forschungsstarke Universitäten mit QS-/THE-Daten, soweit verfügbar
- 10 Hochschulen für angewandte Wissenschaften
- 10 private Hochschulen, Business Schools und berufsbegleitende/Online-Anbieter

FH Münster ist im Modell bewusst nicht durch fehlende globale Rankings benachteiligt und schneidet durch Praxisnähe, öffentliche Kostenstruktur und regulatorische Stabilität besser ab als FOM Hochschule. Mannheim, Goethe Frankfurt, TUM, LMU, Heidelberg, RWTH, KIT, Bonn und andere starke Volluniversitäten liegen durch Reputation, Ranking-/Fachprofil, Nachfrage, Arbeitsmarktwert und Netzwerke plausibel oberhalb von FH Münster.

## Hinweis

Die Scorecard ist ein erklärbares Arbeitsmodell, keine offizielle Rangliste. Alle Datenpunkte und Annahmen sind dokumentiert und sollten vor strategischen, wissenschaftlichen oder investitionsbezogenen Entscheidungen mit aktueller Primärrecherche validiert werden.
