/* =========================================================
   RANKPILOT — APP.JS COMPLETO
   ========================================================= */


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const WORKER_URL =
  "https://rankpilot-api.alvaroalvarezmonteagudo.workers.dev/";

const form = document.getElementById("seoForm");
const input = document.getElementById("urlInput");
const message = document.getElementById("analyzerMessage");

let currentMainUrl = "";
let currentData = null;


/* =========================================================
   UTILIDADES
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function getHostname(url) {

  try {

    return new URL(url).hostname;

  } catch {

    return url || "";

  }

}


function getStatus(score) {

  score = Number(score) || 0;

  if (score >= 80) return "good";

  if (score >= 60) return "warning";

  return "bad";

}


function getLabel(score) {

  score = Number(score) || 0;

  if (score >= 90) return "Excelente";

  if (score >= 80) return "Bueno";

  if (score >= 60) return "Mejorable";

  return "Necesita atención";

}


/* =========================================================
   KEYWORD UTILITIES
========================================================= */

function normalizeKeyword(value) {

  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {

    const possible =
      value.keyword ??
      value.term ??
      value.text ??
      value.name ??
      value.word ??
      value.value ??
      "";

    return String(possible).trim();

  }

  return String(value).trim();

}


function getKeywordCount(value) {

  if (
    value &&
    typeof value === "object"
  ) {

    return (
      value.count ??
      value.frequency ??
      value.occurrences ??
      value.volume ??
      ""
    );

  }

  return "";

}


function getKeywordTypeLabel(keyword, primary) {

  const a =
    String(keyword || "")
      .toLowerCase()
      .trim();

  const b =
    String(primary || "")
      .toLowerCase()
      .trim();

  if (!a) return "";

  if (b && a === b) {
    return "Principal";
  }

  if (
    b &&
    (
      a.includes(b) ||
      b.includes(a)
    )
  ) {
    return "Relacionada";
  }

  return "Detectada";

}


/* =========================================================
   ANALIZADOR PRINCIPAL
========================================================= */

if (form) {

  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      let url =
        input
          ? input.value.trim()
          : "";

      if (!url) {

        message.innerHTML = `
          <div class="seo-error">
            ❌ Introduce una URL.
          </div>
        `;

        return;
      }


      if (
        !/^https?:\/\//i.test(url)
      ) {

        url =
          "https://" + url;

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

        const response =
          await fetch(
            `${WORKER_URL}?url=${encodeURIComponent(url)}`
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data.error ||
            "No se pudo analizar la web."
          );

        }


        currentData = data;


        currentMainUrl =
          data.finalUrl ||
          data.url ||
          url;


        renderResults(data);


        /*
          Guardar automáticamente el análisis
          en el sistema de proyectos.
        */

        saveCurrentAnalysisToProject(data);


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

    }
  );

}


/* =========================================================
   RESULTADOS
========================================================= */

