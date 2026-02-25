const express = require('express')
const autenticacaoController = require('../controllers/autenticacao.controller')


const router = express.Router()

router.get('/criar-conta', autenticacaoController.paginaCriarConta)

router.post('/criar-conta', autenticacaoController.criarConta)

router.get('/entrar', autenticacaoController.paginaEntrar)
router.post('/entrar', autenticacaoController.entrar)
router.get('/logout', autenticacaoController.logout)

module.exports = router