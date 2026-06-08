(function () {
  "use strict";

  const data = window.ScorecardData;
  const defaultCategoryWeights = data.categories.reduce((weights, category) => {
    weights[category.id] = category.weight;
    return weights;
  }, {});
  const defaultIndicatorWeights = data.categories.reduce((weights, category) => {
    weights[category.id] = category.indicators.reduce((items, indicator) => {
      items[indicator.id] = indicator.weight;
      return items;
    }, {});
    return weights;
  }, {});

  const state = {
    current: null,
    baseline: null,
    activeProfileKey: "",
    activeView: "single",
    assessmentStore: {},
    comparison: null,
    categoryWeights: clone(defaultCategoryWeights),
    indicatorWeights: clone(defaultIndicatorWeights)
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function cleanDerivationText(text) {
    return String(text ?? "").replace(/\s*Basis:.*$/s, "").trim();
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " und ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function roundScore(value) {
    return clamp(Math.round(value * 2) / 2, 1, 5);
  }

  function normalizeScoreOverride(value) {
    const number = Number(String(value).replace(",", "."));
    if (!Number.isFinite(number)) return null;
    return clamp(Math.round(number * 2) / 2, 0.5, 5);
  }

  function getScoreOverrides(institution) {
    if (!institution.scoreOverrides) institution.scoreOverrides = {};
    return institution.scoreOverrides;
  }

  function weightedAverage(items) {
    const usable = items.filter(([value, weight]) => Number.isFinite(value) && weight > 0);
    const totalWeight = usable.reduce((sum, [, weight]) => sum + weight, 0);
    if (!totalWeight) return 3;
    return usable.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight;
  }

  function formatPercent(value) {
    return `${(value * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`;
  }

  function formatNumber(value, digits) {
    return Number(value).toLocaleString("de-DE", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function formatSigned(value, digits) {
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${formatNumber(value, digits)}`;
  }

  function scoreClass(score) {
    if (score >= 4) return "score-strong";
    if (score >= 3) return "score-medium";
    return "score-weak";
  }

  function contributionClass(score100) {
    if (score100 >= 75) return "score-strong";
    if (score100 >= 60) return "score-medium";
    if (score100 >= 40) return "score-caution";
    return "score-weak";
  }

  function factsOf(institution) {
    return institution?.facts || data.manualTemplate.facts;
  }

  function fact(institution, key, fallback = 3) {
    const value = Number(factsOf(institution)[key]);
    return Number.isFinite(value) ? clamp(value, 1, 5) : fallback;
  }

  function rankingNumber(ranking) {
    if (!ranking) return null;
    if (Number.isFinite(ranking.numeric)) return ranking.numeric;
    const value = Number(ranking.rank);
    return Number.isFinite(value) ? value : null;
  }

  function rankingLabel(ranking) {
    return ranking ? String(ranking.rank) : "nicht gelistet";
  }

  // Very high global QS/THE ranks strengthen reputation and visibility.
  // Missing ranks return null, not a weak score, so HAWs and private providers are evaluated through fair proxy fields.
  function rankToScore(rank) {
    if (!Number.isFinite(rank)) return null;
    if (rank <= 50) return 5;
    if (rank <= 100) return 4.7;
    if (rank <= 150) return 4.4;
    if (rank <= 250) return 4.1;
    if (rank <= 350) return 3.8;
    if (rank <= 500) return 3.5;
    if (rank <= 800) return 3.2;
    return 3;
  }

  function rankingEvidenceScore(institution) {
    const rankings = factsOf(institution).rankings || {};
    const scores = [
      rankToScore(rankingNumber(rankings.qsWorld2026)),
      rankToScore(rankingNumber(rankings.theWorld2026))
    ].filter((value) => value !== null);
    if (!scores.length) return null;
    return scores.reduce((sum, value) => sum + value, 0) / scores.length;
  }

  function typeProxy(institution, values, fallback = 3) {
    const type = factsOf(institution).institutionType;
    return values[type] ?? fallback;
  }

  function ownershipProxy(institution, publicValue, privateValue) {
    return factsOf(institution).ownership === "public" ? publicValue : privateValue;
  }

  function rankingEvidenceText(institution) {
    const rankings = factsOf(institution).rankings || {};
    const hasRanking = rankings.qsWorld2026 || rankings.theWorld2026;
    if (!hasRanking) {
      return "keine QS-/THE-WUR-Position; Proxy-Kriterien werden ohne Rankingmalus genutzt";
    }
    return `QS ${rankingLabel(rankings.qsWorld2026)}, THE ${rankingLabel(rankings.theWorld2026)}`;
  }

  function reasonSuffix(institution) {
    return `Basis: ${factsOf(institution).institutionTypeLabel}, ${factsOf(institution).ownershipLabel}, ${rankingEvidenceText(institution)}, Quellenqualität ${formatNumber(fact(institution, "dataQuality"), 1)} / 5.`;
  }

  // Reputation combines global ranking evidence, qualitative reputation, research profile and data quality.
  // Excellence status acts as a small positive signal, because it documents nationally reviewed research strength.
  function calculateReputationScore(institution) {
    const rankingScore = rankingEvidenceScore(institution);
    const base = rankingScore === null
      ? weightedAverage([
        [fact(institution, "reputation"), 0.42],
        [fact(institution, "researchProfile"), 0.2],
        [fact(institution, "internationality"), 0.18],
        [fact(institution, "dataQuality"), 0.12],
        [typeProxy(institution, { haw: 3.7, business: 4.1, private: 3.3, online: 3.3, university: 3.5 }), 0.08]
      ])
      : weightedAverage([
        [rankingScore, 0.34],
        [fact(institution, "reputation"), 0.28],
        [fact(institution, "researchProfile"), 0.18],
        [fact(institution, "internationality"), 0.12],
        [fact(institution, "dataQuality"), 0.08]
      ]);
    return roundScore(base + (factsOf(institution).excellenceUniversity ? 0.15 : 0));
  }

  // Research strength is anchored in researchProfile and improved by QS/THE visibility and Excellence status.
  function calculateResearchScore(institution) {
    const rankingScore = rankingEvidenceScore(institution);
    const base = rankingScore === null
      ? weightedAverage([
        [fact(institution, "researchProfile"), 0.62],
        [fact(institution, "reputation"), 0.22],
        [fact(institution, "dataQuality"), 0.16]
      ])
      : weightedAverage([
        [fact(institution, "researchProfile"), 0.48],
        [rankingScore, 0.3],
        [fact(institution, "reputation"), 0.14],
        [fact(institution, "dataQuality"), 0.08]
      ]);
    return roundScore(base + (factsOf(institution).excellenceUniversity ? 0.18 : 0));
  }

  // Applied universities, private providers and business schools receive practice-oriented proxy strength.
  function calculatePracticeOrientationScore(institution) {
    const base = weightedAverage([
      [fact(institution, "practiceOrientation"), 0.68],
      [fact(institution, "workStudyFlexibility"), 0.12],
      [typeProxy(institution, { haw: 4.7, business: 4.6, private: 4.2, online: 4.1, university: 3.6 }), 0.2]
    ]);
    return roundScore(base);
  }

  // Public institutions tend to be more cost-accessible in Germany; private providers can still score via price-performance proxies.
  function calculateCostAccessibilityScore(institution) {
    const base = weightedAverage([
      [fact(institution, "costAccessibility"), 0.75],
      [ownershipProxy(institution, 4.7, 2.7), 0.25]
    ]);
    return roundScore(base);
  }

  // International visibility uses rankings when available, but falls back to internationality, reputation and profile for non-ranked institutions.
  function calculateInternationalVisibilityScore(institution) {
    const rankingScore = rankingEvidenceScore(institution);
    const base = rankingScore === null
      ? weightedAverage([
        [fact(institution, "internationality"), 0.5],
        [fact(institution, "reputation"), 0.24],
        [fact(institution, "dataQuality"), 0.1],
        [typeProxy(institution, { business: 4.2, online: 3.5, haw: 3.2, private: 3.2, university: 3.4 }), 0.16]
      ])
      : weightedAverage([
        [rankingScore, 0.42],
        [fact(institution, "internationality"), 0.34],
        [fact(institution, "reputation"), 0.16],
        [fact(institution, "dataQuality"), 0.08]
      ]);
    return roundScore(base);
  }

  // Regulatory security is strongest for public German institutions and established providers with documented data quality.
  function calculateRegulatorySecurityScore(institution) {
    const base = weightedAverage([
      [fact(institution, "regulatorySecurity"), 0.66],
      [fact(institution, "dataQuality"), 0.14],
      [ownershipProxy(institution, 4.8, 3.7), 0.2]
    ]);
    return roundScore(base);
  }

  // Online and private providers can score highly on scalability; campus-heavy research universities are strong but less elastic.
  function calculateScalabilityScore(institution) {
    const base = weightedAverage([
      [fact(institution, "digitalScalability"), 0.42],
      [fact(institution, "workStudyFlexibility"), 0.24],
      [calculatePracticeOrientationScore(institution), 0.14],
      [typeProxy(institution, { online: 5, private: 4.1, business: 3.8, haw: 3.6, university: 3.3 }), 0.2]
    ]);
    return roundScore(base);
  }

  function calculateSubjectProfileScore(institution) {
    const specialtyStrength = Math.max(
      fact(institution, "businessEconomicsStrength"),
      fact(institution, "techResearchStrength"),
      fact(institution, "researchProfile"),
      fact(institution, "practiceOrientation")
    );
    const base = weightedAverage([
      [fact(institution, "subjectFit"), 0.34],
      [specialtyStrength, 0.24],
      [calculateReputationScore(institution), 0.18],
      [calculatePracticeOrientationScore(institution), 0.12],
      [calculateInternationalVisibilityScore(institution), 0.12]
    ]);
    return roundScore(base);
  }

  function calculateLaborMarketScore(institution) {
    const base = weightedAverage([
      [fact(institution, "laborMarketValue"), 0.34],
      [fact(institution, "careerOrientation"), 0.22],
      [calculateReputationScore(institution), 0.16],
      [calculateSubjectProfileScore(institution), 0.16],
      [fact(institution, "networkStrength"), 0.12]
    ]);
    return roundScore(base);
  }

  function calculateNetworkScore(institution) {
    const base = weightedAverage([
      [fact(institution, "networkStrength"), 0.34],
      [fact(institution, "locationAdvantage"), 0.18],
      [calculateInternationalVisibilityScore(institution), 0.18],
      [calculateReputationScore(institution), 0.18],
      [fact(institution, "careerOrientation"), 0.12]
    ]);
    return roundScore(base);
  }

  function calculateStudentDemandScore(institution) {
    const base = weightedAverage([
      [fact(institution, "studentDemand"), 0.36],
      [fact(institution, "laborMarketValue"), 0.2],
      [calculateReputationScore(institution), 0.16],
      [calculateSubjectProfileScore(institution), 0.1],
      [calculateCostAccessibilityScore(institution), 0.1],
      [calculateInternationalVisibilityScore(institution), 0.08]
    ]);
    return roundScore(base);
  }

  function isTopUniversityProfile(institution) {
    const facts = factsOf(institution);
    const evidence = rankingEvidenceScore(institution);
    return facts.institutionType === "university"
      && facts.ownership === "public"
      && (
        facts.excellenceUniversity
        || fact(institution, "prestigeTier", 4) <= 2
        || (evidence !== null && evidence >= 4)
        || fact(institution, "businessEconomicsStrength") >= 4.6
        || fact(institution, "techResearchStrength") >= 4.6
        || fact(institution, "reputation") >= 4.5
      );
  }

  function applyPlausibilityRules(institution, indicatorId, score) {
    const facts = factsOf(institution);
    let adjusted = score;
    const notes = [];

    const floorScore = (minimum, note) => {
      if (adjusted < minimum) {
        adjusted = minimum;
        notes.push(note);
      }
    };
    const capScore = (maximum, note) => {
      if (adjusted > maximum) {
        adjusted = maximum;
        notes.push(note);
      }
    };

    if (isTopUniversityProfile(institution)) {
      const elitePublic = fact(institution, "prestigeTier", 4) <= 1
        || fact(institution, "businessEconomicsStrength") >= 4.8
        || fact(institution, "techResearchStrength") >= 4.8;
      const marketFloor = elitePublic ? 4.5 : 4;
      const providerFloor = elitePublic ? 4.5 : 4;
      if (["market-growth", "market-size", "competition", "demand"].includes(indicatorId)) {
        floorScore(marketFloor, "starkes öffentliches Universitätsprofil schützt die Marktattraktivität vor Unterbewertung");
      }
      if (["innovation", "reputation", "differentiation", "channels"].includes(indicatorId)) {
        floorScore(providerFloor, "Ranking-/Fachprofil und institutionelle Reputation setzen eine Anbieter-Untergrenze");
      }
      if (["opportunity-potential", "strategic-fit", "net-opportunity-risk"].includes(indicatorId)) {
        floorScore(elitePublic ? 4.5 : 4, "starke Fach- und Reputationsbasis setzt eine Chancen-Untergrenze");
      }
    }

    if (facts.institutionType === "business") {
      const businessFloor = fact(institution, "businessEconomicsStrength") >= 4.6 ? 4.2 : 3.8;
      if ([
        "market-growth",
        "market-size",
        "competition",
        "demand",
        "innovation",
        "reputation",
        "differentiation",
        "channels",
        "opportunity-potential",
        "strategic-fit"
      ].includes(indicatorId)) {
        floorScore(businessFloor, "starkes Business-School-Profil stützt Markt-, Karriere- und Netzwerkindikatoren");
      }
    }

    if (facts.institutionType === "online" && ["innovation", "reputation", "competition"].includes(indicatorId)) {
      capScore(3.6, "Online-Skalierung wird nicht automatisch als klassische Reputation oder Forschungskraft gewertet");
    }

    if (facts.institutionType === "private" && ["innovation", "reputation", "competition"].includes(indicatorId)) {
      capScore(3.7, "private Flexibilitätsstärke wird von klassischer Reputation und Forschungsprofil getrennt");
    }

    return {
      score: adjusted,
      note: notes.length ? `Plausibilitätsregel: ${notes.join("; ")}.` : ""
    };
  }

  function deriveIndicatorAssessment(institution, indicatorId) {
    const reputation = calculateReputationScore(institution);
    const research = calculateResearchScore(institution);
    const practice = calculatePracticeOrientationScore(institution);
    const cost = calculateCostAccessibilityScore(institution);
    const international = calculateInternationalVisibilityScore(institution);
    const regulation = calculateRegulatorySecurityScore(institution);
    const scalability = calculateScalabilityScore(institution);
    const quality = fact(institution, "dataQuality");
    const flexibility = fact(institution, "workStudyFlexibility");
    const digital = fact(institution, "digitalScalability");
    const demandStrength = calculateStudentDemandScore(institution);
    const laborMarket = calculateLaborMarketScore(institution);
    const network = calculateNetworkScore(institution);
    const subjectProfile = calculateSubjectProfileScore(institution);
    const location = fact(institution, "locationAdvantage");
    const career = fact(institution, "careerOrientation");
    const typeStrength = typeProxy(institution, { university: research, haw: practice, private: flexibility, business: reputation, online: scalability }, 3);
    let score = 3;
    let reason = "";

    switch (indicatorId) {
      case "market-growth":
        score = weightedAverage([[demandStrength, 0.26], [laborMarket, 0.22], [reputation, 0.16], [subjectProfile, 0.14], [international, 0.1], [network, 0.06], [scalability, 0.06]]);
        reason = "Nachfragedynamik wird aus Studentennachfrage, Arbeitsmarktwert, Reputation, Fachprofil und internationaler Sichtbarkeit abgeleitet.";
        break;
      case "market-size":
        score = weightedAverage([[demandStrength, 0.24], [reputation, 0.22], [international, 0.17], [network, 0.15], [subjectProfile, 0.12], [location, 0.1]]);
        reason = "Zielgruppenpotenzial kombiniert Nachfrage, Reputation, internationale Sichtbarkeit, Netzwerke, Standort und fachliche Breite.";
        break;
      case "competition":
        score = weightedAverage([[reputation, 0.28], [laborMarket, 0.22], [subjectProfile, 0.18], [network, 0.14], [cost, 0.08], [quality, 0.06], [practice, 0.04]]);
        reason = "Die Wettbewerbsposition steigt mit Reputation, Arbeitsmarktwert, Fachprofil, Netzwerken, Zugangsvorteilen und belastbarer Datenlage.";
        break;
      case "demand":
        score = weightedAverage([[demandStrength, 0.3], [laborMarket, 0.23], [career, 0.16], [reputation, 0.14], [cost, 0.1], [international, 0.07]]);
        reason = "Nachfragefit wird aus Studentennachfrage, Arbeitsmarktwert, Karriereorientierung, Reputation und Zugangsfähigkeit gebildet.";
        break;
      case "digital-access":
        score = weightedAverage([[digital, 0.42], [scalability, 0.24], [flexibility, 0.14], [reputation, 0.1], [quality, 0.1]]);
        reason = "Digitale Zugangsfähigkeit stützt sich auf digitale Skalierbarkeit, flexible Studienlogik, Vertrauenssignale und Datenqualität.";
        break;
      case "innovation":
        score = weightedAverage([[research, 0.28], [subjectProfile, 0.18], [digital, 0.18], [practice, 0.16], [laborMarket, 0.1], [scalability, 0.06], [quality, 0.04]]);
        reason = "Innovation entsteht hier aus Forschung, Fachprofil, Transfer-/Praxisnähe, digitaler Angebotsfähigkeit und Arbeitsmarktnähe.";
        break;
      case "reputation":
        score = reputation;
        reason = "Reputation wird aus Rankingdaten, Forschungsprofil, qualitativer Reputation, Exzellenzstatus und Quellenqualität berechnet.";
        break;
      case "cost-position":
        score = cost;
        reason = "Kostenposition berücksichtigt öffentliche Zugänglichkeit bzw. private Preisbarrieren und Preis-Leistungs-Plausibilität.";
        break;
      case "differentiation":
        score = weightedAverage([[subjectProfile, 0.28], [reputation, 0.22], [laborMarket, 0.16], [network, 0.14], [practice, 0.1], [scalability, 0.1]]);
        reason = "Differenzierung folgt Fachprofil, Reputation, Arbeitsmarktwert, Netzwerkstärke, Praxis und Skalierung.";
        break;
      case "channels":
        score = weightedAverage([[network, 0.32], [international, 0.22], [reputation, 0.18], [career, 0.16], [practice, 0.12]]);
        reason = "Partner- und Zielgruppenzugang wird über Netzwerke, internationale Sichtbarkeit, Reputation, Karrierebezug und Praxisnähe approximiert.";
        break;
      case "accreditation":
        score = weightedAverage([[regulation, 0.72], [quality, 0.18], [ownershipProxy(institution, 4.8, 3.8), 0.1]]);
        reason = "Akkreditierungsfähigkeit wird über regulatorische Stabilität, Trägerschaft und dokumentierte Quellenqualität bewertet.";
        break;
      case "compliance":
        score = weightedAverage([[regulation, 0.56], [quality, 0.28], [digital >= 4 ? 3.8 : 4.2, 0.16]]);
        reason = "Compliance kombiniert regulatorische Sicherheit und Datenqualität; stark digitale Modelle erhalten zusätzlichen Prüfbedarf.";
        break;
      case "foreign-provider-limits":
        score = weightedAverage([[regulation, 0.52], [ownershipProxy(institution, 4.7, 4.0), 0.28], [quality, 0.2]]);
        reason = "Marktzugangshürden sind im deutschen Heimatmarkt für etablierte Institutionen geringer, bei privaten Modellen prüfungsintensiver.";
        break;
      case "legal-stability":
        score = weightedAverage([[regulation, 0.62], [ownershipProxy(institution, 4.8, 4.2), 0.28], [quality, 0.1]]);
        reason = "Rechtliche Stabilität basiert auf deutscher Hochschulregulierung, institutioneller Einbettung und Quellenqualität.";
        break;
      case "reg-process":
        score = weightedAverage([[regulation, 0.54], [quality, 0.24], [ownershipProxy(institution, 4.5, 3.7), 0.22]]);
        reason = "Regulatorische Prozessrisiken sinken mit etablierter Governance, öffentlicher Einbettung und dokumentierter Qualitätssicherung.";
        break;
      case "scalability":
        score = scalability;
        reason = "Skalierbarkeit wird aus digitaler Infrastruktur, Flexibilität und typabhängiger Übertragbarkeit abgeleitet.";
        break;
      case "localization":
        score = weightedAverage([[practice, 0.32], [flexibility, 0.24], [international, 0.16], [quality, 0.14], [typeProxy(institution, { haw: 4.4, online: 4.4, private: 4.0, business: 3.9, university: 3.5 }), 0.14]]);
        reason = "Lokalisierungsfähigkeit kombiniert regionale Praxisnähe, flexible Formate, internationale Anschlussfähigkeit und Datenlage.";
        break;
      case "operations":
        score = weightedAverage([[regulation, 0.32], [practice, 0.28], [quality, 0.22], [reputation, 0.18]]);
        reason = "Operative Umsetzbarkeit steigt mit regulierter institutioneller Stabilität, Praxisnähe und belastbarer Datenlage.";
        break;
      case "financial-viability":
        score = weightedAverage([[laborMarket, 0.24], [scalability, 0.2], [reputation, 0.2], [regulation, 0.18], [cost, 0.1], [quality, 0.08]]);
        reason = "Tragfähigkeit wird über Arbeitsmarktwert, Skalierung, Reputation, Regulierung und Kostenposition angenähert.";
        break;
      case "social-impact":
        score = weightedAverage([[cost, 0.34], [practice, 0.26], [ownershipProxy(institution, 4.6, 3.3), 0.2], [regulation, 0.12], [flexibility, 0.08]]);
        reason = "Sozialer Impact profitiert von niedrigen Zugangshürden, Praxisnähe, öffentlichem Auftrag und flexiblen Angeboten.";
        break;
      case "opportunity-potential":
        score = weightedAverage([[demandStrength, 0.22], [laborMarket, 0.2], [reputation, 0.18], [subjectProfile, 0.14], [network, 0.12], [scalability, 0.08], [quality, 0.06]]);
        reason = "Chancenpotenzial bündelt Nachfrage, Arbeitsmarktwert, Reputation, Fachprofil, Netzwerke und Skalierungssignale.";
        break;
      case "risk-load":
        score = weightedAverage([[regulation, 0.38], [quality, 0.22], [cost, 0.18], [reputation, 0.12], [ownershipProxy(institution, 4.5, 3.6), 0.1]]);
        reason = "Risikobelastung ist positiv gedreht: hohe Regulierungssicherheit, Kostenklarheit und Datenqualität senken Risiken.";
        break;
      case "risk-control":
        score = weightedAverage([[regulation, 0.48], [quality, 0.28], [practice, 0.14], [reputation, 0.1]]);
        reason = "Risiken gelten als kontrollierbarer, wenn Governance, Datenqualität, Praxisnetzwerke und Reputation stark sind.";
        break;
      case "strategic-fit":
        score = weightedAverage([[subjectProfile, 0.28], [laborMarket, 0.2], [reputation, 0.18], [network, 0.14], [scalability, 0.1], [international, 0.1]]);
        reason = "Strategischer Fit bewertet, ob Fachprofil, Arbeitsmarktwert, Reputation, Netzwerke und Skalierung zum Kerntyp passen.";
        break;
      case "net-opportunity-risk":
        score = weightedAverage([[laborMarket, 0.2], [reputation, 0.18], [regulation, 0.2], [subjectProfile, 0.14], [scalability, 0.12], [cost, 0.08], [quality, 0.08]]);
        reason = "Das Nettoverhältnis verknüpft Arbeitsmarkt- und Reputationschancen mit regulatorischer, finanzieller und quellenbezogener Absicherung.";
        break;
      default:
        score = 3;
        reason = "Kein spezifischer Ableitungsmechanismus hinterlegt.";
    }

    const plausibility = applyPlausibilityRules(institution, indicatorId, score);

    return {
      score: roundScore(plausibility.score),
      reason: `${reason} ${plausibility.note ? `${plausibility.note} ` : ""}${reasonSuffix(institution)}`
    };
  }

  function resolveIndicatorAssessment(institution, indicatorId) {
    const derived = deriveIndicatorAssessment(institution, indicatorId);
    const override = normalizeScoreOverride(institution?.scoreOverrides?.[indicatorId]);
    return {
      ...derived,
      derivedScore: derived.score,
      score: override ?? derived.score,
      isManual: override !== null
    };
  }

  function calculateCategoryById(institution, categoryId) {
    const category = data.categories.find((item) => item.id === categoryId);
    if (!category) return 3;
    const indicatorWeights = getEffectiveIndicatorWeights(categoryId);
    return roundScore(weightedAverage(category.indicators.map((indicator) => [
      resolveIndicatorAssessment(institution, indicator.id).score,
      indicatorWeights[indicator.id] ?? indicator.weight
    ])));
  }

  function calculateMarketAttractivenessScore(institution) {
    return calculateCategoryById(institution, "market");
  }

  function calculateProviderAttractivenessScore(institution) {
    return calculateCategoryById(institution, "provider");
  }

  function calculateRiskBarrierScore(institution) {
    return calculateCategoryById(institution, "regulation");
  }

  function calculateSustainabilityScalabilityScore(institution) {
    return calculateCategoryById(institution, "sustainability");
  }

  function calculateChanceRiskScore(institution) {
    return calculateCategoryById(institution, "chance-risk");
  }

  function getRawWeightSum() {
    return data.categories.reduce((sum, category) => sum + (Number(state.categoryWeights[category.id]) || 0), 0);
  }

  function getEffectiveCategoryWeights() {
    const rawSum = getRawWeightSum();
    if (rawSum <= 0) return clone(defaultCategoryWeights);
    return data.categories.reduce((weights, category) => {
      weights[category.id] = (Number(state.categoryWeights[category.id]) || 0) / rawSum;
      return weights;
    }, {});
  }

  function getRawIndicatorWeightSum(categoryId) {
    const category = data.categories.find((item) => item.id === categoryId);
    if (!category) return 0;
    return category.indicators.reduce((sum, indicator) => (
      sum + (Number(state.indicatorWeights[categoryId]?.[indicator.id]) || 0)
    ), 0);
  }

  function getEffectiveIndicatorWeights(categoryId) {
    const category = data.categories.find((item) => item.id === categoryId);
    if (!category) return {};
    const rawSum = getRawIndicatorWeightSum(categoryId);
    if (rawSum <= 0) return clone(defaultIndicatorWeights[categoryId]);
    return category.indicators.reduce((weights, indicator) => {
      weights[indicator.id] = (Number(state.indicatorWeights[categoryId]?.[indicator.id]) || 0) / rawSum;
      return weights;
    }, {});
  }

  function storeAssessment(assessment) {
    if (!assessment?.name) return;
    state.assessmentStore[slugify(assessment.name)] = clone(assessment);
  }

  function createManualInstitution(name) {
    const template = data.manualTemplate || {};
    const facts = clone(template.facts || {});
    facts.institutionTypeLabel = data.institutionTypeLabels?.[facts.institutionType] || "Institution";
    facts.ownershipLabel = data.ownershipLabels?.[facts.ownership] || "Trägerschaft offen";

    const assessment = {
      name: name || "Neue Bewertung",
      isProfile: false,
      aliases: [],
      comparisonNote: template.comparisonNote || "Neutrale manuelle Bewertung mit Proxywerten.",
      researchNotes: template.researchNotes || "",
      facts,
      scoreOverrides: {},
      chanceRisks: clone(template.chanceRisks || []),
      sources: clone(template.sources || [])
    };

    assessment.sources.unshift({
      label: "Modellstatus",
      status: "unvollständiges Profil",
      note: "Diese Bewertung nutzt neutrale Defaultdaten, bis strukturierte Quellen ergänzt werden.",
      basis: "methodische Annahme"
    });
    return assessment;
  }

  function createBlankAssessment(name) {
    return createManualInstitution(name);
  }

  function profileToAssessment(key) {
    const profile = data.institutions[key];
    const assessment = clone(profile);
    assessment.scoreOverrides = assessment.scoreOverrides || {};
    assessment.researchNotes = assessment.researchNotes || "";
    return assessment;
  }

  function demoToAssessment(key) {
    return profileToAssessment(key);
  }

  function findDemoKey(name) {
    const wanted = slugify(name);
    if (!wanted) return "";
    if (data.institutions[wanted]) return wanted;

    return Object.entries(data.institutions).find(([, institution]) => {
      const names = [institution.name].concat(institution.aliases || []);
      return names.some((item) => {
        const candidate = slugify(item);
        return wanted === candidate || wanted.includes(candidate) || candidate.includes(wanted);
      });
    })?.[0] || "";
  }

  function getRecommendation(totalScore) {
    const roundedScore = Math.max(0, Math.min(100, Math.round(totalScore * 100) / 100));
    const band = data.recommendationBands.find((item) => roundedScore >= item.min);
    return band || data.recommendationBands[data.recommendationBands.length - 1];
  }

  function calculateAssessment(assessment) {
    assessment.scoreOverrides = assessment.scoreOverrides || {};
    const weights = getEffectiveCategoryWeights();
    const rows = [];
    const categoryScores = data.categories.map((category) => {
      const categoryWeight = weights[category.id] ?? category.weight;
      const indicatorWeights = getEffectiveIndicatorWeights(category.id);
      let categoryContribution = 0;

      category.indicators.forEach((indicator) => {
        const derived = resolveIndicatorAssessment(assessment, indicator.id);
        const indicatorWeight = indicatorWeights[indicator.id] ?? indicator.weight;
        const score = derived.score;
        const normalizedScore = score / 5;
        const totalWeight = categoryWeight * indicatorWeight;
        const contribution = normalizedScore * totalWeight * 100;
        categoryContribution += contribution;

        rows.push({
          categoryId: category.id,
          categoryName: category.name,
          categoryWeight,
          indicatorId: indicator.id,
          indicatorName: indicator.name,
          indicatorWeight,
          totalWeight,
          score,
          normalizedScore,
          contribution,
          contributionOfCategory: contribution / (categoryWeight * 100),
          analysis: indicator.analysis,
          reason: derived.reason,
          derivedScore: derived.derivedScore,
          isManual: derived.isManual
        });
      });

      const scoreFive = categoryWeight ? (categoryContribution / (categoryWeight * 100)) * 5 : 0;
      return {
        id: category.id,
        name: category.name,
        weight: categoryWeight,
        rawWeight: state.categoryWeights[category.id] ?? category.weight,
        contribution: categoryContribution,
        scoreFive,
        score100: scoreFive * 20
      };
    });

    const totalScore = rows.reduce((sum, row) => sum + row.contribution, 0);
    const totalScoreFive = (totalScore / 100) * 5;
    const sortedCategories = [...categoryScores].sort((a, b) => b.scoreFive - a.scoreFive);

    return {
      rows,
      categoryScores,
      totalScore,
      totalScoreFive,
      recommendation: getRecommendation(totalScore),
      strongest: sortedCategories[0],
      weakest: sortedCategories[sortedCategories.length - 1]
    };
  }

  function resolveInstitution(input) {
    const name = String(input || "").trim();
    const normalized = slugify(name);

    if (normalized && state.current && slugify(state.current.name) === normalized) {
      return { assessment: clone(state.current), key: normalized, kind: "current" };
    }

    if (normalized && state.assessmentStore[normalized]) {
      return { assessment: clone(state.assessmentStore[normalized]), key: normalized, kind: "stored" };
    }

    const profileKey = findDemoKey(name);
    if (profileKey) {
      return { assessment: profileToAssessment(profileKey), key: profileKey, kind: "profile" };
    }

    const assessment = createManualInstitution(name || "Neue Bewertung");
    return { assessment, key: slugify(assessment.name), kind: "manual" };
  }

  function getInstitutionBySearchInput(inputValue) {
    const fallbackValue = typeof document !== "undefined"
      ? document.getElementById("institutionInput")?.value
      : "";
    const value = String(inputValue ?? fallbackValue ?? "").trim();
    return resolveInstitution(value);
  }

  function setCurrentAssessment(assessment, profileKey) {
    state.current = clone(assessment);
    state.current.scoreOverrides = state.current.scoreOverrides || {};
    state.current.researchNotes = state.current.researchNotes || "";
    state.baseline = profileKey ? profileToAssessment(profileKey) : clone(assessment);
    state.baseline.scoreOverrides = state.baseline.scoreOverrides || {};
    state.baseline.researchNotes = state.baseline.researchNotes || "";
    state.activeProfileKey = profileKey || "";
    storeAssessment(state.current);
    setActiveView("single");
    render();
  }

  function buildSearchSuggestions(query) {
    const trimmed = query.trim();
    const normalized = slugify(trimmed);
    const suggestions = [];

    Object.entries(data.institutions).forEach(([key, institution]) => {
      const searchable = [institution.name, factsOf(institution).focus].concat(institution.aliases || [])
        .map((item) => slugify(item))
        .join(" ");
      if (!normalized || searchable.includes(normalized) || normalized.includes(slugify(institution.name))) {
        suggestions.push({
          kind: "profile",
          key,
          value: institution.name,
          label: institution.name,
          meta: `${factsOf(institution).institutionTypeLabel} · ${factsOf(institution).ownershipLabel}`
        });
      }
    });

    const hasExactProfile = suggestions.some((item) => slugify(item.value) === normalized);
    if (trimmed && !hasExactProfile) {
      suggestions.push({
        kind: "manual",
        key: slugify(trimmed),
        value: trimmed,
        label: trimmed,
        meta: "neues Datenprofil mit neutralen Startwerten"
      });
    }

    return suggestions.slice(0, 8);
  }

  function updateSearchSuggestions() {
    const input = document.getElementById("institutionInput");
    const container = document.getElementById("institutionSuggestions");
    if (!input || !container) return;

    const suggestions = buildSearchSuggestions(input.value);
    container.hidden = suggestions.length === 0;
    container.innerHTML = suggestions.map((item) => `
      <button class="suggestion-button" type="button" role="option" data-kind="${item.kind}" data-value="${escapeAttribute(item.value)}">
        <span>${escapeHtml(item.label)}</span>
        <small>${escapeHtml(item.meta)}</small>
      </button>
    `).join("");
  }

  function loadInstitutionFromInput(value) {
    const result = getInstitutionBySearchInput(value);
    const profileKey = result.kind === "manual" ? "" : findDemoKey(result.assessment.name);
    const input = document.getElementById("institutionInput");
    if (input) input.value = result.assessment.name;
    setCurrentAssessment(result.assessment, profileKey);
    return result;
  }

  function createScoreControl(row) {
    const wrapper = document.createElement("div");
    wrapper.className = "score-control";

    const select = document.createElement("select");
    select.className = `score-select ${scoreClass(row.score)}`;
    select.dataset.indicatorId = row.indicatorId;
    select.setAttribute("aria-label", `Score für ${row.indicatorName}`);

    data.scoreValues.forEach((value) => {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = formatNumber(value, value % 1 === 0 ? 0 : 1);
      option.selected = value === row.score;
      select.appendChild(option);
    });

    wrapper.appendChild(select);

    const meta = document.createElement("small");
    meta.className = row.isManual ? "manual-note" : "derived-note";
    meta.textContent = row.isManual
      ? `manuell angepasst · datenbasiert ${formatNumber(row.derivedScore, row.derivedScore % 1 === 0 ? 0 : 1)}`
      : "datenbasiert";
    wrapper.appendChild(meta);

    return wrapper;
  }

  function setActiveView(view) {
    state.activeView = view;
    document.querySelectorAll("[data-view-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.viewPanel !== view;
    });
    document.querySelectorAll(".tab-button").forEach((button) => {
      const isActive = button.dataset.view === view;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });
  }

  function renderMethodology() {
    const container = document.getElementById("methodologyContent");
    if (!container || !data.methodology) return;

    container.innerHTML = `
      <p>${escapeHtml(data.methodology.summary)}</p>
      <div class="method-grid">
        ${data.methodology.sources.map((source) => `
          <article>
            <strong><a href="${escapeAttribute(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.label)}</a></strong>
            <span>${escapeHtml(source.note)}</span>
          </article>
        `).join("")}
      </div>
      <ul class="method-list">
        ${data.methodology.assumptions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    `;
  }

  function renderWeightControls() {
    const container = document.getElementById("weightControls");
    if (!container) return;

    container.innerHTML = data.categories.map((category) => `
      <details class="weight-control" data-weight-detail="${escapeAttribute(category.id)}">
        <summary>
          <span>${escapeHtml(category.name)}</span>
          <input id="weight-${escapeAttribute(category.id)}" data-category-id="${escapeAttribute(category.id)}" type="number" min="0" max="100" step="1" value="${formatNumber((state.categoryWeights[category.id] || 0) * 100, 0)}" aria-label="Obergewichtung ${escapeAttribute(category.name)}">
        </summary>
        <div class="indicator-weight-panel">
          ${category.indicators.map((indicator) => `
            <label class="indicator-weight-control" for="weight-${escapeAttribute(category.id)}-${escapeAttribute(indicator.id)}">
              <span>${escapeHtml(indicator.name)}</span>
              <input id="weight-${escapeAttribute(category.id)}-${escapeAttribute(indicator.id)}" data-indicator-category-id="${escapeAttribute(category.id)}" data-indicator-id="${escapeAttribute(indicator.id)}" type="number" min="0" max="100" step="1" value="${formatNumber((state.indicatorWeights[category.id]?.[indicator.id] || 0) * 100, 0)}">
            </label>
          `).join("")}
          <div class="indicator-weight-actions">
            <button type="button" data-normalize-indicators="${escapeAttribute(category.id)}">Untergewichtungen normalisieren</button>
            <button type="button" data-reset-indicators="${escapeAttribute(category.id)}">Standard-Untergewichtungen wiederherstellen</button>
          </div>
          <div class="indicator-weight-status" data-indicator-weight-status="${escapeAttribute(category.id)}"></div>
        </div>
      </details>
    `).join("");

    updateWeightStatus();
    updateAllIndicatorWeightStatuses();
  }

  function updateWeightStatus() {
    const sum = getRawWeightSum() * 100;
    const status = document.getElementById("weightStatus");
    if (!status) return;

    const isValid = Math.abs(sum - 100) < 0.05;
    status.className = `weight-status ${isValid ? "valid" : "invalid"}`;
    status.innerHTML = `
      <strong>Summe: ${formatNumber(sum, 1)} %</strong>
      <span>${isValid ? "Die Kategoriegewichte ergeben 100 %." : "Warnung: Die Summe sollte 100 % betragen. Die Berechnung nutzt bis zur Normalisierung die relativen Anteile."}</span>
    `;
  }

  function syncWeightInputs() {
    data.categories.forEach((category) => {
      const input = document.querySelector(`[data-category-id="${category.id}"]`);
      if (input) input.value = formatNumber((state.categoryWeights[category.id] || 0) * 100, 0);
    });
    updateWeightStatus();
  }

  function updateIndicatorWeightStatus(categoryId) {
    const sum = getRawIndicatorWeightSum(categoryId) * 100;
    const status = document.querySelector(`[data-indicator-weight-status="${categoryId}"]`);
    if (!status) return;
    const isValid = Math.abs(sum - 100) < 0.05;
    status.className = `indicator-weight-status ${isValid ? "valid" : "invalid"}`;
    status.innerHTML = `
      <strong>Untergewichtungen: ${formatNumber(sum, 1)} %</strong>
      <span>${isValid ? "Die Untergewichtungen ergeben 100 %." : "Warnung: Die Untergewichtungen sollten 100 % ergeben. Bis zur Normalisierung werden relative Anteile genutzt."}</span>
    `;
  }

  function updateAllIndicatorWeightStatuses() {
    data.categories.forEach((category) => updateIndicatorWeightStatus(category.id));
  }

  function syncIndicatorWeightInputs(categoryId) {
    const categories = categoryId
      ? data.categories.filter((category) => category.id === categoryId)
      : data.categories;
    categories.forEach((category) => {
      category.indicators.forEach((indicator) => {
        const input = document.querySelector(`[data-indicator-category-id="${category.id}"][data-indicator-id="${indicator.id}"]`);
        if (input) input.value = formatNumber((state.indicatorWeights[category.id]?.[indicator.id] || 0) * 100, 0);
      });
      updateIndicatorWeightStatus(category.id);
    });
  }

  function renderKpis(calculation) {
    document.getElementById("institutionTitle").textContent = state.current.name;
    document.getElementById("totalScore").textContent = `${formatNumber(calculation.totalScore, 1)} / 100`;
    document.getElementById("totalScoreFive").textContent = `${formatNumber(calculation.totalScoreFive, 2)} / 5`;
    document.getElementById("recommendation").textContent = calculation.recommendation.label;
    document.getElementById("recommendationRange").textContent = `${calculation.recommendation.range} Punkte`;
    document.getElementById("strongestCategory").textContent = calculation.strongest.name;
    document.getElementById("strongestScore").textContent = `${formatNumber(calculation.strongest.scoreFive, 2)} / 5`;
    document.getElementById("weakestCategory").textContent = calculation.weakest.name;
    document.getElementById("weakestScore").textContent = `${formatNumber(calculation.weakest.scoreFive, 2)} / 5`;

    const cards = document.querySelectorAll(".kpi-card");
    cards[0].className = `kpi-card ${contributionClass(calculation.totalScore)}`;
    cards[1].className = `kpi-card ${contributionClass(calculation.totalScore)}`;
    cards[2].className = `kpi-card ${scoreClass(calculation.strongest.scoreFive)}`;
    cards[3].className = `kpi-card ${scoreClass(calculation.weakest.scoreFive)}`;
  }

  function renderInstitutionFacts() {
    const container = document.getElementById("institutionFacts");
    if (!container || !state.current) return;

    const facts = factsOf(state.current);
    const values = [
      ["Hochschultyp", facts.institutionTypeLabel],
      ["Trägerschaft", facts.ownershipLabel],
      ["QS WUR 2026", rankingLabel(facts.rankings?.qsWorld2026)],
      ["THE WUR 2026", rankingLabel(facts.rankings?.theWorld2026)],
      ["Exzellenzuniversität", facts.excellenceUniversity ? "ja" : "nein"],
      ["Forschungsprofil", `${formatNumber(fact(state.current, "researchProfile"), 1)} / 5`],
      ["Praxisorientierung", `${formatNumber(fact(state.current, "practiceOrientation"), 1)} / 5`],
      ["Internationalität", `${formatNumber(fact(state.current, "internationality"), 1)} / 5`],
      ["Reputation", `${formatNumber(fact(state.current, "reputation"), 1)} / 5`],
      ["Kostenzugänglichkeit", `${formatNumber(fact(state.current, "costAccessibility"), 1)} / 5`],
      ["Digitale Skalierbarkeit", `${formatNumber(fact(state.current, "digitalScalability"), 1)} / 5`],
      ["Berufsbegleitende Flexibilität", `${formatNumber(fact(state.current, "workStudyFlexibility"), 1)} / 5`],
      ["Regulatorische Sicherheit", `${formatNumber(fact(state.current, "regulatorySecurity"), 1)} / 5`],
      ["Daten-/Quellenqualität", `${formatNumber(fact(state.current, "dataQuality"), 1)} / 5`]
    ];

    container.innerHTML = `
      <div class="facts-grid">
        ${values.map(([label, value]) => `
          <article>
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
          </article>
        `).join("")}
      </div>
      <p class="facts-focus"><strong>Profil:</strong> ${escapeHtml(facts.focus || "Kein Profiltext hinterlegt.")}</p>
    `;
  }

  function renderCategorySummary(calculation) {
    const container = document.getElementById("categorySummary");
    container.innerHTML = "";

    calculation.categoryScores.forEach((category) => {
      const item = document.createElement("article");
      item.className = "category-row";
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(category.name)}</strong>
          <span>${formatPercent(category.weight)} effektives Kategoriegewicht</span>
        </div>
        <div class="category-score">
          <span>${formatNumber(category.scoreFive, 2)} / 5</span>
          <span>${formatNumber(category.contribution, 1)} Punkte</span>
        </div>
        <div class="progress-track" aria-hidden="true">
          <span class="${scoreClass(category.scoreFive)}" style="width: ${Math.max(2, Math.min(100, category.score100))}%"></span>
        </div>
      `;
      container.appendChild(item);
    });
  }

  function renderScoreTable(calculation) {
    const body = document.getElementById("scoreTableBody");
    body.innerHTML = "";

    calculation.rows.forEach((row, index) => {
      const previous = calculation.rows[index - 1];
      const categoryStart = !previous || previous.categoryId !== row.categoryId;
      const categoryLength = calculation.rows.filter((item) => item.categoryId === row.categoryId).length;
      const tr = document.createElement("tr");

      if (categoryStart) {
        const categoryCell = document.createElement("td");
        categoryCell.className = "category-cell";
        categoryCell.rowSpan = categoryLength;
        categoryCell.textContent = row.categoryName;
        tr.appendChild(categoryCell);

        const categoryWeightCell = document.createElement("td");
        categoryWeightCell.className = "weight-cell";
        categoryWeightCell.rowSpan = categoryLength;
        categoryWeightCell.textContent = formatPercent(row.categoryWeight);
        tr.appendChild(categoryWeightCell);
      }

      const indicatorCell = document.createElement("td");
      indicatorCell.className = "indicator-cell";
      indicatorCell.innerHTML = `<strong>${escapeHtml(row.indicatorName)}</strong><span>${escapeHtml(row.analysis)}</span>`;
      tr.appendChild(indicatorCell);

      const indicatorWeightCell = document.createElement("td");
      indicatorWeightCell.className = "weight-cell";
      indicatorWeightCell.textContent = formatPercent(row.indicatorWeight);
      tr.appendChild(indicatorWeightCell);

      const totalWeightCell = document.createElement("td");
      totalWeightCell.className = "weight-cell";
      totalWeightCell.textContent = formatPercent(row.totalWeight);
      tr.appendChild(totalWeightCell);

      const scoreCell = document.createElement("td");
      scoreCell.className = "score-cell";
      scoreCell.appendChild(createScoreControl(row));
      tr.appendChild(scoreCell);

      const normalizedCell = document.createElement("td");
      normalizedCell.className = "number-cell";
      normalizedCell.textContent = formatNumber(row.normalizedScore, 2);
      tr.appendChild(normalizedCell);

      const contributionCell = document.createElement("td");
      contributionCell.className = "number-cell";
      contributionCell.innerHTML = `<span class="contribution-pill ${scoreClass(row.score)}">${formatNumber(row.contribution, 2)}</span>`;
      tr.appendChild(contributionCell);

      const reasonCell = document.createElement("td");
      reasonCell.className = "reason-cell";
      reasonCell.textContent = cleanDerivationText(row.reason);
      tr.appendChild(reasonCell);

      body.appendChild(tr);
    });
  }

  function renderChanceRisk(calculation) {
    const container = document.getElementById("chanceRiskSummary");
    const chanceRiskCategory = calculation.categoryScores.find((item) => item.id === "chance-risk");
    const chanceRows = calculation.rows.filter((row) => row.categoryId === "chance-risk");
    const items = state.current.chanceRisks || [];

    container.innerHTML = `
      <div class="matrix-score ${scoreClass(chanceRiskCategory.scoreFive)}">
        <span>Matrix-Score</span>
        <strong>${formatNumber(chanceRiskCategory.scoreFive, 2)} / 5</strong>
        <small>${formatNumber(chanceRiskCategory.contribution, 1)} Punkte Beitrag</small>
      </div>
      <div class="mini-table">
        ${chanceRows.map((row) => `
          <div>
            <span>${escapeHtml(row.indicatorName)}</span>
            <strong>${formatNumber(row.score, row.score % 1 === 0 ? 0 : 1)}</strong>
          </div>
        `).join("")}
      </div>
      <div class="risk-list">
        ${items.map((item) => `
          <article>
            <span class="${item.type === "Chance" ? "tag chance" : "tag risk"}">${escapeHtml(item.type)}</span>
            <strong>${escapeHtml(item.priority)}</strong>
            <p>${escapeHtml(item.text)}</p>
          </article>
        `).join("")}
      </div>
    `;
  }

  function renderSources() {
    const container = document.getElementById("sourceArea");
    const sources = state.current.sources || [];
    container.innerHTML = sources.map((source) => {
      const title = source.url
        ? `<a href="${escapeAttribute(source.url)}" target="_blank" rel="noopener">${escapeHtml(source.label)}</a>`
        : escapeHtml(source.label);
      return `
        <article class="source-item">
          <strong>${title}</strong>
          <span>${escapeHtml(source.status)}</span>
          <p>${escapeHtml(source.note || "Keine Notiz hinterlegt.")}</p>
          ${source.basis ? `<small>${escapeHtml(source.basis)}</small>` : ""}
        </article>
      `;
    }).join("");
    document.getElementById("researchNotes").value = state.current.researchNotes || "";
  }

  function buildComparisonSummary(comparison) {
    const diff = comparison.calculationA.totalScore - comparison.calculationB.totalScore;
    const absDiff = Math.abs(diff);
    if (absDiff < 0.05) {
      return `${comparison.assessmentA.name} und ${comparison.assessmentB.name} liegen im Gesamtscore praktisch gleichauf. Unterschiede sollten über Kategorie- und Datenpunktannahmen bewertet werden.`;
    }

    const winner = diff > 0 ? comparison.assessmentA : comparison.assessmentB;
    const loser = diff > 0 ? comparison.assessmentB : comparison.assessmentA;
    const winnerCalc = diff > 0 ? comparison.calculationA : comparison.calculationB;
    const loserCalc = diff > 0 ? comparison.calculationB : comparison.calculationA;
    const advantages = comparison.categoryRows
      .filter((row) => diff > 0 ? row.difference > 0 : row.difference < 0)
      .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
      .slice(0, 2)
      .map((row) => row.name)
      .join(" und ");

    const advantageText = advantages ? `, vor allem in ${advantages}` : "";
    return `${winner.name} schneidet insgesamt besser ab (${formatNumber(winnerCalc.totalScore, 1)} vs. ${formatNumber(loserCalc.totalScore, 1)} Punkte)${advantageText}. ${winner.comparisonNote || ""} ${loser.name} bleibt relevant: ${loser.comparisonNote || ""}`.trim();
  }

  function compareInstitutions(institutionA, institutionB) {
    const resolvedA = resolveInstitution(institutionA);
    const resolvedB = resolveInstitution(institutionB);
    const calculationA = calculateAssessment(resolvedA.assessment);
    const calculationB = calculateAssessment(resolvedB.assessment);

    const categoryRows = data.categories.map((category) => {
      const scoreA = calculationA.categoryScores.find((item) => item.id === category.id);
      const scoreB = calculationB.categoryScores.find((item) => item.id === category.id);
      const difference = scoreA.scoreFive - scoreB.scoreFive;
      const indicatorRows = category.indicators.map((indicator) => {
        const rowA = calculationA.rows.find((row) => row.indicatorId === indicator.id);
        const rowB = calculationB.rows.find((row) => row.indicatorId === indicator.id);
        const indicatorDifference = rowA.score - rowB.score;
        return {
          id: indicator.id,
          name: indicator.name,
          scoreA: rowA.score,
          scoreB: rowB.score,
          difference: indicatorDifference,
          reasonA: cleanDerivationText(rowA.reason),
          reasonB: cleanDerivationText(rowB.reason),
          winner: Math.abs(indicatorDifference) < 0.05 ? "tie" : indicatorDifference > 0 ? "a" : "b"
        };
      });
      return {
        id: category.id,
        name: category.name,
        scoreA: scoreA.scoreFive,
        scoreB: scoreB.scoreFive,
        difference,
        winner: Math.abs(difference) < 0.05 ? "tie" : difference > 0 ? "a" : "b",
        indicatorRows
      };
    });

    const comparison = {
      assessmentA: resolvedA.assessment,
      assessmentB: resolvedB.assessment,
      calculationA,
      calculationB,
      categoryRows
    };
    comparison.summary = buildComparisonSummary(comparison);
    return comparison;
  }

  function renderComparison() {
    const container = document.getElementById("comparisonResult");
    if (!container || !state.comparison) return;

    const comparison = compareInstitutions(state.comparison.aInput, state.comparison.bInput);
    const totalDiff = comparison.calculationA.totalScore - comparison.calculationB.totalScore;
    const winnerText = Math.abs(totalDiff) < 0.05
      ? "Gleichauf"
      : totalDiff > 0
        ? `${comparison.assessmentA.name} vorn`
        : `${comparison.assessmentB.name} vorn`;

    container.hidden = false;
    container.innerHTML = `
      <div class="comparison-kpis">
        <article class="comparison-card ${contributionClass(comparison.calculationA.totalScore)}">
          <span>${escapeHtml(comparison.assessmentA.name)}</span>
          <strong>${formatNumber(comparison.calculationA.totalScore, 1)} / 100</strong>
          <small>${formatNumber(comparison.calculationA.totalScoreFive, 2)} / 5 · ${escapeHtml(comparison.calculationA.recommendation.label)}</small>
          <small>Stark: ${escapeHtml(comparison.calculationA.strongest.name)} · Schwach: ${escapeHtml(comparison.calculationA.weakest.name)}</small>
        </article>
        <article class="comparison-card ${contributionClass(comparison.calculationB.totalScore)}">
          <span>${escapeHtml(comparison.assessmentB.name)}</span>
          <strong>${formatNumber(comparison.calculationB.totalScore, 1)} / 100</strong>
          <small>${formatNumber(comparison.calculationB.totalScoreFive, 2)} / 5 · ${escapeHtml(comparison.calculationB.recommendation.label)}</small>
          <small>Stark: ${escapeHtml(comparison.calculationB.strongest.name)} · Schwach: ${escapeHtml(comparison.calculationB.weakest.name)}</small>
        </article>
      </div>
      <p class="comparison-summary"><strong>${escapeHtml(winnerText)}.</strong> ${escapeHtml(comparison.summary)}</p>
      <div class="table-wrap">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Kategorie</th>
              <th>${escapeHtml(comparison.assessmentA.name)}</th>
              <th>${escapeHtml(comparison.assessmentB.name)}</th>
              <th>Differenz A-B</th>
              <th>Vorteil</th>
            </tr>
          </thead>
          <tbody>
            ${comparison.categoryRows.map((row) => {
              const winnerClass = row.winner === "a" ? "winner-a" : row.winner === "b" ? "winner-b" : "winner-tie";
              const winnerLabel = row.winner === "a" ? comparison.assessmentA.name : row.winner === "b" ? comparison.assessmentB.name : "Gleichauf";
              return `
                <tr>
                  <td>${escapeHtml(row.name)}</td>
                  <td class="${row.winner === "a" ? "winner-a" : ""}">${formatNumber(row.scoreA, 2)} / 5</td>
                  <td class="${row.winner === "b" ? "winner-b" : ""}">${formatNumber(row.scoreB, 2)} / 5</td>
                  <td>${formatSigned(row.difference, 2)}</td>
                  <td><span class="comparison-winner ${winnerClass}">${escapeHtml(winnerLabel)}</span></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="comparison-indicators">
        ${comparison.categoryRows.map((category) => `
          <details class="comparison-detail">
            <summary>
              <strong>${escapeHtml(category.name)}</strong>
              <span>${formatNumber(category.scoreA, 2)} vs. ${formatNumber(category.scoreB, 2)} / 5</span>
            </summary>
            <div class="table-wrap compact-table-wrap">
              <table class="comparison-table indicator-comparison-table">
                <thead>
                  <tr>
                    <th>Indikator</th>
                    <th>${escapeHtml(comparison.assessmentA.name)}</th>
                    <th>${escapeHtml(comparison.assessmentB.name)}</th>
                    <th>Differenz A-B</th>
                    <th>Vorteil</th>
                    <th>Ableitung A</th>
                    <th>Ableitung B</th>
                  </tr>
                </thead>
                <tbody>
                  ${category.indicatorRows.map((row) => {
                    const aClass = row.winner === "a" ? "winner-a" : "";
                    const bClass = row.winner === "b" ? "winner-b" : "";
                    const winnerClass = row.winner === "a" ? "winner-a" : row.winner === "b" ? "winner-b" : "winner-tie";
                    const winnerLabel = row.winner === "a" ? "A" : row.winner === "b" ? "B" : "Gleichauf";
                    return `
                      <tr>
                        <td><strong>${escapeHtml(row.name)}</strong></td>
                        <td class="${aClass}">${formatNumber(row.scoreA, row.scoreA % 1 === 0 ? 0 : 1)} / 5</td>
                        <td class="${bClass}">${formatNumber(row.scoreB, row.scoreB % 1 === 0 ? 0 : 1)} / 5</td>
                        <td>${formatSigned(row.difference, 1)}</td>
                        <td><span class="comparison-winner ${winnerClass}">${escapeHtml(winnerLabel)}</span></td>
                        <td class="comparison-reason">${escapeHtml(row.reasonA)}</td>
                        <td class="comparison-reason">${escapeHtml(row.reasonB)}</td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            </div>
          </details>
        `).join("")}
      </div>
    `;
  }

  function render() {
    if (!state.current) return;

    const dashboard = document.getElementById("dashboard");
    const emptyState = document.getElementById("emptyState");
    dashboard.hidden = false;
    emptyState.hidden = true;

    const calculation = calculateAssessment(state.current);
    renderKpis(calculation);
    renderInstitutionFacts();
    renderCategorySummary(calculation);
    renderScoreTable(calculation);
    renderChanceRisk(calculation);
    renderSources();
    renderComparison();
  }

  function exportCurrentAssessment() {
    if (!state.current) return;
    const calculation = calculateAssessment(state.current);
    const payload = {
      exportedAt: new Date().toISOString(),
      institution: state.current.name,
      note: "Scores werden aus strukturierten Datenpunkten abgeleitet. Fehlende globale Rankings werden nicht automatisch negativ bewertet.",
      categoryWeights: data.categories.map((category) => ({
        id: category.id,
        name: category.name,
        enteredWeight: Number((state.categoryWeights[category.id] || 0).toFixed(4)),
        effectiveWeight: Number((getEffectiveCategoryWeights()[category.id] || 0).toFixed(4))
      })),
      indicatorWeights: data.categories.map((category) => ({
        id: category.id,
        name: category.name,
        enteredWeights: category.indicators.map((indicator) => ({
          id: indicator.id,
          name: indicator.name,
          enteredWeight: Number((state.indicatorWeights[category.id]?.[indicator.id] || 0).toFixed(4)),
          effectiveWeight: Number((getEffectiveIndicatorWeights(category.id)[indicator.id] || 0).toFixed(4))
        }))
      })),
      facts: state.current.facts,
      scoreOverrides: state.current.scoreOverrides || {},
      totalScore100: Number(calculation.totalScore.toFixed(2)),
      totalScore5: Number(calculation.totalScoreFive.toFixed(2)),
      recommendation: calculation.recommendation.label,
      categoryScores: calculation.categoryScores.map((category) => ({
        name: category.name,
        weight: category.weight,
        score5: Number(category.scoreFive.toFixed(2)),
        contribution100: Number(category.contribution.toFixed(2))
      })),
      rows: calculation.rows.map((row) => ({
        category: row.categoryName,
        categoryWeight: row.categoryWeight,
        indicator: row.indicatorName,
        indicatorWeight: row.indicatorWeight,
        totalWeight: row.totalWeight,
        score: row.score,
        calculatedScore: row.derivedScore,
        isManualOverride: row.isManual,
        normalizedScore: Number(row.normalizedScore.toFixed(2)),
        contribution100: Number(row.contribution.toFixed(2)),
        reason: cleanDerivationText(row.reason)
      })),
      chanceRisks: state.current.chanceRisks,
      sources: state.current.sources,
      researchNotes: state.current.researchNotes
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(state.current.name || "bewertung")}-scorecard.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function initDemoPicker() {
    const demoSelect = document.getElementById("demoSelect");
    const datalist = document.getElementById("institutionOptions");
    const options = Object.entries(data.institutions).map(([key, institution]) => (
      `<option value="${key}">${escapeHtml(institution.name)}</option>`
    )).join("");
    const datalistOptions = Object.values(data.institutions).map((institution) => (
      `<option value="${escapeAttribute(institution.name)}"></option>`
    )).join("");

    demoSelect.innerHTML = options;
    datalist.innerHTML = datalistOptions;
  }

  function initEvents() {
    const institutionInput = document.getElementById("institutionInput");
    const suggestions = document.getElementById("institutionSuggestions");

    document.querySelectorAll(".tab-button").forEach((button) => {
      button.addEventListener("click", () => setActiveView(button.dataset.view));
    });

    document.getElementById("startForm").addEventListener("submit", (event) => {
      event.preventDefault();
      loadInstitutionFromInput(institutionInput.value);
      suggestions.hidden = true;
    });

    institutionInput.addEventListener("input", updateSearchSuggestions);
    institutionInput.addEventListener("focus", updateSearchSuggestions);
    institutionInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") suggestions.hidden = true;
    });

    suggestions.addEventListener("mousedown", (event) => {
      const button = event.target.closest(".suggestion-button");
      if (!button) return;
      event.preventDefault();
      institutionInput.value = button.dataset.value;
      loadInstitutionFromInput(button.dataset.value);
      suggestions.hidden = true;
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".start-form")) suggestions.hidden = true;
    });

    document.getElementById("loadDemoButton").addEventListener("click", () => {
      const key = document.getElementById("demoSelect").value;
      const assessment = profileToAssessment(key);
      institutionInput.value = assessment.name;
      setCurrentAssessment(assessment, key);
    });

    document.getElementById("comparisonForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const aInput = document.getElementById("comparisonInputA").value.trim() || "Institution A";
      const bInput = document.getElementById("comparisonInputB").value.trim() || "Institution B";
      state.comparison = { aInput, bInput };
      renderComparison();
    });

    document.getElementById("closeComparisonButton").addEventListener("click", () => {
      setActiveView("single");
    });

    document.getElementById("scoreTableBody").addEventListener("change", (event) => {
      if (!event.target.matches(".score-select")) return;
      const indicatorId = event.target.dataset.indicatorId;
      const score = normalizeScoreOverride(event.target.value);
      if (score === null || !state.current) return;
      getScoreOverrides(state.current)[indicatorId] = score;
      storeAssessment(state.current);
      render();
    });

    document.getElementById("weightControls").addEventListener("input", (event) => {
      if (event.target.matches("[data-category-id]")) {
        const categoryId = event.target.dataset.categoryId;
        state.categoryWeights[categoryId] = clamp(event.target.value, 0, 100) / 100;
        updateWeightStatus();
        if (state.current) render();
        else renderComparison();
        return;
      }

      if (event.target.matches("[data-indicator-category-id][data-indicator-id]")) {
        const categoryId = event.target.dataset.indicatorCategoryId;
        const indicatorId = event.target.dataset.indicatorId;
        if (!state.indicatorWeights[categoryId]) state.indicatorWeights[categoryId] = {};
        state.indicatorWeights[categoryId][indicatorId] = clamp(event.target.value, 0, 100) / 100;
        updateIndicatorWeightStatus(categoryId);
        if (state.current) render();
        else renderComparison();
      }
    });

    document.getElementById("weightControls").addEventListener("click", (event) => {
      const normalizeButton = event.target.closest("[data-normalize-indicators]");
      const resetButton = event.target.closest("[data-reset-indicators]");

      if (normalizeButton) {
        const categoryId = normalizeButton.dataset.normalizeIndicators;
        const sum = getRawIndicatorWeightSum(categoryId);
        if (sum <= 0) return;
        Object.keys(state.indicatorWeights[categoryId] || {}).forEach((indicatorId) => {
          state.indicatorWeights[categoryId][indicatorId] = (state.indicatorWeights[categoryId][indicatorId] || 0) / sum;
        });
        syncIndicatorWeightInputs(categoryId);
        if (state.current) render();
        else renderComparison();
      }

      if (resetButton) {
        const categoryId = resetButton.dataset.resetIndicators;
        state.indicatorWeights[categoryId] = clone(defaultIndicatorWeights[categoryId]);
        syncIndicatorWeightInputs(categoryId);
        if (state.current) render();
        else renderComparison();
      }
    });

    document.getElementById("normalizeWeightsButton").addEventListener("click", () => {
      const sum = getRawWeightSum();
      if (sum <= 0) return;
      data.categories.forEach((category) => {
        state.categoryWeights[category.id] = (state.categoryWeights[category.id] || 0) / sum;
      });
      syncWeightInputs();
      if (state.current) render();
      else renderComparison();
    });

    document.getElementById("resetWeightsButton").addEventListener("click", () => {
      state.categoryWeights = clone(defaultCategoryWeights);
      state.indicatorWeights = clone(defaultIndicatorWeights);
      syncWeightInputs();
      syncIndicatorWeightInputs();
      if (state.current) render();
      else renderComparison();
    });

    document.getElementById("researchNotes").addEventListener("input", (event) => {
      state.current.researchNotes = event.target.value;
      storeAssessment(state.current);
    });

    document.getElementById("exportButton").addEventListener("click", exportCurrentAssessment);
    document.getElementById("resetButton").addEventListener("click", () => {
      if (state.baseline) setCurrentAssessment(state.baseline, state.activeProfileKey);
    });
    document.getElementById("printButton").addEventListener("click", () => window.print());
  }

  function init() {
    initDemoPicker();
    renderMethodology();
    renderWeightControls();
    initEvents();
    setActiveView("single");
  }

  window.ScorecardCalculator = {
    calculateAssessment,
    calculateReputationScore,
    calculateResearchScore,
    calculatePracticeOrientationScore,
    calculateCostAccessibilityScore,
    calculateInternationalVisibilityScore,
    calculateRegulatorySecurityScore,
    calculateScalabilityScore,
    calculateMarketAttractivenessScore,
    calculateProviderAttractivenessScore,
    calculateRiskBarrierScore,
    calculateSustainabilityScalabilityScore,
    calculateChanceRiskScore,
    createBlankAssessment,
    createManualInstitution,
    demoToAssessment,
    findDemoKey,
    getInstitutionBySearchInput,
    compareInstitutions,
    renderComparison,
    updateSearchSuggestions
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