function renderResults(data) {

  const seo =
    data.seo || {};


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


      <!-- SCORE -->

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


      <!-- INFORME -->

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


      <!-- ACTION PLAN -->

      ${renderActionPlan(seo)}


      <!-- KEYWORDS -->

      ${renderKeywordIntelligence(seo)}


      <!-- RECOMENDACIONES -->

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
   COMPONENTES DE RESULTADOS
========================================================= */

function categoryCard(
  name,
  score,
  description
) {

  score =
    Number(score || 0);


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
        ${escapeHtml(String(value ?? ""))}
      </strong>

      <small>
        ${escapeHtml(subtitle)}
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
        class="${passed ? "tech-good" : "tech-bad"}"
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


function showFix(button) {

  if (!button) return;

  const fix =
    button.parentElement
      ? button.parentElement.querySelector(
          ".fix-content"
        )
      : null;


  if (fix) {

    fix.classList.toggle(
      "visible"
    );

  }

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

        order:
          issues.length + index

      });

    }
  );


  if (
    Number(seo.imagesWithoutAlt || 0) > 0
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
    Number(seo.internalLinks || 0) === 0
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
    Number(seo.h1Count || 0) === 0
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

          <span
            class="action-priority ${item.type}"
          >
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
            primary ||
            "No detectada"
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
                          ${escapeHtml(
                            String(
                              count || "-"
                            )
                          )}
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
        element =>
          element
            ? element.value.trim()
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
   SEO REPORT
========================================================= */

function generateSEOReport() {

  if (!currentData) {

    alert(
      "Primero analiza una web."
    );

    return;

  }


  const seo =
    currentData.seo || {};


  const score =
    Number(seo.score || 0);


  const url =
    currentData.finalUrl ||
    currentMainUrl ||
    "";


  const hostname =
    getHostname(url);


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


  const categories =
    seo.categories || {};


  const reportWindow =
    window.open(
      "",
      "_blank"
    );


  if (!reportWindow) {

    alert(
      "El navegador ha bloqueado el informe. Permite ventanas emergentes para RankPilot."
    );

    return;

  }


  reportWindow.document.write(`

    <!DOCTYPE html>

    <html lang="es">

    <head>

      <meta charset="UTF-8">

      <title>
        RankPilot SEO Report - ${escapeHtml(hostname)}
      </title>

      <style>

        * {
          box-sizing: border-box;
        }

        body {
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          margin: 0;
          padding: 40px;

          background: #f5f7fb;
          color: #111827;
        }

        .report {
          max-width: 1000px;
          margin: auto;
          background: white;
          padding: 45px;
          border-radius: 18px;
        }

        .brand {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 30px;
        }

        .brand span {
          color: #6366f1;
        }

        .url {
          color: #6b7280;
          margin-bottom: 30px;
          word-break: break-all;
        }

        .score {
          font-size: 72px;
          font-weight: 800;
          margin: 0;
        }

        .score-label {
          color: #6b7280;
          margin-bottom: 30px;
        }

        .grid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);

          gap: 15px;

          margin: 30px 0;
        }

        .card {
          border: 1px solid #e5e7eb;
          padding: 20px;
          border-radius: 12px;
        }

        .card strong {
          display: block;
          font-size: 26px;
          margin-top: 8px;
        }

        .section {
          margin-top: 35px;
        }

        .section h2 {
          margin-bottom: 15px;
        }

        .item {
          padding: 12px 0;
          border-bottom:
            1px solid #e5e7eb;
        }

        .critical {
          color: #b91c1c;
        }

        .warning {
          color: #92400e;
        }

        .passed {
          color: #047857;
        }

        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          border: 0;
          background: #111827;
          color: white;
          padding: 12px 18px;
          border-radius: 10px;
          cursor: pointer;
        }

        @media print {

          body {
            padding: 0;
            background: white;
          }

          .report {
            box-shadow: none;
            border-radius: 0;
          }

          .print-button {
            display: none;
          }

        }

        @media(max-width:700px) {

          body {
            padding: 15px;
          }

          .report {
            padding: 25px;
          }

          .grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

        }

      </style>

    </head>


    <body>

      <button
        class="print-button"
        onclick="window.print()"
      >
        Guardar / Imprimir PDF
      </button>


      <main class="report">

        <div class="brand">
          Rank<span>Pilot</span>
        </div>

        <h1>
          Informe SEO
        </h1>

        <div class="url">
          ${escapeHtml(url)}
        </div>


        <h2 class="score">
          ${score}/100
        </h2>

        <div class="score-label">
          ${escapeHtml(
            getLabel(score)
          )}
        </div>


        <div class="grid">

          <div class="card">
            Technical SEO
            <strong>
              ${Number(
                categories.technical || 0
              )}
            </strong>
          </div>

          <div class="card">
            On-Page SEO
            <strong>
              ${Number(
                categories.onPage || 0
              )}
            </strong>
          </div>

          <div class="card">
            Content
            <strong>
              ${Number(
                categories.content || 0
              )}
            </strong>
          </div>

          <div class="card">
            Indexability
            <strong>
              ${Number(
                categories.indexability || 0
              )}
            </strong>
          </div>

        </div>


        <section class="section">

          <h2>
            Problemas
          </h2>

          ${
            issues.length
              ? issues
                  .map(
                    item => `
                      <div class="item critical">
                        ❌ ${escapeHtml(
                          String(item)
                        )}
                      </div>
                    `
                  )
                  .join("")
              : `
                <div class="item passed">
                  ✓ No se han detectado problemas críticos.
                </div>
              `
          }

        </section>


        <section class="section">

          <h2>
            Recomendaciones
          </h2>

          ${
            warnings.length
              ? warnings
                  .map(
                    item => `
                      <div class="item warning">
                        ⚠ ${escapeHtml(
                          String(item)
                        )}
                      </div>
                    `
                  )
                  .join("")
              : `
                <div class="item passed">
                  ✓ No hay recomendaciones adicionales.
                </div>
              `
          }

        </section>


        <section class="section">

          <h2>
            Elementos correctos
          </h2>

          ${
            passed.length
              ? passed
                  .map(
                    item => `
                      <div class="item passed">
                        ✓ ${escapeHtml(
                          String(item)
                        )}
                      </div>
                    `
                  )
                  .join("")
              : `
                <div class="item">
                  No hay datos.
                </div>
              `
          }

        </section>


        <section class="section">

          <h2>
            Elementos On-Page
          </h2>

          <div class="item">
            Title:
            ${escapeHtml(
              seo.title || "No encontrado"
            )}
          </div>

          <div class="item">
            Meta Description:
            ${escapeHtml(
              seo.description ||
              "No encontrada"
            )}
          </div>

          <div class="item">
            H1:
            ${Number(
              seo.h1Count || 0
            )}
          </div>

          <div class="item">
            Palabras:
            ${Number(
              seo.wordCount || 0
            )}
          </div>

          <div class="item">
            Imágenes:
            ${Number(
              seo.imageCount || 0
            )}
          </div>

          <div class="item">
            Imágenes sin ALT:
            ${Number(
              seo.imagesWithoutAlt || 0
            )}
          </div>

        </section>


        <p style="
          margin-top:50px;
          color:#6b7280;
          font-size:13px;
        ">
          Informe generado por RankPilot.
        </p>

      </main>

    </body>

    </html>

  `);


  reportWindow.document.close();

}


/* =========================================================
   DASHBOARD / PROYECTOS / HISTORIAL
========================================================= */

const PROJECTS_STORAGE_KEY =
  "rankpilot_projects_v1";


function getProjects() {

  try {

    const data =
      JSON.parse(
        localStorage.getItem(
          PROJECTS_STORAGE_KEY
        ) || "[]"
      );

    return Array.isArray(data)
      ? data
      : [];

  } catch {

    return [];

  }

}


function saveProjects(projects) {

  localStorage.setItem(
    PROJECTS_STORAGE_KEY,
    JSON.stringify(projects)
  );

}


function createProject(
  name,
  url
) {

  const projects =
    getProjects();


  const project = {

    id:
      "project_" +
      Date.now(),

    name:
      name ||
      getHostname(url),

    url:
      url,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),

    analyses: []

  };


  projects.unshift(
    project
  );


  saveProjects(
    projects
  );


  return project;

}


function saveCurrentAnalysisToProject(
  data
) {

  if (!data || !data.seo) {
    return;
  }


  const url =
    data.finalUrl ||
    data.url ||
    currentMainUrl;


  if (!url) {
    return;
  }


  const hostname =
    getHostname(url);


  let projects =
    getProjects();


  let project =
    projects.find(
      item =>
        String(item.url)
          .replace(/\/$/, "")
          .toLowerCase() ===
        String(url)
          .replace(/\/$/, "")
          .toLowerCase()
    );


  if (!project) {

    project =
      createProject(
        hostname,
        url
      );

    projects =
      getProjects();

  }


  const analysis = {

    id:
      "analysis_" +
      Date.now(),

    date:
      new Date().toISOString(),

    url:
      url,

    score:
      Number(
        data.seo.score || 0
      ),

    data:
      data

  };


  project =
    projects.find(
      item =>
        item.id ===
        project.id
    );


  if (!project) {
    return;
  }


  if (
    !Array.isArray(
      project.analyses
    )
  ) {

    project.analyses = [];

  }


  project.analyses.unshift(
    analysis
  );


  project.analyses =
    project.analyses.slice(
      0,
      20
    );


  project.updatedAt =
    new Date().toISOString();


  saveProjects(
    projects
  );

}


function renderDashboard() {

  let modal =
    document.getElementById(
      "rankpilotDashboardModal"
    );


  if (!modal) {

    modal =
      document.createElement(
        "div"
      );

    modal.id =
      "rankpilotDashboardModal";

    modal.className =
      "rankpilot-modal";

    document.body.appendChild(
      modal
    );

  }


  const projects =
    getProjects();


  modal.innerHTML = `

    <div class="rankpilot-modal-overlay">

      <div class="rankpilot-modal-card">

        <button
          class="rankpilot-close"
          onclick="closeRankPilotDashboard()"
        >
          ×
        </button>


        <div class="rankpilot-dashboard-header">

          <span>
            RANKPILOT
          </span>

          <h2>
            Dashboard
          </h2>

          <p>
            Gestiona tus proyectos SEO y consulta
            tu historial de análisis.
          </p>

        </div>


        <div class="rankpilot-dashboard-stats">

          <div>
            <span>
              Proyectos
            </span>

            <strong>
              ${projects.length}
            </strong>
          </div>


          <div>
            <span>
              Análisis
            </span>

            <strong>
              ${projects.reduce(
                (
                  total,
                  project
                ) =>
                  total +
                  (
                    Array.isArray(
                      project.analyses
                    )
                      ? project.analyses.length
                      : 0
                  ),
                0
              )}
            </strong>
          </div>

        </div>


        <div class="rankpilot-project-create">

          <h3>
            Nuevo proyecto
          </h3>

          <div class="rankpilot-project-form">

            <input
              id="rankpilotProjectName"
              placeholder="Nombre del proyecto"
            />

            <input
              id="rankpilotProjectUrl"
              placeholder="https://ejemplo.com"
            />

            <button
              onclick="rankPilotCreateProjectFromDashboard()"
            >
              Crear proyecto
            </button>

          </div>

        </div>


        <div class="rankpilot-projects">

          <h3>
            Mis proyectos
          </h3>


          ${
            projects.length
              ? projects
                  .map(
                    project =>
                      renderProjectCard(
                        project
                      )
                  )
                  .join("")
              : `

                <div class="rankpilot-empty">

                  <strong>
                    Todavía no tienes proyectos.
                  </strong>

                  <p>
                    Analiza una web para crear tu primer proyecto.
                  </p>

                </div>

              `
          }

        </div>

      </div>

    </div>

  `;


  modal.style.display =
    "block";


  document.body.style.overflow =
    "hidden";

}


