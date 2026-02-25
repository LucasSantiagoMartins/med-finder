const express = require("express");
const router = express.Router();
const administracaoController = require("../controllers/administracao.controller");
const auth = require("../../../middleware/autenticacao-middleware");

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
  administracaoController.adicionarFarmacia,
);

router.get(
  "/farmacias",
  auth.permitirAcesso(["administrador"]),
  administracaoController.listarFarmacias,
);

router.delete(
  "/remover-farmacia/:id",
  auth.permitirAcesso(["administrador"]),
  administracaoController.removerFarmacia,
);

router.patch(
  "/editar-farmacia/:id",
  auth.permitirAcesso(["administrador"]),
  administracaoController.editarFarmacia,
);
module.exports = router;
