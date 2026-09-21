const seoForm = document.getElementById("seoForm");
const urlInput = document.getElementById("urlInput");
const analyzerMessage = document.getElementById("analyzerMessage");

seoForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  let url = urlInput.value.trim();

  if (!url) {
    showMessage("Introduce una URL para analizar.", "error");
    return;
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  showMessage("Analizando tu web...", "loading");

  try {
    const response = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      throw new Error("No se pudo acceder a la web.");
    }

    const html = await response.text();

    const parser = new DOMParser();
    const page = parser.parseFromString(html, "text/html");

    const title = page.querySelector("title")?.textContent.trim() || "";

    const description =
      page
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
        ?.trim() || "";

    const h1s = [...page.querySelectorAll("h1")];

    const images = [...page.querySelectorAll("img")];

    const imagesWithoutAlt = images.filter(
      (img) => !img.getAttribute("alt")?.trim()
    );

    const links = [...page.querySelectorAll("a")];

    const viewport = page.querySelector(
      'meta[name="viewport"]'
    );

    const canonical = page.querySelector(
      'link[rel="canonical"]'
    );

    const robots = page.querySelector(
      'meta[name="robots"]'
    );

    const data = {
      url,
      title,
      description,
      h1Count: h1s.length,
      images: images.length,
      imagesWithoutAlt: imagesWithoutAlt.length,
      links: links.length,
      viewport: !!viewport,
      canonical: !!canonical,
      robots: !!robots
    };

    calculateSEOScore(data);

  } catch (error) {
    console.error(error);

    showMessage(
      "No hemos podido analizar esta web. Prueba con otra URL.",
      "error"
    );
  }
});


function calculateSEOScore(data) {

  let score = 100;
  const issues = [];
  const warnings = [];
  const passed = [];

  // TITLE
  if (!data.title) {
    score -= 15;
    issues.push("La página no tiene Title.");
  } else if (data.title.length < 30) {
    score -= 5;
    warnings.push("El Title parece demasiado corto.");
  } else if (data.title.length > 60) {
    score -= 5;
    warnings.push("El Title puede ser demasiado largo.");
  } else {
    passed.push("Title correctamente configurado.");
  }

  // META DESCRIPTION
  if (!data.description) {
    score -= 15;
    issues.push("Falta la meta description.");
  } else if (data.description.length < 70) {
    score -= 5;
    warnings.push("La meta description parece demasiado corta.");
  } else {
    passed.push("Meta description encontrada.");
  }

  // H1
  if (data.h1Count === 0) {
    score -= 15;
    issues.push("No se ha encontrado ningún H1.");
  } else if (data.h1Count > 1) {
    score -= 5;
    warnings.push("La página tiene varios H1.");
  } else {
    passed.push("La página tiene un H1.");
  }

  // IMÁGENES
  if (data.imagesWithoutAlt > 0) {
    score -= Math.min(data.imagesWithoutAlt * 2, 10);

    issues.push(
      `${data.imagesWithoutAlt} imágenes no tienen atributo ALT.`
    );
  } else {
    passed.push("Las imágenes tienen ALT.");
  }

  // VIEWPORT
  if (!data.viewport) {
    score -= 10;
    issues.push("No se ha encontrado una configuración viewport.");
  } else {
    passed.push("Viewport configurado.");
  }

  // CANONICAL
  if (!data.canonical) {
    score -= 5;
    warnings.push("No se ha encontrado una URL canonical.");
  } else {
    passed.push("Canonical encontrada.");
  }

  // ROBOTS
  if (!data.robots) {
    warnings.push("No se ha encontrado una meta robots.");
  } else {
    passed.push("Meta robots encontrada.");
  }

  score = Math.max(0, score);

  displayResults(data, score, issues, warnings, passed);
}


function displayResults(data, score, issues, warnings, passed) {

  let scoreLabel = "Excelente";

  if (score < 90) scoreLabel = "Bueno";
  if (score < 75) scoreLabel = "Necesita mejoras";
  if (score < 50) scoreLabel = "Crítico";

  analyzerMessage.innerHTML = `
    <div class="audit-results">

      <div class="score-card">
        <div class="score-number">${score}</div>
        <div>
          <strong>/ 100</strong>
          <p>${scoreLabel}</p>
        </div>
      </div>

      <div class="audit-section">

        <h3>🔴 Problemas</h3>

        ${
          issues.length
            ? issues.map(issue => `<p>❌ ${issue}</p>`).join("")
            : "<p>✅ No se han detectado problemas críticos.</p>"
        }

      </div>

      <div class="audit-section">

        <h3>🟡 Advertencias</h3>

        ${
          warnings.length
            ? warnings.map(warning => `<p>⚠️ ${warning}</p>`).join("")
            : "<p>✅ No hay advertencias importantes.</p>"
        }

      </div>

      <div class="audit-section">

        <h3>🟢 Correcto</h3>

        ${
          passed.length
            ? passed.map(item => `<p>✓ ${item}</p>`).join("")
            : "<p>No hay elementos aprobados todavía.</p>"
        }

      </div>

    </div>
  `;
}


function showMessage(message, type) {

  analyzerMessage.textContent = message;

  if (type === "error") {
    analyzerMessage.style.color = "#ff6b6b";
  } else {
    analyzerMessage.style.color = "#98a2b3";
  }
}
