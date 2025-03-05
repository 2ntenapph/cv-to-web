const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// 🔹 Load Environment Variables
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Change this!
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || 3600; // 1 hour
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your-refresh-secret"; // Change this!
const REFRESH_EXPIRATION = process.env.REFRESH_EXPIRATION || 7 * 24 * 3600; // 7 days

// 🛠 Generate Access Token
const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
};

// 🔄 Generate Refresh Token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRATION }
  );
};

// 🔐 Register User
router.post("/signup", async (req, res) => {
  const { fullName, email, password, occupation, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      occupation,
      role,
    });
    await newUser.save();

    res.json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 🔑 Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store JWT in HTTP-only cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: JWT_EXPIRATION * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: REFRESH_EXPIRATION * 1000,
    });

    res.json({
      message: "Login successful!",
      user: { fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 🔄 Refresh Token Endpoint
router.post("/refresh-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const newAccessToken = generateAccessToken(decoded);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: JWT_EXPIRATION * 1000,
    });

    res.json({ message: "Token refreshed" });
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

// 🔍 Check Email Availability
router.post("/check-email", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    res.json({ available: !user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 🔓 Logout (Clears Access & Refresh Token)
router.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
});

module.exports = router;
