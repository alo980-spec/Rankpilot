const WORKER_URL =
  "https://rankpilot-api.alvaroalvarezmonteagudo.workers.dev/";

const form = document.getElementById("seoForm");
const input = document.getElementById("urlInput");
const message = document.getElementById("analyzerMessage");

let currentMainUrl = "";
let currentData = null;


/* =========================================================
   ANALIZADOR PRINCIPAL
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

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  currentMainUrl = url;

  message.innerHTML = `
    <div class="seo-loading">
      <div class="loading-spinner"></div>

      <h3>
        Analizando ${escapeHtml(url)}
      </h3>

      <p>
        Revisando SEO técnico, contenido e indexabilidad...
      </p>
    </div>
  `;

  try {
    const response = await fetch(
      `${WORKER_URL}?url=${encodeURIComponent(url)}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "No se pudo analizar la web."
      );
    }

    currentData = data;

    currentMainUrl =
      data.finalUrl ||
      data.url ||
      url;

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
   RESULTADOS
========================================================= */

function renderResults(data) {

  const seo = data.seo || {};

  const categories =
    seo.categories || {};

  const issues =
    Array.isArray(seo.issues)
      ? seo.issues
      : [];

  const warnings =
    Array.isArray(seo.warnings)
      ? seo.warnings
      : [];

  const passed =
    Array.isArray(seo.passed)
      ? seo.passed
      : [];

  const score =
    Number(seo.score || 0);

  const criticalCount =
    issues.length;

  const warningCount =
    warnings.length;

  message.innerHTML = `

    <div class="seo-dashboard">


      <!-- HEADER -->

      <div class="results-header">

        <div>

          <span class="results-label">
            ANÁLISIS SEO
          </span>

          <h2>
            ${escapeHtml(
              getHostname(
                data.finalUrl ||
                currentMainUrl
              )
            )}
          </h2>

          <p>
            ${escapeHtml(
              data.finalUrl ||
              currentMainUrl ||
              ""
            )}
          </p>

        </div>


        <button
          class="new-analysis"
          onclick="window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })"
        >
          ← Nuevo análisis
        </button>

      </div>


      <!-- SCORE PRINCIPAL -->

      <div class="main-score-card">

        <div class="score-ring ${getStatus(score)}">

          <div class="score-ring-inner">

            <strong>
              ${score}
            </strong>

            <span>
              /100
            </span>

          </div>

        </div>


        <div class="score-summary">

          <span class="score-label">
            SEO SCORE
          </span>

          <h2>
            ${getLabel(score)}
          </h2>

          <p>
            Tu página ha sido analizada en múltiples
            factores técnicos y de contenido.
          </p>


          <div class="score-stats">

            <span>
              🔴 ${criticalCount} problemas
            </span>

            <span>
              🟡 ${warningCount} recomendaciones
            </span>

            <span>
              🟢 ${passed.length} correctos
            </span>

          </div>

        </div>

      </div>


      <!-- REPORT -->

      <div class="report-action">

        <button
          class="generate-report-button"
          onclick="generateSEOReport()"
        >
          📄 Generar informe SEO
        </button>

      </div>


      <!-- CATEGORÍAS -->

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
          categories.technical,
          "Infraestructura y configuración técnica"
        )}

        ${categoryCard(
          "On-Page SEO",
          categories.onPage,
          "Elementos SEO visibles de la página"
        )}

        ${categoryCard(
          "Content",
          categories.content,
          "Calidad y cantidad del contenido"
        )}

        ${categoryCard(
          "Indexability",
          categories.indexability,
          "Factores relacionados con indexación"
        )}

      </div>


      <!-- SEO ACTION PLAN -->

      ${renderActionPlan(seo)}


      <!-- KEYWORD INTELLIGENCE -->

      ${renderKeywordIntelligence(seo)}


      <!-- KEYWORD RECOMMENDATIONS -->

      ${renderKeywordRecommendations(seo)}


      <!-- COMPETIDORES -->

      ${renderCompetitorCTA()}


      <!-- PROBLEMAS -->

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
          issues.length
            ? issues
                .map(
                  (issue, index) => `

                    <div class="problem critical">

                      <div class="problem-icon">
                        ${index + 1}
                      </div>


                      <div class="problem-content">

                        <strong>
                          ${escapeHtml(String(issue))}
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
                          ${escapeHtml(String(warning))}
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


      <!-- ON PAGE -->

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
          seo.h1Count ?? 0,
          "etiquetas"
        )}

        ${metric(
          "H2",
          seo.h2Count ?? 0,
          "etiquetas"
        )}

        ${metric(
          "H3",
          seo.h3Count ?? 0,
          "etiquetas"
        )}

        ${metric(
          "Contenido",
          seo.wordCount ?? 0,
          "palabras"
        )}

        ${metric(
          "Imágenes",
          seo.imageCount ?? 0,
          "total"
        )}

        ${metric(
          "Imágenes sin ALT",
          seo.imagesWithoutAlt ?? 0,
          "sin atributo ALT"
        )}

        ${metric(
          "Enlaces internos",
          seo.internalLinks ?? 0,
          "enlaces"
        )}

        ${metric(
          "Enlaces externos",
          seo.externalLinks ?? 0,
          "enlaces"
        )}

      </div>


      <!-- TÉCNICO -->

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


      <!-- CORRECTO -->

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
                        ✓ ${escapeHtml(String(item))}
                      </div>
                    `
                  )
                  .join("")
              : `
                <div>
                  No hay comprobaciones registradas.
                </div>
              `
          }

        </div>

      </div>


    </div>
  `;
}


