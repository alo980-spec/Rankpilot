const WORKER_URL = "https://rankpilot-api.alvaroalvarezmonteagudo.workers.dev/";

const form = document.getElementById("seoForm");
const input = document.getElementById("urlInput");
const message = document.getElementById("analyzerMessage");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  let url = input.value.trim();

  if (!url) {
    message.innerHTML = "❌ Introduce una URL.";
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  message.innerHTML = `
    <div class="seo-loading">
      <strong>⏳ Analizando web...</strong>
      <p>Estamos revisando factores técnicos, contenido e indexabilidad.</p>
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

    const seo = data.seo;
    const categories = seo.categories;

    const scoreClass =
      seo.score >= 80
        ? "good"
        : seo.score >= 60
        ? "medium"
        : "bad";

    message.innerHTML = `
      <div class="seo-result">

        <!-- SCORE PRINCIPAL -->

        <div class="seo-score-card">

          <div class="score-circle ${scoreClass}">
            <span>${seo.score}</span>
            <small>/100</small>
          </div>

          <div class="score-info">
            <h2>SEO Score</h2>
            <p>${data.finalUrl}</p>
          </div>

        </div>


        <!-- CATEGORÍAS -->

        <div class="seo-categories">

          <div class="seo-category">
            <span>Technical SEO</span>
            <strong>${categories.technical}/100</strong>
          </div>

          <div class="seo-category">
            <span>On-Page SEO</span>
            <strong>${categories.onPage}/100</strong>
          </div>

          <div class="seo-category">
            <span>Content</span>
            <strong>${categories.content}/100</strong>
          </div>

          <div class="seo-category">
            <span>Indexability</span>
            <strong>${categories.indexability}/100</strong>
          </div>

        </div>


        <!-- RESUMEN -->

        <div class="seo-section">

          <h3>📊 Resumen SEO</h3>

          <div class="seo-grid">

            <div>
              <span>Title</span>
              <strong>
                ${seo.title || "❌ No encontrado"}
              </strong>
              <small>
                ${seo.titleLength} caracteres
              </small>
            </div>

            <div>
              <span>Meta description</span>
              <strong>
                ${seo.description || "❌ No encontrada"}
              </strong>
              <small>
                ${seo.descriptionLength} caracteres
              </small>
            </div>

            <div>
              <span>H1</span>
              <strong>${seo.h1Count}</strong>
            </div>

            <div>
              <span>H2</span>
              <strong>${seo.h2Count}</strong>
            </div>

            <div>
              <span>H3</span>
              <strong>${seo.h3Count}</strong>
            </div>

            <div>
              <span>Palabras</span>
              <strong>${seo.wordCount}</strong>
            </div>

            <div>
              <span>Imágenes</span>
              <strong>${seo.imageCount}</strong>
            </div>

            <div>
              <span>Imágenes sin ALT</span>
              <strong>${seo.imagesWithoutAlt}</strong>
            </div>

            <div>
              <span>Enlaces internos</span>
              <strong>${seo.internalLinks}</strong>
            </div>

            <div>
              <span>Enlaces externos</span>
              <strong>${seo.externalLinks}</strong>
            </div>

          </div>

        </div>


        <!-- TÉCNICO -->

        <div class="seo-section">

          <h3>⚙️ Technical SEO</h3>

          <ul class="seo-checklist">

            <li>
              ${seo.hasHttps ? "✅" : "❌"}
              HTTPS
            </li>

            <li>
              ${seo.hasViewport ? "✅" : "❌"}
              Mobile viewport
            </li>

            <li>
              ${seo.hasCanonical ? "✅" : "❌"}
              Canonical
            </li>

            <li>
              ${seo.hasRobots ? "✅" : "⚠️"}
              Robots
            </li>

            <li>
              ${seo.hasFavicon ? "✅" : "⚠️"}
              Favicon
            </li>

            <li>
              ${seo.hasSchema ? "✅" : "⚠️"}
              Datos estructurados
            </li>

            <li>
              ${seo.hasOpenGraph ? "✅" : "⚠️"}
              Open Graph
            </li>

            <li>
              ${seo.hasTwitterCard ? "✅" : "⚠️"}
              Twitter Card
            </li>

            <li>
              ${seo.language
                ? `✅ Idioma: ${seo.language}`
                : "⚠️ Idioma no detectado"}
            </li>

          </ul>

        </div>


        <!-- PROBLEMAS -->

        ${
          seo.issues.length > 0
            ? `
              <div class="seo-section seo-issues">

                <h3>❌ Problemas importantes</h3>

                <ul>
                  ${seo.issues
                    .map(
                      (item) =>
                        `<li>${item}</li>`
                    )
                    .join("")}
                </ul>

              </div>
            `
            : `
              <div class="seo-section seo-success">

                <h3>🎉 No se han detectado problemas críticos</h3>

              </div>
            `
        }


        <!-- RECOMENDACIONES -->

        ${
          seo.warnings.length > 0
            ? `
              <div class="seo-section">

                <h3>⚠️ Recomendaciones</h3>

                <ul>
                  ${seo.warnings
                    .map(
                      (item) =>
                        `<li>${item}</li>`
                    )
                    .join("")}
                </ul>

              </div>
            `
            : ""
        }


        <!-- CORRECTO -->

        ${
          seo.passed.length > 0
            ? `
              <div class="seo-section">

                <h3>✅ Correctamente configurado</h3>

                <ul>
                  ${seo.passed
                    .map(
                      (item) =>
                        `<li>${item}</li>`
                    )
                    .join("")}
                </ul>

              </div>
            `
            : ""
        }

      </div>
    `;
  } catch (error) {
    console.error(error);

    message.innerHTML = `
      <div class="seo-error">
        ❌ No hemos podido analizar la web.
        <br>
        <small>${error.message}</small>
      </div>
    `;
  }
});