function renderProjectCard(
  project
) {

  const analyses =
    Array.isArray(
      project.analyses
    )
      ? project.analyses
      : [];


  const latest =
    analyses[0];


  return `

    <div class="rankpilot-project-card">

      <div>

        <strong>
          ${escapeHtml(
            project.name
          )}
        </strong>

        <span>
          ${escapeHtml(
            project.url
          )}
        </span>

      </div>


      <div class="rankpilot-project-score">

        ${
          latest
            ? `
              <strong>
                ${latest.score}/100
              </strong>

              <span>
                ${formatDate(
                  latest.date
                )}
              </span>
            `
            : `
              <span>
                Sin análisis
              </span>
            `
        }

      </div>


      <div class="rankpilot-project-actions">

        <button
          onclick="rankPilotAnalyzeProject('${project.id}')"
        >
          Analizar
        </button>

        <button
          onclick="rankPilotShowProject('${project.id}')"
        >
          Historial
        </button>

        <button
          class="danger"
          onclick="rankPilotDeleteProject('${project.id}')"
        >
          Eliminar
        </button>

      </div>

    </div>

  `;

}


function rankPilotCreateProjectFromDashboard() {

  const nameInput =
    document.getElementById(
      "rankpilotProjectName"
    );


  const urlInput =
    document.getElementById(
      "rankpilotProjectUrl"
    );


  const name =
    nameInput
      ? nameInput.value.trim()
      : "";


  let url =
    urlInput
      ? urlInput.value.trim()
      : "";


  if (!url) {

    alert(
      "Introduce una URL."
    );

    return;

  }


  if (
    !/^https?:\/\//i.test(url)
  ) {

    url =
      "https://" + url;

  }


  createProject(
    name ||
      getHostname(url),
    url
  );


  renderDashboard();

}


function rankPilotShowProject(
  projectId
) {

  const projects =
    getProjects();


  const project =
    projects.find(
      item =>
        item.id ===
        projectId
    );


  if (!project) {
    return;
  }


  const modal =
    document.getElementById(
      "rankpilotDashboardModal"
    );


  if (!modal) {
    return;
  }


  const analyses =
    Array.isArray(
      project.analyses
    )
      ? project.analyses
      : [];


  modal.innerHTML = `

    <div class="rankpilot-modal-overlay">

      <div class="rankpilot-modal-card">

        <button
          class="rankpilot-close"
          onclick="renderDashboard()"
        >
          ×
        </button>


        <div class="rankpilot-dashboard-header">

          <span>
            MI PROYECTO
          </span>

          <h2>
            ${escapeHtml(
              project.name
            )}
          </h2>

          <p>
            ${escapeHtml(
              project.url
            )}
          </p>

        </div>


        <button
          onclick="rankPilotAnalyzeProject('${project.id}')"
          class="rankpilot-primary-button"
        >
          Analizar ahora
        </button>


        <div class="rankpilot-history">

          <h3>
            Historial
          </h3>


          ${
            analyses.length
              ? analyses
                  .map(
                    analysis => `

                      <div class="rankpilot-history-row">

                        <div>

                          <strong>
                            ${analysis.score}/100
                          </strong>

                          <span>
                            ${formatDate(
                              analysis.date
                            )}
                          </span>

                        </div>


                        <button
                          onclick="rankPilotRestoreAnalysis('${project.id}','${analysis.id}')"
                        >
                          Ver análisis
                        </button>

                      </div>

                    `
                  )
                  .join("")
              : `

                <div class="rankpilot-empty">

                  Todavía no hay análisis.

                </div>

              `
          }

        </div>


        <button
          onclick="renderDashboard()"
          class="rankpilot-secondary-button"
        >
          ← Volver a proyectos
        </button>

      </div>

    </div>

  `;

}


function rankPilotAnalyzeProject(
  projectId
) {

  const projects =
    getProjects();


  const project =
    projects.find(
      item =>
        item.id ===
        projectId
    );


  if (!project) {
    return;
  }


  closeRankPilotDashboard();


  if (input) {
    input.value =
      project.url;
  }


  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });


  setTimeout(
    () => {

      if (form) {

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

    },
    400
  );

}


function rankPilotRestoreAnalysis(
  projectId,
  analysisId
) {

  const projects =
    getProjects();


  const project =
    projects.find(
      item =>
        item.id ===
        projectId
    );


  if (!project) {
    return;
  }


  const analysis =
    (
      project.analyses || []
    ).find(
      item =>
        item.id ===
        analysisId
    );


  if (!analysis || !analysis.data) {
    return;
  }


  currentData =
    analysis.data;


  currentMainUrl =
    analysis.url ||
    currentMainUrl;


  closeRankPilotDashboard();


  renderResults(
    currentData
  );


  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });

}


function rankPilotDeleteProject(
  projectId
) {

  const confirmed =
    confirm(
      "¿Quieres eliminar este proyecto y su historial?"
    );


  if (!confirmed) {
    return;
  }


  const projects =
    getProjects()
      .filter(
        project =>
          project.id !==
          projectId
      );


  saveProjects(
    projects
  );


  renderDashboard();

}


function closeRankPilotDashboard() {

  const modal =
    document.getElementById(
      "rankpilotDashboardModal"
    );


  if (modal) {

    modal.style.display =
      "none";

  }


  document.body.style.overflow =
    "";

}


/* =========================================================
   BOTÓN DASHBOARD
========================================================= */

