const WORKER_URL = "https://rankpilot-api.alvaroalvarezmonteagudo.workers.dev/";

const form = document.getElementById("seoForm");
const input = document.getElementById("urlInput");
const message = document.getElementById("analyzerMessage");

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

  message.innerHTML = `
    <div class="seo-loading">
      <div class="loading-spinner"></div>
      <h3>Analizando ${escapeHtml(url)}</h3>
      <p>Revisando SEO técnico, contenido, palabras clave e indexabilidad...</p>
    </div>
  `;

  try {
    const response = await fetch(
      `${WORKER_URL}?url=${encodeURIComponent(url)}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "No se pudo analizar la web.");
    }

    const seo = data.seo;
    const categories = seo.categories || {};

    const keywords = Array.isArray(seo.keywords)
      ? seo.keywords
      : [];

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

    const criticalCount = Array.isArray(seo.issues)
      ? seo.issues.length
      : 0;

    const warningCount = Array.isArray(seo.warnings)
      ? seo.warnings.length
      : 0;

    const primaryKeyword =
      keywords.find((keyword) => keyword.type === "primary") ||
      keywords[0] ||
      null;

    message.innerHTML = `
      <div class="seo-dashboard">

        <!-- HEADER -->

        <div class="results-header">

          <div>
            <span class="results-label">ANÁLISIS SEO</span>

            <h2>
              ${escapeHtml(new URL(data.finalUrl).hostname)}
            </h2>

            <p>${escapeHtml(data.finalUrl)}</p>
          </div>

          <button
            class="new-analysis"
            onclick="window.scrollTo({top: 0, behavior: 'smooth'})"
          >
            ← Nuevo análisis
          </button>

        </div>


        <!-- SCORE PRINCIPAL -->

        <div class="main-score-card">

          <div class="score-ring ${getStatus(seo.score)}">

            <div class="score-ring-inner">
              <strong>${seo.score}</strong>
              <span>/100</span>
            </div>

          </div>

          <div class="score-summary">

            <span class="score-label">SEO SCORE</span>

            <h2>${getLabel(seo.score)}</h2>

            <p>
              Tu página ha sido analizada en múltiples factores
              técnicos, de contenido y palabras clave.
            </p>

            <div class="score-stats">

              <span>
                🔴 ${criticalCount} problemas
              </span>

              <span>
                🟡 ${warningCount} recomendaciones
              </span>

              <span>
                🟢 ${seo.passed.length} correctos
              </span>

            </div>

          </div>

        </div>


        <!-- CATEGORÍAS -->

        <div class="section-title">

          <div>
            <span>PERFORMANCE</span>
            <h2>Desglose SEO</h2>
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


        <!-- KEYWORD INTELLIGENCE -->

        <div class="section-title">

          <div>
            <span>KEYWORD INTELLIGENCE</span>
            <h2>Palabras clave detectadas</h2>
          </div>

        </div>

        <div class="keyword-intelligence-card">

          <div class="keyword-summary">

            <div class="keyword-summary-main">

              <span class="keyword-summary-label">
                PALABRA CLAVE PRINCIPAL
              </span>

              ${
                primaryKeyword
                  ? `
                    <strong>
                      ${escapeHtml(primaryKeyword.keyword)}
                    </strong>

                    <p>
                      Detectada en
                      ${formatLocations(primaryKeyword.locations)}
                    </p>
                  `
                  : `
                    <strong>
                      No detectada
                    </strong>

                    <p>
                      RankPilot no ha encontrado una palabra clave
                      principal clara.
                    </p>
                  `
              }

            </div>

            <div class="keyword-summary-stat">

              <strong>${keywords.length}</strong>

              <span>keywords detectadas</span>

            </div>

          </div>


          ${
            keywords.length
              ? `
                <div class="keyword-list">

                  <div class="keyword-list-header">

                    <span>Keyword</span>
                    <span>Frecuencia</span>
                    <span>Score</span>
                    <span>Tipo</span>
                    <span>Ubicación</span>

                  </div>

                  ${keywords
                    .slice(0, 20)
                    .map((keyword, index) =>
                      keywordRow(keyword, index)
                    )
                    .join("")}

                </div>

                ${
                  keywords.length > 20
                    ? `
                      <div class="keyword-more">
                        Mostrando las 20 keywords con mayor relevancia
                        de ${keywords.length} detectadas.
                      </div>
                    `
                    : ""
                }

              `
              : `
                <div class="keyword-empty">

                  <strong>
                    No se han detectado palabras clave relevantes.
                  </strong>

                  <p>
                    Añade contenido textual y términos relacionados
                    con el tema principal de la página.
                  </p>

                </div>
              `
          }

        </div>


        <!-- PROBLEMAS -->

        <div class="section-title">

          <div>
            <span>PRIORIDADES</span>
            <h2>Qué deberías solucionar</h2>
          </div>

        </div>

        <div class="problems-card">

          ${
            seo.issues.length
              ? seo.issues
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
                            Este problema puede afectar al rendimiento
                            SEO de la página.
                          </p>

                        </div>

                        <button
                          class="fix-button"
                          onclick="showFix(this)"
                        >
                          Cómo solucionarlo
                        </button>

                        <div class="fix-content">
                          Revisa este elemento y corrígelo en el código
                          o CMS de tu página. Después vuelve a ejecutar
                          el análisis para comprobar el resultado.
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
            seo.warnings.length
              ? seo.warnings
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
                            Es una oportunidad para mejorar el SEO
                            de esta página.
                          </p>

                        </div>

                        <button
                          class="fix-button"
                          onclick="showFix(this)"
                        >
                          Cómo solucionarlo
                        </button>

                        <div class="fix-content">
                          Optimiza este elemento siguiendo las buenas
                          prácticas SEO y vuelve a analizar la página.
                        </div>

                      </div>
                    `
                  )
                  .join("")
              : ""
          }

        </div>


        <!-- DATOS ON PAGE -->

        <div class="section-title">

          <div>
            <span>ON-PAGE</span>
            <h2>Elementos de la página</h2>
          </div>

        </div>

        <div class="metrics-grid">

          ${metric(
            "Title",
            seo.title || "No encontrado",
            seo.titleLength + " caracteres"
          )}

          ${metric(
            "Meta Description",
            seo.description || "No encontrada",
            seo.descriptionLength + " caracteres"
          )}

          ${metric(
            "H1",
            seo.h1Count,
            "etiquetas"
          )}

          ${metric(
            "H2",
            seo.h2Count,
            "etiquetas"
          )}

          ${metric(
            "H3",
            seo.h3Count,
            "etiquetas"
          )}

          ${metric(
            "Contenido",
            seo.wordCount,
            "palabras"
          )}

          ${metric(
            "Imágenes",
            seo.imageCount,
            "total"
          )}

          ${metric(
            "Imágenes sin ALT",
            seo.imagesWithoutAlt,
            "sin atributo ALT"
          )}

          ${metric(
            "Enlaces internos",
            seo.internalLinks,
            "enlaces"
          )}

          ${metric(
            "Enlaces externos",
            seo.externalLinks,
            "enlaces"
          )}

        </div>


        <!-- TÉCNICO -->

        <div class="section-title">

          <div>
            <span>TECHNICAL</span>
            <h2>Configuración técnica</h2>
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

            <span>✓</span>

            <div>

              <strong>
                Elementos correctamente configurados
              </strong>

              <p>
                ${seo.passed.length} comprobaciones superadas
              </p>

            </div>

          </div>

          <div class="passed-list">

            ${seo.passed
              .map(
                (item) => `
                  <div>
                    ✓ ${escapeHtml(item)}
                  </div>
                `
              )
              .join("")}

          </div>

        </div>

      </div>
    `;

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
   CATEGORY CARD
========================================================= */

function categoryCard(name, score, description) {

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
          style="width:${score}%"
        ></div>

      </div>

    </div>
  `;
}


/* =========================================================
   METRIC
========================================================= */

function metric(name, value, subtitle) {

  return `
    <div class="metric-card">

      <span>
        ${escapeHtml(name)}
      </span>

      <strong>
        ${escapeHtml(String(value))}
      </strong>

      <small>
        ${escapeHtml(subtitle)}
      </small>

    </div>
  `;
}


/* =========================================================
   TECHNICAL ITEM
========================================================= */

function technicalItem(name, passed) {

  return `
    <div class="technical-item">

      <span class="${passed ? "tech-good" : "tech-bad"}">
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
   KEYWORD ROW
========================================================= */

function keywordRow(keyword, index) {

  const score = Number(keyword.score || 0);
  const count = Number(keyword.count || 0);

  const typeLabels = {
    primary: "Principal",
    title: "Title",
    heading: "H1",
    body: "Contenido"
  };

  const typeLabel =
    typeLabels[keyword.type] || "Keyword";

  const status =
    score >= 80
      ? "good"
      : score >= 60
      ? "warning"
      : "bad";

  const locations =
    Array.isArray(keyword.locations)
      ? keyword.locations
      : [];

  return `
    <div class="keyword-row">

      <div class="keyword-name">

        <span class="keyword-position">
          ${index + 1}
        </span>

        <strong>
          ${escapeHtml(keyword.keyword || "")}
        </strong>

      </div>


      <div class="keyword-frequency">

        <strong>
          ${count}
        </strong>

        <span>
          ${count === 1 ? "vez" : "veces"}
        </span>

      </div>


      <div class="keyword-score">

        <span class="keyword-score-value ${status}">
          ${score}
        </span>

      </div>


      <div class="keyword-type">

        <span class="keyword-type-badge ${keyword.type || ""}">
          ${typeLabel}
        </span>

      </div>


      <div class="keyword-locations">

        ${formatLocations(locations)}

      </div>

    </div>
  `;
}


/* =========================================================
   FORMAT LOCATIONS
========================================================= */

function formatLocations(locations) {

  if (!Array.isArray(locations) || !locations.length) {
    return `
      <span class="keyword-location-empty">
        Contenido
      </span>
    `;
  }

  const labels = {
    title: "Title",
    description: "Meta",
    h1: "H1",
    body: "Contenido"
  };

  return locations
    .map((location) => {
      const label =
        labels[location] ||
        location;

      return `
        <span class="keyword-location">
          ${escapeHtml(label)}
        </span>
      `;
    })
    .join("");
}


/* =========================================================
   SHOW FIX
========================================================= */

function showFix(button) {

  const fix = button.parentElement.querySelector(
    ".fix-content"
  );

  if (fix) {
    fix.classList.toggle("visible");
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

