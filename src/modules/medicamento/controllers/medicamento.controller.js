const db = require("../../../config/db");

exports.pesquisarMedicamento = async (req, res) => {
  try {
    const termoPesquisa = req.query.q || "";

    let querySQL = `
      SELECT 
        m.*, 
        f.nome AS nome_farmacia, 
        f.endereco,
        f.latitude,
        f.longitude,
        f.foto_url AS foto_farmacia
      FROM medicamento m
      INNER JOIN farmacia f ON m.id_farmacia = f.id_farmacia
    `;

    let params = [];

    if (termoPesquisa) {
      querySQL += " WHERE m.nome LIKE ? OR m.dosagem LIKE ?";
      const likeTermo = `%${termoPesquisa}%`;
      params.push(likeTermo, likeTermo);
    }

    querySQL += " ORDER BY m.nome ASC";

    const [medicamentos] = await db.query(querySQL, params);

    res.json({
      sucesso: true,
      contagem: medicamentos.length,
      medicamentos: medicamentos,
    });
  } catch (error) {
    console.error("Erro ao pesquisar medicamentos:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno no servidor ao realizar a busca.",
    });
  }
};


