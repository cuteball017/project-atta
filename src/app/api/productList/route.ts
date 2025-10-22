// app/api/productList/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseServer";

/**
 * 🚫 サーバールートでは `fetchCache` は効かないため、
 * Next.js のルートハンドラ用フラグでキャッシュを明示的に無効化する。
 */
export const dynamic = "force-dynamic"; // SSRキャッシュを無効化
export const revalidate = 0;            // ISRを無効化（常に最新）

/**
 * GET /api/productList
 * - Supabase から lost_items を取得
 * - 常に最新（created_at 降順）で返す
 * - すべてのレイヤーのキャッシュを無効化するレスポンスヘッダを付与
 * - limit/offset をクエリで指定可能（デフォルト 100 件）
 *
 * 例:
 *   /api/productList?limit=50
 *   /api/productList?limit=50&offset=50
 */
export async function GET(req: Request) {
  try {
    // ↪ クエリパラメータからページネーション値を取得（安全のため上下限を設定）
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 200); // 最大200件まで
    const offset = Math.max(Number(searchParams.get("offset") ?? "0"), 0);

    // ↪ 常に最新順に並べ替えて取得（挿入されたばかりの行を先頭に）
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("lost_items")
      .select("*")
      .order("created_at", { ascending: false }) // 最新が先頭
      .range(offset, offset + limit - 1);        // 明示的な範囲（キャッシュずれ防止にも有効）

    // ↪ Supabase エラー時は 500 で返す（クライアントで検知しやすい）
    if (error) {
      return NextResponse.json(
        { error: error.message },
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            // すべての層（ブラウザ/プロキシ/Vercel）でキャッシュを使わせない
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
    }

    // ↪ 正常系レスポンス（キャッシュ完全無効化ヘッダ付き）
    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (e: any) {
    // ↪ 予期しない例外も 500 で拾ってキャッシュを無効化
    return NextResponse.json(
      { error: e?.message ?? "Unexpected error" },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }
}

/**
 * 📌 注意（表示されないときの代表例）
 * - RLS（行レベルセキュリティ）で select が許可されていないとクライアントに出ません。
 *   例: 匿名閲覧が必要なら `to anon for select using (true)` 等のポリシーが必要。
 * - 別ユーザで insert した行は、`user_id = auth.uid()` のようなポリシーだと他ユーザには見えません。
 * - created_at は UTC 保存。クライアント側の日付フィルタとズレる場合があります。
 */






// import { NextResponse } from "next/server";
// import { supabase } from "@/utils/supabase";

// export const fetchCache = 'force-no-store'

// export async function GET(req: Request) {
//     const { data, error } = await supabase.from("lost_items").select();

//     return NextResponse.json({ data });
// }