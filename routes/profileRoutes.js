const express = require("express");
const fs = require("fs");
const Profile = require("../models/Profile");
const { parseResume } = require("../parser/resumeParser");
const verifyToken = require("../middleware/authMiddleware"); // ✅ Import middleware
const User = require("../models/User");

const router = express.Router();

// 📂 Upload Resume & Parse using Improved Resume Parser
router.post("/upload-resume", verifyToken, async (req, res) => {
  if (!req.files || !req.files.resume) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const resume = req.files.resume;
  const localFilePath = `uploads/${req.user.userId}.pdf`;

  try {
    // Save the uploaded resume to disk
    await resume.mv(localFilePath);

    // Read the PDF file as a buffer
    const fileBuffer = fs.readFileSync(localFilePath);

    // Parse the resume using the improved hybrid parser
    const structuredData = await parseResume(fileBuffer, { useGPT: true, validate: true });
    
    if (!structuredData) return res.status(500).json({ error: "Resume parsing failed" });

    // Attach additional user-related fields
    structuredData.userId = req.user.userId;
    structuredData.resume.resumeUrl = `/uploads/${req.user.userId}.pdf`;

    // Update (or insert) the profile into the database
    await Profile.findOneAndUpdate(
      { userId: req.user.userId },
      structuredData,
      { upsert: true, new: true }
    );

    res.json({ message: "Resume uploaded & parsed!", slug: structuredData.slug });
  } catch (error) {
    console.error("❌ Error processing resume:", error);
    res.status(500).json({ error: "Resume processing failed" });
  }
});

// 🔍 Fetch All Profiles (Protected Route)
router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find().select("-password"); // ✅ Exclude password for security
    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});


// 🔍 Fetch Profile by Slug (Public Route)
router.get("/slug/:slug", async (req, res) => {
  try {
    const profile = await Profile.findOne({ slug: req.params.slug });
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

module.exports = router;
