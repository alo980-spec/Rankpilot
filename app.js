/* =========================================================
   RANKPILOT — APP.JS
   SEO ANALYZER + REPORTS + KEYWORDS + COMPETITORS
   DASHBOARD + PROJECTS + HISTORY + ACCOUNT
   ========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const WORKER_URL =
    "https://rankpilot-api.alvaroalvarezmonteagudo.workers.dev/";


/* =========================================================
   DOM
========================================================= */

const form = document.getElementById("seoForm");
const input = document.getElementById("urlInput");
const message = document.getElementById("analyzerMessage");


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentMainUrl = "";
let currentData = null;


/* =========================================================
   BASIC HELPERS
========================================================= */

function escapeHtml(value) {

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


function getHostname(url) {

    try {

        return new URL(url).hostname.replace(/^www\./, "");

    } catch (error) {

        return url || "";

    }

}


function normalizeUrl(value) {

    let url = String(value || "").trim();

    if (!url) {
        return "";
    }

    if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
    }

    try {

        return new URL(url).href;

    } catch (error) {

        return "";

    }

}


function getNumericScore(value) {

    if (typeof value === "number") {
        return Math.round(value);
    }

    if (value && typeof value === "object") {

        const candidates = [
            value.score,
            value.value,
            value.total,
            value.percentage
        ];

        for (const candidate of candidates) {

            if (
                typeof candidate === "number" &&
                Number.isFinite(candidate)
            ) {
                return Math.round(candidate);
            }

        }

    }

    const parsed = Number(value);

    return Number.isFinite(parsed)
        ? Math.round(parsed)
        : 0;

}


function clampScore(score) {

    return Math.max(
        0,
        Math.min(100, getNumericScore(score))
    );

}


function getStatus(score) {

    score = clampScore(score);

    if (score >= 90) {
        return "Excelente";
    }

    if (score >= 75) {
        return "Bueno";
    }

    if (score >= 50) {
        return "Mejorable";
    }

    return "Crítico";

}


function getLabel(score) {

    score = clampScore(score);

    if (score >= 90) {
        return "Excelente";
    }

    if (score >= 75) {
        return "Buen SEO";
    }

    if (score >= 50) {
        return "Necesita mejoras";
    }

    return "Necesita atención";
}


function normalizeBoolean(value) {

    if (typeof value === "boolean") {
        return value;
    }

    if (
        value === "true" ||
        value === "yes" ||
        value === "1" ||
        value === 1
    ) {
        return true;
    }

    return false;

}


/* =========================================================
   FORMULARIO PRINCIPAL
========================================================= */

if (form) {

    form.addEventListener("submit", async function(event) {

        event.preventDefault();

        const rawUrl = input
            ? input.value.trim()
            : "";

        const url = normalizeUrl(rawUrl);

        if (!url) {

            if (message) {

                message.innerHTML = `
                    <div class="rankpilot-error">
                        Introduce una URL válida.
                    </div>
                `;

            }

            return;

        }


        currentMainUrl = url;


        if (message) {

            message.innerHTML = `
                <div class="rankpilot-loading">
                    <div class="rankpilot-spinner"></div>
                    <div>
                        <strong>Analizando tu web...</strong>
                        <span>
                            Estamos recopilando datos SEO.
                        </span>
                    </div>
                </div>
            `;

        }


        try {

            const response = await fetch(
                WORKER_URL +
                "?url=" +
                encodeURIComponent(url)
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data?.error ||
                    "No se ha podido analizar la web."
                );

            }


            if (!data || data.success === false) {

                throw new Error(
                    data?.error ||
                    "No se ha podido analizar la web."
                );

            }


            currentData = data;

            currentMainUrl =
                data.finalUrl ||
                data.url ||
                url;


            renderResults(data);

        } catch (error) {

            console.error(
                "RankPilot analyzer error:",
                error
            );


            if (message) {

                message.innerHTML = `
                    <div class="rankpilot-error">
                        <strong>
                            No se ha podido analizar la web.
                        </strong>
                        <span>
                            ${escapeHtml(
                                error.message ||
                                "Comprueba la URL e inténtalo de nuevo."
                            )}
                        </span>
                    </div>
                `;

            }

        }

    });

}


/* =========================================================
   SCORE / CATEGORY HELPERS
========================================================= */

function getCategoryScore(category) {

    return clampScore(category);

}


function categoryCard(
    title,
    score,
    description
) {

    const numericScore =
        getCategoryScore(score);

    return `

        <div class="score-card">

            <div class="score-card-header">

                <div>
                    <h4>
                        ${escapeHtml(title)}
                    </h4>

                    <p>
                        ${escapeHtml(description || "")}
                    </p>
                </div>

                <div class="score-card-number">
                    ${numericScore}
                </div>

            </div>

            <div class="score-card-bar">

                <span
                    style="
                        width:${numericScore}%;
                    "
                ></span>

            </div>

            <div class="score-card-status">
                ${escapeHtml(
                    getStatus(numericScore)
                )}
            </div>

        </div>

    `;

}


function metric(
    label,
    value,
    status
) {

    return `

        <div class="metric-item">

            <span class="metric-label">
                ${escapeHtml(label)}
            </span>

            <strong class="metric-value">
                ${escapeHtml(value)}
            </strong>

            ${
                status
                    ? `
                        <span class="metric-status">
                            ${escapeHtml(status)}
                        </span>
                    `
                    : ""
            }

        </div>

    `;

}


function technicalItem(
    label,
    value,
    good
) {

    let statusText = "No detectado";
    let statusClass = "";

    if (good === true) {
        statusText = "Correcto";
        statusClass = "good";
    }

    if (good === false) {
        statusText = "Revisar";
        statusClass = "bad";
    }

    return `

        <div class="technical-item">

            <div>
                <strong>
                    ${escapeHtml(label)}
                </strong>

                <span>
                    ${escapeHtml(
                        value || ""
                    )}
                </span>
            </div>

            <span class="
                technical-status
                ${statusClass}
            ">
                ${escapeHtml(statusText)}
            </span>

        </div>

    `;

}


/* =========================================================
   KEYWORDS
========================================================= */

function normalizeKeyword(keyword) {

    if (
        keyword === null ||
        keyword === undefined
    ) {
        return "";
    }


    if (typeof keyword === "string") {

        return keyword.trim();

    }


    if (
        typeof keyword === "number"
    ) {

        return String(keyword);

    }


    if (
        typeof keyword === "object"
    ) {

        const candidates = [
            keyword.keyword,
            keyword.term,
            keyword.text,
            keyword.name,
            keyword.value,
            keyword.query
        ];


        for (
            const candidate
            of candidates
        ) {

            if (
                candidate !== null &&
                candidate !== undefined
            ) {

                return String(candidate).trim();

            }

        }

    }


    return "";

}


function getKeywordCount(keyword) {

    if (
        keyword === null ||
        keyword === undefined
    ) {
        return 0;
    }


    if (
        typeof keyword === "number"
    ) {
        return keyword;
    }


    if (
        typeof keyword === "object"
    ) {

        const values = [
            keyword.count,
            keyword.frequency,
            keyword.occurrences,
            keyword.total
        ];


        for (
            const value
            of values
        ) {

            if (
                typeof value === "number"
            ) {
                return value;
            }

        }

    }


    return 1;

}


function getKeywordTypeLabel(keyword) {

    if (
        keyword &&
        typeof keyword === "object"
    ) {

        if (keyword.type) {

            return String(
                keyword.type
            );

        }

    }


    return "Keyword";

}


function renderKeywordRows(keywords) {

    if (!Array.isArray(keywords)) {
        return "";
    }


    return keywords
        .slice(0, 20)
        .map(function(keyword) {

            const text =
                normalizeKeyword(keyword);

            if (!text) {
                return "";
            }


            const count =
                getKeywordCount(keyword);


            const type =
                getKeywordTypeLabel(keyword);


            return `

                <div class="keyword-row">

                    <div class="keyword-name">
                        ${escapeHtml(text)}
                    </div>

                    <div class="keyword-count">
                        ${escapeHtml(count)}
                    </div>

                    <div class="keyword-type">
                        ${escapeHtml(type)}
                    </div>

                </div>

            `;

        })
        .join("");

}


/* =========================================================
   SEO ACTION PLAN
========================================================= */

function buildActionPlan(data) {

    const seo =
        data?.seo ||
        data?.analysis ||
        data ||
        {};


    const actions = [];


    const technical =
        getCategoryScore(
            seo.technical ||
            data.technicalScore ||
            0
        );


    const onPage =
        getCategoryScore(
            seo.onPage ||
            data.onPageScore ||
            0
        );


    const content =
        getCategoryScore(
            seo.content ||
            data.contentScore ||
            0
        );


    const indexability =
        getCategoryScore(
            seo.indexability ||
            data.indexabilityScore ||
            0
        );


    if (technical < 75) {

        actions.push({
            priority: "Alta",
            title: "Mejorar el SEO técnico",
            text:
                "Revisa HTTPS, canonical, viewport, robots.txt, schema y otros elementos técnicos."
        });

    }


    if (onPage < 75) {

        actions.push({
            priority: "Alta",
            title: "Optimizar elementos on-page",
            text:
                "Trabaja títulos, meta description, encabezados y estructura de la página."
        });

    }


    if (content < 75) {

        actions.push({
            priority: "Media",
            title: "Mejorar el contenido",
            text:
                "Aumenta la profundidad y relevancia del contenido respecto a la intención de búsqueda."
        });

    }


    if (indexability < 75) {

        actions.push({
            priority: "Alta",
            title: "Revisar indexabilidad",
            text:
                "Comprueba canonical, robots y las señales que pueden afectar a la indexación."
        });

    }


    if (!actions.length) {

        actions.push({
            priority: "Baja",
            title: "Mantener y optimizar",
            text:
                "La base SEO es sólida. Continúa trabajando contenido, keywords y autoridad."
        });

    }


    return actions;

}


function renderActionPlan(data) {

    const actions =
        buildActionPlan(data);


    return `

        <section class="rankpilot-section">

            <div class="section-heading">

                <div>

                    <span class="section-eyebrow">
                        SEO ACTION PLAN
                    </span>

                    <h3>
                        Qué deberías mejorar
                    </h3>

                </div>

            </div>


            <div class="action-plan-list">

                ${
                    actions
                        .map(function(action, index) {

                            return `

                                <div class="action-plan-item">

                                    <div class="action-plan-number">
                                        ${index + 1}
                                    </div>

                                    <div class="action-plan-content">

                                        <div class="action-plan-top">

                                            <strong>
                                                ${escapeHtml(
                                                    action.title
                                                )}
                                            </strong>

                                            <span>
                                                ${escapeHtml(
                                                    action.priority
                                                )}
                                            </span>

                                        </div>

                                        <p>
                                            ${escapeHtml(
                                                action.text
                                            )}
                                        </p>

                                    </div>

                                </div>

                            `;

                        })
                        .join("")
                }

            </div>

        </section>

    `;

}


/* =========================================================
   KEYWORD INTELLIGENCE
========================================================= */

function renderKeywordIntelligence(data) {

    const seo =
        data?.seo ||
        data?.analysis ||
        {};


    let primary =
        seo.primaryKeyword ||
        data.primaryKeyword ||
        "";


    primary =
        normalizeKeyword(primary);


    let keywords =
        seo.keywords ||
        seo.keywordIntelligence ||
        data.keywords ||
        data.keywordIntelligence ||
        [];


    if (
        !Array.isArray(keywords)
    ) {

        keywords = [];

    }


    return `

        <section class="rankpilot-section">

            <div class="section-heading">

                <div>

                    <span class="section-eyebrow">
                        KEYWORD INTELLIGENCE
                    </span>

                    <h3>
                        Inteligencia de keywords
                    </h3>

                </div>

            </div>


            ${
                primary
                    ? `
                        <div class="primary-keyword-card">

                            <span>
                                Keyword principal
                            </span>

                            <strong>
                                ${escapeHtml(primary)}
                            </strong>

                        </div>
                    `
                    : `
                        <div class="rankpilot-info-box">
                            No se ha detectado una keyword principal.
                        </div>
                    `
            }


            ${
                keywords.length
                    ? `
                        <div class="keyword-table">

                            <div class="keyword-row keyword-header">

                                <div>
                                    Keyword
                                </div>

                                <div>
                                    Frecuencia
                                </div>

                                <div>
                                    Tipo
                                </div>

                            </div>

                            ${renderKeywordRows(
                                keywords
                            )}

                        </div>
                    `
                    : ""
            }

        </section>

    `;

}


/* =========================================================
   KEYWORD RECOMMENDATIONS
========================================================= */

function renderKeywordRecommendations(data) {

    const seo =
        data?.seo ||
        data?.analysis ||
        {};


    let recommendations =
        seo.keywordRecommendations ||
        data.keywordRecommendations ||
        [];


    if (
        !Array.isArray(recommendations)
    ) {

        recommendations = [];

    }


    if (!recommendations.length) {

        return "";

    }


    return `

        <section class="rankpilot-section">

            <div class="section-heading">

                <div>

                    <span class="section-eyebrow">
                        KEYWORD RECOMMENDATIONS
                    </span>

                    <h3>
                        Keywords recomendadas
                    </h3>

                </div>

            </div>


            <div class="keyword-recommendations">

                ${
                    recommendations
                        .slice(0, 15)
                        .map(function(item) {

                            const keyword =
                                normalizeKeyword(item);


                            if (!keyword) {
                                return "";
                            }


                            return `

                                <span class="keyword-chip">
                                    ${escapeHtml(keyword)}
                                </span>

                            `;

                        })
                        .join("")
                }

            </div>

        </section>

    `;

}


