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

/* =========================================================
   RANKPILOT — DASHBOARD / PROJECTS / HISTORY
   ========================================================= */

const RANKPILOT_PROJECTS_KEY = "rankpilot_projects_v1";

/* ---------------------------------------------------------
   STORAGE
--------------------------------------------------------- */

function rankPilotGetProjects() {
  try {
    const saved = localStorage.getItem(RANKPILOT_PROJECTS_KEY);

    if (!saved) {
      return [];
    }

    const projects = JSON.parse(saved);

    return Array.isArray(projects) ? projects : [];
  } catch (error) {
    console.error("RankPilot: error leyendo proyectos", error);
    return [];
  }
}

function rankPilotSaveProjects(projects) {
  try {
    localStorage.setItem(
      RANKPILOT_PROJECTS_KEY,
      JSON.stringify(projects)
    );
  } catch (error) {
    console.error("RankPilot: error guardando proyectos", error);
  }
}

function rankPilotCreateProject(name, url) {
  const projects = rankPilotGetProjects();

  const normalizedUrl = normalizeUrl(url);

  const project = {
    id:
      "project_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 8),

    name:
      name ||
      getHostname(normalizedUrl) ||
      "Nuevo proyecto",

    url: normalizedUrl,

    createdAt: new Date().toISOString(),

    updatedAt: new Date().toISOString(),

    analyses: []
  };

  projects.unshift(project);

  rankPilotSaveProjects(projects);

  return project;
}

/* ---------------------------------------------------------
   SAVE ANALYSIS
--------------------------------------------------------- */

function rankPilotSaveAnalysis(data) {
  if (!data || !data.url) {
    return;
  }

  const projects = rankPilotGetProjects();

  const normalizedUrl = normalizeUrl(data.url);

  let project = projects.find(
    (item) =>
      normalizeUrl(item.url) === normalizedUrl
  );

  /*
   Si no existe proyecto, creamos uno automáticamente.
  */

  if (!project) {
    project = rankPilotCreateProject(
      getHostname(normalizedUrl) || "Mi proyecto",
      normalizedUrl
    );

    /*
     Volvemos a cargar porque createProject
     ya guardó los datos.
    */

    const updatedProjects = rankPilotGetProjects();

    const createdProject = updatedProjects.find(
      (item) => item.id === project.id
    );

    if (!createdProject) {
      return;
    }

    project = createdProject;
  }

  const freshProjects = rankPilotGetProjects();

  const targetProject = freshProjects.find(
    (item) => item.id === project.id
  );

  if (!targetProject) {
    return;
  }

  const analysis = {
    id:
      "analysis_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 8),

    date: new Date().toISOString(),

    score:
      typeof data.score === "number"
        ? data.score
        : 0,

    data: data
  };

  if (!Array.isArray(targetProject.analyses)) {
    targetProject.analyses = [];
  }

  targetProject.analyses.unshift(analysis);

  /*
   Máximo 20 análisis por proyecto.
  */

  targetProject.analyses =
    targetProject.analyses.slice(0, 20);

  targetProject.updatedAt =
    new Date().toISOString();

  rankPilotSaveProjects(freshProjects);
}

/* ---------------------------------------------------------
   FIND PROJECT
--------------------------------------------------------- */

function rankPilotFindProject(projectId) {
  const projects = rankPilotGetProjects();

  return projects.find(
    (project) => project.id === projectId
  );
}

/* ---------------------------------------------------------
   DELETE PROJECT
--------------------------------------------------------- */

function rankPilotDeleteProject(projectId) {
  const projects = rankPilotGetProjects();

  const filtered = projects.filter(
    (project) => project.id !== projectId
  );

  rankPilotSaveProjects(filtered);

  rankPilotOpenDashboard();
}

/* ---------------------------------------------------------
   DASHBOARD BUTTON
--------------------------------------------------------- */

function rankPilotCreateDashboardButton() {
  if (
    document.getElementById(
      "rankpilotDashboardButton"
    )
  ) {
    return;
  }

  const button =
    document.createElement("button");

  button.id =
    "rankpilotDashboardButton";

  button.type = "button";

  button.innerHTML = `
    <span class="rp-dashboard-icon">▦</span>
    <span>Dashboard</span>
  `;

  button.addEventListener(
    "click",
    rankPilotOpenDashboard
  );

  document.body.appendChild(button);
}

/* ---------------------------------------------------------
   DASHBOARD MODAL
--------------------------------------------------------- */

function rankPilotCreateDashboardModal() {
  if (
    document.getElementById(
      "rankpilotDashboardModal"
    )
  ) {
    return;
  }

  const modal =
    document.createElement("div");

  modal.id =
    "rankpilotDashboardModal";

  modal.innerHTML = `
    <div class="rp-dashboard-overlay"></div>

    <div class="rp-dashboard-panel">

      <div class="rp-dashboard-header">

        <div>
          <div class="rp-dashboard-eyebrow">
            RANKPILOT
          </div>

          <h2>
            Dashboard
          </h2>

          <p>
            Gestiona tus proyectos SEO y consulta su evolución.
          </p>
        </div>

        <button
          type="button"
          class="rp-dashboard-close"
          id="rankpilotDashboardClose"
        >
          ×
        </button>

      </div>

      <div
        id="rankpilotDashboardContent"
        class="rp-dashboard-content"
      ></div>

    </div>
  `;

  document.body.appendChild(modal);

  const closeButton =
    document.getElementById(
      "rankpilotDashboardClose"
    );

  if (closeButton) {
    closeButton.addEventListener(
      "click",
      rankPilotCloseDashboard
    );
  }

  const overlay =
    modal.querySelector(
      ".rp-dashboard-overlay"
    );

  if (overlay) {
    overlay.addEventListener(
      "click",
      rankPilotCloseDashboard
    );
  }
}

/* ---------------------------------------------------------
   OPEN DASHBOARD
--------------------------------------------------------- */

function rankPilotOpenDashboard() {
  rankPilotCreateDashboardModal();

  const modal =
    document.getElementById(
      "rankpilotDashboardModal"
    );

  if (!modal) {
    return;
  }

  modal.classList.add("active");

  document.body.classList.add(
    "rankpilot-dashboard-open"
  );

  rankPilotRenderDashboard();
}

/* ---------------------------------------------------------
   CLOSE DASHBOARD
--------------------------------------------------------- */

function rankPilotCloseDashboard() {
  const modal =
    document.getElementById(
      "rankpilotDashboardModal"
    );

  if (!modal) {
    return;
  }

  modal.classList.remove("active");

  document.body.classList.remove(
    "rankpilot-dashboard-open"
  );
}

/* ---------------------------------------------------------
   DASHBOARD RENDER
--------------------------------------------------------- */

function rankPilotRenderDashboard() {
  const container =
    document.getElementById(
      "rankpilotDashboardContent"
    );

  if (!container) {
    return;
  }

  const projects =
    rankPilotGetProjects();

  const totalProjects =
    projects.length;

  const totalAnalyses =
    projects.reduce(
      (total, project) =>
        total +
        (Array.isArray(project.analyses)
          ? project.analyses.length
          : 0),
      0
    );

  const latestScores =
    projects
      .map((project) => {
        if (
          !project.analyses ||
          !project.analyses.length
        ) {
          return null;
        }

        return project.analyses[0].score;
      })
      .filter(
        (score) =>
          typeof score === "number"
      );

  const averageScore =
    latestScores.length
      ? Math.round(
          latestScores.reduce(
            (a, b) => a + b,
            0
          ) /
            latestScores.length
        )
      : 0;

  container.innerHTML = `
    <div class="rp-dashboard-stats">

      <div class="rp-stat-card">
        <span>Proyectos</span>
        <strong>${totalProjects}</strong>
      </div>

      <div class="rp-stat-card">
        <span>Análisis</span>
        <strong>${totalAnalyses}</strong>
      </div>

      <div class="rp-stat-card">
        <span>Score medio</span>
        <strong>${averageScore}/100</strong>
      </div>

    </div>

    <div class="rp-dashboard-toolbar">

      <div>
        <h3>
          Mis proyectos
        </h3>

        <p>
          Crea y controla tus proyectos SEO.
        </p>
      </div>

      <button
        type="button"
        class="rp-primary-button"
        id="rankpilotCreateProjectButton"
      >
        + Nuevo proyecto
      </button>

    </div>

    <div
      id="rankpilotProjectsArea"
      class="rp-projects-area"
    ></div>

    <div
      id="rankpilotCreateProjectArea"
      class="rp-create-project-area"
      style="display:none;"
    ></div>
  `;

  const createButton =
    document.getElementById(
      "rankpilotCreateProjectButton"
    );

  if (createButton) {
    createButton.addEventListener(
      "click",
      rankPilotShowCreateProject
    );
  }

  rankPilotRenderProjects();
}

/* ---------------------------------------------------------
   PROJECTS
--------------------------------------------------------- */

function rankPilotRenderProjects() {
  const area =
    document.getElementById(
      "rankpilotProjectsArea"
    );

  if (!area) {
    return;
  }

  const projects =
    rankPilotGetProjects();

  if (!projects.length) {
    area.innerHTML = `
      <div class="rp-empty-state">

        <div class="rp-empty-icon">
          ◫
        </div>

        <h3>
          Todavía no tienes proyectos
        </h3>

        <p>
          Crea tu primer proyecto para empezar a guardar análisis y seguir tu evolución SEO.
        </p>

        <button
          type="button"
          class="rp-primary-button"
          onclick="rankPilotShowCreateProject()"
        >
          Crear mi primer proyecto
        </button>

      </div>
    `;

    return;
  }

  area.innerHTML =
    projects
      .map(
        (project) =>
          rankPilotProjectCard(project)
      )
      .join("");
}

/* ---------------------------------------------------------
   PROJECT CARD
--------------------------------------------------------- */

function rankPilotProjectCard(project) {
  const analyses =
    Array.isArray(project.analyses)
      ? project.analyses
      : [];

  const latest =
    analyses.length
      ? analyses[0]
      : null;

  const score =
    latest &&
    typeof latest.score === "number"
      ? latest.score
      : null;

  const lastDate =
    latest
      ? rankPilotFormatDate(
          latest.date
        )
      : "Sin análisis";

  return `
    <div
      class="rp-project-card"
      data-project-id="${escapeHtml(
        project.id
      )}"
    >

      <div class="rp-project-main">

        <div class="rp-project-icon">
          ◉
        </div>

        <div class="rp-project-info">

          <h4>
            ${escapeHtml(project.name)}
          </h4>

          <a
            href="${escapeHtml(project.url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${escapeHtml(project.url)}
          </a>

          <span>
            Último análisis: ${lastDate}
          </span>

        </div>

      </div>

      <div class="rp-project-score">

        ${
          score !== null
            ? `
              <strong>
                ${score}
              </strong>

              <span>
                /100
              </span>
            `
            : `
              <span class="rp-no-score">
                —
              </span>
            `
        }

      </div>

      <div class="rp-project-actions">

        <button
          type="button"
          onclick="rankPilotOpenProject('${escapeHtml(
            project.id
          )}')"
        >
          Ver proyecto
        </button>

        <button
          type="button"
          onclick="rankPilotAnalyzeProject('${escapeHtml(
            project.id
          )}')"
        >
          Analizar
        </button>

        <button
          type="button"
          class="rp-danger-button"
          onclick="rankPilotConfirmDeleteProject('${escapeHtml(
            project.id
          )}')"
        >
          Eliminar
        </button>

      </div>

    </div>
  `;
}

/* ---------------------------------------------------------
   CREATE PROJECT
--------------------------------------------------------- */

function rankPilotShowCreateProject() {
  const area =
    document.getElementById(
      "rankpilotCreateProjectArea"
    );

  if (!area) {
    return;
  }

  area.style.display = "block";

  area.innerHTML = `
    <div class="rp-create-box">

      <div class="rp-create-header">

        <div>
          <h3>
            Crear proyecto
          </h3>

          <p>
            Añade una web para comenzar a guardar sus análisis.
          </p>
        </div>

        <button
          type="button"
          class="rp-create-close"
          onclick="rankPilotHideCreateProject()"
        >
          ×
        </button>

      </div>

      <form
        id="rankpilotCreateProjectForm"
        class="rp-create-form"
      >

        <div class="rp-field">

          <label>
            Nombre del proyecto
          </label>

          <input
            type="text"
            id="rankpilotProjectName"
            placeholder="Mi empresa"
            required
          >

        </div>

        <div class="rp-field">

          <label>
            URL
          </label>

          <input
            type="url"
            id="rankpilotProjectUrl"
            placeholder="https://ejemplo.com"
            required
          >

        </div>

        <button
          type="submit"
          class="rp-primary-button"
        >
          Crear proyecto
        </button>

      </form>

    </div>
  `;

  const form =
    document.getElementById(
      "rankpilotCreateProjectForm"
    );

  if (form) {
    form.addEventListener(
      "submit",
      function (event) {
        event.preventDefault();

        const name =
          document.getElementById(
            "rankpilotProjectName"
          ).value.trim();

        const url =
          document.getElementById(
            "rankpilotProjectUrl"
          ).value.trim();

        if (!name || !url) {
          return;
        }

        try {
          rankPilotCreateProject(
            name,
            url
          );

          rankPilotHideCreateProject();

          rankPilotRenderDashboard();

        } catch (error) {
          console.error(
            "RankPilot: error creando proyecto",
            error
          );
        }
      }
    );
  }
}

function rankPilotHideCreateProject() {
  const area =
    document.getElementById(
      "rankpilotCreateProjectArea"
    );

  if (!area) {
    return;
  }

  area.style.display = "none";

  area.innerHTML = "";
}

/* ---------------------------------------------------------
   PROJECT DETAIL
--------------------------------------------------------- */