/* =========================================================
   SEO ACTION PLAN
========================================================= */

function renderActionPlan(seo) {

  const plan =
    buildActionPlan(seo);

  if (!plan.length) {
    return "";
  }

  return `

    <div class="section-title">

      <div>

        <span>
          ACTION PLAN
        </span>

        <h2>
          Plan de acción SEO
        </h2>

      </div>

    </div>


    <div class="action-plan">

      ${plan
        .map(
          (item, index) =>
            renderActionCard(
              item,
              index
            )
        )
        .join("")}

    </div>
  `;
}


function buildActionPlan(seo) {

  const plan = [];

  const issues =
    Array.isArray(seo.issues)
      ? seo.issues
      : [];

  const warnings =
    Array.isArray(seo.warnings)
      ? seo.warnings
      : [];

  issues.forEach(
    (issue, index) => {

      plan.push({
        priority: "Alta",
        type: "critical",
        title: String(issue),
        description:
          "Soluciona este problema antes de trabajar en optimizaciones secundarias.",
        order: index
      });

    }
  );


  warnings.forEach(
    (warning, index) => {

      plan.push({
        priority: "Media",
        type: "warning",
        title: String(warning),
        description:
          "Optimiza este elemento para mejorar el rendimiento SEO.",
        order: issues.length + index
      });

    }
  );


  if (
    seo.imagesWithoutAlt > 0
  ) {

    plan.push({
      priority: "Media",
      type: "warning",
      title:
        "Optimizar imágenes sin atributo ALT",
      description:
        `Hay ${seo.imagesWithoutAlt} imágenes sin ALT.`,
      order: 100
    });

  }


  if (
    seo.internalLinks === 0
  ) {

    plan.push({
      priority: "Media",
      type: "warning",
      title:
        "Añadir enlaces internos",
      description:
        "La página no contiene enlaces internos detectados.",
      order: 101
    });

  }


  if (
    seo.h1Count === 0
  ) {

    plan.push({
      priority: "Alta",
      type: "critical",
      title:
        "Añadir un H1",
      description:
        "La página necesita un encabezado principal.",
      order: 102
    });

  }


  return plan
    .sort(
      (a, b) =>
        a.order - b.order
    )
    .slice(0, 10);
}


function renderActionCard(
  item,
  index
) {

  return `

    <div class="action-card">

      <div class="action-number">
        ${index + 1}
      </div>


      <div class="action-content">

        <div class="action-header">

          <strong>
            ${escapeHtml(item.title)}
          </strong>

          <span class="action-priority ${item.type}">
            ${escapeHtml(item.priority)}
          </span>

        </div>


        <p>
          ${escapeHtml(item.description)}
        </p>

      </div>

    </div>

  `;
}


/* =========================================================
   KEYWORD INTELLIGENCE
========================================================= */

