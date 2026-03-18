const express = require("express");
const router = express.Router();
const medicamentoController = require("../controllers/medicamento.controller");


router.get("/pesquisar", medicamentoController.pesquisarMedicamento);


module.exports = router;
