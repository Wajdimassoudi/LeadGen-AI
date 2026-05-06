import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface CompanyLead {
  email: string;
  company_name: string;
}

export async function generateLeads(query: string): Promise<CompanyLead[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for companies based on the following request: "${query}". 
      Return a list of real or plausible companies and their contact emails. 
      Limit to 10 entries.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              email: {
                type: Type.STRING,
                description: "The official or likely contact email of the company.",
              },
              company_name: {
                type: Type.STRING,
                description: "The full legal name of the company.",
              },
            },
            required: ["email", "company_name"],
          },
        },
        // @ts-ignore - Tools support can vary between SDK type definitions
        tools: [{ googleSearch: {} }]
      },
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as CompanyLead[];
  } catch (error) {
    console.error("Error generating leads:", error);
    throw error;
  }
}
