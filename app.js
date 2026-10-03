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

const RANKPILOT_STORAGE_KEY = "rankpilot_projects_v1";

let rankPilotCurrentProjectId = null;


/* =========================================================
   STORAGE
   ========================================================= */

function rankPilotGetProjects() {
  try {
    const saved = localStorage.getItem(RANKPILOT_STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const projects = JSON.parse(saved);

    return Array.isArray(projects) ? projects : [];
  } catch (error) {
    console.error("RankPilot storage error:", error);
    return [];
  }
}


function rankPilotSaveProjects(projects) {
  try {
    localStorage.setItem(
      RANKPILOT_STORAGE_KEY,
      JSON.stringify(projects)
    );
  } catch (error) {
    console.error("No se pudieron guardar los proyectos:", error);
  }
}


/* =========================================================
   HELPERS
   ========================================================= */

function rankPilotCreateId(prefix = "rp") {
  return (
    prefix +
    "_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).substring(2, 8)
  );
}


function rankPilotFormatDate(date) {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(date));
  } catch {
    return date;
  }
}


function rankPilotHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}


function rankPilotEscape(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   PROJECTS
   ========================================================= */

function rankPilotCreateProject(name, url) {
  const projects = rankPilotGetProjects();

  const normalizedUrl =
    typeof normalizeUrl === "function"
      ? normalizeUrl(url)
      : url;

  const project = {
    id: rankPilotCreateId("project"),
    name: name || rankPilotHostname(normalizedUrl),
    url: normalizedUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    analyses: []
  };

  projects.unshift(project);

  rankPilotSaveProjects(projects);

  rankPilotCurrentProjectId = project.id;

  return project;
}


function rankPilotGetCurrentProject() {
  const projects = rankPilotGetProjects();

  if (!rankPilotCurrentProjectId) {
    return null;
  }

  return (
    projects.find(
      project => project.id === rankPilotCurrentProjectId
    ) || null
  );
}


function rankPilotFindOrCreateProject(url) {
  const projects = rankPilotGetProjects();

  const normalizedUrl =
    typeof normalizeUrl === "function"
      ? normalizeUrl(url)
      : url;

  const hostname = rankPilotHostname(normalizedUrl);

  let project = projects.find(project => {
    return rankPilotHostname(project.url) === hostname;
  });

  if (!project) {
    project = rankPilotCreateProject(
      hostname,
      normalizedUrl
    );
  } else {
    rankPilotCurrentProjectId = project.id;
  }

  return project;
}


/* =========================================================
   SAVE ANALYSIS
   ========================================================= */

function rankPilotSaveAnalysis(data) {
  try {
    if (!data || !data.finalUrl || !data.seo) {
      return;
    }

    const project = rankPilotFindOrCreateProject(
      data.finalUrl
    );

    const projects = rankPilotGetProjects();

    const projectIndex = projects.findIndex(
      item => item.id === project.id
    );

    if (projectIndex === -1) {
      return;
    }

    const analysis = {
      id: rankPilotCreateId("analysis"),
      date: new Date().toISOString(),
      url: data.finalUrl,
      score: Number(data.seo.score || 0),
      data: data
    };

    projects[projectIndex].analyses =
      projects[projectIndex].analyses || [];

    projects[projectIndex].analyses.unshift(
      analysis
    );

    /*
      Limitamos el historial para no llenar
      el almacenamiento del navegador.
    */
    projects[projectIndex].analyses =
      projects[projectIndex].analyses.slice(0, 20);

    projects[projectIndex].updatedAt =
      new Date().toISOString();

    rankPilotCurrentProjectId = project.id;

    rankPilotSaveProjects(projects);

    rankPilotUpdateDashboardButton();

    console.log(
      "RankPilot: análisis guardado en",
      projects[projectIndex].name
    );
  } catch (error) {
    console.error(
      "RankPilot: error guardando análisis",
      error
    );
  }
}


/* =========================================================
   DELETE PROJECT
   ========================================================= */

function rankPilotDeleteProject(projectId) {
  const projects = rankPilotGetProjects();

  const project = projects.find(
    item => item.id === projectId
  );

  if (!project) {
    return;
  }

  const confirmed = window.confirm(
    `¿Quieres eliminar el proyecto "${project.name}" y todo su historial?`
  );

  if (!confirmed) {
    return;
  }

  const filtered = projects.filter(
    item => item.id !== projectId
  );

  rankPilotSaveProjects(filtered);

  if (rankPilotCurrentProjectId === projectId) {
    rankPilotCurrentProjectId = null;
  }

  rankPilotRenderDashboard();
}


/* =========================================================
   DASHBOARD BUTTON
   ========================================================= */

function rankPilotCreateDashboardButton() {
  if (document.getElementById("rankpilotDashboardButton")) {
    return;
  }

  const button = document.createElement("button");

  button.id = "rankpilotDashboardButton";
  button.type = "button";
  button.innerHTML = "📊 Dashboard";

  button.addEventListener("click", () => {
    rankPilotOpenDashboard();
  });

  document.body.appendChild(button);
}


function rankPilotUpdateDashboardButton() {
  const button = document.getElementById(
    "rankpilotDashboardButton"
  );

  if (!button) {
    return;
  }

  const projects = rankPilotGetProjects();

  const totalAnalyses = projects.reduce(
    (total, project) =>
      total + (project.analyses?.length || 0),
    0
  );

  button.innerHTML =
    totalAnalyses > 0
      ? `📊 Dashboard <span>${totalAnalyses}</span>`
      : "📊 Dashboard";
}


/* =========================================================
   DASHBOARD MODAL
   ========================================================= */

function rankPilotOpenDashboard() {
  let modal = document.getElementById(
    "rankpilotDashboardModal"
  );

  if (!modal) {
    rankPilotCreateDashboardModal();

    modal = document.getElementById(
      "rankpilotDashboardModal"
    );
  }

  rankPilotRenderDashboard();

  modal.classList.add("active");

  document.body.classList.add(
    "rankpilot-dashboard-open"
  );
}


function rankPilotCloseDashboard() {
  const modal = document.getElementById(
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


function rankPilotCreateDashboardModal() {
  const modal = document.createElement("div");

  modal.id = "rankpilotDashboardModal";

  modal.innerHTML = `
    <div class="rankpilot-dashboard-overlay"></div>

    <div class="rankpilot-dashboard-panel">

      <div class="rankpilot-dashboard-header">

        <div>
          <span class="rankpilot-dashboard-eyebrow">
            RANKPILOT
          </span>

          <h2>Dashboard</h2>

          <p>
            Gestiona tus proyectos y consulta tu historial SEO.
          </p>
        </div>

        <button
          type="button"
          class="rankpilot-dashboard-close"
          id="rankpilotDashboardClose"
        >
          ×
        </button>

      </div>

      <div
        id="rankpilotDashboardContent"
        class="rankpilot-dashboard-content"
      ></div>

    </div>
  `;

  document.body.appendChild(modal);

  modal
    .querySelector(".rankpilot-dashboard-overlay")
    .addEventListener(
      "click",
      rankPilotCloseDashboard
    );

  document
    .getElementById("rankpilotDashboardClose")
    .addEventListener(
      "click",
      rankPilotCloseDashboard
    );
}


/* =========================================================
   RENDER DASHBOARD
   ========================================================= */

function rankPilotRenderDashboard() {
  const container = document.getElementById(
    "rankpilotDashboardContent"
  );

  if (!container) {
    return;
  }

  const projects = rankPilotGetProjects();

  const totalAnalyses = projects.reduce(
    (total, project) =>
      total + (project.analyses?.length || 0),
    0
  );

  const lastScores = projects
    .flatMap(project => project.analyses || [])
    .map(analysis => Number(analysis.score || 0));

  const averageScore =
    lastScores.length > 0
      ? Math.round(
          lastScores.reduce(
            (sum, score) => sum + score,
            0
          ) / lastScores.length
        )
      : 0;

  container.innerHTML = `

    <div class="rankpilot-dashboard-stats">

      <div class="rankpilot-stat-card">
        <span>PROYECTOS</span>
        <strong>${projects.length}</strong>
      </div>

      <div class="rankpilot-stat-card">
        <span>ANÁLISIS</span>
        <strong>${totalAnalyses}</strong>
      </div>

      <div class="rankpilot-stat-card">
        <span>SCORE MEDIO</span>
        <strong>${averageScore || "—"}</strong>
      </div>

    </div>


    <div class="rankpilot-dashboard-toolbar">

      <div>
        <span>WORKSPACE</span>
        <h3>Mis proyectos</h3>
      </div>

      <button
        type="button"
        class="rankpilot-new-project-button"
        onclick="rankPilotShowNewProjectForm()"
      >
        + Nuevo proyecto
      </button>

    </div>


    <div
      id="rankpilotNewProjectForm"
      class="rankpilot-new-project-form"
      style="display:none;"
    >

      <div class="rankpilot-form-grid">

        <div>
          <label>Nombre del proyecto</label>

          <input
            id="rankpilotProjectName"
            type="text"
            placeholder="Ej. Mi empresa"
          />
        </div>

        <div>
          <label>URL de la web</label>

          <input
            id="rankpilotProjectUrl"
            type="url"
            placeholder="https://ejemplo.com"
          />
        </div>

      </div>

      <div class="rankpilot-form-actions">

        <button
          type="button"
          class="rankpilot-secondary-button"
          onclick="rankPilotHideNewProjectForm()"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="rankpilot-primary-button"
          onclick="rankPilotCreateProjectFromForm()"
        >
          Crear proyecto
        </button>

      </div>

    </div>


    <div class="rankpilot-projects-list">

      ${
        projects.length
          ? projects
              .map(project =>
                rankPilotProjectCard(project)
              )
              .join("")
          : `
            <div class="rankpilot-empty-projects">

              <div class="rankpilot-empty-icon">
                📁
              </div>

              <h3>Aún no tienes proyectos</h3>

              <p>
                Analiza una web o crea tu primer proyecto
                para comenzar a guardar tu historial SEO.
              </p>

              <button
                type="button"
                class="rankpilot-primary-button"
                onclick="rankPilotShowNewProjectForm()"
              >
                Crear mi primer proyecto
              </button>

            </div>
          `
      }

    </div>
  `;
}


/* =========================================================
   PROJECT CARD
   ========================================================= */

function rankPilotProjectCard(project) {
  const analyses = project.analyses || [];

  const latest =
    analyses.length > 0
      ? analyses[0]
      : null;

  const score = latest
    ? Number(latest.score || 0)
    : null;

  const scoreClass =
    score === null
      ? ""
      : score >= 80
      ? "good"
      : score >= 60
      ? "warning"
      : "bad";

  return `

    <div class="rankpilot-project-card">

      <div class="rankpilot-project-main">

        <div class="rankpilot-project-icon">
          🌐
        </div>

        <div class="rankpilot-project-info">

          <h3>
            ${rankPilotEscape(project.name)}
          </h3>

          <p>
            ${rankPilotEscape(project.url)}
          </p>

          <small>
            ${
              analyses.length
            } análisis · Actualizado ${
              rankPilotFormatDate(project.updatedAt)
            }
          </small>

        </div>

      </div>


      <div class="rankpilot-project-score">

        ${
          latest
            ? `
              <span class="rankpilot-score ${scoreClass}">
                ${score}
              </span>

              <small>SEO SCORE</small>
            `
            : `
              <span class="rankpilot-no-score">
                —
              </span>

              <small>SIN ANÁLISIS</small>
            `
        }

      </div>


      <div class="rankpilot-project-actions">

        <button
          type="button"
          onclick="rankPilotOpenProject('${project.id}')"
        >
          Ver proyecto
        </button>

        <button
          type="button"
          onclick="rankPilotAnalyzeProject('${project.id}')"
        >
          Analizar
        </button>

        <button
          type="button"
          class="danger"
          onclick="rankPilotDeleteProject('${project.id}')"
        >
          Eliminar
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   NEW PROJECT
   ========================================================= */

function rankPilotShowNewProjectForm() {
  const formElement = document.getElementById(
    "rankpilotNewProjectForm"
  );

  if (!formElement) {
    return;
  }

  formElement.style.display = "block";

  const nameInput = document.getElementById(
    "rankpilotProjectName"
  );

  if (nameInput) {
    nameInput.focus();
  }
}


function rankPilotHideNewProjectForm() {
  const formElement = document.getElementById(
    "rankpilotNewProjectForm"
  );

  if (formElement) {
    formElement.style.display = "none";
  }
}


function rankPilotCreateProjectFromForm() {
  const nameInput = document.getElementById(
    "rankpilotProjectName"
  );

  const urlInput = document.getElementById(
    "rankpilotProjectUrl"
  );

  if (!urlInput || !urlInput.value.trim()) {
    alert("Introduce la URL de la web.");
    return;
  }

  let url = urlInput.value.trim();

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  try {
    new URL(url);
  } catch {
    alert("Introduce una URL válida.");
    return;
  }

  const name =
    nameInput?.value.trim() ||
    rankPilotHostname(url);

  const project = rankPilotCreateProject(
    name,
    url
  );

  rankPilotHideNewProjectForm();

  rankPilotRenderDashboard();

  console.log(
    "Proyecto creado:",
    project
  );
}


/* =========================================================
   OPEN PROJECT
   ========================================================= */

function rankPilotOpenProject(projectId) {
  rankPilotCurrentProjectId = projectId;

  const projects = rankPilotGetProjects();

  const project = projects.find(
    item => item.id === projectId
  );

  if (!project) {
    return;
  }

  const container = document.getElementById(
    "rankpilotDashboardContent"
  );

  if (!container) {
    return;
  }

  const analyses = project.analyses || [];

  const latest =
    analyses.length > 0
      ? analyses[0]
      : null;

  container.innerHTML = `

    <div class="rankpilot-project-detail">

      <button
        type="button"
        class="rankpilot-back-button"
        onclick="rankPilotRenderDashboard()"
      >
        ← Volver a proyectos
      </button>


      <div class="rankpilot-project-detail-header">

        <div>

          <span>PROYECTO</span>

          <h2>
            ${rankPilotEscape(project.name)}
          </h2>

          <p>
            ${rankPilotEscape(project.url)}
          </p>

        </div>

        <button
          type="button"
          class="rankpilot-primary-button"
          onclick="rankPilotAnalyzeProject('${project.id}')"
        >
          Analizar ahora
        </button>

      </div>


      ${
        latest
          ? `
            <div class="rankpilot-latest-analysis">

              <div>

                <span>ÚLTIMO SEO SCORE</span>

                <strong>
                  ${latest.score}
                </strong>

              </div>

              <div>

                <span>ÚLTIMO ANÁLISIS</span>

                <p>
                  ${rankPilotFormatDate(latest.date)}
                </p>

              </div>

            </div>
          `
          : `
            <div class="rankpilot-no-analysis">

              <h3>
                Este proyecto todavía no tiene análisis.
              </h3>

              <p>
                Ejecuta tu primer análisis para empezar
                a construir el historial.
              </p>

            </div>
          `
      }


      <div class="rankpilot-history-header">

        <div>
          <span>HISTORIAL</span>
          <h3>Análisis anteriores</h3>
        </div>

        <span>
          ${analyses.length} registros
        </span>

      </div>


      <div class="rankpilot-history-list">

        ${
          analyses.length
            ? analyses
                .map(
                  (analysis, index) => `
                    <div
                      class="rankpilot-history-item"
                    >

                      <div class="rankpilot-history-number">
                        ${index + 1}
                      </div>

                      <div class="rankpilot-history-info">

                        <strong>
                          Análisis SEO
                        </strong>

                        <span>
                          ${rankPilotFormatDate(
                            analysis.date
                          )}
                        </span>

                      </div>

                      <div class="rankpilot-history-score">

                        <strong>
                          ${analysis.score}
                        </strong>

                        <span>/100</span>

                      </div>

                      <div class="rankpilot-history-actions">

                        <button
                          type="button"
                          onclick="rankPilotRestoreAnalysis('${project.id}', '${analysis.id}')"
                        >
                          Ver análisis
                        </button>

                      </div>

                    </div>
                  `
                )
                .join("")
            : `
              <div class="rankpilot-empty-history">
                Todavía no hay análisis guardados.
              </div>
            `
        }

      </div>

    </div>
  `;
}


/* =========================================================
   RESTORE ANALYSIS
   ========================================================= */

function rankPilotRestoreAnalysis(
  projectId,
  analysisId
) {
  const projects = rankPilotGetProjects();

  const project = projects.find(
    item => item.id === projectId
  );

  if (!project) {
    return;
  }

  const analysis = (
    project.analyses || []
  ).find(
    item => item.id === analysisId
  );

  if (!analysis || !analysis.data) {
    return;
  }

  rankPilotCurrentProjectId = projectId;

  rankPilotCloseDashboard();

  currentData = analysis.data;

  if (typeof renderResults === "function") {
    renderResults(analysis.data);
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   ANALYZE PROJECT
   ========================================================= */

function rankPilotAnalyzeProject(projectId) {
  const projects = rankPilotGetProjects();

  const project = projects.find(
    item => item.id === projectId
  );

  if (!project) {
    return;
  }

  rankPilotCurrentProjectId = projectId;

  rankPilotCloseDashboard();

  const inputElement =
    document.getElementById("urlInput");

  const formElement =
    document.getElementById("seoForm");

  if (inputElement) {
    inputElement.value = project.url;
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  if (formElement) {
    setTimeout(() => {
      if (
        typeof formElement.requestSubmit ===
        "function"
      ) {
        formElement.requestSubmit();
      } else {
        formElement.dispatchEvent(
          new Event("submit", {
            bubbles: true,
            cancelable: true
          })
        );
      }
    }, 300);
  }
}


/* =========================================================
   AUTO-SAVE HOOK
   ========================================================= */

function rankPilotInstallAnalysisHook() {
  if (
    typeof renderResults !== "function" ||
    renderResults.__rankPilotWrapped
  ) {
    return;
  }

  const originalRenderResults =
    renderResults;

  const wrappedRenderResults =
    function (data) {

      currentData = data;

      try {
        rankPilotSaveAnalysis(data);
      } catch (error) {
        console.error(
          "RankPilot dashboard save error:",
          error
        );
      }

      return originalRenderResults(data);
    };

  wrappedRenderResults.__rankPilotWrapped =
    true;

  renderResults = wrappedRenderResults;
}


/* =========================================================
   DASHBOARD CSS
   ========================================================= */

function rankPilotInjectDashboardStyles() {
  if (
    document.getElementById(
      "rankpilotDashboardStyles"
    )
  ) {
    return;
  }

  const style = document.createElement("style");

  style.id = "rankpilotDashboardStyles";

  style.textContent = `

    #rankpilotDashboardButton {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9998;

      border: 0;
      border-radius: 12px;

      padding: 11px 17px;

      background: #111827;
      color: white;

      font-size: 14px;
      font-weight: 700;

      cursor: pointer;

      box-shadow:
        0 8px 30px rgba(0,0,0,.16);

      transition:
        transform .2s ease,
        box-shadow .2s ease;
    }

    #rankpilotDashboardButton:hover {
      transform: translateY(-2px);

      box-shadow:
        0 12px 35px rgba(0,0,0,.22);
    }

    #rankpilotDashboardButton span {
      display: inline-flex;

      min-width: 19px;
      height: 19px;

      margin-left: 5px;

      align-items: center;
      justify-content: center;

      border-radius: 999px;

      background: white;
      color: #111827;

      font-size: 11px;
    }


    #rankpilotDashboardModal {
      position: fixed;
      inset: 0;

      z-index: 9999;

      display: none;
    }

    #rankpilotDashboardModal.active {
      display: block;
    }


    .rankpilot-dashboard-overlay {
      position: absolute;
      inset: 0;

      background:
        rgba(15, 23, 42, .62);

      backdrop-filter: blur(5px);
    }


    .rankpilot-dashboard-panel {
      position: absolute;

      top: 3vh;
      left: 50%;

      width: min(1100px, 94vw);
      height: 94vh;

      transform: translateX(-50%);

      overflow-y: auto;

      background: #f8fafc;

      border-radius: 22px;

      box-shadow:
        0 30px 100px rgba(0,0,0,.30);
    }


    .rankpilot-dashboard-header {
      position: sticky;
      top: 0;

      z-index: 2;

      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      padding: 28px 30px;

      background: rgba(248,250,252,.95);

      backdrop-filter: blur(15px);

      border-bottom:
        1px solid #e5e7eb;
    }


    .rankpilot-dashboard-eyebrow {
      font-size: 11px;
      font-weight: 800;

      letter-spacing: .14em;

      color: #6366f1;
    }


    .rankpilot-dashboard-header h2 {
      margin: 4px 0;

      font-size: 28px;
      color: #111827;
    }


    .rankpilot-dashboard-header p {
      margin: 0;

      color: #6b7280;
    }


    .rankpilot-dashboard-close {
      width: 40px;
      height: 40px;

      border: 0;
      border-radius: 10px;

      background: #e5e7eb;

      color: #111827;

      font-size: 27px;

      cursor: pointer;
    }


    .rankpilot-dashboard-content {
      padding: 28px 30px 50px;
    }


    .rankpilot-dashboard-stats {
      display: grid;

      grid-template-columns:
        repeat(3, minmax(0, 1fr));

      gap: 16px;

      margin-bottom: 30px;
    }


    .rankpilot-stat-card {
      padding: 20px;

      background: white;

      border:
        1px solid #e5e7eb;

      border-radius: 16px;

      box-shadow:
        0 4px 15px rgba(15,23,42,.04);
    }


    .rankpilot-stat-card span {
      display: block;

      margin-bottom: 8px;

      font-size: 11px;
      font-weight: 800;

      letter-spacing: .08em;

      color: #6b7280;
    }


    .rankpilot-stat-card strong {
      font-size: 30px;

      color: #111827;
    }


    .rankpilot-dashboard-toolbar {
      display: flex;

      justify-content: space-between;
      align-items: center;

      margin-bottom: 18px;
    }


    .rankpilot-dashboard-toolbar span,
    .rankpilot-history-header span,
    .rankpilot-latest-analysis span {
      font-size: 10px;
      font-weight: 800;

      letter-spacing: .1em;

      color: #6b7280;
    }


    .rankpilot-dashboard-toolbar h3,
    .rankpilot-history-header h3 {
      margin: 4px 0 0;

      font-size: 21px;
      color: #111827;
    }


    .rankpilot-primary-button,
    .rankpilot-new-project-button {
      border: 0;

      border-radius: 10px;

      padding: 11px 16px;

      background: #111827;
      color: white;

      font-weight: 700;

      cursor: pointer;
    }


    .rankpilot-secondary-button {
      border: 1px solid #d1d5db;

      border-radius: 10px;

      padding: 11px 16px;

      background: white;

      color: #374151;

      font-weight: 700;

      cursor: pointer;
    }


    .rankpilot-new-project-form {
      margin-bottom: 20px;

      padding: 20px;

      background: white;

      border:
        1px solid #e5e7eb;

      border-radius: 16px;
    }


    .rankpilot-form-grid {
      display: grid;

      grid-template-columns:
        repeat(2, minmax(0, 1fr));

      gap: 16px;
    }


    .rankpilot-form-grid label {
      display: block;

      margin-bottom: 7px;

      font-size: 12px;
      font-weight: 700;

      color: #374151;
    }


    .rankpilot-form-grid input {
      box-sizing: border-box;

      width: 100%;

      padding: 12px 13px;

      border:
        1px solid #d1d5db;

      border-radius: 10px;

      outline: none;

      font-size: 14px;
    }


    .rankpilot-form-grid input:focus {
      border-color: #6366f1;

      box-shadow:
        0 0 0 3px rgba(99,102,241,.10);
    }


    .rankpilot-form-actions {
      display: flex;

      justify-content: flex-end;

      gap: 10px;

      margin-top: 18px;
    }


    .rankpilot-projects-list {
      display: grid;

      gap: 14px;
    }


    .rankpilot-project-card {
      display: grid;

      grid-template-columns:
        minmax(0, 1fr)
        auto
        auto;

      align-items: center;

      gap: 20px;

      padding: 20px;

      background: white;

      border:
        1px solid #e5e7eb;

      border-radius: 16px;

      transition:
        transform .2s ease,
        box-shadow .2s ease;
    }


    .rankpilot-project-card:hover {
      transform: translateY(-2px);

      box-shadow:
        0 10px 30px rgba(15,23,42,.08);
    }


    .rankpilot-project-main {
      display: flex;

      align-items: center;

      gap: 14px;

      min-width: 0;
    }


    .rankpilot-project-icon {
      width: 44px;
      height: 44px;

      flex-shrink: 0;

      display: flex;
      align-items: center;
      justify-content: center;

      border-radius: 12px;

      background: #eef2ff;

      font-size: 20px;
    }


    .rankpilot-project-info {
      min-width: 0;
    }


    .rankpilot-project-info h3 {
      margin: 0 0 3px;

      font-size: 17px;

      color: #111827;
    }


    .rankpilot-project-info p {
      margin: 0 0 5px;

      overflow: hidden;

      text-overflow: ellipsis;

      white-space: nowrap;

      color: #6366f1;

      font-size: 13px;
    }


    .rankpilot-project-info small {
      color: #9ca3af;

      font-size: 11px;
    }


    .rankpilot-project-score {
      min-width: 70px;

      text-align: center;
    }


    .rankpilot-score {
      display: block;

      font-size: 27px;
      font-weight: 800;
    }


    .rankpilot-score.good {
      color: #16a34a;
    }


    .rankpilot-score.warning {
      color: #d97706;
    }


    .rankpilot-score.bad {
      color: #dc2626;
    }


    .rankpilot-project-score small {
      display: block;

      font-size: 9px;
      font-weight: 800;

      letter-spacing: .08em;

      color: #9ca3af;
    }


    .rankpilot-no-score {
      display: block;

      font-size: 27px;
      font-weight: 800;

      color: #9ca3af;
    }


    .rankpilot-project-actions {
      display: flex;

      gap: 7px;

      flex-wrap: wrap;

      justify-content: flex-end;
    }


    .rankpilot-project-actions button,
    .rankpilot-history-actions button {
      border:
        1px solid #e5e7eb;

      border-radius: 8px;

      padding: 8px 11px;

      background: white;

      color: #374151;

      font-size: 12px;
      font-weight: 700;

      cursor: pointer;
    }


    .rankpilot-project-actions button:hover,
    .rankpilot-history-actions button:hover {
      background: #f3f4f6;
    }


    .rankpilot-project-actions button.danger {
      color: #dc2626;
    }


    .rankpilot-empty-projects {
      padding: 60px 20px;

      text-align: center;

      background: white;

      border:
        1px dashed #d1d5db;

      border-radius: 18px;
    }


    .rankpilot-empty-icon {
      font-size: 38px;

      margin-bottom: 10px;
    }


    .rankpilot-empty-projects h3 {
      margin: 0 0 7px;

      color: #111827;
    }


    .rankpilot-empty-projects p {
      max-width: 500px;

      margin: 0 auto 20px;

      color: #6b7280;

      line-height: 1.6;
    }


    .rankpilot-back-button {
      margin-bottom: 22px;

      border: 0;

      background: transparent;

      color: #4f46e5;

      font-weight: 700;

      cursor: pointer;
    }


    .rankpilot-project-detail-header {
      display: flex;

      justify-content: space-between;

      align-items: center;

      gap: 20px;

      margin-bottom: 25px;
    }


    .rankpilot-project-detail-header > div span {
      font-size: 10px;
      font-weight: 800;

      letter-spacing: .1em;

      color: #6b7280;
    }


    .rankpilot-project-detail-header h2 {
      margin: 4px 0;

      font-size: 28px;

      color: #111827;
    }


    .rankpilot-project-detail-header p {
      margin: 0;

      color: #6366f1;
    }


    .rankpilot-latest-analysis {
      display: grid;

      grid-template-columns:
        1fr 1fr;

      gap: 16px;

      margin-bottom: 30px;
    }


    .rankpilot-latest-analysis > div {
      padding: 22px;

      background: white;

      border:
        1px solid #e5e7eb;

      border-radius: 16px;
    }


    .rankpilot-latest-analysis strong {
      display: block;

      margin-top: 6px;

      font-size: 34px;

      color: #111827;
    }


    .rankpilot-latest-analysis p {
      margin: 7px 0 0;

      color: #4b5563;
    }


    .rankpilot-no-analysis,
    .rankpilot-empty-history {
      padding: 30px;

      margin-bottom: 25px;

      background: white;

      border:
        1px dashed #d1d5db;

      border-radius: 16px;

      color: #6b7280;
    }


    .rankpilot-no-analysis h3 {
      margin-top: 0;

      color: #111827;
    }


    .rankpilot-history-header {
      display: flex;

      justify-content: space-between;
      align-items: center;

      margin-bottom: 14px;
    }


    .rankpilot-history-list {
      display: grid;

      gap: 10px;
    }


    .rankpilot-history-item {
      display: grid;

      grid-template-columns:
        auto minmax(0,1fr) auto auto;

      align-items: center;

      gap: 15px;

      padding: 15px 17px;

      background: white;

      border:
        1px solid #e5e7eb;

      border-radius: 13px;
    }


    .rankpilot-history-number {
      width: 30px;
      height: 30px;

      display: flex;

      align-items: center;
      justify-content: center;

      border-radius: 9px;

      background: #f3f4f6;

      color: #6b7280;

      font-size: 12px;
      font-weight: 800;
    }


    .rankpilot-history-info strong {
      display: block;

      color: #111827;
    }


    .rankpilot-history-info span {
      display: block;

      margin-top: 3px;

      color: #9ca3af;

      font-size: 11px;
    }


    .rankpilot-history-score strong {
      font-size: 22px;

      color: #111827;
    }


    .rankpilot-history-score span {
      color: #9ca3af;

      font-size: 12px;
    }


    body.rankpilot-dashboard-open {
      overflow: hidden;
    }


    @media (max-width: 800px) {

      #rankpilotDashboardButton {
        top: 12px;
        right: 12px;
      }

      .rankpilot-dashboard-panel {
        top: 0;
        width: 100vw;
        height: 100vh;

        border-radius: 0;
      }

      .rankpilot-dashboard-header,
      .rankpilot-dashboard-content {
        padding-left: 18px;
        padding-right: 18px;
      }

      .rankpilot-dashboard-stats {
        grid-template-columns: 1fr;
      }

      .rankpilot-project-card {
        grid-template-columns: 1fr;
      }

      .rankpilot-project-actions {
        justify-content: flex-start;
      }

      .rankpilot-form-grid {
        grid-template-columns: 1fr;
      }

      .rankpilot-project-detail-header {
        align-items: flex-start;
        flex-direction: column;
      }

      .rankpilot-latest-analysis {
        grid-template-columns: 1fr;
      }

      .rankpilot-history-item {
        grid-template-columns:
          auto minmax(0,1fr) auto;
      }

      .rankpilot-history-actions {
        grid-column: 2 / -1;
      }

    }

  `;

  document.head.appendChild(style);
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function rankPilotInitializeDashboard() {
  rankPilotInjectDashboardStyles();

  rankPilotCreateDashboardButton();

  rankPilotCreateDashboardModal();

  rankPilotInstallAnalysisHook();

  rankPilotUpdateDashboardButton();
}


/*
  Esperamos a que el resto de app.js haya terminado
  de declarar renderResults y las demás funciones.
*/

if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      setTimeout(
        rankPilotInitializeDashboard,
        100
      );
    }
  );

} else {

  setTimeout(
    rankPilotInitializeDashboard,
    100
  );

}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.rankPilotOpenDashboard =
  rankPilotOpenDashboard;

window.rankPilotCloseDashboard =
  rankPilotCloseDashboard;

window.rankPilotShowNewProjectForm =
  rankPilotShowNewProjectForm;

window.rankPilotHideNewProjectForm =
  rankPilotHideNewProjectForm;

window.rankPilotCreateProjectFromForm =
  rankPilotCreateProjectFromForm;

window.rankPilotOpenProject =
  rankPilotOpenProject;

window.rankPilotAnalyzeProject =
  rankPilotAnalyzeProject;

window.rankPilotRestoreAnalysis =
  rankPilotRestoreAnalysis;

window.rankPilotDeleteProject =
  rankPilotDeleteProject;
