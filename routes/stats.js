const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const file = path.join(__dirname, "..", "data", "stats.json");

// GET (utilisé par index.html)
router.get("/", (req, res) => {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  res.json(data);
});

// POST (appelé depuis le dashboard)
router.post("/", (req, res) => {
  const { projects } = req.body;
  const data = { projects: Number(projects) };
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  res.json({ success: true });
});

module.exports = router;
