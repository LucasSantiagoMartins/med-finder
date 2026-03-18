const express = require("express");
const router = express.Router();
const administracaoController = require("../controllers/administracao.controller");
const auth = require("../../../middleware/autenticacao-middleware");
const upload = require("../../../utils/upload-config");

router.get(
  "/painel",
  auth.permitirAcesso(["administrador"]),
  administracaoController.exibirPainel,
);

router.get(
  "/adicionar-farmacia",
  auth.permitirAcesso(["administrador"]),
  administracaoController.exibirFormularioAdicionar,
);

router.post(
  "/adicionar-farmacia",
  auth.permitirAcesso(["administrador"]),
  upload.single("foto_url"),
  administracaoController.adicionarFarmacia,
);

router.get(
  "/farmacias",
  auth.permitirAcesso(["administrador"]),
  administracaoController.gestaoFarmacias,
);

router.delete(
  "/remover-farmacia/:id",
  auth.permitirAcesso(["administrador"]),
  administracaoController.removerFarmacia,
);

router.patch(
  "/editar-farmacia/:id",
  auth.permitirAcesso(["administrador"]),
  upload.single("foto_url"),
  administracaoController.editarFarmacia,
);

module.exports = router;
