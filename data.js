(function () {
  "use strict";

  const scoreValues = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  const categories = [
    {
      id: "market",
      name: "Marktattraktivität",
      weight: 0.3,
      indicators: [
        {
          id: "market-growth",
          name: "Marktdynamik / Nachfrageentwicklung",
          weight: 0.25,
          analysis: "Abgeleitet aus Zielgruppenfit, Praxisnähe, Flexibilität und digitaler Reichweite."
        },
        {
          id: "market-size",
          name: "Marktgröße & Zielgruppenpotenzial",
          weight: 0.2,
          analysis: "Breite des adressierbaren Studien-, Weiterbildungs- und Partnersegments."
        },
        {
          id: "competition",
          name: "Wettbewerbsposition im Hochschulmarkt",
          weight: 0.2,
          analysis: "Positiv gedreht: 5 = starke, differenzierte Position trotz Wettbewerb."
        },
        {
          id: "demand",
          name: "Nachfrageprofile & Zahlungs-/Zugangsfähigkeit",
          weight: 0.15,
          analysis: "Kombiniert Nachfragepassung, Kosten-/Zugangshürden und berufsbegleitende Nutzbarkeit."
        },
        {
          id: "digital-access",
          name: "Digitale Infrastruktur & Zugang",
          weight: 0.2,
          analysis: "Digitale Skalierbarkeit, Online-Fähigkeit und flexible Erreichbarkeit."
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
          analysis: "Forschungsprofil, Transferorientierung und digitale Angebotslogik."
        },
        {
          id: "reputation",
          name: "Reputation & Vertrauenswürdigkeit",
          weight: 0.2,
          analysis: "Globale Rankings, nationale Exzellenz, qualitative Reputation und Quellenqualität."
        },
        {
          id: "cost-position",
          name: "Kostenstruktur & Preisfähigkeit",
          weight: 0.2,
          analysis: "Öffentliche Kostenzugänglichkeit bzw. private Preis-Leistungs-Plausibilität."
        },
        {
          id: "differentiation",
          name: "Differenzierung / Value Proposition",
          weight: 0.2,
          analysis: "Erkennbares Profil: Forschung, Praxis, Business, Online-Skalierung oder regionale Stärke."
        },
        {
          id: "channels",
          name: "Zugang zu Partnern, Zielgruppen & Kanälen",
          weight: 0.2,
          analysis: "Regionale/unternehmerische Netzwerke, internationale Sichtbarkeit und operative Reichweite."
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
          analysis: "Positiv gedreht: 5 = institutionell sehr stabile Zulassungs- und Qualitätssicherungsbasis."
        },
        {
          id: "compliance",
          name: "Datenschutz, Qualitätssicherung & Compliance",
          weight: 0.2,
          analysis: "Regulatorische Sicherheit und dokumentierte Daten-/Quellenqualität."
        },
        {
          id: "foreign-provider-limits",
          name: "Marktzugang / Anbieterrestriktionen",
          weight: 0.2,
          analysis: "Positiv gedreht: 5 = geringe Marktzugangshürden im deutschen Hochschulkontext."
        },
        {
          id: "legal-stability",
          name: "Politische und rechtliche Stabilität",
          weight: 0.2,
          analysis: "Planbarkeit durch öffentliche Einbettung, etablierte Trägerschaft und deutsches Hochschulrecht."
        },
        {
          id: "reg-process",
          name: "Dauer & Kosten regulatorischer Prozesse",
          weight: 0.15,
          analysis: "Positiv gedreht: 5 = Prozesse sind bekannt, gut dokumentiert und operationalisierbar."
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
          analysis: "Digitale Skalierbarkeit, Flexibilität und operative Übertragbarkeit."
        },
        {
          id: "localization",
          name: "Lokalisierungsfähigkeit",
          weight: 0.2,
          analysis: "Anpassbarkeit an regionale, berufliche, internationale oder digitale Zielgruppen."
        },
        {
          id: "operations",
          name: "Operative Umsetzbarkeit",
          weight: 0.2,
          analysis: "Praxisnähe, Governance, Quellenqualität und institutionelle Stabilität."
        },
        {
          id: "financial-viability",
          name: "Finanzielle Tragfähigkeit / Profitabilitätspotenzial",
          weight: 0.2,
          analysis: "Tragfähigkeit aus öffentlicher Stabilität, Skalierung, Reputation und Kostenposition."
        },
        {
          id: "social-impact",
          name: "Sozialer Impact & Nachhaltigkeit",
          weight: 0.15,
          analysis: "Bildungszugang, regionale Fachkräftewirkung, Praxisbezug und Kostenbarrieren."
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
          analysis: "Zusammenführung von Nachfrage, Reputation, Praxis- und Skalierungspotenzial."
        },
        {
          id: "risk-load",
          name: "Risikobelastung",
          weight: 0.25,
          analysis: "Positiv gedreht: 5 = geringe bzw. gut beherrschbare Risikobelastung."
        },
        {
          id: "risk-control",
          name: "Kontrollierbarkeit der Risiken",
          weight: 0.2,
          analysis: "Regulatorische Sicherheit, Quellenqualität und operative Stabilität."
        },
        {
          id: "strategic-fit",
          name: "Strategischer Fit der Chancen",
          weight: 0.15,
          analysis: "Passung der Chancen zum institutionellen Profil."
        },
        {
          id: "net-opportunity-risk",
          name: "Netto-Chancen-Risiko-Verhältnis",
          weight: 0.15,
          analysis: "Chancenpotenzial im Verhältnis zu regulatorischen, Kosten- und Qualitätsrisiken."
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

  const institutionTypeLabels = {
    university: "Universität",
    haw: "Hochschule für angewandte Wissenschaften",
    private: "private Hochschule",
    business: "Business School",
    online: "Fernhochschule / Online-Anbieter"
  };

  const ownershipLabels = {
    public: "öffentlich",
    private: "privat"
  };

  const sourceUrls = {
    qs: "https://www.topuniversities.com/world-university-rankings",
    the: "https://www.timeshighereducation.com/student/best-universities/best-universities-germany",
    che: "https://ranking.zeit.de/che/de/",
    daad: "https://www.daad.de/en/studying-in-germany/universities/",
    excellence: "https://www.dfg.de/en/research-funding/funding-initiative/excellence-strategy",
    mannheimRankings: "https://www.uni-mannheim.de/en/about/profile/rankings/",
    mannheimBusinessSchoolRankings: "https://www.bwl.uni-mannheim.de/en/about/about/rankings/",
    goetheWiwiRankings: "https://www.wiwi.uni-frankfurt.de/en/faculty/about-us/rankings",
    whuRankings: "https://www.whu.edu/en/about-whu/accreditations-rankings/",
    frankfurtSchoolRankings: "https://www.frankfurt-school.de/en/home/newsroom/rankings",
    esmt: "https://esmt.berlin/",
    hhlRankings: "https://www.hhl.de/accreditation-rankings/"
  };

  const methodology = {
    title: "Methodik und Datenbasis",
    summary: "Das Modell bewertet Hochschulen nicht als offizielle Rangliste, sondern als transparentes, erweiterbares Scoringmodell. Internationale Rankingdaten werden genutzt, wenn sie vorliegen; fehlende QS-/THE-Ränge werden nicht automatisch negativ bewertet, sondern durch institutionelle Proxy-Kriterien ersetzt.",
    sources: [
      {
        label: "QS World University Rankings 2026",
        url: sourceUrls.qs,
        note: "Internationale Sichtbarkeit und Reputationsproxy für global gerankte Universitäten."
      },
      {
        label: "Times Higher Education World University Rankings 2026",
        url: sourceUrls.the,
        note: "Ranking- und Deutschlandvergleich für global sichtbare Hochschulen."
      },
      {
        label: "CHE Ranking / DAAD",
        url: sourceUrls.che,
        note: "Methodische Referenz für deutsche Hochschulvergleiche, Studienorientierung und Fächerdifferenzierung."
      },
      {
        label: "Institutionelle Merkmale",
        url: sourceUrls.daad,
        note: "Hochschultyp, Trägerschaft, Praxisorientierung, Flexibilität, Kostenstruktur und regulatorische Sicherheit."
      }
    ],
    assumptions: [
      "QS-/THE-Ränge verbessern Reputation und internationale Sichtbarkeit, ersetzen aber keine fachliche Detailprüfung.",
      "Hochschulen ohne globale Rankings werden über faire Proxies bewertet: Praxisorientierung, Kosten-/Zugangsfähigkeit, Flexibilität, Skalierbarkeit, Trägerschaft und Quellenqualität.",
      "Öffentliche Hochschulen erhalten typischerweise hohe Werte bei regulatorischer Sicherheit und Kostenzugänglichkeit.",
      "Private, Business- und Online-Anbieter können bei Flexibilität, Zielgruppenfit und digitaler Skalierbarkeit stark sein, tragen aber oft höhere Preis- und Reputationsprüfungsrisiken.",
      "Alle Werte sind modellierte, quellenbasierte Arbeitshypothesen und müssen für Entscheidungen mit aktueller Primärrecherche überprüft werden."
    ]
  };

  const manualTemplate = {
    researchNotes: "",
    comparisonNote: "Dieses Profil nutzt neutrale Proxywerte, bis belastbare Quellen ergänzt werden.",
    facts: {
      institutionType: "university",
      ownership: "public",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 3,
      practiceOrientation: 3,
      internationality: 3,
      reputation: 3,
      costAccessibility: 3,
      digitalScalability: 3,
      workStudyFlexibility: 3,
      regulatorySecurity: 3,
      dataQuality: 1,
      studentDemand: 3,
      laborMarketValue: 3,
      networkStrength: 3,
      locationAdvantage: 3,
      subjectFit: 3,
      businessEconomicsStrength: 3,
      techResearchStrength: 3,
      careerOrientation: 3,
      prestigeTier: 4
    },
    chanceRisks: [
      { type: "Chance", text: "Quellenbasierte Chancenanalyse ergänzen.", priority: "Offen" },
      { type: "Risiko", text: "Quellenbasierte Risikoanalyse ergänzen.", priority: "Offen" }
    ],
    sources: [
      { label: "Hochschulwebsite", status: "Quellen können ergänzt werden", note: "Offizielle institutionelle Quelle ergänzen.", basis: "manuelle Recherche" },
      { label: "QS/THE Ranking", status: "Rankingstatus offen", note: "Rankingstatus ergänzen; fehlende Rankings nicht automatisch abwerten.", basis: "Rankingdaten" },
      { label: "CHE/DAAD", status: "methodische Referenz", note: "Für Fächer- und Studienangebotsvergleich ergänzen.", basis: "methodische Referenz" }
    ]
  };

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " und ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function ranking(value, numeric) {
    if (value === null || value === undefined) return null;
    return { rank: value, numeric: numeric || Number(value) || null };
  }

  function buildSources(row) {
    const qs = row.rankings.qsWorld2026;
    const the = row.rankings.theWorld2026;
    const sources = [
      {
        label: "QS World University Rankings 2026",
        status: qs ? "Rankingdaten vorhanden" : "kein globaler QS-WUR-Rang hinterlegt",
        note: qs ? `QS WUR 2026: Rang ${qs.rank}.` : "Fehlender globaler Rang wird nicht als negative Bewertung gewertet; Proxy-Kriterien übernehmen.",
        url: sourceUrls.qs,
        basis: qs ? "Rankingdaten" : "Rankingstatus / Proxylogik"
      },
      {
        label: "THE World University Rankings 2026",
        status: the ? "Rankingdaten vorhanden" : "kein globaler THE-WUR-Rang hinterlegt",
        note: the ? `THE WUR 2026: Rang ${the.rank}.` : "Fehlender globaler Rang wird nicht als negative Bewertung gewertet; Proxy-Kriterien übernehmen.",
        url: sourceUrls.the,
        basis: the ? "Rankingdaten" : "Rankingstatus / Proxylogik"
      },
      {
        label: "CHE Ranking / DAAD",
        status: "methodische Referenz",
        note: "Wird als Referenzlogik für deutschen Hochschulvergleich, Fächer- und Studienorientierung genutzt.",
        url: sourceUrls.che,
        basis: "methodische Quelle"
      },
      {
        label: "Exzellenzstrategie",
        status: row.excellenceUniversity ? "relevant" : "nicht als Exzellenzuniversität modelliert",
        note: row.excellenceUniversity ? "Exzellenzstatus stärkt Forschungs- und Reputationsproxy." : "Kein Exzellenzstatus hinterlegt; andere institutionelle Kriterien bleiben relevant.",
        url: sourceUrls.excellence,
        basis: "nationale Forschungsförderung"
      },
      {
        label: "Offizielle Hochschulwebsite",
        status: "institutionelle Quelle",
        note: row.officialWebsite || "Offizielle Quelle später ergänzen.",
        url: row.officialWebsite || "",
        basis: "institutionelle Recherche"
      }
    ];

    return sources.concat(row.extraSources || []);
  }

  function defaultChanceRisks(row) {
    const type = row.institutionType;
    const typeLabel = institutionTypeLabels[type];
    const publicRisk = row.ownership === "public"
      ? "Kapazitäts-, Finanzierungs- und Governancegrenzen können schnelle Skalierung bremsen."
      : "Preis-, Reputations- und Qualitätssicherungsrisiken müssen laufend belegt werden.";
    const chanceText = type === "online"
      ? "Digitale Reichweite und flexible Studienmodelle ermöglichen skalierbare Zielgruppenansprache."
      : type === "business"
        ? "Karriere-, Management- und Unternehmensnetzwerke stärken den Zielgruppenfit."
        : type === "haw"
          ? "Praxisnähe und regionale Arbeitgeberbezüge stärken Fachkräftewirkung und Nachfrage."
          : "Forschung, Reputation und internationale Sichtbarkeit eröffnen Kooperations- und Talentchancen.";

    return [
      { type: "Chance", text: chanceText, priority: "Hoch" },
      { type: "Chance", text: `${typeLabel} mit Profil "${row.focus}" bietet ein klares Differenzierungsfeld.`, priority: "Mittel" },
      { type: "Risiko", text: publicRisk, priority: "Mittel" }
    ];
  }

  function createInstitution(row) {
    const facts = {
      institutionType: row.institutionType,
      institutionTypeLabel: institutionTypeLabels[row.institutionType],
      ownership: row.ownership,
      ownershipLabel: ownershipLabels[row.ownership],
      rankings: row.rankings,
      excellenceUniversity: Boolean(row.excellenceUniversity),
      researchProfile: row.researchProfile,
      practiceOrientation: row.practiceOrientation,
      internationality: row.internationality,
      reputation: row.reputation,
      costAccessibility: row.costAccessibility,
      digitalScalability: row.digitalScalability,
      workStudyFlexibility: row.workStudyFlexibility,
      regulatorySecurity: row.regulatorySecurity,
      dataQuality: row.dataQuality,
      studentDemand: row.studentDemand ?? Math.min(5, (row.reputation * 0.34) + (row.practiceOrientation * 0.2) + (row.internationality * 0.18) + (row.costAccessibility * 0.12) + 0.5),
      laborMarketValue: row.laborMarketValue ?? Math.min(5, (row.reputation * 0.34) + (row.practiceOrientation * 0.24) + (row.researchProfile * 0.18) + (row.internationality * 0.12) + 0.45),
      networkStrength: row.networkStrength ?? Math.min(5, (row.reputation * 0.3) + (row.practiceOrientation * 0.22) + (row.internationality * 0.18) + (row.researchProfile * 0.12) + 0.45),
      locationAdvantage: row.locationAdvantage ?? 3.5,
      subjectFit: row.subjectFit ?? Math.max(row.researchProfile, row.practiceOrientation, row.reputation),
      businessEconomicsStrength: row.businessEconomicsStrength ?? (row.institutionType === "business" ? row.reputation : 3),
      techResearchStrength: row.techResearchStrength ?? (row.focus && /Technik|Ingenieur|MINT|KI|Informatik|Großforschung/i.test(row.focus) ? Math.max(row.researchProfile, row.practiceOrientation) : row.researchProfile),
      careerOrientation: row.careerOrientation ?? Math.min(5, (row.practiceOrientation * 0.36) + (row.reputation * 0.24) + (row.workStudyFlexibility * 0.18) + (row.internationality * 0.1) + 0.45),
      prestigeTier: row.prestigeTier ?? (row.excellenceUniversity ? 1 : row.rankings.qsWorld2026 || row.rankings.theWorld2026 ? 2 : row.institutionType === "haw" ? 4 : 3),
      focus: row.focus
    };

    return {
      name: row.name,
      aliases: row.aliases || [],
      isProfile: true,
      facts,
      comparisonNote: row.comparisonNote || `${row.name} wird über ${facts.institutionTypeLabel}, ${facts.ownershipLabel}e Trägerschaft, Ranking-/Proxyfelder und Quellenqualität bewertet.`,
      researchNotes: row.researchNotes || "",
      chanceRisks: row.chanceRisks || defaultChanceRisks(row),
      sources: buildSources(row)
    };
  }

  const institutionRows = [
    {
      name: "Technische Universität München",
      aliases: ["Technical University of Munich", "TUM"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.tum.de/",
      rankings: { qsWorld2026: ranking(22), theWorld2026: ranking(27) },
      excellenceUniversity: true,
      researchProfile: 5,
      practiceOrientation: 4.6,
      internationality: 4.8,
      reputation: 5,
      costAccessibility: 4.7,
      digitalScalability: 3.6,
      workStudyFlexibility: 3.1,
      regulatorySecurity: 4.8,
      dataQuality: 5,
      studentDemand: 5,
      laborMarketValue: 5,
      networkStrength: 5,
      locationAdvantage: 4.8,
      subjectFit: 5,
      businessEconomicsStrength: 4.3,
      techResearchStrength: 5,
      careerOrientation: 4.9,
      prestigeTier: 1,
      focus: "Technik, Forschung, Entrepreneurship und internationale Sichtbarkeit"
    },
    {
      name: "Ludwig-Maximilians-Universität München",
      aliases: ["LMU Munich", "LMU München"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.lmu.de/",
      rankings: { qsWorld2026: ranking(58), theWorld2026: ranking(34) },
      excellenceUniversity: true,
      researchProfile: 5,
      practiceOrientation: 3.9,
      internationality: 4.6,
      reputation: 5,
      costAccessibility: 4.7,
      digitalScalability: 3.3,
      workStudyFlexibility: 2.9,
      regulatorySecurity: 4.8,
      dataQuality: 5,
      studentDemand: 4.9,
      laborMarketValue: 4.8,
      networkStrength: 4.8,
      locationAdvantage: 4.8,
      subjectFit: 4.8,
      businessEconomicsStrength: 4.3,
      techResearchStrength: 4.4,
      careerOrientation: 4.6,
      prestigeTier: 1,
      focus: "breite Volluniversität, Forschung und internationale Reputation"
    },
    {
      name: "Universität Heidelberg",
      aliases: ["Heidelberg University", "Ruprecht-Karls-Universität Heidelberg"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.uni-heidelberg.de/",
      rankings: { qsWorld2026: ranking(80), theWorld2026: ranking(49) },
      excellenceUniversity: true,
      researchProfile: 5,
      practiceOrientation: 3.7,
      internationality: 4.5,
      reputation: 4.9,
      costAccessibility: 4.7,
      digitalScalability: 3.2,
      workStudyFlexibility: 2.8,
      regulatorySecurity: 4.8,
      dataQuality: 5,
      studentDemand: 4.8,
      laborMarketValue: 4.7,
      networkStrength: 4.7,
      locationAdvantage: 4.3,
      subjectFit: 4.8,
      businessEconomicsStrength: 3.8,
      techResearchStrength: 4.4,
      careerOrientation: 4.5,
      prestigeTier: 1,
      focus: "forschungsstarke Volluniversität mit hoher internationaler Reputation"
    },
    {
      name: "Humboldt-Universität zu Berlin",
      aliases: ["Humboldt University of Berlin", "HU Berlin"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.hu-berlin.de/",
      rankings: { qsWorld2026: ranking(130), theWorld2026: ranking(89) },
      excellenceUniversity: true,
      researchProfile: 4.7,
      practiceOrientation: 3.5,
      internationality: 4.4,
      reputation: 4.7,
      costAccessibility: 4.7,
      digitalScalability: 3.2,
      workStudyFlexibility: 2.8,
      regulatorySecurity: 4.8,
      dataQuality: 4.9,
      studentDemand: 4.6,
      laborMarketValue: 4.5,
      networkStrength: 4.6,
      locationAdvantage: 4.8,
      subjectFit: 4.6,
      businessEconomicsStrength: 4.0,
      techResearchStrength: 4.1,
      careerOrientation: 4.4,
      prestigeTier: 1,
      focus: "Berliner Forschungsprofil, Geistes-/Sozialwissenschaften und internationale Sichtbarkeit"
    },
    {
      name: "Freie Universität Berlin",
      aliases: ["Free University of Berlin", "FU Berlin"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.fu-berlin.de/",
      rankings: { qsWorld2026: ranking(88), theWorld2026: ranking(113) },
      excellenceUniversity: true,
      researchProfile: 4.7,
      practiceOrientation: 3.5,
      internationality: 4.5,
      reputation: 4.7,
      costAccessibility: 4.7,
      digitalScalability: 3.2,
      workStudyFlexibility: 2.8,
      regulatorySecurity: 4.8,
      dataQuality: 4.9,
      studentDemand: 4.6,
      laborMarketValue: 4.5,
      networkStrength: 4.6,
      locationAdvantage: 4.8,
      subjectFit: 4.6,
      businessEconomicsStrength: 4.0,
      techResearchStrength: 4.1,
      careerOrientation: 4.4,
      prestigeTier: 1,
      focus: "Forschung, internationale Kooperation und Berliner Hochschulverbund"
    },
    {
      name: "RWTH Aachen University",
      aliases: ["Rheinisch-Westfälische Technische Hochschule Aachen", "RWTH Aachen"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.rwth-aachen.de/",
      rankings: { qsWorld2026: ranking(105), theWorld2026: ranking(92) },
      excellenceUniversity: true,
      researchProfile: 4.8,
      practiceOrientation: 4.7,
      internationality: 4.3,
      reputation: 4.7,
      costAccessibility: 4.7,
      digitalScalability: 3.5,
      workStudyFlexibility: 3.0,
      regulatorySecurity: 4.8,
      dataQuality: 4.9,
      studentDemand: 4.8,
      laborMarketValue: 5,
      networkStrength: 4.8,
      locationAdvantage: 4.2,
      subjectFit: 4.8,
      businessEconomicsStrength: 3.9,
      techResearchStrength: 5,
      careerOrientation: 4.8,
      prestigeTier: 1,
      focus: "Ingenieurwissenschaften, Industriebezug und Transfer"
    },
    {
      name: "Karlsruhe Institute of Technology",
      aliases: ["KIT", "Karlsruher Institut für Technologie"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.kit.edu/",
      rankings: { qsWorld2026: ranking(98), theWorld2026: ranking(166) },
      excellenceUniversity: true,
      researchProfile: 4.7,
      practiceOrientation: 4.5,
      internationality: 4.2,
      reputation: 4.6,
      costAccessibility: 4.7,
      digitalScalability: 3.5,
      workStudyFlexibility: 3.0,
      regulatorySecurity: 4.8,
      dataQuality: 4.9,
      studentDemand: 4.7,
      laborMarketValue: 4.8,
      networkStrength: 4.6,
      locationAdvantage: 4.2,
      subjectFit: 4.7,
      businessEconomicsStrength: 3.8,
      techResearchStrength: 4.9,
      careerOrientation: 4.7,
      prestigeTier: 1,
      focus: "Technik, Großforschung, Transfer und Industrieanschluss"
    },
    {
      name: "Universität Bonn",
      aliases: ["University of Bonn", "Rheinische Friedrich-Wilhelms-Universität Bonn"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.uni-bonn.de/",
      rankings: { qsWorld2026: ranking(207), theWorld2026: ranking(92) },
      excellenceUniversity: true,
      researchProfile: 4.8,
      practiceOrientation: 3.7,
      internationality: 4.2,
      reputation: 4.6,
      costAccessibility: 4.7,
      digitalScalability: 3.2,
      workStudyFlexibility: 2.8,
      regulatorySecurity: 4.8,
      dataQuality: 4.9,
      studentDemand: 4.6,
      laborMarketValue: 4.6,
      networkStrength: 4.5,
      locationAdvantage: 4.2,
      subjectFit: 4.6,
      businessEconomicsStrength: 4.2,
      techResearchStrength: 4.4,
      careerOrientation: 4.5,
      prestigeTier: 1,
      focus: "Exzellenzcluster, Forschung und breite Volluniversität"
    },
    {
      name: "Universität Tübingen",
      aliases: ["University of Tübingen", "Eberhard Karls Universität Tübingen"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://uni-tuebingen.de/",
      rankings: { qsWorld2026: ranking(215), theWorld2026: ranking(98) },
      excellenceUniversity: true,
      researchProfile: 4.7,
      practiceOrientation: 3.7,
      internationality: 4.2,
      reputation: 4.5,
      costAccessibility: 4.7,
      digitalScalability: 3.2,
      workStudyFlexibility: 2.8,
      regulatorySecurity: 4.8,
      dataQuality: 4.8,
      focus: "Forschung, Medizin, KI und internationale Sichtbarkeit"
    },
    {
      name: "Universität Freiburg",
      aliases: ["University of Freiburg", "Albert-Ludwigs-Universität Freiburg"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.uni-freiburg.de/",
      rankings: { qsWorld2026: ranking(201), theWorld2026: ranking(138) },
      excellenceUniversity: false,
      researchProfile: 4.5,
      practiceOrientation: 3.6,
      internationality: 4.2,
      reputation: 4.4,
      costAccessibility: 4.7,
      digitalScalability: 3.1,
      workStudyFlexibility: 2.8,
      regulatorySecurity: 4.7,
      dataQuality: 4.8,
      focus: "traditionsreiche Volluniversität, Forschung und Nachhaltigkeit"
    },
    {
      name: "Universität Göttingen",
      aliases: ["University of Göttingen", "Georg-August-Universität Göttingen"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.uni-goettingen.de/",
      rankings: { qsWorld2026: ranking(243), theWorld2026: ranking(122) },
      excellenceUniversity: false,
      researchProfile: 4.4,
      practiceOrientation: 3.5,
      internationality: 4.1,
      reputation: 4.4,
      costAccessibility: 4.7,
      digitalScalability: 3.1,
      workStudyFlexibility: 2.8,
      regulatorySecurity: 4.7,
      dataQuality: 4.7,
      focus: "breite Forschungsuniversität und internationale Wissenschaftstradition"
    },
    {
      name: "Universität Hamburg",
      aliases: ["University of Hamburg"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.uni-hamburg.de/",
      rankings: { qsWorld2026: ranking(193), theWorld2026: ranking(125) },
      excellenceUniversity: true,
      researchProfile: 4.5,
      practiceOrientation: 3.7,
      internationality: 4.0,
      reputation: 4.4,
      costAccessibility: 4.7,
      digitalScalability: 3.2,
      workStudyFlexibility: 2.9,
      regulatorySecurity: 4.8,
      dataQuality: 4.8,
      focus: "Metropolstandort, Forschung, Klima/Strukturwandel und internationale Sichtbarkeit"
    },
    {
      name: "Technische Universität Berlin",
      aliases: ["Technical University of Berlin", "TU Berlin"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.tu.berlin/",
      rankings: { qsWorld2026: ranking(145), theWorld2026: ranking(160) },
      excellenceUniversity: true,
      researchProfile: 4.4,
      practiceOrientation: 4.3,
      internationality: 4.2,
      reputation: 4.4,
      costAccessibility: 4.7,
      digitalScalability: 3.5,
      workStudyFlexibility: 3.0,
      regulatorySecurity: 4.8,
      dataQuality: 4.8,
      focus: "Technik, Berlin-Standort, Startups und Industrieanschluss"
    },
    {
      name: "Universität zu Köln",
      aliases: ["University of Cologne"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.uni-koeln.de/",
      rankings: { qsWorld2026: ranking(272), theWorld2026: ranking(164) },
      excellenceUniversity: false,
      researchProfile: 4.2,
      practiceOrientation: 3.8,
      internationality: 4.0,
      reputation: 4.2,
      costAccessibility: 4.7,
      digitalScalability: 3.2,
      workStudyFlexibility: 2.9,
      regulatorySecurity: 4.7,
      dataQuality: 4.7,
      focus: "große Volluniversität, Wirtschafts-/Sozialwissenschaften und Metropolregion"
    },
    {
      name: "Technische Universität Dresden",
      aliases: ["TU Dresden"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://tu-dresden.de/",
      rankings: { qsWorld2026: ranking(218), theWorld2026: ranking(174) },
      excellenceUniversity: true,
      researchProfile: 4.5,
      practiceOrientation: 4.2,
      internationality: 4.0,
      reputation: 4.3,
      costAccessibility: 4.7,
      digitalScalability: 3.4,
      workStudyFlexibility: 3.0,
      regulatorySecurity: 4.8,
      dataQuality: 4.8,
      focus: "Exzellenzuniversität, Technik, Forschung und regionale Transformation"
    },
    {
      name: "Friedrich-Alexander-Universität Erlangen-Nürnberg",
      aliases: ["FAU Erlangen-Nürnberg", "Universität Erlangen-Nürnberg"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.fau.de/",
      rankings: { qsWorld2026: ranking(232), theWorld2026: ranking("201-250", 225) },
      excellenceUniversity: false,
      researchProfile: 4.3,
      practiceOrientation: 4.0,
      internationality: 3.9,
      reputation: 4.2,
      costAccessibility: 4.7,
      digitalScalability: 3.3,
      workStudyFlexibility: 2.9,
      regulatorySecurity: 4.7,
      dataQuality: 4.7,
      focus: "Technik, Medizin, Metropolregion Nürnberg und Transfer"
    },
    {
      name: "Universität Würzburg",
      aliases: ["University of Würzburg", "Julius-Maximilians-Universität Würzburg"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.uni-wuerzburg.de/",
      rankings: { qsWorld2026: ranking(416), theWorld2026: ranking(179) },
      excellenceUniversity: false,
      researchProfile: 4.2,
      practiceOrientation: 3.5,
      internationality: 3.8,
      reputation: 4.1,
      costAccessibility: 4.7,
      digitalScalability: 3.0,
      workStudyFlexibility: 2.7,
      regulatorySecurity: 4.7,
      dataQuality: 4.6,
      focus: "traditionsreiche Forschungsuniversität, Medizin und Naturwissenschaften"
    },
    {
      name: "Universität Münster",
      aliases: ["University of Münster", "WWU Münster"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.uni-muenster.de/",
      rankings: { qsWorld2026: ranking(350), theWorld2026: ranking(195) },
      excellenceUniversity: false,
      researchProfile: 4.2,
      practiceOrientation: 3.7,
      internationality: 3.8,
      reputation: 4.1,
      costAccessibility: 4.7,
      digitalScalability: 3.0,
      workStudyFlexibility: 2.8,
      regulatorySecurity: 4.7,
      dataQuality: 4.6,
      focus: "große Volluniversität, Forschung und regionale Verankerung"
    },
    {
      name: "Universität Mannheim",
      aliases: ["University of Mannheim"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.uni-mannheim.de/",
      rankings: { qsWorld2026: ranking(416), theWorld2026: ranking("201-250", 225) },
      excellenceUniversity: false,
      researchProfile: 4.5,
      practiceOrientation: 4.4,
      internationality: 4.4,
      reputation: 4.8,
      costAccessibility: 4.6,
      digitalScalability: 3.4,
      workStudyFlexibility: 3.2,
      regulatorySecurity: 4.7,
      dataQuality: 4.8,
      studentDemand: 4.8,
      laborMarketValue: 4.9,
      networkStrength: 4.8,
      locationAdvantage: 4.2,
      subjectFit: 5,
      businessEconomicsStrength: 5,
      techResearchStrength: 3.6,
      careerOrientation: 4.8,
      prestigeTier: 1.5,
      focus: "Wirtschafts- und Sozialwissenschaften, Managementreputation und Internationalität",
      extraSources: [
        {
          label: "Universität Mannheim Rankings",
          status: "fachliche Reputationsquelle",
          note: "Mannheim wird wegen starker Business-, Economics- und Social-Sciences-Signale höher kalibriert.",
          url: sourceUrls.mannheimRankings,
          basis: "offizielle Rankingübersicht"
        },
        {
          label: "Mannheim Business School / Area Business Administration Rankings",
          status: "Business-/Managementprofil",
          note: "Stützt die starke fachliche Business- und Managementposition im Modell.",
          url: sourceUrls.mannheimBusinessSchoolRankings,
          basis: "offizielle Rankingübersicht"
        }
      ]
    },
    {
      name: "Goethe-Universität Frankfurt am Main",
      aliases: ["Goethe University Frankfurt", "Universität Frankfurt"],
      institutionType: "university",
      ownership: "public",
      officialWebsite: "https://www.uni-frankfurt.de/",
      rankings: { qsWorld2026: ranking(316), theWorld2026: ranking("201-250", 225) },
      excellenceUniversity: false,
      researchProfile: 4.4,
      practiceOrientation: 4.1,
      internationality: 4.2,
      reputation: 4.5,
      costAccessibility: 4.6,
      digitalScalability: 3.3,
      workStudyFlexibility: 3.0,
      regulatorySecurity: 4.7,
      dataQuality: 4.7,
      studentDemand: 4.6,
      laborMarketValue: 4.7,
      networkStrength: 4.7,
      locationAdvantage: 5,
      subjectFit: 4.6,
      businessEconomicsStrength: 4.6,
      techResearchStrength: 4.1,
      careerOrientation: 4.6,
      prestigeTier: 2,
      focus: "Metropolstandort Frankfurt, Forschung, Wirtschaft und internationale Zielgruppen",
      extraSources: [
        {
          label: "Goethe-Universität Wirtschaftswissenschaften Rankings",
          status: "fachliche Reputationsquelle",
          note: "Stützt die stärkere Kalibrierung für Wirtschaft, Finance, Arbeitsmarktwert und Frankfurt-Netzwerk.",
          url: sourceUrls.goetheWiwiRankings,
          basis: "offizielle Fachbereichsübersicht"
        }
      ]
    },
    {
      name: "FH Münster",
      aliases: ["Fachhochschule Münster"],
      institutionType: "haw",
      ownership: "public",
      officialWebsite: "https://www.fh-muenster.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 3.4,
      practiceOrientation: 4.8,
      internationality: 3.3,
      reputation: 4.0,
      costAccessibility: 4.8,
      digitalScalability: 3.5,
      workStudyFlexibility: 3.6,
      regulatorySecurity: 4.7,
      dataQuality: 4.1,
      studentDemand: 4.0,
      laborMarketValue: 4.0,
      networkStrength: 4.0,
      locationAdvantage: 3.7,
      subjectFit: 4.2,
      businessEconomicsStrength: 3.0,
      techResearchStrength: 3.6,
      careerOrientation: 4.2,
      prestigeTier: 4,
      focus: "Praxisnähe, Transfer, regionale Arbeitgeberbezüge und öffentliche Kostenzugänglichkeit",
      comparisonNote: "FH Münster soll im Modell vor allem durch öffentliche Verankerung, Praxisnähe, geringe Kostenbarrieren und stabile Regulierung gegenüber privaten berufsbegleitenden Anbietern tragfähig abschneiden."
    },
    {
      name: "Hochschule München",
      aliases: ["Munich University of Applied Sciences", "HM"],
      institutionType: "haw",
      ownership: "public",
      officialWebsite: "https://www.hm.edu/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 3.4,
      practiceOrientation: 4.7,
      internationality: 3.4,
      reputation: 4.0,
      costAccessibility: 4.8,
      digitalScalability: 3.5,
      workStudyFlexibility: 3.5,
      regulatorySecurity: 4.7,
      dataQuality: 4.0,
      focus: "Praxisorientierung, München-Standort und angewandte Studienfelder"
    },
    {
      name: "TH Köln",
      aliases: ["Technische Hochschule Köln"],
      institutionType: "haw",
      ownership: "public",
      officialWebsite: "https://www.th-koeln.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 3.3,
      practiceOrientation: 4.6,
      internationality: 3.5,
      reputation: 3.9,
      costAccessibility: 4.8,
      digitalScalability: 3.5,
      workStudyFlexibility: 3.5,
      regulatorySecurity: 4.7,
      dataQuality: 4.0,
      focus: "große HAW, Praxisnähe, Transfer und Metropolregion Köln"
    },
    {
      name: "HTW Berlin",
      aliases: ["Hochschule für Technik und Wirtschaft Berlin"],
      institutionType: "haw",
      ownership: "public",
      officialWebsite: "https://www.htw-berlin.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 3.2,
      practiceOrientation: 4.5,
      internationality: 3.4,
      reputation: 3.8,
      costAccessibility: 4.8,
      digitalScalability: 3.6,
      workStudyFlexibility: 3.6,
      regulatorySecurity: 4.7,
      dataQuality: 4.0,
      focus: "Technik, Wirtschaft, Berlin-Standort und angewandte Lehre"
    },
    {
      name: "Frankfurt University of Applied Sciences",
      aliases: ["Frankfurt UAS"],
      institutionType: "haw",
      ownership: "public",
      officialWebsite: "https://www.frankfurt-university.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 3.1,
      practiceOrientation: 4.4,
      internationality: 3.6,
      reputation: 3.7,
      costAccessibility: 4.8,
      digitalScalability: 3.4,
      workStudyFlexibility: 3.6,
      regulatorySecurity: 4.7,
      dataQuality: 3.9,
      focus: "Metropolregion Frankfurt, Internationalität und angewandte Studienfelder"
    },
    {
      name: "Hochschule Bonn-Rhein-Sieg",
      aliases: ["H-BRS"],
      institutionType: "haw",
      ownership: "public",
      officialWebsite: "https://www.h-brs.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 3.1,
      practiceOrientation: 4.4,
      internationality: 3.2,
      reputation: 3.7,
      costAccessibility: 4.8,
      digitalScalability: 3.4,
      workStudyFlexibility: 3.5,
      regulatorySecurity: 4.7,
      dataQuality: 3.9,
      focus: "regionale Fachkräftebildung, angewandte Forschung und Transfer"
    },
    {
      name: "Hochschule Darmstadt",
      aliases: ["h_da", "Darmstadt University of Applied Sciences"],
      institutionType: "haw",
      ownership: "public",
      officialWebsite: "https://h-da.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 3.2,
      practiceOrientation: 4.5,
      internationality: 3.2,
      reputation: 3.8,
      costAccessibility: 4.8,
      digitalScalability: 3.6,
      workStudyFlexibility: 3.6,
      regulatorySecurity: 4.7,
      dataQuality: 3.9,
      focus: "angewandte Informatik, Technik, Medien und regionale Praxisbezüge"
    },
    {
      name: "Hochschule Karlsruhe",
      aliases: ["HKA", "Karlsruhe University of Applied Sciences"],
      institutionType: "haw",
      ownership: "public",
      officialWebsite: "https://www.h-ka.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 3.2,
      practiceOrientation: 4.5,
      internationality: 3.2,
      reputation: 3.8,
      costAccessibility: 4.8,
      digitalScalability: 3.5,
      workStudyFlexibility: 3.5,
      regulatorySecurity: 4.7,
      dataQuality: 3.9,
      focus: "Technik, angewandte Forschung und regionale Industriebezüge"
    },
    {
      name: "Hochschule Osnabrück",
      aliases: ["Osnabrück University of Applied Sciences"],
      institutionType: "haw",
      ownership: "public",
      officialWebsite: "https://www.hs-osnabrueck.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 3.1,
      practiceOrientation: 4.4,
      internationality: 3.1,
      reputation: 3.7,
      costAccessibility: 4.8,
      digitalScalability: 3.4,
      workStudyFlexibility: 3.5,
      regulatorySecurity: 4.7,
      dataQuality: 3.9,
      focus: "Praxisnähe, regionale Wirtschaft und angewandte Studienfelder"
    },
    {
      name: "Hochschule Bremen",
      aliases: ["Bremen University of Applied Sciences"],
      institutionType: "haw",
      ownership: "public",
      officialWebsite: "https://www.hs-bremen.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 3.0,
      practiceOrientation: 4.3,
      internationality: 3.5,
      reputation: 3.6,
      costAccessibility: 4.8,
      digitalScalability: 3.3,
      workStudyFlexibility: 3.5,
      regulatorySecurity: 4.7,
      dataQuality: 3.8,
      focus: "Internationalität, angewandte Lehre und regionale Fachkräftebezüge"
    },
    {
      name: "FOM Hochschule",
      aliases: ["FOM"],
      institutionType: "private",
      ownership: "private",
      officialWebsite: "https://www.fom.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 2.3,
      practiceOrientation: 4.3,
      internationality: 2.8,
      reputation: 3.3,
      costAccessibility: 2.8,
      digitalScalability: 3.7,
      workStudyFlexibility: 4.7,
      regulatorySecurity: 3.8,
      dataQuality: 3.4,
      studentDemand: 3.9,
      laborMarketValue: 3.8,
      networkStrength: 3.7,
      locationAdvantage: 3.8,
      subjectFit: 3.7,
      businessEconomicsStrength: 3.5,
      techResearchStrength: 2.5,
      careerOrientation: 4.2,
      prestigeTier: 4,
      focus: "berufsbegleitendes Studium, Unternehmensnähe und Standortnetz",
      comparisonNote: "FOM ist stark bei berufsbegleitender Flexibilität und Zielgruppenfit, wird aber gegenüber öffentlichen HAWs durch höhere Kostenbarrieren und geringere Forschungs-/Rankingdaten begrenzt."
    },
    {
      name: "IU Internationale Hochschule",
      aliases: ["IU International University", "IU"],
      institutionType: "online",
      ownership: "private",
      officialWebsite: "https://www.iu.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 2.2,
      practiceOrientation: 4.1,
      internationality: 3.3,
      reputation: 3.2,
      costAccessibility: 3.0,
      digitalScalability: 5,
      workStudyFlexibility: 5,
      regulatorySecurity: 3.8,
      dataQuality: 3.4,
      studentDemand: 4.0,
      laborMarketValue: 3.7,
      networkStrength: 3.4,
      locationAdvantage: 3.4,
      subjectFit: 3.5,
      businessEconomicsStrength: 3.1,
      techResearchStrength: 2.4,
      careerOrientation: 4.0,
      prestigeTier: 4,
      focus: "digital skalierbare Fern- und Online-Studienmodelle"
    },
    {
      name: "WHU - Otto Beisheim School of Management",
      aliases: ["WHU", "WHU Otto Beisheim"],
      institutionType: "business",
      ownership: "private",
      officialWebsite: "https://www.whu.edu/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 4.0,
      practiceOrientation: 4.8,
      internationality: 4.6,
      reputation: 4.8,
      costAccessibility: 2.2,
      digitalScalability: 3.4,
      workStudyFlexibility: 3.7,
      regulatorySecurity: 3.8,
      dataQuality: 4.4,
      studentDemand: 4.6,
      laborMarketValue: 4.8,
      networkStrength: 4.7,
      locationAdvantage: 3.8,
      subjectFit: 4.8,
      businessEconomicsStrength: 5,
      techResearchStrength: 3.5,
      careerOrientation: 4.9,
      prestigeTier: 2.5,
      focus: "Managementausbildung, Karriereorientierung und internationale Business-Zielgruppen",
      extraSources: [
        {
          label: "WHU Akkreditierungen & Rankings",
          status: "Business-School-Reputationsquelle",
          note: "FT- und Business-School-Rankings stützen Karriere-, Netzwerk- und Managementprofil.",
          url: sourceUrls.whuRankings,
          basis: "offizielle Rankingübersicht"
        }
      ]
    },
    {
      name: "Frankfurt School of Finance & Management",
      aliases: ["Frankfurt School"],
      institutionType: "business",
      ownership: "private",
      officialWebsite: "https://www.frankfurt-school.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 4.1,
      practiceOrientation: 4.8,
      internationality: 4.6,
      reputation: 4.7,
      costAccessibility: 2.2,
      digitalScalability: 3.6,
      workStudyFlexibility: 4.0,
      regulatorySecurity: 3.8,
      dataQuality: 4.4,
      studentDemand: 4.5,
      laborMarketValue: 4.7,
      networkStrength: 4.8,
      locationAdvantage: 5,
      subjectFit: 4.8,
      businessEconomicsStrength: 4.8,
      techResearchStrength: 3.6,
      careerOrientation: 4.8,
      prestigeTier: 2.5,
      focus: "Finance, Management, Executive Education und Unternehmensnetzwerke",
      extraSources: [
        {
          label: "Frankfurt School Rankings",
          status: "Business-/Finance-Reputationsquelle",
          note: "Stützt die stärkere Kalibrierung bei Finance, Management, Karrierewert und Frankfurt-Netzwerken.",
          url: sourceUrls.frankfurtSchoolRankings,
          basis: "offizielle Rankingübersicht"
        }
      ]
    },
    {
      name: "ESMT Berlin",
      aliases: ["European School of Management and Technology"],
      institutionType: "business",
      ownership: "private",
      officialWebsite: "https://esmt.berlin/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 4.0,
      practiceOrientation: 4.7,
      internationality: 4.7,
      reputation: 4.6,
      costAccessibility: 2.1,
      digitalScalability: 3.6,
      workStudyFlexibility: 3.9,
      regulatorySecurity: 3.8,
      dataQuality: 4.3,
      studentDemand: 4.4,
      laborMarketValue: 4.6,
      networkStrength: 4.5,
      locationAdvantage: 4.8,
      subjectFit: 4.6,
      businessEconomicsStrength: 4.6,
      techResearchStrength: 3.5,
      careerOrientation: 4.6,
      prestigeTier: 2.5,
      focus: "internationale Managementausbildung, Berlin-Standort und Executive-Zielgruppen",
      extraSources: [
        {
          label: "ESMT Berlin",
          status: "Business-School-Reputationsquelle",
          note: "Stützt die stärkere Kalibrierung bei internationaler Managementausbildung und Executive-Zielgruppen.",
          url: sourceUrls.esmt,
          basis: "offizielle Hochschulquelle"
        }
      ]
    },
    {
      name: "HHL Leipzig Graduate School of Management",
      aliases: ["HHL Leipzig", "HHL"],
      institutionType: "business",
      ownership: "private",
      officialWebsite: "https://www.hhl.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 3.7,
      practiceOrientation: 4.6,
      internationality: 4.2,
      reputation: 4.3,
      costAccessibility: 2.2,
      digitalScalability: 3.3,
      workStudyFlexibility: 3.8,
      regulatorySecurity: 3.8,
      dataQuality: 4.1,
      studentDemand: 4.2,
      laborMarketValue: 4.4,
      networkStrength: 4.3,
      locationAdvantage: 3.8,
      subjectFit: 4.4,
      businessEconomicsStrength: 4.4,
      techResearchStrength: 3.3,
      careerOrientation: 4.5,
      prestigeTier: 3,
      focus: "Management, Entrepreneurship und Karriereorientierung",
      extraSources: [
        {
          label: "HHL Akkreditierung & Rankings",
          status: "Business-School-Reputationsquelle",
          note: "Stützt die Business-School- und Entrepreneurship-Kalibrierung.",
          url: sourceUrls.hhlRankings,
          basis: "offizielle Rankingübersicht"
        }
      ]
    },
    {
      name: "Hochschule Fresenius",
      aliases: ["Fresenius Hochschule"],
      institutionType: "private",
      ownership: "private",
      officialWebsite: "https://www.hs-fresenius.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 2.6,
      practiceOrientation: 4.0,
      internationality: 3.0,
      reputation: 3.4,
      costAccessibility: 2.7,
      digitalScalability: 3.5,
      workStudyFlexibility: 4.1,
      regulatorySecurity: 3.8,
      dataQuality: 3.4,
      focus: "private praxisorientierte Studienangebote und flexible Zielgruppenansprache"
    },
    {
      name: "SRH Hochschule Heidelberg",
      aliases: ["SRH University Heidelberg", "SRH Hochschule"],
      institutionType: "private",
      ownership: "private",
      officialWebsite: "https://www.srh-university.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 2.7,
      practiceOrientation: 4.0,
      internationality: 3.2,
      reputation: 3.4,
      costAccessibility: 2.7,
      digitalScalability: 3.5,
      workStudyFlexibility: 4.1,
      regulatorySecurity: 3.8,
      dataQuality: 3.4,
      focus: "private Hochschule, praxisorientierte Lehre und flexible Studienmodelle"
    },
    {
      name: "CBS International Business School",
      aliases: ["CBS"],
      institutionType: "business",
      ownership: "private",
      officialWebsite: "https://www.cbs.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 2.8,
      practiceOrientation: 4.1,
      internationality: 3.8,
      reputation: 3.5,
      costAccessibility: 2.6,
      digitalScalability: 3.4,
      workStudyFlexibility: 4.0,
      regulatorySecurity: 3.7,
      dataQuality: 3.4,
      focus: "Businessprogramme, Internationalität und karriereorientierte Studienmodelle"
    },
    {
      name: "Steinbeis Hochschule",
      aliases: ["Steinbeis University"],
      institutionType: "private",
      ownership: "private",
      officialWebsite: "https://www.steinbeis-hochschule.de/",
      rankings: { qsWorld2026: null, theWorld2026: null },
      excellenceUniversity: false,
      researchProfile: 2.8,
      practiceOrientation: 4.2,
      internationality: 3.1,
      reputation: 3.4,
      costAccessibility: 2.7,
      digitalScalability: 3.4,
      workStudyFlexibility: 4.2,
      regulatorySecurity: 3.7,
      dataQuality: 3.3,
      focus: "Transferorientierung, berufsbegleitende Modelle und Projekt-Kompetenz-Ansatz"
    }
  ];

  const institutions = institutionRows.reduce((items, row) => {
    const profile = createInstitution(row);
    items[slugify(row.name)] = profile;
    (row.aliases || []).forEach((alias) => {
      items[slugify(alias)] = profile;
    });
    return items;
  }, {});

  const primaryInstitutions = institutionRows.reduce((items, row) => {
    items[slugify(row.name)] = institutions[slugify(row.name)];
    return items;
  }, {});

  window.ScorecardData = {
    scoreValues,
    categories,
    recommendationBands,
    scoreGuide,
    methodology,
    manualTemplate,
    institutions: primaryInstitutions,
    demos: primaryInstitutions,
    sourceUrls,
    institutionTypeLabels,
    ownershipLabels
  };
})();
