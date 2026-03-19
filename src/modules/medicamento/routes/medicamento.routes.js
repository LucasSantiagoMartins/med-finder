const express = require("express");
const router = express.Router();
const medicamentoController = require("../controllers/medicamento.controller");
const upload = require("../../../utils/upload-config");

router.get("/pesquisar", medicamentoController.pesquisarMedicamento);
router.post(
  "/pesquisar-por-receita",
  (req, res, next) => {
    upload.single("foto_receita")(req, res, (err) => {
      if (err) {
        let mensagem = "Erro ao carregar o arquivo";

        if (err.code === "LIMIT_FILE_SIZE") {
          mensagem = "O arquivo é muito grande. O limite é 5MB";
        } else if (err.code === "LIMIT_FILE_TYPES") {
          mensagem = "Tipo de arquivo inválido";
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
  medicamentoController.pesquisarPorReceita,
);

module.exports = router;