function renderKeywordIntelligence(seo) {

  const primary =
    normalizeKeyword(
      seo.primaryKeyword
    );

  const keywords =
    Array.isArray(seo.keywords)
      ? seo.keywords
      : Array.isArray(
          seo.keywordIntelligence
        )
      ? seo.keywordIntelligence
      : [];

  if (
    !primary &&
    !keywords.length
  ) {
    return "";
  }

  return `

    <div class="section-title">

      <div>

        <span>
          KEYWORD INTELLIGENCE
        </span>

        <h2>
          Keywords detectadas
        </h2>

      </div>

    </div>


    <div class="keyword-intelligence-card">

      <div class="primary-keyword">

        <span>
          KEYWORD PRINCIPAL
        </span>

        <strong>
          ${escapeHtml(
            primary || "No detectada"
          )}
        </strong>

      </div>


      ${
        keywords.length
          ? `
            <div class="keyword-list">

              ${keywords
                .slice(0, 20)
                .map(
                  keyword => {

                    const text =
                      normalizeKeyword(
                        keyword
                      );

                    const count =
                      getKeywordCount(
                        keyword
                      );

                    if (!text) {
                      return "";
                    }

                    return `

                      <div class="keyword-row">

                        <span>
                          ${escapeHtml(text)}
                        </span>

                        <span>
                          ${getKeywordTypeLabel(
                            text,
                            primary
                          )}
                        </span>

                        <strong>
                          ${count || "-"}
                        </strong>

                      </div>

                    `;
                  }
                )
                .join("")}

            </div>
          `
          : ""
      }

    </div>

  `;
}


/* =========================================================
   KEYWORD RECOMMENDATIONS
========================================================= */

function renderKeywordRecommendations(seo) {

  const recommendations =
    Array.isArray(
      seo.keywordRecommendations
    )
      ? seo.keywordRecommendations
      : [];

  if (!recommendations.length) {
    return "";
  }

  return `

    <div class="section-title">

      <div>

        <span>
          KEYWORD OPPORTUNITIES
        </span>

        <h2>
          Recomendaciones de keywords
        </h2>

      </div>

    </div>


    <div class="recommendations-card">

      ${recommendations
        .slice(0, 15)
        .map(
          (item, index) => {

            const keyword =
              normalizeKeyword(
                item
              );

            if (!keyword) {
              return "";
            }

            return `

              <div class="recommendation-row">

                <span>
                  ${index + 1}
                </span>

                <strong>
                  ${escapeHtml(keyword)}
                </strong>

              </div>

            `;
          }
        )
        .join("")}

    </div>

  `;
}


/* =========================================================
   COMPETIDORES
========================================================= */

function renderCompetitorCTA() {

  return `

    <div class="competitor-cta">

      <div>

        <span>
          COMPETITOR INTELLIGENCE
        </span>

        <h2>
          Compara tu web con tus competidores
        </h2>

        <p>
          Descubre diferencias SEO y oportunidades
          frente a otras páginas.
        </p>

      </div>


      <button
        onclick="openCompetitorForm()"
        class="competitor-button"
      >
        Comparar competidores →
      </button>

    </div>

  `;
}


function openCompetitorForm() {

  const existing =
    document.getElementById(
      "competitorForm"
    );

  if (existing) {
    existing.remove();
    return;
  }

  const container =
    document.createElement(
      "div"
    );

  container.id =
    "competitorForm";

  container.className =
    "competitor-form-wrapper";

  container.innerHTML = `

    <div class="competitor-form-card">

      <h3>
        Analizar competidores
      </h3>

      <p>
        Puedes introducir hasta 3 competidores.
      </p>


      <input
        id="competitor1"
        class="competitor-input"
        placeholder="https://competidor1.com"
      />


      <input
        id="competitor2"
        class="competitor-input"
        placeholder="https://competidor2.com"
      />


      <input
        id="competitor3"
        class="competitor-input"
        placeholder="https://competidor3.com"
      />


      <div class="competitor-form-actions">

        <button
          onclick="runCompetitorAnalysis()"
          class="competitor-button"
        >
          Analizar competidores
        </button>

      </div>


      <div
        id="competitorMessage"
        class="competitor-message"
      ></div>

    </div>

  `;

  message.appendChild(
    container
  );

  container.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}


async function runCompetitorAnalysis() {

  if (!currentMainUrl) {
    return;
  }

  const inputs = [
    document.getElementById(
      "competitor1"
    ),
    document.getElementById(
      "competitor2"
    ),
    document.getElementById(
      "competitor3"
    )
  ];

  const competitors =
    inputs
      .map(
        input =>
          input
            ? input.value.trim()
            : ""
      )
      .filter(Boolean);


  if (!competitors.length) {

    alert(
      "Introduce al menos un competidor."
    );

    return;
  }


  const competitorMessage =
    document.getElementById(
      "competitorMessage"
    );

  if (competitorMessage) {

    competitorMessage.innerHTML = `
      <div class="seo-loading">
        <div class="loading-spinner"></div>

        <p>
          Analizando competidores...
        </p>
      </div>
    `;

  }


  try {

    const params =
      new URLSearchParams();

    params.set(
      "url",
      currentMainUrl
    );

    params.set(
      "competitors",
      competitors.join(",")
    );


    const response =
      await fetch(
        `${WORKER_URL}?${params.toString()}`
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.error ||
        "No se pudieron analizar los competidores."
      );

    }


    currentData = {
      ...currentData,
      competitorAnalysis:
        data.competitorAnalysis ||
        data.competitors ||
        []
    };


    renderCompetitorAnalysis(
      currentData.competitorAnalysis
    );


  } catch (error) {

    console.error(error);

    if (competitorMessage) {

      competitorMessage.innerHTML = `

        <div class="seo-error">

          ❌ ${escapeHtml(
            error.message
          )}

        </div>

      `;

    }

  }
}


