const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const router = express.Router();

// dossier PUBLIC (images visibles dans l'accueil)
const publicDir = path.join(__dirname, "..", "uploads", "public");

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// stockage PUBLIC
const storage = multer.diskStorage({
  destination: publicDir,
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// UPLOAD PUBLIC ===
router.post("/", upload.array("images", 10), (req, res) => {
  const files = req.files.map(f => ({
    filename: f.filename,
    url: "/uploads/public/" + f.filename
  }));
  res.json({ success: true, files });
});

// Lister images publiques ===
router.get("/", (req, res) => {
  fs.readdir(publicDir, (err, files) => {
    if (err) return res.json([]);
    res.json(files.map(name => ({
      filename: name,
      url: "/uploads/public/" + name
    })));
  });
});

module.exports = router;
