const express = require("express");
const router = express.Router();
const farmaciaController = require("../controllers/farmacia.controller");
const auth = require("../../../middleware/autenticacao-middleware");

router.get(
  "/painel",
  auth.permitirAcesso(["gerente"]),
  farmaciaController.exibirPainelFarmacia,
);
router.get(
  "/medicamentos",
  auth.permitirAcesso(["gerente"]),
  farmaciaController.exibirMedicamentos,
);
router.get(
  "/atualizar-estoque",
  auth.permitirAcesso(["gerente"]),
  farmaciaController.exibirAtualizarEstoque,
);
router.get(
  "/atualizacoes-estoque",
  auth.permitirAcesso(["gerente"]),
  farmaciaController.exibirAtualizacoesEstoque,
);
router.get(
  "/adicionar-medicamento",
  auth.permitirAcesso(["gerente"]),
  farmaciaController.paginaAdicionarMedicmento,
);
router.post(
  "/adicionar-medicamento",
  auth.permitirAcesso(["gerente"]),
  farmaciaController.adicionarMedicamento,
);
router.patch(
  "/editar-medicamento/:id",
  auth.permitirAcesso(["gerente"]),
  farmaciaController.editarMedicamento,
);
router.delete(
  "/remover-medicamento/:id",
  auth.permitirAcesso(["gerente"]),
  farmaciaController.removerMedicamento,
);

module.exports = router;
