lucide.createIcons();

const inputPesquisa = document.getElementById("input-pesquisa");
const btnPesquisar = document.getElementById("btn-pesquisar-acao");
const heroContent = document.getElementById("hero-content");
const recipeCard = document.getElementById("recipe-card");
const featuresSection = document.getElementById("features-section");
const resultsContainer = document.getElementById("search-results-container");
const resultsGrid = document.getElementById("lista-medicamentos-grid");
const heroSection = document.getElementById("hero-section");

// --- PESQUISA MANUAL ---
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
      setTimeout(() => exibirResultados([]), 300);
    }
  } catch (error) {
    console.error("Erro na busca:", error);
    setTimeout(() => exibirResultados([]), 300);
  }
});

function exibirResultados(medicamentos) {
  resultsGrid.innerHTML = "";

  if (!medicamentos || medicamentos.length === 0) {
    resultsGrid.innerHTML = `
      <div class="col-12 text-center py-5 card-result-anim">
        <div class="bg-light p-5 rounded-4 border">
          <i data-lucide="search-x" class="text-muted mb-3" size="48"></i>
          <p class="text-muted fs-5">Nenhum medicamento encontrado para esta busca.</p>
          <button class="btn btn-outline-primary mt-3" onclick="voltarAoInicio()">Tentar outro termo</button>
        </div>
      </div>`;
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
        </div>`;
      resultsGrid.innerHTML += card;
    });
  }
  ativarLayoutResultados();
}

// --- LÓGICA DE UPLOAD E OCR ---
let selectedFiles = [];
const btnUpload = document.getElementById("btnUpload");
const inputFileOculto = document.createElement("input");
inputFileOculto.type = "file";
inputFileOculto.accept = "image/*";
inputFileOculto.multiple = true;

const fileList = document.getElementById("fileList");
const btnConfirm = document.getElementById("btnConfirm");
const uploadText = document.getElementById("uploadText");
const textConfirm = document.getElementById("textConfirm");

btnUpload.addEventListener("click", () => inputFileOculto.click());

inputFileOculto.addEventListener("change", (e) => {
  const newFiles = Array.from(e.target.files);
  if (selectedFiles.length + newFiles.length > 3) {
    if (typeof showToast === "function")
      showToast("error", "Máximo de 3 imagens.");
    return;
  }
  selectedFiles = [...selectedFiles, ...newFiles];
  renderFiles();
});

function renderFiles() {
  fileList.innerHTML = "";
  selectedFiles.forEach((file, index) => {
    const div = document.createElement("div");
    div.className =
      "file-item d-flex align-items-center justify-content-between p-2 bg-light rounded-3 mb-2";
    div.innerHTML = `
      <div class="d-flex align-items-center gap-2">
          <i data-lucide="file-image" class="text-primary" size="16"></i>
          <span class="small fw-medium">${file.name || file}</span>
      </div>
      <button class="btn btn-sm text-danger border-0" onclick="removeFile(${index})">
          <i data-lucide="trash-2" size="16"></i>
      </button>`;
    fileList.appendChild(div);
  });
  btnConfirm.disabled = selectedFiles.length === 0;
  uploadText.innerText =
    selectedFiles.length >= 3 ? "Limite máximo" : "Clique para selecionar";
  lucide.createIcons();
}

window.removeFile = (index) => {
  selectedFiles.splice(index, 1);
  renderFiles();
};

btnConfirm.addEventListener("click", async () => {
  if (selectedFiles.length === 0) return;

  const formData = new FormData();
  formData.append("foto_receita", selectedFiles[0]);

  btnConfirm.disabled = true;
  if (textConfirm) textConfirm.innerText = "A processar...";

  const result = await manipuladorRequisicao(
    "/medicamento/pesquisar-por-receita",
    false,
    {
      method: "POST",
      body: formData,
      silent: true,
    },
  );

  const modal = bootstrap.Modal.getInstance(
    document.getElementById("uploadModal"),
  );
  if (modal) modal.hide();

  heroContent.classList.add("fade-out");
  recipeCard.classList.add("fade-out");
  featuresSection.classList.add("fade-out");

  if (result && result.sucesso) {
    setTimeout(() => exibirResultadosReceita(result.farmacias), 300);
  } else {
    setTimeout(() => exibirResultadosReceita([]), 300);
  }

  btnConfirm.disabled = false;
  if (textConfirm) textConfirm.innerText = "Confirmar";
  selectedFiles = [];
  renderFiles();
});

function exibirResultadosReceita(farmacias) {
  resultsGrid.innerHTML = "";

  if (!farmacias || farmacias.length === 0) {
    resultsGrid.innerHTML = `
      <div class="col-12 text-center py-5 card-result-anim">
        <div class="bg-light p-5 rounded-4 border">
          <i data-lucide="file-warning" class="text-muted mb-3" size="48"></i>
          <p class="text-muted fs-5">Nenhuma farmácia encontrada com os medicamentos desta receita.</p>
          <button class="btn btn-outline-primary mt-3" onclick="voltarAoInicio()">Voltar ao início</button>
        </div>
      </div>`;
  } else {
    farmacias.forEach((farmacia, index) => {
      const delayClass = `stagger-${(index % 4) + 1}`;
      const foto = farmacia.foto_farmacia
        ? `http://localhost:8081/uploads/${farmacia.foto_farmacia}`
        : "https://placehold.co/600x400?text=Farmacia";

      let medsHtml = farmacia.medicamentos_disponiveis
        .map(
          (med) => `
        <div class="border-bottom border-2 border-white pb-2 mb-2">
            <div class="d-flex justify-content-between align-items-center">
                <h3 class="h6 fw-bold mb-0 text-primary">${med.nome}</h3>
                <span class="badge bg-white text-primary border rounded-pill small">${med.dosagem || ""}</span>
            </div>
            <div class="fw-bold text-dark">${Number(med.preco).toLocaleString("pt-AO")} Kzs</div>
        </div>
      `,
        )
        .join("");

      const card = `
        <div class="col-md-6 col-lg-4 card-result-anim ${delayClass}">
          <div class="card-elevated h-100">
            <img src="${foto}" alt="${farmacia.nome_farmacia}" class="farmacia-img-header">
            <div class="p-4">
              <div class="mb-3">
                  <h4 class="h5 fw-bold text-dark mb-0">${farmacia.nome_farmacia}</h4>
                  <p class="text-muted small mb-0"><i data-lucide="map-pin" size="12"></i> ${farmacia.endereco}</p>
              </div>
              <div class="bg-light p-3 rounded-3 mb-3">
                  ${medsHtml}
              </div>
              <a href="https://www.google.com/maps/search/?api=1&query=${farmacia.latitude},${farmacia.longitude}" 
                  target="_blank" 
                  class="btn btn-mapa w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2">
                  <i data-lucide="map" size="18"></i> Ver Localização
              </a>
            </div>
          </div>
        </div>`;
      resultsGrid.innerHTML += card;
    });
  }
  ativarLayoutResultados();
}

// --- FUNÇÕES DE INTERFACE ---
function ativarLayoutResultados() {
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
