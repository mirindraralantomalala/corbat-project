const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Dossier de destination ======
const uploadDir = path.join(__dirname, "..", "uploads", "public");

// Créer /uploads/projects si pas existant
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("📁 Dossier créé:", uploadDir);
}

// Filtre sécurité (images uniquement) ======
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("❌Format non supporté (JPEG, PNG, WEBP uniquement)"));
};

// Configuration stockage ======
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 Mo max
});

// Route Upload ======
router.post("/project-images", upload.array("images", 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, error: "❌Aucun fichier reçu" });
  }

  const files = req.files.map(f => ({
    filename: f.filename,
    url: "/uploads/public/" + f.filename,
    size: f.size
  }));

  res.json({ success: true, files });
});

router.get("/project-images", (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.json([]);

    const images = files.map(name => ({
      filename: name,
      url: "/uploads/public/" + name
    }));
    res.json(images);
  });
});

// Route DELETE ======
router.delete("/project-images/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath); // supprime le fichier
    return res.json({ success: true });
  } else {
    return res.status(404).json({ success: false, error: "❌Fichier introuvable" });
  }
});



module.exports = router;
