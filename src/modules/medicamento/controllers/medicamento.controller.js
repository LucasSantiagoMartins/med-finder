const { text } = require("body-parser");
const db = require("../../../config/db");
const { transcreverImagemComGemini } = require("../../../utils/ocr");

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

exports.pesquisarPorReceita = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Por favor, envie uma foto da receita.",
      });
    }

    const textoExtraido = await transcreverImagemComGemini(req.file.path);

    if (!textoExtraido || textoExtraido.trim().length < 2) {
      return res.status(400).json({
        sucesso: false,
        mensagem:
          "Não foi possível detectar medicamentos nesta imagem. Certifique-se de que a foto está nítida.",
      });
    }

    const palavras = textoExtraido
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .split(/\s+/)
      .filter((p) => p.length > 2);

    if (palavras.length === 0) {
      return res.json({
        sucesso: true,
        texto_lido: textoExtraido,
        farmacias: [],
        mensagem:
          "Não encontramos farmácias com os medicamentos identificados na receita.",
      });
    }

    const filtros = palavras
      .map(() => "(m.nome LIKE ? OR m.dosagem LIKE ?)")
      .join(" OR ");

    let querySQL = `
      SELECT 
        f.id_farmacia,
        f.nome AS nome_farmacia, 
        f.endereco,
        f.latitude,
        f.longitude,
        f.foto_url AS foto_farmacia,
        CONCAT('[', 
          GROUP_CONCAT(
            JSON_OBJECT(
              'id_medicamento', m.id_medicamento,
              'nome', m.nome,
              'dosagem', m.dosagem,
              'preco', m.preco
            )
          ), 
        ']') AS medicamentos_disponiveis
      FROM farmacia f
      INNER JOIN (
        SELECT id_farmacia, MIN(id_medicamento) as id_medicamento, nome, dosagem, MIN(preco) as preco
        FROM medicamento
        GROUP BY id_farmacia, nome, dosagem
      ) m ON f.id_farmacia = m.id_farmacia
      WHERE ${filtros}
      GROUP BY f.id_farmacia 
      ORDER BY f.nome ASC
    `;

    const params = [];
    palavras.forEach((p) => {
      const termo = `%${p}%`;
      params.push(termo, termo);
    });

    const [resultados] = await db.query(querySQL, params);

    const resultadosFormatados = resultados.map((item) => ({
      ...item,
      medicamentos_disponiveis:
        typeof item.medicamentos_disponiveis === "string"
          ? JSON.parse(item.medicamentos_disponiveis)
          : item.medicamentos_disponiveis,
    }));

    res.json({
      sucesso: true,
      texto_lido: textoExtraido,
      farmacias: resultadosFormatados,
      mensagem:
        resultadosFormatados.length === 0
          ? "Medicamentos identificados, mas não encontrados nas farmácias próximas."
          : "Medicamentos localizados com sucesso.",
    });
  } catch (error) {
    console.error("Erro na busca por receita:", error);
    res.status(500).json({
      sucesso: false,
      mensagem: "Ocorreu um erro interno ao processar sua receita.",
    });
  }
};
