const express = require("express");
const db = require("../db/db");
const router = express.Router();

// GET projets publiés (route publique) ---
router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM projects WHERE published = 1 ORDER BY created_at DESC").all();
    const parsed = rows.map((p) => ({
      ...p,
      tags: p.tags ? JSON.parse(p.tags) : [],
      images: p.images ? JSON.parse(p.images) : [],
      published: !!p.published,
    }));
    res.json(parsed);
  } catch (err) {
    console.error("❌ Erreur projets publics:", err);
    res.status(500).json({ error: "❌Erreur serveur" });
  }
});

module.exports = router;