function rankPilotOpenProject(projectId) {
  const project =
    rankPilotFindProject(projectId);

  if (!project) {
    return;
  }

  const container =
    document.getElementById(
      "rankpilotDashboardContent"
    );

  if (!container) {
    return;
  }

  const analyses =
    Array.isArray(project.analyses)
      ? project.analyses
      : [];

  const latest =
    analyses.length
      ? analyses[0]
      : null;

  const score =
    latest &&
    typeof latest.score === "number"
      ? latest.score
      : 0;

  container.innerHTML = `
    <div class="rp-project-detail">

      <button
        type="button"
        class="rp-back-button"
        onclick="rankPilotRenderDashboard()"
      >
        ← Volver al dashboard
      </button>

      <div class="rp-detail-header">

        <div>

          <div class="rp-dashboard-eyebrow">
            PROYECTO
          </div>

          <h2>
            ${escapeHtml(project.name)}
          </h2>

          <a
            href="${escapeHtml(project.url)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            ${escapeHtml(project.url)}
          </a>

        </div>

        <div class="rp-detail-score">

          <span>
            SEO SCORE
          </span>

          <strong>
            ${score}
          </strong>

          <small>
            /100
          </small>

        </div>

      </div>

      <div class="rp-detail-actions">

        <button
          type="button"
          class="rp-primary-button"
          onclick="rankPilotAnalyzeProject('${escapeHtml(
            project.id
          )}')"
        >
          Analizar ahora
        </button>

      </div>

      <div class="rp-evolution-section">

        <div class="rp-section-heading">

          <div>
            <h3>
              Evolución SEO
            </h3>

            <p>
              Observa cómo ha cambiado el score de este proyecto.
            </p>
          </div>

        </div>

        <div id="rankpilotEvolutionChart"></div>

      </div>

      <div class="rp-history-section">

        <div class="rp-section-heading">

          <div>
            <h3>
              Historial
            </h3>

            <p>
              Análisis anteriores de este proyecto.
            </p>
          </div>

        </div>

        <div class="rp-history-list">

          ${
            analyses.length
              ? analyses
                  .map(
                    (analysis) =>
                      rankPilotHistoryItem(
                        project,
                        analysis
                      )
                  )
                  .join("")
              : `
                <div class="rp-empty-history">
                  Todavía no hay análisis guardados.
                </div>
              `
          }

        </div>

      </div>

    </div>
  `;

  rankPilotRenderEvolutionChart(
    analyses
  );
}

/* ---------------------------------------------------------
   EVOLUTION CHART
--------------------------------------------------------- */

function rankPilotRenderEvolutionChart(
  analyses
) {
  const container =
    document.getElementById(
      "rankpilotEvolutionChart"
    );

  if (!container) {
    return;
  }

  if (
    !Array.isArray(analyses) ||
    analyses.length === 0
  ) {
    container.innerHTML = `
      <div class="rp-chart-empty">
        Realiza tu primer análisis para empezar a ver la evolución.
      </div>
    `;

    return;
  }

  const ordered =
    [...analyses]
      .reverse()
      .filter(
        (item) =>
          typeof item.score ===
          "number"
      );

  if (!ordered.length) {
    container.innerHTML = `
      <div class="rp-chart-empty">
        No hay datos suficientes para mostrar la evolución.
      </div>
    `;

    return;
  }

  const width = 760;
  const height = 260;

  const paddingLeft = 50;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 50;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const maxScore = 100;
  const minScore = 0;

  const points =
    ordered.map(
      (analysis, index) => {
        const x =
          ordered.length === 1
            ? width / 2
            : paddingLeft +
              (index /
                (ordered.length - 1)) *
                chartWidth;

        const score =
          Math.max(
            minScore,
            Math.min(
              maxScore,
              analysis.score
            )
          );

        const y =
          paddingTop +
          chartHeight -
          (score / maxScore) *
            chartHeight;

        return {
          x,
          y,
          score,
          date: analysis.date
        };
      }
    );

  const path =
    points
      .map(
        (point, index) =>
          `${
            index === 0
              ? "M"
              : "L"
          } ${point.x} ${point.y}`
      )
      .join(" ");

  const gridLines = [0, 25, 50, 75, 100]
    .map((value) => {
      const y =
        paddingTop +
        chartHeight -
        (value / 100) *
          chartHeight;

      return `
        <line
          x1="${paddingLeft}"
          y1="${y}"
          x2="${width - paddingRight}"
          y2="${y}"
          class="rp-chart-grid"
        />

        <text
          x="${paddingLeft - 10}"
          y="${y + 4}"
          text-anchor="end"
          class="rp-chart-label"
        >
          ${value}
        </text>
      `;
    })
    .join("");

  const circles =
    points
      .map(
        (point) => `
          <circle
            cx="${point.x}"
            cy="${point.y}"
            r="5"
            class="rp-chart-point"
          />

          <text
            x="${point.x}"
            y="${point.y - 12}"
            text-anchor="middle"
            class="rp-chart-score"
          >
            ${point.score}
          </text>
        `
      )
      .join("");

  const dates =
    points
      .map(
        (point) => `
          <text
            x="${point.x}"
            y="${height - 18}"
            text-anchor="middle"
            class="rp-chart-date"
          >
            ${rankPilotFormatShortDate(
              point.date
            )}
          </text>
        `
      )
      .join("");

  container.innerHTML = `
    <div class="rp-chart-wrapper">

      <svg
        viewBox="0 0 ${width} ${height}"
        class="rp-evolution-svg"
        role="img"
        aria-label="Evolución del SEO Score"
      >

        ${gridLines}

        <path
          d="${path}"
          class="rp-chart-line"
          fill="none"
        />

        ${circles}

        ${dates}

      </svg>

    </div>
  `;
}

/* ---------------------------------------------------------
   HISTORY ITEM
--------------------------------------------------------- */

function rankPilotHistoryItem(
  project,
  analysis
) {
  return `
    <div class="rp-history-item">

      <div class="rp-history-date">

        <strong>
          ${rankPilotFormatDate(
            analysis.date
          )}
        </strong>

        <span>
          ${rankPilotFormatTime(
            analysis.date
          )}
        </span>

      </div>

      <div class="rp-history-score">

        <strong>
          ${analysis.score}
        </strong>

        <span>
          /100
        </span>

      </div>

      <div class="rp-history-actions">

        <button
          type="button"
          onclick="rankPilotRestoreAnalysis('${escapeHtml(
            project.id
          )}', '${escapeHtml(
            analysis.id
          )}')"
        >
          Ver análisis
        </button>

      </div>

    </div>
  `;
}

/* ---------------------------------------------------------
   RESTORE ANALYSIS
--------------------------------------------------------- */

function rankPilotRestoreAnalysis(
  projectId,
  analysisId
) {
  const project =
    rankPilotFindProject(projectId);

  if (!project) {
    return;
  }

  const analysis =
    project.analyses.find(
      (item) =>
        item.id === analysisId
    );

  if (!analysis || !analysis.data) {
    return;
  }

  currentMainUrl =
    analysis.data.url || "";

  currentData =
    analysis.data;

  rankPilotCloseDashboard();

  /*
   Esperamos un momento para que
   el modal se cierre antes de
   pintar el análisis.
  */

  setTimeout(() => {
    if (
      typeof renderResults ===
      "function"
    ) {
      renderResults(
        analysis.data
      );
    }
  }, 100);
}

/* ---------------------------------------------------------
   ANALYZE PROJECT
--------------------------------------------------------- */

function rankPilotAnalyzeProject(
  projectId
) {
  const project =
    rankPilotFindProject(projectId);

  if (!project) {
    return;
  }

  rankPilotCloseDashboard();

  /*
   Ponemos la URL del proyecto
   en el analizador principal.
  */

  if (input) {
    input.value =
      project.url;
  }

  /*
   Lanzamos el análisis usando
   el formulario principal.
  */

  if (form) {
    if (
      typeof form.requestSubmit ===
      "function"
    ) {
      form.requestSubmit();
    } else {
      form.dispatchEvent(
        new Event(
          "submit",
          {
            bubbles: true,
            cancelable: true
          }
        )
      );
    }
  }
}

/* ---------------------------------------------------------
   DELETE CONFIRMATION
--------------------------------------------------------- */

function rankPilotConfirmDeleteProject(
  projectId
) {
  const project =
    rankPilotFindProject(projectId);

  if (!project) {
    return;
  }

  const confirmed =
    window.confirm(
      `¿Quieres eliminar el proyecto "${project.name}" y todo su historial?`
    );

  if (!confirmed) {
    return;
  }

  rankPilotDeleteProject(
    projectId
  );
}

/* ---------------------------------------------------------
   FORMAT DATES
--------------------------------------------------------- */

function rankPilotFormatDate(
  date
) {
  try {
    return new Date(
      date
    ).toLocaleDateString(
      "es-ES",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    );
  } catch (error) {
    return "—";
  }
}

function rankPilotFormatShortDate(
  date
) {
  try {
    return new Date(
      date
    ).toLocaleDateString(
      "es-ES",
      {
        day: "2-digit",
        month: "2-digit"
      }
    );
  } catch (error) {
    return "—";
  }
}