/* =========================================================
   ISSUES
========================================================= */

function normalizeList(value) {

    if (!value) {
        return [];
    }


    if (Array.isArray(value)) {
        return value;
    }


    return [value];

}


function renderIssues(data) {

    const seo =
        data?.seo ||
        data?.analysis ||
        data ||
        {};


    const problems =
        normalizeList(
            seo.problems ||
            seo.issues ||
            data.problems ||
            data.issues
        );


    const warnings =
        normalizeList(
            seo.warnings ||
            data.warnings
        );


    const passed =
        normalizeList(
            seo.passed ||
            data.passed
        );


    return `

        <section class="rankpilot-section">

            <div class="issues-grid">

                <div class="issue-column">

                    <h4>
                        Problemas
                    </h4>

                    ${
                        problems.length
                            ? problems
                                .map(function(item) {

                                    const text =
                                        typeof item === "object"
                                            ? (
                                                item.message ||
                                                item.text ||
                                                item.title ||
                                                JSON.stringify(item)
                                            )
                                            : item;


                                    return `

                                        <div class="issue-item">

                                            <span class="issue-icon">
                                                !
                                            </span>

                                            <span>
                                                ${escapeHtml(text)}
                                            </span>

                                        </div>

                                    `;

                                })
                                .join("")
                            : `
                                <div class="empty-state">
                                    No se han detectado problemas importantes.
                                </div>
                            `
                    }

                </div>


                <div class="issue-column">

                    <h4>
                        Advertencias
                    </h4>

                    ${
                        warnings.length
                            ? warnings
                                .map(function(item) {

                                    const text =
                                        typeof item === "object"
                                            ? (
                                                item.message ||
                                                item.text ||
                                                item.title ||
                                                JSON.stringify(item)
                                            )
                                            : item;


                                    return `

                                        <div class="warning-item">

                                            <span class="warning-icon">
                                                !
                                            </span>

                                            <span>
                                                ${escapeHtml(text)}
                                            </span>

                                        </div>

                                    `;

                                })
                                .join("")
                            : `
                                <div class="empty-state">
                                    No se han detectado advertencias.
                                </div>
                            `
                    }

                </div>


                ${
                    passed.length
                        ? `
                            <div class="issue-column">

                                <h4>
                                    Correcto
                                </h4>

                                ${
                                    passed
                                        .slice(0, 15)
                                        .map(function(item) {

                                            const text =
                                                typeof item === "object"
                                                    ? (
                                                        item.message ||
                                                        item.text ||
                                                        item.title ||
                                                        JSON.stringify(item)
                                                    )
                                                    : item;


                                            return `

                                                <div class="passed-item">

                                                    <span>
                                                        ✓
                                                    </span>

                                                    <span>
                                                        ${escapeHtml(text)}
                                                    </span>

                                                </div>

                                            `;

                                        })
                                        .join("")
                                }

                            </div>
                        `
                        : ""
                }

            </div>

        </section>

    `;

}


/* =========================================================
   MAIN RESULTS
========================================================= */

function renderResults(
    data,
    options = {}
) {

    const seo =
        data?.seo ||
        data?.analysis ||
        data ||
        {};


    const score =
        clampScore(
            data.score ||
            seo.score ||
            data.totalScore ||
            0
        );


    const technical =
        getCategoryScore(
            seo.technical ||
            data.technicalScore ||
            0
        );


    const onPage =
        getCategoryScore(
            seo.onPage ||
            data.onPageScore ||
            0
        );


    const content =
        getCategoryScore(
            seo.content ||
            data.contentScore ||
            0
        );


    const indexability =
        getCategoryScore(
            seo.indexability ||
            data.indexabilityScore ||
            0
        );


    const title =
        seo.title ||
        data.title ||
        "";


    const description =
        seo.description ||
        data.description ||
        "";


    const h1 =
        seo.h1 ||
        data.h1 ||
        data.h1Count ||
        0;


    const h2 =
        seo.h2 ||
        data.h2 ||
        data.h2Count ||
        0;


    const h3 =
        seo.h3 ||
        data.h3 ||
        data.h3Count ||
        0;


    const images =
        seo.images ||
        data.images ||
        data.imageCount ||
        0;


    const imagesWithoutAlt =
        seo.imagesWithoutAlt ||
        data.imagesWithoutAlt ||
        data.imagesMissingAlt ||
        0;


    const internalLinks =
        seo.internalLinks ||
        data.internalLinks ||
        0;


    const externalLinks =
        seo.externalLinks ||
        data.externalLinks ||
        0;


    const contentWords =
        seo.contentWords ||
        data.contentWords ||
        data.wordCount ||
        0;


    const https =
        normalizeBoolean(
            seo.https ??
            data.https
        );


    const viewport =
        normalizeBoolean(
            seo.viewport ??
            data.viewport
        );


    const canonical =
        seo.canonical ||
        data.canonical ||
        "";


    const robots =
        seo.robots ||
        data.robots ||
        "";


    const favicon =
        normalizeBoolean(
            seo.favicon ??
            data.favicon
        );


    const schema =
        normalizeBoolean(
            seo.schema ??
            data.schema
        );


    const og =
        normalizeBoolean(
            seo.openGraph ??
            seo.og ??
            data.openGraph ??
            data.og
        );


    const twitter =
        normalizeBoolean(
            seo.twitterCard ??
            seo.twitter ??
            data.twitterCard ??
            data.twitter
        );


    const hostname =
        getHostname(
            data.finalUrl ||
            data.url ||
            currentMainUrl
        );


    const reportButton = `

        <button
            type="button"
            class="btn btn-secondary"
            onclick="generateSEOReport()"
        >
            Generar informe
        </button>

    `;


    if (message) {

        message.innerHTML = `

            <div
                id="rankpilotResults"
                class="rankpilot-results"
            >

                <div class="results-header">

                    <div>

                        <span class="section-eyebrow">
                            SEO ANALYSIS
                        </span>

                        <h2>
                            ${escapeHtml(hostname)}
                        </h2>

                        <p>
                            ${escapeHtml(
                                data.finalUrl ||
                                data.url ||
                                currentMainUrl
                            )}
                        </p>

                    </div>

                    <div>
                        ${reportButton}
                    </div>

                </div>


                <section class="score-overview">

                    <div class="score-ring-container">

                        <div
                            class="score-ring"
                            style="
                                --score:${score};
                            "
                        >

                            <div class="score-ring-inner">

                                <strong>
                                    ${score}
                                </strong>

                                <span>
                                    /100
                                </span>

                            </div>

                        </div>

                        <div class="score-label">
                            ${escapeHtml(
                                getLabel(score)
                            )}
                        </div>

                    </div>


                    <div class="score-overview-content">

                        <span class="section-eyebrow">
                            SEO SCORE
                        </span>

                        <h3>
                            ${escapeHtml(
                                getStatus(score)
                            )}
                        </h3>

                        <p>
                            RankPilot ha analizado los principales
                            factores SEO de esta página.
                        </p>

                    </div>

                </section>


                <section class="category-scores">

                    ${categoryCard(
                        "SEO técnico",
                        technical,
                        "Infraestructura y configuración"
                    )}

                    ${categoryCard(
                        "On-page",
                        onPage,
                        "Elementos visibles y metadata"
                    )}

                    ${categoryCard(
                        "Contenido",
                        content,
                        "Calidad y profundidad"
                    )}

                    ${categoryCard(
                        "Indexabilidad",
                        indexability,
                        "Capacidad de ser rastreada e indexada"
                    )}

                </section>


                ${renderActionPlan(data)}


                ${renderKeywordIntelligence(data)}


                ${renderKeywordRecommendations(data)}


                <section class="rankpilot-section">

                    <div class="section-heading">

                        <div>

                            <span class="section-eyebrow">
                                COMPETITOR INTELLIGENCE
                            </span>

                            <h3>
                                Compara tu web
                            </h3>

                            <p>
                                Analiza hasta 3 competidores
                                para detectar oportunidades.
                            </p>

                        </div>

                        <button
                            type="button"
                            class="btn btn-secondary"
                            onclick="openCompetitorForm()"
                        >
                            Comparar competidores
                        </button>

                    </div>

                    <div
                        id="competitorContainer"
                    ></div>

                </section>


                ${renderIssues(data)}


                <section class="rankpilot-section">

                    <div class="section-heading">

                        <div>

                            <span class="section-eyebrow">
                                ON-PAGE
                            </span>

                            <h3>
                                Métricas de la página
                            </h3>

                        </div>

                    </div>


                    <div class="metrics-grid">

                        ${metric(
                            "Title",
                            title || "No encontrado"
                        )}

                        ${metric(
                            "Meta description",
                            description
                                ? "Detectada"
                                : "No encontrada"
                        )}

                        ${metric(
                            "H1",
                            h1
                        )}

                        ${metric(
                            "H2",
                            h2
                        )}

                        ${metric(
                            "H3",
                            h3
                        )}

                        ${metric(
                            "Palabras",
                            contentWords
                        )}

                        ${metric(
                            "Imágenes",
                            images
                        )}

                        ${metric(
                            "Imágenes sin ALT",
                            imagesWithoutAlt
                        )}

                        ${metric(
                            "Enlaces internos",
                            internalLinks
                        )}

                        ${metric(
                            "Enlaces externos",
                            externalLinks
                        )}

                    </div>

                </section>


                <section class="rankpilot-section">

                    <div class="section-heading">

                        <div>

                            <span class="section-eyebrow">
                                TECHNICAL SEO
                            </span>

                            <h3>
                                SEO técnico
                            </h3>

                        </div>

                    </div>


                    <div class="technical-grid">

                        ${technicalItem(
                            "HTTPS",
                            https
                                ? "Activo"
                                : "No detectado",
                            https
                        )}

                        ${technicalItem(
                            "Viewport",
                            viewport
                                ? "Configurado"
                                : "No detectado",
                            viewport
                        )}

                        ${technicalItem(
                            "Canonical",
                            canonical
                                ? canonical
                                : "No detectado",
                            !!canonical
                        )}

                        ${technicalItem(
                            "Robots",
                            robots
                                ? "Detectado"
                                : "No detectado",
                            !!robots
                        )}

                        ${technicalItem(
                            "Favicon",
                            favicon
                                ? "Detectado"
                                : "No detectado",
                            favicon
                        )}

                        ${technicalItem(
                            "Schema",
                            schema
                                ? "Detectado"
                                : "No detectado",
                            schema
                        )}

                        ${technicalItem(
                            "Open Graph",
                            og
                                ? "Detectado"
                                : "No detectado",
                            og
                        )}

                        ${technicalItem(
                            "Twitter Card",
                            twitter
                                ? "Detectado"
                                : "No detectado",
                            twitter
                        )}

                    </div>

                </section>


                <section class="rankpilot-save-analysis">

                    <div>

                        <strong>
                            ¿Quieres guardar este análisis?
                        </strong>

                        <p>
                            Crea un proyecto desde tu Dashboard
                            para conservar el historial SEO.
                        </p>

                    </div>

                    <button
                        type="button"
                        class="btn btn-primary"
                        onclick="openRankPilotDashboard('projects')"
                    >
                        Gestionar proyectos
                    </button>

                </section>

            </div>

        `;

    }


    /*
     * Guardar automáticamente si existe un proyecto
     * asociado a esta URL.
     */

    if (
        options.save !== false
    ) {

        rankPilotAutoSaveAnalysis(data);

    }

}


/* =========================================================
   FIX / DETAILS
========================================================= */

function showFix(button) {

    const parent =
        button.closest(".fix-item");


    if (!parent) {
        return;
    }


    const content =
        parent.querySelector(".fix-content");


    if (!content) {
        return;
    }


    content.classList.toggle("open");

}


/* =========================================================
   COMPETITOR ANALYSIS
========================================================= */

