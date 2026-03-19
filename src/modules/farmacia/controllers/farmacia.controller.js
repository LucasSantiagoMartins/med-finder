const db = require("../../../config/db");
const manipuladorPlanilha = require("../../../utils/manipulador-planilha");

exports.atualizarEstoque = async (req, res) => {
  const idUsuarioLogado = req.session.usuario.id;
  const ficheiro = req.file;
  let idFarmaciaLocalizada = null;
  const ficheiro_url = req.file ? `stocks/${req.file.filename}` : null;

  if (!ficheiro) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Por favor, selecione um ficheiro Excel.",
    });
  }

  try {
    const [farmacia] = await db.query(
      "SELECT id_farmacia FROM farmacia WHERE id_gerente = ?",
      [idUsuarioLogado],
    );

    if (farmacia.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem:
          "Não foi possível localizar a farmácia vinculada à sua conta.",
      });
    }
    idFarmaciaLocalizada = farmacia[0].id_farmacia;

    const listaMedicamentos = manipuladorPlanilha.processarExcelMedicamentos(
      ficheiro.path,
    );

    let itensSucesso = 0;

    for (const med of listaMedicamentos) {
      if (med.nome) {
        await db.query(
          "INSERT INTO medicamento (nome, dosagem, quantidade, preco, id_farmacia, data_criacao) VALUES (?, ?, ?, ?, ?, NOW())",
          [
            med.nome,
            med.dosagem,
            med.quantidade,
            med.preco,
            idFarmaciaLocalizada,
          ],
        );
        itensSucesso++;
      }
    }
    await db.query(
      "INSERT INTO historico_atualizacao_estoque (id_farmacia, ficheiro, itens_processados, estado_processamento) VALUES (?, ?, ?, ?)",
      [idFarmaciaLocalizada, ficheiro_url || "N/A", itensSucesso, "Sucesso"],
    );

    return res.status(200).json({
      sucesso: true,
      mensagem: `${itensSucesso} medicamentos adicionados com sucesso!`,
    });
  } catch (error) {
    console.error("Erro na importação:", error);

    await db.query(
      "INSERT INTO historico_atualizacao_estoque (id_farmacia, ficheiro, itens_processados, estado_processamento) VALUES (?, ?, ?, ?)",
      [idFarmaciaLocalizada, ficheiro_url || "N/A", 0, "Erro"],
    );

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao processar o arquivo Excel.",
    });
  }
};

exports.adicionarMedicamento = async (req, res) => {
  try {
    const { nome, dosagem, quantidade, preco } = req.body;
    const idUsuarioLogado = req.session.usuario.id;

    if (!nome || !dosagem || !quantidade || !preco) {
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
      (nome, dosagem, quantidade, preco, data_criacao, id_farmacia) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.query(querySQL, [
      nome,
      dosagem,
      quantidade,
      preco,
      dataAtual,
      id_farmacia,
    ]);

    return res.status(200).json({
      sucesso: true,
      mensagem: "Medicamento adicionado com sucesso!",
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
    const { nome, dosagem, quantidade, preco } = req.body;
    const idUsuarioLogado = req.session.usuario.id;

    const [farmacia] = await db.query(
      "SELECT id_farmacia FROM farmacia WHERE id_gerente = ?",
      [idUsuarioLogado],
    );

    if (farmacia.length === 0) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Acesso negado. Farmácia não encontrada.",
      });
    }

    const id_farmacia = farmacia[0].id_farmacia;

    const querySQL = `
      UPDATE medicamento 
      SET nome = ?, dosagem = ?, quantidade = ?, preco = ?
      WHERE id_medicamento = ? AND id_farmacia = ?
    `;

    const [resultado] = await db.query(querySQL, [
      nome,
      dosagem,
      quantidade,
      preco,
      id,
      id_farmacia,
    ]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: "Medicamento não encontrado ou não pertence à sua farmácia.",
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Medicamento atualizado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao editar medicamento:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao atualizar o medicamento.",
    });
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
      return res.status(403).json({
        sucesso: false,
        mensagem: "Acesso negado. Farmácia não encontrada.",
      });
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

    return res.status(200).json({
      sucesso: true,
      mensagem: "Medicamento removido com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao remover medicamento:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno ao remover o medicamento.",
    });
  }
};