function createDashboardButton() {

  if (
    document.getElementById(
      "rankpilotDashboardButton"
    )
  ) {

    return;

  }


  const button =
    document.createElement(
      "button"
    );


  button.id =
    "rankpilotDashboardButton";


  button.type =
    "button";


  button.textContent =
    "Dashboard";


  button.addEventListener(
    "click",
    renderDashboard
  );


  document.body.appendChild(
    button
  );


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "rankpilotDashboardStyles";


  style.textContent = `

    #rankpilotDashboardButton {

      position: fixed;

      bottom: 24px;

      right: 24px;

      z-index: 9990;

      border: none;

      border-radius: 12px;

      padding: 12px 18px;

      background: #111827;

      color: white;

      font-weight: 700;

      cursor: pointer;

      box-shadow:
        0 10px 30px
        rgba(0,0,0,.15);

    }


    #rankpilotDashboardButton:hover {
      transform: translateY(-2px);
    }


    .rankpilot-modal {

      position: fixed;

      inset: 0;

      z-index: 10000;

    }


    .rankpilot-modal-overlay {

      position: fixed;

      inset: 0;

      background:
        rgba(15,23,42,.65);

      display: flex;

      align-items: center;

      justify-content: center;

      padding: 20px;

      overflow-y: auto;

    }


    .rankpilot-modal-card {

      position: relative;

      width: min(950px, 100%);

      max-height: 90vh;

      overflow-y: auto;

      background: white;

      border-radius: 20px;

      padding: 30px;

      box-shadow:
        0 30px 80px
        rgba(0,0,0,.25);

    }


    .rankpilot-close {

      position: absolute;

      top: 15px;

      right: 18px;

      border: none;

      background: none;

      font-size: 30px;

      cursor: pointer;

    }


    .rankpilot-dashboard-header span {

      font-size: 12px;

      font-weight: 800;

      letter-spacing: .12em;

      color: #6366f1;

    }


    .rankpilot-dashboard-header h2 {

      margin: 6px 0;

      font-size: 30px;

    }


    .rankpilot-dashboard-header p {

      color: #6b7280;

    }


    .rankpilot-dashboard-stats {

      display: grid;

      grid-template-columns:
        repeat(2,1fr);

      gap: 15px;

      margin: 25px 0;

    }


    .rankpilot-dashboard-stats > div {

      padding: 20px;

      border:
        1px solid #e5e7eb;

      border-radius: 14px;

    }


    .rankpilot-dashboard-stats span {

      display: block;

      color: #6b7280;

    }


    .rankpilot-dashboard-stats strong {

      display: block;

      font-size: 30px;

      margin-top: 5px;

    }


    .rankpilot-project-create {

      padding: 20px;

      background: #f8fafc;

      border-radius: 14px;

      margin-bottom: 25px;

    }


    .rankpilot-project-form {

      display: grid;

      grid-template-columns:
        1fr 1fr auto;

      gap: 10px;

    }


    .rankpilot-project-form input {

      padding: 12px;

      border:
        1px solid #d1d5db;

      border-radius: 9px;

    }


    .rankpilot-project-form button,
    .rankpilot-primary-button {

      border: none;

      background: #111827;

      color: white;

      border-radius: 9px;

      padding: 12px 16px;

      cursor: pointer;

      font-weight: 700;

    }


    .rankpilot-secondary-button {

      border:
        1px solid #d1d5db;

      background: white;

      border-radius: 9px;

      padding: 11px 16px;

      cursor: pointer;

      margin-top: 20px;

    }


    .rankpilot-project-card {

      display: grid;

      grid-template-columns:
        1.5fr .7fr auto;

      gap: 20px;

      align-items: center;

      padding: 18px 0;

      border-bottom:
        1px solid #e5e7eb;

    }


    .rankpilot-project-card strong,
    .rankpilot-project-card span {

      display: block;

    }


    .rankpilot-project-card span {

      color: #6b7280;

      font-size: 13px;

      margin-top: 4px;

      word-break: break-all;

    }


    .rankpilot-project-score strong {

      color: #111827;

    }


    .rankpilot-project-actions {

      display: flex;

      gap: 7px;

      flex-wrap: wrap;

    }


    .rankpilot-project-actions button {

      border:
        1px solid #d1d5db;

      background: white;

      border-radius: 8px;

      padding: 8px 10px;

      cursor: pointer;

    }


    .rankpilot-project-actions .danger {

      color: #b91c1c;

    }


    .rankpilot-history-row {

      display: flex;

      justify-content: space-between;

      align-items: center;

      padding: 15px 0;

      border-bottom:
        1px solid #e5e7eb;

    }


    .rankpilot-history-row strong {

      font-size: 20px;

    }


    .rankpilot-history-row span {

      display: block;

      color: #6b7280;

      font-size: 13px;

    }


    .rankpilot-history-row button {

      border:
        1px solid #d1d5db;

      background: white;

      border-radius: 8px;

      padding: 8px 12px;

      cursor: pointer;

    }


    .rankpilot-empty {

      text-align: center;

      padding: 35px;

      color: #6b7280;

    }


    @media(max-width:700px) {

      #rankpilotDashboardButton {

        bottom: 12px;

        right: 12px;

      }


      .rankpilot-project-form {

        grid-template-columns: 1fr;

      }


      .rankpilot-project-card {

        grid-template-columns: 1fr;

      }


      .rankpilot-dashboard-stats {

        grid-template-columns: 1fr;

      }

    }

  `;


  document.head.appendChild(
    style
  );

}


/* =========================================================
   CUENTA / PLANES
========================================================= */

const ACCOUNT_STORAGE_KEY =
  "rankpilot_account_v1";


const RANKPILOT_PLANS = {

  Starter: {

    name: "Starter",

    price: 0,

    description:
      "Para empezar a analizar webs.",

    projects: 1,

    analyses: 10

  },


  Pro: {

    name: "Pro",

    price: 19,

    description:
      "Para profesionales SEO.",

    projects: 10,

    analyses: 100

  },


  Agency: {

    name: "Agency",

    price: 49,

    description:
      "Para agencias y equipos.",

    projects: Infinity,

    analyses: Infinity

  }

};


function getRankPilotAccount() {

  try {

    const account =
      JSON.parse(
        localStorage.getItem(
          ACCOUNT_STORAGE_KEY
        ) || "null"
      );


    return account || {

      loggedIn: false,

      name: "",

      email: "",

      plan: "Starter"

    };

  } catch {

    return {

      loggedIn: false,

      name: "",

      email: "",

      plan: "Starter"

    };

  }

}


function saveRankPilotAccount(
  account
) {

  localStorage.setItem(
    ACCOUNT_STORAGE_KEY,
    JSON.stringify(account)
  );

}


function rankPilotHasFeature(
  feature
) {

  /*
    Las funciones avanzadas siguen activas durante
    esta fase de desarrollo.

    El bloqueo real se añadirá cuando conectemos
    autenticación y pagos al backend.
  */

  return true;

}


/* =========================================================
   HEADER — LOGIN
========================================================= */

