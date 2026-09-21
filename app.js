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

  message.innerHTML = "⏳ Analizando web...";

  try {
    const response = await fetch(
      `${WORKER_URL}?url=${encodeURIComponent(url)}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "No se pudo analizar la web.");
    }

    const seo = data.seo;

    message.innerHTML = `
      <div class="seo-result">

        <div class="seo-score">
          <div class="score-number">${seo.score}</div>
          <div>
            <strong>SEO Score</strong>
            <p>${data.finalUrl}</p>
          </div>
        </div>

        <div class="seo-section">
          <h3>📄 SEO On-Page</h3>

          <p>
            <strong>Title:</strong>
            ${seo.title || "❌ No encontrado"}
          </p>

          <p>
            <strong>Meta description:</strong>
            ${seo.description || "❌ No encontrada"}
          </p>

          <p>
            <strong>H1:</strong>
            ${seo.h1Count}
          </p>

          <p>
            <strong>Imágenes:</strong>
            ${seo.imageCount}
          </p>

          <p>
            <strong>Imágenes sin ALT:</strong>
            ${seo.imagesWithoutAlt}
          </p>

          <p>
            <strong>Enlaces:</strong>
            ${seo.linkCount}
          </p>
        </div>

        <div class="seo-section">
          <h3>⚙️ Configuración técnica</h3>

          <p>
            ${seo.hasViewport ? "✅" : "❌"}
            Meta viewport
          </p>

          <p>
            ${seo.hasCanonical ? "✅" : "❌"}
            Canonical
          </p>

          <p>
            ${seo.hasRobots ? "✅" : "⚠️"}
            Robots
          </p>

          <p>
            <strong>Idioma:</strong>
            ${seo.language || "No detectado"}
          </p>
        </div>

        ${
          seo.issues.length
            ? `
          <div class="seo-section">
            <h3>❌ Problemas</h3>
            <ul>
              ${seo.issues.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </div>
        `
            : ""
        }

        ${
          seo.warnings.length
            ? `
          <div class="seo-section">
            <h3>⚠️ Recomendaciones</h3>
            <ul>
              ${seo.warnings.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </div>
        `
            : ""
        }

        ${
          seo.passed.length
            ? `
          <div class="seo-section">
            <h3>✅ Correcto</h3>
            <ul>
              ${seo.passed.map((item) => `<li>${item}</li>`).join("")}
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
