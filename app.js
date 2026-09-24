const WORKER_URL =
  "https://rankpilot-api.alvaroalvarezmonteagudo.workers.dev/";

const form = document.getElementById("seoForm");
const input = document.getElementById("urlInput");
const message = document.getElementById("analyzerMessage");


/* =========================================================
   COMPETITOR ANALYSIS — CONTROLES
========================================================= */

function createCompetitorControls() {
  if (document.getElementById("rankpilotCompetitors")) return;

  const wrapper = document.createElement("div");

  wrapper.id = "rankpilotCompetitors";

  wrapper.innerHTML = `
    <div class="rp-competitor-box">

      <div class="rp-competitor-header">
        <div>
          <span class="rp-small-label">COMPETITOR ANALYSIS</span>
          <h3>Compara tu web con tus competidores</h3>
          <p>
            Añade hasta 3 webs para descubrir oportunidades de palabras clave.
          </p>
        </div>
      </div>

      <div class="rp-competitor-fields">

        <div class="rp-competitor-field">
          <span>01</span>
          <input
            type="text"
            class="competitor-input"
            placeholder="https://competidor1.com"
          />
        </div>

        <div class="rp-competitor-field">
          <span>02</span>
          <input
            type="text"
            class="competitor-input"
            placeholder="https://competidor2.com"
          />
        </div>

        <div class="rp-competitor-field">
          <span>03</span>
          <input
            type="text"
            class="competitor-input"
            placeholder="https://competidor3.com"
          />
        </div>

      </div>

      <div class="rp-competitor-help">
        Los competidores son opcionales. Si los dejas vacíos,
        RankPilot realizará únicamente el análisis SEO normal.
      </div>

    </div>
  `;

  /*
    Intentamos colocar los campos antes del botón de análisis.
  */

  const submitButton = form.querySelector(
    'button[type="submit"], input[type="submit"]'
  );

  if (submitButton) {
    submitButton.insertAdjacentElement("beforebegin", wrapper);
  } else {
    form.appendChild(wrapper);
  }

  addCompetitorStyles();
}


/* =========================================================
   ESTILOS COMPETITOR ANALYSIS
========================================================= */

