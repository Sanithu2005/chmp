"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const DEFAULT_MODEL = "gemini-3-flash-preview";

/**
 * Call Gemini with a system prompt and user content.
 * Returns the text response, or null if Gemini is unavailable.
 */
export async function callGemini(
  systemPrompt: string,
  userContent: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string | null> {
  if (!genAI) {
    console.warn("Gemini client not initialized. Skipping AI call.");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: options?.model ?? DEFAULT_MODEL,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      systemInstruction: { role: "model", parts: [{ text: systemPrompt }] },
    });

    const text = result.response.text();
    return text.trim() || null;
  } catch (error) {
    console.error("Gemini API error:", error);
    return null;
  }
}

/**
 * Call Gemini and expect a JSON response.
 * Attempts to extract JSON from markdown code blocks if necessary.
 */
export async function callGeminiJSON<T>(
  systemPrompt: string,
  userContent: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<T | null> {
  const text = await callGemini(systemPrompt, userContent, options);
  if (!text) return null;

  try {
    // Try to extract JSON from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Failed to parse Gemini response as JSON:", text);
    return null;
  }
}
