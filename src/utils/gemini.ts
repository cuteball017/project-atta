import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const gemini = new ChatGoogleGenerativeAI({
    modelName: "gemini-1.5-pro",
    maxOutputTokens: 2048,
    apiKey: process.env.GOOGLE_API_KEY,
  });