const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/", (req, res) => {
  try {
    const leads = db.prepare("SELECT COUNT(*) AS c FROM leads").get().c;
    const projects = db.prepare("SELECT COUNT(*) AS c FROM projects").get().c;
    const devis = db.prepare("SELECT COUNT(*) AS c FROM quotes").get().c;
    const services = db.prepare("SELECT COUNT(*) AS c FROM services").get().c;
    const callbacks = db.prepare("SELECT COUNT(*) AS c FROM callbacks").get().c;

    res.json({ leads, projects, devis, services, callbacks });
  } catch (err) {
    console.error("❌Erreur stats:", err);
    res.status(500).json({ error: "❌Erreur lors de la récupération des statistiques" });
  }
});

module.exports = router;
