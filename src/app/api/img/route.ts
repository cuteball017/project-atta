import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseServer";

// Requestオブジェクトを拡張してあるNextRequestオブジェクトとして受け取るとパース機能がついてくる
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imgId = searchParams.get("id"); // => "hello"

    if (!imgId) {
      return NextResponse.json({ error: "missing id" }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { data } = supabase.storage
      .from("lost-item-pics")
      .getPublicUrl(imgId + ".jpg");

    console.log("getPublicUrl result:", data);

    return NextResponse.json({ data });
  } catch (err) {
    console.error("/api/img GET error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
