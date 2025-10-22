import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    // クライアントから signatureData および product_id が送信されることを想定
    // 例: { "signatureData": "data:image/png;base64,....", "product_id": 123 }
    const { signatureData, product_id } = await req.json(); 
    if (!signatureData) {
      return NextResponse.json({ error: "署名データが存在しません" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // 1) Base64 → Buffer に変換
    const base64Data = signatureData.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    // 2) Supabase Storage にアップロード
    const fileName = `signature_${Date.now()}.png`;

  const { data, error } = await supabase.storage
      .from("signatures")  // "signatures" ストレージバケット
      .upload(fileName, buffer, {
        contentType: "image/png",
      });

    if (error) {
      console.error("Supabase アップロードエラー:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3) lost_items テーブルの sig_url カラムに fileName を保存（product_id が存在する場合のみ）
    if (product_id) {
      const { error: updateError } = await supabase
        .from("lost_items")                  // 対象テーブル
        .update({ sig_url: fileName })    // sig_url を更新
        .eq("id", product_id);                    // 該当IDの行を対象

      if (updateError) {
        console.error("Supabase DB 更新エラー:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: "署名保存成功",
      path: data?.path,       // 保存パス
      fileName: fileName,     // 保存ファイル名
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}





// import { NextRequest, NextResponse } from "next/server";
// import { supabase } from "@/utils/supabase";

// export async function POST(req: NextRequest) {
//   try {
//     const { signatureData } = await req.json(); // Base64 ("data:image/png;base64,....")
//     if (!signatureData) {
//       return NextResponse.json({ error: "No signature data" }, { status: 400 });
//     }

//     // 1) Base64 -> Buffer 변환
//     const base64Data = signatureData.split(",")[1]; // "data:image/png;base64," 제거
//     const buffer = Buffer.from(base64Data, "base64");

//     // 2) Supabase Storage 업로드
//     // 유니크 파일명. 날짜+랜덤
//     const fileName = `signature_${Date.now()}.png`;

//     const { data, error } = await supabase.storage
//       .from("signatures")     // 사전에 만들어둔 버킷 이름
//       .upload(fileName, buffer, {
//         contentType: "image/png",
//       });

//     if (error) {
//       console.error("Supabase upload error:", error);
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }

//     return NextResponse.json({
//       message: "서명 저장 성공",
//       path: data?.path
//     });
//   } catch (err: any) {
//     console.error(err);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }
