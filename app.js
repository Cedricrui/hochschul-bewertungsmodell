(function () {
  "use strict";

  const data = window.ScorecardData;
  const state = {
    current: null,
    baseline: null,
    activeDemoKey: "",
    assessmentStore: {},
    comparison: null
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

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " und ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
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

  function allIndicatorIds() {
    return data.categories.flatMap((category) => category.indicators.map((indicator) => indicator.id));
  }

  function storeAssessment(assessment) {
    if (!assessment?.name) return;
    state.assessmentStore[slugify(assessment.name)] = clone(assessment);
  }

  function createManualInstitution(name) {
    const assessments = {};
    allIndicatorIds().forEach((id) => {
      assessments[id] = { score: 3, reason: "" };
    });

    const template = data.manualTemplate || {};
    return {
      name: name || "Neue Bewertung",
      isDemo: false,
      comparisonNote: template.comparisonNote || "Neutrale manuelle Bewertung mit Standardwerten.",
      researchNotes: template.researchNotes || "",
      assessments,
      chanceRisks: clone(template.chanceRisks || []),
      sources: clone(template.sources || [])
    };
  }

  function createBlankAssessment(name) {
    return createManualInstitution(name);
  }

  function demoToAssessment(key) {
    const demo = data.demos[key];
    const assessment = createManualInstitution(demo.name);
    assessment.isDemo = true;
    assessment.demoKey = key;
    assessment.comparisonNote = demo.comparisonNote || assessment.comparisonNote;
    assessment.researchNotes = demo.researchNotes || "";
    assessment.chanceRisks = clone(demo.chanceRisks || []);
    assessment.sources = clone(demo.sources || []);

    Object.entries(demo.assessments || {}).forEach(([indicatorId, value]) => {
      assessment.assessments[indicatorId] = {
        score: value[0],
        reason: value[1]
      };
    });

    return assessment;
  }

  function findDemoKey(name) {
    const wanted = slugify(name);
    if (!wanted) return "";
    if (data.demos[wanted]) return wanted;

    return Object.entries(data.demos).find(([, demo]) => {
      const demoSlug = slugify(demo.name);
      return wanted === demoSlug || wanted.includes(demoSlug) || demoSlug.includes(wanted);
    })?.[0] || "";
  }

  function getRecommendation(totalScore) {
    const roundedScore = Math.max(0, Math.min(100, Math.round(totalScore * 100) / 100));
    const band = data.recommendationBands.find((item) => roundedScore >= item.min);
    return band || data.recommendationBands[data.recommendationBands.length - 1];
  }

  function calculateAssessment(assessment) {
    const rows = [];
    const categoryScores = data.categories.map((category) => {
      let categoryContribution = 0;

      category.indicators.forEach((indicator) => {
        const entry = assessment.assessments[indicator.id] || { score: 3, reason: "" };
        const score = Number(entry.score) || 0;
        const normalizedScore = score / 5;
        const totalWeight = category.weight * indicator.weight;
        const contribution = normalizedScore * totalWeight * 100;
        categoryContribution += contribution;

        rows.push({
          categoryId: category.id,
          categoryName: category.name,
          categoryWeight: category.weight,
          indicatorId: indicator.id,
          indicatorName: indicator.name,
          indicatorWeight: indicator.weight,
          totalWeight,
          score,
          normalizedScore,
          contribution,
          contributionOfCategory: contribution / (category.weight * 100),
          analysis: indicator.analysis,
          reason: entry.reason || ""
        });
      });

      const scoreFive = category.weight ? (categoryContribution / (category.weight * 100)) * 5 : 0;
      return {
        id: category.id,
        name: category.name,
        weight: category.weight,
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

    const demoKey = findDemoKey(name);
    if (demoKey) {
      return { assessment: demoToAssessment(demoKey), key: demoKey, kind: "demo" };
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

  function setCurrentAssessment(assessment, demoKey) {
    state.current = clone(assessment);
    state.baseline = clone(assessment);
    state.activeDemoKey = demoKey || "";
    storeAssessment(state.current);
    render();
  }

  function buildSearchSuggestions(query) {
    const trimmed = query.trim();
    const normalized = slugify(trimmed);
    const suggestions = [];

    Object.entries(data.demos).forEach(([key, demo]) => {
      const demoSlug = slugify(demo.name);
      if (!normalized || demoSlug.includes(normalized) || normalized.includes(demoSlug)) {
        suggestions.push({
          kind: "demo",
          key,
          value: demo.name,
          label: demo.name,
          meta: "Demo-Bewertung laden"
        });
      }
    });

    const hasExactDemo = suggestions.some((item) => slugify(item.value) === normalized);
    if (trimmed && !hasExactDemo) {
      suggestions.push({
        kind: "manual",
        key: slugify(trimmed),
        value: trimmed,
        label: trimmed,
        meta: "neue manuelle Bewertung erstellen"
      });
    }

    return suggestions.slice(0, 6);
  }

  function updateSearchSuggestions() {
    const input = document.getElementById("institutionInput");
    const container = document.getElementById("institutionSuggestions");
    if (!input || !container) return;

    const suggestions = buildSearchSuggestions(input.value);
    container.hidden = suggestions.length === 0;
    container.innerHTML = suggestions.map((item) => `
      <button class="suggestion-button" type="button" role="option" data-kind="${item.kind}" data-value="${escapeHtml(item.value)}">
        <span>${escapeHtml(item.label)}</span>
        <small>${escapeHtml(item.meta)}</small>
      </button>
    `).join("");
  }

  function loadInstitutionFromInput(value) {
    const result = getInstitutionBySearchInput(value);
    const demoKey = result.kind === "demo" ? result.key : "";
    const input = document.getElementById("institutionInput");
    if (input) input.value = result.assessment.name;
    setCurrentAssessment(result.assessment, demoKey);
    return result;
  }

  function createScoreSelect(row) {
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

    return select;
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

  function renderCategorySummary(calculation) {
    const container = document.getElementById("categorySummary");
    container.innerHTML = "";

    calculation.categoryScores.forEach((category) => {
      const item = document.createElement("article");
      item.className = "category-row";
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(category.name)}</strong>
          <span>${formatPercent(category.weight)} Kategoriegewicht</span>
        </div>
        <div class="category-score">
          <span>${formatNumber(category.scoreFive, 2)} / 5</span>
          <span>${formatNumber(category.contribution, 1)} Punkte</span>
        </div>
        <div class="progress-track" aria-hidden="true">
          <span class="${scoreClass(category.scoreFive)}" style="width: ${Math.max(2, category.score100)}%"></span>
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
        categoryWeightCell.rowSpan = categoryLength;
        categoryWeightCell.textContent = formatPercent(row.categoryWeight);
        tr.appendChild(categoryWeightCell);
      }

      const indicatorCell = document.createElement("td");
      indicatorCell.innerHTML = `<strong>${escapeHtml(row.indicatorName)}</strong><span>${escapeHtml(row.analysis)}</span>`;
      tr.appendChild(indicatorCell);

      const indicatorWeightCell = document.createElement("td");
      indicatorWeightCell.textContent = formatPercent(row.indicatorWeight);
      tr.appendChild(indicatorWeightCell);

      const totalWeightCell = document.createElement("td");
      totalWeightCell.textContent = formatPercent(row.totalWeight);
      tr.appendChild(totalWeightCell);

      const scoreCell = document.createElement("td");
      scoreCell.appendChild(createScoreSelect(row));
      tr.appendChild(scoreCell);

      const normalizedCell = document.createElement("td");
      normalizedCell.textContent = formatNumber(row.normalizedScore, 2);
      tr.appendChild(normalizedCell);

      const contributionCell = document.createElement("td");
      contributionCell.innerHTML = `<span class="contribution-pill ${scoreClass(row.score)}">${formatNumber(row.contribution, 2)}</span>`;
      tr.appendChild(contributionCell);

      const reasonCell = document.createElement("td");
      const textarea = document.createElement("textarea");
      textarea.className = "reason-input";
      textarea.dataset.indicatorId = row.indicatorId;
      textarea.rows = 3;
      textarea.placeholder = "Kurzbegründung ergänzen";
      textarea.value = row.reason;
      reasonCell.appendChild(textarea);
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
    container.innerHTML = sources.map((source) => `
      <article class="source-item">
        <strong>${escapeHtml(source.label)}</strong>
        <span>${escapeHtml(source.status)}</span>
        <p>${escapeHtml(source.note || "Keine Notiz hinterlegt.")}</p>
      </article>
    `).join("");
    document.getElementById("researchNotes").value = state.current.researchNotes || "";
  }

  function buildComparisonSummary(comparison) {
    const diff = comparison.calculationA.totalScore - comparison.calculationB.totalScore;
    const absDiff = Math.abs(diff);
    if (absDiff < 0.05) {
      return `${comparison.assessmentA.name} und ${comparison.assessmentB.name} liegen im Gesamtscore praktisch gleichauf. Unterschiede sollten vor allem über einzelne Kategorie- und Indikatorannahmen bewertet werden.`;
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
      return {
        id: category.id,
        name: category.name,
        scoreA: scoreA.scoreFive,
        scoreB: scoreB.scoreFive,
        difference,
        winner: Math.abs(difference) < 0.05 ? "tie" : difference > 0 ? "a" : "b"
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
      note: "Demo-Daten sind Platzhalter und müssen vor echter Nutzung quellenbasiert validiert werden.",
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
        normalizedScore: Number(row.normalizedScore.toFixed(2)),
        contribution100: Number(row.contribution.toFixed(2)),
        reason: row.reason
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
    const options = Object.entries(data.demos).map(([key, demo]) => (
      `<option value="${key}">${escapeHtml(demo.name)}</option>`
    )).join("");
    const datalistOptions = Object.values(data.demos).map((demo) => (
      `<option value="${escapeHtml(demo.name)}"></option>`
    )).join("");

    demoSelect.innerHTML = options;
    datalist.innerHTML = datalistOptions;
  }

  function initEvents() {
    const institutionInput = document.getElementById("institutionInput");
    const suggestions = document.getElementById("institutionSuggestions");

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
      const assessment = demoToAssessment(key);
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

    document.getElementById("scoreTableBody").addEventListener("change", (event) => {
      if (!event.target.matches(".score-select")) return;
      const indicatorId = event.target.dataset.indicatorId;
      state.current.assessments[indicatorId].score = Number(event.target.value);
      storeAssessment(state.current);
      render();
    });

    document.getElementById("scoreTableBody").addEventListener("input", (event) => {
      if (!event.target.matches(".reason-input")) return;
      const indicatorId = event.target.dataset.indicatorId;
      state.current.assessments[indicatorId].reason = event.target.value;
      storeAssessment(state.current);
    });

    document.getElementById("researchNotes").addEventListener("input", (event) => {
      state.current.researchNotes = event.target.value;
      storeAssessment(state.current);
    });

    document.getElementById("exportButton").addEventListener("click", exportCurrentAssessment);
    document.getElementById("resetButton").addEventListener("click", () => {
      if (state.baseline) setCurrentAssessment(state.baseline, state.activeDemoKey);
    });
    document.getElementById("printButton").addEventListener("click", () => window.print());
  }

  function init() {
    initDemoPicker();
    initEvents();
  }

  window.ScorecardCalculator = {
    calculateAssessment,
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
