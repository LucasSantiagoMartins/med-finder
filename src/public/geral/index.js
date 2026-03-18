lucide.createIcons();

const inputPesquisa = document.getElementById("input-pesquisa");
const btnPesquisar = document.getElementById("btn-pesquisar-acao");
const heroContent = document.getElementById("hero-content");
const recipeCard = document.getElementById("recipe-card");
const featuresSection = document.getElementById("features-section");
const resultsContainer = document.getElementById("search-results-container");
const resultsGrid = document.getElementById("lista-medicamentos-grid");
const heroSection = document.getElementById("hero-section");

btnPesquisar.addEventListener("click", async () => {
  const termo = inputPesquisa.value.trim();
  if (!termo) return;

  try {
    const url = `/medicamento/pesquisar?q=${encodeURIComponent(termo)}`;

    heroContent.classList.add("fade-out");
    recipeCard.classList.add("fade-out");
    featuresSection.classList.add("fade-out");

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    const result = await response.json();

    if (result.sucesso) {
      setTimeout(() => exibirResultados(result.medicamentos), 300);
    } else {
      voltarAoInicio();
    }
  } catch (error) {
    console.error("Erro na busca:", error);
    voltarAoInicio();
  }
});

function exibirResultados(medicamentos) {
  resultsGrid.innerHTML = "";

  if (medicamentos.length === 0) {
    resultsGrid.innerHTML = `<div class="col-12 text-center py-5 card-result-anim"><p class="text-muted">Nenhum medicamento encontrado para esta busca.</p></div>`;
  } else {
    medicamentos.forEach((med, index) => {
      const delayClass = `stagger-${(index % 4) + 1}`;
      const fotoFarmacia = med.foto_farmacia
        ? `http://localhost:8081/uploads/${med.foto_farmacia}`
        : "https://placehold.co/600x400?text=Farmacia";

      const precoFormatado = Number(med.preco).toLocaleString("pt-AO");

      const card = `
        <div class="col-md-6 col-lg-4 card-result-anim ${delayClass}">
          <div class="card-elevated h-100">
            <img src="${fotoFarmacia}" alt="${med.nome_farmacia}" class="farmacia-img-header">
            
            <div class="p-4">
              <div class="mb-3">
                  <h4 class="h5 fw-bold text-dark mb-0">${med.nome_farmacia}</h4>
                  <p class="text-muted small mb-0"><i data-lucide="map-pin" size="12"></i> ${med.endereco}</p>
              </div>

              <div class="bg-light p-3 rounded-3 mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                      <h3 class="h5 fw-bold mb-0 text-primary">${med.nome}</h3>
                      <span class="badge bg-white text-primary border border-primary-subtle rounded-pill">${med.dosagem || ""} mg</span>
                  </div>
                  <div class="fw-bold fs-5 text-dark">
                      ${precoFormatado} <span class="small">Kzs</span>
                  </div>
              </div>

              <a href="https://www.google.com/maps/search/?api=1&query=${med.latitude},${med.longitude}" 
                 target="_blank" 
                 class="btn btn-mapa w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2">
                  <i data-lucide="map" size="18"></i> Ver Localização
              </a>
            </div>
          </div>
        </div>
      `;
      resultsGrid.innerHTML += card;
    });
  }

  heroSection.style.marginTop = "0";
  heroSection.classList.remove("py-5");
  heroSection.classList.add("pt-4", "pb-0");

  heroContent.style.display = "none";
  recipeCard.style.display = "none";
  featuresSection.style.display = "none";

  resultsContainer.style.display = "block";
  setTimeout(() => {
    resultsContainer.style.opacity = "1";
    lucide.createIcons();
  }, 50);
}

function voltarAoInicio() {
  resultsContainer.style.opacity = "0";
  setTimeout(() => {
    resultsContainer.style.display = "none";

    heroSection.style.marginTop = "3rem";
    heroSection.classList.add("py-5");
    heroSection.classList.remove("pt-4", "pb-0");

    heroContent.style.display = "block";
    recipeCard.style.display = "flex";
    featuresSection.style.display = "block";

    heroContent.classList.remove("fade-out");
    recipeCard.classList.remove("fade-out");
    featuresSection.classList.remove("fade-out");
    inputPesquisa.value = "";
    lucide.createIcons();
  }, 400);
}

const files = [];
const btnUpload = document.getElementById("btnUpload");
const fileList = document.getElementById("fileList");
const btnConfirm = document.getElementById("btnConfirm");
const uploadText = document.getElementById("uploadText");

btnUpload.addEventListener("click", () => {
  if (files.length < 3) {
    const fileName = `receita_medica_${files.length + 1}.jpg`;
    files.push(fileName);
    renderFiles();
  }
});

function renderFiles() {
  fileList.innerHTML = "";
  files.forEach((file, index) => {
    const div = document.createElement("div");
    div.className =
      "file-item d-flex align-items-center justify-content-between p-2 bg-light rounded-3 mb-2";
    div.innerHTML = `
      <div class="d-flex align-items-center gap-2">
          <i data-lucide="file-image" class="text-primary" size="16"></i>
          <span class="small fw-medium">${file}</span>
      </div>
      <button class="btn btn-sm text-danger border-0" onclick="removeFile(${index})">
          <i data-lucide="trash-2" size="16"></i>
      </button>`;
    fileList.appendChild(div);
  });
  btnConfirm.disabled = files.length === 0;
  uploadText.innerText =
    files.length >= 3 ? "Limite máximo" : "Clique para selecionar";
  lucide.createIcons();
}

window.removeFile = (index) => {
  files.splice(index, 1);
  renderFiles();
};