function renderCompetitorAnalysis(
  competitors
) {

  if (
    !Array.isArray(
      competitors
    )
  ) {
    return;
  }


  const old =
    document.getElementById(
      "competitorResults"
    );

  if (old) {
    old.remove();
  }


  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.id =
    "competitorResults";

  wrapper.className =
    "competitor-results";


  wrapper.innerHTML = `

    <div class="section-title">

      <div>

        <span>
          COMPETITOR ANALYSIS
        </span>

        <h2>
          Comparación SEO
        </h2>

      </div>

    </div>


    <div class="competitor-results-grid">

      ${competitors
        .map(
          (competitor, index) => {

            const name =
              competitor.name ||
              competitor.domain ||
              competitor.url ||
              `Competidor ${index + 1}`;

            const score =
              competitor.score ??
              competitor.seoScore ??
              "-";

            return `

              <div class="competitor-result-card">

                <span>
                  COMPETIDOR ${index + 1}
                </span>

                <h3>
                  ${escapeHtml(
                    String(name)
                  )}
                </h3>

                <strong>
                  ${escapeHtml(
                    String(score)
                  )}
                  /100
                </strong>

              </div>

            `;
          }
        )
        .join("")}

    </div>

  `;


  message.appendChild(
    wrapper
  );

  wrapper.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
}


/* =========================================================
   SEO REPORTS 1.0
========================================================= */

