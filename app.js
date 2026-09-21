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
    const documentPage = parser.parseFromString(html, "text/html");

    const title = documentPage.querySelector("title")?.textContent.trim() || "";
    const description =
      documentPage
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
        ?.trim() || "";

    const h1s = [...documentPage.querySelectorAll("h1")].map(
      (h1) => h1.textContent.trim()
    );

    const images = documentPage.querySelectorAll("img");
    const imagesWithoutAlt = [...images].filter(
      (img) => !img.getAttribute("alt")?.trim()
    );

    const links = documentPage.querySelectorAll("a");

    const results = {
      url,
      title,
      description,
      h1Count: h1s.length,
      h1s,
      images: images.length,
      imagesWithoutAlt: imagesWithoutAlt.length,
      links: links.length
    };

    displayResults(results);

  } catch (error) {
    console.error(error);

    showMessage(
      "No hemos podido analizar esta web. Prueba con otra URL.",
      "error"
    );
  }
});


function showMessage(message, type) {
  analyzerMessage.textContent = message;

  if (type === "error") {
    analyzerMessage.style.color = "#ff6b6b";
  } else {
    analyzerMessage.style.color = "#98a2b3";
  }
}


function displayResults(results) {
  analyzerMessage.innerHTML = `
    <div style="
      margin-top: 25px;
      padding: 25px;
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 16px;
      background: #0f1421;
      text-align: left;
    ">

      <h3 style="margin-bottom: 20px;">
        SEO Audit
      </h3>

      <p>
        <strong>URL:</strong> ${results.url}
      </p>

      <p>
        <strong>Title:</strong>
        ${results.title || "❌ No encontrado"}
      </p>

      <p>
        <strong>Meta description:</strong>
        ${results.description || "❌ No encontrada"}
      </p>

      <p>
        <strong>H1:</strong>
        ${results.h1Count}
      </p>

      <p>
        <strong>Imágenes:</strong>
        ${results.images}
      </p>

      <p>
        <strong>Imágenes sin ALT:</strong>
        ${results.imagesWithoutAlt}
      </p>

      <p>
        <strong>Enlaces:</strong>
        ${results.links}
      </p>

    </div>
  `;
}