function addCompetitorStyles() {
  if (document.getElementById("rankpilotCompetitorStyles")) return;

  const style = document.createElement("style");

  style.id = "rankpilotCompetitorStyles";

  style.textContent = `
    .rp-competitor-box {
      margin: 24px 0;
      padding: 24px;
      border: 1px solid rgba(255,255,255,.10);
      border-radius: 16px;
      background: rgba(255,255,255,.025);
    }

    .rp-small-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .12em;
      opacity: .6;
      margin-bottom: 7px;
    }

    .rp-competitor-header h3 {
      margin: 0 0 6px;
      font-size: 20px;
    }

    .rp-competitor-header p {
      margin: 0;
      opacity: .65;
      font-size: 14px;
    }

    .rp-competitor-fields {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 20px;
    }

    .rp-competitor-field {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rp-competitor-field > span {
      min-width: 24px;
      font-size: 11px;
      opacity: .5;
      font-weight: 700;
    }

    .rp-competitor-field input {
      width: 100%;
      box-sizing: border-box;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(0,0,0,.15);
      color: inherit;
      outline: none;
    }

    .rp-competitor-field input:focus {
      border-color: rgba(255,255,255,.35);
    }

    .rp-competitor-help {
      margin-top: 12px;
      font-size: 12px;
      opacity: .5;
    }

    .rp-competitor-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin: 20px 0;
    }

    .rp-competitor-stat {
      padding: 18px;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 14px;
      background: rgba(255,255,255,.025);
    }

    .rp-competitor-stat span {
      display: block;
      font-size: 12px;
      opacity: .6;
      margin-bottom: 7px;
    }

    .rp-competitor-stat strong {
      display: block;
      font-size: 27px;
    }

    .rp-competitor-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
      margin-bottom: 24px;
    }

    .rp-competitor-card {
      padding: 18px;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 14px;
      background: rgba(255,255,255,.025);
    }

    .rp-competitor-card small {
      display: block;
      opacity: .5;
      margin-bottom: 8px;
      word-break: break-all;
    }

    .rp-competitor-score {
      font-size: 32px;
      font-weight: 800;
    }

    .rp-competitor-score-label {
      font-size: 12px;
      opacity: .55;
    }

    .rp-gap-table-wrapper {
      overflow-x: auto;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 14px;
    }

    .rp-gap-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 650px;
    }

    .rp-gap-table th,
    .rp-gap-table td {
      padding: 13px 15px;
      text-align: left;
      border-bottom: 1px solid rgba(255,255,255,.07);
      font-size: 13px;
    }

    .rp-gap-table th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: .06em;
      opacity: .55;
    }

    .rp-gap-table tr:last-child td {
      border-bottom: 0;
    }

    .rp-opportunity {
      font-weight: 800;
    }

    .rp-positive {
      font-weight: 700;
    }

    .rp-keyword-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }

    .rp-keyword-pill {
      padding: 7px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.08);
      font-size: 12px;
    }

    .rp-empty {
      padding: 20px;
      border-radius: 12px;
      border: 1px dashed rgba(255,255,255,.12);
      opacity: .65;
      text-align: center;
    }

    @media (max-width: 800px) {
      .rp-competitor-fields,
      .rp-competitor-summary,
      .rp-competitor-cards {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}


/* =========================================================
   INICIALIZACIÓN
========================================================= */

createCompetitorControls();


/* =========================================================
   ANALIZAR WEB
========================================================= */

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  let url = input.value.trim();

  if (!url) {
    message.innerHTML = `
      <div class="seo-error">
        ❌ Introduce una URL.
      </div>
    `;
    return;
  }

  url = normalizeUrl(url);

  if (!url) {
    message.innerHTML = `
      <div class="seo-error">
        ❌ La URL introducida no es válida.
      </div>
    `;
    return;
  }


  /* =====================================================
     OBTENER COMPETIDORES
  ===================================================== */

  const competitorInputs = [
    ...document.querySelectorAll(".competitor-input")
  ];

  const competitors = [];

  for (const competitorInput of competitorInputs) {
    const value = competitorInput.value.trim();

    if (!value) continue;

    const normalized = normalizeUrl(value);

    if (!normalized) {
      message.innerHTML = `
        <div class="seo-error">
          ❌ Esta URL de competidor no es válida:
          <strong>${escapeHtml(value)}</strong>
        </div>
      `;
      return;
    }

    competitors.push(normalized);
  }


  /* Eliminar duplicados */

  const uniqueCompetitors = [
    ...new Set(competitors)
  ];


  /* Evitar comparar la web consigo misma */

  const targetHostname = getHostname(url);

  const filteredCompetitors = uniqueCompetitors.filter(
    competitor => getHostname(competitor) !== targetHostname
  );


  /* =====================================================
     LOADING
  ===================================================== */

  message.innerHTML = `
    <div class="seo-loading">

      <div class="loading-spinner"></div>

      <h3>
        Analizando ${escapeHtml(url)}
      </h3>

      <p>
        Revisando SEO técnico, contenido, keywords
        ${filteredCompetitors.length ? "y competidores" : ""}
        ...
      </p>

    </div>
  `;


  /* =====================================================
     CONSTRUIR REQUEST
  ===================================================== */

  const params = new URLSearchParams();

  params.set("url", url);

  filteredCompetitors
    .slice(0, 3)
    .forEach((competitor) => {
      params.append("competitor", competitor);
    });


  try {

    const response = await fetch(
      `${WORKER_URL}?${params.toString()}`
    );

    const data = await response.json();


    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "No se pudo analizar la web."
      );
    }


    renderResults(data);

  } catch (error) {

    console.error(error);

    message.innerHTML = `
      <div class="seo-error">

        <strong>
          ❌ No hemos podido analizar la web.
        </strong>

        <p>
          ${escapeHtml(error.message)}
        </p>

      </div>
    `;
  }
});


/* =========================================================
   RENDER PRINCIPAL
========================================================= */

function renderResults(data) {

  const seo = data.seo || {};

  const categories = seo.categories || {};

  const keywords = seo.keywords || [];

  const keywordRecommendations =
    seo.keywordRecommendations || [];

  const criticalIssues =
    seo.issues || [];

  const warnings =
    seo.warnings || [];

  const passed =
    seo.passed || [];

  const competitorAnalysis =
    data.competitorAnalysis || null;

  const competitors =
    data.competitors || [];


  const getStatus = (score) => {

    if (score >= 80) return "good";

    if (score >= 60) return "warning";

    return "bad";
  };


  const getLabel = (score) => {

    if (score >= 90) return "Excelente";

    if (score >= 80) return "Bueno";

    if (score >= 60) return "Mejorable";

    return "Necesita atención";
  };


  let hostname = "";

  try {
    hostname = new URL(
      data.finalUrl
    ).hostname;

  } catch {
    hostname = data.finalUrl || "";
  }


  message.innerHTML = `

    <div class="seo-dashboard">


      <!-- =================================================
           HEADER
      ================================================= -->

      <div class="results-header">

        <div>

          <span class="results-label">
            ANÁLISIS SEO
          </span>

          <h2>
            ${escapeHtml(hostname)}
          </h2>

          <p>
            ${escapeHtml(data.finalUrl || "")}
          </p>

        </div>


        <button
          class="new-analysis"
          onclick="window.scrollTo({top: 0, behavior: 'smooth'})"
        >
          ← Nuevo análisis
        </button>

      </div>



      <!-- =================================================
           SCORE
      ================================================= -->

      <div class="main-score-card">

        <div class="score-ring ${getStatus(seo.score || 0)}">

          <div class="score-ring-inner">

            <strong>
              ${seo.score || 0}
            </strong>

            <span>/100</span>

          </div>

        </div>


        <div class="score-summary">

          <span class="score-label">
            SEO SCORE
          </span>

          <h2>
            ${getLabel(seo.score || 0)}
          </h2>

          <p>
            Tu página ha sido analizada en múltiples
            factores técnicos y de contenido.
          </p>


          <div class="score-stats">

            <span>
              🔴 ${criticalIssues.length} problemas
            </span>

            <span>
              🟡 ${warnings.length} recomendaciones
            </span>

            <span>
              🟢 ${passed.length} correctos
            </span>

          </div>

        </div>

      </div>



      <!-- =================================================
           CATEGORÍAS
      ================================================= -->

      <div class="section-title">

        <div>

          <span>
            PERFORMANCE
          </span>

          <h2>
            Desglose SEO
          </h2>

        </div>

      </div>


      <div class="category-grid">

        ${categoryCard(
          "Technical SEO",
          categories.technical || 0,
          "Infraestructura y configuración técnica"
        )}

        ${categoryCard(
          "On-Page SEO",
          categories.onPage || 0,
          "Elementos SEO visibles de la página"
        )}

        ${categoryCard(
          "Content",
          categories.content || 0,
          "Calidad y cantidad del contenido"
        )}

        ${categoryCard(
          "Indexability",
          categories.indexability || 0,
          "Factores relacionados con indexación"
        )}

      </div>



      <!-- =================================================
           KEYWORD INTELLIGENCE
      ================================================= -->

      ${renderKeywordIntelligence(
        keywords,
        seo
      )}



      <!-- =================================================
           KEYWORD RECOMMENDATIONS
      ================================================= -->

      ${renderKeywordRecommendations(
        keywordRecommendations
      )}



      <!-- =================================================
           COMPETITOR ANALYSIS
      ================================================= -->

      ${renderCompetitorAnalysis(
        competitorAnalysis,
        competitors
      )}



      <!-- =================================================
           PROBLEMAS
      ================================================= -->

      <div class="section-title">

        <div>

          <span>
            PRIORIDADES
          </span>

          <h2>
            Qué deberías solucionar
          </h2>

        </div>

      </div>


      <div class="problems-card">

        ${
          criticalIssues.length

            ? criticalIssues
                .map(
                  (issue, index) => `

                    <div class="problem critical">

                      <div class="problem-icon">
                        ${index + 1}
                      </div>


                      <div class="problem-content">

                        <strong>
                          ${escapeHtml(issue)}
                        </strong>

                        <p>
                          Este problema puede afectar
                          al rendimiento SEO de la página.
                        </p>

                      </div>


                      <button
                        class="fix-button"
                        onclick="showFix(this)"
                      >
                        Cómo solucionarlo
                      </button>


                      <div class="fix-content">

                        Revisa este elemento y corrígelo
                        en el código o CMS de tu página.
                        Después vuelve a ejecutar el análisis
                        para comprobar el resultado.

                      </div>

                    </div>

                  `
                )
                .join("")

            : `

              <div class="empty-state">

                🎉 No se han detectado problemas críticos.

              </div>

            `
        }


        ${
          warnings.length

            ? warnings
                .map(
                  (warning, index) => `

                    <div class="problem warning">

                      <div class="problem-icon">
                        ${index + 1}
                      </div>


                      <div class="problem-content">

                        <strong>
                          ${escapeHtml(warning)}
                        </strong>

                        <p>
                          Es una oportunidad para mejorar
                          el SEO de esta página.
                        </p>

                      </div>


                      <button
                        class="fix-button"
                        onclick="showFix(this)"
                      >
                        Cómo solucionarlo
                      </button>


                      <div class="fix-content">

                        Optimiza este elemento siguiendo
                        las buenas prácticas SEO y vuelve
                        a analizar la página.

                      </div>

                    </div>

                  `
                )
                .join("")

            : ""

        }

      </div>



      <!-- =================================================
           ON PAGE
      ================================================= -->

      <div class="section-title">

        <div>

          <span>
            ON-PAGE
          </span>

          <h2>
            Elementos de la página
          </h2>

        </div>

      </div>


      <div class="metrics-grid">

        ${metric(
          "Title",
          seo.title || "No encontrado",
          `${seo.titleLength || 0} caracteres`
        )}

        ${metric(
          "Meta Description",
          seo.description || "No encontrada",
          `${seo.descriptionLength || 0} caracteres`
        )}

        ${metric(
          "H1",
          seo.h1Count || 0,
          "etiquetas"
        )}

        ${metric(
          "H2",
          seo.h2Count || 0,
          "etiquetas"
        )}

        ${metric(
          "H3",
          seo.h3Count || 0,
          "etiquetas"
        )}

        ${metric(
          "Contenido",
          seo.wordCount || 0,
          "palabras"
        )}

        ${metric(
          "Imágenes",
          seo.imageCount || 0,
          "total"
        )}

        ${metric(
          "Imágenes sin ALT",
          seo.imagesWithoutAlt || 0,
          "sin atributo ALT"
        )}

        ${metric(
          "Enlaces internos",
          seo.internalLinks || 0,
          "enlaces"
        )}

        ${metric(
          "Enlaces externos",
          seo.externalLinks || 0,
          "enlaces"
        )}

      </div>



      <!-- =================================================
           TECHNICAL
      ================================================= -->

      <div class="section-title">

        <div>

          <span>
            TECHNICAL
          </span>

          <h2>
            Configuración técnica
          </h2>

        </div>

      </div>


      <div class="technical-grid">

        ${technicalItem(
          "HTTPS",
          seo.hasHttps
        )}

        ${technicalItem(
          "Viewport",
          seo.hasViewport
        )}

        ${technicalItem(
          "Canonical",
          seo.hasCanonical
        )}

        ${technicalItem(
          "Robots",
          seo.hasRobots
        )}

        ${technicalItem(
          "Favicon",
          seo.hasFavicon
        )}

        ${technicalItem(
          "Schema",
          seo.hasSchema
        )}

        ${technicalItem(
          "Open Graph",
          seo.hasOpenGraph
        )}

        ${technicalItem(
          "Twitter Card",
          seo.hasTwitterCard
        )}

      </div>



      <!-- =================================================
           PASSED
      ================================================= -->

      <div class="passed-card">

        <div class="passed-header">

          <span>
            ✓
          </span>

          <div>

            <strong>
              Elementos correctamente configurados
            </strong>

            <p>
              ${passed.length}
              comprobaciones superadas
            </p>

          </div>

        </div>


        <div class="passed-list">

          ${
            passed.length

              ? passed
                  .map(
                    item => `
                      <div>
                        ✓ ${escapeHtml(item)}
                      </div>
                    `
                  )
                  .join("")

              : `
                <div>
                  No hay elementos registrados.
                </div>
              `
          }

        </div>

      </div>


    </div>
  `;
}


/* =========================================================
   KEYWORD INTELLIGENCE
========================================================= */

function renderKeywordIntelligence(keywords, seo) {

  if (!keywords.length) {

    return `

      <div class="section-title">

        <div>

          <span>
            KEYWORD INTELLIGENCE
          </span>

          <h2>
            Palabras clave detectadas
          </h2>

        </div>

      </div>

      <div class="empty-state">
        No se han detectado suficientes keywords.
      </div>

    `;
  }


  const topKeywords =
    keywords
      .slice()
      .sort(
        (a, b) =>
          (b.score || 0) -
          (a.score || 0)
      )
      .slice(0, 20);


  return `

    <div class="section-title">

      <div>

        <span>
          KEYWORD INTELLIGENCE
        </span>

        <h2>
          Palabras clave detectadas
        </h2>

      </div>

    </div>


    <div class="problems-card">

      <div class="keyword-summary">

        <strong>
          ${seo.keywordCount || keywords.length}
        </strong>

        <span>
          keywords analizadas
        </span>

        ${
          seo.primaryKeyword
            ? `
              <span>
                Keyword principal:
                <strong>
                  ${escapeHtml(seo.primaryKeyword)}
                </strong>
              </span>
            `
            : ""
        }

      </div>


      <div class="rp-gap-table-wrapper">

        <table class="rp-gap-table">

          <thead>

            <tr>

              <th>
                Keyword
              </th>

              <th>
                Tipo
              </th>

              <th>
                Frecuencia
              </th>

              <th>
                Score
              </th>

            </tr>

          </thead>


          <tbody>

            ${topKeywords
              .map(
                keyword => `

                  <tr>

                    <td>
                      <strong>
                        ${escapeHtml(
                          keyword.keyword || ""
                        )}
                      </strong>
                    </td>

                    <td>
                      ${escapeHtml(
                        getKeywordTypeLabel(
                          keyword.type
                        )
                      )}
                    </td>

                    <td>
                      ${keyword.count || 0}
                    </td>

                    <td>
                      ${keyword.score || 0}
                    </td>

                  </tr>

                `
              )
              .join("")}

          </tbody>

        </table>

      </div>

    </div>

  `;
}


/* =========================================================
   KEYWORD RECOMMENDATIONS
========================================================= */

function renderKeywordRecommendations(
  recommendations
) {

  if (!recommendations.length) {
    return "";
  }


  return `

    <div class="section-title">

      <div>

        <span>
          SEO ACTIONS
        </span>

        <h2>
          Keywords que deberías trabajar
        </h2>

      </div>

    </div>


    <div class="problems-card">

      ${recommendations
        .slice(0, 15)
        .map(
          (recommendation, index) => {

            const keyword =
              typeof recommendation === "string"
                ? recommendation
                : recommendation.keyword ||
                  recommendation.term ||
                  "";

            const reason =
              typeof recommendation === "string"
                ? "Oportunidad detectada en el análisis SEO."
                : recommendation.reason ||
                  recommendation.recommendation ||
                  "Oportunidad detectada en el análisis SEO.";


            return `

              <div class="problem warning">

                <div class="problem-icon">
                  ${index + 1}
                </div>

                <div class="problem-content">

                  <strong>
                    ${escapeHtml(keyword)}
                  </strong>

                  <p>
                    ${escapeHtml(reason)}
                  </p>

                </div>

              </div>

            `;
          }
        )
        .join("")}

    </div>

  `;
}


/* =========================================================
   COMPETITOR ANALYSIS
========================================================= */

function renderCompetitorAnalysis(
  analysis,
  competitors
) {

  if (
    !analysis ||
    !analysis.enabled ||
    !competitors.length
  ) {

    return `

      <div class="section-title">

        <div>

          <span>
            COMPETITOR ANALYSIS
          </span>

          <h2>
            Análisis de competidores
          </h2>

        </div>

      </div>

      <div class="rp-empty">

        Añade hasta 3 competidores arriba para
        descubrir qué keywords están trabajando
        y tú todavía no.

      </div>

    `;
  }


  const opportunities =
    analysis.opportunities || [];

  const sharedKeywords =
    analysis.sharedKeywords || [];

  const uniqueKeywords =
    analysis.uniqueKeywords || [];


  return `

    <div class="section-title">

      <div>

        <span>
          COMPETITOR ANALYSIS
        </span>

        <h2>
          Comparativa competitiva
        </h2>

      </div>

    </div>


    <!-- RESUMEN -->

    <div class="rp-competitor-summary">

      <div class="rp-competitor-stat">

        <span>
          COMPETIDORES
        </span>

        <strong>
          ${analysis.competitorCount || competitors.length}
        </strong>

      </div>


      <div class="rp-competitor-stat">

        <span>
          OPORTUNIDADES
        </span>

        <strong>
          ${opportunities.length}
        </strong>

      </div>


      <div class="rp-competitor-stat">

        <span>
          KEYWORDS COMPARTIDAS
        </span>

        <strong>
          ${sharedKeywords.length}
        </strong>

      </div>

    </div>



    <!-- SCORES -->

    <div class="rp-competitor-cards">

      ${competitors
        .map(
          competitor => {

            const score =
              competitor.seo?.score ?? 0;

            let competitorHostname = "";

            try {

              competitorHostname =
                new URL(
                  competitor.finalUrl ||
                  competitor.url
                ).hostname;

            } catch {

              competitorHostname =
                competitor.finalUrl ||
                competitor.url ||
                "Competidor";

            }


            if (!competitor.success) {

              return `

                <div class="rp-competitor-card">

                  <small>
                    ${escapeHtml(
                      competitorHostname
                    )}
                  </small>

                  <strong>
                    No se pudo analizar
                  </strong>

                  <p>
                    ${escapeHtml(
                      competitor.error ||
                      "Error desconocido"
                    )}
                  </p>

                </div>

              `;
            }


            return `

              <div class="rp-competitor-card">

                <small>
                  ${escapeHtml(
                    competitorHostname
                  )}
                </small>

                <div class="rp-competitor-score">
                  ${score}
                </div>

                <div class="rp-competitor-score-label">
                  SEO Score
                </div>

              </div>

            `;
          }
        )
        .join("")}

    </div>



    <!-- KEYWORD GAP -->

    <div class="problems-card">

      <div style="margin-bottom:18px;">

        <span class="results-label">
          KEYWORD GAP
        </span>

        <h3 style="margin:6px 0 5px;">
          Oportunidades que tienen tus competidores
        </h3>

        <p style="margin:0;opacity:.65;font-size:14px;">

          Estas keywords aparecen en los competidores
          analizados pero no han sido detectadas en
          tu web.

        </p>

      </div>


      ${
        opportunities.length

          ? `

            <div class="rp-gap-table-wrapper">

              <table class="rp-gap-table">

                <thead>

                  <tr>

                    <th>
                      Keyword
                    </th>

                    <th>
                      Competidores
                    </th>

                    <th>
                      Mejor score
                    </th>

                    <th>
                      Opportunity
                    </th>

                  </tr>

                </thead>


                <tbody>

                  ${opportunities
                    .map(
                      opportunity => `

                        <tr>

                          <td>

                            <strong>
                              ${escapeHtml(
                                opportunity.keyword
                              )}
                            </strong>

                          </td>

                          <td>
                            ${
                              opportunity.competitorCount ||
                              0
                            }
                          </td>

                          <td>
                            ${
                              opportunity.bestScore ??
                              0
                            }
                          </td>

                          <td>

                            <span class="rp-opportunity">

                              ${
                                opportunity.opportunityScore ??
                                0
                              }

                            </span>

                          </td>

                        </tr>

                      `
                    )
                    .join("")}

                </tbody>

              </table>

            </div>

          `

          : `

            <div class="rp-empty">

              No se han encontrado nuevas oportunidades
              de keywords todavía.

            </div>

          `
      }

    </div>



    <!-- SHARED KEYWORDS -->

    ${
      sharedKeywords.length

        ? `

          <div class="problems-card">

            <div style="margin-bottom:18px;">

              <span class="results-label">
                SHARED KEYWORDS
              </span>

              <h3 style="margin:6px 0 5px;">
                Keywords que ya compartes con competidores
              </h3>

            </div>


            <div class="rp-gap-table-wrapper">

              <table class="rp-gap-table">

                <thead>

                  <tr>

                    <th>
                      Keyword
                    </th>

                    <th>
                      Tu score
                    </th>

                    <th>
                      Competidor
                    </th>

                    <th>
                      Diferencia
                    </th>

                  </tr>

                </thead>


                <tbody>

                  ${sharedKeywords
                    .slice(0, 30)
                    .map(
                      item => `

                        <tr>

                          <td>
                            <strong>
                              ${escapeHtml(
                                item.keyword
                              )}
                            </strong>
                          </td>

                          <td>
                            ${item.ownScore ?? 0}
                          </td>

                          <td>
                            ${item.competitorScore ?? 0}
                          </td>

                          <td>

                            <span class="rp-positive">

                              ${
                                item.difference > 0
                                  ? "+"
                                  : ""
                              }

                              ${
                                item.difference ?? 0
                              }

                            </span>

                          </td>

                        </tr>

                      `
                    )
                    .join("")}

                </tbody>

              </table>

            </div>

          </div>

        `

        : ""
    }



    <!-- UNIQUE KEYWORDS -->

    ${
      uniqueKeywords.length

        ? `

          <div class="problems-card">

            <div style="margin-bottom:14px;">

              <span class="results-label">
                YOUR KEYWORDS
              </span>

              <h3 style="margin:6px 0 5px;">
                Keywords propias
              </h3>

            </div>


            <div class="rp-keyword-list">

              ${uniqueKeywords
                .slice(0, 30)
                .map(
                  item => `

                    <span class="rp-keyword-pill">

                      ${escapeHtml(
                        item.keyword
                      )}

                      ·

                      ${item.ownScore ?? 0}

                    </span>

                  `
                )
                .join("")}

            </div>

          </div>

        `

        : ""
    }

  `;
}


/* =========================================================
   CATEGORY CARD
========================================================= */

function categoryCard(
  name,
  score,
  description
) {

  const status =
    score >= 80
      ? "good"
      : score >= 60
      ? "warning"
      : "bad";


  return `

    <div class="category-card">

      <div class="category-top">

        <div>

          <strong>
            ${escapeHtml(name)}
          </strong>

          <p>
            ${escapeHtml(description)}
          </p>

        </div>


        <span
          class="category-score ${status}"
        >
          ${score}
        </span>

      </div>


      <div class="progress-bar">

        <div
          class="progress-fill ${status}"
          style="width:${Math.min(
            Math.max(score, 0),
            100
          )}%"
        ></div>

      </div>

    </div>

  `;
}


/* =========================================================
   METRIC
========================================================= */

function metric(
  name,
  value,
  subtitle
) {

  return `

    <div class="metric-card">

      <span>
        ${escapeHtml(name)}
      </span>

      <strong>
        ${escapeHtml(String(value))}
      </strong>

      <small>
        ${escapeHtml(String(subtitle))}
      </small>

    </div>

  `;
}


/* =========================================================
   TECHNICAL ITEM
========================================================= */

function technicalItem(
  name,
  passed
) {

  return `

    <div class="technical-item">

      <span
        class="${
          passed
            ? "tech-good"
            : "tech-bad"
        }"
      >

        ${passed ? "✓" : "!"}

      </span>


      <strong>
        ${escapeHtml(name)}
      </strong>


      <span>
        ${passed ? "Correcto" : "Revisar"}
      </span>

    </div>

  `;
}


/* =========================================================
   FIX BUTTON
========================================================= */

function showFix(button) {

  const fix =
    button.parentElement.querySelector(
      ".fix-content"
    );

  if (fix) {
    fix.classList.toggle("visible");
  }
}


/* =========================================================
   KEYWORD TYPE
========================================================= */

function getKeywordTypeLabel(type) {

  const labels = {

    unigram: "Keyword",

    bigram: "Long-tail",

    trigram: "Long-tail",

    phrase: "Frase"

  };

  return (
    labels[type] ||
    type ||
    "Keyword"
  );
}


/* =========================================================
   NORMALIZAR URL
========================================================= */

function normalizeUrl(value) {

  let url = value.trim();

  if (!url) return "";

  if (
    !/^https?:\/\//i.test(url)
  ) {
    url = "https://" + url;
  }


  try {

    const parsed =
      new URL(url);

    return parsed.toString();

  } catch {

    return "";

  }
}


/* =========================================================
   HOSTNAME
========================================================= */

function getHostname(url) {

  try {

    return new URL(url)
      .hostname
      .replace(/^www\./, "")
      .toLowerCase();

  } catch {

    return "";

  }
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   HACER FUNCIONES DISPONIBLES PARA HTML
========================================================= */

window.showFix = showFix;

