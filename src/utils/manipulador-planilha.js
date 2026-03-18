const xlsx = require("xlsx");

exports.processarExcelMedicamentos = (caminhoArquivo) => {
  const workbook = xlsx.readFile(caminhoArquivo);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const dadosBrutos = xlsx.utils.sheet_to_json(worksheet);

  return dadosBrutos.map((linha) => ({
    nome: linha["nome"] || linha["Nome"],
    dosagem: linha["dosagem"] || linha["Dosagem"],
    quantidade: parseInt(linha["quantidade"] || linha["Quantidade"]) || 0,
    preco: parseInt(linha["preco"] || linha["Preco"] || linha["Preço"]) || 0,
  }));
};
