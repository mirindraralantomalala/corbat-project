require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const app = express();

// === Fichiers ===
const dataFile = path.join(__dirname, "data.json");

// === Middlewares ===
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// === Fichiers statiques (Frontend) ===
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/uploads/public", express.static(path.join(__dirname, "uploads/public")));
app.use("/uploads/services", express.static(path.join(__dirname, "uploads/services")));

// === Routes ===
const quotesRouter = require("./routes/quotes");
const leadsRouter = require("./routes/leads");
const projectsRouter = require("./routes/projects");
const servicesRouter = require("./routes/services");
const uploadsRouter = require("./routes/uploads");
const authRouter = require("./routes/auth");
const callbacksRouter = require("./routes/callbacks");
const statsRouter = require("./routes/stats");
const grapheRouter = require("./routes/graphe");
const projectsRouterPublic = require("./routes/projects-public");
const uploadsPublicRouter = require("./routes/uploads-public");
const uploadsServicesRouter = require("./routes/uploads-services");
const teamRouter = require("./routes/team");

// === Routes publiques ===
app.use("/api/auth", authRouter);
app.use("/api/services", servicesRouter);
app.use("/api/callbacks", callbacksRouter);
app.use("/api/stats", statsRouter);
app.use("/api/graphe", grapheRouter);
app.use("/api/team", teamRouter);

// === Routes protégées ===
app.use("/api/quotes", quotesRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/projects-public", projectsRouterPublic);
app.use("/api/projects", projectsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/uploads-public", uploadsPublicRouter);
app.use("/api/uploads-services", uploadsServicesRouter);

// === Mise à jour stats admin ===
app.post("/api/stats", (req, res) => {
  const { projects } = req.body;

  const json = JSON.parse(fs.readFileSync(dataFile, "utf8"));
  json.projects = Number(projects);

  fs.writeFileSync(dataFile, JSON.stringify(json, null, 2));
  res.json({ success: true, projects: json.projects });
});

// === Ping pour Render ===
app.get("/ping", (req, res) => {
  res.status(200).send("OK");
});

// === Port Render ===
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