function openCompetitorForm() {

    const container =
        document.getElementById(
            "competitorContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="competitor-form">

            <div class="competitor-input">

                <label>
                    Competidor 1
                </label>

                <input
                    id="competitor1"
                    type="text"
                    placeholder="https://competidor.com"
                >

            </div>


            <div class="competitor-input">

                <label>
                    Competidor 2
                </label>

                <input
                    id="competitor2"
                    type="text"
                    placeholder="https://competidor.com"
                >

            </div>


            <div class="competitor-input">

                <label>
                    Competidor 3
                </label>

                <input
                    id="competitor3"
                    type="text"
                    placeholder="https://competidor.com"
                >

            </div>


            <button
                type="button"
                class="btn btn-primary"
                onclick="runCompetitorAnalysis()"
            >
                Analizar competidores
            </button>

        </div>

    `;

}


async function runCompetitorAnalysis() {

    const container =
        document.getElementById(
            "competitorContainer"
        );


    if (!container) {
        return;
    }


    const competitors = [
        document.getElementById(
            "competitor1"
        )?.value.trim(),

        document.getElementById(
            "competitor2"
        )?.value.trim(),

        document.getElementById(
            "competitor3"
        )?.value.trim()
    ]
        .filter(Boolean)
        .map(normalizeUrl)
        .filter(Boolean);


    if (!competitors.length) {

        container.innerHTML = `
            <div class="rankpilot-error">
                Introduce al menos un competidor.
            </div>
        `;

        return;

    }


    container.innerHTML = `

        <div class="rankpilot-loading">

            <div class="rankpilot-spinner"></div>

            <div>
                <strong>
                    Analizando competidores...
                </strong>

                <span>
                    Esto puede tardar unos segundos.
                </span>
            </div>

        </div>

    `;


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
                WORKER_URL +
                "?" +
                params.toString()
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data?.error ||
                "No se pudo realizar el análisis."
            );

        }


        const competitorAnalysis =
            data.competitorAnalysis ||
            data.competitors ||
            data;


        if (currentData) {

            currentData.competitorAnalysis =
                competitorAnalysis;

        }


        renderCompetitorResults(
            competitorAnalysis
        );


        rankPilotAutoSaveAnalysis(
            currentData
        );


    } catch (error) {

        console.error(error);


        container.innerHTML = `

            <div class="rankpilot-error">

                ${escapeHtml(
                    error.message ||
                    "No se pudo analizar los competidores."
                )}

            </div>

        `;

    }

}


function renderCompetitorResults(data) {

    const container =
        document.getElementById(
            "competitorContainer"
        );


    if (!container) {
        return;
    }


    let competitors = data;


    if (
        data &&
        !Array.isArray(data)
    ) {

        competitors =
            data.competitors ||
            data.results ||
            data.data ||
            [];

    }


    if (!Array.isArray(competitors)) {
        competitors = [];
    }


    container.innerHTML = `

        <div class="competitor-results">

            ${
                competitors
                    .map(function(item) {

                        if (!item) {
                            return "";
                        }


                        const url =
                            item.url ||
                            item.finalUrl ||
                            "";


                        const score =
                            clampScore(
                                item.score ||
                                item.seoScore ||
                                item.totalScore ||
                                0
                            );


                        return `

                            <div class="competitor-card">

                                <div>

                                    <span>
                                        ${escapeHtml(
                                            getHostname(url)
                                        )}
                                    </span>

                                    <strong>
                                        ${score}/100
                                    </strong>

                                </div>

                                <div class="competitor-bar">

                                    <span
                                        style="
                                            width:${score}%;
                                        "
                                    ></span>

                                </div>

                                <small>
                                    ${escapeHtml(
                                        getStatus(score)
                                    )}
                                </small>

                            </div>

                        `;

                    })
                    .join("")
            }

        </div>

    `;

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


    const data =
        currentData;


    const seo =
        data?.seo ||
        data?.analysis ||
        data ||
        {};


    const score =
        clampScore(
            data.score ||
            seo.score ||
            data.totalScore ||
            0
        );


    const technical =
        getCategoryScore(
            seo.technical ||
            data.technicalScore ||
            0
        );


    const onPage =
        getCategoryScore(
            seo.onPage ||
            data.onPageScore ||
            0
        );


    const content =
        getCategoryScore(
            seo.content ||
            data.contentScore ||
            0
        );


    const indexability =
        getCategoryScore(
            seo.indexability ||
            data.indexabilityScore ||
            0
        );


    const title =
        seo.title ||
        data.title ||
        "";


    const description =
        seo.description ||
        data.description ||
        "";


    const hostname =
        getHostname(
            data.finalUrl ||
            data.url ||
            currentMainUrl
        );


    const actions =
        buildActionPlan(data);


    const problems =
        normalizeList(
            seo.problems ||
            seo.issues ||
            data.problems ||
            data.issues
        );


    const warnings =
        normalizeList(
            seo.warnings ||
            data.warnings
        );


    const reportWindow =
        window.open(
            "",
            "_blank",
            "width=1100,height=800"
        );


    if (!reportWindow) {

        alert(
            "El navegador ha bloqueado la ventana del informe."
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
                    box-sizing:border-box;
                }

                body {
                    margin:0;
                    font-family:Arial,Helvetica,sans-serif;
                    color:#0f172a;
                    background:#f8fafc;
                }

                .report {
                    max-width:1000px;
                    margin:0 auto;
                    padding:50px;
                    background:white;
                    min-height:100vh;
                }

                .header {
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    gap:30px;
                    padding-bottom:30px;
                    border-bottom:1px solid #e2e8f0;
                }

                .brand {
                    font-size:28px;
                    font-weight:800;
                }

                .brand span {
                    color:#4f46e5;
                }

                .url {
                    color:#64748b;
                    font-size:13px;
                    margin-top:8px;
                    word-break:break-all;
                }

                .date {
                    color:#64748b;
                    font-size:13px;
                }

                .score {
                    margin:40px 0;
                    padding:30px;
                    border:1px solid #e2e8f0;
                    border-radius:18px;
                    display:flex;
                    align-items:center;
                    gap:30px;
                }

                .score-number {
                    font-size:60px;
                    font-weight:800;
                    color:#4f46e5;
                }

                .score-title {
                    font-size:24px;
                    font-weight:700;
                    margin-bottom:6px;
                }

                .grid {
                    display:grid;
                    grid-template-columns:
                        repeat(4,1fr);
                    gap:15px;
                    margin-bottom:40px;
                }

                .card {
                    padding:20px;
                    border:1px solid #e2e8f0;
                    border-radius:14px;
                }

                .card small {
                    display:block;
                    color:#64748b;
                    margin-bottom:10px;
                }

                .card strong {
                    font-size:28px;
                }

                section {
                    margin-top:40px;
                }

                h2 {
                    font-size:21px;
                    margin-bottom:18px;
                }

                .action {
                    padding:16px;
                    border:1px solid #e2e8f0;
                    border-radius:12px;
                    margin-bottom:10px;
                }

                .action strong {
                    display:block;
                    margin-bottom:6px;
                }

                .action p {
                    margin:0;
                    color:#64748b;
                    line-height:1.5;
                }

                .issue {
                    padding:12px 15px;
                    background:#fff7ed;
                    border-radius:10px;
                    margin-bottom:8px;
                }

                .warning {
                    padding:12px 15px;
                    background:#fefce8;
                    border-radius:10px;
                    margin-bottom:8px;
                }

                .meta {
                    display:grid;
                    grid-template-columns:
                        180px 1fr;
                    gap:10px;
                    padding:10px 0;
                    border-bottom:1px solid #e2e8f0;
                }

                .meta strong {
                    color:#475569;
                }

                .footer {
                    margin-top:60px;
                    padding-top:20px;
                    border-top:1px solid #e2e8f0;
                    color:#94a3b8;
                    font-size:12px;
                }

                @media print {

                    body {
                        background:white;
                    }

                    .report {
                        padding:20px;
                    }

                }

            </style>

        </head>

        <body>

            <main class="report">

                <header class="header">

                    <div>

                        <div class="brand">
                            Rank<span>Pilot</span>
                        </div>

                        <div class="url">
                            ${escapeHtml(
                                data.finalUrl ||
                                data.url ||
                                currentMainUrl
                            )}
                        </div>

                    </div>

                    <div class="date">

                        ${new Date().toLocaleDateString(
                            "es-ES"
                        )}

                    </div>

                </header>


                <div class="score">

                    <div class="score-number">
                        ${score}/100
                    </div>

                    <div>

                        <div class="score-title">
                            ${escapeHtml(
                                getLabel(score)
                            )}
                        </div>

                        <div>
                            Análisis SEO generado por RankPilot.
                        </div>

                    </div>

                </div>


                <div class="grid">

                    <div class="card">

                        <small>
                            SEO técnico
                        </small>

                        <strong>
                            ${technical}
                        </strong>

                    </div>


                    <div class="card">

                        <small>
                            On-page
                        </small>

                        <strong>
                            ${onPage}
                        </strong>

                    </div>


                    <div class="card">

                        <small>
                            Contenido
                        </small>

                        <strong>
                            ${content}
                        </strong>

                    </div>


                    <div class="card">

                        <small>
                            Indexabilidad
                        </small>

                        <strong>
                            ${indexability}
                        </strong>

                    </div>

                </div>


                <section>

                    <h2>
                        SEO Action Plan
                    </h2>

                    ${
                        actions
                            .map(function(action) {

                                return `

                                    <div class="action">

                                        <strong>
                                            ${escapeHtml(
                                                action.title
                                            )}
                                        </strong>

                                        <p>
                                            ${escapeHtml(
                                                action.text
                                            )}
                                        </p>

                                    </div>

                                `;

                            })
                            .join("")
                    }

                </section>


                <section>

                    <h2>
                        On-page
                    </h2>

                    <div class="meta">

                        <strong>
                            Title
                        </strong>

                        <span>
                            ${escapeHtml(
                                title ||
                                "No encontrado"
                            )}
                        </span>

                    </div>

                    <div class="meta">

                        <strong>
                            Meta description
                        </strong>

                        <span>
                            ${escapeHtml(
                                description ||
                                "No encontrada"
                            )}
                        </span>

                    </div>

                </section>


                ${
                    problems.length
                        ? `

                            <section>

                                <h2>
                                    Problemas detectados
                                </h2>

                                ${
                                    problems
                                        .map(function(item) {

                                            const text =
                                                typeof item === "object"
                                                    ? (
                                                        item.message ||
                                                        item.text ||
                                                        item.title ||
                                                        JSON.stringify(item)
                                                    )
                                                    : item;

                                            return `

                                                <div class="issue">
                                                    ${escapeHtml(text)}
                                                </div>

                                            `;

                                        })
                                        .join("")
                                }

                            </section>

                        `
                        : ""
                }


                ${
                    warnings.length
                        ? `

                            <section>

                                <h2>
                                    Advertencias
                                </h2>

                                ${
                                    warnings
                                        .map(function(item) {

                                            const text =
                                                typeof item === "object"
                                                    ? (
                                                        item.message ||
                                                        item.text ||
                                                        item.title ||
                                                        JSON.stringify(item)
                                                    )
                                                    : item;

                                            return `

                                                <div class="warning">
                                                    ${escapeHtml(text)}
                                                </div>

                                            `;

                                        })
                                        .join("")
                                }

                            </section>

                        `
                        : ""
                }


                <div class="footer">

                    RankPilot — SEO Intelligence Platform

                </div>

            </main>


            <script>

                window.onload = function() {

                    setTimeout(
                        function() {
                            window.print();
                        },
                        400
                    );

                };

            <\/script>

        </body>

        </html>

    `);


    reportWindow.document.close();

}


/* =========================================================
   DASHBOARD / PROJECTS / HISTORY
========================================================= */

const RANKPILOT_PROJECTS_KEY =
    "rankpilot_projects_v1";

const RANKPILOT_ACTIVE_PROJECT_KEY =
    "rankpilot_active_project_v1";


function getRankPilotProjects() {

    try {

        const projects =
            JSON.parse(
                localStorage.getItem(
                    RANKPILOT_PROJECTS_KEY
                ) || "[]"
            );


        return Array.isArray(projects)
            ? projects
            : [];

    } catch (error) {

        return [];

    }

}


function saveRankPilotProjects(projects) {

    localStorage.setItem(
        RANKPILOT_PROJECTS_KEY,
        JSON.stringify(projects)
    );

}


function getActiveProjectId() {

    return localStorage.getItem(
        RANKPILOT_ACTIVE_PROJECT_KEY
    );

}


function setActiveProjectId(id) {

    if (id) {

        localStorage.setItem(
            RANKPILOT_ACTIVE_PROJECT_KEY,
            id
        );

    } else {

        localStorage.removeItem(
            RANKPILOT_ACTIVE_PROJECT_KEY
        );

    }

}


function projectMatchesUrl(project, url) {

    if (!project || !url) {
        return false;
    }


    const projectHost =
        getHostname(project.url);


    const targetHost =
        getHostname(url);


    return (
        projectHost &&
        targetHost &&
        projectHost === targetHost
    );

}


function saveAnalysisToProject(
    projectId,
    data
) {

    if (!projectId || !data) {
        return;
    }


    const projects =
        getRankPilotProjects();


    const project =
        projects.find(function(item) {

            return item.id === projectId;

        });


    if (!project) {
        return;
    }


    if (!Array.isArray(project.analyses)) {

        project.analyses = [];

    }


    const score =
        clampScore(
            data.score ||
            data.seo?.score ||
            data.totalScore ||
            0
        );


    const analysis = {

        id:
            "analysis_" +
            Date.now(),

        createdAt:
            new Date().toISOString(),

        score:
            score,

        url:
            data.finalUrl ||
            data.url ||
            currentMainUrl,

        data:
            data

    };


    project.analyses.unshift(
        analysis
    );


    /*
     * Evitar un historial infinito.
     */

    project.analyses =
        project.analyses.slice(
            0,
            20
        );


    project.updatedAt =
        new Date().toISOString();


    project.lastScore =
        score;


    saveRankPilotProjects(
        projects
    );

}


function rankPilotAutoSaveAnalysis(data) {

    if (!data) {
        return;
    }


    const projects =
        getRankPilotProjects();


    if (!projects.length) {
        return;
    }


    const activeId =
        getActiveProjectId();


    let project = null;


    if (activeId) {

        project =
            projects.find(function(item) {

                return item.id === activeId;

            });

    }


    if (
        !project ||
        !projectMatchesUrl(
            project,
            data.finalUrl ||
            data.url ||
            currentMainUrl
        )
    ) {

        project =
            projects.find(function(item) {

                return projectMatchesUrl(
                    item,
                    data.finalUrl ||
                    data.url ||
                    currentMainUrl
                );

            });

    }


    if (!project) {
        return;
    }


    /*
     * Evitar guardar exactamente el mismo análisis
     * repetidamente.
     */

    const last =
        project.analyses &&
        project.analyses[0];


    const newScore =
        clampScore(
            data.score ||
            data.seo?.score ||
            data.totalScore ||
            0
        );


    if (
        last &&
        last.url === (
            data.finalUrl ||
            data.url ||
            currentMainUrl
        ) &&
        last.score === newScore
    ) {

        return;

    }


    saveAnalysisToProject(
        project.id,
        data
    );

}