function rankPilotFormatTime(
  date
) {
  try {
    return new Date(
      date
    ).toLocaleTimeString(
      "es-ES",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  } catch (error) {
    return "";
  }
}

/* ---------------------------------------------------------
   AUTO-SAVE ANALYSES
--------------------------------------------------------- */

function rankPilotInstallAnalysisHook() {
  if (
    window.__rankPilotAnalysisHookInstalled
  ) {
    return;
  }

  if (
    typeof renderResults !==
    "function"
  ) {
    return;
  }

  const originalRenderResults =
    renderResults;

  const wrappedRenderResults =
    function (data) {

      try {
        if (data) {
          rankPilotSaveAnalysis(
            data
          );
        }
      } catch (error) {
        console.error(
          "RankPilot: error guardando análisis",
          error
        );
      }

      return originalRenderResults(
        data
      );
    };

  try {
    renderResults =
      wrappedRenderResults;

    window.__rankPilotAnalysisHookInstalled =
      true;

  } catch (error) {

    /*
     Si renderResults está definido
     como const, no intentamos
     modificarlo.
    */

    console.warn(
      "RankPilot: no se pudo instalar el hook automático.",
      error
    );
  }
}

/* ---------------------------------------------------------
   DASHBOARD CSS
--------------------------------------------------------- */

function rankPilotInjectDashboardStyles() {
  if (
    document.getElementById(
      "rankpilotDashboardStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "rankpilotDashboardStyles";

  style.textContent = `

    /* ==========================================
       DASHBOARD BUTTON
    ========================================== */

    #rankpilotDashboardButton {

      position: fixed;

      bottom: 24px;

      right: 24px;

      top: auto;

      z-index: 9998;

      display: flex;

      align-items: center;

      gap: 8px;

      border: 0;

      border-radius: 12px;

      padding: 12px 17px;

      background: #111827;

      color: #ffffff;

      font-size: 14px;

      font-weight: 700;

      cursor: pointer;

      box-shadow:
        0 10px 30px rgba(
          0,
          0,
          0,
          0.18
        );

      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        background 0.2s ease;

    }

    #rankpilotDashboardButton:hover {

      transform:
        translateY(-2px);

      box-shadow:
        0 14px 35px rgba(
          0,
          0,
          0,
          0.22
        );

      background:
        #0f172a;

    }

    .rp-dashboard-icon {

      font-size: 18px;

      line-height: 1;

    }


    /* ==========================================
       MODAL
    ========================================== */

    #rankpilotDashboardModal {

      position: fixed;

      inset: 0;

      z-index: 9999;

      display: none;

    }

    #rankpilotDashboardModal.active {

      display: block;

    }

    .rp-dashboard-overlay {

      position: absolute;

      inset: 0;

      background:
        rgba(
          15,
          23,
          42,
          0.58
        );

      backdrop-filter:
        blur(7px);

    }

    .rp-dashboard-panel {

      position: absolute;

      top: 4vh;

      left: 50%;

      transform:
        translateX(-50%);

      width:
        min(
          1100px,
          94vw
        );

      height:
        92vh;

      overflow-y: auto;

      background:
        #ffffff;

      border-radius: 22px;

      box-shadow:
        0 30px 80px rgba(
          0,
          0,
          0,
          0.25
        );

    }

    .rp-dashboard-header {

      position: sticky;

      top: 0;

      z-index: 2;

      display: flex;

      justify-content: space-between;

      gap: 20px;

      padding: 28px 30px;

      background:
        rgba(
          255,
          255,
          255,
          0.96
        );

      backdrop-filter:
        blur(10px);

      border-bottom:
        1px solid #e5e7eb;

    }

    .rp-dashboard-eyebrow {

      margin-bottom: 6px;

      font-size: 11px;

      font-weight: 800;

      letter-spacing:
        0.14em;

      color:
        #6b7280;

    }

    .rp-dashboard-header h2 {

      margin: 0;

      font-size: 28px;

      line-height: 1.15;

      color:
        #111827;

    }

    .rp-dashboard-header p {

      margin:
        8px 0 0;

      color:
        #6b7280;

      font-size: 14px;

    }

    .rp-dashboard-close {

      width: 40px;

      height: 40px;

      flex:
        0 0 auto;

      border: 0;

      border-radius: 10px;

      background:
        #f3f4f6;

      color:
        #111827;

      font-size: 26px;

      line-height: 1;

      cursor: pointer;

    }

    .rp-dashboard-content {

      padding: 30px;

    }


    /* ==========================================
       STATS
    ========================================== */

    .rp-dashboard-stats {

      display: grid;

      grid-template-columns:
        repeat(
          3,
          minmax(
            0,
            1fr
          )
        );

      gap: 16px;

      margin-bottom: 32px;

    }

    .rp-stat-card {

      padding: 20px;

      border:
        1px solid #e5e7eb;

      border-radius: 16px;

      background:
        #f9fafb;

    }

    .rp-stat-card span {

      display: block;

      margin-bottom: 8px;

      color:
        #6b7280;

      font-size: 13px;

      font-weight: 600;

    }

    .rp-stat-card strong {

      display: block;

      font-size: 30px;

      color:
        #111827;

    }


    /* ==========================================
       TOOLBAR
    ========================================== */

    .rp-dashboard-toolbar {

      display: flex;

      align-items: center;

      justify-content: space-between;

      gap: 20px;

      margin-bottom: 18px;

    }

    .rp-dashboard-toolbar h3 {

      margin: 0;

      font-size: 20px;

      color:
        #111827;

    }

    .rp-dashboard-toolbar p {

      margin:
        5px 0 0;

      color:
        #6b7280;

      font-size: 13px;

    }

    .rp-primary-button {

      border: 0;

      border-radius: 11px;

      padding:
        11px 16px;

      background:
        #111827;

      color:
        #ffffff;

      font-size: 14px;

      font-weight: 700;

      cursor: pointer;

      transition:
        transform 0.2s ease,
        background 0.2s ease;

    }

    .rp-primary-button:hover {

      transform:
        translateY(-1px);

      background:
        #1f2937;

    }


    /* ==========================================
       PROJECTS
    ========================================== */

    .rp-projects-area {

      display: grid;

      gap: 12px;

    }

    .rp-project-card {

      display: grid;

      grid-template-columns:
        minmax(
          0,
          1fr
        )
        auto
        auto;

      align-items: center;

      gap: 22px;

      padding: 18px;

      border:
        1px solid #e5e7eb;

      border-radius: 16px;

      background:
        #ffffff;

      transition:
        box-shadow 0.2s ease,
        transform 0.2s ease;

    }

    .rp-project-card:hover {

      transform:
        translateY(-1px);

      box-shadow:
        0 10px 25px rgba(
          0,
          0,
          0,
          0.06
        );

    }

    .rp-project-main {

      display: flex;

      align-items: center;

      min-width: 0;

      gap: 14px;

    }

    .rp-project-icon {

      width: 44px;

      height: 44px;

      flex:
        0 0 auto;

      display: flex;

      align-items: center;

      justify-content: center;

      border-radius: 12px;

      background:
        #f3f4f6;

      color:
        #111827;

      font-size: 20px;

    }

    .rp-project-info {

      min-width: 0;

    }

    .rp-project-info h4 {

      margin: 0 0 4px;

      font-size: 16px;

      color:
        #111827;

    }

    .rp-project-info a {

      display: block;

      overflow: hidden;

      text-overflow: ellipsis;

      white-space: nowrap;

      max-width:
        480px;

      color:
        #4b5563;

      text-decoration: none;

      font-size: 13px;

    }

    .rp-project-info span {

      display: block;

      margin-top: 4px;

      color:
        #9ca3af;

      font-size: 12px;

    }

    .rp-project-score {

      display: flex;

      align-items: baseline;

      gap: 2px;

      white-space: nowrap;

    }

    .rp-project-score strong {

      font-size: 30px;

      color:
        #111827;

    }

    .rp-project-score span {

      color:
        #9ca3af;

      font-size: 13px;

    }

    .rp-no-score {

      font-size: 28px;

    }

    .rp-project-actions {

      display: flex;

      flex-wrap: wrap;

      justify-content: flex-end;

      gap: 7px;

    }

    .rp-project-actions button {

      border:
        1px solid #e5e7eb;

      border-radius: 9px;

      padding:
        8px 10px;

      background:
        #ffffff;

      color:
        #111827;

      font-size: 12px;

      font-weight: 600;

      cursor: pointer;

    }

    .rp-project-actions button:hover {

      background:
        #f9fafb;

    }

    .rp-project-actions
    .rp-danger-button {

      color:
        #b91c1c;

    }


    /* ==========================================
       EMPTY STATE
    ========================================== */

    .rp-empty-state {

      padding:
        55px 20px;

      text-align:
        center;

      border:
        1px dashed #d1d5db;

      border-radius: 18px;

      background:
        #f9fafb;

    }

    .rp-empty-icon {

      margin-bottom: 12px;

      font-size: 36px;

    }

    .rp-empty-state h3 {

      margin:
        0 0 8px;

      color:
        #111827;

    }

    .rp-empty-state p {

      max-width:
        500px;

      margin:
        0 auto 18px;

      color:
        #6b7280;

      font-size: 14px;

      line-height: 1.6;

    }


    /* ==========================================
       CREATE PROJECT
    ========================================== */

    .rp-create-project-area {

      margin-top: 20px;

    }

    .rp-create-box {

      padding: 22px;

      border:
        1px solid #e5e7eb;

      border-radius: 16px;

      background:
        #f9fafb;

    }

    .rp-create-header {

      display: flex;

      align-items: flex-start;

      justify-content: space-between;

      gap: 20px;

      margin-bottom: 20px;

    }

    .rp-create-header h3 {

      margin: 0;

      color:
        #111827;

    }

    .rp-create-header p {

      margin:
        5px 0 0;

      color:
        #6b7280;

      font-size: 13px;

    }

    .rp-create-close {

      border: 0;

      background:
        transparent;

      color:
        #6b7280;

      font-size: 24px;

      cursor: pointer;

    }

    .rp-create-form {

      display: grid;

      grid-template-columns:
        1fr 1fr auto;

      align-items: end;

      gap: 14px;

    }

    .rp-field label {

      display: block;

      margin-bottom: 6px;

      color:
        #374151;

      font-size: 12px;

      font-weight: 700;

    }

    .rp-field input {

      width: 100%;

      box-sizing: border-box;

      padding:
        11px 12px;

      border:
        1px solid #d1d5db;

      border-radius: 10px;

      background:
        #ffffff;

      color:
        #111827;

      outline: none;

    }

    .rp-field input:focus {

      border-color:
        #6b7280;

    }


    /* ==========================================
       PROJECT DETAIL
    ========================================== */

    .rp-back-button {

      border: 0;

      background:
        transparent;

      padding: 0;

      margin-bottom: 25px;

      color:
        #4b5563;

      font-size: 13px;

      font-weight: 700;

      cursor: pointer;

    }

    .rp-detail-header {

      display: flex;

      justify-content: space-between;

      align-items: center;

      gap: 25px;

      margin-bottom: 25px;

      padding:
        25px;

      border:
        1px solid #e5e7eb;

      border-radius: 18px;

      background:
        #f9fafb;

    }

    .rp-detail-header h2 {

      margin:
        0 0 7px;

      font-size: 27px;

      color:
        #111827;

    }

    .rp-detail-header a {

      color:
        #4b5563;

      font-size: 13px;

      text-decoration: none;

    }

    .rp-detail-score {

      text-align:
        right;

      white-space:
        nowrap;

    }

    .rp-detail-score span {

      display: block;

      margin-bottom: 3px;

      color:
        #6b7280;

      font-size: 11px;

      font-weight: 800;

      letter-spacing:
        0.08em;

    }

    .rp-detail-score strong {

      font-size: 52px;

      line-height: 1;

      color:
        #111827;

    }

    .rp-detail-score small {

      color:
        #9ca3af;

      font-size: 14px;

    }

    .rp-detail-actions {

      margin-bottom: 30px;

    }


    /* ==========================================
       SECTIONS
    ========================================== */

    .rp-evolution-section,
    .rp-history-section {

      margin-top: 25px;

      padding:
        22px;

      border:
        1px solid #e5e7eb;

      border-radius: 18px;

      background:
        #ffffff;

    }

    .rp-section-heading {

      margin-bottom: 20px;

    }

    .rp-section-heading h3 {

      margin: 0;

      color:
        #111827;

      font-size: 19px;

    }

    .rp-section-heading p {

      margin:
        5px 0 0;

      color:
        #6b7280;

      font-size: 13px;

    }


    /* ==========================================
       CHART
    ========================================== */

    .rp-chart-wrapper {

      width: 100%;

      overflow-x: auto;

    }

    .rp-evolution-svg {

      width: 100%;

      min-width: 620px;

      height: auto;

      display: block;

    }

    .rp-chart-grid {

      stroke:
        #e5e7eb;

      stroke-width:
        1;

    }

    .rp-chart-label {

      fill:
        #9ca3af;

      font-size:
        11px;

    }

    .rp-chart-line {

      stroke:
        #111827;

      stroke-width:
        3;

      stroke-linecap:
        round;

      stroke-linejoin:
        round;

    }

    .rp-chart-point {

      fill:
        #ffffff;

      stroke:
        #111827;

      stroke-width:
        3;

    }

    .rp-chart-score {

      fill:
        #111827;

      font-size:
        12px;

      font-weight:
        700;

    }

    .rp-chart-date {

      fill:
        #9ca3af;

      font-size:
        10px;

    }

    .rp-chart-empty {

      padding:
        35px;

      text-align:
        center;

      border:
        1px dashed #d1d5db;

      border-radius:
        12px;

      color:
        #6b7280;

      background:
        #f9fafb;

      font-size:
        13px;

    }


    /* ==========================================
       HISTORY
    ========================================== */

    .rp-history-list {

      display:
        grid;

      gap:
        8px;

    }

    .rp-history-item {

      display:
        grid;

      grid-template-columns:
        1fr auto auto;

      align-items:
        center;

      gap:
        20px;

      padding:
        14px 15px;

      border:
        1px solid #e5e7eb;

      border-radius:
        12px;

    }

    .rp-history-date strong {

      display:
        block;

      color:
        #111827;

      font-size:
        13px;

    }

    .rp-history-date span {

      display:
        block;

      margin-top:
        3px;

      color:
        #9ca3af;

      font-size:
        11px;

    }

    .rp-history-score {

      display:
        flex;

      align-items:
        baseline;

      gap:
        2px;

    }

    .rp-history-score strong {

      color:
        #111827;

      font-size:
        24px;

    }

    .rp-history-score span {

      color:
        #9ca3af;

      font-size:
        12px;

    }

    .rp-history-actions button {

      border:
        1px solid #e5e7eb;

      border-radius:
        8px;

      padding:
        7px 10px;

      background:
        #ffffff;

      color:
        #111827;

      font-size:
        12px;

      font-weight:
        600;

      cursor:
        pointer;

    }

    .rp-empty-history {

      padding:
        30px;

      text-align:
        center;

      color:
        #6b7280;

      font-size:
        13px;

      background:
        #f9fafb;

      border-radius:
        12px;

    }


    /* ==========================================
       MOBILE
    ========================================== */

    @media (
      max-width: 760px
    ) {

      #rankpilotDashboardButton {

        bottom: 14px;

        right: 14px;

        top: auto;

        padding:
          10px 13px;

        font-size:
          13px;

      }

      .rp-dashboard-panel {

        top: 0;

        width: 100vw;

        height: 100vh;

        border-radius:
          0;

      }

      .rp-dashboard-header {

        padding:
          20px;

      }

      .rp-dashboard-content {

        padding:
          20px;

      }

      .rp-dashboard-stats {

        grid-template-columns:
          1fr;

      }

      .rp-dashboard-toolbar {

        align-items:
          flex-start;

        flex-direction:
          column;

      }

      .rp-project-card {

        grid-template-columns:
          1fr;

        gap:
          15px;

      }

      .rp-project-actions {

        justify-content:
          flex-start;

      }

      .rp-project-info a {

        max-width:
          100%;

      }

      .rp-create-form {

        grid-template-columns:
          1fr;

      }

      .rp-detail-header {

        flex-direction:
          column;

        align-items:
          flex-start;

      }

      .rp-detail-score {

        text-align:
          left;

      }

      .rp-history-item {

        grid-template-columns:
          1fr auto;

      }

      .rp-history-actions {

        grid-column:
          1 / -1;

      }

    }

  `;

  document.head.appendChild(style);
}

/* ---------------------------------------------------------
   INITIALIZE DASHBOARD
--------------------------------------------------------- */

function rankPilotInitializeDashboard() {
  rankPilotInjectDashboardStyles();

  rankPilotCreateDashboardButton();

  rankPilotCreateDashboardModal();

  rankPilotInstallAnalysisHook();
}

/* ---------------------------------------------------------
   START
--------------------------------------------------------- */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    rankPilotInitializeDashboard
  );

} else {

  rankPilotInitializeDashboard();

}


/* ---------------------------------------------------------
   GLOBAL FUNCTIONS
--------------------------------------------------------- */

window.rankPilotOpenDashboard =
  rankPilotOpenDashboard;

window.rankPilotCloseDashboard =
  rankPilotCloseDashboard;

window.rankPilotOpenProject =
  rankPilotOpenProject;

window.rankPilotAnalyzeProject =
  rankPilotAnalyzeProject;

window.rankPilotShowCreateProject =
  rankPilotShowCreateProject;

window.rankPilotHideCreateProject =
  rankPilotHideCreateProject;

window.rankPilotConfirmDeleteProject =
  rankPilotConfirmDeleteProject;

window.rankPilotRestoreAnalysis =
  rankPilotRestoreAnalysis;

/* =========================================================
   RANKPILOT — SAAS ACCOUNT / PLANS
   ========================================================= */

const RANKPILOT_ACCOUNT_KEY =
  "rankpilot_account_v1";


/* =========================================================
   ACCOUNT STORAGE
========================================================= */

function rankPilotGetAccount() {
  try {
    const saved =
      localStorage.getItem(
        RANKPILOT_ACCOUNT_KEY
      );

    if (!saved) {
      return {
        name: "Usuario",
        email: "",
        plan: "free"
      };
    }

    const account =
      JSON.parse(saved);

    return {
      name:
        account.name ||
        "Usuario",

      email:
        account.email ||
        "",

      plan:
        account.plan ||
        "free"
    };

  } catch (error) {

    console.error(
      "RankPilot: error leyendo cuenta",
      error
    );

    return {
      name: "Usuario",
      email: "",
      plan: "free"
    };
  }
}


function rankPilotSaveAccount(
  account
) {
  try {

    localStorage.setItem(
      RANKPILOT_ACCOUNT_KEY,
      JSON.stringify(account)
    );

  } catch (error) {

    console.error(
      "RankPilot: error guardando cuenta",
      error
    );
  }
}


/* =========================================================
   PLAN HELPERS
========================================================= */

function rankPilotGetPlanName(
  plan
) {

  const names = {

    free: "Free",

    pro: "Pro",

    business: "Business"

  };

  return (
    names[plan] ||
    "Free"
  );
}


function rankPilotGetPlanDescription(
  plan
) {

  const descriptions = {

    free:
      "Para empezar a analizar y mejorar tu SEO.",

    pro:
      "Para profesionales y negocios que quieren crecer.",

    business:
      "Para agencias y equipos que gestionan múltiples webs."

  };

  return (
    descriptions[plan] ||
    descriptions.free
  );
}


/* =========================================================
   PLAN LIMITS
========================================================= */

function rankPilotGetPlanLimits(
  plan
) {

  const limits = {

    free: {

      projects: 1,

      analyses: 10,

      competitors: false,

      reports: false,

      advanced: false,

      team: false

    },

    pro: {

      projects: 10,

      analyses: 100,

      competitors: true,

      reports: true,

      advanced: true,

      team: false

    },

    business: {

      projects: Infinity,

      analyses: Infinity,

      competitors: true,

      reports: true,

      advanced: true,

      team: true

    }

  };

  return (
    limits[plan] ||
    limits.free
  );
}


/* =========================================================
   FEATURE CHECK
========================================================= */

function rankPilotHasFeature(
  feature
) {

  const account =
    rankPilotGetAccount();

  const plan =
    account.plan || "free";

  const limits =
    rankPilotGetPlanLimits(
      plan
    );

  if (
    feature ===
    "competitors"
  ) {
    return limits.competitors;
  }

  if (
    feature ===
    "reports"
  ) {
    return limits.reports;
  }

  if (
    feature ===
    "advanced"
  ) {
    return limits.advanced;
  }

  if (
    feature ===
    "team"
  ) {
    return limits.team;
  }

  return true;
}


/* =========================================================
   ACCOUNT BUTTON
========================================================= */

function rankPilotCreateAccountButton() {

  if (
    document.getElementById(
      "rankpilotAccountButton"
    )
  ) {
    return;
  }

  const button =
    document.createElement(
      "button"
    );

  button.id =
    "rankpilotAccountButton";

  button.type =
    "button";

  button.innerHTML = `
    <span class="rp-account-avatar">
      A
    </span>

    <span class="rp-account-button-text">
      Cuenta
    </span>
  `;

  button.addEventListener(
    "click",
    rankPilotOpenAccount
  );

  document.body.appendChild(
    button
  );
}


/* =========================================================
   ACCOUNT MODAL
========================================================= */

function rankPilotCreateAccountModal() {

  if (
    document.getElementById(
      "rankpilotAccountModal"
    )
  ) {
    return;
  }

  const modal =
    document.createElement(
      "div"
    );

  modal.id =
    "rankpilotAccountModal";

  modal.innerHTML = `

    <div
      class="rp-account-overlay"
    ></div>

    <div
      class="rp-account-panel"
    >

      <div
        class="rp-account-header"
      >

        <div>

          <span
            class="rp-account-eyebrow"
          >
            RANKPILOT
          </span>

          <h2>
            Cuenta
          </h2>

          <p>
            Gestiona tu cuenta y tu plan.
          </p>

        </div>

        <button
          type="button"
          class="rp-account-close"
          id="rankpilotAccountClose"
        >
          ×
        </button>

      </div>

      <div
        id="rankpilotAccountContent"
        class="rp-account-content"
      ></div>

    </div>
  `;

  document.body.appendChild(
    modal
  );

  const close =
    document.getElementById(
      "rankpilotAccountClose"
    );

  if (close) {

    close.addEventListener(
      "click",
      rankPilotCloseAccount
    );

  }

  const overlay =
    modal.querySelector(
      ".rp-account-overlay"
    );

  if (overlay) {

    overlay.addEventListener(
      "click",
      rankPilotCloseAccount
    );

  }
}


/* =========================================================
   OPEN ACCOUNT
========================================================= */

function rankPilotOpenAccount() {

  rankPilotCreateAccountModal();

  const modal =
    document.getElementById(
      "rankpilotAccountModal"
    );

  if (!modal) {
    return;
  }

  modal.classList.add(
    "active"
  );

  rankPilotRenderAccount();
}


/* =========================================================
   CLOSE ACCOUNT
========================================================= */

function rankPilotCloseAccount() {

  const modal =
    document.getElementById(
      "rankpilotAccountModal"
    );

  if (!modal) {
    return;
  }

  modal.classList.remove(
    "active"
  );
}


/* =========================================================
   ACCOUNT CONTENT
========================================================= */

function rankPilotRenderAccount() {

  const container =
    document.getElementById(
      "rankpilotAccountContent"
    );

  if (!container) {
    return;
  }

  const account =
    rankPilotGetAccount();

  const plan =
    account.plan ||
    "free";

  const planName =
    rankPilotGetPlanName(
      plan
    );

  container.innerHTML = `

    <div
      class="rp-account-profile"
    >

      <div
        class="rp-profile-avatar"
      >
        ${escapeHtml(
          (account.name || "A")
            .charAt(0)
            .toUpperCase()
        )}
      </div>

      <div
        class="rp-profile-info"
      >

        <strong>
          ${escapeHtml(
            account.name ||
            "Usuario"
          )}
        </strong>

        <span>
          ${
            account.email
              ? escapeHtml(
                  account.email
                )
              : "Cuenta local"
          }
        </span>

      </div>

      <div
        class="rp-current-plan"
      >
        ${planName}
      </div>

    </div>


    <div
      class="rp-account-section"
    >

      <div
        class="rp-section-title-account"
      >

        <h3>
          Tu plan
        </h3>

        <p>
          Elige el nivel de RankPilot que mejor se adapte a tu proyecto.
        </p>

      </div>

      <div
        class="rp-plans-grid"
      >

        ${rankPilotRenderPlanCard(
          "free"
        )}

        ${rankPilotRenderPlanCard(
          "pro"
        )}

        ${rankPilotRenderPlanCard(
          "business"
        )}

      </div>

    </div>


    <div
      class="rp-account-section"
    >

      <div
        class="rp-section-title-account"
      >

        <h3>
          Perfil
        </h3>

        <p>
          Esta información se guardará en tu cuenta.
        </p>

      </div>

      <form
        id="rankpilotProfileForm"
        class="rp-profile-form"
      >

        <div
          class="rp-profile-field"
        >

          <label>
            Nombre
          </label>

          <input
            type="text"
            id="rankpilotAccountName"
            value="${escapeHtml(
              account.name || ""
            )}"
            placeholder="Tu nombre"
          >

        </div>

        <div
          class="rp-profile-field"
        >

          <label>
            Email
          </label>

          <input
            type="email"
            id="rankpilotAccountEmail"
            value="${escapeHtml(
              account.email || ""
            )}"
            placeholder="tu@email.com"
          >

        </div>

        <button
          type="submit"
          class="rp-save-profile"
        >
          Guardar cambios
        </button>

      </form>

    </div>


    <div
      class="rp-account-section rp-account-future"
    >

      <span>
        PRÓXIMAMENTE
      </span>

      <h3>
        Cuenta RankPilot
      </h3>

      <p>
        Registro, inicio de sesión, sincronización de proyectos,
        pagos y facturación estarán conectados en la siguiente fase.
      </p>

    </div>

  `;


  const profileForm =
    document.getElementById(
      "rankpilotProfileForm"
    );

  if (profileForm) {

    profileForm.addEventListener(
      "submit",
      function (event) {

        event.preventDefault();

        const name =
          document.getElementById(
            "rankpilotAccountName"
          ).value.trim();

        const email =
          document.getElementById(
            "rankpilotAccountEmail"
          ).value.trim();

        const current =
          rankPilotGetAccount();

        rankPilotSaveAccount({

          name:
            name ||
            "Usuario",

          email:
            email,

          plan:
            current.plan ||
            "free"

        });

        rankPilotRenderAccount();

      }
    );

  }
}


/* =========================================================
   PLAN CARD
========================================================= */

function rankPilotRenderPlanCard(
  plan
) {

  const account =
    rankPilotGetAccount();

  const currentPlan =
    account.plan ||
    "free";

  const isCurrent =
    currentPlan ===
    plan;

  const data = {

    free: {

      name: "Free",

      price: "0€",

      period: "/mes",

      description:
        "Empieza a analizar webs y descubre oportunidades SEO.",

      features: [

        "1 proyecto",

        "Hasta 10 análisis",

        "SEO Score",

        "SEO Action Plan",

        "Keyword Intelligence",

        "Historial básico"

      ]

    },

    pro: {

      name: "Pro",

      price: "19€",

      period: "/mes",

      description:
        "Para profesionales y negocios que quieren crecer.",

      features: [

        "Hasta 10 proyectos",

        "Hasta 100 análisis",

        "Todo lo incluido en Free",

        "Análisis de competidores",

        "Informes SEO PDF",

        "Funciones SEO avanzadas",

        "Seguimiento de evolución"

      ]

    },

    business: {

      name: "Business",

      price: "49€",

      period: "/mes",

      description:
        "Para agencias y equipos que gestionan múltiples webs.",

      features: [

        "Proyectos ilimitados",

        "Análisis ilimitados",

        "Todo lo incluido en Pro",

        "Funciones avanzadas",

        "Gestión de equipos",

        "Preparado para agencias"

      ]

    }

  };

  const selected =
    data[plan] ||
    data.free;

  return `

    <div
      class="
        rp-plan-card
        ${
          plan === "pro"
            ? "rp-plan-featured"
            : ""
        }
        ${
          isCurrent
            ? "rp-plan-current"
            : ""
        }
      "
    >

      ${
        plan === "pro"
          ? `
            <div
              class="rp-plan-badge"
            >
              MÁS POPULAR
            </div>
          `
          : ""
      }

      <div
        class="rp-plan-name"
      >
        ${selected.name}
      </div>

      <div
        class="rp-plan-price"
      >

        <strong>
          ${selected.price}
        </strong>

        <span>
          ${selected.period}
        </span>

      </div>

      <p
        class="rp-plan-description"
      >
        ${selected.description}
      </p>

      <div
        class="rp-plan-features"
      >

        ${selected.features
          .map(
            (feature) => `
              <div
                class="rp-plan-feature"
              >

                <span>
                  ✓
                </span>

                <span>
                  ${feature}
                </span>

              </div>
            `
          )
          .join("")}

      </div>

      ${
        isCurrent
          ? `
            <button
              type="button"
              class="rp-plan-button rp-plan-active"
              disabled
            >
              Plan actual
            </button>
          `
          : `
            <button
              type="button"
              class="rp-plan-button"
              onclick="rankPilotSelectPlan('${plan}')"
            >
              ${
                plan === "free"
                  ? "Cambiar a Free"
                  : "Elegir " +
                    selected.name
              }
            </button>
          `
      }

    </div>

  `;
}


/* =========================================================
   SELECT PLAN
========================================================= */

function rankPilotSelectPlan(
  plan
) {

  const account =
    rankPilotGetAccount();

  /*
   De momento NO cobramos.
   Esto solamente cambia el plan local
   para probar toda la interfaz.
  */

  rankPilotSaveAccount({

    name:
      account.name ||
      "Usuario",

    email:
      account.email ||
      "",

    plan:
      plan

  });

  rankPilotRenderAccount();

  /*
   Cuando conectemos Stripe,
   esta función será sustituida por
   el checkout real.
  */

  console.log(
    "RankPilot plan seleccionado:",
    plan
  );
}


/* =========================================================
   PLAN CSS
========================================================= */

function rankPilotInjectAccountStyles() {

  if (
    document.getElementById(
      "rankpilotAccountStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "rankpilotAccountStyles";

  style.textContent = `

    /* ==========================================
       ACCOUNT BUTTON
    ========================================== */

    #rankpilotAccountButton {

      position: fixed;

      top: 20px;

      left: 20px;

      z-index: 9997;

      display: flex;

      align-items: center;

      gap: 8px;

      padding:
        8px 12px 8px 8px;

      border:
        1px solid #e5e7eb;

      border-radius: 12px;

      background:
        #ffffff;

      color:
        #111827;

      box-shadow:
        0 8px 25px
        rgba(
          0,
          0,
          0,
          0.08
        );

      font-size: 13px;

      font-weight: 700;

      cursor: pointer;

      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

    }

    #rankpilotAccountButton:hover {

      transform:
        translateY(-1px);

      box-shadow:
        0 12px 30px
        rgba(
          0,
          0,
          0,
          0.12
        );

    }

    .rp-account-avatar {

      width: 28px;

      height: 28px;

      display: flex;

      align-items: center;

      justify-content: center;

      border-radius: 9px;

      background:
        #111827;

      color:
        #ffffff;

      font-size: 12px;

      font-weight: 800;

    }


    /* ==========================================
       ACCOUNT MODAL
    ========================================== */

    #rankpilotAccountModal {

      position: fixed;

      inset: 0;

      z-index: 10000;

      display: none;

    }

    #rankpilotAccountModal.active {

      display: block;

    }

    .rp-account-overlay {

      position: absolute;

      inset: 0;

      background:
        rgba(
          15,
          23,
          42,
          0.58
        );

      backdrop-filter:
        blur(7px);

    }

    .rp-account-panel {

      position: absolute;

      top: 4vh;

      left: 50%;

      transform:
        translateX(-50%);

      width:
        min(
          1100px,
          94vw
        );

      height:
        92vh;

      overflow-y:
        auto;

      background:
        #ffffff;

      border-radius:
        22px;

      box-shadow:
        0 30px 80px
        rgba(
          0,
          0,
          0,
          0.25
        );

    }

    .rp-account-header {

      position: sticky;

      top: 0;

      z-index: 2;

      display: flex;

      justify-content:
        space-between;

      gap: 20px;

      padding:
        28px 30px;

      background:
        rgba(
          255,
          255,
          255,
          0.96
        );

      backdrop-filter:
        blur(10px);

      border-bottom:
        1px solid #e5e7eb;

    }

    .rp-account-eyebrow {

      display:
        block;

      margin-bottom:
        6px;

      color:
        #6b7280;

      font-size:
        11px;

      font-weight:
        800;

      letter-spacing:
        0.14em;

    }

    .rp-account-header h2 {

      margin:
        0;

      color:
        #111827;

      font-size:
        28px;

    }

    .rp-account-header p {

      margin:
        7px 0 0;

      color:
        #6b7280;

      font-size:
        14px;

    }

    .rp-account-close {

      width:
        40px;

      height:
        40px;

      border:
        0;

      border-radius:
        10px;

      background:
        #f3f4f6;

      color:
        #111827;

      font-size:
        25px;

      cursor:
        pointer;

    }

    .rp-account-content {

      padding:
        30px;

    }


    /* ==========================================
       PROFILE
    ========================================== */

    .rp-account-profile {

      display:
        flex;

      align-items:
        center;

      gap:
        14px;

      padding:
        18px;

      margin-bottom:
        32px;

      border:
        1px solid #e5e7eb;

      border-radius:
        16px;

      background:
        #f9fafb;

    }

    .rp-profile-avatar {

      width:
        50px;

      height:
        50px;

      display:
        flex;

      align-items:
        center;

      justify-content:
        center;

      border-radius:
        14px;

      background:
        #111827;

      color:
        #ffffff;

      font-size:
        20px;

      font-weight:
        800;

    }

    .rp-profile-info {

      flex:
        1;

      min-width:
        0;

    }

    .rp-profile-info strong {

      display:
        block;

      color:
        #111827;

      font-size:
        15px;

    }

    .rp-profile-info span {

      display:
        block;

      margin-top:
        3px;

      color:
        #6b7280;

      font-size:
        12px;

    }

    .rp-current-plan {

      padding:
        7px 11px;

      border-radius:
        999px;

      background:
        #111827;

      color:
        #ffffff;

      font-size:
        11px;

      font-weight:
        800;

    }


    /* ==========================================
       SECTIONS
    ========================================== */

    .rp-account-section {

      margin-top:
        32px;

    }

    .rp-section-title-account {

      margin-bottom:
        18px;

    }

    .rp-section-title-account h3 {

      margin:
        0;

      color:
        #111827;

      font-size:
        20px;

    }

    .rp-section-title-account p {

      margin:
        5px 0 0;

      color:
        #6b7280;

      font-size:
        13px;

    }


    /* ==========================================
       PLANS
    ========================================== */

    .rp-plans-grid {

      display:
        grid;

      grid-template-columns:
        repeat(
          3,
          minmax(
            0,
            1fr
          )
        );

      gap:
        18px;

    }

    .rp-plan-card {

      position:
        relative;

      display:
        flex;

      flex-direction:
        column;

      padding:
        24px;

      border:
        1px solid #e5e7eb;

      border-radius:
        18px;

      background:
        #ffffff;

      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

    }

    .rp-plan-card:hover {

      transform:
        translateY(-2px);

      box-shadow:
        0 15px 35px
        rgba(
          0,
          0,
          0,
          0.07
        );

    }

    .rp-plan-featured {

      border:
        2px solid #111827;

    }

    .rp-plan-current {

      background:
        #f9fafb;

    }

    .rp-plan-badge {

      position:
        absolute;

      top:
        -11px;

      left:
        20px;

      padding:
        5px 9px;

      border-radius:
        999px;

      background:
        #111827;

      color:
        #ffffff;

      font-size:
        9px;

      font-weight:
        800;

      letter-spacing:
        0.05em;

    }

    .rp-plan-name {

      color:
        #111827;

      font-size:
        18px;

      font-weight:
        800;

    }

    .rp-plan-price {

      display:
        flex;

      align-items:
        baseline;

      gap:
        4px;

      margin-top:
        15px;

    }

    .rp-plan-price strong {

      color:
        #111827;

      font-size:
        38px;

      line-height:
        1;

    }

    .rp-plan-price span {

      color:
        #9ca3af;

      font-size:
        12px;

    }

    .rp-plan-description {

      min-height:
        48px;

      margin:
        14px 0 20px;

      color:
        #6b7280;

      font-size:
        13px;

      line-height:
        1.55;

    }

    .rp-plan-features {

      display:
        grid;

      gap:
        10px;

      margin-bottom:
        24px;

      flex:
        1;

    }

    .rp-plan-feature {

      display:
        flex;

      align-items:
        flex-start;

      gap:
        8px;

      color:
        #374151;

      font-size:
        12px;

      line-height:
        1.4;

    }

    .rp-plan-feature > span:first-child {

      color:
        #111827;

      font-weight:
        800;

    }

    .rp-plan-button {

      width:
        100%;

      padding:
        11px;

      border:
        1px solid #111827;

      border-radius:
        10px;

      background:
        #111827;

      color:
        #ffffff;

      font-size:
        13px;

      font-weight:
        700;

      cursor:
        pointer;

    }

    .rp-plan-button:hover {

      background:
        #1f2937;

    }

    .rp-plan-active {

      background:
        #e5e7eb;

      border-color:
        #e5e7eb;

      color:
        #6b7280;

      cursor:
        default;

    }


    /* ==========================================
       PROFILE FORM
    ========================================== */

    .rp-profile-form {

      display:
        grid;

      grid-template-columns:
        1fr 1fr auto;

      align-items:
        end;

      gap:
        14px;

    }

    .rp-profile-field label {

      display:
        block;

      margin-bottom:
        6px;

      color:
        #374151;

      font-size:
        12px;

      font-weight:
        700;

    }

    .rp-profile-field input {

      width:
        100%;

      box-sizing:
        border-box;

      padding:
        11px 12px;

      border:
        1px solid #d1d5db;

      border-radius:
        10px;

      outline:
        none;

      font-size:
        13px;

    }

    .rp-profile-field input:focus {

      border-color:
        #111827;

    }

    .rp-save-profile {

      padding:
        11px 15px;

      border:
        0;

      border-radius:
        10px;

      background:
        #111827;

      color:
        #ffffff;

      font-size:
        13px;

      font-weight:
        700;

      cursor:
        pointer;

    }


    /* ==========================================
       FUTURE
    ========================================== */

    .rp-account-future {

      padding:
        20px;

      border:
        1px dashed #d1d5db;

      border-radius:
        15px;

      background:
        #f9fafb;

    }

    .rp-account-future > span {

      color:
        #6b7280;

      font-size:
        10px;

      font-weight:
        800;

      letter-spacing:
        0.1em;

    }

    .rp-account-future h3 {

      margin:
        7px 0 5px;

      color:
        #111827;

      font-size:
        16px;

    }

    .rp-account-future p {

      margin:
        0;

      color:
        #6b7280;

      font-size:
        13px;

      line-height:
        1.5;

    }


    /* ==========================================
       MOBILE
    ========================================== */

    @media (
      max-width: 760px
    ) {

      #rankpilotAccountButton {

        top:
          12px;

        left:
          12px;

      }

      .rp-account-panel {

        top:
          0;

        left:
          0;

        transform:
          none;

        width:
          100vw;

        height:
          100vh;

        border-radius:
          0;

      }

      .rp-account-header {

        padding:
          20px;

      }

      .rp-account-content {

        padding:
          20px;

      }

      .rp-plans-grid {

        grid-template-columns:
          1fr;

      }

      .rp-profile-form {

        grid-template-columns:
          1fr;

      }

      .rp-account-profile {

        flex-wrap:
          wrap;

      }

      .rp-current-plan {

        margin-left:
          64px;

      }

    }

  `;

  document.head.appendChild(
    style
  );
}


/* =========================================================
   INITIALIZE ACCOUNT
========================================================= */

function rankPilotInitializeAccount() {

  rankPilotInjectAccountStyles();

  rankPilotCreateAccountButton();

  rankPilotCreateAccountModal();

}


/* =========================================================
   START
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    rankPilotInitializeAccount
  );

} else {

  rankPilotInitializeAccount();

}


/* =========================================================
   GLOBALS
========================================================= */

window.rankPilotOpenAccount =
  rankPilotOpenAccount;

window.rankPilotCloseAccount =
  rankPilotCloseAccount;

window.rankPilotSelectPlan =
  rankPilotSelectPlan;

window.rankPilotGetAccount =
  rankPilotGetAccount;

window.rankPilotHasFeature =
  rankPilotHasFeature;

/* =========================================================
   RANKPILOT — LOGIN / USER MENU
   ========================================================= */

(function () {
  "use strict";

  function initRankPilotLoginUI() {
    /* -----------------------------------------------------
       1. OCULTAR EL ANTIGUO BOTÓN "CUENTA"
       ----------------------------------------------------- */

    const oldAccountButton = document.getElementById(
      "rankpilotAccountButton"
    );

    if (oldAccountButton) {
      oldAccountButton.style.display = "none";
    }

    /* -----------------------------------------------------
       2. CREAR BOTÓN "INICIAR SESIÓN"
       ----------------------------------------------------- */

    if (document.getElementById("rankpilotLoginButton")) {
      return;
    }

    const loginButton = document.createElement("button");

    loginButton.id = "rankpilotLoginButton";
    loginButton.type = "button";
    loginButton.textContent = "Iniciar sesión";

    document.body.appendChild(loginButton);

    /* -----------------------------------------------------
       3. CREAR MENÚ DE USUARIO
       ----------------------------------------------------- */

    const userMenu = document.createElement("div");

    userMenu.id = "rankpilotUserMenu";

    userMenu.innerHTML = `
      <button type="button" id="rankpilotUserMenuDashboard">
        📊 Dashboard
      </button>

      <button type="button" id="rankpilotUserMenuProjects">
        📁 Mis proyectos
      </button>

      <button type="button" id="rankpilotUserMenuHistory">
        📈 Historial
      </button>

      <button type="button" id="rankpilotUserMenuAccount">
        👤 Mi cuenta
      </button>

      <div class="rankpilot-menu-divider"></div>

      <button type="button" id="rankpilotUserMenuLogout">
        🚪 Cerrar sesión
      </button>
    `;

    document.body.appendChild(userMenu);

    /* -----------------------------------------------------
       4. ESTADO ACTUAL
       ----------------------------------------------------- */

    function getCurrentAccount() {
      try {
        if (typeof rankPilotGetAccount === "function") {
          return rankPilotGetAccount();
        }

        const saved = localStorage.getItem(
          "rankpilot_account_v1"
        );

        return saved ? JSON.parse(saved) : null;
      } catch (error) {
        return null;
      }
    }

    function isLoggedIn() {
      const account = getCurrentAccount();

      return !!(
        account &&
        (
          account.loggedIn === true ||
          account.isLoggedIn === true ||
          account.email
        )
      );
    }

    /* -----------------------------------------------------
       5. ACTUALIZAR BOTÓN
       ----------------------------------------------------- */

    function updateLoginButton() {
      const account = getCurrentAccount();

      if (isLoggedIn()) {
        let name = "Mi cuenta";

        if (account && account.name) {
          name = account.name.split(" ")[0];
        }

        loginButton.innerHTML = `
          ${escapeHtml(name)}
          <span class="rankpilot-login-arrow">▾</span>
        `;

        loginButton.classList.add("logged-in");
      } else {
        loginButton.textContent = "Iniciar sesión";
        loginButton.classList.remove("logged-in");
      }
    }

    /* -----------------------------------------------------
       6. ABRIR / CERRAR MENÚ
       ----------------------------------------------------- */

    function closeUserMenu() {
      userMenu.classList.remove("open");
    }

    function toggleUserMenu() {
      if (!isLoggedIn()) {
        openLoginModal();
        return;
      }

      userMenu.classList.toggle("open");
    }

    loginButton.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleUserMenu();
    });

    document.addEventListener("click", function (event) {
      if (
        !userMenu.contains(event.target) &&
        !loginButton.contains(event.target)
      ) {
        closeUserMenu();
      }
    });

    /* -----------------------------------------------------
       7. LOGIN
       ----------------------------------------------------- */

    function openLoginModal() {
      closeUserMenu();

      /*
       * Si ya tenemos el modal de cuenta que creamos
       * anteriormente, lo utilizamos.
       */

      const accountModal = document.getElementById(
        "rankpilotAccountModal"
      );

      if (accountModal) {
        accountModal.classList.add("open");

        accountModal.style.display = "flex";

        return;
      }

      /*
       * Fallback: crear un modal de login sencillo.
       */

      createLoginModal();
    }

    function createLoginModal() {
      if (document.getElementById("rankpilotLoginModal")) {
        const modal = document.getElementById(
          "rankpilotLoginModal"
        );

        modal.classList.add("open");
        modal.style.display = "flex";

        return;
      }

      const modal = document.createElement("div");

      modal.id = "rankpilotLoginModal";

      modal.innerHTML = `
        <div class="rankpilot-login-overlay"></div>

        <div class="rankpilot-login-card">

          <button
            type="button"
            class="rankpilot-login-close"
            id="rankpilotLoginClose"
          >
            ×
          </button>

          <div class="rankpilot-login-logo">
            RANK<span>PILOT</span>
          </div>

          <h2>Iniciar sesión</h2>

          <p class="rankpilot-login-subtitle">
            Accede a tu espacio de RankPilot.
          </p>

          <form id="rankpilotLoginForm">

            <label>
              Email
              <input
                type="email"
                id="rankpilotLoginEmail"
                placeholder="tu@email.com"
                required
              >
            </label>

            <label>
              Contraseña
              <input
                type="password"
                id="rankpilotLoginPassword"
                placeholder="••••••••"
                required
              >
            </label>

            <button
              type="submit"
              class="rankpilot-login-submit"
            >
              Iniciar sesión
            </button>

          </form>

          <p class="rankpilot-login-register">
            ¿No tienes cuenta?
            <button type="button" id="rankpilotRegisterButton">
              Regístrate
            </button>
          </p>

        </div>
      `;

      document.body.appendChild(modal);

      modal.style.display = "flex";

      setTimeout(function () {
        modal.classList.add("open");
      }, 10);

      const closeButton = document.getElementById(
        "rankpilotLoginClose"
      );

      const overlay = modal.querySelector(
        ".rankpilot-login-overlay"
      );

      closeButton.addEventListener("click", function () {
        closeLoginModal();
      });

      overlay.addEventListener("click", function () {
        closeLoginModal();
      });

      document
        .getElementById("rankpilotLoginForm")
        .addEventListener("submit", function (event) {
          event.preventDefault();

          const email = document.getElementById(
            "rankpilotLoginEmail"
          ).value.trim();

          if (!email) {
            return;
          }

          /*
           * DEMO LOCAL
           *
           * Más adelante esto se sustituirá por nuestro
           * login real conectado al backend.
           */

          const existingAccount =
            getCurrentAccount() || {};

          const account = {
            ...existingAccount,
            email: email,
            name:
              existingAccount.name ||
              email.split("@")[0],
            loggedIn: true
          };

          localStorage.setItem(
            "rankpilot_account_v1",
            JSON.stringify(account)
          );

          closeLoginModal();

          updateLoginButton();

          showLoginNotification(
            "Sesión iniciada correctamente"
          );
        });

      document
        .getElementById("rankpilotRegisterButton")
        .addEventListener("click", function () {
          alert(
            "El registro real lo conectaremos en la siguiente fase."
          );
        });
    }

    function closeLoginModal() {
      const modal = document.getElementById(
        "rankpilotLoginModal"
      );

      if (!modal) {
        return;
      }

      modal.classList.remove("open");

      setTimeout(function () {
        modal.style.display = "none";
      }, 200);
    }

    /* -----------------------------------------------------
       8. DASHBOARD
       ----------------------------------------------------- */

    const dashboardButton =
      document.getElementById(
        "rankpilotUserMenuDashboard"
      );

    if (dashboardButton) {
      dashboardButton.addEventListener(
        "click",
        function () {
          closeUserMenu();

          if (
            typeof rankPilotOpenDashboard ===
            "function"
          ) {
            rankPilotOpenDashboard();
          }
        }
      );
    }

    /* -----------------------------------------------------
       9. PROYECTOS
       ----------------------------------------------------- */

    const projectsButton =
      document.getElementById(
        "rankpilotUserMenuProjects"
      );

    if (projectsButton) {
      projectsButton.addEventListener(
        "click",
        function () {
          closeUserMenu();

          if (
            typeof rankPilotOpenDashboard ===
            "function"
          ) {
            rankPilotOpenDashboard();
          }
        }
      );
    }

    /* -----------------------------------------------------
       10. HISTORIAL
       ----------------------------------------------------- */

    const historyButton =
      document.getElementById(
        "rankpilotUserMenuHistory"
      );

    if (historyButton) {
      historyButton.addEventListener(
        "click",
        function () {
          closeUserMenu();

          if (
            typeof rankPilotOpenDashboard ===
            "function"
          ) {
            rankPilotOpenDashboard();
          }
        }
      );
    }

    /* -----------------------------------------------------
       11. MI CUENTA
       ----------------------------------------------------- */

    const accountButton =
      document.getElementById(
        "rankpilotUserMenuAccount"
      );

    if (accountButton) {
      accountButton.addEventListener(
        "click",
        function () {
          closeUserMenu();

          const modal =
            document.getElementById(
              "rankpilotAccountModal"
            );

          if (modal) {
            modal.style.display = "flex";
            modal.classList.add("open");
          }
        }
      );
    }

    /* -----------------------------------------------------
       12. CERRAR SESIÓN
       ----------------------------------------------------- */

    const logoutButton =
      document.getElementById(
        "rankpilotUserMenuLogout"
      );

    if (logoutButton) {
      logoutButton.addEventListener(
        "click",
        function () {
          closeUserMenu();

          try {
            const account = getCurrentAccount();

            if (account) {
              account.loggedIn = false;

              localStorage.setItem(
                "rankpilot_account_v1",
                JSON.stringify(account)
              );
            }
          } catch (error) {
            console.error(
              "Error cerrando sesión:",
              error
            );
          }

          updateLoginButton();

          showLoginNotification(
            "Sesión cerrada"
          );
        }
      );
    }

    /* -----------------------------------------------------
       13. NOTIFICACIÓN
       ----------------------------------------------------- */

    function showLoginNotification(message) {
      const existing =
        document.getElementById(
          "rankpilotLoginNotification"
        );

      if (existing) {
        existing.remove();
      }

      const notification =
        document.createElement("div");

      notification.id =
        "rankpilotLoginNotification";

      notification.textContent = message;

      document.body.appendChild(notification);

      setTimeout(function () {
        notification.classList.add("show");
      }, 10);

      setTimeout(function () {
        notification.classList.remove("show");

        setTimeout(function () {
          notification.remove();
        }, 250);
      }, 2500);
    }

    /* -----------------------------------------------------
       14. CSS
       ----------------------------------------------------- */

    if (
      !document.getElementById(
        "rankpilotLoginStyles"
      )
    ) {
      const style =
        document.createElement("style");

      style.id = "rankpilotLoginStyles";

      style.textContent = `

        /* =========================================
           LOGIN BUTTON
           ========================================= */

        #rankpilotLoginButton {
          position: fixed;
          top: 22px;
          right: 28px;
          z-index: 9998;

          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(15, 23, 42, 0.92);
          color: #ffffff;

          padding: 10px 17px;
          border-radius: 10px;

          font-size: 14px;
          font-weight: 600;

          cursor: pointer;

          backdrop-filter: blur(12px);

          transition:
            transform 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease;
        }

        #rankpilotLoginButton:hover {
          transform: translateY(-1px);
          background: rgba(30, 41, 59, 0.98);
          border-color: rgba(255,255,255,0.22);
        }

        #rankpilotLoginButton.logged-in {
          padding-right: 13px;
        }

        .rankpilot-login-arrow {
          margin-left: 7px;
          font-size: 11px;
          opacity: 0.75;
        }

        /* =========================================
           USER DROPDOWN
           ========================================= */

        #rankpilotUserMenu {
          position: fixed;
          top: 66px;
          right: 28px;

          width: 205px;

          background: rgba(15, 23, 42, 0.98);
          border: 1px solid rgba(255,255,255,0.10);

          border-radius: 14px;

          padding: 7px;

          box-shadow:
            0 20px 50px rgba(0,0,0,0.30);

          backdrop-filter: blur(18px);

          z-index: 9997;

          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px);

          transition:
            opacity 0.18s ease,
            transform 0.18s ease,
            visibility 0.18s ease;
        }

        #rankpilotUserMenu.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        #rankpilotUserMenu button {
          width: 100%;

          border: none;
          background: transparent;

          color: #e5e7eb;

          text-align: left;

          padding: 10px 11px;

          border-radius: 9px;

          font-size: 13px;

          cursor: pointer;

          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        #rankpilotUserMenu button:hover {
          background: rgba(255,255,255,0.07);
          color: #ffffff;
        }

        .rankpilot-menu-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 6px 4px;
        }

        /* =========================================
           LOGIN MODAL
           ========================================= */

        #rankpilotLoginModal {
          position: fixed;
          inset: 0;

          z-index: 10000;

          display: none;

          align-items: center;
          justify-content: center;
        }

        #rankpilotLoginModal.open {
          display: flex !important;
        }

        .rankpilot-login-overlay {
          position: absolute;
          inset: 0;

          background: rgba(2, 6, 23, 0.72);

          backdrop-filter: blur(7px);
        }

        .rankpilot-login-card {
          position: relative;

          width: min(420px, calc(100% - 32px));

          background: #ffffff;

          border-radius: 20px;

          padding: 36px;

          box-shadow:
            0 30px 80px rgba(0,0,0,0.35);

          z-index: 2;

          animation:
            rankpilotLoginAppear
            0.22s ease;
        }

        @keyframes rankpilotLoginAppear {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .rankpilot-login-close {
          position: absolute;

          top: 14px;
          right: 16px;

          border: none;
          background: transparent;

          font-size: 25px;
          line-height: 1;

          color: #64748b;

          cursor: pointer;
        }

        .rankpilot-login-logo {
          font-size: 21px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #111827;
          margin-bottom: 24px;
        }

        .rankpilot-login-logo span {
          font-weight: 400;
        }

        .rankpilot-login-card h2 {
          margin: 0 0 7px;
          font-size: 28px;
          color: #111827;
        }

        .rankpilot-login-subtitle {
          margin: 0 0 25px;
          color: #64748b;
          font-size: 14px;
        }

        .rankpilot-login-card label {
          display: block;

          margin-bottom: 17px;

          font-size: 13px;
          font-weight: 600;

          color: #334155;
        }

        .rankpilot-login-card input {
          display: block;

          width: 100%;

          box-sizing: border-box;

          margin-top: 7px;

          padding: 12px 13px;

          border: 1px solid #dbe2ea;
          border-radius: 9px;

          font-size: 14px;

          outline: none;

          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .rankpilot-login-card input:focus {
          border-color: #64748b;

          box-shadow:
            0 0 0 3px rgba(100,116,139,0.12);
        }

        .rankpilot-login-submit {
          width: 100%;

          border: none;

          background: #111827;
          color: #ffffff;

          padding: 13px;

          border-radius: 10px;

          font-size: 14px;
          font-weight: 700;

          cursor: pointer;

          margin-top: 4px;

          transition:
            transform 0.15s ease,
            background 0.15s ease;
        }

        .rankpilot-login-submit:hover {
          background: #1f2937;
          transform: translateY(-1px);
        }

        .rankpilot-login-register {
          text-align: center;

          margin: 20px 0 0;

          color: #64748b;

          font-size: 13px;
        }

        .rankpilot-login-register button {
          border: none;
          background: none;

          color: #111827;

          font-weight: 700;

          cursor: pointer;

          padding: 0;
        }

        /* =========================================
           NOTIFICATION
           ========================================= */

        #rankpilotLoginNotification {
          position: fixed;

          bottom: 25px;
          left: 50%;

          transform:
            translate(-50%, 15px);

          opacity: 0;

          z-index: 11000;

          background: #111827;
          color: #ffffff;

          padding: 11px 17px;

          border-radius: 10px;

          font-size: 13px;
          font-weight: 600;

          box-shadow:
            0 12px 35px rgba(0,0,0,0.25);

          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
        }

        #rankpilotLoginNotification.show {
          opacity: 1;

          transform:
            translate(-50%, 0);
        }

        /* =========================================
           MOBILE
           ========================================= */

        @media (max-width: 700px) {

          #rankpilotLoginButton {
            top: 14px;
            right: 14px;

            padding: 9px 13px;

            font-size: 13px;
          }

          #rankpilotUserMenu {
            top: 57px;
            right: 14px;

            width: 195px;
          }

          .rankpilot-login-card {
            padding: 30px 24px;
          }

        }

      `;

      document.head.appendChild(style);
    }

    /* -----------------------------------------------------
       15. ACTUALIZAR ESTADO INICIAL
       ----------------------------------------------------- */

    updateLoginButton();

    /* -----------------------------------------------------
       16. ACTUALIZAR SI CAMBIA LA CUENTA
       ----------------------------------------------------- */

    window.addEventListener(
      "storage",
      function () {
        updateLoginButton();
      }
    );
  }

  /* -------------------------------------------------------
     INICIALIZACIÓN
     ------------------------------------------------------- */

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initRankPilotLoginUI
    );
  } else {
    initRankPilotLoginUI();
  }

})();

