const WORKER_URL =
  "https://rankpilot-api.alvaroalvarezmonteagudo.workers.dev/";

const form = document.getElementById("seoForm");
const input = document.getElementById("urlInput");
const message = document.getElementById("analyzerMessage");

let currentMainUrl = "";
let currentData = null;


/* =========================================================
   FORMULARIO PRINCIPAL
========================================================= */

if (form) {
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

    await analyzeWebsite(url);
  });
}


/* =========================================================
   ANALIZAR WEB
========================================================= */

async function analyzeWebsite(url, competitors = []) {

  message.innerHTML = `
    <div class="seo-loading">

      <div class="loading-spinner"></div>

      <h3>
        Analizando ${escapeHtml(url)}
      </h3>

      <p>
        Revisando SEO técnico, contenido, keywords e indexabilidad...
      </p>

    </div>
  `;

  try {

    const params = new URLSearchParams();

    params.set("url", url);

    competitors.forEach((competitor) => {
      params.append("competitor", competitor);
    });

    const response = await fetch(
      `${WORKER_URL}?${params.toString()}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "No se pudo analizar la web."
      );
    }

    currentData = data;
    currentMainUrl = url;

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
}


/* =========================================================
   RENDER PRINCIPAL
========================================================= */

function renderResults(data) {

  const seo = data.seo || {};

  const categories = seo.categories || {
    technical: 0,
    onPage: 0,
    content: 0,
    indexability: 0
  };

  const criticalCount =
    Array.isArray(seo.issues)
      ? seo.issues.length
      : 0;

  const warningCount =
    Array.isArray(seo.warnings)
      ? seo.warnings.length
      : 0;

  const passedCount =
    Array.isArray(seo.passed)
      ? seo.passed.length
      : 0;

  const hostname = getHostname(
    data.finalUrl || currentMainUrl
  );

  message.innerHTML = `

    <div class="seo-dashboard">

      <!-- =================================================
           HEADER
      ================================================== -->

      <div class="results-header">

        <div>

          <span class="results-label">
            ANÁLISIS SEO
          </span>

          <h2>
            ${escapeHtml(hostname)}
          </h2>

          <p>
            ${escapeHtml(data.finalUrl || currentMainUrl)}
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


      <!-- =================================================
           SCORE PRINCIPAL
      ================================================== -->

      <div class="main-score-card">

        <div class="score-ring ${getStatus(seo.score)}">

          <div class="score-ring-inner">

            <strong>
              ${Number(seo.score || 0)}
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
            Tu página ha sido analizada en múltiples
            factores técnicos, de contenido,
            keywords e indexabilidad.
          </p>


          <div class="score-stats">

            <span>
              🔴 ${criticalCount} problemas
            </span>

            <span>
              🟡 ${warningCount} recomendaciones
            </span>

            <span>
              🟢 ${passedCount} correctos
            </span>

          </div>

        </div>

      </div>


      <!-- =================================================
           COMPETIDORES
      ================================================== -->

      ${
        data.competitors &&
        data.competitors.length
          ? renderCompetitorAnalysis(
              data.competitorAnalysis,
              data.competitors
            )
          : renderCompetitorCTA()
      }


      <!-- =================================================
           ACTION PLAN
      ================================================== -->

      ${renderActionPlan(
        seo,
        data.competitorAnalysis || null,
        data.competitors || []
      )}


      <!-- =================================================
           KEYWORD INTELLIGENCE
      ================================================== -->

      ${renderKeywordIntelligence(seo)}


      <!-- =================================================
           KEYWORD RECOMMENDATIONS
      ================================================== -->

      ${renderKeywordRecommendations(seo)}


      <!-- =================================================
           CATEGORÍAS
      ================================================== -->

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


      <!-- =================================================
           PROBLEMAS
      ================================================== -->

      <div class="section-title">

        <div>

          <span>
            PRIORIDADES
          </span>

          <h2>
            Problemas detectados
          </h2>

        </div>

      </div>


      <div class="problems-card">

        ${
          criticalCount
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
          warningCount
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
                        buenas prácticas SEO y vuelve
                        a analizar la página.

                      </div>

                    </div>

                  `
                )
                .join("")
            : ""
        }

      </div>


      <!-- =================================================
           ON PAGE
      ================================================== -->

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
          `${Number(seo.titleLength || 0)} caracteres`
        )}

        ${metric(
          "Meta Description",
          seo.description || "No encontrada",
          `${Number(seo.descriptionLength || 0)} caracteres`
        )}

        ${metric(
          "H1",
          Number(seo.h1Count || 0),
          "etiquetas"
        )}

        ${metric(
          "H2",
          Number(seo.h2Count || 0),
          "etiquetas"
        )}

        ${metric(
          "H3",
          Number(seo.h3Count || 0),
          "etiquetas"
        )}

        ${metric(
          "Contenido",
          Number(seo.wordCount || 0),
          "palabras"
        )}

        ${metric(
          "Imágenes",
          Number(seo.imageCount || 0),
          "total"
        )}

        ${metric(
          "Imágenes sin ALT",
          Number(seo.imagesWithoutAlt || 0),
          "sin atributo ALT"
        )}

        ${metric(
          "Enlaces internos",
          Number(seo.internalLinks || 0),
          "enlaces"
        )}

        ${metric(
          "Enlaces externos",
          Number(seo.externalLinks || 0),
          "enlaces"
        )}

      </div>


      <!-- =================================================
           TECHNICAL
      ================================================== -->

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


      <!-- =================================================
           PASSED
      ================================================== -->

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
              ${passedCount} comprobaciones superadas
            </p>

          </div>

        </div>


        <div class="passed-list">

          ${
            seo.passed &&
            seo.passed.length
              ? seo.passed
                  .map(
                    (item) => `
                      <div>
                        ✓ ${escapeHtml(item)}
                      </div>
                    `
                  )
                  .join("")
              : `
                <div>
                  No hay comprobaciones disponibles.
                </div>
              `
          }

        </div>

      </div>

    </div>
  `;


  injectGlobalStyles();
}


/* =========================================================
   SEO ACTION PLAN
========================================================= */

function renderActionPlan(
  seo,
  competitorAnalysis = null,
  competitors = []
) {

  const actions = buildActionPlan(
    seo,
    competitorAnalysis,
    competitors
  );

  const high =
    actions.filter(
      action => action.priority === "high"
    );

  const medium =
    actions.filter(
      action => action.priority === "medium"
    );

  const opportunities =
    actions.filter(
      action => action.priority === "opportunity"
    );


  return `

    <section class="action-plan-section">

      <div class="section-title">

        <div>

          <span>
            ACTION PLAN
          </span>

          <h2>
            Plan de acción SEO
          </h2>

          <p>
            Prioriza las acciones que pueden tener
            mayor impacto sobre tu posicionamiento.
          </p>

        </div>

      </div>


      <div class="action-summary">

        <div class="action-summary-card high">

          <strong>
            ${high.length}
          </strong>

          <span>
            Alta prioridad
          </span>

        </div>


        <div class="action-summary-card medium">

          <strong>
            ${medium.length}
          </strong>

          <span>
            Prioridad media
          </span>

        </div>


        <div class="action-summary-card opportunity">

          <strong>
            ${opportunities.length}
          </strong>

          <span>
            Oportunidades
          </span>

        </div>


        <div class="action-summary-card total">

          <strong>
            ${actions.length}
          </strong>

          <span>
            Acciones detectadas
          </span>

        </div>

      </div>


      ${
        high.length
          ? `

            <div class="action-group">

              <div class="action-group-header high">

                <div>

                  <span class="action-group-icon">
                    🔴
                  </span>

                  <div>

                    <strong>
                      Alta prioridad
                    </strong>

                    <p>
                      Empieza por estas acciones.
                    </p>

                  </div>

                </div>

              </div>


              <div class="action-list">

                ${high
                  .map(
                    (action, index) =>
                      renderActionCard(
                        action,
                        index + 1
                      )
                  )
                  .join("")}

              </div>

            </div>

          `
          : ""
      }


      ${
        medium.length
          ? `

            <div class="action-group">

              <div class="action-group-header medium">

                <div>

                  <span class="action-group-icon">
                    🟡
                  </span>

                  <div>

                    <strong>
                      Prioridad media
                    </strong>

                    <p>
                      Mejoras que pueden reforzar tu SEO.
                    </p>

                  </div>

                </div>

              </div>


              <div class="action-list">

                ${medium
                  .map(
                    (action, index) =>
                      renderActionCard(
                        action,
                        index + 1
                      )
                  )
                  .join("")}

              </div>

            </div>

          `
          : ""
      }


      ${
        opportunities.length
          ? `

            <div class="action-group">

              <div class="action-group-header opportunity">

                <div>

                  <span class="action-group-icon">
                    🟢
                  </span>

                  <div>

                    <strong>
                      Oportunidades
                    </strong>

                    <p>
                      Nuevas posibilidades de crecimiento.
                    </p>

                  </div>

                </div>

              </div>


              <div class="action-list">

                ${opportunities
                  .map(
                    (action, index) =>
                      renderActionCard(
                        action,
                        index + 1
                      )
                  )
                  .join("")}

              </div>

            </div>

          `
          : ""
      }


      ${
        !actions.length
          ? `

            <div class="action-empty">

              <div>
                🎉
              </div>

              <strong>
                No hemos detectado acciones adicionales.
              </strong>

              <p>
                Tu página no presenta suficientes
                problemas para generar nuevas acciones.
              </p>

            </div>

          `
          : ""
      }

    </section>

  `;
}


function buildActionPlan(
  seo,
  competitorAnalysis,
  competitors
) {

  const actions = [];


  function addAction(
    priority,
    title,
    reason,
    fix,
    impact,
    category = "SEO"
  ) {

    actions.push({
      priority,
      title,
      reason,
      fix,
      impact,
      category
    });

  }


  /* =====================================================
     PROBLEMAS DEL WORKER
  ===================================================== */

  (seo.issues || []).forEach((issue) => {

    const text =
      String(issue).toLowerCase();


    let reason =
      "Este problema puede afectar negativamente al rendimiento SEO de la página.";

    let fix =
      "Revisa este elemento directamente en tu web o CMS y vuelve a ejecutar el análisis después de corregirlo.";

    let impact = "Alto";


    if (text.includes("title")) {

      reason =
        "El title ayuda a los buscadores a entender el tema principal de la página.";

      fix =
        "Crea un title único y descriptivo que incluya la temática principal de la página. Intenta mantenerlo aproximadamente entre 30 y 60 caracteres.";

    }


    else if (
      text.includes("description") ||
      text.includes("meta description")
    ) {

      reason =
        "La meta description ayuda a explicar el contenido de la página en los resultados de búsqueda.";

      fix =
        "Escribe una descripción única y atractiva que explique claramente qué ofrece la página.";

    }


    else if (text.includes("h1")) {

      reason =
        "El H1 ayuda a establecer el tema principal del contenido.";

      fix =
        "Utiliza un único H1 principal y haz que describa claramente el contenido de la página.";

    }


    else if (text.includes("https")) {

      reason =
        "HTTPS protege la conexión y forma parte de la configuración técnica básica de una web.";

      fix =
        "Instala o activa un certificado SSL y fuerza la versión HTTPS de la web.";

    }


    else if (text.includes("canonical")) {

      reason =
        "La canonical ayuda a los buscadores a identificar la versión principal de una URL.";

      fix =
        "Añade una etiqueta rel=\"canonical\" apuntando a la URL principal de la página.";

    }


    else if (text.includes("viewport")) {

      reason =
        "La configuración viewport es importante para una correcta visualización móvil.";

      fix =
        "Añade la etiqueta meta viewport estándar dentro del <head>.";

    }


    else if (text.includes("robots")) {

      reason =
        "La configuración robots puede afectar a cómo los buscadores rastrean la página.";

      fix =
        "Comprueba que robots.txt exista, sea accesible y no bloquee accidentalmente páginas importantes.";

    }


    else if (text.includes("schema")) {

      reason =
        "Los datos estructurados ayudan a los buscadores a interpretar determinados tipos de contenido.";

      fix =
        "Añade Schema.org en formato JSON-LD cuando exista un tipo de marcado relevante.";

      impact = "Medio";

    }


    else if (text.includes("alt")) {

      reason =
        "El texto ALT ayuda a describir las imágenes.";

      fix =
        "Añade atributos ALT descriptivos a las imágenes relevantes.";

    }


    addAction(
      "high",
      issue,
      reason,
      fix,
      impact,
      "SEO"
    );

  });


  /* =====================================================
     TITLE
  ===================================================== */

  const titleLength =
    Number(seo.titleLength || 0);


  if (!seo.title) {

    addAction(
      "high",
      "Crear el title SEO",
      "La página no tiene un título HTML identificable.",
      "Añade un <title> único, descriptivo y centrado en la intención principal de la página.",
      "Alto",
      "On-Page"
    );

  }

  else if (titleLength < 30) {

    addAction(
      "medium",
      "Ampliar el title",
      `El title tiene aproximadamente ${titleLength} caracteres y puede resultar demasiado corto.`,
      "Amplía el título para describir mejor el contenido y añade la temática principal de forma natural.",
      "Medio",
      "On-Page"
    );

  }

  else if (titleLength > 60) {

    addAction(
      "medium",
      "Reducir el title",
      `El title tiene aproximadamente ${titleLength} caracteres y puede aparecer truncado.`,
      "Reduce el título y conserva las palabras que mejor representan la intención de búsqueda.",
      "Medio",
      "On-Page"
    );

  }


  /* =====================================================
     META DESCRIPTION
  ===================================================== */

  const descriptionLength =
    Number(seo.descriptionLength || 0);


  if (!seo.description) {

    addAction(
      "high",
      "Crear la meta description",
      "La página no tiene una meta description identificable.",
      "Añade una descripción única que explique el contenido y anime al usuario a entrar.",
      "Medio",
      "On-Page"
    );

  }

  else if (descriptionLength < 70) {

    addAction(
      "medium",
      "Mejorar la meta description",
      `La descripción tiene aproximadamente ${descriptionLength} caracteres.`,
      "Hazla más descriptiva y orientada a la intención de búsqueda de la página.",
      "Medio",
      "On-Page"
    );

  }

  else if (descriptionLength > 160) {

    addAction(
      "medium",
      "Acortar la meta description",
      `La descripción tiene aproximadamente ${descriptionLength} caracteres.`,
      "Reduce el texto y coloca la información más importante al principio.",
      "Medio",
      "On-Page"
    );

  }


  /* =====================================================
     H1
  ===================================================== */

  const h1Count =
    Number(seo.h1Count || 0);


  if (h1Count === 0) {

    addAction(
      "high",
      "Añadir un H1",
      "La página no contiene una etiqueta H1.",
      "Añade un único H1 que describa claramente el tema principal.",
      "Alto",
      "On-Page"
    );

  }

  else if (h1Count > 1) {

    addAction(
      "medium",
      "Revisar los H1",
      `Se han detectado ${h1Count} etiquetas H1.`,
      "Revisa la estructura y conserva un H1 principal. Utiliza H2 y H3 para organizar las secciones.",
      "Medio",
      "On-Page"
    );

  }


  /* =====================================================
     CONTENIDO
  ===================================================== */

  const wordCount =
    Number(seo.wordCount || 0);


  if (wordCount < 300) {

    addAction(
      "medium",
      "Ampliar el contenido",
      `La página contiene aproximadamente ${wordCount} palabras.`,
      "Amplía el contenido con información realmente útil para la intención de búsqueda. No añadas texto únicamente para aumentar el número de palabras.",
      "Medio",
      "Content"
    );

  }


  /* =====================================================
     IMÁGENES ALT
  ===================================================== */

  const imagesWithoutAlt =
    Number(seo.imagesWithoutAlt || 0);


  if (imagesWithoutAlt > 0) {

    addAction(
      "medium",
      `Optimizar ${imagesWithoutAlt} imágenes sin ALT`,
      "Hay imágenes que no tienen atributo ALT.",
      "Añade textos ALT descriptivos a las imágenes relevantes.",
      "Medio",
      "On-Page"
    );

  }


  /* =====================================================
     ENLACES INTERNOS
  ===================================================== */

  const internalLinks =
    Number(seo.internalLinks || 0);


  if (internalLinks < 3) {

    addAction(
      "medium",
      "Aumentar los enlaces internos",
      `La página tiene aproximadamente ${internalLinks} enlaces internos.`,
      "Añade enlaces hacia páginas relacionadas e importantes de tu web utilizando textos de enlace descriptivos.",
      "Medio",
      "On-Page"
    );

  }


  /* =====================================================
     KEYWORD RECOMMENDATIONS
  ===================================================== */

  (seo.keywordRecommendations || [])
    .slice(0, 5)
    .forEach((recommendation) => {

      let keyword = "";

      if (typeof recommendation === "string") {

        keyword = recommendation;

      } else {

        keyword =
          recommendation.keyword ||
          recommendation.term ||
          "";

      }


      if (!keyword) {
        return;
      }


      addAction(
        "medium",
        `Trabajar la keyword "${keyword}"`,
        "El análisis de contenido ha detectado una oportunidad relacionada con esta temática.",
        `Integra "${keyword}" de forma natural en títulos, encabezados, contenido y enlaces internos cuando sea relevante.`,
        "Medio",
        "Keywords"
      );

    });


  /* =====================================================
     COMPETITOR GAP
  ===================================================== */

  if (
    competitorAnalysis &&
    competitorAnalysis.enabled &&
    Array.isArray(
      competitorAnalysis.opportunities
    )
  ) {

    competitorAnalysis.opportunities
      .slice(0, 10)
      .forEach((opportunity) => {

        if (!opportunity.keyword) {
          return;
        }


        const competitorCount =
          opportunity.competitorCount || 1;


        addAction(
          "opportunity",
          `Atacar la keyword "${opportunity.keyword}"`,
          `${competitorCount} competidor${competitorCount > 1 ? "es" : ""} analizado${competitorCount > 1 ? "s" : ""} aparece${competitorCount > 1 ? "n" : ""} para esta temática y tu web no la está trabajando actualmente.`,
          `Crea o mejora una página relevante para "${opportunity.keyword}". Comprueba primero la intención de búsqueda.`,
          "Oportunidad",
          "Competitor Gap"
        );

      });

  }


  /* =====================================================
     TECHNICAL
  ===================================================== */

  const technicalChecks = [

    {
      key: "hasCanonical",
      title: "Implementar canonical",
      reason: "No se ha detectado una canonical.",
      fix: "Añade una canonical que apunte a la URL principal de la página.",
      impact: "Medio"
    },

    {
      key: "hasSchema",
      title: "Añadir datos estructurados",
      reason: "No se ha detectado Schema.org.",
      fix: "Implementa JSON-LD cuando exista un marcado apropiado para el contenido.",
      impact: "Medio"
    },

    {
      key: "hasOpenGraph",
      title: "Configurar Open Graph",
      reason: "La página no parece tener Open Graph correctamente configurado.",
      fix: "Añade og:title, og:description y og:image.",
      impact: "Bajo"
    },

    {
      key: "hasTwitterCard",
      title: "Configurar Twitter Card",
      reason: "No se ha detectado una configuración de Twitter Card.",
      fix: "Añade las meta etiquetas necesarias para controlar la apariencia al compartir contenido.",
      impact: "Bajo"
    }

  ];


  technicalChecks.forEach(
    (check) => {

      if (seo[check.key] === false) {

        addAction(
          check.impact === "Bajo"
            ? "opportunity"
            : "medium",
          check.title,
          check.reason,
          check.fix,
          check.impact,
          "Technical SEO"
        );

      }

    }
  );


  /* =====================================================
     ORDEN
  ===================================================== */

  const priorityOrder = {

    high: 1,

    medium: 2,

    opportunity: 3

  };


  actions.sort(
    (a, b) =>
      priorityOrder[a.priority] -
      priorityOrder[b.priority]
  );


  /* =====================================================
     ELIMINAR DUPLICADOS
  ===================================================== */

  const unique = [];

  const seen = new Set();


  actions.forEach(
    (action) => {

      const key =
        action.title
          .toLowerCase()
          .trim();


      if (!seen.has(key)) {

        seen.add(key);

        unique.push(action);

      }

    }
  );


  return unique.slice(0, 30);
}


function renderActionCard(
  action,
  number
) {

  const priorityLabel =
    action.priority === "high"
      ? "ALTA"
      : action.priority === "medium"
      ? "MEDIA"
      : "OPORTUNIDAD";


  return `

    <div class="action-card">

      <div class="action-number">
        ${number}
      </div>


      <div class="action-main">

        <div class="action-card-top">

          <div>

            <span class="action-category">
              ${escapeHtml(action.category)}
            </span>

            <h3>
              ${escapeHtml(action.title)}
            </h3>

          </div>


          <span
            class="action-priority ${action.priority}"
          >
            ${priorityLabel}
          </span>

        </div>


        <div class="action-detail">

          <div class="action-detail-block">

            <span>
              POR QUÉ IMPORTA
            </span>

            <p>
              ${escapeHtml(action.reason)}
            </p>

          </div>


          <div class="action-detail-block">

            <span>
              CÓMO SOLUCIONARLO
            </span>

            <p>
              ${escapeHtml(action.fix)}
            </p>

          </div>


          <div class="action-impact">

            <span>
              IMPACTO POTENCIAL
            </span>

            <strong
              class="${action.priority}"
            >
              ${escapeHtml(action.impact)}
            </strong>

          </div>

        </div>

      </div>

    </div>

  `;
}


/* =========================================================
   KEYWORD INTELLIGENCE
========================================================= */

function renderKeywordIntelligence(seo) {

  const keywords =
    Array.isArray(seo.keywords)
      ? seo.keywords
      : [];


  if (!keywords.length) {

    return "";

  }


  const primary =
    seo.primaryKeyword || "";


  return `

    <section class="keyword-section">

      <div class="section-title">

        <div>

          <span>
            KEYWORD INTELLIGENCE
          </span>

          <h2>
            Inteligencia de keywords
          </h2>

        </div>

      </div>


      <div class="keyword-dashboard">

        <div class="keyword-primary">

          <span>
            KEYWORD PRINCIPAL
          </span>

          <strong>
            ${escapeHtml(primary || "No detectada")}
          </strong>

        </div>


        <div class="keyword-count">

          <strong>
            ${keywords.length}
          </strong>

          <span>
            keywords detectadas
          </span>

        </div>

      </div>


      <div class="keyword-table-wrapper">

        <table class="keyword-table">

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

            </tr>

          </thead>


          <tbody>

            ${keywords
              .slice(0, 20)
              .map(
                (item) => {

                  const keyword =
                    typeof item === "string"
                      ? item
                      : item.keyword || "";

                  const count =
                    typeof item === "object"
                      ? item.count ||
                        item.frequency ||
                        0
                      : 0;

                  return `

                    <tr>

                      <td>
                        <strong>
                          ${escapeHtml(keyword)}
                        </strong>
                      </td>

                      <td>
                        ${count}
                      </td>

                      <td>
                        <span class="keyword-badge">
                          ${getKeywordTypeLabel(
                            keyword,
                            primary
                          )}
                        </span>
                      </td>

                    </tr>

                  `;

                }
              )
              .join("")}

          </tbody>

        </table>

      </div>

    </section>

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

    <section class="keyword-recommendations">

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


      <div class="recommendation-grid">

        ${recommendations
          .slice(0, 12)
          .map(
            (recommendation) => {

              const keyword =
                typeof recommendation === "string"
                  ? recommendation
                  : recommendation.keyword ||
                    recommendation.term ||
                    "";

              const reason =
                typeof recommendation === "object"
                  ? recommendation.reason ||
                    recommendation.recommendation ||
                    "Keyword relevante detectada en el contenido."
                  : "Keyword relevante detectada en el contenido.";


              return `

                <div class="recommendation-card">

                  <div class="recommendation-icon">
                    ✦
                  </div>

                  <div>

                    <strong>
                      ${escapeHtml(keyword)}
                    </strong>

                    <p>
                      ${escapeHtml(reason)}
                    </p>

                  </div>

                </div>

              `;

            }
          )
          .join("")}

      </div>

    </section>

  `;
}


/* =========================================================
   COMPETITOR CTA
========================================================= */

function renderCompetitorCTA() {

  return `

    <section class="competitor-section">

      <div class="competitor-cta">

        <div>

          <span class="competitor-label">
            COMPETITOR ANALYSIS
          </span>

          <h2>
            ¿Quieres comparar tu web?
          </h2>

          <p>
            Descubre qué keywords están trabajando
            tus competidores y tú todavía no.
          </p>

        </div>


        <button
          class="competitor-button"
          onclick="openCompetitorForm()"
        >
          Comparar con competidores →
        </button>

      </div>


      <div
        id="competitorForm"
        class="competitor-form"
        style="display:none;"
      >

        <div class="competitor-form-header">

          <div>

            <span>
              HASTA 3 COMPETIDORES
            </span>

            <h3>
              Introduce las webs que quieres comparar
            </h3>

          </div>

        </div>


        <div class="competitor-inputs">

          <input
            id="competitor1"
            type="text"
            placeholder="https://competidor1.com"
          />

          <input
            id="competitor2"
            type="text"
            placeholder="https://competidor2.com"
          />

          <input
            id="competitor3"
            type="text"
            placeholder="https://competidor3.com"
          />

        </div>


        <button
          class="competitor-run-button"
          onclick="runCompetitorAnalysis()"
        >
          Analizar competidores →
        </button>

      </div>

    </section>

  `;
}


/* =========================================================
   ABRIR FORMULARIO COMPETIDORES
========================================================= */

function openCompetitorForm() {

  const form =
    document.getElementById(
      "competitorForm"
    );


  if (!form) {
    return;
  }


  form.style.display = "block";


  setTimeout(() => {

    form.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  }, 50);

}


/* =========================================================
   EJECUTAR COMPETIDORES
========================================================= */

async function runCompetitorAnalysis() {

  const inputs = [
    document.getElementById("competitor1"),
    document.getElementById("competitor2"),
    document.getElementById("competitor3")
  ];


  let competitors = inputs
    .filter(Boolean)
    .map(
      input => input.value.trim()
    )
    .filter(Boolean);


  if (!competitors.length) {

    alert(
      "Introduce al menos un competidor."
    );

    return;

  }


  competitors =
    competitors.map(normalizeUrl);


  const mainNormalized =
    normalizeUrl(currentMainUrl);


  competitors =
    competitors.filter(
      (url, index, array) =>
        url !== mainNormalized &&
        array.indexOf(url) === index
    );


  if (!competitors.length) {

    alert(
      "Los competidores deben ser diferentes de tu propia web."
    );

    return;

  }


  await analyzeWebsite(
    currentMainUrl,
    competitors.slice(0, 3)
  );

}


/* =========================================================
   COMPETITOR RESULTS
========================================================= */

function renderCompetitorAnalysis(
  competitorAnalysis,
  competitors
) {

  if (
    !competitorAnalysis ||
    !competitorAnalysis.enabled
  ) {

    return renderCompetitorCTA();

  }


  const competitorList =
    Array.isArray(competitors)
      ? competitors
      : [];


  const opportunities =
    Array.isArray(
      competitorAnalysis.opportunities
    )
      ? competitorAnalysis.opportunities
      : [];


  const sharedKeywords =
    Array.isArray(
      competitorAnalysis.sharedKeywords
    )
      ? competitorAnalysis.sharedKeywords
      : [];


  const uniqueKeywords =
    Array.isArray(
      competitorAnalysis.uniqueKeywords
    )
      ? competitorAnalysis.uniqueKeywords
      : [];


  return `

    <section class="competitor-results">

      <div class="section-title">

        <div>

          <span>
            COMPETITOR ANALYSIS
          </span>

          <h2>
            Análisis competitivo
          </h2>

          <p>
            Comparación de tu web frente a
            ${competitorList.length} competidor${competitorList.length > 1 ? "es" : ""}.
          </p>

        </div>

      </div>


      <div class="competitor-cards">

        ${competitorList
          .map(
            (competitor, index) => {

              const result =
                Array.isArray(
                  currentData?.competitors
                )
                  ? currentData.competitors[index]
                  : null;

              const seo =
                result?.seo || null;


              return `

                <div class="competitor-card">

                  <div class="competitor-card-top">

                    <span>
                      COMPETIDOR ${index + 1}
                    </span>

                    <strong>
                      ${escapeHtml(
                        getHostname(
                          result?.finalUrl ||
                          competitor
                        )
                      )}
                    </strong>

                  </div>


                  ${
                    seo
                      ? `

                        <div class="competitor-score">

                          <strong>
                            ${Number(seo.score || 0)}
                          </strong>

                          <span>
                            /100 SEO
                          </span>

                        </div>

                      `
                      : `

                        <div class="competitor-error">
                          No se pudo analizar
                        </div>

                      `
                  }

                </div>

              `;

            }
          )
          .join("")}

      </div>


      <!-- KEYWORD GAP -->

      <div class="competitor-subsection">

        <div class="competitor-subtitle">

          <span>
            KEYWORD GAP
          </span>

          <h3>
            Oportunidades de keywords
          </h3>

          <p>
            Keywords detectadas en competidores
            que no aparecen en tu web.
          </p>

        </div>


        ${
          opportunities.length
            ? `

              <div class="keyword-table-wrapper">

                <table class="keyword-table">

                  <thead>

                    <tr>

                      <th>
                        Keyword
                      </th>

                      <th>
                        Competidores
                      </th>

                      <th>
                        Mejor score
                      </th>

                      <th>
                        Oportunidad
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    ${opportunities
                      .slice(0, 20)
                      .map(
                        (item) => `

                          <tr>

                            <td>

                              <strong>
                                ${escapeHtml(
                                  item.keyword
                                )}
                              </strong>

                            </td>

                            <td>
                              ${Number(
                                item.competitorCount || 0
                              )}
                            </td>

                            <td>
                              ${Number(
                                item.bestScore || 0
                              )}
                            </td>

                            <td>

                              <span
                                class="opportunity-badge"
                              >
                                ${Number(
                                  item.opportunityScore || 0
                                )}
                              </span>

                            </td>

                          </tr>

                        `
                      )
                      .join("")}

                  </tbody>

                </table>

              </div>

            `
            : `

              <div class="empty-state">
                No se han detectado keywords exclusivas de los competidores.
              </div>

            `
        }

      </div>


      <!-- SHARED -->

      ${
        sharedKeywords.length
          ? `

            <div class="competitor-subsection">

              <div class="competitor-subtitle">

                <span>
                  SHARED KEYWORDS
                </span>

                <h3>
                  Keywords compartidas
                </h3>

              </div>


              <div class="keyword-table-wrapper">

                <table class="keyword-table">

                  <thead>

                    <tr>

                      <th>
                        Keyword
                      </th>

                      <th>
                        Tu score
                      </th>

                      <th>
                        Competidor
                      </th>

                      <th>
                        Diferencia
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    ${sharedKeywords
                      .slice(0, 20)
                      .map(
                        (item) => `

                          <tr>

                            <td>
                              <strong>
                                ${escapeHtml(
                                  item.keyword
                                )}
                              </strong>
                            </td>

                            <td>
                              ${Number(
                                item.ownScore || 0
                              )}
                            </td>

                            <td>
                              ${Number(
                                item.competitorScore || 0
                              )}
                            </td>

                            <td>

                              ${
                                Number(
                                  item.difference || 0
                                ) >= 0
                                  ? `<span class="keyword-positive">
                                      +${Number(
                                        item.difference || 0
                                      )}
                                    </span>`
                                  : `<span class="keyword-negative">
                                      ${Number(
                                        item.difference || 0
                                      )}
                                    </span>`
                              }

                            </td>

                          </tr>

                        `
                      )
                      .join("")}

                  </tbody>

                </table>

              </div>

            </div>

          `
          : ""
      }


      <!-- UNIQUE -->

      ${
        uniqueKeywords.length
          ? `

            <div class="competitor-subsection">

              <div class="competitor-subtitle">

                <span>
                  YOUR KEYWORDS
                </span>

                <h3>
                  Keywords propias
                </h3>

              </div>


              <div class="keyword-chips">

                ${uniqueKeywords
                  .slice(0, 30)
                  .map(
                    (item) => `

                      <span class="keyword-chip">

                        ${escapeHtml(
                          item.keyword
                        )}

                        <small>
                          ${Number(
                            item.ownScore || 0
                          )}
                        </small>

                      </span>

                    `
                  )
                  .join("")}

              </div>

            </div>

          `
          : ""
      }

    </section>

  `;
}


/* =========================================================
   CATEGORY CARD
========================================================= */

function categoryCard(
  name,
  score,
  description
) {

  score = Number(score || 0);


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


        <span
          class="category-score ${status}"
        >
          ${score}
        </span>

      </div>


      <div class="progress-bar">

        <div
          class="progress-fill ${status}"
          style="width:${Math.min(
            100,
            Math.max(0, score)
          )}%"
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
        ${escapeHtml(name)}
      </span>

      <strong>
        ${escapeHtml(value)}
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


/* =========================================================
   FIX
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
   SCORE STATUS
========================================================= */

function getStatus(score) {

  score = Number(score || 0);


  if (score >= 80) {
    return "good";
  }


  if (score >= 60) {
    return "warning";
  }


  return "bad";
}


/* =========================================================
   SCORE LABEL
========================================================= */

function getLabel(score) {

  score = Number(score || 0);


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


/* =========================================================
   KEYWORD TYPE
========================================================= */

function getKeywordTypeLabel(
  keyword,
  primary
) {

  if (
    primary &&
    keyword.toLowerCase() ===
      primary.toLowerCase()
  ) {

    return "Principal";

  }


  return "Relevante";
}


/* =========================================================
   NORMALIZE URL
========================================================= */

function normalizeUrl(url) {

  let normalized =
    String(url || "")
      .trim();


  if (!/^https?:\/\//i.test(normalized)) {

    normalized =
      "https://" + normalized;

  }


  try {

    const parsed =
      new URL(normalized);


    return (
      parsed.protocol.toLowerCase() +
      "//" +
      parsed.hostname.toLowerCase() +
      (
        parsed.pathname !== "/"
          ? parsed.pathname.replace(/\/$/, "")
          : ""
      )
    );

  } catch {

    return normalized
      .toLowerCase()
      .replace(/\/$/, "");

  }

}


/* =========================================================
   HOSTNAME
========================================================= */

function getHostname(url) {

  try {

    return new URL(url).hostname;

  } catch {

    return String(url || "")
      .replace(/^https?:\/\//i, "")
      .split("/")[0];

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


/* =========================================================
   ESTILOS
========================================================= */

function injectGlobalStyles() {

  if (
    document.getElementById(
      "rankpilot-extra-styles"
    )
  ) {

    return;

  }


  const style =
    document.createElement("style");


  style.id =
    "rankpilot-extra-styles";


  style.textContent = `

    /* =====================================================
       ACTION PLAN
    ===================================================== */

    .action-plan-section {
      margin-top: 42px;
      margin-bottom: 42px;
    }


    .action-plan-section
    .section-title {
      margin-bottom: 20px;
    }


    .action-plan-section
    .section-title p {
      margin-top: 7px;
      color: #8b8f98;
      font-size: 14px;
    }


    .action-summary {
      display: grid;
      grid-template-columns:
        repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }


    .action-summary-card {
      padding: 20px;
      border:
        1px solid rgba(255,255,255,.08);
      border-radius: 16px;
      background:
        rgba(255,255,255,.025);
    }


    .action-summary-card strong {
      display: block;
      font-size: 30px;
      line-height: 1;
      margin-bottom: 8px;
    }


    .action-summary-card span {
      color: #9297a2;
      font-size: 13px;
    }


    .action-summary-card.high strong {
      color: #ff6b6b;
    }


    .action-summary-card.medium strong {
      color: #f3c969;
    }


    .action-summary-card.opportunity strong {
      color: #66d99a;
    }


    .action-summary-card.total strong {
      color: #ffffff;
    }


    .action-group {
      margin-bottom: 26px;
    }


    .action-group-header {
      padding: 17px 20px;
      border:
        1px solid rgba(255,255,255,.08);
      border-bottom: 0;
      border-radius: 16px 16px 0 0;
      background:
        rgba(255,255,255,.025);
    }


    .action-group-header > div {
      display: flex;
      align-items: center;
      gap: 13px;
    }


    .action-group-icon {
      font-size: 19px;
    }


    .action-group-header strong {
      font-size: 15px;
    }


    .action-group-header p {
      margin: 4px 0 0;
      color: #858a96;
      font-size: 12px;
    }


    .action-list {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }


    .action-card {
      display: flex;
      gap: 18px;
      padding: 22px;
      background:
        rgba(255,255,255,.018);
      border:
        1px solid rgba(255,255,255,.07);
      border-top: 0;
    }


    .action-card:last-child {
      border-radius:
        0 0 16px 16px;
    }


    .action-number {
      flex: 0 0 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background:
        rgba(255,255,255,.07);
      color: #fff;
      font-weight: 700;
      font-size: 13px;
    }


    .action-main {
      flex: 1;
      min-width: 0;
    }


    .action-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
    }


    .action-category {
      display: inline-block;
      margin-bottom: 7px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: #858a96;
    }


    .action-card h3 {
      margin: 0;
      color: #fff;
      font-size: 16px;
      line-height: 1.35;
    }


    .action-priority {
      flex-shrink: 0;
      padding: 6px 9px;
      border-radius: 999px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .07em;
    }


    .action-priority.high {
      background:
        rgba(255,107,107,.12);
      color: #ff8585;
    }


    .action-priority.medium {
      background:
        rgba(243,201,105,.12);
      color: #f3c969;
    }


    .action-priority.opportunity {
      background:
        rgba(102,217,154,.12);
      color: #66d99a;
    }


    .action-detail {
      display: grid;
      grid-template-columns:
        minmax(0, 1fr)
        minmax(0, 1fr)
        130px;
      gap: 22px;
      margin-top: 19px;
      padding-top: 18px;
      border-top:
        1px solid rgba(255,255,255,.06);
    }


    .action-detail-block span,
    .action-impact span {
      display: block;
      margin-bottom: 7px;
      color: #737985;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .08em;
    }


    .action-detail-block p {
      margin: 0;
      color: #aeb2bb;
      font-size: 13px;
      line-height: 1.6;
    }


    .action-impact {
      padding-left: 18px;
      border-left:
        1px solid rgba(255,255,255,.07);
    }


    .action-impact strong {
      font-size: 14px;
    }


    .action-impact strong.high {
      color: #ff8585;
    }


    .action-impact strong.medium {
      color: #f3c969;
    }


    .action-impact strong.opportunity {
      color: #66d99a;
    }


    .action-empty {
      padding: 45px 20px;
      text-align: center;
      border:
        1px solid rgba(255,255,255,.08);
      border-radius: 16px;
      background:
        rgba(255,255,255,.02);
    }


    .action-empty > div {
      font-size: 30px;
      margin-bottom: 10px;
    }


    .action-empty strong {
      color: #fff;
    }


    .action-empty p {
      color: #858a96;
      font-size: 13px;
      margin-top: 8px;
    }


    /* =====================================================
       COMPETITOR
    ===================================================== */

    .competitor-section,
    .competitor-results {
      margin-top: 38px;
      margin-bottom: 38px;
    }


    .competitor-cta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 25px;
      padding: 28px;
      border:
        1px solid rgba(255,255,255,.08);
      border-radius: 18px;
      background:
        linear-gradient(
          135deg,
          rgba(255,255,255,.035),
          rgba(255,255,255,.015)
        );
    }


    .competitor-label,
    .competitor-card-top span,
    .competitor-subtitle span {
      display: block;
      color: #7e8490;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .1em;
    }


    .competitor-cta h2 {
      margin: 7px 0;
      color: #fff;
      font-size: 21px;
    }


    .competitor-cta p {
      margin: 0;
      color: #9095a0;
      font-size: 13px;
    }


    .competitor-button,
    .competitor-run-button {
      border: 0;
      border-radius: 10px;
      padding: 13px 18px;
      background: #fff;
      color: #111;
      font-weight: 700;
      cursor: pointer;
    }


    .competitor-form {
      margin-top: 12px;
      padding: 25px;
      border:
        1px solid rgba(255,255,255,.08);
      border-radius: 18px;
      background:
        rgba(255,255,255,.02);
    }


    .competitor-form-header {
      margin-bottom: 18px;
    }


    .competitor-form-header span {
      color: #7e8490;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .1em;
    }


    .competitor-form-header h3 {
      margin: 7px 0 0;
      color: #fff;
      font-size: 16px;
    }


    .competitor-inputs {
      display: grid;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 14px;
    }


    .competitor-inputs input {
      width: 100%;
      box-sizing: border-box;
      padding: 13px 14px;
      border:
        1px solid rgba(255,255,255,.09);
      border-radius: 9px;
      background:
        rgba(255,255,255,.035);
      color: #fff;
      outline: none;
    }


    .competitor-run-button {
      width: 100%;
    }


    .competitor-cards {
      display: grid;
      grid-template-columns:
        repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 30px;
    }


    .competitor-card {
      padding: 20px;
      border:
        1px solid rgba(255,255,255,.08);
      border-radius: 16px;
      background:
        rgba(255,255,255,.025);
    }


    .competitor-card-top strong {
      display: block;
      margin-top: 7px;
      color: #fff;
      font-size: 15px;
      word-break: break-all;
    }


    .competitor-score {
      display: flex;
      align-items: baseline;
      gap: 5px;
      margin-top: 20px;
    }


    .competitor-score strong {
      color: #fff;
      font-size: 34px;
    }


    .competitor-score span {
      color: #858a96;
      font-size: 12px;
    }


    .competitor-subsection {
      margin-top: 28px;
    }


    .competitor-subtitle {
      margin-bottom: 15px;
    }


    .competitor-subtitle h3 {
      margin: 7px 0 4px;
      color: #fff;
      font-size: 17px;
    }


    .competitor-subtitle p {
      margin: 0;
      color: #858a96;
      font-size: 12px;
    }


    .keyword-table-wrapper {
      overflow-x: auto;
      border:
        1px solid rgba(255,255,255,.07);
      border-radius: 15px;
    }


    .keyword-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 600px;
    }


    .keyword-table th {
      padding: 13px 15px;
      text-align: left;
      color: #707580;
      font-size: 9px;
      letter-spacing: .08em;
      text-transform: uppercase;
      border-bottom:
        1px solid rgba(255,255,255,.07);
    }


    .keyword-table td {
      padding: 14px 15px;
      color: #aeb2bb;
      font-size: 13px;
      border-bottom:
        1px solid rgba(255,255,255,.05);
    }


    .keyword-table tr:last-child td {
      border-bottom: 0;
    }


    .keyword-table td strong {
      color: #fff;
    }


    .keyword-badge,
    .opportunity-badge {
      display: inline-block;
      padding: 5px 8px;
      border-radius: 999px;
      background:
        rgba(255,255,255,.06);
      color: #b9bdc6;
      font-size: 10px;
    }


    .opportunity-badge {
      color: #66d99a;
      background:
        rgba(102,217,154,.1);
    }


    .keyword-positive {
      color: #66d99a;
    }


    .keyword-negative {
      color: #ff8585;
    }


    .keyword-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }


    .keyword-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border:
        1px solid rgba(255,255,255,.07);
      border-radius: 999px;
      color: #d4d7dd;
      background:
        rgba(255,255,255,.025);
      font-size: 12px;
    }


    .keyword-chip small {
      color: #858a96;
    }


    /* =====================================================
       KEYWORD INTELLIGENCE
    ===================================================== */

    .keyword-section,
    .keyword-recommendations {
      margin-top: 38px;
      margin-bottom: 38px;
    }


    .keyword-dashboard {
      display: grid;
      grid-template-columns:
        2fr 1fr;
      gap: 14px;
      margin-bottom: 18px;
    }


    .keyword-primary,
    .keyword-count {
      padding: 22px;
      border:
        1px solid rgba(255,255,255,.08);
      border-radius: 16px;
      background:
        rgba(255,255,255,.025);
    }


    .keyword-primary span {
      display: block;
      color: #737985;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .08em;
      margin-bottom: 8px;
    }


    .keyword-primary strong {
      color: #fff;
      font-size: 22px;
    }


    .keyword-count {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }


    .keyword-count strong {
      color: #fff;
      font-size: 28px;
    }


    .keyword-count span {
      margin-top: 4px;
      color: #858a96;
      font-size: 12px;
    }


    .recommendation-grid {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 12px;
    }


    .recommendation-card {
      display: flex;
      gap: 13px;
      padding: 18px;
      border:
        1px solid rgba(255,255,255,.07);
      border-radius: 14px;
      background:
        rgba(255,255,255,.02);
    }


    .recommendation-icon {
      flex: 0 0 30px;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background:
        rgba(255,255,255,.07);
      color: #fff;
    }


    .recommendation-card strong {
      color: #fff;
      font-size: 13px;
    }


    .recommendation-card p {
      margin: 5px 0 0;
      color: #858a96;
      font-size: 12px;
      line-height: 1.5;
    }


    /* =====================================================
       RESPONSIVE
    ===================================================== */

    @media (max-width: 900px) {

      .action-summary {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }


      .action-detail {
        grid-template-columns: 1fr;
      }


      .action-impact {
        padding-left: 0;
        padding-top: 15px;
        border-left: 0;
        border-top:
          1px solid rgba(255,255,255,.07);
      }


      .competitor-inputs,
      .competitor-cards {
        grid-template-columns: 1fr;
      }


      .competitor-cta {
        flex-direction: column;
        align-items: flex-start;
      }


      .keyword-dashboard {
        grid-template-columns: 1fr;
      }


      .recommendation-grid {
        grid-template-columns: 1fr;
      }

    }


    @media (max-width: 600px) {

      .action-summary {
        grid-template-columns:
          repeat(2, minmax(0, 1fr));
      }


      .action-card {
        padding: 17px;
        gap: 12px;
      }


      .action-number {
        flex-basis: 28px;
        width: 28px;
        height: 28px;
      }


      .action-card-top {
        flex-direction: column;
        gap: 10px;
      }


      .competitor-button {
        width: 100%;
      }

    }

  `;


  document.head.appendChild(style);

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.showFix =
  showFix;

window.openCompetitorForm =
  openCompetitorForm;

window.runCompetitorAnalysis =
  runCompetitorAnalysis;