/* =========================================================
   DASHBOARD MODAL
========================================================= */

function createRankPilotDashboard() {

    if (
        document.getElementById(
            "rankpilotDashboardModal"
        )
    ) {
        return;
    }


    const modal =
        document.createElement("div");


    modal.id =
        "rankpilotDashboardModal";


    modal.innerHTML = `

        <div class="rankpilot-dashboard-overlay"></div>

        <div class="rankpilot-dashboard">

            <aside class="rankpilot-dashboard-sidebar">

                <div class="rankpilot-dashboard-logo">
                    Rank<span>Pilot</span>
                </div>


                <button
                    class="rankpilot-dashboard-nav active"
                    data-section="dashboard"
                >
                    📊 Dashboard
                </button>


                <button
                    class="rankpilot-dashboard-nav"
                    data-section="projects"
                >
                    📁 Proyectos
                </button>


                <button
                    class="rankpilot-dashboard-nav"
                    data-section="history"
                >
                    📈 Historial
                </button>


                <button
                    class="rankpilot-dashboard-nav"
                    data-section="account"
                >
                    ⚙️ Cuenta
                </button>


                <button
                    class="rankpilot-dashboard-close"
                    type="button"
                >
                    Cerrar
                </button>

            </aside>


            <main
                id="rankpilotDashboardContent"
                class="rankpilot-dashboard-content"
            ></main>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    if (
        !document.getElementById(
            "rankpilotDashboardStyles"
        )
    ) {

        const style =
            document.createElement("style");


        style.id =
            "rankpilotDashboardStyles";


        style.textContent = `

            #rankpilotDashboardModal {
                position:fixed;
                inset:0;
                z-index:99998;
                display:none;
            }

            #rankpilotDashboardModal.open {
                display:block;
            }

            .rankpilot-dashboard-overlay {
                position:absolute;
                inset:0;
                background:rgba(15,23,42,.65);
                backdrop-filter:blur(5px);
            }

            .rankpilot-dashboard {
                position:absolute;
                inset:30px;
                display:flex;
                overflow:hidden;
                background:#fff;
                border-radius:20px;
                box-shadow:
                    0 30px 80px rgba(15,23,42,.25);
            }

            .rankpilot-dashboard-sidebar {
                width:220px;
                flex-shrink:0;
                display:flex;
                flex-direction:column;
                gap:5px;
                padding:25px 15px;
                background:#0f172a;
            }

            .rankpilot-dashboard-logo {
                padding:0 10px 25px;
                color:#fff;
                font-size:22px;
                font-weight:800;
            }

            .rankpilot-dashboard-logo span {
                color:#818cf8;
            }

            .rankpilot-dashboard-nav {
                width:100%;
                padding:12px;
                border:0;
                border-radius:9px;
                background:transparent;
                color:#cbd5e1;
                text-align:left;
                font-size:14px;
                cursor:pointer;
            }

            .rankpilot-dashboard-nav:hover,
            .rankpilot-dashboard-nav.active {
                background:#1e293b;
                color:#fff;
            }

            .rankpilot-dashboard-close {
                margin-top:auto;
                padding:11px;
                border:1px solid #334155;
                border-radius:9px;
                background:transparent;
                color:#cbd5e1;
                cursor:pointer;
            }

            .rankpilot-dashboard-content {
                flex:1;
                overflow:auto;
                padding:35px;
                background:#f8fafc;
            }

            .dashboard-title {
                margin:0 0 7px;
                color:#0f172a;
                font-size:28px;
            }

            .dashboard-subtitle {
                margin:0 0 30px;
                color:#64748b;
            }

            .dashboard-stats {
                display:grid;
                grid-template-columns:
                    repeat(3,1fr);
                gap:16px;
                margin-bottom:30px;
            }

            .dashboard-stat {
                padding:20px;
                background:#fff;
                border:1px solid #e2e8f0;
                border-radius:14px;
            }

            .dashboard-stat span {
                display:block;
                color:#64748b;
                font-size:13px;
                margin-bottom:8px;
            }

            .dashboard-stat strong {
                color:#0f172a;
                font-size:28px;
            }

            .dashboard-projects {
                display:grid;
                grid-template-columns:
                    repeat(2,minmax(0,1fr));
                gap:16px;
            }

            .dashboard-project {
                padding:20px;
                background:#fff;
                border:1px solid #e2e8f0;
                border-radius:14px;
            }

            .dashboard-project h4 {
                margin:0 0 5px;
                color:#0f172a;
            }

            .dashboard-project-url {
                color:#64748b;
                font-size:13px;
                word-break:break-all;
            }

            .dashboard-project-score {
                margin:20px 0;
                font-size:30px;
                font-weight:800;
                color:#4f46e5;
            }

            .dashboard-actions {
                display:flex;
                flex-wrap:wrap;
                gap:8px;
            }

            .dashboard-action {
                padding:9px 12px;
                border:1px solid #dbe2ea;
                border-radius:8px;
                background:#fff;
                color:#334155;
                cursor:pointer;
            }

            .dashboard-action.primary {
                background:#4f46e5;
                border-color:#4f46e5;
                color:#fff;
            }

            .dashboard-action.danger {
                color:#dc2626;
            }

            .dashboard-history {
                background:#fff;
                border:1px solid #e2e8f0;
                border-radius:14px;
                overflow:hidden;
            }

            .dashboard-history-row {
                display:grid;
                grid-template-columns:
                    1fr 100px 170px 180px;
                gap:15px;
                align-items:center;
                padding:15px 18px;
                border-bottom:1px solid #e2e8f0;
            }

            .dashboard-history-row:last-child {
                border-bottom:0;
            }

            .dashboard-create {
                margin-bottom:25px;
                padding:20px;
                background:#fff;
                border:1px solid #e2e8f0;
                border-radius:14px;
            }

            .dashboard-create-grid {
                display:grid;
                grid-template-columns:
                    1fr 1fr auto;
                gap:10px;
            }

            .dashboard-create input {
                width:100%;
                box-sizing:border-box;
                padding:11px 12px;
                border:1px solid #dbe2ea;
                border-radius:9px;
            }

            .dashboard-empty {
                padding:45px;
                background:#fff;
                border:1px dashed #cbd5e1;
                border-radius:14px;
                text-align:center;
                color:#64748b;
            }

            @media(max-width:800px) {

                .rankpilot-dashboard {
                    inset:10px;
                    flex-direction:column;
                }

                .rankpilot-dashboard-sidebar {
                    width:auto;
                    flex-direction:row;
                    overflow-x:auto;
                    padding:12px;
                }

                .rankpilot-dashboard-logo {
                    display:none;
                }

                .rankpilot-dashboard-close {
                    margin-top:0;
                }

                .dashboard-stats {
                    grid-template-columns:1fr;
                }

                .dashboard-projects {
                    grid-template-columns:1fr;
                }

                .dashboard-create-grid {
                    grid-template-columns:1fr;
                }

                .dashboard-history-row {
                    grid-template-columns:1fr;
                }

                .rankpilot-dashboard-content {
                    padding:20px;
                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    modal
        .querySelector(
            ".rankpilot-dashboard-overlay"
        )
        .addEventListener(
            "click",
            closeRankPilotDashboard
        );


    modal
        .querySelector(
            ".rankpilot-dashboard-close"
        )
        .addEventListener(
            "click",
            closeRankPilotDashboard
        );


    modal
        .querySelectorAll(
            ".rankpilot-dashboard-nav"
        )
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function() {

                    openRankPilotDashboard(
                        button.dataset.section
                    );

                }
            );

        });

}


