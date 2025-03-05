require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const authRoutes = require("../routes/authRoutes");
const profileRoutes = require("../routes/profileRoutes");

const MONGO_URL = process.env.MONGO_URL || "MONGO_URL"; 
const CORS_ORIGIN = process.env.CORS_ORIGIN || "CORS_ORIGIN"; 

const app = express();

// Middleware
app.use(
  cors({
    origin: CORS_ORIGIN, // ✅ Replace '*' with your frontend URL
    credentials: true, // ✅ Allow credentials (cookies, authorization headers)
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
  })
);
app.options("*", (req, res) => {
  res.sendStatus(200);
});
app.use(bodyParser.json());
app.use(cookieParser());
app.use(fileUpload({ createParentPath: true }));

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Connect to MongoDB
mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);

// 🌍 Start the Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
