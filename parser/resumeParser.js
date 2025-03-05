const pdf = require("pdf-parse");
const OpenAI = require("openai");
const Ajv = require("ajv");
const nlp = require("compromise");
const resumeSchema = require("./resumeSchema");

// Initialize AJV for schema validation
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(resumeSchema);

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Skill icon mapping (file names only)
const iconMap = {
  javascript: "javascript.svg",
  java: "java.svg",
  "c++": "cpp.svg",
  "c#": "csharp.svg",
  python: "python.svg",
  php: "php.svg",
  typescript: "typescript.svg",
  react: "react.svg",
  redux: "redux.svg",
  "redux toolkit": "reduxtoolkit.svg",
  vue: "vue.svg",
  "next.js": "nextjs.svg",
  "node.js": "nodejs.svg",
  express: "express.svg",
  mongodb: "mongodb.svg",
  mysql: "mysql.svg",
  mssql: "mssql.svg",
  postgresql: "Postgresql.svg",
  docker: "docker.svg",
  git: "git.svg",
  jenkins: "jenkins.svg",
  spring: "spring.svg",
  bootstrap: "bootstrap.svg",
  "tailwind css": "tailwindcss.svg",
  wordpress: "wordpress.svg",
  shopify: "shopify.svg",
  figma: "figma.svg",
  powershell: "powershell.svg",
  azure: "azure.svg",
  flutter: "flutter.svg",
  dotnet: "dotnet.svg",
  "rest api": "restapi.svg",
  graphql: "graphql.svg",
  websocket: "websocket.svg",
  webhooks: "webhooks.svg",
  wix: "wix.svg",
  mui: "mui.svg",
  rust: "rust.svg",
  tilda: "tilda.svg",
  illustrator: "llustrator.svg",
};

// Education icon mapping
const educationIconMap = {
  mirea: "mirea.svg",
  mohawk: "mohawk.svg",
};

/**
 * Extracts raw text from a PDF file buffer using pdf-parse.
 * @param {Buffer} fileBuffer - The PDF file buffer.
 * @returns {Promise<string>} - The extracted text.
 */
async function extractPdfText(fileBuffer) {
  try {
    const data = await pdf(fileBuffer);
    console.info("✅ PDF text extraction successful.");
    return data.text;
  } catch (error) {
    console.error("❌ Error extracting PDF text:", error);
    throw error;
  }
}

/**
 * Performs a custom extraction of resume data using heuristics, regex, and NLP.
 * @param {string} text - The full resume text.
 * @returns {Object} - A preliminary resume data object.
 */
function customExtract(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // Use compromise NLP to extract a valid name
  let doc = nlp(text);
  let name = doc.people().first().text() || "";

  // If NLP fails, find the first non-empty text line that doesn't contain numbers/symbols
  if (!name) {
    name = lines.find((line) => /^[A-Za-z\s]+$/.test(line)) || "";
  }

  // Ensure the name is valid before generating slug
  let slug = name ? name.toLowerCase().replace(/\s+/g, "-") : "unknown";

  // Extract title from the second meaningful line
  let title = lines.length > 1 ? lines[1] : "";

  // Extract location based on keywords
  let location = "";
  const locationKeywords = ["Location", "Address", "City"];
  for (const line of lines) {
    if (locationKeywords.some((kw) => line.startsWith(kw))) {
      location = line.split(":")[1]?.trim() || "";
      break;
    }
  }

  // Extract email using regex
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  const email = emailMatch ? emailMatch[0] : "";

  // Extract a description based on common section headers
  let description = "";
  const descMatch = text.match(/(?:Summary|Profile|About Me)[:\s]*(.*)/i);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  const preliminaryData = {
    slug,
    name,
    title,
    location,
    description,
    contact: {
      email,
      telegram: "",
      linkedin: "",
      github: "",
    },
    skills: [],
    experience: [],
    projects: [],
    education: [],
    resume: {
      resumeUrl: "",
    },
  };

  console.info("✅ Custom extraction completed:", preliminaryData);
  return preliminaryData;
}

/**
 * Uses the OpenAI API with function calling to refine resume data.
 * @param {string} rawText - The extracted resume text.
 * @param {Object} preliminaryData - The initial extracted data.
 * @returns {Promise<Object>} - The refined structured resume data.
 */
