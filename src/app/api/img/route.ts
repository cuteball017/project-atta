import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

// Requestオブジェクトを拡張してあるNextRequestオブジェクトとして受け取るとパース機能がついてくる
export function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imgId = searchParams.get("id"); // => "hello"

  const { data } = supabase.storage
    .from("lost-item-pics")
    .getPublicUrl(imgId + ".jpg");

  console.log(data);

  return NextResponse.json({ data });
}
