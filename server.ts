import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client
const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Please ensure it's in your Secrets panel.");
  }
  return new GoogleGenAI({ apiKey });
};

// API Endpoint for generating leads using Gemini
app.post("/api/generate-leads", async (req, res) => {
  console.log("Generating leads for query:", req.body.query);
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const genAI = getGemini() as any;
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            leads: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  email: { type: Type.STRING },
                  company_name: { type: Type.STRING },
                },
                required: ["email", "company_name"],
              },
            },
          },
          required: ["leads"],
        },
      }
    });
    
    const prompt = `You are a professional lead generation assistant. 
    Find real or highly plausible companies and their contact emails based on the following search: "${query}".
    Return exactly 15 leads in JSON format.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();
    
    const parsed = JSON.parse(content);
    res.json(parsed.leads || []);
    
  } catch (error: any) {
    console.error("Gemini/Server Error:", error);
    res.status(500).json({ 
      error: "AI search failed. Please try a different query or check your connection.",
      details: error.message
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
