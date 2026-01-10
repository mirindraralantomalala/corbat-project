// routes/leads.js
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/db"); // SQLite, par ex.
const router = express.Router();

// Créer un nouveau lead
router.post("/", (req, res) => {
  try {
    const l = req.body;
    if (!l.fullname || !l.email || !l.phone) {
      return res.status(400).json({ success: false, message: "Champs requis manquants." });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO leads (id, fullname, email, phone, service, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      l.fullname,
      l.email,
      l.phone,
      l.service || "",
      l.message || "",
      "Nouvelle",
      new Date().toISOString()
    );

    res.json({ success: true, id });
  } catch (err) {
    console.error("❌ Erreur lors de l'insertion du client:", err);
    res.status(500).json({ success: false, message: "❌Erreur serveur." });
  }
});

// Récupérer tous les leads
router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des clients:", err);
    res.status(500).json({ success: false, message: "❌Erreur serveur." });
  }
});

// Mettre à jour le statut d’un lead
router.patch("/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ success: false, message: "Statut manquant." });

    const stmt = db.prepare("UPDATE leads SET status = ? WHERE id = ?");
    const result = stmt.run(status, id);

    if (result.changes === 0) return res.status(404).json({ success: false, message: "❌client introuvable." });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour du statut:", err);
    res.status(500).json({ success: false, message: "❌Erreur serveur." });
  }
});


// Supprimer un lead
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare("DELETE FROM leads WHERE id = ?").run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "❌client introuvable" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("❌Erreur suppression client:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});


router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const data = readData(); // lire ton fichier JSON
    const idx = data.findIndex(l => l.id === id);
    if (idx === -1) return res.status(404).json({ error: "❌client introuvable" });

    data[idx].status = status || data[idx].status;
    writeData(data);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});


module.exports = router;