(function initRankPilotHeaderAccount() {

  function start() {

    const loginBtn =
      document.getElementById(
        "loginBtn"
      );


    if (!loginBtn) {

      console.warn(
        "RankPilot: no se encontró #loginBtn"
      );

      return;

    }


    /*
      ELIMINAMOS EL ANTIGUO BOTÓN FLOTANTE
      DE CUENTA.
    */

    const oldAccountButton =
      document.getElementById(
        "rankpilotAccountButton"
      );


    if (oldAccountButton) {

      oldAccountButton.remove();

    }


    const oldContainers =
      document.querySelectorAll(
        ".rankpilot-account-button-container, " +
        ".rankpilot-floating-account, " +
        ".rankpilot-floating-login, " +
        "#rankpilotAccountButtonContainer"
      );


    oldContainers.forEach(
      element =>
        element.remove()
    );


    /*
      Evitar duplicar el menú.
    */

    if (
      document.getElementById(
        "rankpilotAccountMenu"
      )
    ) {

      updateHeaderAccount();

      return;

    }


    /*
      Contenedor.
    */

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "rankpilot-account-wrapper";


    loginBtn.parentNode.insertBefore(
      wrapper,
      loginBtn
    );


    wrapper.appendChild(
      loginBtn
    );


    /*
      Menú.
    */

    const menu =
      document.createElement(
        "div"
      );


    menu.id =
      "rankpilotAccountMenu";


    menu.className =
      "rankpilot-account-menu";


    menu.innerHTML = `

      <button
        data-action="dashboard"
      >
        Dashboard
      </button>

      <button
        data-action="projects"
      >
        Mis proyectos
      </button>

      <button
        data-action="history"
      >
        Historial
      </button>

      <button
        data-action="account"
      >
        Mi cuenta
      </button>

      <div class="account-menu-divider"></div>

      <button
        data-action="logout"
        class="logout"
      >
        Cerrar sesión
      </button>

    `;


    wrapper.appendChild(
      menu
    );


    /*
      Click botón.
    */

    loginBtn.addEventListener(
      "click",
      function(event) {

        event.preventDefault();

        const account =
          getRankPilotAccount();


        if (
          account.loggedIn
        ) {

          menu.classList.toggle(
            "open"
          );

        } else {

          openRankPilotLogin();

        }

      }
    );


    /*
      Acciones menú.
    */

    menu
      .querySelectorAll(
        "button[data-action]"
      )
      .forEach(
        button => {

          button.addEventListener(
            "click",
            function() {

              const action =
                button.dataset.action;


              if (
                action ===
                "dashboard"
              ) {

                menu.classList.remove(
                  "open"
                );

                renderDashboard();

              }


              if (
                action ===
                "projects"
              ) {

                menu.classList.remove(
                  "open"
                );

                renderDashboard();

              }


              if (
                action ===
                "history"
              ) {

                menu.classList.remove(
                  "open"
                );

                renderDashboard();

              }


              if (
                action ===
                "account"
              ) {

                menu.classList.remove(
                  "open"
                );

                openRankPilotAccount();

              }


              if (
                action ===
                "logout"
              ) {

                logoutRankPilot();

              }

            }
          );

        }
      );


    /*
      Cerrar menú al hacer click fuera.
    */

    document.addEventListener(
      "click",
      function(event) {

        if (
          !wrapper.contains(
            event.target
          )
        ) {

          menu.classList.remove(
            "open"
          );

        }

      }
    );


    injectHeaderAccountStyles();

    updateHeaderAccount();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start
    );

  } else {

    start();

  }

})();


function updateHeaderAccount() {

  const loginBtn =
    document.getElementById(
      "loginBtn"
    );


  if (!loginBtn) {
    return;
  }


  const account =
    getRankPilotAccount();


  if (
    account.loggedIn
  ) {

    const firstName =
      (
        account.name ||
        "Cuenta"
      )
        .trim()
        .split(" ")[0];


    loginBtn.innerHTML = `

      ${escapeHtml(firstName)}

      <span
        style="
          font-size:11px;
          margin-left:4px;
        "
      >
        ▾
      </span>

    `;

  } else {

    loginBtn.textContent =
      "Iniciar sesión";

  }

}


function injectHeaderAccountStyles() {

  if (
    document.getElementById(
      "rankpilotHeaderAccountStyles"
    )
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "rankpilotHeaderAccountStyles";


  style.textContent = `

    .rankpilot-account-wrapper {

      position: relative;

      display: inline-flex;

    }


    .rankpilot-account-menu {

      position: absolute;

      top: calc(100% + 10px);

      right: 0;

      width: 210px;

      background: white;

      border:
        1px solid #e5e7eb;

      border-radius: 12px;

      padding: 7px;

      box-shadow:
        0 15px 40px
        rgba(0,0,0,.15);

      display: none;

      z-index: 9999;

    }


    .rankpilot-account-menu.open {

      display: block;

    }


    .rankpilot-account-menu button {

      width: 100%;

      border: none;

      background: transparent;

      text-align: left;

      padding: 11px 12px;

      border-radius: 8px;

      cursor: pointer;

      font-size: 14px;

    }


    .rankpilot-account-menu button:hover {

      background: #f3f4f6;

    }


    .rankpilot-account-menu .logout {

      color: #b91c1c;

    }


    .account-menu-divider {

      height: 1px;

      background: #e5e7eb;

      margin: 5px 0;

    }

  `;


  document.head.appendChild(
    style
  );

}


/* =========================================================
   LOGIN MODAL
========================================================= */

function openRankPilotLogin() {

  let modal =
    document.getElementById(
      "rankpilotLoginModal"
    );


  if (!modal) {

    modal =
      document.createElement(
        "div"
      );


    modal.id =
      "rankpilotLoginModal";


    modal.className =
      "rankpilot-login-modal";


    modal.innerHTML = `

      <div class="rankpilot-login-overlay">

        <div class="rankpilot-login-card">

          <button
            class="rankpilot-login-close"
            onclick="closeRankPilotLogin()"
          >
            ×
          </button>


          <span class="rankpilot-login-label">
            RANKPILOT
          </span>


          <h2>
            Inicia sesión
          </h2>


          <p>
            Accede a tu espacio de trabajo SEO.
          </p>


          <form
            id="rankpilotLoginForm"
          >

            <input
              id="rankpilotLoginName"
              placeholder="Nombre"
              required
            />


            <input
              id="rankpilotLoginEmail"
              type="email"
              placeholder="Email"
              required
            />


            <input
              id="rankpilotLoginPassword"
              type="password"
              placeholder="Contraseña"
              required
            />


            <button
              type="submit"
            >
              Entrar
            </button>

          </form>


          <small>
            Esta versión utiliza almacenamiento local.
            La autenticación real se conectará al backend posteriormente.
          </small>

        </div>

      </div>

    `;


    document.body.appendChild(
      modal
    );


    document
      .getElementById(
        "rankpilotLoginForm"
      )
      .addEventListener(
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


          if (
            !name ||
            !email ||
            !password
          ) {

            return;

          }


          const existing =
            getRankPilotAccount();


          saveRankPilotAccount({

            loggedIn: true,

            name: name,

            email: email,

            plan:
              existing.plan ||
              "Starter"

          });


          closeRankPilotLogin();

          updateHeaderAccount();

        }
      );


    injectLoginStyles();

  }


  modal.style.display =
    "block";


  document.body.style.overflow =
    "hidden";

}


function closeRankPilotLogin() {

  const modal =
    document.getElementById(
      "rankpilotLoginModal"
    );


  if (modal) {

    modal.style.display =
      "none";

  }


  document.body.style.overflow =
    "";

}