function generateSEOReport() {

  if (!currentData) {

    alert(
      "Primero debes analizar una web."
    );

    return;
  }


  const data =
    currentData;

  const seo =
    data.seo || {};

  const categories =
    seo.categories || {};


  const reportWindow =
    window.open(
      "",
      "_blank",
      "width=1100,height=900"
    );


  if (!reportWindow) {

    alert(
      "El navegador ha bloqueado la ventana del informe. Permite ventanas emergentes para RankPilot."
    );

    return;
  }


  const hostname =
    getHostname(
      data.finalUrl ||
      currentMainUrl ||
      ""
    );


  const generatedAt =
    new Date().toLocaleString(
      "es-ES",
      {
        dateStyle: "long",
        timeStyle: "short"
      }
    );


  const score =
    Number(
      seo.score || 0
    );


  const scoreLabel =
    getLabel(score);


  const issues =
    Array.isArray(seo.issues)
      ? seo.issues
      : [];


  const warnings =
    Array.isArray(seo.warnings)
      ? seo.warnings
      : [];


  const passed =
    Array.isArray(seo.passed)
      ? seo.passed
      : [];


  const primaryKeyword =
    normalizeKeyword(
      seo.primaryKeyword
    ) ||
    "No detectada";


  const keywords =
    Array.isArray(seo.keywords)
      ? seo.keywords
      : Array.isArray(
          seo.keywordIntelligence
        )
      ? seo.keywordIntelligence
      : [];


  const recommendations =
    Array.isArray(
      seo.keywordRecommendations
    )
      ? seo.keywordRecommendations
      : [];


  const competitors =
    currentData.competitorAnalysis ||
    seo.competitors ||
    [];


  const actionPlan =
    buildActionPlan(
      seo
    );


  const categoriesHTML = [

    reportCategory(
      "Technical SEO",
      categories.technical
    ),

    reportCategory(
      "On-Page SEO",
      categories.onPage
    ),

    reportCategory(
      "Content",
      categories.content
    ),

    reportCategory(
      "Indexability",
      categories.indexability
    )

  ].join("");


  const issuesHTML =
    issues.length
      ? issues
          .map(
            (issue, index) => `
              <div class="report-problem critical">

                <strong>
                  ${index + 1}.
                </strong>

                <span>
                  ${escapeHtml(
                    String(issue)
                  )}
                </span>

              </div>
            `
          )
          .join("")
      : `
        <div class="empty">
          No se han detectado problemas críticos.
        </div>
      `;


  const warningsHTML =
    warnings.length
      ? warnings
          .map(
            (warning, index) => `
              <div class="report-problem warning">

                <strong>
                  ${index + 1}.
                </strong>

                <span>
                  ${escapeHtml(
                    String(warning)
                  )}
                </span>

              </div>
            `
          )
          .join("")
      : "";


  const actionPlanHTML =
    actionPlan.length
      ? actionPlan
          .map(
            (item, index) => `

              <div class="report-action">

                <div class="report-action-number">
                  ${index + 1}
                </div>

                <div>

                  <strong>
                    ${escapeHtml(
                      item.title
                    )}
                  </strong>

                  <span class="report-priority">
                    ${escapeHtml(
                      item.priority
                    )}
                  </span>

                  <p>
                    ${escapeHtml(
                      item.description
                    )}
                  </p>

                </div>

              </div>

            `
          )
          .join("")
      : `
        <div class="empty">
          No hay acciones adicionales registradas.
        </div>
      `;


  const keywordHTML =
    keywords.length
      ? keywords
          .slice(0, 25)
          .map(
            keyword => {

              const text =
                normalizeKeyword(
                  keyword
                );

              if (!text) {
                return "";
              }

              return `

                <tr>

                  <td>
                    ${escapeHtml(text)}
                  </td>

                  <td>
                    ${getKeywordCount(
                      keyword
                    ) || "-"}
                  </td>

                  <td>
                    ${getKeywordTypeLabel(
                      text,
                      primaryKeyword
                    )}
                  </td>

                </tr>

              `;
            }
          )
          .join("")
      : `
        <tr>
          <td colspan="3">
            No hay keywords detectadas.
          </td>
        </tr>
      `;


  const recommendationHTML =
    recommendations.length
      ? recommendations
          .slice(0, 20)
          .map(
            (item, index) => {

              const keyword =
                normalizeKeyword(
                  item
                );

              if (!keyword) {
                return "";
              }

              return `

                <div class="recommendation">

                  <strong>
                    ${index + 1}
                  </strong>

                  <span>
                    ${escapeHtml(
                      keyword
                    )}
                  </span>

                </div>

              `;
            }
          )
          .join("")
      : `
        <div class="empty">
          No hay recomendaciones de keywords.
        </div>
      `;


  const competitorHTML =
    Array.isArray(
      competitors
    ) &&
    competitors.length
      ? `

        <table>

          <thead>

            <tr>

              <th>
                Competidor
              </th>

              <th>
                SEO Score
              </th>

            </tr>

          </thead>

          <tbody>

            ${competitors
              .map(
                competitor => {

                  const name =
                    competitor.name ||
                    competitor.domain ||
                    competitor.url ||
                    "Competidor";

                  const competitorScore =
                    competitor.score ??
                    competitor.seoScore ??
                    "-";

                  return `

                    <tr>

                      <td>
                        ${escapeHtml(
                          String(name)
                        )}
                      </td>

                      <td>
                        ${escapeHtml(
                          String(
                            competitorScore
                          )
                        )}
                      </td>

                    </tr>

                  `;
                }
              )
              .join("")}

          </tbody>

        </table>

      `
      : `
        <div class="empty">
          No se ha realizado una comparación de competidores.
        </div>
      `;


  reportWindow.document.write(`

<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>
  RankPilot SEO Report
</title>


<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  background: #f4f6f8;

  color: #172033;

  line-height: 1.5;
}


.report {

  max-width: 1000px;

  margin: 40px auto;

  background: white;

  padding: 50px;
}


.header {

  display: flex;

  justify-content:
    space-between;

  align-items:
    flex-start;

  padding-bottom: 30px;

  border-bottom:
    1px solid #e5e7eb;
}


.brand {

  font-size: 30px;

  font-weight: 800;
}


.brand span {
  color: #6366f1;
}


.header-info {

  text-align: right;

  color: #6b7280;

  font-size: 13px;
}


.hero {

  display: grid;

  grid-template-columns:
    220px 1fr;

  gap: 40px;

  align-items: center;

  margin: 45px 0;
}


.score {

  width: 190px;

  height: 190px;

  border-radius: 50%;

  display: flex;

  align-items: center;

  justify-content: center;

  border: 12px solid #d1d5db;

}


.score.good {
  border-color: #22c55e;
}


.score.warning {
  border-color: #f59e0b;
}


.score.bad {
  border-color: #ef4444;
}


.score-inner {
  text-align: center;
}


.score-number {

  display: block;

  font-size: 54px;

  font-weight: 800;

  line-height: 1;
}


.score-max {

  color: #6b7280;

  font-size: 14px;
}


.hero h1 {

  font-size: 32px;

  margin:
    0 0 8px;
}


.hero p {

  color: #6b7280;
}


.status {

  display: inline-block;

  padding:
    7px 14px;

  border-radius: 999px;

  background: #f3f4f6;

  font-weight: 700;
}


.section {

  margin-top: 45px;

  page-break-inside:
    avoid;
}


.section h2 {

  font-size: 22px;

  margin-bottom: 20px;
}


.categories {

  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 16px;
}


.category {

  border:
    1px solid #e5e7eb;

  border-radius: 12px;

  padding: 18px;
}


.category-header {

  display: flex;

  justify-content:
    space-between;

  margin-bottom: 12px;
}


.bar {

  height: 8px;

  background: #e5e7eb;

  border-radius: 999px;

  overflow: hidden;
}


.bar-fill {

  height: 100%;
}


.bar-fill.good {
  background: #22c55e;
}


.bar-fill.warning {
  background: #f59e0b;
}


.bar-fill.bad {
  background: #ef4444;
}


.good {
  color: #16a34a;
}


.warning {
  color: #d97706;
}


.bad {
  color: #dc2626;
}


.report-problem {

  display: flex;

  gap: 12px;

  padding: 15px;

  border-bottom:
    1px solid #e5e7eb;
}


.report-problem:last-child {
  border-bottom: 0;
}


.report-action {

  display: flex;

  gap: 15px;

  padding: 18px 0;

  border-bottom:
    1px solid #e5e7eb;
}


.report-action-number {

  width: 34px;

  height: 34px;

  border-radius: 50%;

  background: #eef2ff;

  color: #4f46e5;

  display: flex;

  align-items: center;

  justify-content: center;

  font-weight: 800;

  flex-shrink: 0;
}


.report-priority {

  margin-left: 10px;

  font-size: 12px;

  color: #6366f1;

  font-weight: 700;
}


.report-action p {

  margin:
    5px 0 0;

  color: #6b7280;
}


.metrics {

  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 14px;
}


.metric {

  padding: 18px;

  border:
    1px solid #e5e7eb;

  border-radius: 12px;
}


.metric span {

  display: block;

  color: #6b7280;

  font-size: 13px;
}


.metric strong {

  display: block;

  font-size: 24px;

  margin-top: 5px;
}


table {

  width: 100%;

  border-collapse:
    collapse;
}


th,
td {

  padding: 13px;

  text-align: left;

  border-bottom:
    1px solid #e5e7eb;
}


th {

  background: #f9fafb;

  font-size: 13px;
}


.recommendation {

  display: flex;

  gap: 14px;

  padding: 13px;

  border:
    1px solid #e5e7eb;

  border-radius: 10px;

  margin-bottom: 8px;
}


.empty {

  padding: 25px;

  text-align: center;

  background: #f9fafb;

  border-radius: 10px;

  color: #6b7280;
}


.print-button {

  position: fixed;

  right: 25px;

  bottom: 25px;

  border: 0;

  border-radius: 10px;

  padding:
    13px 20px;

  background: #111827;

  color: white;

  font-weight: 700;

  cursor: pointer;
}


@media(max-width: 700px) {

  .report {

    margin: 0;

    padding: 25px;

  }

  .header {

    flex-direction:
      column;

  }

  .header-info {

    text-align: left;

  }

  .hero {

    grid-template-columns:
      1fr;

  }

  .categories,
  .metrics {

    grid-template-columns:
      1fr;

  }

}


@media print {

  body {
    background: white;
  }

  .report {

    margin: 0;

    max-width: none;

    padding: 20px;

  }

  .print-button {
    display: none;
  }

}

</style>

</head>


<body>


<div class="report">


  <div class="header">

    <div class="brand">
      Rank<span>Pilot</span>
    </div>


    <div class="header-info">

      <strong>
        SEO AUDIT REPORT
      </strong>

      <br>

      ${escapeHtml(
        generatedAt
      )}

    </div>

  </div>


  <div class="hero">


    <div class="score ${getStatus(score)}">

      <div class="score-inner">

        <span class="score-number">
          ${score}
        </span>

        <span class="score-max">
          /100
        </span>

      </div>

    </div>


    <div>

      <h1>
        Informe SEO de
        ${escapeHtml(hostname)}
      </h1>

      <p>
        ${escapeHtml(
          data.finalUrl ||
          currentMainUrl ||
          ""
        )}
      </p>

      <span class="status">
        ${escapeHtml(scoreLabel)}
      </span>

    </div>


  </div>


  <div class="section">

    <h2>
      Resumen
    </h2>


    <div class="metrics">

      ${reportMetric(
        "Problemas",
        issues.length
      )}

      ${reportMetric(
        "Recomendaciones",
        warnings.length
      )}

      ${reportMetric(
        "Correctos",
        passed.length
      )}

      ${reportMetric(
        "Keyword principal",
        primaryKeyword
      )}

    </div>

  </div>


  <div class="section">

    <h2>
      Desglose SEO
    </h2>


    <div class="categories">

      ${categoriesHTML}

    </div>

  </div>


  <div class="section">

    <h2>
      Problemas detectados
    </h2>

    ${issuesHTML}

    ${warningsHTML}

  </div>


  <div class="section">

    <h2>
      Plan de acción SEO
    </h2>

    ${actionPlanHTML}

  </div>


  <div class="section">

    <h2>
      Keyword Intelligence
    </h2>


    <p>

      Keyword principal:

      <strong>
        ${escapeHtml(
          primaryKeyword
        )}
      </strong>

    </p>


    <table>

      <thead>

        <tr>

          <th>
            Keyword
          </th>

          <th>
            Frecuencia
          </th>

          <th>
            Tipo
          </th>

        </tr>

      </thead>


      <tbody>

        ${keywordHTML}

      </tbody>

    </table>

  </div>


  <div class="section">

    <h2>
      Recomendaciones de keywords
    </h2>

    ${recommendationHTML}

  </div>


  <div class="section">

    <h2>
      Elementos On-Page
    </h2>


    <div class="metrics">

      ${reportMetric(
        "Title",
        seo.title ||
        "No encontrado"
      )}

      ${reportMetric(
        "Meta Description",
        seo.description ||
        "No encontrada"
      )}

      ${reportMetric(
        "H1",
        seo.h1Count ?? 0
      )}

      ${reportMetric(
        "H2",
        seo.h2Count ?? 0
      )}

      ${reportMetric(
        "H3",
        seo.h3Count ?? 0
      )}

      ${reportMetric(
        "Contenido",
        seo.wordCount ?? 0
      )}

      ${reportMetric(
        "Imágenes",
        seo.imageCount ?? 0
      )}

      ${reportMetric(
        "Sin ALT",
        seo.imagesWithoutAlt ?? 0
      )}

    </div>

  </div>


  <div class="section">

    <h2>
      Configuración técnica
    </h2>


    <div class="metrics">

      ${reportMetric(
        "HTTPS",
        seo.hasHttps
          ? "Correcto"
          : "Revisar"
      )}

      ${reportMetric(
        "Viewport",
        seo.hasViewport
          ? "Correcto"
          : "Revisar"
      )}

      ${reportMetric(
        "Canonical",
        seo.hasCanonical
          ? "Correcto"
          : "Revisar"
      )}

      ${reportMetric(
        "Robots",
        seo.hasRobots
          ? "Correcto"
          : "Revisar"
      )}

      ${reportMetric(
        "Schema",
        seo.hasSchema
          ? "Correcto"
          : "Revisar"
      )}

      ${reportMetric(
        "Open Graph",
        seo.hasOpenGraph
          ? "Correcto"
          : "Revisar"
      )}

      ${reportMetric(
        "Twitter Card",
        seo.hasTwitterCard
          ? "Correcto"
          : "Revisar"
      )}

    </div>

  </div>


  <div class="section">

    <h2>
      Competidores
    </h2>

    ${competitorHTML}

  </div>


  <div class="section">

    <h2>
      Checks superados
    </h2>


    ${
      passed.length
        ? passed
            .map(
              item => `
                <div class="recommendation">

                  <strong>
                    ✓
                  </strong>

                  <span>
                    ${escapeHtml(
                      String(item)
                    )}
                  </span>

                </div>
              `
            )
            .join("")
        : `
          <div class="empty">
            No hay checks registrados.
          </div>
        `
    }

  </div>


  <div style="
    margin-top:60px;
    padding-top:20px;
    border-top:1px solid #e5e7eb;
    text-align:center;
    color:#9ca3af;
    font-size:12px;
  ">

    Informe generado por RankPilot
    <br>
    SEO Intelligence Platform

  </div>


</div>


<button
  class="print-button"
  onclick="window.print()"
>
  🖨️ Imprimir / Guardar PDF
</button>


</body>

</html>

  `);


  reportWindow.document.close();
}


