const db = require("../../../config/db");
const validator = require("validator");
const bcrypt = require("bcryptjs");

exports.paginaCriarConta = (req, res) => {
  res.render("criar-conta");
};

exports.paginaEntrar = (req, res) => {
  res.render("entrar");
};

const existeTelefone = async (telefone) => {
  const [rows] = await db.query(
    "SELECT id_usuario FROM usuario WHERE telefone = ?",
    [telefone],
  );
  return rows.length > 0;
};

const existeEmail = async (email) => {
  if (!email) return false;
  const [rows] = await db.query(
    "SELECT id_usuario FROM usuario WHERE email = ?",
    [email],
  );
  return rows.length > 0;
};

exports.criarConta = async (req, res) => {
  const { nome, email, telefone, senha, confirmarSenha } = req.body;
  try {
    if (!nome || !email || !telefone || !senha) {
      return res
        .status(400)
        .json({
          mensagem: "Por favor informe todas as informações obrigatórias.",
        });
    }
    if(senha !== confirmarSenha) {
      return res.status(400).json({ mensagem: "As senhas não coincidem." });
    }
    const isValidPhoneNumber = validator.isMobilePhone(telefone + "", "any");

    if (!isValidPhoneNumber) {
      return res.status(400).json({ mensagem: "Dados inválidos." });
    }

    const resultado = await this.criarUsuarioInterno({
      nome,
      email,
      telefone,
      senha,
    });

    if (resultado.error) {
      return res.status(resultado.status).json({ mensagem: resultado.mensagem });
    }

    req.session.user = {
      id: resultado.id_usuario,
      telefone: resultado.telefone,
      nome: resultado.nome,
      tipo_usuario: resultado.tipo_usuario,
    };

    return res.status(201).json({
      mensagem: "Conta criada com sucesso.",
      redirectTo: "/autenticacao/entrar",
    });
  } catch (error) {
    console.log(error);
    if (error.mensagem === "Este número de telefone já está sendo usado.") {
      return res.status(400).json({ mensagem: error.mensagem });
    }
    return res.status(500).json({ mensagem: "Erro interno do sistema." });
  }
};

exports.criarUsuarioInterno = async (dados) => {
  const { nome, email, telefone, senha, tipo_usuario = "utente" } = dados;

  if (await existeTelefone(telefone)) {
    return {
      error: true,
      mensagem: "Este número de telefone já está sendo usado.",
      status: 400,
    };
  }

  if (email && (await existeEmail(email))) {
    return {
      error: true,
      mensagem: "Este e-mail já está sendo usado.",
      status: 400,r
    };
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const insertSQL = `
    INSERT INTO usuario 
    (nome, email, telefone, senha_hash, tipo_usuario, data_criacao) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  await db.query(insertSQL, [
    nome,
    email,
    telefone,
    senhaHash,
    tipo_usuario,
    new Date()
  ]);

  const [rows] = await db.query("SELECT * FROM usuario WHERE telefone = ?", [
    telefone,
  ]);

  return { error: false, data: rows[0] };
};

exports.entrar = async (req, res) => {
  const { email, senha } = req.body;

  try {
    if (!email || !senha) {
      return res.status(400).json({
        mensagem: "Informações inválidas.",
      });
    }

    const [rows] = await db.query(
      `SELECT id_usuario, nome, telefone, senha_hash, tipo_usuario
       FROM usuario
       WHERE email = ?`,
      [email],
    );

    if (rows.length === 0) {
      return res.status(400).json({
        mensagem: "Conta não encontrada.",
      });
    }

    const usuario = rows[0];

    const isMatch = await bcrypt.compare(senha, usuario.senha_hash);

    if (!isMatch) {
      return res.status(400).json({
        mensagem: "Palavra-passe incorreta.",
      });
    }

    req.session.usuario = {
      id: usuario.id_usuario,
      phoneNumber: usuario.telefone,
      nome: usuario.nome,
      tipo_usuario: usuario.tipo_usuario,
    };

    let redirecTo;

    if (usuario.tipo_usuario == "administrador") {
      redirecTo = "/administracao/painel";
    }
    if (usuario.tipo_usuario == "gerente") {
      redirecTo = "/farmacia/painel";
    }

    return res.status(200).json({
      mensagem: "Sessão iniciada com sucesso.",
      redirectTo: redirecTo ?? "/",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensagem: "Erro interno do sistema.",
    });
  }
};

exports.logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        mensagem: "Erro ao terminar sessão.",
      });
    }

    res.clearCookie("connect.sid");

    return res.redirect("/autenticacao/entrar");
  });
};
