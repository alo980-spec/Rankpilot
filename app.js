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

      <h3>Analizando ${url}</h3>

      <p>
        Revisando SEO técnico, contenido,
        indexabilidad y keywords...
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
        data.error ||
        "No se pudo analizar la web."
      );

    }


    const seo = data.seo;

    const categories = seo.categories;

    const keywords = seo.keywords || [];


    /* =========================
       STATUS
       ========================= */

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


    const criticalCount =
      seo.issues.length;


    const warningCount =
      seo.warnings.length;


    /* =========================
       KEYWORDS HTML
       ========================= */

    const keywordsHTML =
      keywords.length

        ? `

          <div class="keywords-card">

            <div class="keywords-header">

              <div>

                <span>KEYWORD INTELLIGENCE</span>

                <h2>
                  Keywords detectadas
                </h2>

                <p>
                  Términos principales encontrados
                  en el contenido de esta página.
                </p>

              </div>

              <div class="keywords-count">

                <strong>
                  ${keywords.length}
                </strong>

                <span>
                  términos
                </span>

              </div>

            </div>


            <div class="keywords-table-wrapper">

              <table class="keywords-table">

                <thead>

                  <tr>

                    <th>
                      Keyword
                    </th>

                    <th>
                      Apariciones
                    </th>

                    <th>
                      Relevancia
                    </th>

                    <th>
                      Tipo
                    </th>

                    <th>
                      Detectada en
                    </th>

                  </tr>

                </thead>


                <tbody>

                  ${keywords
                    .map((keyword) => {

                      const typeClass =
                        keyword.type === "long-tail"
                          ? "long-tail"
                          : keyword.type === "frase"
                          ? "phrase"
                          : "keyword";


                      return `

                        <tr>

                          <td>

                            <strong>
                              ${escapeHTML(
                                keyword.term
                              )}
                            </strong>

                          </td>


                          <td>

                            <span class="keyword-count">

                              ${keyword.count}

                            </span>

                          </td>


                          <td>

                            <div class="keyword-score">

                              <div class="keyword-score-bar">

                                <div
                                  class="keyword-score-fill"
                                  style="width:${keyword.score}%"
                                ></div>

                              </div>

                              <span>
                                ${keyword.score}
                              </span>

                            </div>

                          </td>


                          <td>

                            <span
                              class="keyword-type ${typeClass}"
                            >

                              ${
                                keyword.type === "long-tail"
                                  ? "Long-tail"
                                  : keyword.type === "frase"
                                  ? "Frase"
                                  : "Keyword"
                              }

                            </span>

                          </td>


                          <td>

                            <div class="keyword-locations">

                              ${
                                keyword.locations &&
                                keyword.locations.length

                                  ? keyword.locations
                                      .map(
                                        location => `

                                          <span>
                                            ${formatLocation(
                                              location
                                            )}
                                          </span>

                                        `
                                      )
                                      .join("")

                                  : `
                                      <span>
                                        Contenido
                                      </span>
                                    `
                              }

                            </div>

                          </td>

                        </tr>

                      `;

                    })
                    .join("")}

                </tbody>

              </table>

            </div>


            <div class="keywords-note">

              <span>💡</span>

              <p>

                Estas keywords se han detectado
                directamente en el contenido de la página.
                El análisis no incluye todavía volumen de
                búsqueda ni posiciones reales en Google.

              </p>

            </div>

          </div>

        `

        : `

          <div class="keywords-card">

            <div class="empty-state">

              🔎 No se han detectado suficientes
              keywords relevantes.

            </div>

          </div>

        `;


    /* =========================
       RESULTADOS
       ========================= */

    message.innerHTML = `

      <div class="seo-dashboard">


        <!-- HEADER -->

        <div class="results-header">

          <div>

            <span class="results-label">
              ANÁLISIS SEO
            </span>

            <h2>
              ${new URL(data.finalUrl).hostname}
            </h2>

            <p>
              ${data.finalUrl}
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

          <div
            class="score-ring ${getStatus(seo.score)}"
          >

            <div class="score-ring-inner">

              <strong>
                ${seo.score}
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
              ${getLabel(seo.score)}
            </h2>

            <p>
              Tu página ha sido analizada
              en múltiples factores técnicos,
              de contenido e indexabilidad.
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
                            ${issue}
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

                  🎉 No se han detectado
                  problemas críticos.

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
                            ${warning}
                          </strong>

                          <p>
                            Es una oportunidad
                            para mejorar el SEO
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


        <!-- DATOS ON PAGE -->

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


        <!-- KEYWORD INTELLIGENCE -->

        ${keywordsHTML}


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
                ${seo.passed.length}
                comprobaciones superadas
              </p>

            </div>

          </div>


          <div class="passed-list">

            ${seo.passed
              .map(
                (item) => `

                  <div>
                    ✓ ${item}
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
          ${error.message}
        </p>

      </div>

    `;

  }

});


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
            ${name}
          </strong>

          <p>
            ${description}
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
          style="width:${score}%"
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
        ${name}
      </span>

      <strong>
        ${value}
      </strong>

      <small>
        ${subtitle}
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
        class="${passed
          ? "tech-good"
          : "tech-bad"}"
      >

        ${passed ? "✓" : "!"}

      </span>


      <strong>
        ${name}
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


/* =========================================================
   FIX BUTTON
   ========================================================= */

function showFix(button) {

  const fix =
    button.parentElement.querySelector(
      ".fix-content"
    );


  if (fix) {

    fix.classList.toggle(
      "visible"
    );

  }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

  return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


/* =========================================================
   KEYWORD LOCATION
   ========================================================= */

function formatLocation(location) {

  const names = {

    title: "Title",

    heading: "H1/H2",

    description: "Meta",

    contenido: "Contenido"

  };


  return (
    names[location] ||
    location
  );

}

