const WORKER_URL = "https://rankpilot-api.alvaroalvarezmonteagudo.workers.dev/";

const form = document.getElementById("seoForm");
const input = document.getElementById("urlInput");
const message = document.getElementById("analyzerMessage");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  let url = input.value.trim();

  if (!url) {
    message.innerHTML = `<div class="seo-error">❌ Introduce una URL.</div>`;
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  message.innerHTML = `
    <div class="seo-loading">
      <div class="loading-spinner"></div>
      <h3>Analizando ${url}</h3>
      <p>Revisando SEO técnico, contenido e indexabilidad...</p>
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
    const categories = seo.categories;

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

    const criticalCount = seo.issues.length;
    const warningCount = seo.warnings.length;

    message.innerHTML = `
      <div class="seo-dashboard">

        <!-- HEADER -->

        <div class="results-header">

          <div>
            <span class="results-label">ANÁLISIS SEO</span>

            <h2>
              ${new URL(data.finalUrl).hostname}
            </h2>

            <p>${data.finalUrl}</p>
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
              técnicos y de contenido.
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

                          <strong>${issue}</strong>

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

                          <strong>${warning}</strong>

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

          ${metric("Title", seo.title || "No encontrado", seo.titleLength + " caracteres")}

          ${metric(
            "Meta Description",
            seo.description || "No encontrada",
            seo.descriptionLength + " caracteres"
          )}

          ${metric("H1", seo.h1Count, "etiquetas")}

          ${metric("H2", seo.h2Count, "etiquetas")}

          ${metric("H3", seo.h3Count, "etiquetas")}

          ${metric("Contenido", seo.wordCount, "palabras")}

          ${metric("Imágenes", seo.imageCount, "total")}

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

          ${technicalItem("HTTPS", seo.hasHttps)}

          ${technicalItem("Viewport", seo.hasViewport)}

          ${technicalItem("Canonical", seo.hasCanonical)}

          ${technicalItem("Robots", seo.hasRobots)}

          ${technicalItem("Favicon", seo.hasFavicon)}

          ${technicalItem("Schema", seo.hasSchema)}

          ${technicalItem("Open Graph", seo.hasOpenGraph)}

          ${technicalItem("Twitter Card", seo.hasTwitterCard)}

        </div>


        <!-- CORRECTO -->

        <div class="passed-card">

          <div class="passed-header">
            <span>✓</span>
            <div>
              <strong>Elementos correctamente configurados</strong>
              <p>${seo.passed.length} comprobaciones superadas</p>
            </div>
          </div>

          <div class="passed-list">

            ${seo.passed
              .map(
                (item) => `
                  <div>✓ ${item}</div>
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
        <strong>❌ No hemos podido analizar la web.</strong>
        <p>${error.message}</p>
      </div>
    `;
  }
});


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
          <strong>${name}</strong>
          <p>${description}</p>
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


function metric(name, value, subtitle) {

  return `
    <div class="metric-card">

      <span>${name}</span>

      <strong>${value}</strong>

      <small>${subtitle}</small>

    </div>
  `;
}


function technicalItem(name, passed) {

  return `
    <div class="technical-item">

      <span class="${passed ? "tech-good" : "tech-bad"}">
        ${passed ? "✓" : "!"}
      </span>

      <strong>${name}</strong>

      <span>
        ${passed ? "Correcto" : "Revisar"}
      </span>

    </div>
  `;
}


function showFix(button) {

  const fix = button.parentElement.querySelector(
    ".fix-content"
  );

  if (fix) {
    fix.classList.toggle("visible");
  }
}
