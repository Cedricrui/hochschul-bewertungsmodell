(function () {
  "use strict";

  const scoreValues = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  const categories = [
    {
      id: "market",
      name: "Marktattraktivität",
      weight: 0.3,
      indicators: [
        {
          id: "market-growth",
          name: "Marktwachstum",
          weight: 0.25,
          analysis: "Wachstum des Bildungs-/EdTech-Marktes"
        },
        {
          id: "market-size",
          name: "Marktgröße & Zielgruppenpotenzial",
          weight: 0.2,
          analysis: "Größe der relevanten Zielgruppe, demografisches Potenzial"
        },
        {
          id: "competition",
          name: "Wettbewerbsintensität / Marktfragmentierung",
          weight: 0.2,
          analysis: "Positiv gedreht: 5 = attraktiver Wettbewerbsraum"
        },
        {
          id: "demand",
          name: "Nachfrageprofile & Zahlungsbereitschaft",
          weight: 0.15,
          analysis: "Präferenzen, Zahlungsbereitschaft und Nachfrage nach Bildungsangeboten"
        },
        {
          id: "digital-access",
          name: "Digitale Infrastruktur & Zugang",
          weight: 0.2,
          analysis: "Internet, mobile Nutzung, digitale Lern- und Zahlungsbereitschaft"
        }
      ]
    },
    {
      id: "provider",
      name: "Anbieterattraktivität",
      weight: 0.25,
      indicators: [
        {
          id: "innovation",
          name: "Innovationsgrad / Technologieeinsatz",
          weight: 0.2,
          analysis: "KI, adaptive Lernsysteme, Plattformlogik, moderne Lernformate"
        },
        {
          id: "reputation",
          name: "Reputation & Vertrauenswürdigkeit",
          weight: 0.2,
          analysis: "Marke, Rankings, Zertifikate, Partnerschaften, Nutzerbewertungen"
        },
        {
          id: "cost-position",
          name: "Kostenstruktur & Preisfähigkeit",
          weight: 0.2,
          analysis: "Wettbewerbsfähige Preise bei tragfähiger Kostenlogik"
        },
        {
          id: "differentiation",
          name: "Differenzierung / Value Proposition",
          weight: 0.2,
          analysis: "Klares Alleinstellungsmerkmal gegenüber Alternativen"
        },
        {
          id: "channels",
          name: "Vertriebskanäle & lokale Partner",
          weight: 0.2,
          analysis: "Zugang zu Schulen, Hochschulen, Unternehmen, Plattformen oder Partnern"
        }
      ]
    },
    {
      id: "regulation",
      name: "Regulatorische Risiken & Markteintrittsbarrieren",
      weight: 0.2,
      indicators: [
        {
          id: "accreditation",
          name: "Akkreditierung / Zulassung",
          weight: 0.25,
          analysis: "Positiv gedreht: 5 = Zulassung gut machbar"
        },
        {
          id: "compliance",
          name: "Datenschutz & Compliance",
          weight: 0.2,
          analysis: "DSGVO, Plattformregeln, Jugendschutz, Verbraucherschutz"
        },
        {
          id: "foreign-provider-limits",
          name: "Einschränkungen für ausländische Anbieter",
          weight: 0.2,
          analysis: "Eigentumsregeln, Joint-Venture-Pflichten, lokale Lizenzanforderungen"
        },
        {
          id: "legal-stability",
          name: "Politische und rechtliche Stabilität",
          weight: 0.2,
          analysis: "Planbarkeit, politische Stabilität, geopolitische Risiken, Rechtssicherheit"
        },
        {
          id: "reg-process",
          name: "Dauer & Kosten regulatorischer Prozesse",
          weight: 0.15,
          analysis: "Zeit- und Kostenaufwand für Genehmigungen und Compliance"
        }
      ]
    },
    {
      id: "sustainability",
      name: "Nachhaltigkeit & Skalierbarkeit",
      weight: 0.15,
      indicators: [
        {
          id: "scalability",
          name: "Skalierbarkeit des Angebots",
          weight: 0.25,
          analysis: "Wachstum mit geringen Zusatzkosten"
        },
        {
          id: "localization",
          name: "Lokalisierungsfähigkeit",
          weight: 0.2,
          analysis: "Sprachliche, kulturelle und curriculare Anpassbarkeit"
        },
        {
          id: "operations",
          name: "Operative Umsetzbarkeit",
          weight: 0.2,
          analysis: "Lehrkräfte, Tutoren, Support, Technologie und Organisation"
        },
        {
          id: "financial-viability",
          name: "Finanzielle Tragfähigkeit / Profitabilitätspotenzial",
          weight: 0.2,
          analysis: "Erwartete Marge, Skaleneffekte, Kostenkontrolle"
        },
        {
          id: "social-impact",
          name: "Sozialer Impact & Nachhaltigkeit",
          weight: 0.15,
          analysis: "Zugang zu Bildung, Employability, gesellschaftlicher Nutzen, ESG-Fit"
        }
      ]
    },
    {
      id: "chance-risk",
      name: "Chancen-Risiken-Matrix",
      weight: 0.1,
      indicators: [
        {
          id: "opportunity-potential",
          name: "Chancenpotenzial",
          weight: 0.25,
          analysis: "5 = viele starke Chancen"
        },
        {
          id: "risk-load",
          name: "Risikobelastung",
          weight: 0.25,
          analysis: "Positiv gedreht: 5 = geringe bzw. gut beherrschbare Risikobelastung"
        },
        {
          id: "risk-control",
          name: "Kontrollierbarkeit der Risiken",
          weight: 0.2,
          analysis: "Risiken können durch Partner, Pilotphase oder Anpassung reduziert werden"
        },
        {
          id: "strategic-fit",
          name: "Strategischer Fit der Chancen",
          weight: 0.15,
          analysis: "Passung der Chancen zur langfristigen Strategie"
        },
        {
          id: "net-opportunity-risk",
          name: "Netto-Chancen-Risiko-Verhältnis",
          weight: 0.15,
          analysis: "Chancen überwiegen Risiken"
        }
      ]
    }
  ];

  const recommendationBands = [
    { min: 90, max: 100, range: "90-100", label: "Sehr attraktiver Einstieg / klare Priorität" },
    { min: 75, max: 89.999, range: "75-89", label: "Attraktiver Einstieg" },
    { min: 60, max: 74.999, range: "60-74", label: "Pilot / selektiver Einstieg" },
    { min: 40, max: 59.999, range: "40-59", label: "Nur mit hoher Vorsicht / begrenzter Einstieg" },
    { min: 0, max: 39.999, range: "0-39", label: "Nicht empfehlenswert" }
  ];

  const scoreGuide = [
    { score: 1, interpretation: "Sehr schwach", meaning: "Sehr unattraktiv, sehr hohe Barriere oder nicht wettbewerbsfähig" },
    { score: 1.5, interpretation: "Schwach bis sehr schwach", meaning: "Deutliche Nachteile, nur mit großem Aufwand nutzbar" },
    { score: 2, interpretation: "Schwach", meaning: "Eher unattraktiv oder risikobehaftet" },
    { score: 2.5, interpretation: "Schwach bis mittel", meaning: "Mehr Nachteile als Vorteile" },
    { score: 3, interpretation: "Mittel / neutral", meaning: "Akzeptabel, aber ohne klaren Vorteil" },
    { score: 3.5, interpretation: "Mittel bis gut", meaning: "Solide, mit erkennbaren Vorteilen" },
    { score: 4, interpretation: "Gut", meaning: "Attraktiv und strategisch sinnvoll" },
    { score: 4.5, interpretation: "Gut bis sehr gut", meaning: "Sehr attraktiv, nur geringe Schwächen" },
    { score: 5, interpretation: "Sehr gut", meaning: "Sehr attraktiv, starke Passung, geringe Risiken" }
  ];

  const manualTemplate = {
    researchNotes: "Manuelle Bewertung. Quellen und Annahmen bitte ergänzen.",
    chanceRisks: [
      { type: "Chance", text: "Bitte Chance ergänzen.", priority: "Offen" },
      { type: "Risiko", text: "Bitte Risiko ergänzen.", priority: "Offen" }
    ],
    sources: [
      { label: "Hochschulwebsite", status: "Quellen manuell ergänzen", note: "" },
      { label: "Akkreditierung / Zulassung", status: "Quellen manuell ergänzen", note: "" },
      { label: "Markt- und Wettbewerbsdaten", status: "Quellen manuell ergänzen", note: "" }
    ],
    comparisonNote: "Die Bewertung basiert auf neutralen Standardwerten und sollte mit eigenen Quellen ergänzt werden."
  };

  const demos = {
    "fom-hochschule": {
      name: "FOM Hochschule",
      researchNotes: "Demo-Bewertung. Annahmen sind Platzhalter und sollten mit belastbaren Quellen validiert werden.",
      comparisonNote: "FOM bleibt besonders stark bei berufsbegleitender Zielgruppenorientierung, Praxisnähe, Standortnähe und Unternehmensbezug.",
      assessments: {
        "market-growth": [4, "Berufsbegleitende und flexible Studienformate adressieren eine stabile Nachfrage im Weiterbildungsmarkt."],
        "market-size": [4, "Große Zielgruppe aus Berufstätigen, Unternehmen und regionalen Weiterbildungsinteressierten."],
        competition: [3, "Privathochschulen und Online-Anbieter erhöhen den Wettbewerbsdruck."],
        demand: [4, "Hohe Passung zu zahlungsbereiten berufstätigen Zielgruppen."],
        "digital-access": [3.5, "Hybride und digitale Formate vorhanden, aber nicht rein digital positioniert."],
        innovation: [3.5, "Solide digitale Lernformate; Innovationsprofil wirkt eher pragmatisch als disruptiv."],
        reputation: [3.5, "Bekannte Marke im berufsbegleitenden Segment, aber mit begrenzterer öffentlicher und forschungsbezogener Reputation."],
        "cost-position": [3, "Private Studiengebühren erfordern klaren Nutzenbeleg für preissensible Gruppen."],
        differentiation: [4, "Klare Positionierung auf berufsbegleitendes Studieren und Praxisnähe."],
        channels: [4.5, "Starkes Standortnetz und Unternehmensnähe unterstützen Zugang und Vertrieb."],
        accreditation: [3.5, "Etablierter Hochschulbetrieb, aber Programm- und Qualitätssicherung bleiben stärker erklärungsbedürftig als bei öffentlichen Hochschulen."],
        compliance: [3.5, "Normale Compliance-Anforderungen für digitale und berufsbegleitende Angebote."],
        "foreign-provider-limits": [4, "Für eine deutsche Institution im Heimatmarkt geringe Einschränkungen."],
        "legal-stability": [4.5, "Deutschland bietet hohe rechtliche Planbarkeit."],
        "reg-process": [3.5, "Regulatorische Prozesse sind bekannt, aber für neue Angebote weiterhin ressourcenintensiv."],
        scalability: [3, "Standort- und personalbezogene Formate begrenzen internationale und digitale Skaleneffekte."],
        localization: [3.5, "Regionale Standorte erleichtern lokale Anpassung, internationale Übertragbarkeit ist begrenzter."],
        operations: [4, "Erfahrenes operatives Modell für berufsbegleitende Studiengänge."],
        "financial-viability": [3.5, "Private Gebührenmodelle können tragfähig sein, bleiben aber auslastungs- und preissensitiv."],
        "social-impact": [3.5, "Beitrag zur beruflichen Weiterbildung und Durchlässigkeit."],
        "opportunity-potential": [4, "Chancen durch Fachkräftemangel und lebenslanges Lernen."],
        "risk-load": [3.5, "Risiken durch Wettbewerb, Preisdruck und Konjunktursensitivität."],
        "risk-control": [3.5, "Risiken sind durch Portfolio- und Standortsteuerung kontrollierbar, aber nicht vollständig kompensiert."],
        "strategic-fit": [3.5, "Chancen passen klar zur berufsbegleitenden Ausrichtung, weniger stark zum öffentlichen Hochschulprofil."],
        "net-opportunity-risk": [3.5, "Chancen überwiegen moderat, bei spürbarem Wettbewerbs- und Preisdruck."]
      },
      chanceRisks: [
        { type: "Chance", text: "Weiterbildungsbedarf berufstätiger Zielgruppen steigt.", priority: "Hoch" },
        { type: "Chance", text: "Unternehmenskooperationen können Nachfrage stabilisieren.", priority: "Hoch" },
        { type: "Risiko", text: "Starker Wettbewerb durch Online-Hochschulen und internationale Plattformen.", priority: "Mittel" }
      ],
      sources: [
        { label: "Hochschulwebsite", status: "Demo-Daten / Platzhalter", note: "Studienmodell, Standorte, Programme" },
        { label: "Akkreditierungsinformationen", status: "Quellen manuell ergänzen", note: "Status einzelner Studiengänge" },
        { label: "Branchen- und Weiterbildungsberichte", status: "Quellen manuell ergänzen", note: "Nachfrage und Marktwachstum" }
      ]
    },
    "iu-internationale-hochschule": {
      name: "IU Internationale Hochschule",
      researchNotes: "Demo-Bewertung. Quellen zu Akkreditierung, Studierendenzahlen, Zufriedenheit und digitaler Qualität bitte manuell ergänzen.",
      comparisonNote: "IU punktet vor allem mit digitaler Skalierbarkeit, breiter Zielgruppenreichweite und flexiblen Studienformaten.",
      assessments: {
        "market-growth": [4.5, "Online- und Fernstudienmodelle profitieren von hoher Nachfrage nach flexibler Weiterbildung."],
        "market-size": [4.5, "Breite Zielgruppe durch Online-, Fern- und berufsbegleitende Angebote."],
        competition: [3, "Sehr attraktiver Markt mit entsprechend hoher Wettbewerbsintensität."],
        demand: [4, "Flexible Studienmodelle passen zu berufstätigen und ortsunabhängigen Zielgruppen."],
        "digital-access": [4.5, "Digitale Infrastruktur ist ein Kernbestandteil des Angebotsmodells."],
        innovation: [4.5, "Starke digitale Plattformorientierung und Skalierungslogik."],
        reputation: [3.5, "Hohe Bekanntheit; qualitative Wahrnehmung sollte quellenbasiert differenziert geprüft werden."],
        "cost-position": [4, "Skalierbare digitale Strukturen können Preis- und Kostenflexibilität ermöglichen."],
        differentiation: [4, "Klare Differenzierung über Flexibilität, Online-Zugang und Angebotsbreite."],
        channels: [4, "Digitale Akquise und Partnerkanäle unterstützen Reichweite."],
        accreditation: [4, "Etablierter Hochschulstatus; konkrete Programme einzeln prüfen."],
        compliance: [3.5, "Digitale Skalierung erhöht Datenschutz- und Prozessanforderungen."],
        "foreign-provider-limits": [4, "Im deutschen Heimatmarkt geringe Restriktionen; internationale Expansion separat prüfen."],
        "legal-stability": [4.5, "Hohe rechtliche Stabilität im Kernmarkt."],
        "reg-process": [4, "Regulatorische Prozesse sind aufwendig, aber für etablierte Anbieter beherrschbar."],
        scalability: [5, "Digitales Fernstudienmodell ist strukturell sehr skalierbar."],
        localization: [4.5, "Digitale Inhalte lassen sich modular an Zielgruppen und Märkte anpassen."],
        operations: [4, "Große digitale Betriebsorganisation erfordert starke Qualitätssteuerung."],
        "financial-viability": [4, "Skaleneffekte können attraktive Kostenstrukturen ermöglichen."],
        "social-impact": [3.5, "Flexibler Zugang stärkt Bildungsteilhabe, Qualität und Betreuung sind prüfkritisch."],
        "opportunity-potential": [4.5, "Große Chancen durch digitale Bildung und internationale Skalierbarkeit."],
        "risk-load": [3.5, "Reputations-, Qualitäts- und Regulierungsrisiken bleiben relevant."],
        "risk-control": [4, "Daten- und Qualitätssteuerung kann Risiken aktiv begrenzen."],
        "strategic-fit": [4.5, "Chancen passen sehr stark zum digitalen Geschäftsmodell."],
        "net-opportunity-risk": [4.5, "Chancenprofil überwiegt bei konsequenter Qualitätskontrolle."]
      },
      chanceRisks: [
        { type: "Chance", text: "Digitale Skalierung und breite Studiengangspalette ermöglichen schnelles Wachstum.", priority: "Sehr hoch" },
        { type: "Chance", text: "Internationale Zielgruppen können über Online-Modelle effizient erreicht werden.", priority: "Hoch" },
        { type: "Risiko", text: "Qualitätssicherung und Reputation sind bei starkem Wachstum kritisch.", priority: "Hoch" }
      ],
      sources: [
        { label: "Hochschulwebsite", status: "Demo-Daten / Platzhalter", note: "Fernstudium, Online-Angebote, Studiengänge" },
        { label: "Akkreditierungsdatenbanken", status: "Quellen manuell ergänzen", note: "Programmstatus und Qualitätssicherung" },
        { label: "Studierenden- und Marktberichte", status: "Quellen manuell ergänzen", note: "Größe, Wachstum, Zielgruppen" }
      ]
    },
    "fh-muenster": {
      name: "FH Münster",
      researchNotes: "Demo-Bewertung. Regionale Nachfrage, Drittmittel, Kooperationen und Studiengangsdaten bitte manuell ergänzen.",
      comparisonNote: "FH Münster profitiert von stärkerer institutioneller Reputation, günstiger Kostenstruktur, guter Akkreditierung und solider öffentlicher Verankerung.",
      assessments: {
        "market-growth": [4, "Angewandte Studienfelder profitieren von stabiler Nachfrage nach praxisnaher öffentlicher Hochschulbildung."],
        "market-size": [4, "Regionale, fachliche und öffentliche Zielgruppenbasis ist breit und institutionell gut verankert."],
        competition: [3.5, "Wettbewerb mit anderen HAWs und Universitäten, zugleich klare regionale Rolle."],
        demand: [3.5, "Solide Nachfrage; geringe direkte Studienkosten senken Eintrittsbarrieren für Zielgruppen."],
        "digital-access": [3.5, "Digitale Infrastruktur vorhanden, aber nicht der primäre Differenzierungsanker."],
        innovation: [4, "Anwendungsorientierte Lehre, Transfer und Forschung sorgen für ein solides Innovationsprofil."],
        reputation: [4.5, "Starke öffentliche und regionale Reputation mit verlässlicher institutioneller Verankerung."],
        "cost-position": [4.5, "Öffentliche Kostenstruktur und geringe Studiengebühren stärken Preisfähigkeit und Zugang."],
        differentiation: [4, "Praxisnähe, öffentlicher Auftrag und regionale Vernetzung differenzieren glaubwürdig."],
        channels: [4.5, "Starke regionale Unternehmens-, Praxis- und Transferpartner unterstützen Zugang und Wirkung."],
        accreditation: [4.5, "Öffentliche Hochschule mit etablierten Akkreditierungsprozessen."],
        compliance: [4.5, "Regulatorische Anforderungen sind institutionell und öffentlich verankert."],
        "foreign-provider-limits": [4.5, "Geringe Relevanz im Heimatmarkt; internationale Kooperationen sind organisatorisch anschlussfähig."],
        "legal-stability": [4.5, "Hohe Planbarkeit im öffentlichen Hochschulsystem."],
        "reg-process": [4, "Prozesse sind formal, aber vertraut und planbar."],
        scalability: [3.5, "Skalierung durch öffentliche Kapazitäten, Personal und Campusstrukturen begrenzt."],
        localization: [4, "Starke regionale Passung; Programme und Transferformate lassen sich gezielt an Zielgruppen anpassen."],
        operations: [4.5, "Operativ stabil durch etablierte öffentliche Hochschulstrukturen."],
        "financial-viability": [4, "Tragfähigkeit wird durch öffentliche Finanzierung, Kapazitätsplanung und Kooperationen gestützt."],
        "social-impact": [4.5, "Hoher gesellschaftlicher Nutzen durch regionale Fachkräftebildung und Bildungszugang."],
        "opportunity-potential": [4, "Chancen durch Fachkräftebedarf, regionale Kooperationen und Transferauftrag."],
        "risk-load": [4.5, "Risiken wirken moderat und durch öffentliche Einbindung gut beherrschbar."],
        "risk-control": [4.5, "Öffentliche Governance und Partnernetzwerke reduzieren Umsetzungsrisiken deutlich."],
        "strategic-fit": [4, "Chancen passen gut zu regionaler Praxisorientierung und öffentlichem Bildungsauftrag."],
        "net-opportunity-risk": [4, "Chancen überwiegen Risiken klar, ohne ein übermäßig aggressives Wachstumsprofil anzunehmen."]
      },
      chanceRisks: [
        { type: "Chance", text: "Regionale Fachkräftepartnerschaften können Profil und Nachfrage stärken.", priority: "Hoch" },
        { type: "Chance", text: "Anwendungsorientierte Forschung eröffnet Kooperationspotenzial.", priority: "Mittel" },
        { type: "Risiko", text: "Kapazitäts- und Finanzierungsgrenzen können Skalierung bremsen.", priority: "Mittel" }
      ],
      sources: [
        { label: "Hochschulwebsite", status: "Demo-Daten / Platzhalter", note: "Fachbereiche, Transfer, Kooperationen" },
        { label: "Landes- und Hochschulstatistik", status: "Quellen manuell ergänzen", note: "Studierendenzahlen, Finanzierung, Nachfrage" },
        { label: "Akkreditierungsberichte", status: "Quellen manuell ergänzen", note: "Programmqualität und Auflagen" }
      ]
    },
    "tu-dortmund": {
      name: "TU Dortmund",
      researchNotes: "Demo-Bewertung. Forschungsprofil, Studiennachfrage, Transferdaten und Akkreditierungsstatus bitte manuell ergänzen.",
      comparisonNote: "TU Dortmund ist besonders stark bei akademischer Reputation, MINT-Profil, Forschung und Transfer.",
      assessments: {
        "market-growth": [4, "Technik-, Daten- und Lehramtsfelder liegen in stabilen bis wachsenden Nachfragebereichen."],
        "market-size": [4, "Große Zielgruppe durch breites universitäres Studien- und Forschungsprofil."],
        competition: [3.5, "Starker Wettbewerb mit anderen technischen und forschungsstarken Universitäten."],
        demand: [3.5, "Solide Nachfrage, aber Zahlungsbereitschaft ist im öffentlichen Modell weniger relevant."],
        "digital-access": [3.5, "Digitale Angebote vorhanden; Präsenz- und Forschungsuniversität bleiben Kern."],
        innovation: [4, "Starke Forschungs- und Technikorientierung unterstützt Innovationsprofil."],
        reputation: [4.5, "Hohe akademische Sichtbarkeit in relevanten Fachbereichen."],
        "cost-position": [4, "Öffentliche Struktur sorgt für niedrige Zugangskosten für Studierende."],
        differentiation: [4, "Technisches Profil, Forschung und regionale Industrienähe differenzieren."],
        channels: [4, "Gute Anschlussfähigkeit an regionale Wirtschaft, Forschung und Transfer."],
        accreditation: [4.5, "Etablierte öffentliche Universität mit institutionellen Qualitätsprozessen."],
        compliance: [4, "Compliance-Anforderungen sind organisatorisch etabliert."],
        "foreign-provider-limits": [4, "Geringe Relevanz für den deutschen Heimatmarkt."],
        "legal-stability": [4.5, "Hohe politische und rechtliche Stabilität im Hochschulsystem."],
        "reg-process": [4, "Regulatorische Prozesse sind formal, aber eingespielt."],
        scalability: [3.5, "Forschungs- und Campusstrukturen begrenzen schnelle Skalierung."],
        localization: [3.5, "Internationale Programme skalierbar, aber curriculare Anpassung bleibt aufwendig."],
        operations: [4, "Große Universität mit etablierter Betriebsstruktur."],
        "financial-viability": [3.5, "Tragfähigkeit hängt von öffentlicher Finanzierung, Drittmitteln und Kapazitäten ab."],
        "social-impact": [4, "Hoher Impact durch Forschung, Lehrkräftebildung und regionale Fachkräfteentwicklung."],
        "opportunity-potential": [4, "Chancen durch MINT-Nachfrage, Transfer und Forschungskooperationen."],
        "risk-load": [4, "Risiken sind im öffentlichen System vergleichsweise kontrollierbar."],
        "risk-control": [4, "Governance, Erfahrung und Partnerschaften stützen Risikokontrolle."],
        "strategic-fit": [4, "Chancen passen gut zum technischen und regionalen Profil."],
        "net-opportunity-risk": [4, "Attraktives Chancen-Risiko-Verhältnis bei moderater Skalierungsgrenze."]
      },
      chanceRisks: [
        { type: "Chance", text: "MINT- und Transferprofil passt zu wachsender Nachfrage in Technologiebranchen.", priority: "Hoch" },
        { type: "Chance", text: "Regionale Industrie- und Forschungsnetzwerke stärken strategische Optionen.", priority: "Hoch" },
        { type: "Risiko", text: "Öffentliche Kapazitäts- und Finanzierungslogiken begrenzen schnelle Expansion.", priority: "Mittel" }
      ],
      sources: [
        { label: "Universitätswebsite", status: "Demo-Daten / Platzhalter", note: "Forschungsprofil, Studienangebote, Transfer" },
        { label: "Hochschulstatistik", status: "Quellen manuell ergänzen", note: "Studierendenzahlen und Nachfrage" },
        { label: "Akkreditierungs- und Qualitätsberichte", status: "Quellen manuell ergänzen", note: "Studiengangsstatus und Qualitätssicherung" }
      ]
    }
  };

  window.ScorecardData = {
    scoreValues,
    categories,
    recommendationBands,
    scoreGuide,
    manualTemplate,
    demos
  };
})();
