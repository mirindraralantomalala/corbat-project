const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// dossier SERVICES
const servicesDir = path.join(__dirname, "..", "uploads", "services");

if (!fs.existsSync(servicesDir)) {
  fs.mkdirSync(servicesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: servicesDir,
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

// UPLOAD services
router.post("/", upload.array("images", 10), (req, res) => {
  const files = req.files.map(f => ({
    filename: f.filename,
    url: "/uploads/services/" + f.filename
  }));
  res.json({ success: true, files });
});

// GET services images
router.get("/", (req, res) => {
  fs.readdir(servicesDir, (err, files) => {
    if (err) return res.json([]);
    res.json(files.map(name => ({
      filename: name,
      url: "/uploads/services/" + name
    })));
  });
});

// DELETE image service
router.delete("/:filename", (req, res) => {
  const filePath = path.join(servicesDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.json({ success: true });
  }
  return res.status(404).json({ error: "❌Fichier introuvable" });
});

module.exports = router;
