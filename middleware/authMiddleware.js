const jwt = require("jsonwebtoken");

// 🔐 Middleware: Verify JWT Token from Header or Cookie
const verifyToken = (req, res, next) => {
  let token = req.header("Authorization");

  // ✅ Allow token from Authorization header OR HTTP-only cookie
  if (token && token.startsWith("Bearer ")) {
    token = token.replace("Bearer ", "");
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  // 🔴 No Token Provided
  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach decoded user data to request
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

module.exports = verifyToken;