function openRankPilotDashboard(
    section = "dashboard"
) {

    createRankPilotDashboard();


    const modal =
        document.getElementById(
            "rankpilotDashboardModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.add("open");

    document.body.style.overflow =
        "hidden";


    document
        .querySelectorAll(
            ".rankpilot-dashboard-nav"
        )
        .forEach(function(button) {

            button.classList.toggle(
                "active",
                button.dataset.section === section
            );

        });


    renderDashboardSection(
        section
    );

}


function closeRankPilotDashboard() {

    const modal =
        document.getElementById(
            "rankpilotDashboardModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove("open");

    document.body.style.overflow =
        "";

}


window.openRankPilotDashboard =
    openRankPilotDashboard;


window.closeRankPilotDashboard =
    closeRankPilotDashboard;


/* =========================================================
   DASHBOARD CONTENT
========================================================= */

function renderDashboardSection(
    section
) {

    const container =
        document.getElementById(
            "rankpilotDashboardContent"
        );


    if (!container) {
        return;
    }


    if (section === "projects") {

        renderProjectsSection(
            container
        );

        return;

    }


    if (section === "history") {

        renderHistorySection(
            container
        );

        return;

    }


    if (section === "account") {

        renderAccountSection(
            container
        );

        return;

    }


    renderDashboardHome(
        container
    );

}


function renderDashboardHome(
    container
) {

    const projects =
        getRankPilotProjects();


    const analyses =
        projects.reduce(
            function(total, project) {

                return total +
                    (
                        Array.isArray(project.analyses)
                            ? project.analyses.length
                            : 0
                    );

            },
            0
        );


    const scores =
        projects
            .flatMap(function(project) {

                return Array.isArray(project.analyses)
                    ? project.analyses
                    : [];

            })
            .map(function(analysis) {

                return Number(
                    analysis.score
                );

            })
            .filter(function(score) {

                return Number.isFinite(score);

            });


    const average =
        scores.length
            ? Math.round(
                scores.reduce(
                    function(a, b) {
                        return a + b;
                    },
                    0
                ) / scores.length
            )
            : 0;


    container.innerHTML = `

        <h1 class="dashboard-title">
            Dashboard
        </h1>

        <p class="dashboard-subtitle">
            Gestiona tus proyectos y evolución SEO.
        </p>


        <div class="dashboard-stats">

            <div class="dashboard-stat">

                <span>
                    Proyectos
                </span>

                <strong>
                    ${projects.length}
                </strong>

            </div>


            <div class="dashboard-stat">

                <span>
                    Análisis
                </span>

                <strong>
                    ${analyses}
                </strong>

            </div>


            <div class="dashboard-stat">

                <span>
                    Score medio
                </span>

                <strong>
                    ${average || "—"}
                </strong>

            </div>

        </div>


        <h3>
            Tus proyectos
        </h3>


        ${
            projects.length
                ? `
                    <div class="dashboard-projects">

                        ${
                            projects
                                .map(
                                    renderProjectCard
                                )
                                .join("")
                        }

                    </div>
                `
                : `
                    <div class="dashboard-empty">

                        <p>
                            Todavía no tienes proyectos.
                        </p>

                        <button
                            class="dashboard-action primary"
                            onclick="
                                openRankPilotDashboard('projects')
                            "
                        >
                            Crear primer proyecto
                        </button>

                    </div>
                `
        }

    `;

}


function renderProjectCard(
    project
) {

    const analyses =
        Array.isArray(project.analyses)
            ? project.analyses
            : [];


    const score =
        project.lastScore ??
        (
            analyses[0]
                ? analyses[0].score
                : "—"
        );


    return `

        <div class="dashboard-project">

            <h4>
                ${escapeHtml(
                    project.name
                )}
            </h4>

            <div class="dashboard-project-url">
                ${escapeHtml(
                    project.url
                )}
            </div>

            <div class="dashboard-project-score">
                ${
                    score === "—"
                        ? "—"
                        : score + "/100"
                }
            </div>

            <div class="dashboard-actions">

                <button
                    class="dashboard-action primary"
                    onclick="
                        analyzeRankPilotProject(
                            '${escapeHtml(project.id)}'
                        )
                    "
                >
                    Analizar
                </button>

                <button
                    class="dashboard-action"
                    onclick="
                        openRankPilotProject(
                            '${escapeHtml(project.id)}'
                        )
                    "
                >
                    Ver historial
                </button>

                <button
                    class="dashboard-action danger"
                    onclick="
                        deleteRankPilotProject(
                            '${escapeHtml(project.id)}'
                        )
                    "
                >
                    Eliminar
                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   PROJECTS SECTION
========================================================= */

function renderProjectsSection(
    container
) {

    const projects =
        getRankPilotProjects();


    container.innerHTML = `

        <h1 class="dashboard-title">
            Mis proyectos
        </h1>

        <p class="dashboard-subtitle">
            Organiza tus webs y conserva sus análisis SEO.
        </p>


        <div class="dashboard-create">

            <h3>
                Crear proyecto
            </h3>

            <div class="dashboard-create-grid">

                <input
                    id="rankpilotNewProjectName"
                    type="text"
                    placeholder="Nombre del proyecto"
                >

                <input
                    id="rankpilotNewProjectUrl"
                    type="text"
                    placeholder="https://tusitio.com"
                >

                <button
                    class="dashboard-action primary"
                    onclick="
                        createRankPilotProject()
                    "
                >
                    Crear
                </button>

            </div>

        </div>


        ${
            projects.length
                ? `
                    <div class="dashboard-projects">

                        ${
                            projects
                                .map(
                                    renderProjectCard
                                )
                                .join("")
                        }

                    </div>
                `
                : `
                    <div class="dashboard-empty">
                        No tienes proyectos todavía.
                    </div>
                `
        }

    `;

}


function createRankPilotProject() {

    const nameInput =
        document.getElementById(
            "rankpilotNewProjectName"
        );


    const urlInput =
        document.getElementById(
            "rankpilotNewProjectUrl"
        );


    const name =
        nameInput?.value.trim();


    const url =
        normalizeUrl(
            urlInput?.value.trim()
        );


    if (!name) {

        alert(
            "Introduce un nombre para el proyecto."
        );

        return;

    }


    if (!url) {

        alert(
            "Introduce una URL válida."
        );

        return;

    }


    const projects =
        getRankPilotProjects();


    const project = {

        id:
            "project_" +
            Date.now(),

        name:
            name,

        url:
            url,

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString(),

        lastScore:
            null,

        analyses:
            []

    };


    projects.unshift(
        project
    );


    saveRankPilotProjects(
        projects
    );


    setActiveProjectId(
        project.id
    );


    renderProjectsSection(
        document.getElementById(
            "rankpilotDashboardContent"
        )
    );

}


function analyzeRankPilotProject(
    projectId
) {

    const projects =
        getRankPilotProjects();


    const project =
        projects.find(function(item) {

            return item.id === projectId;

        });


    if (!project) {
        return;
    }


    setActiveProjectId(
        project.id
    );


    closeRankPilotDashboard();


    if (input) {

        input.value =
            project.url;

    }


    if (form) {

        form.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        setTimeout(
            function() {

                form.dispatchEvent(
                    new Event(
                        "submit",
                        {
                            bubbles:true,
                            cancelable:true
                        }
                    )
                );

            },
            300
        );

    }

}


window.analyzeRankPilotProject =
    analyzeRankPilotProject;


/* =========================================================
   PROJECT DETAIL
========================================================= */

function openRankPilotProject(
    projectId
) {

    const projects =
        getRankPilotProjects();


    const project =
        projects.find(function(item) {

            return item.id === projectId;

        });


    if (!project) {
        return;
    }


    const container =
        document.getElementById(
            "rankpilotDashboardContent"
        );


    if (!container) {
        return;
    }


    setActiveProjectId(
        project.id
    );


    const analyses =
        Array.isArray(project.analyses)
            ? project.analyses
            : [];


    container.innerHTML = `

        <button
            class="dashboard-action"
            onclick="
                openRankPilotDashboard('projects')
            "
        >
            ← Volver a proyectos
        </button>


        <h1
            class="dashboard-title"
            style="margin-top:25px;"
        >
            ${escapeHtml(project.name)}
        </h1>

        <p class="dashboard-subtitle">
            ${escapeHtml(project.url)}
        </p>


        <div class="dashboard-stats">

            <div class="dashboard-stat">

                <span>
                    Último score
                </span>

                <strong>
                    ${
                        project.lastScore === null
                            ? "—"
                            : project.lastScore
                    }
                </strong>

            </div>


            <div class="dashboard-stat">

                <span>
                    Análisis
                </span>

                <strong>
                    ${analyses.length}
                </strong>

            </div>


            <div class="dashboard-stat">

                <span>
                    Última actualización
                </span>

                <strong
                    style="font-size:15px;"
                >
                    ${project.updatedAt
                        ? new Date(
                            project.updatedAt
                        ).toLocaleDateString(
                            "es-ES"
                        )
                        : "—"
                    }
                </strong>

            </div>

        </div>


        <div style="margin-bottom:25px;">

            <button
                class="dashboard-action primary"
                onclick="
                    analyzeRankPilotProject(
                        '${escapeHtml(project.id)}'
                    )
                "
            >
                Analizar ahora
            </button>

        </div>


        <h3>
            Historial
        </h3>


        ${
            analyses.length
                ? `

                    <div class="dashboard-history">

                        ${
                            analyses
                                .map(function(analysis) {

                                    return `

                                        <div
                                            class="dashboard-history-row"
                                        >

                                            <div>

                                                <strong>
                                                    ${escapeHtml(
                                                        new Date(
                                                            analysis.createdAt
                                                        ).toLocaleDateString(
                                                            "es-ES"
                                                        )
                                                    )}
                                                </strong>

                                                <div
                                                    style="
                                                        color:#64748b;
                                                        font-size:13px;
                                                    "
                                                >
                                                    ${escapeHtml(
                                                        analysis.url
                                                    )}
                                                </div>

                                            </div>


                                            <strong>
                                                ${analysis.score}/100
                                            </strong>


                                            <span>
                                                ${escapeHtml(
                                                    getStatus(
                                                        analysis.score
                                                    )
                                                )}
                                            </span>


                                            <button
                                                class="dashboard-action"
                                                onclick="
                                                    restoreRankPilotAnalysis(
                                                        '${escapeHtml(
                                                            project.id
                                                        )}',
                                                        '${escapeHtml(
                                                            analysis.id
                                                        )}'
                                                    )
                                                "
                                            >
                                                Ver análisis
                                            </button>

                                        </div>

                                    `;

                                })
                                .join("")
                        }

                    </div>

                `
                : `
                    <div class="dashboard-empty">

                        Todavía no hay análisis guardados
                        para este proyecto.

                    </div>
                `
        }

    `;

}


window.openRankPilotProject =
    openRankPilotProject;


/* =========================================================
   RESTORE ANALYSIS
========================================================= */

function restoreRankPilotAnalysis(
    projectId,
    analysisId
) {

    const projects =
        getRankPilotProjects();


    const project =
        projects.find(function(item) {

            return item.id === projectId;

        });


    if (!project) {
        return;
    }


    const analysis =
        (
            project.analyses || []
        ).find(function(item) {

            return item.id === analysisId;

        });


    if (!analysis || !analysis.data) {
        return;
    }


    currentData =
        analysis.data;


    currentMainUrl =
        analysis.url ||
        currentData.finalUrl ||
        currentData.url ||
        "";


    closeRankPilotDashboard();


    if (message) {

        message.scrollIntoView({
            behavior:"smooth",
            block:"start"
        });

    }


    renderResults(
        currentData,
        {
            save:false
        }
    );

}


window.restoreRankPilotAnalysis =
    restoreRankPilotAnalysis;


/* =========================================================
   DELETE PROJECT
========================================================= */

function deleteRankPilotProject(
    projectId
) {

    const projects =
        getRankPilotProjects();


    const project =
        projects.find(function(item) {

            return item.id === projectId;

        });


    if (!project) {
        return;
    }


    const confirmed =
        confirm(
            `¿Eliminar el proyecto "${project.name}"?`
        );


    if (!confirmed) {
        return;
    }


    const remaining =
        projects.filter(function(item) {

            return item.id !== projectId;

        });


    saveRankPilotProjects(
        remaining
    );


    if (
        getActiveProjectId() === projectId
    ) {

        setActiveProjectId(
            null
        );

    }


    renderProjectsSection(
        document.getElementById(
            "rankpilotDashboardContent"
        )
    );

}


window.deleteRankPilotProject =
    deleteRankPilotProject;


/* =========================================================
   HISTORY SECTION
========================================================= */

function renderHistorySection(
    container
) {

    const projects =
        getRankPilotProjects();


    const analyses =
        projects.flatMap(
            function(project) {

                return (
                    project.analyses || []
                ).map(
                    function(analysis) {

                        return {

                            ...analysis,

                            projectName:
                                project.name,

                            projectId:
                                project.id

                        };

                    }
                );

            }
        );


    analyses.sort(
        function(a, b) {

            return new Date(
                b.createdAt
            ) - new Date(
                a.createdAt
            );

        }
    );


    container.innerHTML = `

        <h1 class="dashboard-title">
            Historial
        </h1>

        <p class="dashboard-subtitle">
            Consulta la evolución de tus análisis SEO.
        </p>


        ${
            analyses.length
                ? `

                    <div class="dashboard-history">

                        ${
                            analyses
                                .map(function(analysis) {

                                    return `

                                        <div
                                            class="dashboard-history-row"
                                        >

                                            <div>

                                                <strong>
                                                    ${escapeHtml(
                                                        analysis.projectName
                                                    )}
                                                </strong>

                                                <div
                                                    style="
                                                        color:#64748b;
                                                        font-size:13px;
                                                    "
                                                >
                                                    ${new Date(
                                                        analysis.createdAt
                                                    ).toLocaleDateString(
                                                        "es-ES"
                                                    )}
                                                </div>

                                            </div>


                                            <strong>
                                                ${analysis.score}/100
                                            </strong>


                                            <span>
                                                ${escapeHtml(
                                                    getStatus(
                                                        analysis.score
                                                    )
                                                )}
                                            </span>


                                            <button
                                                class="dashboard-action"
                                                onclick="
                                                    restoreRankPilotAnalysis(
                                                        '${escapeHtml(
                                                            analysis.projectId
                                                        )}',
                                                        '${escapeHtml(
                                                            analysis.id
                                                        )}'
                                                    )
                                                "
                                            >
                                                Ver análisis
                                            </button>

                                        </div>

                                    `;

                                })
                                .join("")
                        }

                    </div>

                `
                : `
                    <div class="dashboard-empty">

                        Todavía no tienes análisis
                        guardados.

                    </div>
                `
        }

    `;

}


/* =========================================================
   ACCOUNT / PLANS
========================================================= */

const RANKPILOT_ACCOUNT_KEY =
    "rankpilot_account_v1";


function getRankPilotAccount() {

    try {

        return JSON.parse(
            localStorage.getItem(
                RANKPILOT_ACCOUNT_KEY
            ) || "null"
        );

    } catch (error) {

        return null;

    }

}


function saveRankPilotAccount(
    account
) {

    localStorage.setItem(
        RANKPILOT_ACCOUNT_KEY,
        JSON.stringify(account)
    );

}


function renderAccountSection(
    container
) {

    const account =
        getRankPilotAccount();


    const name =
        account?.name ||
        "Usuario";


    const email =
        account?.email ||
        "Sin email";


    const plan =
        account?.plan ||
        "starter";


    container.innerHTML = `

        <h1 class="dashboard-title">
            Mi cuenta
        </h1>

        <p class="dashboard-subtitle">
            Gestiona tu perfil y plan de RankPilot.
        </p>


        <div class="dashboard-create">

            <h3>
                Perfil
            </h3>

            <p>
                <strong>
                    ${escapeHtml(name)}
                </strong>
            </p>

            <p>
                ${escapeHtml(email)}
            </p>

            <p>
                Plan actual:
                <strong>
                    ${escapeHtml(
                        getPlanName(plan)
                    )}
                </strong>
            </p>

        </div>


        <h3>
            Planes
        </h3>


        <div class="dashboard-projects">

            ${renderPlanCard(
                "starter",
                "Starter",
                "0 €",
                "Para empezar"
            )}

            ${renderPlanCard(
                "pro",
                "Pro",
                "19 €/mes",
                "Para profesionales"
            )}

            ${renderPlanCard(
                "agency",
                "Agency",
                "49 €/mes",
                "Para agencias"
            )}

        </div>

    `;

}


function getPlanName(
    plan
) {

    const names = {

        starter: "Starter",

        pro: "Pro",

        agency: "Agency"

    };


    return names[plan] ||
        "Starter";

}


function renderPlanCard(
    plan,
    name,
    price,
    description
) {

    const account =
        getRankPilotAccount();


    const active =
        account?.plan === plan;


    return `

        <div class="dashboard-project">

            <h4>
                ${escapeHtml(name)}
            </h4>

            <div
                style="
                    color:#64748b;
                    margin-bottom:8px;
                "
            >
                ${escapeHtml(description)}
            </div>

            <div class="dashboard-project-score">
                ${escapeHtml(price)}
            </div>

            <button
                class="
                    dashboard-action
                    ${active ? "primary" : ""}
                "
                onclick="
                    rankPilotSelectPlan(
                        '${plan}'
                    )
                "
            >
                ${
                    active
                        ? "Plan actual"
                        : "Seleccionar"
                }
            </button>

        </div>

    `;

}


function rankPilotSelectPlan(
    plan
) {

    const account =
        getRankPilotAccount();


    if (!account) {

        alert(
            "Primero crea una cuenta."
        );

        return;

    }


    account.plan =
        plan;


    saveRankPilotAccount(
        account
    );


    renderAccountSection(
        document.getElementById(
            "rankpilotDashboardContent"
        )
    );

}


window.rankPilotSelectPlan =
    rankPilotSelectPlan;


window.openRankPilotAccount =
    function() {

        openRankPilotDashboard(
            "account"
        );

    };


/* =========================================================
   ACCOUNT HEADER
========================================================= */

function initializeHeaderAccount() {

    const loginBtn =
        document.getElementById(
            "loginBtn"
        );


    if (!loginBtn) {

        console.warn(
            "RankPilot: #loginBtn no encontrado."
        );

        return;

    }


    /*
     * Eliminar cualquier sistema antiguo.
     */

    [
        "rankpilotAccountButton",
        "rankpilotAccountMenu",
        "rankpilotAccountModal",
        "rankpilotLoginModal",
        "rankpilotRegisterModal"
    ]
        .forEach(function(id) {

            const element =
                document.getElementById(id);

            if (element) {
                element.remove();
            }

        });


    document
        .querySelectorAll(
            ".rankpilot-floating-login, " +
            ".rankpilot-login-floating"
        )
        .forEach(function(element) {

            element.remove();

        });


    /*
     * Wrapper
     */

    const wrapper =
        document.createElement("div");


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
     * Estilos
     */

    if (
        !document.getElementById(
            "rankpilotHeaderAccountStyles"
        )
    ) {

        const style =
            document.createElement("style");


        style.id =
            "rankpilotHeaderAccountStyles";


        style.textContent = `

            .rankpilot-account-wrapper {
                position:relative;
                display:inline-flex;
                align-items:center;
            }

            #rankpilotAccountMenu {
                position:absolute;
                top:calc(100% + 10px);
                right:0;
                width:225px;
                padding:7px;
                background:#fff;
                border:1px solid #e5e7eb;
                border-radius:14px;
                box-shadow:
                    0 15px 40px rgba(15,23,42,.15);
                z-index:99990;
                display:none;
            }

            #rankpilotAccountMenu.open {
                display:block;
            }

            .rankpilot-account-menu-item {
                width:100%;
                display:flex;
                align-items:center;
                gap:10px;
                padding:11px 12px;
                border:0;
                border-radius:9px;
                background:transparent;
                color:#334155;
                font-size:14px;
                text-align:left;
                cursor:pointer;
            }

            .rankpilot-account-menu-item:hover {
                background:#f1f5f9;
            }

            .rankpilot-account-divider {
                height:1px;
                margin:6px 4px;
                background:#e5e7eb;
            }

            .rankpilot-account-danger {
                color:#dc2626;
            }

            .rankpilot-auth-modal {
                position:fixed;
                inset:0;
                z-index:999999;
                display:none;
                align-items:center;
                justify-content:center;
                padding:20px;
            }

            .rankpilot-auth-modal.open {
                display:flex;
            }

            .rankpilot-auth-overlay {
                position:absolute;
                inset:0;
                background:rgba(15,23,42,.68);
                backdrop-filter:blur(6px);
            }

            .rankpilot-auth-box {
                position:relative;
                z-index:2;
                width:100%;
                max-width:440px;
                max-height:calc(100vh - 40px);
                overflow:auto;
                box-sizing:border-box;
                padding:32px;
                border-radius:20px;
                background:#fff;
                box-shadow:
                    0 30px 80px rgba(15,23,42,.25);
            }

            .rankpilot-auth-close {
                position:absolute;
                top:14px;
                right:17px;
                border:0;
                background:none;
                color:#64748b;
                font-size:28px;
                cursor:pointer;
            }

            .rankpilot-auth-header {
                text-align:center;
                margin-bottom:24px;
            }

            .rankpilot-auth-logo {
                width:46px;
                height:46px;
                display:flex;
                align-items:center;
                justify-content:center;
                margin:0 auto 14px;
                border-radius:12px;
                background:#111827;
                color:#fff;
                font-size:22px;
                font-weight:800;
            }

            .rankpilot-auth-header h2 {
                margin:0 0 8px;
                color:#0f172a;
                font-size:26px;
            }

            .rankpilot-auth-header p {
                margin:0;
                color:#64748b;
                font-size:14px;
            }

            .rankpilot-auth-field {
                margin-bottom:16px;
            }

            .rankpilot-auth-field label {
                display:block;
                margin-bottom:6px;
                color:#334155;
                font-size:14px;
                font-weight:600;
            }

            .rankpilot-auth-field input {
                width:100%;
                box-sizing:border-box;
                padding:12px 14px;
                border:1px solid #dbe2ea;
                border-radius:10px;
                background:#fff;
                font-size:15px;
                outline:none;
            }

            .rankpilot-auth-field input:focus {
                border-color:#6366f1;
                box-shadow:
                    0 0 0 3px rgba(99,102,241,.12);
            }

            .rankpilot-auth-submit {
                width:100%;
                margin-top:4px;
            }

            .rankpilot-auth-message {
                min-height:20px;
                margin-bottom:9px;
                text-align:center;
                font-size:13px;
            }

            .rankpilot-auth-message.error {
                color:#dc2626;
            }

            .rankpilot-auth-message.success {
                color:#16a34a;
            }

            .rankpilot-auth-switch {
                margin-top:20px;
                padding-top:18px;
                border-top:1px solid #e5e7eb;
                text-align:center;
                color:#64748b;
                font-size:14px;
            }

            .rankpilot-auth-switch button {
                border:0;
                background:transparent;
                color:#4f46e5;
                font-weight:600;
                cursor:pointer;
            }

            .rankpilot-register-terms {
                display:flex;
                gap:8px;
                align-items:flex-start;
                margin-bottom:17px;
                color:#64748b;
                font-size:13px;
                line-height:1.5;
            }

            @media(max-width:600px) {

                #rankpilotAccountMenu {
                    right:-5px;
                    width:210px;
                }

                .rankpilot-auth-box {
                    padding:25px 20px;
                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    /*
     * Crear menú
     */

    const menu =
        document.createElement("div");


    menu.id =
        "rankpilotAccountMenu";


    menu.innerHTML = `

        <button
            type="button"
            class="rankpilot-account-menu-item"
            data-account-action="login"
        >
            <span>🔐</span>
            <span>Iniciar sesión</span>
        </button>


        <button
            type="button"
            class="rankpilot-account-menu-item"
            data-account-action="register"
        >
            <span>✨</span>
            <span>Crear cuenta</span>
        </button>


        <div class="rankpilot-account-divider"></div>


        <button
            type="button"
            class="rankpilot-account-menu-item"
            data-account-action="dashboard"
        >
            <span>📊</span>
            <span>Dashboard</span>
        </button>


        <button
            type="button"
            class="rankpilot-account-menu-item"
            data-account-action="projects"
        >
            <span>📁</span>
            <span>Mis proyectos</span>
        </button>


        <button
            type="button"
            class="rankpilot-account-menu-item"
            data-account-action="history"
        >
            <span>📈</span>
            <span>Historial</span>
        </button>


        <button
            type="button"
            class="rankpilot-account-menu-item"
            data-account-action="account"
        >
            <span>⚙️</span>
            <span>Mi cuenta</span>
        </button>


        <div class="rankpilot-account-divider"></div>


        <button
            type="button"
            class="
                rankpilot-account-menu-item
                rankpilot-account-danger
            "
            data-account-action="logout"
        >
            <span>🚪</span>
            <span>Cerrar sesión</span>
        </button>

    `;


    wrapper.appendChild(
        menu
    );


    /* =====================================================
       LOGIN MODAL
    ===================================================== */

    function createLoginModal() {

        if (
            document.getElementById(
                "rankpilotLoginModal"
            )
        ) {
            return;
        }


        const modal =
            document.createElement("div");


        modal.id =
            "rankpilotLoginModal";


        modal.className =
            "rankpilot-auth-modal";


        modal.innerHTML = `

            <div class="rankpilot-auth-overlay"></div>


            <div class="rankpilot-auth-box">

                <button
                    type="button"
                    class="rankpilot-auth-close"
                    id="rankpilotLoginClose"
                >
                    ×
                </button>


                <div class="rankpilot-auth-header">

                    <div class="rankpilot-auth-logo">
                        R
                    </div>

                    <h2>
                        Iniciar sesión
                    </h2>

                    <p>
                        Accede a tu espacio de RankPilot.
                    </p>

                </div>


                <form id="rankpilotLoginForm">

                    <div class="rankpilot-auth-field">

                        <label>
                            Email
                        </label>

                        <input
                            id="rankpilotLoginEmail"
                            type="email"
                            placeholder="tu@email.com"
                            required
                        >

                    </div>


                    <div class="rankpilot-auth-field">

                        <label>
                            Contraseña
                        </label>

                        <input
                            id="rankpilotLoginPassword"
                            type="password"
                            placeholder="Tu contraseña"
                            required
                        >

                    </div>


                    <div
                        id="rankpilotLoginMessage"
                        class="rankpilot-auth-message"
                    ></div>


                    <button
                        type="submit"
                        class="
                            btn
                            btn-primary
                            rankpilot-auth-submit
                        "
                    >
                        Iniciar sesión
                    </button>

                </form>


                <div class="rankpilot-auth-switch">

                    ¿Todavía no tienes una cuenta?

                    <button
                        type="button"
                        id="rankpilotGoRegister"
                    >
                        Crear cuenta
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        modal
            .querySelector(
                ".rankpilot-auth-overlay"
            )
            .addEventListener(
                "click",
                closeLogin
            );


        document
            .getElementById(
                "rankpilotLoginClose"
            )
            .addEventListener(
                "click",
                closeLogin
            );


        document
            .getElementById(
                "rankpilotGoRegister"
            )
            .addEventListener(
                "click",
                function() {

                    closeLogin();

                    openRegister();

                }
            );


        document
            .getElementById(
                "rankpilotLoginForm"
            )
            .addEventListener(
                "submit",
                function(event) {

                    event.preventDefault();


                    const email =
                        document
                            .getElementById(
                                "rankpilotLoginEmail"
                            )
                            .value
                            .trim()
                            .toLowerCase();


                    const password =
                        document
                            .getElementById(
                                "rankpilotLoginPassword"
                            )
                            .value;


                    const account =
                        getRankPilotAccount();


                    const loginMessage =
                        document
                            .getElementById(
                                "rankpilotLoginMessage"
                            );


                    if (
                        !account ||
                        account.email !== email ||
                        account.password !== password
                    ) {

                        loginMessage.textContent =
                            "Email o contraseña incorrectos.";

                        loginMessage.className =
                            "rankpilot-auth-message error";

                        return;

                    }


                    account.loggedIn =
                        true;


                    saveRankPilotAccount(
                        account
                    );


                    refreshAccountUI();


                    loginMessage.textContent =
                        "✓ Sesión iniciada correctamente.";

                    loginMessage.className =
                        "rankpilot-auth-message success";


                    setTimeout(
                        closeLogin,
                        600
                    );

                }
            );

    }


    /* =====================================================
       REGISTER MODAL
    ===================================================== */

    function createRegisterModal() {

        if (
            document.getElementById(
                "rankpilotRegisterModal"
            )
        ) {
            return;
        }


        const modal =
            document.createElement("div");


        modal.id =
            "rankpilotRegisterModal";


        modal.className =
            "rankpilot-auth-modal";


        modal.innerHTML = `

            <div class="rankpilot-auth-overlay"></div>


            <div class="rankpilot-auth-box">

                <button
                    type="button"
                    class="rankpilot-auth-close"
                    id="rankpilotRegisterClose"
                >
                    ×
                </button>


                <div class="rankpilot-auth-header">

                    <div class="rankpilot-auth-logo">
                        R
                    </div>

                    <h2>
                        Crear tu cuenta
                    </h2>

                    <p>
                        Empieza gratis con RankPilot.
                    </p>

                </div>


                <form id="rankpilotRegisterForm">


                    <div class="rankpilot-auth-field">

                        <label>
                            Nombre
                        </label>

                        <input
                            id="rankpilotRegisterName"
                            type="text"
                            placeholder="Álvaro"
                            autocomplete="name"
                            required
                        >

                    </div>


                    <div class="rankpilot-auth-field">

                        <label>
                            Email
                        </label>

                        <input
                            id="rankpilotRegisterEmail"
                            type="email"
                            placeholder="tu@email.com"
                            autocomplete="email"
                            required
                        >

                    </div>


                    <div class="rankpilot-auth-field">

                        <label>
                            Contraseña
                        </label>

                        <input
                            id="rankpilotRegisterPassword"
                            type="password"
                            placeholder="Mínimo 8 caracteres"
                            minlength="8"
                            autocomplete="new-password"
                            required
                        >

                    </div>


                    <div class="rankpilot-auth-field">

                        <label>
                            Repetir contraseña
                        </label>

                        <input
                            id="rankpilotRegisterPassword2"
                            type="password"
                            placeholder="Repite tu contraseña"
                            minlength="8"
                            autocomplete="new-password"
                            required
                        >

                    </div>


                    <label
                        class="rankpilot-register-terms"
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
                        class="rankpilot-auth-message"
                    ></div>


                    <button
                        type="submit"
                        class="
                            btn
                            btn-primary
                            rankpilot-auth-submit
                        "
                    >
                        Crear cuenta
                    </button>

                </form>


                <div class="rankpilot-auth-switch">

                    ¿Ya tienes una cuenta?

                    <button
                        type="button"
                        id="rankpilotGoLogin"
                    >
                        Iniciar sesión
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        modal
            .querySelector(
                ".rankpilot-auth-overlay"
            )
            .addEventListener(
                "click",
                closeRegister
            );


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
                "rankpilotGoLogin"
            )
            .addEventListener(
                "click",
                function() {

                    closeRegister();

                    openLogin();

                }
            );


        document
            .getElementById(
                "rankpilotRegisterForm"
            )
            .addEventListener(
                "submit",
                function(event) {

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
                        document
                            .getElementById(
                                "rankpilotRegisterPassword"
                            )
                            .value;


                    const password2 =
                        document
                            .getElementById(
                                "rankpilotRegisterPassword2"
                            )
                            .value;


                    const terms =
                        document
                            .getElementById(
                                "rankpilotRegisterTerms"
                            )
                            .checked;


                    const registerMessage =
                        document
                            .getElementById(
                                "rankpilotRegisterMessage"
                            );


                    function showError(text) {

                        registerMessage.textContent =
                            text;

                        registerMessage.className =
                            "rankpilot-auth-message error";

                    }


                    if (!name) {

                        showError(
                            "Introduce tu nombre."
                        );

                        return;

                    }


                    if (!email) {

                        showError(
                            "Introduce un email válido."
                        );

                        return;

                    }


                    if (
                        password.length < 8
                    ) {

                        showError(
                            "La contraseña debe tener al menos 8 caracteres."
                        );

                        return;

                    }


                    if (
                        password !== password2
                    ) {

                        showError(
                            "Las contraseñas no coinciden."
                        );

                        return;

                    }


                    if (!terms) {

                        showError(
                            "Debes aceptar los términos y condiciones."
                        );

                        return;

                    }


                    const existing =
                        getRankPilotAccount();


                    if (
                        existing &&
                        existing.email === email
                    ) {

                        showError(
                            "Ya existe una cuenta con este email."
                        );

                        return;

                    }


                    const account = {

                        name:
                            name,

                        email:
                            email,

                        /*
                         * DEMO LOCAL.
                         * Se sustituirá por autenticación
                         * real cuando conectemos backend.
                         */

                        password:
                            password,

                        plan:
                            "starter",

                        loggedIn:
                            true,

                        createdAt:
                            new Date().toISOString()

                    };


                    saveRankPilotAccount(
                        account
                    );


                    refreshAccountUI();


                    registerMessage.textContent =
                        "✓ Cuenta creada correctamente.";

                    registerMessage.className =
                        "rankpilot-auth-message success";


                    setTimeout(
                        closeRegister,
                        700
                    );

                }
            );

    }


    /* =====================================================
       OPEN / CLOSE
    ===================================================== */

    function openLogin() {

        createLoginModal();


        const modal =
            document.getElementById(
                "rankpilotLoginModal"
            );


        modal.classList.add(
            "open"
        );


        document.body.style.overflow =
            "hidden";


        setTimeout(
            function() {

                document
                    .getElementById(
                        "rankpilotLoginEmail"
                    )
                    ?.focus();

            },
            100
        );

    }


    function closeLogin() {

        const modal =
            document.getElementById(
                "rankpilotLoginModal"
            );


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "open"
        );


        document.body.style.overflow =
            "";

    }


    function openRegister() {

        createRegisterModal();


        const modal =
            document.getElementById(
                "rankpilotRegisterModal"
            );


        modal.classList.add(
            "open"
        );


        document.body.style.overflow =
            "hidden";


        setTimeout(
            function() {

                document
                    .getElementById(
                        "rankpilotRegisterName"
                    )
                    ?.focus();

            },
            100
        );

    }


    function closeRegister() {

        const modal =
            document.getElementById(
                "rankpilotRegisterModal"
            );


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "open"
        );


        document.body.style.overflow =
            "";

    }


    /* =====================================================
       REFRESH HEADER
    ===================================================== */

    function refreshAccountUI() {

        const account =
            getRankPilotAccount();


        if (
            account &&
            account.loggedIn
        ) {

            const firstName =
                (
                    account.name ||
                    "Cuenta"
                )
                    .split(" ")[0];


            loginBtn.innerHTML =
                escapeHtml(
                    firstName
                ) +
                " ▾";

        } else {

            loginBtn.innerHTML =
                "Iniciar sesión";

        }

    }


    window.rankPilotRefreshAccountUI =
        refreshAccountUI;


    /* =====================================================
       LOGIN BUTTON
    ===================================================== */

    loginBtn.addEventListener(
        "click",
        function(event) {

            event.preventDefault();


            const account =
                getRankPilotAccount();


            if (
                account &&
                account.loggedIn
            ) {

                menu.classList.toggle(
                    "open"
                );

            } else {

                openLogin();

            }

        }
    );


    /* =====================================================
       MENU ACTIONS
    ===================================================== */

    menu
        .querySelectorAll(
            "[data-account-action]"
        )
        .forEach(function(button) {

            button.addEventListener(
                "click",
                function() {

                    const action =
                        button.dataset.accountAction;


                    menu.classList.remove(
                        "open"
                    );


                    switch (action) {

                        case "login":

                            openLogin();

                            break;


                        case "register":

                            openRegister();

                            break;


                        case "dashboard":

                            openRankPilotDashboard(
                                "dashboard"
                            );

                            break;


                        case "projects":

                            openRankPilotDashboard(
                                "projects"
                            );

                            break;


                        case "history":

                            openRankPilotDashboard(
                                "history"
                            );

                            break;


                        case "account":

                            openRankPilotDashboard(
                                "account"
                            );

                            break;


                        case "logout":

                            {

                                const account =
                                    getRankPilotAccount();


                                if (account) {

                                    account.loggedIn =
                                        false;


                                    saveRankPilotAccount(
                                        account
                                    );

                                }


                                refreshAccountUI();

                            }

                            break;

                    }

                }
            );

        });


    /* =====================================================
       CLICK FUERA
    ===================================================== */

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


    /* =====================================================
       ESC
    ===================================================== */

    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Escape"
            ) {

                menu.classList.remove(
                    "open"
                );

                closeLogin();

                closeRegister();

            }

        }
    );


    /* =====================================================
       INICIAL
    ===================================================== */

    refreshAccountUI();

}


