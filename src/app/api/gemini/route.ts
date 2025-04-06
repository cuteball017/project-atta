import { NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { gemini } from "@/utils/gemini";

export async function POST(req: Request, res: NextResponse) {
  const { imageUrl } = await req.json();

  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  const base64Image = Buffer.from(buffer).toString("base64");

  const input2 = [
    new HumanMessage({
      content: [
        {
          type: "text",
          text: "画像の特徴を分析し、次の形式で結果を日本語で出力してください。内容が英語である場合はカタカナで出力してください。補足や説明文は不要です。 name: color: brand: feature: ",
        },
        {
          type: "image_url",
          image_url: `data:image/png;base64,${base64Image}`,
        },
      ],
    }),
  ];

  const gemini_res = await gemini.invoke(input2);
  console.log(gemini_res);

  const nameMatch = gemini_res.text.match(/name:\s*([^\n]+)/);
  const brandMatch = gemini_res.text.match(/brand:\s*([^\n]+)/);
  const colorMatch = gemini_res.text.match(/color:\s*([^\n]+)/);
  const featureMatch = gemini_res.text.match(/feature:\s*([^\n]+)/);
  return NextResponse.json({ name: nameMatch ? nameMatch[1].trim() : "", brand: brandMatch ? brandMatch[1].trim() : "", color: colorMatch ? colorMatch[1].trim() : "", feature: featureMatch ? featureMatch[1].trim() : "" });
}

export async function POST2(req: Request, res: NextResponse) {
  const { text } = await req.json();

  const input = [
    new HumanMessage({
      content: [
        {
          type: "text",
          text: `以下の内容を自然な日本語に翻訳してください。英語の製品名やブランド名はすべてカタカナに変換してください。\n\n"${text}"`,
        },
      ],
    }),
  ];

  try {
    const gemini_res = await gemini.invoke(input);
    console.log("Gemini翻訳結果:", gemini_res.text);

    return NextResponse.json({
      translatedText: gemini_res.text.trim(),
    });
  } catch (err) {
    console.error("Gemini翻訳エラー:", err);
    return NextResponse.json(
      { error: "Geminiによる翻訳に失敗しました。" },
      { status: 500 }
    );
  }
}
