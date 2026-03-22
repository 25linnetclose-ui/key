// Gemini API를 통해 이미지를 생성하는 Netlify Function
import type { Handler } from "@netlify/functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 요청 본문 타입
interface RequestBody {
  prompt: string;
  geminiKey: string;
}

// placeholder SVG 반환 함수 (이미지 생성 실패 시 사용)
function getPlaceholderImage(): { imageBase64: string; mimeType: string } {
  // 파스텔 톤의 귀여운 동화 placeholder SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E0F4FF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EDE7F6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)" rx="20"/>
  <text x="256" y="220" text-anchor="middle" font-size="80">🌟</text>
  <text x="256" y="300" text-anchor="middle" font-size="80">🎨</text>
  <text x="256" y="380" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#9E9E9E">그림을 불러오는 중...</text>
</svg>`;

  const base64 = Buffer.from(svg).toString("base64");
  return { imageBase64: base64, mimeType: "image/svg+xml" };
}

export const handler: Handler = async (event) => {
  // CORS 헤더 설정
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // OPTIONS 요청 처리 (CORS preflight)
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

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-image-preview",
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      // SDK 타입이 아직 responseModalities를 지원하지 않아 as any 캐스팅 필요
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] } as any,
    });

    // 이미지 파트 추출
    const imagePart = result.response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    );

    const base64 = imagePart?.inlineData?.data;
    const mimeType = imagePart?.inlineData?.mimeType ?? "image/png";

    if (!base64) {
      // 이미지 데이터가 없으면 placeholder 반환
      console.warn("Gemini API: 이미지 데이터 없음, placeholder 사용");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(getPlaceholderImage()),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    };
  } catch (error) {
    // 이미지 생성 실패 시 에러를 노출하지 않고 placeholder 반환
    console.error("Image generation error:", error);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(getPlaceholderImage()),
    };
  }
};
