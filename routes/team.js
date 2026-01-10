const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const db = require("../db/db");

// Liste des membres
router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM team ORDER BY name ASC").all();
    res.json(rows);
  } catch (err) {
    console.error("❌Erreur GET team:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

// Ajouter un membre
router.post("/", (req, res) => {
  try {
    const { name, role } = req.body;

    if (!name || !role)
      return res.status(400).json({ success: false, message: "Champs requis manquants." });

    const id = uuidv4();
    db.prepare("INSERT INTO team (id, name, role) VALUES (?, ?, ?)")
      .run(id, name, role);

    res.json({ success: true, id });
  } catch (err) {
    console.error("❌Erreur POST team:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

// Modifier un membre
router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const result = db.prepare(`
      UPDATE team SET name = ?, role = ? WHERE id = ?
    `).run(name, role, id);

    if (result.changes === 0)
      return res.status(404).json({ success: false, message: "❌Membre introuvable" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌Erreur PUT team:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

// Supprimer un membre
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare("DELETE FROM team WHERE id = ?").run(id);

    if (result.changes === 0)
      return res.status(404).json({ success: false, message: "❌Introuvable" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌Erreur DELETE team:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

module.exports = router;