/* =========================================================
   DASHBOARD FLOATING BUTTON
   SOLO DASHBOARD — NO LOGIN
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
        document.createElement("button");


    button.id =
        "rankpilotDashboardButton";


    button.type =
        "button";


    button.textContent =
        "Dashboard";


    button.addEventListener(
        "click",
        function() {

            openRankPilotDashboard(
                "dashboard"
            );

        }
    );


    button.style.cssText = `

        position:fixed;
        right:24px;
        bottom:24px;
        z-index:9990;

        padding:12px 17px;

        border:0;
        border-radius:12px;

        background:#111827;
        color:#fff;

        font-size:14px;
        font-weight:600;

        cursor:pointer;

        box-shadow:
            0 10px 30px rgba(15,23,42,.20);

    `;


    document.body.appendChild(
        button
    );

}


/* =========================================================
   INIT
========================================================= */

function rankPilotInitialize() {

    /*
     * Crear dashboard.
     */

    createDashboardButton();


    /*
     * Cuenta.
     */

    initializeHeaderAccount();

}


if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        rankPilotInitialize
    );

} else {

    rankPilotInitialize();

}


/* =========================================================
   CLEANUP LEGACY FLOATING LOGIN
   ========================================================= */

(function cleanupLegacyLogin() {

    function cleanup() {

        const legacyIds = [
            "rankpilotAccountButton",
            "rankpilotFloatingLogin",
            "rankpilotLoginFloating"
        ];


        legacyIds.forEach(
            function(id) {

                const element =
                    document.getElementById(
                        id
                    );


                if (element) {
                    element.remove();
                }

            }
        );


        document
            .querySelectorAll(
                ".rankpilot-floating-login, " +
                ".rankpilot-login-floating"
            )
            .forEach(
                function(element) {

                    element.remove();

                }
            );

    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            cleanup
        );

    } else {

        cleanup();

    }

})();

