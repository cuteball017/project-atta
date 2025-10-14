export const runtime = "nodejs";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export const gemini = genAI.getGenerativeModel({
  model: "gemini-2.5-pro", 
});





// export const runtime = "nodejs" 

// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// export const gemini = new ChatGoogleGenerativeAI({
//     modelName: "gemini-2.5-pro",
//     maxOutputTokens: 2048,
//     apiKey: process.env.GOOGLE_API_KEY,
//   });