/* =========================================================
   HELPERS DEL INFORME
========================================================= */

function reportCategory(
  name,
  value
) {

  const score =
    Number(value || 0);

  const status =
    getStatus(score);

  return `

    <div class="category">

      <div class="category-header">

        <strong>
          ${escapeHtml(name)}
        </strong>

        <span class="${status}">
          ${score}/100
        </span>

      </div>


      <div class="bar">

        <div
          class="bar-fill ${status}"
          style="width:${Math.max(
            0,
            Math.min(100, score)
          )}%"
        ></div>

      </div>

    </div>

  `;
}


function reportMetric(
  name,
  value
) {

  return `

    <div class="metric">

      <span>
        ${escapeHtml(name)}
      </span>

      <strong>
        ${escapeHtml(
          String(value ?? "-")
        )}
      </strong>

    </div>

  `;
}


/* =========================================================
   KEYWORD HELPERS
========================================================= */

function normalizeKeyword(
  value
) {

  if (
    typeof value ===
    "string"
  ) {

    return value.trim();

  }


  if (
    value &&
    typeof value ===
    "object"
  ) {

    return String(
      value.keyword ||
      value.term ||
      value.text ||
      value.name ||
      ""
    ).trim();

  }


  return String(
    value || ""
  ).trim();

}


