// Gemini API를 통해 동화 구조를 생성하는 Netlify Function
import type { Handler } from "@netlify/functions";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface RequestBody {
  story: string;
  geminiKey: string;
}

interface StoryPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
}

interface StoryChoice {
  id: string;
  text: string;
}

interface StoryResponse {
  title: string;
  pages: StoryPage[];
  choices: StoryChoice[];
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

  const { story, geminiKey } = body;

  if (!story || !geminiKey) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "story와 geminiKey가 필요합니다" }),
    };
  }

  if (story.length < 10) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "이야기는 최소 10자 이상이어야 합니다" }),
    };
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `당신은 놀이치료 전문가와 함께하는 동화 작가입니다. 아이의 상상을 따뜻하고 긍정적인 이야기로 만들어주세요.
반드시 다음 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

아이가 말한 이야기: "${story}"

위 이야기를 바탕으로 4~6페이지 분량의 동화책 내용을 JSON으로 만들어주세요.
각 페이지의 imagePrompt는 반드시 영어로 작성하고 "watercolor children's book illustration style"을 포함해야 합니다.
이미지 크기는 512x512를 프롬프트에 명시하세요.

응답 형식:
{
  "title": "동화 제목",
  "pages": [
    {
      "pageNumber": 1,
      "text": "페이지 본문 (2-3문장, 아이 눈높이의 따뜻한 문장)",
      "imagePrompt": "English image generation prompt, watercolor children's book illustration style, 512x512"
    }
  ],
  "choices": [
    { "id": "A", "text": "선택지 1 (이야기가 다르게 펼쳐지는 분기)" },
    { "id": "B", "text": "선택지 2 (또 다른 방향의 이야기 분기)" }
  ]
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  const cleanedText = responseText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const storyData: StoryResponse = JSON.parse(cleanedText);

  if (
    !storyData.title ||
    !Array.isArray(storyData.pages) ||
    storyData.pages.length === 0
  ) {
    throw new Error("유효하지 않은 동화 데이터 형식");
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(storyData),
  };
};
