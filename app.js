const seoForm = document.getElementById("seoForm");
const urlInput = document.getElementById("urlInput");
const analyzerMessage = document.getElementById("analyzerMessage");

seoForm.addEventListener("submit", function (event) {
  event.preventDefault();

  let url = urlInput.value.trim();

  if (!url) {
    analyzerMessage.textContent = "Introduce una URL para comenzar el análisis.";
    analyzerMessage.style.color = "#ff6b6b";
    return;
  }

  // Añadir https:// si el usuario no lo escribe
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  analyzerMessage.style.color = "#98a2b3";
  analyzerMessage.textContent = "Analizando tu web...";

  // Simulación del análisis inicial
  setTimeout(() => {
    analyzerMessage.style.color = "#6d5dfc";
    analyzerMessage.innerHTML = `
      <strong>Análisis completado.</strong><br>
      RankPilot ha preparado una primera auditoría de ${url}.
    `;
  }, 1800);
});
    <p id="step">Crawling website...</p>
  </div>`;
  const steps = ["Crawling website...","Checking technical SEO...","Analyzing metadata...","Checking headings...","Analyzing images...","Checking internal links..."];
  let i=0;
  const timer=setInterval(()=>{
    i++;
    if(i<steps.length) document.getElementById("step").textContent=steps[i];
    else {
      clearInterval(timer);
      showResults(url.hostname);
    }
  },650);
});

function showResults(host){
  content.innerHTML = `<div class="analysis">
    <div class="eyebrow">AUDIT COMPLETE</div>
    <h2>${host}</h2>
    <div class="result-score">73 <span>/ 100</span></div>
    <p>We found <b>17 SEO opportunities</b>.</p>
    <div class="result-list">
      <div class="result-item">🔴 <span><b>Missing meta description</b><br>High-impact technical/on-page issue.</span></div>
      <div class="result-item">🟠 <span><b>7 images missing ALT attributes</b><br>Add descriptive alternative text.</span></div>
      <div class="result-item">🟠 <span><b>Duplicate title tags detected</b><br>Make important pages unique.</span></div>
      <div class="result-item">🟡 <span><b>H1 could be more descriptive</b><br>Clarify the primary topic.</span></div>
      <div class="result-item">🟡 <span><b>Internal linking could be improved</b><br>Create stronger contextual connections.</span></div>
    </div>
    <div class="locked"><b>🔒 12 more opportunities are locked</b><span>Upgrade to unlock the full audit and AI-powered fixes.</span></div>
    <br><a class="nav-btn" href="#pricing" onclick="closeModalNow()">View plans</a>
  </div>`;
}
function closeModalNow(){ modal.classList.add("hidden"); }
close.addEventListener("click", closeModalNow);
modal.addEventListener("click",(e)=>{if(e.target===modal) closeModalNow();});