/* =========================================================
   RANKPILOT — HEADER ACCOUNT
   Usa el botón existente #loginBtn
   ========================================================= */

(function initRankPilotHeaderAccount() {

    function start() {

        const loginBtn = document.getElementById("loginBtn");

        if (!loginBtn) {
            console.warn("RankPilot: no se encontró #loginBtn");
            return;
        }

        /* -------------------------------------------------
           Evitar duplicados
        ------------------------------------------------- */

        if (document.getElementById("rankpilotAccountMenu")) {
            return;
        }

        /* -------------------------------------------------
           Estado de cuenta
        ------------------------------------------------- */

        function getAccount() {

            try {

                const saved = localStorage.getItem(
                    "rankpilot_account_v1"
                );

                if (!saved) {
                    return null;
                }

                return JSON.parse(saved);

            } catch (error) {

                console.warn(
                    "RankPilot: no se pudo leer la cuenta",
                    error
                );

                return null;
            }
        }


        function saveAccount(account) {

            localStorage.setItem(
                "rankpilot_account_v1",
                JSON.stringify(account)
            );

        }


        /* -------------------------------------------------
           Estilos
        ------------------------------------------------- */

        if (!document.getElementById("rankpilotHeaderAccountStyles")) {

            const style = document.createElement("style");

            style.id = "rankpilotHeaderAccountStyles";

            style.textContent = `

                .rankpilot-account-wrapper {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                }

                #loginBtn.rankpilot-logged-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                }

                .rankpilot-account-chevron {
                    font-size: 11px;
                    opacity: .75;
                    transition: transform .2s ease;
                }

                #loginBtn.rankpilot-logged-button.open
                .rankpilot-account-chevron {
                    transform: rotate(180deg);
                }

                #rankpilotAccountMenu {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    width: 220px;
                    background: rgba(15, 23, 42, .98);
                    border: 1px solid rgba(255,255,255,.10);
                    border-radius: 14px;
                    padding: 8px;
                    box-shadow:
                        0 20px 50px rgba(0,0,0,.30);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                    z-index: 9999;
                    display: none;
                }

                #rankpilotAccountMenu.open {
                    display: block;
                    animation: rankpilotAccountMenuIn .16s ease-out;
                }

                @keyframes rankpilotAccountMenuIn {

                    from {
                        opacity: 0;
                        transform: translateY(-5px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }

                }

                .rankpilot-account-header {
                    padding: 10px 11px 12px;
                    border-bottom: 1px solid rgba(255,255,255,.08);
                    margin-bottom: 5px;
                }

                .rankpilot-account-name {
                    color: #fff;
                    font-weight: 600;
                    font-size: 14px;
                }

                .rankpilot-account-plan {
                    color: rgba(255,255,255,.55);
                    font-size: 12px;
                    margin-top: 3px;
                }

                .rankpilot-account-menu-item {

                    width: 100%;
                    border: 0;
                    background: transparent;
                    color: rgba(255,255,255,.82);
                    padding: 10px 11px;
                    border-radius: 9px;
                    text-align: left;
                    font: inherit;
                    font-size: 13px;
                    cursor: pointer;
                    transition:
                        background .15s ease,
                        color .15s ease;

                }

                .rankpilot-account-menu-item:hover {
                    background: rgba(255,255,255,.07);
                    color: #fff;
                }

                .rankpilot-account-menu-divider {
                    height: 1px;
                    background: rgba(255,255,255,.08);
                    margin: 6px 4px;
                }

                .rankpilot-account-logout {
                    color: #ff8b8b;
                }

                .rankpilot-account-logout:hover {
                    background: rgba(255,80,80,.08);
                    color: #ffaaaa;
                }

                /* LOGIN MODAL */

                #rankpilotLoginModal {

                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,.65);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    z-index: 10000;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);

                }

                #rankpilotLoginModal.open {
                    display: flex;
                }

                .rankpilot-login-box {

                    width: min(420px, 100%);
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,.10);
                    border-radius: 20px;
                    padding: 28px;
                    box-shadow: 0 30px 80px rgba(0,0,0,.45);

                }

                .rankpilot-login-box h3 {
                    margin: 0 0 7px;
                    color: #fff;
                    font-size: 23px;
                }

                .rankpilot-login-box > p {
                    margin: 0 0 22px;
                    color: rgba(255,255,255,.58);
                    font-size: 14px;
                    line-height: 1.5;
                }

                .rankpilot-login-field {
                    margin-bottom: 14px;
                }

                .rankpilot-login-field label {
                    display: block;
                    color: rgba(255,255,255,.75);
                    font-size: 12px;
                    margin-bottom: 7px;
                }

                .rankpilot-login-field input {

                    width: 100%;
                    box-sizing: border-box;
                    padding: 12px 13px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,.12);
                    background: rgba(255,255,255,.05);
                    color: #fff;
                    outline: none;
                    font: inherit;

                }

                .rankpilot-login-field input:focus {
                    border-color: rgba(120,140,255,.7);
                }

                .rankpilot-login-actions {

                    display: flex;
                    gap: 10px;
                    margin-top: 20px;

                }

                .rankpilot-login-actions button {
                    flex: 1;
                }

                .rankpilot-login-close {

                    background: transparent;
                    border: 1px solid rgba(255,255,255,.12);
                    color: rgba(255,255,255,.75);

                }

                .rankpilot-login-demo {

                    margin-top: 15px;
                    font-size: 11px;
                    line-height: 1.5;
                    color: rgba(255,255,255,.38);
                    text-align: center;

                }

                @media (max-width: 600px) {

                    #rankpilotAccountMenu {
                        right: -5px;
                        width: 210px;
                    }

                    .rankpilot-login-box {
                        padding: 22px;
                    }

                }

            `;

            document.head.appendChild(style);

        }


        /* -------------------------------------------------
           Wrapper
        ------------------------------------------------- */

        const wrapper = document.createElement("div");

        wrapper.className = "rankpilot-account-wrapper";

        loginBtn.parentNode.insertBefore(
            wrapper,
            loginBtn
        );

        wrapper.appendChild(loginBtn);


        /* -------------------------------------------------
           Menú de cuenta
        ------------------------------------------------- */

        const accountMenu = document.createElement("div");

        accountMenu.id = "rankpilotAccountMenu";

        wrapper.appendChild(accountMenu);


        /* -------------------------------------------------
           Modal login
        ------------------------------------------------- */

        const loginModal = document.createElement("div");

        loginModal.id = "rankpilotLoginModal";

        loginModal.innerHTML = `

            <div class="rankpilot-login-box">

                <h3>Inicia sesión en RankPilot</h3>

                <p>
                    Accede a tus proyectos, historial y herramientas SEO.
                </p>

                <form id="rankpilotLoginForm">

                    <div class="rankpilot-login-field">

                        <label for="rankpilotLoginName">
                            Nombre
                        </label>

                        <input
                            type="text"
                            id="rankpilotLoginName"
                            placeholder="Tu nombre"
                            required
                        >

                    </div>

                    <div class="rankpilot-login-field">

                        <label for="rankpilotLoginEmail">
                            Email
                        </label>

                        <input
                            type="email"
                            id="rankpilotLoginEmail"
                            placeholder="tu@email.com"
                            required
                        >

                    </div>

                    <div class="rankpilot-login-field">

                        <label for="rankpilotLoginPassword">
                            Contraseña
                        </label>

                        <input
                            type="password"
                            id="rankpilotLoginPassword"
                            placeholder="••••••••"
                            required
                        >

                    </div>

                    <div class="rankpilot-login-actions">

                        <button
                            type="button"
                            class="btn rankpilot-login-close"
                            id="rankpilotLoginClose"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            class="btn btn-primary"
                        >
                            Entrar
                        </button>

                    </div>

                </form>

                <div class="rankpilot-login-demo">
                    Cuenta local de demostración.
                    La autenticación real se conectará posteriormente
                    al backend de RankPilot.
                </div>

            </div>

        `;

        document.body.appendChild(loginModal);


        /* -------------------------------------------------
           Renderizar estado
        ------------------------------------------------- */

        function renderAccountState() {

            const account = getAccount();

            if (!account || !account.loggedIn) {

                loginBtn.classList.remove(
                    "rankpilot-logged-button"
                );

                loginBtn.classList.remove("open");

                loginBtn.innerHTML = `
                    Iniciar sesión
                `;

                accountMenu.classList.remove("open");

                return;
            }


            const name =
                account.name ||
                "Mi cuenta";


            const firstName =
                name
                    .trim()
                    .split(/\s+/)[0] ||
                "Cuenta";


            const plan =
                account.plan ||
                "Starter";


            loginBtn.classList.add(
                "rankpilot-logged-button"
            );

            loginBtn.innerHTML = `

                <span>${escapeHTML(firstName)}</span>

                <span class="rankpilot-account-chevron">
                    ▾
                </span>

            `;


            accountMenu.innerHTML = `

                <div class="rankpilot-account-header">

                    <div class="rankpilot-account-name">
                        ${escapeHTML(name)}
                    </div>

                    <div class="rankpilot-account-plan">
                        Plan ${escapeHTML(plan)}
                    </div>

                </div>


                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="dashboard"
                >
                    📊 Dashboard
                </button>


                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="projects"
                >
                    📁 Mis proyectos
                </button>


                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="history"
                >
                    📈 Historial
                </button>


                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="account"
                >
                    ⚙️ Mi cuenta
                </button>


                <div class="rankpilot-account-menu-divider"></div>


                <button
                    type="button"
                    class="rankpilot-account-menu-item rankpilot-account-logout"
                    data-account-action="logout"
                >
                    Cerrar sesión
                </button>

            `;

        }


        /* -------------------------------------------------
           Escape HTML
        ------------------------------------------------- */

        function escapeHTML(value) {

            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        }


        /* -------------------------------------------------
           Abrir / cerrar login
        ------------------------------------------------- */

        function openLogin() {

            loginModal.classList.add("open");

            const nameInput =
                document.getElementById(
                    "rankpilotLoginName"
                );

            if (nameInput) {
                setTimeout(() => nameInput.focus(), 50);
            }

        }


        function closeLogin() {

            loginModal.classList.remove("open");

        }


        /* -------------------------------------------------
           Click botón principal
        ------------------------------------------------- */

        loginBtn.addEventListener("click", function(event) {

            event.preventDefault();
            event.stopPropagation();

            const account = getAccount();

            if (!account || !account.loggedIn) {

                openLogin();
                return;

            }

            const isOpen =
                accountMenu.classList.toggle("open");

            loginBtn.classList.toggle(
                "open",
                isOpen
            );

        });


        /* -------------------------------------------------
           Login
        ------------------------------------------------- */

        const loginForm =
            document.getElementById(
                "rankpilotLoginForm"
            );


        loginForm.addEventListener(
            "submit",
            function(event) {

                event.preventDefault();


                const name =
                    document
                        .getElementById(
                            "rankpilotLoginName"
                        )
                        .value
                        .trim();


                const email =
                    document
                        .getElementById(
                            "rankpilotLoginEmail"
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "rankpilotLoginPassword"
                        )
                        .value;


                if (!name || !email || !password) {
                    return;
                }


                const previous =
                    getAccount() || {};


                const account = {

                    ...previous,

                    loggedIn: true,

                    name,

                    email,

                    plan:
                        previous.plan ||
                        "Starter",

                    loginAt:
                        new Date().toISOString()

                };


                saveAccount(account);

                closeLogin();

                loginForm.reset();

                renderAccountState();

            }
        );


        /* -------------------------------------------------
           Cerrar modal
        ------------------------------------------------- */

        document
            .getElementById("rankpilotLoginClose")
            .addEventListener(
                "click",
                closeLogin
            );


        loginModal.addEventListener(
            "click",
            function(event) {

                if (
                    event.target === loginModal
                ) {
                    closeLogin();
                }

            }
        );


        /* -------------------------------------------------
           Acciones del menú
        ------------------------------------------------- */

        accountMenu.addEventListener(
            "click",
            function(event) {

                const button =
                    event.target.closest(
                        "[data-account-action]"
                    );

                if (!button) {
                    return;
                }


                const action =
                    button.dataset.accountAction;


                accountMenu.classList.remove("open");

                loginBtn.classList.remove("open");


                /* Dashboard */

                if (action === "dashboard") {

                    const dashboardButton =
                        document.getElementById(
                            "rankpilotDashboardButton"
                        );

                    if (dashboardButton) {

                        dashboardButton.click();

                    }

                    return;
                }


                /* Proyectos */

                if (action === "projects") {

                    const dashboardButton =
                        document.getElementById(
                            "rankpilotDashboardButton"
                        );

                    if (dashboardButton) {

                        dashboardButton.click();

                    }

                    return;
                }


                /* Historial */

                if (action === "history") {

                    const dashboardButton =
                        document.getElementById(
                            "rankpilotDashboardButton"
                        );

                    if (dashboardButton) {

                        dashboardButton.click();

                    }

                    return;
                }


                /* Mi cuenta */

                if (action === "account") {

                    const existingAccountButton =
                        document.getElementById(
                            "rankpilotAccountButton"
                        );

                    if (existingAccountButton) {

                        existingAccountButton.click();

                        return;

                    }

                    openLogin();

                    return;
                }


                /* Logout */

                if (action === "logout") {

                    const account =
                        getAccount() || {};

                    saveAccount({

                        ...account,

                        loggedIn: false

                    });

                    renderAccountState();

                }

            }
        );


        /* -------------------------------------------------
           Cerrar menú al hacer click fuera
        ------------------------------------------------- */

        document.addEventListener(
            "click",
            function(event) {

                if (
                    !wrapper.contains(event.target)
                ) {

                    accountMenu.classList.remove(
                        "open"
                    );

                    loginBtn.classList.remove(
                        "open"
                    );

                }

            }
        );


        /* -------------------------------------------------
           Eliminar botón de cuenta antiguo
           (si existe de la versión anterior)
        ------------------------------------------------- */

        const oldAccountButton =
            document.getElementById(
                "rankpilotAccountButton"
            );

        if (oldAccountButton) {

            const oldWrapper =
                oldAccountButton.closest(
                    ".rankpilot-account-button-wrapper"
                );

            if (oldWrapper) {

                oldWrapper.remove();

            } else {

                oldAccountButton.remove();

            }

        }


        /* -------------------------------------------------
           Estado inicial
        ------------------------------------------------- */

        renderAccountState();

    }


    /* -----------------------------------------------------
       Esperar a que exista el DOM
    ----------------------------------------------------- */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            start
        );

    } else {

        start();

    }

})();

