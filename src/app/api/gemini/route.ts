import { NextResponse } from "next/server";
import { gemini } from "@/utils/gemini"; // ✅ 共通モジュールをインポート

export const runtime = "nodejs"; // Vercel EdgeではなくNode環境で動作させる
export const maxDuration = 60; // Vercel Pro: 최대 60초까지 허용

const FETCH_TIMEOUT = 15000; // 15秒 (画像ダウンロードタイムアウト)
const GEMINI_TIMEOUT = 40000; // 40秒 (Gemini APIタイムアウト)

// タイムアウトがあるfetch
async function fetchWithTimeout(url: string, timeout: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    // 🔹 クライアントから送信されたJSONを取得
    const { imageUrl } = await req.json();

    // 🔹 画像URLからデータを取得し、Base64形式に変換 (タイムアウト設定)
    const response = await fetchWithTimeout(imageUrl, FETCH_TIMEOUT);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    
    // 이미지 크기 체크 (10MB 이상이면 거절)
    const imageSizeMB = buffer.byteLength / (1024 * 1024);
    if (imageSizeMB > 10) {
      return NextResponse.json(
        { error: "イメージファイルが大きすぎます（最大10MB）" },
        { status: 400 }
      );
    }
    
    const base64Image = Buffer.from(buffer).toString("base64");

    // 🔹 Geminiモデルに画像と指示文を送信（マルチモーダル入力）
    // タイムアウト追加: AbortController使用
    const geminiController = new AbortController();
    const geminiTimeoutId = setTimeout(() => geminiController.abort(), GEMINI_TIMEOUT);
    
    let result;
    try {
      result = await gemini.generateContent([
        {
          // テキスト指示：画像の特徴を日本語で抽出する 画像の特徴を分析し、次の形式で結果を日本語で出力してください。内容が英語である場合はカタカナで出力してください。補足や説明文は不要です。\nname:\ncolor:\nbrand:\nfeature:
          text: "画像分析、特集記号使用禁止、次の形式で結果を日本語で出力、内容が英語である場合はカタカナで出力、補足や説明はfeatureにて名詞で簡略入力。\nname:種類だけの記載(ex:シャツ)\ncolor:\nbrand:\nfeature:",
        },
        {
          // 実際の画像データをBase64として送信
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
      ]);
    } finally {
      clearTimeout(geminiTimeoutId);
    }

    // 🔹 モデルの応答テキストを取得
    const text = result.response.text();
    console.log("Gemini Response:", text);

    // 🔹 正規表現を用いて各項目を抽出
    const nameMatch = text.match(/name:\s*([^\n]+)/);
    const brandMatch = text.match(/brand:\s*([^\n]+)/);
    const colorMatch = text.match(/color:\s*([^\n]+)/);
    const featureMatch = text.match(/feature:\s*([^\n]+)/);

    // 🔹 JSON形式でクライアントに結果を返す
    return NextResponse.json({
      name: nameMatch ? nameMatch[1].trim() : "",
      brand: brandMatch ? brandMatch[1].trim() : "",
      color: colorMatch ? colorMatch[1].trim() : "",
      feature: featureMatch ? featureMatch[1].trim() : "",
    });
  } catch (error) {
    // 🔹 エラーハンドリング：失敗時のログ出力とエラーメッセージ送信
    console.error("Gemini API error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "画像解析に失敗しました。";
    
    // 타임아웃 에러 구분
    if (errorMessage.includes("abort") || errorMessage.includes("timeout")) {
      return NextResponse.json(
        { error: "リクエストがタイムアウトしました。画像サイズを確認してください。" },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}






// import { NextResponse } from "next/server";
// import { HumanMessage } from "@langchain/core/messages";
// import { gemini } from "@/utils/gemini";

// export async function POST(req: Request, res: NextResponse) {
//   const { imageUrl } = await req.json();

//   const response = await fetch(imageUrl);
//   const buffer = await response.arrayBuffer();
//   const base64Image = Buffer.from(buffer).toString("base64");

//   const input2 = [
//     new HumanMessage({
//       content: [
//         {
//           type: "text",
//           text: "画像の特徴を分析し、次の形式で結果を日本語で出力してください。内容が英語である場合はカタカナで出力してください。補足や説明文は不要です。 name: color: brand: feature: ",
//         },
//         {
//           type: "image_url",
//           image_url: `data:image/png;base64,${base64Image}`,
//         },
//       ],
//     }),
//   ];
//   const gemini_res = await gemini.invoke(input2);
//   console.log(gemini_res);

//   const nameMatch = gemini_res.text.match(/name:\s*([^\n]+)/);
//   const brandMatch = gemini_res.text.match(/brand:\s*([^\n]+)/);
//   const colorMatch = gemini_res.text.match(/color:\s*([^\n]+)/);
//   const featureMatch = gemini_res.text.match(/feature:\s*([^\n]+)/);
//   return NextResponse.json({ name: nameMatch ? nameMatch[1].trim() : "", brand: brandMatch ? brandMatch[1].trim() : "", color: colorMatch ? colorMatch[1].trim() : "", feature: featureMatch ? featureMatch[1].trim() : "" });
// }

// import { NextResponse } from "next/server";
// import { gemini } from "@/utils/gemini"; // ✅ 共通モジュールをインポート

// export const runtime = "nodejs"; // Vercel EdgeではなくNode環境で動作させる

// export async function POST(req: Request) {
//   try {
//     // 🔹 クライアントから送信されたJSONを取得
//     const { imageUrl } = await req.json();

//     // 🔹 画像URLからデータを取得し、Base64形式に変換
//     const response = await fetch(imageUrl);
//     const buffer = await response.arrayBuffer();
//     const base64Image = Buffer.from(buffer).toString("base64");

//     // 🔹 Geminiモデルに画像と指示文を送信（マルチモーダル入力）
//     const result = await gemini.generateContent([
//       {
//         // テキスト指示：画像の特徴を日本語で抽出する 画像の特徴を分析し、次の形式で結果を日本語で出力してください。内容が英語である場合はカタカナで出力してください。補足や説明文は不要です。\nname:\ncolor:\nbrand:\nfeature:
//         text: "画像分析、特集記号使用禁止、次の形式で結果を日本語で出力、内容が英語である場合はカタカナで出力、補足や説明はfeatureにて名詞で入力。\nname:種類だけの記載(ex:シャツ)\ncolor:\nbrand:\nfeature:",
//       },
//       {
//         // 実際の画像データをBase64として送信
//         inlineData: {
//           mimeType: "image/png",
//           data: base64Image,
//         },
//       },
//     ]);

//     // 🔹 モデルの応答テキストを取得
//     const text = result.response.text();
//     console.log("Gemini Response:", text);

//     // 🔹 正規表現を用いて各項目を抽出
//     const nameMatch = text.match(/name:\s*([^\n]+)/);
//     const brandMatch = text.match(/brand:\s*([^\n]+)/);
//     const colorMatch = text.match(/color:\s*([^\n]+)/);
//     const featureMatch = text.match(/feature:\s*([^\n]+)/);

//     // 🔹 JSON形式でクライアントに結果を返す
//     return NextResponse.json({
//       name: nameMatch ? nameMatch[1].trim() : "",
//       brand: brandMatch ? brandMatch[1].trim() : "",
//       color: colorMatch ? colorMatch[1].trim() : "",
//       feature: featureMatch ? featureMatch[1].trim() : "",
//     });
//   } catch (error) {
//     // 🔹 エラーハンドリング：失敗時のログ出力とエラーメッセージ送信
//     console.error("Gemini API error:", error);
//     return NextResponse.json(
//       { error: "画像解析に失敗しました。" },
//       { status: 500 }
//     );
//   }
// }