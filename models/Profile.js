const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  title: { type: String, required: true },
  location: { type: String, default: "" },
  description: { type: String, default: "" },

  contact: {
    email: { type: String, required: true },
    telegram: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" }
  },

  // ✅ FIXED: Convert `skills` to an array instead of a `Map`
  skills: [
    {
      title: { type: String, required: true }, 
      list: [
        {
          name: { type: String, required: true },
          icon: { type: String, default: "" }
        }
      ]
    }
  ],

  experience: [
    {
      company: { type: String, required: true },
      location: { type: String, default: "" },
      role: { type: String, required: true },
      period: { type: String, required: true },
      description: { type: String, default: "" },
      achievements: { type: [String], default: [] }
    }
  ],

  projects: [
    {
      name: { type: String, required: true },
      description: { type: String, default: "" },
      techStack: { type: [String], default: [] },
      url: { type: String, default: "" }
    }
  ],

  education: [
    {
      name: { type: String, required: true },
      degree: { type: String, required: true },
      field: { type: String, required: true },
      years: { type: String, required: true },
      icon: { type: String, default: "" }
    }
  ],

  resumeUrl: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Profile", ProfileSchema);