function getKeywordCount(
  item
) {

  if (
    !item ||
    typeof item !==
    "object"
  ) {

    return 0;

  }


  return Number(
    item.count ??
    item.frequency ??
    item.occurrences ??
    item.appearances ??
    0
  );

}


function getKeywordTypeLabel(
  keyword,
  primary
) {

  const keywordText =
    normalizeKeyword(
      keyword
    ).toLowerCase();


  const primaryText =
    normalizeKeyword(
      primary
    ).toLowerCase();


  if (
    primaryText &&
    keywordText &&
    keywordText ===
      primaryText
  ) {

    return "Principal";

  }


  return "Relevante";

}


/* =========================================================
   UI HELPERS
========================================================= */

function getStatus(
  score
) {

  score =
    Number(score || 0);

  if (score >= 80) {
    return "good";
  }

  if (score >= 60) {
    return "warning";
  }

  return "bad";
}


function getLabel(
  score
) {

  score =
    Number(score || 0);

  if (score >= 90) {
    return "Excelente";
  }

  if (score >= 80) {
    return "Bueno";
  }

  if (score >= 60) {
    return "Mejorable";
  }

  return "Necesita atención";
}


function categoryCard(
  name,
  score,
  description
) {

  score =
    Number(score || 0);

  const status =
    getStatus(score);


  return `

    <div class="category-card">

      <div class="category-top">

        <div>

          <strong>
            ${escapeHtml(name)}
          </strong>

          <p>
            ${escapeHtml(
              description
            )}
          </p>

        </div>


        <span class="category-score ${status}">
          ${score}
        </span>

      </div>


      <div class="progress-bar">

        <div
          class="progress-fill ${status}"
          style="width:${Math.max(
            0,
            Math.min(100, score)
          )}%"
        ></div>

      </div>

    </div>

  `;
}


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
        ${escapeHtml(
          String(value ?? "-")
        )}
      </strong>

      <small>
        ${escapeHtml(
          String(subtitle || "")
        )}
      </small>

    </div>

  `;
}


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
        ${
          passed
            ? "Correcto"
            : "Revisar"
        }
      </span>

    </div>

  `;
}