async function gptRefine(rawText, preliminaryData) {
  const messages = [
    {
      role: "system",
      content: `
        You are an AI assistant that extracts structured resume data. 
        Your goal is to refine and complete the extracted resume data while strictly following the given JSON schema.
        You must return only valid JSON. Ensure that skills are grouped under meaningful categories (e.g., 'Programming Languages', 'Frameworks', 'Databases').
      `,
    },
    {
      role: "user",
      content: `
    Below is the extracted resume text and preliminary structured data. 
    Refine the extracted data to match the following JSON schema.
    
    **Extracted Data (preliminary):**
    ${JSON.stringify(preliminaryData, null, 2)}
    
    **Full Resume Text:**
    ${rawText}
  
    ## Important Formatting Rules:
    - Skills **must be grouped** into categories such as:
      - "Programming Languages"
      - "Frameworks & Libraries"
      - "Databases"
      - "DevOps & Tools"
    - Each category must contain a list of **skills** with the following format:
      
      {
        "title": "Programming Languages",
        "list": [
          { "name": "JavaScript", "icon": "javascript.svg" },
          { "name": "Python", "icon": "python.svg" }
        ]
      }
      
    - Ensure **consistent formatting** and proper capitalization.
  
    ### **Return only valid JSON** in the function call response.
    `,
    },
  ];

  const functions = [
    {
      name: "updateResumeData",
      description: "Return refined resume data in the specified schema.",
      parameters: resumeSchema, // Directly use the schema from the imported module
    },
  ];

  try {
    console.info("🟢 Sending GPT request for refinement...");

    const response = await openai.chat.completions.create({
      model: "gpt-4-0613", // or "gpt-3.5-turbo-0613"
      messages,
      functions,
      function_call: { name: "updateResumeData" },
      temperature: 0,
    });

    if (!response.choices[0].message.function_call) {
      throw new Error("No function call response from GPT.");
    }

    const functionArgs = JSON.parse(
      response.choices[0].message.function_call.arguments
    );
    console.info("✅ GPT refinement successful:", functionArgs);

    return functionArgs;
  } catch (error) {
    console.error("❌ Error during GPT refinement:", error);
    throw error;
  }
}

// Assign icons to skills
function assignSkillIcons(skills) {
  return skills.map((category) => ({
    title: category.title,
    list: category.list.map((skill) => ({
      name: skill.name,
      icon: iconMap[skill.name.toLowerCase()] || "", // Assign if exists, otherwise empty
    })),
  }));
}

// Assign icons to education
function assignEducationIcons(education) {
  return education.map((entry) => ({
    ...entry,
    icon: educationIconMap[entry.name.toLowerCase()] || "",
  }));
}

/**
 * Validates the resume data against the defined JSON schema.
 * @param {Object} data - The resume data object.
 * @returns {boolean} - True if valid, throws an error if invalid.
 */
function validateResumeData(data) {
  const valid = validate(data);
  if (!valid) {
    console.error("❌ Validation errors:", validate.errors);
    throw new Error("Resume data does not match the schema.");
  }

  console.info("✅ Resume data validated successfully.");
  return true;
}

/**
 * Parses a resume PDF file buffer and returns a structured JSON object.
 * @param {Buffer} fileBuffer - The PDF file buffer.
 * @param {Object} [options] - Options for parsing.
 * @returns {Promise<Object>} - The final structured resume data.
 */
async function parseResume(
  fileBuffer,
  options = { useGPT: true, validate: true }
) {
  try {
    const rawText = await extractPdfText(fileBuffer);
    let preliminaryData = customExtract(rawText);

    if (options.useGPT) {
      const refinedData = await gptRefine(rawText, preliminaryData);
      preliminaryData = refinedData;
    }

    // Assign icons to skills and education
    preliminaryData.skills = assignSkillIcons(preliminaryData.skills);
    preliminaryData.education = assignEducationIcons(preliminaryData.education);

    console.log(
      "✅ GPT refinement successful:",
      JSON.stringify(preliminaryData, null, 2)
    );

    if (options.validate) {
      validateResumeData(preliminaryData);
    }

    return preliminaryData;
  } catch (error) {
    console.error("❌ Error in parseResume:", error);
    throw error;
  }
}

module.exports = {
  parseResume,
  extractPdfText,
  customExtract,
  gptRefine,
  validateResumeData,
};