/* =========================================================
   RANKPILOT — CUENTA / LOGIN / CREAR CUENTA
   Usa el botón #loginBtn existente en el header
   ========================================================= */

(function initRankPilotAccountFixed() {

    function start() {

        const loginBtn = document.getElementById("loginBtn");

        if (!loginBtn) {
            console.warn("RankPilot: no se encontró #loginBtn");
            return;
        }

        /* -----------------------------------------
           ELIMINAR SISTEMAS ANTIGUOS DE LOGIN
        ----------------------------------------- */

        document
            .querySelectorAll(
                "#rankpilotAccountButton, #rankpilotFloatingLogin, .rankpilot-floating-login, [data-rankpilot-login-floating]"
            )
            .forEach(el => el.remove());


        /* -----------------------------------------
           CUENTA LOCAL
        ----------------------------------------- */

        const ACCOUNT_KEY = "rankpilot_account_v1";

        function getAccount() {

            try {

                return JSON.parse(
                    localStorage.getItem(ACCOUNT_KEY)
                ) || {
                    loggedIn: false,
                    name: "",
                    email: "",
                    plan: "starter"
                };

            } catch {

                return {
                    loggedIn: false,
                    name: "",
                    email: "",
                    plan: "starter"
                };

            }

        }


        function saveAccount(account) {

            localStorage.setItem(
                ACCOUNT_KEY,
                JSON.stringify(account)
            );

        }


        /* -----------------------------------------
           CSS
        ----------------------------------------- */

        if (!document.getElementById("rankpilot-account-fixed-css")) {

            const style = document.createElement("style");

            style.id = "rankpilot-account-fixed-css";

            style.textContent = `

                .rankpilot-account-wrapper {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                }

                #rankpilotAccountMenuFixed {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    width: 230px;
                    background: #ffffff;
                    border: 1px solid #e5e7eb;
                    border-radius: 14px;
                    box-shadow: 0 18px 50px rgba(0,0,0,.15);
                    padding: 8px;
                    z-index: 99999;
                    display: none;
                }

                #rankpilotAccountMenuFixed.open {
                    display: block;
                }

                .rankpilot-account-menu-title {
                    padding: 12px 13px;
                    font-size: 12px;
                    color: #6b7280;
                    border-bottom: 1px solid #eeeeee;
                    margin-bottom: 5px;
                }

                .rankpilot-account-menu-item {
                    width: 100%;
                    border: 0;
                    background: transparent;
                    text-align: left;
                    padding: 11px 13px;
                    border-radius: 9px;
                    cursor: pointer;
                    font-size: 14px;
                    color: #1f2937;
                    display: block;
                }

                .rankpilot-account-menu-item:hover {
                    background: #f3f4f6;
                }

                .rankpilot-account-menu-item.primary {
                    background: #111827;
                    color: white;
                    text-align: center;
                    margin-top: 5px;
                }

                .rankpilot-account-menu-item.primary:hover {
                    background: #1f2937;
                }

                .rankpilot-account-menu-item.register {
                    background: #2563eb;
                    color: white;
                    text-align: center;
                    margin-top: 5px;
                }

                .rankpilot-account-menu-item.register:hover {
                    background: #1d4ed8;
                }

                .rankpilot-account-divider {
                    height: 1px;
                    background: #eeeeee;
                    margin: 7px 0;
                }

                #rankpilotAuthModalFixed {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,.55);
                    backdrop-filter: blur(5px);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    z-index: 100000;
                }

                #rankpilotAuthModalFixed.open {
                    display: flex;
                }

                .rankpilot-auth-card {
                    width: min(440px, 100%);
                    background: white;
                    border-radius: 20px;
                    padding: 30px;
                    box-shadow: 0 25px 80px rgba(0,0,0,.25);
                    position: relative;
                }

                .rankpilot-auth-close {
                    position: absolute;
                    top: 14px;
                    right: 16px;
                    width: 34px;
                    height: 34px;
                    border: 0;
                    background: #f3f4f6;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 18px;
                }

                .rankpilot-auth-logo {
                    font-size: 24px;
                    font-weight: 800;
                    margin-bottom: 8px;
                }

                .rankpilot-auth-logo span {
                    color: #2563eb;
                }

                .rankpilot-auth-subtitle {
                    color: #6b7280;
                    margin-bottom: 25px;
                    font-size: 14px;
                }

                .rankpilot-auth-field {
                    margin-bottom: 15px;
                }

                .rankpilot-auth-field label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    margin-bottom: 6px;
                    color: #374151;
                }

                .rankpilot-auth-field input {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 12px 13px;
                    border: 1px solid #d1d5db;
                    border-radius: 10px;
                    font-size: 14px;
                    outline: none;
                }

                .rankpilot-auth-field input:focus {
                    border-color: #2563eb;
                }

                .rankpilot-auth-submit {
                    width: 100%;
                    border: 0;
                    background: #111827;
                    color: white;
                    padding: 13px;
                    border-radius: 10px;
                    cursor: pointer;
                    font-weight: 700;
                    margin-top: 5px;
                }

                .rankpilot-auth-submit:hover {
                    background: #1f2937;
                }

                .rankpilot-auth-register-submit {
                    background: #2563eb;
                }

                .rankpilot-auth-register-submit:hover {
                    background: #1d4ed8;
                }

                .rankpilot-auth-switch {
                    margin-top: 18px;
                    text-align: center;
                    font-size: 13px;
                    color: #6b7280;
                }

                .rankpilot-auth-switch button {
                    border: 0;
                    background: none;
                    color: #2563eb;
                    font-weight: 700;
                    cursor: pointer;
                    padding: 0;
                }

                .rankpilot-auth-message {
                    display: none;
                    padding: 10px 12px;
                    border-radius: 9px;
                    background: #fef2f2;
                    color: #b91c1c;
                    font-size: 13px;
                    margin-bottom: 15px;
                }

                @media (max-width: 600px) {

                    #rankpilotAccountMenuFixed {
                        right: -10px;
                        width: 220px;
                    }

                    .rankpilot-auth-card {
                        padding: 24px;
                    }

                }

            `;

            document.head.appendChild(style);

        }


        /* -----------------------------------------
           WRAPPER
        ----------------------------------------- */

        let wrapper = loginBtn.parentElement;

        if (!wrapper.classList.contains("rankpilot-account-wrapper")) {

            const newWrapper = document.createElement("div");

            newWrapper.className = "rankpilot-account-wrapper";

            loginBtn.parentNode.insertBefore(
                newWrapper,
                loginBtn
            );

            newWrapper.appendChild(loginBtn);

            wrapper = newWrapper;

        }


        /* -----------------------------------------
           MENÚ
        ----------------------------------------- */

        let menu = document.getElementById(
            "rankpilotAccountMenuFixed"
        );

        if (!menu) {

            menu = document.createElement("div");

            menu.id = "rankpilotAccountMenuFixed";

            wrapper.appendChild(menu);

        }


        /* -----------------------------------------
           MODAL
        ----------------------------------------- */

        let modal = document.getElementById(
            "rankpilotAuthModalFixed"
        );

        if (!modal) {

            modal = document.createElement("div");

            modal.id = "rankpilotAuthModalFixed";

            document.body.appendChild(modal);

        }


        /* -----------------------------------------
           MODAL LOGIN
        ----------------------------------------- */

        function showLogin() {

            modal.innerHTML = `

                <div class="rankpilot-auth-card">

                    <button
                        class="rankpilot-auth-close"
                        type="button"
                        id="rankpilotAuthCloseFixed"
                    >
                        ×
                    </button>

                    <div class="rankpilot-auth-logo">
                        Rank<span>Pilot</span>
                    </div>

                    <div class="rankpilot-auth-subtitle">
                        Accede a tu cuenta de RankPilot
                    </div>

                    <div
                        class="rankpilot-auth-message"
                        id="rankpilotAuthMessageFixed"
                    ></div>

                    <form id="rankpilotLoginFormFixed">

                        <div class="rankpilot-auth-field">

                            <label>Email</label>

                            <input
                                type="email"
                                id="rankpilotLoginEmailFixed"
                                placeholder="tu@email.com"
                                required
                            >

                        </div>

                        <div class="rankpilot-auth-field">

                            <label>Contraseña</label>

                            <input
                                type="password"
                                id="rankpilotLoginPasswordFixed"
                                placeholder="••••••••"
                                required
                            >

                        </div>

                        <button
                            type="submit"
                            class="rankpilot-auth-submit"
                        >
                            Iniciar sesión
                        </button>

                    </form>

                    <div class="rankpilot-auth-switch">

                        ¿No tienes cuenta?

                        <button
                            type="button"
                            id="rankpilotGoRegisterFixed"
                        >
                            Crear cuenta gratis
                        </button>

                    </div>

                </div>

            `;

            modal.classList.add("open");

            document
                .getElementById("rankpilotAuthCloseFixed")
                .onclick = closeModal;

            document
                .getElementById("rankpilotGoRegisterFixed")
                .onclick = showRegister;


            document
                .getElementById("rankpilotLoginFormFixed")
                .onsubmit = function(event) {

                    event.preventDefault();

                    const email =
                        document
                            .getElementById(
                                "rankpilotLoginEmailFixed"
                            )
                            .value
                            .trim();

                    const password =
                        document
                            .getElementById(
                                "rankpilotLoginPasswordFixed"
                            )
                            .value;

                    const account = getAccount();

                    if (
                        !account.email ||
                        account.email !== email
                    ) {

                        const msg =
                            document.getElementById(
                                "rankpilotAuthMessageFixed"
                            );

                        msg.textContent =
                            "No existe una cuenta con ese email. Puedes crear una cuenta gratis.";

                        msg.style.display = "block";

                        return;

                    }

                    if (
                        account.password &&
                        account.password !== password
                    ) {

                        const msg =
                            document.getElementById(
                                "rankpilotAuthMessageFixed"
                            );

                        msg.textContent =
                            "La contraseña no es correcta.";

                        msg.style.display = "block";

                        return;

                    }

                    account.loggedIn = true;

                    saveAccount(account);

                    closeModal();

                    updateHeader();

                };

        }


        /* -----------------------------------------
           MODAL CREAR CUENTA
        ----------------------------------------- */

        function showRegister() {

            modal.innerHTML = `

                <div class="rankpilot-auth-card">

                    <button
                        class="rankpilot-auth-close"
                        type="button"
                        id="rankpilotAuthCloseFixed"
                    >
                        ×
                    </button>

                    <div class="rankpilot-auth-logo">
                        Rank<span>Pilot</span>
                    </div>

                    <div class="rankpilot-auth-subtitle">
                        Crea tu cuenta gratis y empieza a analizar webs.
                    </div>

                    <div
                        class="rankpilot-auth-message"
                        id="rankpilotAuthMessageFixed"
                    ></div>

                    <form id="rankpilotRegisterFormFixed">

                        <div class="rankpilot-auth-field">

                            <label>Nombre</label>

                            <input
                                type="text"
                                id="rankpilotRegisterNameFixed"
                                placeholder="Álvaro"
                                required
                            >

                        </div>

                        <div class="rankpilot-auth-field">

                            <label>Email</label>

                            <input
                                type="email"
                                id="rankpilotRegisterEmailFixed"
                                placeholder="tu@email.com"
                                required
                            >

                        </div>

                        <div class="rankpilot-auth-field">

                            <label>Contraseña</label>

                            <input
                                type="password"
                                id="rankpilotRegisterPasswordFixed"
                                placeholder="••••••••"
                                minlength="6"
                                required
                            >

                        </div>

                        <div class="rankpilot-auth-field">

                            <label>Repite la contraseña</label>

                            <input
                                type="password"
                                id="rankpilotRegisterPassword2Fixed"
                                placeholder="••••••••"
                                minlength="6"
                                required
                            >

                        </div>

                        <button
                            type="submit"
                            class="rankpilot-auth-submit rankpilot-auth-register-submit"
                        >
                            Crear cuenta gratis
                        </button>

                    </form>

                    <div class="rankpilot-auth-switch">

                        ¿Ya tienes una cuenta?

                        <button
                            type="button"
                            id="rankpilotGoLoginFixed"
                        >
                            Iniciar sesión
                        </button>

                    </div>

                </div>

            `;

            modal.classList.add("open");

            document
                .getElementById("rankpilotAuthCloseFixed")
                .onclick = closeModal;

            document
                .getElementById("rankpilotGoLoginFixed")
                .onclick = showLogin;


            document
                .getElementById("rankpilotRegisterFormFixed")
                .onsubmit = function(event) {

                    event.preventDefault();

                    const name =
                        document
                            .getElementById(
                                "rankpilotRegisterNameFixed"
                            )
                            .value
                            .trim();

                    const email =
                        document
                            .getElementById(
                                "rankpilotRegisterEmailFixed"
                            )
                            .value
                            .trim();

                    const password =
                        document
                            .getElementById(
                                "rankpilotRegisterPasswordFixed"
                            )
                            .value;

                    const password2 =
                        document
                            .getElementById(
                                "rankpilotRegisterPassword2Fixed"
                            )
                            .value;

                    const msg =
                        document.getElementById(
                            "rankpilotAuthMessageFixed"
                        );


                    if (password !== password2) {

                        msg.textContent =
                            "Las contraseñas no coinciden.";

                        msg.style.display = "block";

                        return;

                    }


                    if (password.length < 6) {

                        msg.textContent =
                            "La contraseña debe tener al menos 6 caracteres.";

                        msg.style.display = "block";

                        return;

                    }


                    const account = {

                        loggedIn: true,

                        name,

                        email,

                        password,

                        plan: "starter",

                        createdAt:
                            new Date().toISOString()

                    };


                    saveAccount(account);

                    closeModal();

                    updateHeader();

                };

        }


        /* -----------------------------------------
           CERRAR MODAL
        ----------------------------------------- */

        function closeModal() {

            modal.classList.remove("open");

        }


        /* -----------------------------------------
           MENÚ LOGUEADO
        ----------------------------------------- */

        function showLoggedInMenu(account) {

            const firstName =
                account.name
                    ? account.name.split(" ")[0]
                    : "Cuenta";


            menu.innerHTML = `

                <div class="rankpilot-account-menu-title">
                    Cuenta de ${escapeAccountText(firstName)}
                </div>

                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="dashboard"
                >
                    Dashboard
                </button>

                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="projects"
                >
                    Mis proyectos
                </button>

                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="history"
                >
                    Historial
                </button>

                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="account"
                >
                    Mi cuenta
                </button>

                <div class="rankpilot-account-divider"></div>

                <button
                    type="button"
                    class="rankpilot-account-menu-item"
                    data-account-action="logout"
                >
                    Cerrar sesión
                </button>

            `;


            menu
                .querySelectorAll("[data-account-action]")
                .forEach(button => {

                    button.addEventListener(
                        "click",
                        function() {

                            const action =
                                this.dataset.accountAction;


                            if (action === "logout") {

                                const current =
                                    getAccount();

                                current.loggedIn = false;

                                saveAccount(current);

                                menu.classList.remove(
                                    "open"
                                );

                                updateHeader();

                                return;

                            }


                            if (
                                action === "dashboard" ||
                                action === "projects" ||
                                action === "history"
                            ) {

                                menu.classList.remove(
                                    "open"
                                );

                                const dashboardButton =
                                    document.getElementById(
                                        "rankpilotDashboardButton"
                                    );

                                if (dashboardButton) {

                                    dashboardButton.click();

                                }

                                return;

                            }


                            if (action === "account") {

                                menu.classList.remove(
                                    "open"
                                );

                                showAccountInfo();

                            }

                        }
                    );

                });

        }


        /* -----------------------------------------
           MENÚ SIN LOGIN
        ----------------------------------------- */

        function showLoggedOutMenu() {

            menu.innerHTML = `

                <div class="rankpilot-account-menu-title">
                    Tu cuenta RankPilot
                </div>

                <button
                    type="button"
                    class="rankpilot-account-menu-item primary"
                    data-account-action="login"
                >
                    Iniciar sesión
                </button>

                <button
                    type="button"
                    class="rankpilot-account-menu-item register"
                    data-account-action="register"
                >
                    Crear cuenta gratis
                </button>

            `;


            menu
                .querySelector(
                    '[data-account-action="login"]'
                )
                .onclick = function() {

                    menu.classList.remove("open");

                    showLogin();

                };


            menu
                .querySelector(
                    '[data-account-action="register"]'
                )
                .onclick = function() {

                    menu.classList.remove("open");

                    showRegister();

                };

        }


        /* -----------------------------------------
           ACTUALIZAR HEADER
        ----------------------------------------- */

        function updateHeader() {

            const account = getAccount();

            if (account.loggedIn) {

                const firstName =
                    account.name
                        ? account.name.split(" ")[0]
                        : "Cuenta";


                loginBtn.innerHTML =
                    escapeAccountText(firstName) +
                    " <span style='font-size:11px;margin-left:4px'>▾</span>";

                loginBtn.setAttribute(
                    "aria-label",
                    "Abrir menú de cuenta"
                );

                showLoggedInMenu(account);

            } else {

                loginBtn.innerHTML =
                    "Iniciar sesión";

                loginBtn.setAttribute(
                    "aria-label",
                    "Iniciar sesión"
                );

                showLoggedOutMenu();

            }

        }


        /* -----------------------------------------
           MI CUENTA
        ----------------------------------------- */

        function showAccountInfo() {

            const account = getAccount();

            modal.innerHTML = `

                <div class="rankpilot-auth-card">

                    <button
                        class="rankpilot-auth-close"
                        type="button"
                        id="rankpilotAuthCloseFixed"
                    >
                        ×
                    </button>

                    <div class="rankpilot-auth-logo">
                        Rank<span>Pilot</span>
                    </div>

                    <div class="rankpilot-auth-subtitle">
                        Mi cuenta
                    </div>

                    <div class="rankpilot-auth-field">

                        <label>Nombre</label>

                        <input
                            type="text"
                            value="${escapeAccountText(account.name || "")}"
                            disabled
                        >

                    </div>

                    <div class="rankpilot-auth-field">

                        <label>Email</label>

                        <input
                            type="email"
                            value="${escapeAccountText(account.email || "")}"
                            disabled
                        >

                    </div>

                    <div class="rankpilot-auth-field">

                        <label>Plan</label>

                        <input
                            type="text"
                            value="${account.plan === "starter"
                                ? "Starter — Gratis"
                                : account.plan === "pro"
                                ? "Pro — 19 €/mes"
                                : "Agency — 49 €/mes"}"
                            disabled
                        >

                    </div>

                    <button
                        type="button"
                        class="rankpilot-auth-submit"
                        id="rankpilotCloseAccountFixed"
                    >
                        Cerrar
                    </button>

                </div>

            `;

            modal.classList.add("open");

            document
                .getElementById("rankpilotAuthCloseFixed")
                .onclick = closeModal;

            document
                .getElementById("rankpilotCloseAccountFixed")
                .onclick = closeModal;

        }


        /* -----------------------------------------
           ESCAPE HTML
        ----------------------------------------- */

        function escapeAccountText(value) {

            return String(value || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        }


        /* -----------------------------------------
           CLICK EN EL BOTÓN DEL HEADER
        ----------------------------------------- */

        loginBtn.onclick = function(event) {

            event.preventDefault();

            event.stopPropagation();

            const account = getAccount();

            updateHeader();

            menu.classList.toggle("open");

        };


        /* -----------------------------------------
           CLICK FUERA
        ----------------------------------------- */

        document.addEventListener(
            "click",
            function(event) {

                if (
                    !wrapper.contains(event.target)
                ) {

                    menu.classList.remove("open");

                }

            }
        );


        /* -----------------------------------------
           CLICK FUERA DEL MODAL
        ----------------------------------------- */

        modal.addEventListener(
            "click",
            function(event) {

                if (event.target === modal) {

                    closeModal();

                }

            }
        );


        /* -----------------------------------------
           INICIALIZAR
        ----------------------------------------- */

        updateHeader();


        /* -----------------------------------------
           VIGILAR QUE OTRO CÓDIGO NO CREE
           OTRA VEZ EL BOTÓN ANTIGUO
        ----------------------------------------- */

        const observer =
            new MutationObserver(function() {

                document
                    .querySelectorAll(
                        "#rankpilotAccountButton, #rankpilotFloatingLogin, .rankpilot-floating-login"
                    )
                    .forEach(el => el.remove());

            });

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            start
        );

    } else {

        start();

    }

})();
