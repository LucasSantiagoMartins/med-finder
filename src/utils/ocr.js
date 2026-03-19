const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.transcreverImagemComGemini = async (caminhoArquivo) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const imagemBuffer = fs.readFileSync(caminhoArquivo);
    const imagemBase64 = imagemBuffer.toString("base64");

    const result = await model.generateContent([
      "Transcreva apenas os nomes dos medicamentos e dosagens desta receita médica. Ignore cabeçalhos e carimbos. Retorne apenas o texto.",
      {
        inlineData: {
          data: imagemBase64,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const texto = response.text();

    return texto ? texto.trim() : "";
  } catch (error) {
    console.error("Erro detalhado na chamada do Gemini:");

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Dados:", error.response.data);
    } else {
      console.error(error.message);
    }

    throw new Error("Não foi possível ler a receita com IA.");
  }
};