function injectLoginStyles() {

  if (
    document.getElementById(
      "rankpilotLoginStyles"
    )
  ) {

    return;

  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "rankpilotLoginStyles";


  style.textContent = `

    .rankpilot-login-modal {

      position: fixed;

      inset: 0;

      z-index: 11000;

    }


    .rankpilot-login-overlay {

      position: fixed;

      inset: 0;

      display: flex;

      align-items: center;

      justify-content: center;

      padding: 20px;

      background:
        rgba(15,23,42,.65);

    }


    .rankpilot-login-card {

      position: relative;

      width: min(430px,100%);

      background: white;

      border-radius: 20px;

      padding: 35px;

      box-shadow:
        0 30px 80px
        rgba(0,0,0,.25);

    }


    .rankpilot-login-close {

      position: absolute;

      top: 12px;

      right: 16px;

      border: none;

      background: none;

      font-size: 28px;

      cursor: pointer;

    }


    .rankpilot-login-label {

      color: #6366f1;

      font-size: 12px;

      font-weight: 800;

      letter-spacing: .12em;

    }


    .rankpilot-login-card h2 {

      margin-bottom: 6px;

    }


    .rankpilot-login-card p {

      color: #6b7280;

    }


    .rankpilot-login-card form {

      display: flex;

      flex-direction: column;

      gap: 12px;

      margin-top: 25px;

    }


    .rankpilot-login-card input {

      width: 100%;

      padding: 13px;

      border:
        1px solid #d1d5db;

      border-radius: 9px;

      font-size: 14px;

    }


    .rankpilot-login-card form button {

      border: none;

      background: #111827;

      color: white;

      padding: 13px;

      border-radius: 9px;

      font-weight: 700;

      cursor: pointer;

    }


    .rankpilot-login-card small {

      display: block;

      margin-top: 20px;

      color: #6b7280;

      line-height: 1.5;

    }

  `;


  document.head.appendChild(
    style
  );

}


/* =========================================================
   MI CUENTA
========================================================= */

function openRankPilotAccount() {

  let modal =
    document.getElementById(
      "rankpilotAccountModal"
    );


  if (!modal) {

    modal =
      document.createElement(
        "div"
      );


    modal.id =
      "rankpilotAccountModal";


    modal.className =
      "rankpilot-account-modal";


    document.body.appendChild(
      modal
    );

  }


  const account =
    getRankPilotAccount();


  const currentPlan =
    account.plan ||
    "Starter";


  modal.innerHTML = `

    <div class="rankpilot-modal-overlay">

      <div class="rankpilot-modal-card">

        <button
          class="rankpilot-close"
          onclick="closeRankPilotAccount()"
        >
          ×
        </button>


        <div class="rankpilot-dashboard-header">

          <span>
            MI CUENTA
          </span>

          <h2>
            ${escapeHtml(
              account.name ||
              "Tu cuenta"
            )}
          </h2>

          <p>
            ${escapeHtml(
              account.email ||
              ""
            )}
          </p>

        </div>


        <div class="rankpilot-account-current">

          <span>
            PLAN ACTUAL
          </span>

          <strong>
            ${escapeHtml(
              currentPlan
            )}
          </strong>

        </div>


        <h3>
          Planes de RankPilot
        </h3>


        <div class="rankpilot-plan-grid">

          ${Object
            .values(
              RANKPILOT_PLANS
            )
            .map(
              plan => `

                <div
                  class="rankpilot-plan-card ${
                    currentPlan ===
                    plan.name
                      ? "active"
                      : ""
                  }"
                >

                  <span>
                    ${escapeHtml(
                      plan.name
                    )}
                  </span>

                  <strong>
                    ${plan.price}€
                    <small>/mes</small>
                  </strong>

                  <p>
                    ${escapeHtml(
                      plan.description
                    )}
                  </p>

                  <button
                    onclick="rankPilotSelectPlan('${plan.name}')"
                  >
                    ${
                      currentPlan ===
                      plan.name
                        ? "Plan actual"
                        : "Seleccionar"
                    }
                  </button>

                </div>

              `
            )
            .join("")}

        </div>


        <div class="rankpilot-account-note">

          Los planes y pagos reales se conectarán
          posteriormente mediante backend y Stripe.

        </div>

      </div>

    </div>

  `;


  modal.style.display =
    "block";


  document.body.style.overflow =
    "hidden";


  injectAccountStyles();

}


function closeRankPilotAccount() {

  const modal =
    document.getElementById(
      "rankpilotAccountModal"
    );


  if (modal) {

    modal.style.display =
      "none";

  }


  document.body.style.overflow =
    "";

}


function rankPilotSelectPlan(
  planName
) {

  if (
    !RANKPILOT_PLANS[
      planName
    ]
  ) {

    return;

  }


  const account =
    getRankPilotAccount();


  account.plan =
    planName;


  saveRankPilotAccount(
    account
  );


  closeRankPilotAccount();

  openRankPilotAccount();

}


