const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/db");

const router = express.Router();

// Créer un nouveau devis ===
router.post("/", (req, res) => {
  try {
    const q = req.body;
    const id = uuidv4();

    db.prepare(`
      INSERT INTO quotes (id, fullname, email, phone, address, service, surface, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      q.fullname,
      q.email,
      q.phone,
      q.address,
      q.service,
      q.surface,
      q.message || "",
      "nouvelle",
      new Date().toISOString()
    );

    res.json({ success: true, id });
  } catch (err) {
    console.error("❌Erreur insertion devis:", err);
    res.status(500).json({ error: "❌Erreur lors de l’enregistrement du devis" });
  }
});

// Lister tous les devis ===
router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM quotes ORDER BY created_at DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("❌Erreur chargement devis:", err);
    res.status(500).json({ error: "❌Erreur chargement des devis" });
  }
});

// Supprimer un devis ===
router.delete("/:id", (req, res) => {
  try {
    const id = req.params.id;
    const stmt = db.prepare("DELETE FROM quotes WHERE id = ?");
    const result = stmt.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "❌Devis introuvable" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("❌Erreur suppression devis:", err);
    res.status(500).json({ error: "❌Erreur suppression devis" });
  }
});

//  Mise à jour du statut d’un devis
router.put("/:id/status", (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    console.log("🟡 Requête PUT reçue pour l’ID:", id, "Nouveau statut:", status);

    if (!["nouvelle", "contactée", "résolue"].includes(status)) {
      return res.status(400).json({ error: "❌Statut invalide" });
    }

    const stmt = db.prepare("UPDATE quotes SET status = ? WHERE id = ?");
    const result = stmt.run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "❌Devis introuvable" });
    }

    res.json({ success: true, status });
  } catch (err) {
    console.error("❌Erreur mise à jour statut:", err);
    res.status(500).json({ error: "❌Erreur lors de la mise à jour du statut" });
  }
});



module.exports = router;
