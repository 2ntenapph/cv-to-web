// ../parser/resumeSchema.js
module.exports = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "slug": { "type": "string" },
    "name": { "type": "string" },
    "title": { "type": "string" },
    "location": { "type": "string" },
    "description": { "type": "string" },
    "contact": {
      "type": "object",
      "properties": {
        "email": { "type": "string" },
        "telegram": { "type": "string" },
        "linkedin": { "type": "string" },
        "github": { "type": "string" }
      },
      "required": ["email", "telegram", "linkedin", "github"]
    },
    "skills": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "list": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "icon": { "type": "string" }
              },
              "required": ["name", "icon"]
            }
          }
        },
        "required": ["title", "list"]
      }
    },
    "experience": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "company": { "type": "string" },
          "location": { "type": "string" },
          "role": { "type": "string" },
          "period": { "type": "string" },
          "description": { "type": "string" },
          "achievements": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["company", "location", "role", "period", "description", "achievements"]
      }
    },
    "projects": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "description": { "type": "string" },
          "techStack": {
            "type": "array",
            "items": { "type": "string" }
          },
          "url": { "type": "string" }
        },
        "required": ["name", "description", "techStack", "url"]
      }
    },
    "education": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "icon": { "type": "string" },
          "name": { "type": "string" },
          "degree": { "type": "string" },
          "field": { "type": "string" },
          "years": { "type": "string" }
        },
        "required": ["icon", "name", "degree", "field", "years"]
      }
    },
    "resume": {
      "type": "object",
      "properties": {
        "resumeUrl": { "type": "string" }
      },
      "required": ["resumeUrl"]
    }
  },
  "required": [
    "slug",
    "name",
    "title",
    "location",
    "description",
    "contact",
    "skills",
    "experience",
    "projects",
    "education",
    "resume"
  ]
};
