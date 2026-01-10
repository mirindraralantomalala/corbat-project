const jwt = require("jsonwebtoken");
const SECRET = "btp_secret_key";

module.exports = (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) return res.status(401).json({ error: "Token manquant" });

  try {
    jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
};