exports.exibirPainelFarmacia = async (req, res) => {
  try {
    const idUsuarioLogado = req.session.usuario.id;

    const [farmacia] = await db.query(
      "SELECT id_farmacia FROM farmacia WHERE id_gerente = ?",
      [idUsuarioLogado],
    );

    if (farmacia.length === 0) {
      return res
        .status(404)
        .json({ sucesso: false, mensagem: "Farmácia não encontrada." });
    }

    const id_farmacia = farmacia[0].id_farmacia;

    const [totalMeds] = await db.execute(
      "SELECT COUNT(*) as total FROM medicamento WHERE id_farmacia = ?",
      [id_farmacia],
    );

    const [ultimaAtu] = await db.execute(
      "SELECT data_criacao FROM medicamento WHERE id_farmacia = ? ORDER BY data_criacao DESC LIMIT 1",
      [id_farmacia],
    );

    const [medsDestaque] = await db.execute(
      "SELECT nome, quantidade, preco FROM medicamento WHERE id_farmacia = ? ORDER BY data_criacao DESC LIMIT 4",
      [id_farmacia],
    );

    return res.render("painel-farmacia", {
      titulo: "Painel da Farmácia",
      usuario: req.session.usuario,
      activePage: "painel",
      stats: {
        total: totalMeds[0].total,
        ultimaAtualizacao: ultimaAtu[0]
          ? new Date(ultimaAtu[0].data_criacao).toLocaleDateString("pt-PT")
          : "Sem dados",
      },
      medicamentosDestaque: medsDestaque,
    });
  } catch (error) {
    console.error("Erro ao carregar painel:", error);
    return res
      .status(500)
      .json({ sucesso: false, mensagem: "Erro interno ao carregar o painel." });
  }
};

exports.exibirAtualizarEstoque = (req, res) => {
  return res.render("atualizar-estoque", {
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
      return res.status(403).json({
        sucesso: false,
        mensagem: "Farmácia não encontrada para este usuário.",
      });
    }

    const id_farmacia = farmacia[0].id_farmacia;

    const [medicamentos] = await db.query(
      "SELECT * FROM medicamento WHERE id_farmacia = ? ORDER BY nome ASC",
      [id_farmacia],
    );

    return res.render("medicamentos", {
      titulo: "Catálogo de Medicamentos",
      usuario: req.session.usuario,
      activePage: "medicamentos",
      medicamentos: medicamentos,
    });
  } catch (error) {
    console.error("Erro ao carregar medicamentos:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro ao carregar a lista de medicamentos.",
    });
  }
};

exports.exibirAtualizacoesEstoque = async (req, res) => {
  try {
    const idUsuarioLogado = req.session.usuario.id;

    const [farmacia] = await db.query(
      "SELECT id_farmacia FROM farmacia WHERE id_gerente = ?",
      [idUsuarioLogado],
    );

    if (farmacia.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem:
          "Não foi possível localizar uma farmácia vinculada à sua conta de gerente.",
      });
    }

    const id_farmacia = farmacia[0].id_farmacia;

    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado_processamento = 'Sucesso' THEN 1 ELSE 0 END) as sucessos,
        SUM(CASE WHEN estado_processamento = 'Erro' THEN 1 ELSE 0 END) as erros
      FROM historico_atualizacao_estoque 
      WHERE id_farmacia = ?`,
      [id_farmacia],
    );

    const [historico] = await db.query(
      `SELECT 
        id_processamento,
        data_criacao,
        ficheiro,
        itens_processados,
        estado_processamento
      FROM historico_atualizacao_estoque 
      WHERE id_farmacia = ?
      ORDER BY data_criacao DESC 
      LIMIT 15`,
      [id_farmacia],
    );

    return res.render("atualizacoes-estoque", {
      titulo: "Atualizações de Estoque",
      usuario: req.session.usuario,
      activePage: "atualizacoes-estoque",
      stats: {
        total: stats[0].total || 0,
        sucessos: stats[0].sucessos || 0,
        erros: stats[0].erros || 0,
      },
      historico: historico,
    });
  } catch (error) {
    console.error("Erro ao carregar histórico de stock:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Ocorreu um erro ao carregar as informações de atualização.",
    });
  }
};

exports.paginaAdicionarMedicmento = (req, res) => {
  return res.render("adicionar-medicamento", {
    titulo: "Adicionar Medicamento",
    usuario: req.session.usuario,
    activePage: "adicionar-medicamento",
  });
};
