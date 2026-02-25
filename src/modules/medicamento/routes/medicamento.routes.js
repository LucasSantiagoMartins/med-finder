const express = require("express");
const router = express.Router();
const medicamentoContrlller = require("../controllers/medicamento.controller");

router.get("/pesquisar", medicamentoContrlller.pesquisarMedicamento);

module.exports = router;