function showFix(
  button
) {

  const fix =
    button.parentElement
      .querySelector(
        ".fix-content"
      );

  if (fix) {

    fix.classList.toggle(
      "visible"
    );

  }

}


function normalizeUrl(
  value
) {

  let url =
    String(value || "")
      .trim();

  if (
    !/^https?:\/\//i.test(url)
  ) {

    url =
      "https://" +
      url;

  }

  return url;
}


function getHostname(
  value
) {

  try {

    return new URL(
      normalizeUrl(value)
    ).hostname;

  } catch {

    return String(
      value || ""
    );

  }

}


function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   FUTURO SISTEMA DE PLANES
========================================================= */

function hasFeature(
  feature
) {

  /*
    ESTA FUNCIÓN QUEDA PREPARADA
    PARA EL SISTEMA DE SUSCRIPCIONES.

    Más adelante podremos hacer:

    FREE
      - seo_analysis
      - limited_keywords

    PRO
      - seo_analysis
      - keyword_intelligence
      - keyword_recommendations
      - competitor_analysis
      - seo_reports

    BUSINESS
      - todo lo anterior
      - monitoring
      - multiple_projects
      - white_label
      - advanced_reports

    De momento devuelve true para
    que todas las funciones sigan
    funcionando durante el desarrollo.
  */

  return true;
}


/* =========================================================
   FUNCIONES GLOBALES
========================================================= */

window.showFix =
  showFix;

window.openCompetitorForm =
  openCompetitorForm;

window.runCompetitorAnalysis =
  runCompetitorAnalysis;

window.generateSEOReport =
  generateSEOReport;
