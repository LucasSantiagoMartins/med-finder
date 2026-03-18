const express = require("express");
const router = express.Router();
const farmaciaController = require("../controllers/farmacia.controller");
const auth = require("../../../middleware/autenticacao-middleware");
const upload = require("../../../utils/upload-config");

router.get(
  "/painel",
  auth.permitirAcesso(["gerente"]),
  farmaciaController.exibirPainelFarmacia,
);

router.post(
  "/atualizar-estoque",
  auth.permitirAcesso(["gerente"]),
  (req, res, next) => {
    upload.single("planilha")(req, res, (err) => {
      if (err) {
        let mensagem = "Erro ao carregar o arquivo";

        if (err.code === "LIMIT_FILE_SIZE") {
          mensagem = "O arquivo é muito grande. O limite é 5MB";
        } else if (err.code === "LIMIT_FILE_TYPES") {
          mensagem = "Tipo de arquivo inválido. Use apenas CSV ou Excel";
        } else if (err) {
          mensagem = err.message;
        }

        return res.status(400).json({
          sucesso: false,
          mensagem: mensagem,
        });
      }
      next();
    });
  },
  farmaciaController.atualizarEstoque,
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
