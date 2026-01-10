const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/db");
const router = express.Router();

// GET tous les projets ===
router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
    const parsed = rows.map((p) => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      images: p.images ? JSON.parse(p.images) : [],
      published: !!p.published,
    }));
    res.json(parsed);
  } catch (err) {
    console.error("❌ Erreur récupération projets:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

// POST — Créer un projet ===
router.post("/", (req, res) => {
  try {
    const p = req.body;
    if (!p.title) return res.status(400).json({ error: "Titre requis" });

    const id = uuidv4();
    db.prepare(
      `INSERT INTO projects (id, title, description, year, tags, images, published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      p.title,
      p.description || "",
      p.year || "",
      JSON.stringify(p.tags || []),
      JSON.stringify(p.images || []),
      p.published ? 1 : 0,
      new Date().toISOString(),
      new Date().toISOString()
    );
    res.json({ success: true, id });
  } catch (err) {
    console.error("❌ Erreur ajout projet:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

// PATCH — Modifier un projet ===
router.patch("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;

    const result = db.prepare(
      `UPDATE projects SET
        title = ?, description = ?, year = ?, tags = ?, images = ?, published = ?, updated_at = ?
      WHERE id = ?`
    ).run(
      p.title || "",
      p.description || "",
      p.year || "",
      JSON.stringify(p.tags || []),
      JSON.stringify(p.images || []),
      p.published ? 1 : 0,
      new Date().toISOString(),
      id
    );

    if (result.changes === 0)
      return res.status(404).json({ error: "❌Projet introuvable" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erreur modification projet:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

// PATCH /:id/publish — Publier / Dépublier ===
router.patch("/:id/publish", (req, res) => {
  try {
    const { id } = req.params;
    const { published } = req.body;

    if (typeof published !== "boolean")
      return res.status(400).json({ error: "Champ 'published' doit être booléen" });

    const result = db.prepare(
      "UPDATE projects SET published = ?, updated_at = ? WHERE id = ?"
    ).run(published ? 1 : 0, new Date().toISOString(), id);

    if (result.changes === 0)
      return res.status(404).json({ error: "❌Projet introuvable" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erreur publication projet:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

// DELETE — Supprimer un projet ===
router.delete("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    if (result.changes === 0)
      return res.status(404).json({ error: "❌Projet introuvable" });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erreur suppression projet:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

module.exports = router;
