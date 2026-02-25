const db = require("../../../config/db");

exports.adicionarMedicamento = async (req, res) => {
  try {
    const { nome, dosagem, quantidade, preco, data_vencimento, descricao } =
      req.body;
    const idUsuarioLogado = req.session.usuario.id;

    if (!nome || !dosagem || !quantidade || !preco || !data_vencimento) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Por favor, preencha todos os campos obrigatórios.",
      });
    }

    const [farmacia] = await db.query(
      "SELECT id_farmacia FROM farmacia WHERE id_gerente = ?",
      [idUsuarioLogado],
    );

    if (farmacia.length === 0) {
      return res.status(403).json({
        sucesso: false,
        mensagem:
          "Erro: Você não possui uma farmácia vinculada ao seu usuário.",
      });
    }

    const id_farmacia = farmacia[0].id_farmacia;
    const dataAtual = new Date();
    const querySQL = `
      INSERT INTO medicamento 
      (nome, dosagem, quantidade, preco, criado_em, data_vencimento, descricao, id_farmacia) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(querySQL, [
      nome,
      dosagem,
      quantidade,
      preco,
      dataAtual,
      data_vencimento,
      descricao || null,
      id_farmacia,
    ]);

    return res.json({
      sucesso: true,
      mensagem: "Medicamento adicionado com sucesso",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao adicionar o medicamento.",
    });
  }
};

exports.editarMedicamento = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, dosagem, quantidade, preco, data_vencimento, descricao } =
      req.body;
    const idUsuarioLogado = req.session.usuario.id;

    const [farmacia] = await db.query(
      "SELECT id_farmacia FROM farmacia WHERE id_gerente = ?",
      [idUsuarioLogado],
    );

    if (farmacia.length === 0) {
      return res
        .status(403)
        .json({ sucesso: false, mensagem: "Acesso negado." });
    }

    const id_farmacia = farmacia[0].id_farmacia;

    const querySQL = `
      UPDATE medicamento 
      SET nome = ?, dosagem = ?, quantidade = ?, preco = ?, data_vencimento = ?, descricao = ?
      WHERE id_medicamento = ? AND id_farmacia = ?
    `;

    const [resultado] = await db.query(querySQL, [
      nome,
      dosagem,
      quantidade,
      preco,
      data_vencimento,
      descricao || null,
      id,
      id_farmacia,
    ]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Medicamento não encontrado ou não pertence à sua farmácia.",
      });
    }

    return res.json({
      sucesso: true,
      mensagem: "Medicamento atualizado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao editar medicamento:", error);
    return res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro interno ao atualizar." });
  }
};

exports.removerMedicamento = async (req, res) => {
  try {
    const { id } = req.params;
    const idUsuarioLogado = req.session.usuario.id;

    const [farmacia] = await db.query(
      "SELECT id_farmacia FROM farmacia WHERE id_gerente = ?",
      [idUsuarioLogado],
    );

    if (farmacia.length === 0) {
      return res
        .status(403)
        .json({ sucesso: false, mensagem: "Acesso negado." });
    }

    const id_farmacia = farmacia[0].id_farmacia;

    const [resultado] = await db.query(
      "DELETE FROM medicamento WHERE id_medicamento = ? AND id_farmacia = ?",
      [id, id_farmacia],
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Não foi possível remover o medicamento.",
      });
    }

    return res.json({
      sucesso: true,
      mensagem: "Medicamento removido com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao remover medicamento:", error);
    return res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro interno ao remover." });
  }
};

exports.exibirPainelFarmacia = async (req, res) => {
  try {
    const idUsuarioLogado = req.session.usuario.id;

    const [farmacia] = await db.query(
      "SELECT id_farmacia FROM farmacia WHERE id_gerente = ?",
      [idUsuarioLogado],
    );
    const id_farmacia = farmacia[0].id_farmacia;

    const [totalMeds] = await db.execute(
      "SELECT COUNT(*) as total FROM medicamento WHERE id_farmacia = ?",
      [id_farmacia],
    );

    const [ultimaAtu] = await db.execute(
      "SELECT atualizado_em FROM medicamento WHERE id_farmacia = ? ORDER BY atualizado_em DESC LIMIT 1",
      [id_farmacia],
    );

    const [medsDestaque] = await db.execute(
      "SELECT nome, quantidade, preco FROM medicamento WHERE id_farmacia = ? ORDER BY atualizado_em DESC LIMIT 4",
      [id_farmacia],
    );


    res.render("painel-farmacia", {
      titulo: "Painel da Farmácia",
      usuario: req.session.usuario,
      activePage: "painel",
      stats: {
        total: totalMeds[0].total,
        ultimaAtualizacao: ultimaAtu[0]
          ? new Date(ultimaAtu[0].atualizado_em).toLocaleDateString("pt-PT")
          : "Sem dados",
      },
      medicamentosDestaque: medsDestaque,
    });
  } catch (error) {
    console.error("Erro ao carregar painel:", error);
    res.status(500).send("Erro interno do servidor");
  }
};

exports.exibirAtualizarEstoque = (req, res) => {
  res.render("atualizar-estoque", {
    titulo: "Atualizar estoque",
    usuario: req.session.usuario,
    activePage: "atualizar-estoque",
  });
};

exports.exibirMedicamentos = async (req, res) => {
  try {
    const idUsuarioLogado = req.session.usuario.id;

    const [farmacia] = await db.query(
      "SELECT id_farmacia FROM farmacia WHERE id_gerente = ?",
      [idUsuarioLogado],
    );

    if (farmacia.length === 0) {
      return res.status(403).send("Farmácia não encontrada para este usuário.");
    }

    const id_farmacia = farmacia[0].id_farmacia;

    const [medicamentos] = await db.query(
      "SELECT * FROM medicamento WHERE id_farmacia = ? ORDER BY nome ASC",
      [id_farmacia],
    );

    res.render("medicamentos", {
      titulo: "Catálogo de Medicamentos",
      usuario: req.session.usuario,
      activePage: "medicamentos",
      medicamentos: medicamentos,
    });
  } catch (error) {
    console.error("Erro ao carregar medicamentos:", error);
    res.status(500).send("Erro ao carregar a página de medicamentos.");
  }
};

exports.exibirAtualizacoesEstoque = (req, res) => {
  res.render("atualizacoes-estoque", {
    titulo: "Atualizações de Estoque",
    usuario: req.session.usuario,
    activePage: "atualizacoes-estoque",
  });
};

exports.paginaAdicionarMedicmento = (req, res) => {
  res.render("adicionar-medicamento", {
    titulo: "Adicionar Medicamento",
    usuario: req.session.usuario,
    activePage: "adicionar-medicamento",
  });
};