function injectAccountStyles() {

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

    .rankpilot-account-current {

      display: flex;

      justify-content: space-between;

      align-items: center;

      padding: 18px;

      background: #f8fafc;

      border-radius: 12px;

      margin: 20px 0 30px;

    }


    .rankpilot-account-current span {

      color: #6b7280;

      font-size: 12px;

      font-weight: 700;

    }


    .rankpilot-plan-grid {

      display: grid;

      grid-template-columns:
        repeat(3,1fr);

      gap: 15px;

      margin-top: 15px;

    }


    .rankpilot-plan-card {

      border:
        1px solid #e5e7eb;

      border-radius: 14px;

      padding: 20px;

    }


    .rankpilot-plan-card.active {

      border:
        2px solid #6366f1;

    }


    .rankpilot-plan-card > span {

      font-weight: 800;

    }


    .rankpilot-plan-card > strong {

      display: block;

      font-size: 30px;

      margin: 12px 0;

    }


    .rankpilot-plan-card small {

      font-size: 13px;

      font-weight: 400;

    }


    .rankpilot-plan-card p {

      color: #6b7280;

      min-height: 45px;

    }


    .rankpilot-plan-card button {

      width: 100%;

      padding: 10px;

      border: none;

      background: #111827;

      color: white;

      border-radius: 8px;

      cursor: pointer;

    }


    .rankpilot-account-note {

      margin-top: 25px;

      color: #6b7280;

      font-size: 13px;

      line-height: 1.5;

    }


    @media(max-width:750px) {

      .rankpilot-plan-grid {

        grid-template-columns: 1fr;

      }

    }

  `;


  document.head.appendChild(
    style
  );

}


/* =========================================================
   LOGOUT
========================================================= */

function logoutRankPilot() {

  const account =
    getRankPilotAccount();


  saveRankPilotAccount({

    loggedIn: false,

    name:
      account.name || "",

    email:
      account.email || "",

    plan:
      account.plan ||
      "Starter"

  });


  const menu =
    document.getElementById(
      "rankpilotAccountMenu"
    );


  if (menu) {

    menu.classList.remove(
      "open"
    );

  }


  updateHeaderAccount();

}


/* =========================================================
   FECHA
========================================================= */

function formatDate(
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

  } catch {

    return "";

  }

}


/* =========================================================
   INICIALIZACIÓN
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    createDashboardButton();

    /*
      Limpieza definitiva de cualquier
      botón flotante antiguo.
    */

    const oldButton =
      document.getElementById(
        "rankpilotAccountButton"
      );


    if (oldButton) {
      oldButton.remove();
    }


    document
      .querySelectorAll(
        ".rankpilot-floating-login, " +
        ".rankpilot-floating-account, " +
        "#rankpilotAccountButtonContainer"
      )
      .forEach(
        element =>
          element.remove()
      );

  }
);

/* =========================================================
   RANKPILOT — CREAR CUENTA
   ========================================================= */

(function () {

    let registerModalCreated = false;

    /* =====================================================
       BUSCAR EL MENÚ DE CUENTA
    ===================================================== */

    function getAccountMenu() {

        return (
            document.getElementById("rankpilotAccountMenu") ||
            document.querySelector(".rankpilot-account-menu") ||
            document.querySelector("[data-rankpilot-account-menu]")
        );

    }


    /* =====================================================
       INSERTAR CREAR CUENTA
    ===================================================== */

    function addRegisterOption() {

        const menu = getAccountMenu();

        if (!menu) {
            return false;
        }

        // Ya existe
        if (
            document.getElementById(
                "rankpilotRegisterMenuItem"
            )
        ) {
            return true;
        }


        const registerButton =
            document.createElement("button");


        registerButton.id =
            "rankpilotRegisterMenuItem";


        registerButton.type =
            "button";


        registerButton.className =
            "rankpilot-account-menu-item";


        registerButton.innerHTML = `
            <span style="font-size:16px;">✨</span>
            <span>Crear cuenta</span>
        `;


        registerButton.style.cssText = `
            width:100%;
            display:flex;
            align-items:center;
            gap:10px;
            padding:10px 14px;
            border:0;
            background:transparent;
            color:inherit;
            font:inherit;
            text-align:left;
            cursor:pointer;
        `;


        registerButton.addEventListener(
            "mouseenter",
            function () {

                registerButton.style.background =
                    "rgba(99,102,241,.08)";

            }
        );


        registerButton.addEventListener(
            "mouseleave",
            function () {

                registerButton.style.background =
                    "transparent";

            }
        );


        registerButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                if (
                    menu.classList.contains("open")
                ) {
                    menu.classList.remove("open");
                }

                if (
                    typeof window.rankPilotOpenRegister ===
                    "function"
                ) {
                    window.rankPilotOpenRegister();
                }

            }
        );


        /*
         * Lo ponemos al principio del menú.
         */

        menu.insertBefore(
            registerButton,
            menu.firstChild
        );


        return true;

    }


    /* =====================================================
       MODAL
    ===================================================== */

    function createRegisterModal() {

        if (
            document.getElementById(
                "rankpilotRegisterModal"
            )
        ) {
            registerModalCreated = true;
            return;
        }


        const modal =
            document.createElement("div");


        modal.id =
            "rankpilotRegisterModal";


        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:999999;
            display:none;
            align-items:center;
            justify-content:center;
            padding:20px;
        `;


        modal.innerHTML = `

            <div
                id="rankpilotRegisterOverlay"
                style="
                    position:absolute;
                    inset:0;
                    background:rgba(15,23,42,.65);
                    backdrop-filter:blur(6px);
                "
            ></div>


            <div
                style="
                    position:relative;
                    z-index:2;
                    width:100%;
                    max-width:450px;
                    max-height:calc(100vh - 40px);
                    overflow:auto;
                    background:#fff;
                    border-radius:20px;
                    padding:32px;
                    box-shadow:0 25px 70px rgba(0,0,0,.25);
                    box-sizing:border-box;
                "
            >

                <button
                    type="button"
                    id="rankpilotRegisterClose"
                    style="
                        position:absolute;
                        top:12px;
                        right:16px;
                        border:0;
                        background:none;
                        font-size:28px;
                        color:#64748b;
                        cursor:pointer;
                    "
                >
                    ×
                </button>


                <div style="text-align:center;margin-bottom:25px;">

                    <div
                        style="
                            width:46px;
                            height:46px;
                            margin:0 auto 14px;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            border-radius:12px;
                            background:#111827;
                            color:white;
                            font-size:22px;
                            font-weight:800;
                        "
                    >
                        R
                    </div>


                    <h2
                        style="
                            margin:0 0 8px;
                            color:#0f172a;
                            font-size:26px;
                        "
                    >
                        Crear tu cuenta
                    </h2>


                    <p
                        style="
                            margin:0;
                            color:#64748b;
                            font-size:14px;
                            line-height:1.5;
                        "
                    >
                        Crea tu cuenta gratuita de RankPilot.
                    </p>

                </div>


                <form id="rankpilotRegisterForm">

                    <div style="margin-bottom:16px;">

                        <label
                            style="
                                display:block;
                                margin-bottom:6px;
                                font-size:14px;
                                font-weight:600;
                                color:#334155;
                            "
                        >
                            Nombre
                        </label>

                        <input
                            id="rankpilotRegisterName"
                            type="text"
                            placeholder="Álvaro"
                            required
                            style="
                                width:100%;
                                box-sizing:border-box;
                                padding:12px 14px;
                                border:1px solid #dbe2ea;
                                border-radius:10px;
                                font-size:15px;
                            "
                        >

                    </div>


                    <div style="margin-bottom:16px;">

                        <label
                            style="
                                display:block;
                                margin-bottom:6px;
                                font-size:14px;
                                font-weight:600;
                                color:#334155;
                            "
                        >
                            Email
                        </label>

                        <input
                            id="rankpilotRegisterEmail"
                            type="email"
                            placeholder="tu@email.com"
                            required
                            style="
                                width:100%;
                                box-sizing:border-box;
                                padding:12px 14px;
                                border:1px solid #dbe2ea;
                                border-radius:10px;
                                font-size:15px;
                            "
                        >

                    </div>


                    <div style="margin-bottom:16px;">

                        <label
                            style="
                                display:block;
                                margin-bottom:6px;
                                font-size:14px;
                                font-weight:600;
                                color:#334155;
                            "
                        >
                            Contraseña
                        </label>

                        <input
                            id="rankpilotRegisterPassword"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            minlength="8"
                            required
                            style="
                                width:100%;
                                box-sizing:border-box;
                                padding:12px 14px;
                                border:1px solid #dbe2ea;
                                border-radius:10px;
                                font-size:15px;
                            "
                        >

                    </div>


                    <div style="margin-bottom:16px;">

                        <label
                            style="
                                display:block;
                                margin-bottom:6px;
                                font-size:14px;
                                font-weight:600;
                                color:#334155;
                            "
                        >
                            Repetir contraseña
                        </label>

                        <input
                            id="rankpilotRegisterPassword2"
                            type="password"
                            placeholder="Repite tu contraseña"
                            minlength="8"
                            required
                            style="
                                width:100%;
                                box-sizing:border-box;
                                padding:12px 14px;
                                border:1px solid #dbe2ea;
                                border-radius:10px;
                                font-size:15px;
                            "
                        >

                    </div>


                    <label
                        style="
                            display:flex;
                            gap:8px;
                            align-items:flex-start;
                            margin-bottom:16px;
                            color:#64748b;
                            font-size:13px;
                            line-height:1.5;
                        "
                    >

                        <input
                            id="rankpilotRegisterTerms"
                            type="checkbox"
                            required
                        >

                        <span>
                            Acepto los términos y condiciones
                            y la política de privacidad.
                        </span>

                    </label>


                    <div
                        id="rankpilotRegisterMessage"
                        style="
                            min-height:20px;
                            margin-bottom:10px;
                            text-align:center;
                            font-size:13px;
                        "
                    ></div>


                    <button
                        type="submit"
                        style="
                            width:100%;
                            padding:13px;
                            border:0;
                            border-radius:10px;
                            background:#4f46e5;
                            color:white;
                            font-size:15px;
                            font-weight:600;
                            cursor:pointer;
                        "
                    >
                        Crear cuenta
                    </button>

                </form>


                <div
                    style="
                        margin-top:20px;
                        padding-top:18px;
                        border-top:1px solid #e5e7eb;
                        text-align:center;
                        color:#64748b;
                        font-size:14px;
                    "
                >

                    ¿Ya tienes una cuenta?

                    <button
                        type="button"
                        id="rankpilotRegisterLogin"
                        style="
                            border:0;
                            background:none;
                            color:#4f46e5;
                            font-weight:600;
                            cursor:pointer;
                        "
                    >
                        Iniciar sesión
                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(modal);

        registerModalCreated = true;


        /* =================================================
           CERRAR
           ================================================= */

        document
            .getElementById(
                "rankpilotRegisterClose"
            )
            .addEventListener(
                "click",
                closeRegister
            );


        document
            .getElementById(
                "rankpilotRegisterOverlay"
            )
            .addEventListener(
                "click",
                closeRegister
            );


        /* =================================================
           REGISTRO
           ================================================= */

        document
            .getElementById(
                "rankpilotRegisterForm"
            )
            .addEventListener(
                "submit",
                registerUser
            );


        /* =================================================
           IR A LOGIN
           ================================================= */

        document
            .getElementById(
                "rankpilotRegisterLogin"
            )
            .addEventListener(
                "click",
                function () {

                    closeRegister();

                    const loginModal =
                        document.getElementById(
                            "rankpilotLoginModal"
                        );

                    if (loginModal) {

                        loginModal.style.display =
                            "flex";

                        loginModal.classList.add(
                            "open"
                        );

                        return;
                    }


                    const loginBtn =
                        document.getElementById(
                            "loginBtn"
                        );

                    if (loginBtn) {
                        loginBtn.click();
                    }

                }
            );

    }


    /* =====================================================
       ABRIR
       ===================================================== */

    function openRegister() {

        if (!registerModalCreated) {
            createRegisterModal();
        }


        const modal =
            document.getElementById(
                "rankpilotRegisterModal"
            );


        if (!modal) {
            return;
        }


        modal.style.display = "flex";


        document.body.style.overflow = "hidden";


        setTimeout(function () {

            const input =
                document.getElementById(
                    "rankpilotRegisterName"
                );

            if (input) {
                input.focus();
            }

        }, 100);

    }


    /* =====================================================
       CERRAR
       ===================================================== */

    function closeRegister() {

        const modal =
            document.getElementById(
                "rankpilotRegisterModal"
            );


        if (!modal) {
            return;
        }


        modal.style.display = "none";


        document.body.style.overflow = "";

    }


    /* =====================================================
       CREAR USUARIO
       ===================================================== */

    function registerUser(event) {

        event.preventDefault();


        const name =
            document
                .getElementById(
                    "rankpilotRegisterName"
                )
                .value
                .trim();


        const email =
            document
                .getElementById(
                    "rankpilotRegisterEmail"
                )
                .value
                .trim()
                .toLowerCase();


        const password =
            document.getElementById(
                "rankpilotRegisterPassword"
            ).value;


        const password2 =
            document.getElementById(
                "rankpilotRegisterPassword2"
            ).value;


        const terms =
            document.getElementById(
                "rankpilotRegisterTerms"
            ).checked;


        const message =
            document.getElementById(
                "rankpilotRegisterMessage"
            );


        function error(text) {

            message.textContent = text;
            message.style.color = "#dc2626";

        }


        if (!name) {
            error("Introduce tu nombre.");
            return;
        }


        if (!email) {
            error("Introduce un email.");
            return;
        }


        if (password.length < 8) {

            error(
                "La contraseña debe tener al menos 8 caracteres."
            );

            return;

        }


        if (password !== password2) {

            error(
                "Las contraseñas no coinciden."
            );

            return;

        }


        if (!terms) {

            error(
                "Debes aceptar los términos y condiciones."
            );

            return;

        }


        /*
         * CUENTA DEMO
         *
         * Más adelante sustituiremos esto por
         * autenticación real + base de datos.
         */

        const account = {

            name: name,

            email: email,

            password: password,

            plan: "starter",

            loggedIn: true,

            createdAt:
                new Date().toISOString()

        };


        localStorage.setItem(
            "rankpilot_account_v1",
            JSON.stringify(account)
        );


        message.textContent =
            "✓ Cuenta creada correctamente.";

        message.style.color =
            "#16a34a";


        /*
         * Actualizar cabecera
         */

        if (
            typeof window.rankPilotRefreshAccountUI ===
            "function"
        ) {

            window.rankPilotRefreshAccountUI();

        } else {

            const loginBtn =
                document.getElementById(
                    "loginBtn"
                );

            if (loginBtn) {

                loginBtn.textContent =
                    name.split(" ")[0] + " ▾";

            }

        }


        setTimeout(
            function () {

                closeRegister();

                document
                    .getElementById(
                        "rankpilotRegisterForm"
                    )
                    .reset();

                message.textContent = "";

            },
            700
        );

    }


    /* =====================================================
       EXPONER FUNCIÓN
       ===================================================== */

    window.rankPilotOpenRegister =
        openRegister;


    /* =====================================================
       CREAR MODAL CUANDO CARGA
       ===================================================== */

    function initialize() {

        createRegisterModal();

        addRegisterOption();


        /*
         * El menú de cuenta puede ser creado por otro
         * bloque de app.js después de este código.
         *
         * Por eso lo vigilamos.
         */

        const observer =
            new MutationObserver(
                function () {

                    addRegisterOption();

                }
            );


        if (document.body) {

            observer.observe(
                document.body,
                {
                    childList: true,
                    subtree: true
                }
            );

        }

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }

})();