/* =========================================================
   RANKPILOT — HEADER ACCOUNT
   Usa el botón existente #loginBtn
   ========================================================= */

(function initRankPilotHeaderAccount() {

    function start() {

        const loginBtn = document.getElementById("loginBtn");

        if (!loginBtn) {
            console.warn("RankPilot: no se encontró #loginBtn");
            return;
        }

        /* -------------------------------------------------
           Evitar duplicados
        ------------------------------------------------- */

        if (document.getElementById("rankpilotAccountMenu")) {
            return;
        }

        /* -------------------------------------------------
           Estado de cuenta
        ------------------------------------------------- */

        function getAccount() {

            try {

                const saved = localStorage.getItem(
                    "rankpilot_account_v1"
                );

                if (!saved) {
                    return null;
                }

                return JSON.parse(saved);

            } catch (error) {

                console.warn(
                    "RankPilot: no se pudo leer la cuenta",
                    error
                );

                return null;
            }
        }


        function saveAccount(account) {

            localStorage.setItem(
                "rankpilot_account_v1",
                JSON.stringify(account)
            );

        }


        /* -------------------------------------------------
           Estilos
        ------------------------------------------------- */

        if (!document.getElementById("rankpilotHeaderAccountStyles")) {

            const style = document.createElement("style");

            style.id = "rankpilotHeaderAccountStyles";

            style.textContent = `

                .rankpilot-account-wrapper {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                }

                #loginBtn.rankpilot-logged-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    white-space: nowrap;
                }

                .rankpilot-account-chevron {
                    font-size: 11px;
                    opacity: .75;
                    transition: transform .2s ease;
                }

                #loginBtn.rankpilot-logged-button.open
                .rankpilot-account-chevron {
                    transform: rotate(180deg);
                }

                #rankpilotAccountMenu {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    width: 220px;
                    background: rgba(15, 23, 42, .98);
                    border: 1px solid rgba(255,255,255,.10);
                    border-radius: 14px;
                    padding: 8px;
                    box-shadow:
                        0 20px 50px rgba(0,0,0,.30);
                    backdrop-filter: blur(18px);
                    -webkit-backdrop-filter: blur(18px);
                    z-index: 9999;
                    display: none;
                }

                #rankpilotAccountMenu.open {
                    display: block;
                    animation: rankpilotAccountMenuIn .16s ease-out;
                }

                @keyframes rankpilotAccountMenuIn {

                    from {
                        opacity: 0;
                        transform: translateY(-5px);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }

                }

                .rankpilot-account-header {
                    padding: 10px 11px 12px;
                    border-bottom: 1px solid rgba(255,255,255,.08);
                    margin-bottom: 5px;
                }

                .rankpilot-account-name {
                    color: #fff;
                    font-weight: 600;
                    font-size: 14px;
                }

                .rankpilot-account-plan {
                    color: rgba(255,255,255,.55);
                    font-size: 12px;
                    margin-top: 3px;
                }

                .rankpilot-account-menu-item {

                    width: 100%;
                    border: 0;
                    background: transparent;
                    color: rgba(255,255,255,.82);
                    padding: 10px 11px;
                    border-radius: 9px;
                    text-align: left;
                    font: inherit;
                    font-size: 13px;
                    cursor: pointer;
                    transition:
                        background .15s ease,
                        color .15s ease;

                }

                .rankpilot-account-menu-item:hover {
                    background: rgba(255,255,255,.07);
                    color: #fff;
                }

                .rankpilot-account-menu-divider {
                    height: 1px;
                    background: rgba(255,255,255,.08);
                    margin: 6px 4px;
                }

                .rankpilot-account-logout {
                    color: #ff8b8b;
                }

                .rankpilot-account-logout:hover {
                    background: rgba(255,80,80,.08);
                    color: #ffaaaa;
                }

                /* LOGIN MODAL */

                #rankpilotLoginModal {

                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,.65);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    z-index: 10000;
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);

                }

                #rankpilotLoginModal.open {
                    display: flex;
                }

                .rankpilot-login-box {

                    width: min(420px, 100%);
                    background: #0f172a;
                    border: 1px solid rgba(255,255,255,.10);
                    border-radius: 20px;
                    padding: 28px;
                    box-shadow: 0 30px 80px rgba(0,0,0,.45);

                }

                .rankpilot-login-box h3 {
                    margin: 0 0 7px;
                    color: #fff;
                    font-size: 23px;
                }

                .rankpilot-login-box > p {
                    margin: 0 0 22px;
                    color: rgba(255,255,255,.58);
                    font-size: 14px;
                    line-height: 1.5;
                }

                .rankpilot-login-field {
                    margin-bottom: 14px;
                }

                .rankpilot-login-field label {
                    display: block;
                    color: rgba(255,255,255,.75);
                    font-size: 12px;
                    margin-bottom: 7px;
                }

                .rankpilot-login-field input {

                    width: 100%;
                    box-sizing: border-box;
                    padding: 12px 13px;
                    border-radius: 10px;
                    border: 1px solid rgba(255,255,255,.12);
                    background: rgba(255,255,255,.05);
                    color: #fff;
                    outline: none;
                    font: inherit;

                }

                .rankpilot-login-field input:focus {
                    border-color: rgba(120,140,255,.7);
                }

                .rankpilot-login-actions {

                    display: flex;
                    gap: 10px;
                    margin-top: 20px;

                }

                .rankpilot-login-actions button {
                    flex: 1;
                }

                .rankpilot-login-close {

                    background: transparent;
                    border: 1px solid rgba(255,255,255,.12);
                    color: rgba(255,255,255,.75);

                }

                .rankpilot-login-demo {

                    margin-top: 15px;
                    font-size: 11px;
                    line-height: 1.5;
                    color: rgba(255,255,255,.38);
                    text-align: center;

                }

                @media (max-width: 600px) {

                    #rankpilotAccountMenu {
                        right: -5px;
                        width: 210px;
                    }

                    .rankpilot-login-box {
                        padding: 22px;
                    }

                }

            `;

            document.head.appendChild(style);

        }


        /* -------------------------------------------------
           Wrapper
        ------------------------------------------------- */

        const wrapper = document.createElement("div");

        wrapper.className = "rankpilot-account-wrapper";

        loginBtn.parentNode.insertBefore(
            wrapper,
            loginBtn
        );

        wrapper.appendChild(loginBtn);


        /* -------------------------------------------------
           Menú de cuenta
        ------------------------------------------------- */

        const accountMenu = document.createElement("div");

        accountMenu.id = "rankpilotAccountMenu";

        wrapper.appendChild(accountMenu);


        /* -------------------------------------------------
           Modal login
        ------------------------------------------------- */

        const loginModal = document.createElement("div");

        loginModal.id = "rankpilotLoginModal";

        loginModal.innerHTML = `

            <div class="rankpilot-login-box">

                <h3>Inicia sesión en RankPilot</h3>

                <p>
                    Accede a tus proyectos, historial y herramientas SEO.
                </p>

                <form id="rankpilotLoginForm">

                    <div class="rankpilot-login-field">

                        <label for="rankpilotLoginName">
                            Nombre
                        </label>

                        <input
                            type="text"
                            id="rankpilotLoginName"
                            placeholder="Tu nombre"
                            required
                        >

                    </div>

                    <div class="rankpilot-login-field">

                        <label for="rankpilotLoginEmail">
                            Email
                        </label>

                        <input
                            type="email"
                            id="rankpilotLoginEmail"
                            placeholder="tu@email.com"
                            required
                        >

                    </div>

                    <div class="rankpilot-login-field">

                        <label for="rankpilotLoginPassword">
                            Contraseña
                        </label>

                        <input
                            type="password"
                            id="rankpilotLoginPassword"
                            placeholder="••••••••"
                            required
                        >

                    </div>

                    <div class="rankpilot-login-actions">

                        <button
                            type="button"
                            class="btn rankpilot-login-close"
                            id="rankpilotLoginClose"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            class="btn btn-primary"
                        >
                            Entrar
                        </button>

                    </div>

                </form>

                <div class="rankpilot-login-demo">
                    Cuenta local de demostración.
                    La autenticación real se conectará posteriormente
                    al backend de RankPilot.
                </div>

            </div>

        `;

        document.body.appendChild(loginModal);


        /* -------------------------------------------------
           Renderizar estado
        ------------------------------------------------- */

        function renderAccountState() {

            const account = getAccount();

            if (!account || !account.loggedIn) {

                loginBtn.classList.remove(
                    "rankpilot-logged-button"
                );

                loginBtn.classList.remove("open");

                loginBtn.innerHTML = `
                    Iniciar sesión
                `;

                accountMenu.classList.remove("open");

                return;
            }


            const name =
                account.name ||
                "Mi cuenta";


            const firstName =
                name
                    .trim()
                    .split(/\s+/)[0] ||
                "Cuenta";


            const plan =
                account.plan ||
                "Starter";


            loginBtn.classList.add(
                "rankpilot-logged-button"
            );

            loginBtn.innerHTML = `

                <span>${escapeHTML(firstName)}</span>

                <span class="rankpilot-account-chevron">
                    ▾
                </span>

            `;


            accountMenu.innerHTML = `

                <div class="rankpilot-account-header">

                    <div class="rankpilot-account-name">
                        ${escapeHTML(name)}
                    </div>

                    <div class="rankpilot-account-plan">
                        Plan ${escapeHTML(plan)}
                    </div>

                </div>


                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="dashboard"
                >
                    📊 Dashboard
                </button>


                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="projects"
                >
                    📁 Mis proyectos
                </button>


                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="history"
                >
                    📈 Historial
                </button>


                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="account"
                >
                    ⚙️ Mi cuenta
                </button>


                <div class="rankpilot-account-menu-divider"></div>


                <button
                    type="button"
                    class="rankpilot-account-menu-item rankpilot-account-logout"
                    data-account-action="logout"
                >
                    Cerrar sesión
                </button>

            `;

        }


        /* -------------------------------------------------
           Escape HTML
        ------------------------------------------------- */

        function escapeHTML(value) {

            return String(value)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        }


        /* -------------------------------------------------
           Abrir / cerrar login
        ------------------------------------------------- */

        function openLogin() {

            loginModal.classList.add("open");

            const nameInput =
                document.getElementById(
                    "rankpilotLoginName"
                );

            if (nameInput) {
                setTimeout(() => nameInput.focus(), 50);
            }

        }


        function closeLogin() {

            loginModal.classList.remove("open");

        }


        /* -------------------------------------------------
           Click botón principal
        ------------------------------------------------- */

        loginBtn.addEventListener("click", function(event) {

            event.preventDefault();
            event.stopPropagation();

            const account = getAccount();

            if (!account || !account.loggedIn) {

                openLogin();
                return;

            }

            const isOpen =
                accountMenu.classList.toggle("open");

            loginBtn.classList.toggle(
                "open",
                isOpen
            );

        });


        /* -------------------------------------------------
           Login
        ------------------------------------------------- */

        const loginForm =
            document.getElementById(
                "rankpilotLoginForm"
            );


        loginForm.addEventListener(
            "submit",
            function(event) {

                event.preventDefault();


                const name =
                    document
                        .getElementById(
                            "rankpilotLoginName"
                        )
                        .value
                        .trim();


                const email =
                    document
                        .getElementById(
                            "rankpilotLoginEmail"
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            "rankpilotLoginPassword"
                        )
                        .value;


                if (!name || !email || !password) {
                    return;
                }


                const previous =
                    getAccount() || {};


                const account = {

                    ...previous,

                    loggedIn: true,

                    name,

                    email,

                    plan:
                        previous.plan ||
                        "Starter",

                    loginAt:
                        new Date().toISOString()

                };


                saveAccount(account);

                closeLogin();

                loginForm.reset();

                renderAccountState();

            }
        );


        /* -------------------------------------------------
           Cerrar modal
        ------------------------------------------------- */

        document
            .getElementById("rankpilotLoginClose")
            .addEventListener(
                "click",
                closeLogin
            );


        loginModal.addEventListener(
            "click",
            function(event) {

                if (
                    event.target === loginModal
                ) {
                    closeLogin();
                }

            }
        );


        /* -------------------------------------------------
           Acciones del menú
        ------------------------------------------------- */

        accountMenu.addEventListener(
            "click",
            function(event) {

                const button =
                    event.target.closest(
                        "[data-account-action]"
                    );

                if (!button) {
                    return;
                }


                const action =
                    button.dataset.accountAction;


                accountMenu.classList.remove("open");

                loginBtn.classList.remove("open");


                /* Dashboard */

                if (action === "dashboard") {

                    const dashboardButton =
                        document.getElementById(
                            "rankpilotDashboardButton"
                        );

                    if (dashboardButton) {

                        dashboardButton.click();

                    }

                    return;
                }


                /* Proyectos */

                if (action === "projects") {

                    const dashboardButton =
                        document.getElementById(
                            "rankpilotDashboardButton"
                        );

                    if (dashboardButton) {

                        dashboardButton.click();

                    }

                    return;
                }


                /* Historial */

                if (action === "history") {

                    const dashboardButton =
                        document.getElementById(
                            "rankpilotDashboardButton"
                        );

                    if (dashboardButton) {

                        dashboardButton.click();

                    }

                    return;
                }


                /* Mi cuenta */

                if (action === "account") {

                    const existingAccountButton =
                        document.getElementById(
                            "rankpilotAccountButton"
                        );

                    if (existingAccountButton) {

                        existingAccountButton.click();

                        return;

                    }

                    openLogin();

                    return;
                }


                /* Logout */

                if (action === "logout") {

                    const account =
                        getAccount() || {};

                    saveAccount({

                        ...account,

                        loggedIn: false

                    });

                    renderAccountState();

                }

            }
        );


        /* -------------------------------------------------
           Cerrar menú al hacer click fuera
        ------------------------------------------------- */

        document.addEventListener(
            "click",
            function(event) {

                if (
                    !wrapper.contains(event.target)
                ) {

                    accountMenu.classList.remove(
                        "open"
                    );

                    loginBtn.classList.remove(
                        "open"
                    );

                }

            }
        );


        /* -------------------------------------------------
           Eliminar botón de cuenta antiguo
           (si existe de la versión anterior)
        ------------------------------------------------- */

        const oldAccountButton =
            document.getElementById(
                "rankpilotAccountButton"
            );

        if (oldAccountButton) {

            const oldWrapper =
                oldAccountButton.closest(
                    ".rankpilot-account-button-wrapper"
                );

            if (oldWrapper) {

                oldWrapper.remove();

            } else {

                oldAccountButton.remove();

            }

        }


        /* -------------------------------------------------
           Estado inicial
        ------------------------------------------------- */

        renderAccountState();

    }


    /* -----------------------------------------------------
       Esperar a que exista el DOM
    ----------------------------------------------------- */

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            start
        );

    } else {

        start();

    }

})();
