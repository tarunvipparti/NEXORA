import { ScanResult } from "../types";

export async function analyzeUrl(url: string): Promise<Partial<ScanResult>> {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze URL");
    }

    return await response.json();
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      riskScore: 50,
      riskLevel: 'suspicious',
      indicators: ["Analysis failed due to network error"],
      recommendation: "Proceed with extreme caution. Manual verification required.",
      analysis: "We were unable to complete the AI-powered deep scan at this time."
    };
  }
}
