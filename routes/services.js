const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/db");
const router = express.Router();

// Lister tous les services
router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM services ORDER BY created_at DESC").all();
    res.json(rows);
  } catch (err) {
    console.error("❌Erreur récupération services:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

// Ajouter un service
router.post("/", (req, res) => {
  try {
    const s = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO services (id, title, short, description, price, image, order_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      s.title || "",
      s.short || "",
      s.description || "",
      s.price || "",
      s.image || "",
      s.order || 0,
      new Date().toISOString()
    );
    res.json({ success: true, id });
  } catch (err) {
    console.error("❌Erreur ajout service:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

// Modifier un service
router.patch("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const s = req.body;
    const result = db
      .prepare(
        `UPDATE services 
         SET title=?, short=?, description=?, price=?, image=?, order_index=?, updated_at=? 
         WHERE id=?`
      )
      .run(
        s.title || "",
        s.short || "",
        s.description || "",
        s.price || "",
        s.image || "",
        s.order || 0,
        new Date().toISOString(),
        id
      );

    if (result.changes === 0)
      return res.status(404).json({ error: "❌Service introuvable" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌Erreur mise à jour service:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

// Supprimer un service
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare("DELETE FROM services WHERE id = ?").run(id);
    if (result.changes === 0)
      return res.status(404).json({ error: "❌Service introuvable" });
    res.json({ success: true });
  } catch (err) {
    console.error("❌Erreur suppression service:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

module.exports = router;
