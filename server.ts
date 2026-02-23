import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Gemini AI Setup
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

function getRiskLevel(score: number): 'safe' | 'suspicious' | 'high-risk' {
  if (score < 30) return 'safe';
  if (score < 70) return 'suspicious';
  return 'high-risk';
}

// API Routes
app.post("/api/analyze", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following URL for cybersecurity threats: ${url}. 
      Focus on:
      1. Malicious redirects (is this a shortened link or a gateway to a known bad site?)
      2. Phishing patterns (lookalike domains, suspicious TLDs).
      3. Malware distribution signatures.
      4. Social engineering tactics in the URL structure.
      
      Act as a professional cybersecurity analyst. 
      Provide a risk score from 0 to 100 (0 being perfectly safe, 100 being extremely dangerous).
      List specific threat indicators if any.
      Provide a clear recommendation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.NUMBER },
            indicators: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            recommendation: { type: Type.STRING },
            analysis: { type: Type.STRING }
          },
          required: ["riskScore", "indicators", "recommendation", "analysis"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json({
      ...data,
      riskLevel: getRiskLevel(data.riskScore || 0)
    });
  } catch (error: any) {
    console.error("AI Analysis failed:", error);
    res.status(500).json({
      riskScore: 50,
      riskLevel: 'suspicious',
      indicators: ["Analysis failed due to server error"],
      recommendation: "Proceed with extreme caution. Manual verification required.",
      analysis: "We were unable to complete the AI-powered deep scan at this time."
    });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
  app.get("*", (req, res) => {
    res.sendFile("dist/index.html", { root: "." });
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
