import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize OpenAI client
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY") {
    throw new Error("OPENAI_API_KEY is missing or not set. Please add it to the Secrets panel in AI Studio settings (Settings -> Secrets -> add OPENAI_API_KEY).");
  }
  return new OpenAI({ apiKey });
};

// API Endpoint for generating leads
app.post("/api/generate-leads", async (req, res) => {
  console.log("Generating leads for query:", req.body.query);
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const openai = getOpenAI();
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional lead generation assistant. 
          Your task is to find real or highly plausible companies and their contact emails based on the user's request.
          The user might search in Arabic, English, or Italian. Handle all languages correctly.
          
          REQUIRED OUTPUT FORMAT:
          You MUST return a valid JSON object with a single key "leads".
          "leads" must be an array of objects.
          Each object must contain "email" (string) and "company_name" (string).
          
          Example:
          {
            "leads": [
              { "email": "contact@azienda.it", "company_name": "Azienda Agricola Rossi" }
            ]
          }
          
          Return between 10 to 15 high-quality leads.
          Only return the JSON object, no other text.`
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content received from OpenAI");
    
    const parsed = JSON.parse(content);
    const results = parsed.leads || parsed.companies || (Array.isArray(parsed) ? parsed : []);
    
    res.json(results);
  } catch (error: any) {
    console.error("OpenAI/Server Error:", error);
    res.status(500).json({ 
      error: error.message || "Internal Server Error",
      details: "Check if your OPENAI_API_KEY is correctly set in the Secrets panel."
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
