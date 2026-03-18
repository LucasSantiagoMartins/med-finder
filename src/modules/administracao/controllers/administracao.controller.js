const {
  criarUsuarioInterno,
} = require("../../autenticacao/controllers/autenticacao.controller");
const db = require("../../../config/db");

exports.exibirPainel = async (req, res) => {
  try {
    const [[totalFarmacias]] = await db.query(
      "SELECT COUNT(*) as total FROM farmacia ",
    );
    const [[totalUtentes]] = await db.query(
      "SELECT COUNT(*) as total FROM usuario WHERE tipo_usuario = 'utente'",
    );
    const [[totalMedicamentos]] = await db.query(
      "SELECT COUNT(*) as total FROM medicamento",
    );

    const [recentes] = await db.query(`
      SELECT nome, endereco, telefone 
      FROM farmacia 
      ORDER BY id_farmacia DESC 
      LIMIT 3 
    `);

    return res.render("painel-administrativo", {
      titulo: "Painel Administrativo",
      usuario: req.session.usuario,
      activePage: "painel",
      estatisticas: {
        totalFarmacias: totalFarmacias.total,
        totalUtentes: totalUtentes.total,
        totalMedicamentos: totalMedicamentos.total,
      },
      farmaciasRecentes: recentes,
    });
  } catch (error) {
    console.error("Erro ao carregar painel:", error);
    res.status(500).send("Erro interno do servidor");
  }
};

exports.exibirFormularioAdicionar = (req, res) => {
  if (
    !req.session.usuario ||
    req.session.usuario.tipo_usuario !== "administrador"
  ) {
    return res.redirect("/");
  }

  return res.render("adicionar-farmacia", {
    usuario: req.session.usuario,
    titulo: "Adicionar Nova Farmácia",
    activePage: "adicionar",
  });
};

exports.gestaoFarmacias = async (req, res) => {
  if (
    !req.session.usuario ||
    req.session.usuario.tipo_usuario !== "administrador"
  ) {
    return res.redirect("/");
  }

  try {
    const querySQL = `
      SELECT 
        f.id_farmacia, 
        f.nome AS nome_farmacia, 
        f.endereco, 
        f.telefone, 
        f.nif,
        f.latitude,
        f.longitude,
        f.foto_url,
        u.nome AS nome_gerente
      FROM farmacia f
      LEFT JOIN usuario u ON f.id_gerente = u.id_usuario
      ORDER BY f.nome ASC
    `;

    const [farmacias] = await db.query(querySQL);

    return res.render("gestao-farmacias", {
      titulo: "Gestão de Farmácias",
      usuario: req.session.usuario,
      activePage: "gestao",
      farmacias: farmacias,
    });
  } catch (error) {
    console.error("Erro ao listar farmácias:", error);
    return res.status(500).send("Erro ao carregar a lista de farmácias.");
  }
};

exports.adicionarFarmacia = async (req, res) => {
  const {
    nomeFarmacia,
    enderecoFarmacia,
    telefoneFarmacia,
    nifFarmacia,
    latitude,
    longitude,
    nomeGerente,
    telefoneGerente,
    emailGerente,
    senhaGerente,
    confirmarSenha,
  } = req.body;
  const foto_url = req.file ? `/farmacias/${req.file.filename}` : null;

  try {
    if (
      !nomeFarmacia ||
      !enderecoFarmacia ||
      !nifFarmacia ||
      !emailGerente ||
      !senhaGerente ||
      !nomeGerente ||
      !telefoneGerente
    ) {
      return res
        .status(400)
        .json({ mensagem: "Informe todos campos obrigatórios." });
    }

    if (senhaGerente !== confirmarSenha) {
      return res.status(400).json({ mensagem: "As senhas não coincidem." });
    }

    const novoGerenteResultado = await criarUsuarioInterno({
      nome: nomeGerente,
      telefone: telefoneGerente,
      senha: senhaGerente,
      email: emailGerente,
      tipo_usuario: "gerente",
    });

    if (novoGerenteResultado.error) {
      return res
        .status(novoGerenteResultado.status)
        .json({ mensagem: novoGerenteResultado.mensagem });
    }

    const insertFarmaciaSQL = `
      INSERT INTO farmacia (nome, endereco, telefone, id_gerente, nif, latitude, longitude, foto_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(insertFarmaciaSQL, [
      nomeFarmacia,
      enderecoFarmacia,
      telefoneFarmacia || null,
      novoGerenteResultado.data.id_usuario,
      nifFarmacia,
      latitude || null,
      longitude || null,
      foto_url,
    ]);

    return res.status(201).json({
      mensagem: "Farmácia e Gerente cadastrados com sucesso",
      redirectTo: "/administracao/farmacias",
    });
  } catch (error) {
    if (error.mensagem === "Este número de telefone já está sendo usado.") {
      return res
        .status(400)
        .json({ mensagem: "O telefone do gerente já está em uso." });
    }

    console.error("Erro ao adicionar farmácia:", error);
    return res
      .status(500)
      .json({ mensagem: "Erro interno ao cadastrar farmácia." });
  }
};

exports.editarFarmacia = async (req, res) => {
  const { id } = req.params;
  const { nome_farmacia, nif, endereco } = req.body;

  try {
    if (!id) {
      return res.status(400).json({ mensagem: "ID da farmácia não fornecido" });
    }

    if (!nome_farmacia && !nif && !endereco) {
      return res
        .status(400)
        .json({ mensagem: "Nenhum dado fornecido para atualização." });
    }

    let campos = [];
    let valores = [];

    if (nome_farmacia) {
      campos.push("nome = ?");
      valores.push(nome_farmacia);
    }
    if (nif) {
      campos.push("nif = ?");
      valores.push(nif);
    }
    if (endereco) {
      campos.push("endereco = ?");
      valores.push(endereco);
    }

    valores.push(id);

    const updateSQL = `
      UPDATE farmacia 
      SET ${campos.join(", ")} 
      WHERE id_farmacia = ?
    `;

    const [result] = await db.query(updateSQL, valores);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Farmácia não encontrada." });
    }

    return res.status(200).json({
      mensagem: "Farmácia atualizada com sucesso",
      redirectTo: "/administracao/farmacias",
    });
  } catch (error) {
    console.error("Erro ao editar farmácia:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json({ mensagem: "Este NIF já está registado em outra farmácia." });
    }

    return res
      .status(500)
      .json({ mensagem: "Erro interno ao atualizar farmácia." });
  }
};

exports.removerFarmacia = async (req, res) => {
  const { id } = req.params;

  try {
    const [farmacia] = await db.query(
      "SELECT id_gerente FROM farmacia WHERE id_farmacia = ?",
      [id],
    );

    if (farmacia.length === 0) {
      return res.status(404).json({ mensagem: "Farmácia não encontrada." });
    }

    const idGerente = farmacia[0].id_gerente;

    await db.query("START TRANSACTION");

    await db.query("DELETE FROM farmacia WHERE id_farmacia = ?", [id]);

    if (idGerente) {
      await db.query("DELETE FROM usuario WHERE id_usuario = ?", [idGerente]);
    }

    await db.query("COMMIT");

    return res.status(200).json({
      mensagem: "Farmácia e Gerente removidos com sucesso.",
      success: true,
    });
  } catch (error) {
    await db.query("ROLLBACK");

    console.error("Erro ao remover farmácia e gerente:", error);
    return res.status(500).json({
      mensagem:
        "Erro interno ao tentar remover a farmácia e o seu responsável.",
    });
  }
};
