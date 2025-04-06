import { NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { gemini } from "@/utils/gemini";

export async function POST(req: Request) {
  const { name, brand, color } = await req.json();

  const prompt = `
以下の製品名・ブランド名・色が日本語でない場合、意味は変わらずカタカナに変換してください。出力は必ず以下のJSON形式で返してください。
補足や説明文は不要です。

{
  "name": "...",
  "brand": "...",
  "color": "..."
}

変換対象:
名前: ${name}
ブランド: ${brand}
色: ${color}
`;

  try {
    const messages = [
      new HumanMessage({
        content: [{ type: "text", text: prompt }],
      }),
    ];

    const result = await gemini.invoke(messages);
    const text = result.text.trim();

    // JSON으로 파싱 시도
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // fallback: name: ... 형식일 경우
      parsed = {
        name: text.match(/"name":\s*"(.*?)"/)?.[1] || name,
        brand: text.match(/"brand":\s*"(.*?)"/)?.[1] || brand,
        color: text.match(/"color":\s*"(.*?)"/)?.[1] || color,
      };
    }

    return NextResponse.json({
      name: parsed.name || name,
      brand: parsed.brand || brand,
      color: parsed.color || color,
    });
  } catch (err) {
    console.error("Gemini翻訳エラー:", err);
    return NextResponse.json(
      { error: "Geminiによる翻訳に失敗しました。" },
      { status: 500 }
    );
  }
}
