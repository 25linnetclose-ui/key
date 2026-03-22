import type { Handler } from "@netlify/functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface RequestBody {
  prompt: string;
  geminiKey: string;
}

export const handler: Handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let body: RequestBody;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  const { prompt, geminiKey } = body;

  if (!prompt || !geminiKey) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "prompt와 geminiKey가 필요합니다" }),
    };
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ["IMAGE", "TEXT"] } as any,
  });

  const imagePart = result.response.candidates?.[0]?.content?.parts?.find(
    (p: any) => p.inlineData
  );

  const base64 = imagePart?.inlineData?.data;
  const mimeType = imagePart?.inlineData?.mimeType ?? "image/png";

  if (!base64) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "이미지 데이터를 받지 못했습니다" }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ imageBase64: base64, mimeType }),
  };
};
