const express = require("express");
const db = require("../db/db");
const router = express.Router();

// POST : Ajouter une demande de rappel
router.post("/", (req, res) => {
  const { name, phone, preferred_time, created_at } = req.body;
  if (!name || !phone)
    return res.status(400).json({ error: "Nom et téléphone requis" });

  const id = "cb_" + Date.now();
  const status = "nouvelle";

  try {
    db.prepare(`
      INSERT INTO callbacks (id, name, phone, preferred_time, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, phone, preferred_time, status, created_at);

    res.json({ success: true, id });
  } catch (err) {
    console.error("❌Erreur INSERT callback:", err);
    res.status(500).json({ error: "❌Erreur interne serveur" });
  }
});

// GET : Lister toutes les demandes
router.get("/", (req, res) => {
  try {
    const rows = db
      .prepare("SELECT * FROM callbacks ORDER BY created_at DESC")
      .all();
    res.json(rows);
  } catch (err) {
    console.error("❌Erreur GET callbacks:", err);
    res.status(500).json({ error: "❌Erreur interne serveur" });
  }
});

// PATCH : Mettre à jour le statut d’une demande
router.patch("/:id", (req, res) => {
  const { status } = req.body;
  const id = req.params.id;

  if (!status)
    return res.status(400).json({ error: "Le statut est requis" });

  try {
    const result = db.prepare(
      "UPDATE callbacks SET status = ? WHERE id = ?"
    ).run(status, id);

    if (result.changes === 0)
      return res.status(404).json({ error: "❌Demande introuvable" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌Erreur PATCH callback:", err);
    res.status(500).json({ error: "❌Erreur interne serveur" });
  }
});

// DELETE : Supprimer une demande
router.delete("/:id", (req, res) => {
  const id = req.params.id;

  try {
    const result = db.prepare("DELETE FROM callbacks WHERE id = ?").run(id);

    if (result.changes === 0)
      return res.status(404).json({ error: "❌Demande introuvable" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌Erreur DELETE callback:", err);
    res.status(500).json({ error: "❌Erreur interne serveur" });
  }
});

module.exports = router;
