const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("./config/session-config");
const flash = require("connect-flash");
const autenticaoRoutes = require("./modules/autenticacao/routes/autenticacao.routes");
const administracaoRoutes = require("./modules/administracao/routes/administracao.routes");
const farmaciaRoutes = require("./modules/farmacia/routes/farmacia.routes");
const medicamentoRoutes = require("./modules/medicamento/routes/medicamento.routes");
const cors = require("cors");

const app = express();
require("dotenv").config();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(session);
app.use(flash());

app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views"),
  path.join(__dirname, "modules", "autenticacao", "views"),
  path.join(__dirname, "modules", "administracao", "views"),
  path.join(__dirname, "modules", "farmacia", "views"),
]);

app.use("/autenticacao", autenticaoRoutes);
app.use("/administracao", administracaoRoutes);
app.use("/farmacia", farmaciaRoutes);
app.use("/medicamento", medicamentoRoutes);

app.get("/", (req, res) => {
  res.render("index");
});

const port = process.env.PORT || 8081;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
