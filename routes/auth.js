const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/db");
const router = express.Router();

const SECRET = "btp_secret_key";

const crypto = require("crypto");
const nodemailer = require("nodemailer");

// === Vérifier / créer colonnes reset_token et reset_expires si besoin (optionnel) ===
// (utilise ALTER TABLE ADD COLUMN; SQLite permet d'ajouter une colonne simple)
try {
  db.prepare("ALTER TABLE admin ADD COLUMN reset_token TEXT").run();
} catch (e) { /* ignore si colonne existe */ }
try {
  db.prepare("ALTER TABLE admin ADD COLUMN reset_expires INTEGER").run();
} catch (e) { /* ignore si colonne existe */ }

// Créer admin par défaut si inexistant
const adminExists = db.prepare("SELECT * FROM admin").get();
if (!adminExists) {
  const hash = bcrypt.hashSync("corbatmadagascar@gmail.com", 10);
  db.prepare("INSERT INTO admin (email, password) VALUES (?, ?)").run("corbatmadagascar@gmail.com", hash);
  console.log("👤 Admin créé : corbatmadagascar@gmail.com / corbatconstructionmotdepasse");
}

// === Transporter Nodemailer (config via env vars) ===
const EMAIL_USER = process.env.EMAIL_USER; // ex: "moncompte@gmail.com"
const EMAIL_PASS = process.env.EMAIL_PASS; // mot de passe app GMAIL ou mot de passe SMTP
if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn("⚠️ EMAIL_USER ou EMAIL_PASS non défini. Les e-mails ne pourront pas être envoyés.");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true pour 465, false pour 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Vérifier la connexion au serveur SMTP
transporter.verify().then(() => {
  console.log("Transporter email prêt");
}).catch((err) => {
  console.warn("⚠️ Erreur verification transporter :", err.message || err);
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const admin = db.prepare("SELECT * FROM admin WHERE email=?").get(email);
  if (!admin) return res.status(400).json({ success: false, error: "Admin introuvable" });
  if (!bcrypt.compareSync(password, admin.password))
    return res.status(400).json({ success: false, error: "Mot de passe incorrect" });

  const token = jwt.sign({ email }, SECRET, { expiresIn: "2h" });

  // Envoyer le token dans un cookie sécurisé
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: false, // mettre true si HTTPS
    sameSite: "lax",
    maxAge: 2 * 60 * 60 * 1000 // 2h
  });

  res.json({ success: true });
});

router.get("/check", (req, res) => {
  if (!req.cookies.authToken) return res.sendStatus(401);
  res.sendStatus(200);
});

router.post("/logout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax"
  });
  res.json({ success: true });
});

router.post("/change-password", (req, res) => {
  const { oldPass, newPass } = req.body;
  const token = req.cookies && req.cookies.authToken;
  if (!token) return res.status(401).json({ success:false, error:"Non authentifié" });

  let email;
  try {
    email = jwt.verify(token, SECRET).email;
  } catch {
    return res.status(401).json({ success:false, error:"Token invalide" });
  }

  const admin = db.prepare("SELECT * FROM admin WHERE email=?").get(email);
  if (!admin) return res.json({ success:false, error:"Admin introuvable" });
  if (!bcrypt.compareSync(oldPass, admin.password))
    return res.json({ success:false, error:"Ancien mot de passe incorrect" });

  const hash = bcrypt.hashSync(newPass, 10);
  db.prepare("UPDATE admin SET password=? WHERE email=?").run(hash, email);

  res.json({ success:true });
});

// === /forgot : générer token, enregistrer token + expiration, envoyer mail et attendre résultat ===
router.post("/forgot", async (req,res) => {
  const { email } = req.body;
  const admin = db.prepare("SELECT * FROM admin WHERE email=?").get(email);

  // Toujours renvoyer success:true pour ne pas "leaker" l'existence d'un compte
  if (!admin) return res.json({ success:true });

  // Générer token et expiration (1 heure)
  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 60 * 60 * 1000; // 1 heure en ms

  db.prepare("UPDATE admin SET reset_token=?, reset_expires=? WHERE email=?")
    .run(token, expires, email);

  const BASE_URL = process.env.BASE_URL || "http://localhost:4000";
  const resetLink = `${BASE_URL}/admin/reset-password.html?token=${token}`; 
  
  console.log("BASE_URL =", process.env.BASE_URL);

  // Préparer le mail
  const mailOptions = {
    from: `"COR'BAT Support" <${EMAIL_USER || 'no-reply@gmail.com'}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <p>Bonjour,</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>
        Cliquez sur le lien ci-dessous pour continuer :<br>
        <a href="${resetLink}">${resetLink}</a>
      </p>
      <p><em>Ce lien est sécurisé et n’est valable qu’une seule fois pendant 1 heure.</em></p>
      <p>Cordialement,<br>L’équipe COR'BAT</p>
    `
  };

  try {
    // attendre l'envoi et attraper les erreurs
    const info = await transporter.sendMail(mailOptions);
    console.log("Email envoyé:", info && info.messageId);
    return res.json({ success:true });
  } catch (err) {
    console.error("Erreur envoi mail :", err);
    // Ne pas divulguer trop d'infos côté client, mais renvoyer success:false pour debug
    return res.status(500).json({ success:false, error:"Impossible d'envoyer l'email (verifier la configuration SMTP serveur)." });
  }
});

// === /reset : vérifier token et expiration puis changer mot de passe ===
router.post("/reset", (req,res) => {
  const { token, password } = req.body;
  const admin = db.prepare("SELECT * FROM admin WHERE reset_token=?").get(token);
  if (!admin) return res.status(400).json({ error:"❌Token invalide" });

  if (!admin.reset_expires || Number(admin.reset_expires) < Date.now()) {
    return res.status(400).json({ error: "❌Token expiré" });
  }

  const hash = bcrypt.hashSync(password, 10);
  db.prepare("UPDATE admin SET password=?, reset_token=NULL, reset_expires=NULL WHERE email=?")
    .run(hash, admin.email);

  res.json({ success:true });
});


module.exports = router;
