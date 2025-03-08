// エラーがなかったら消す
// /api/returnRequest/route.ts (App Router例)
import { supabase } from "@/utils/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { id, return_completed } = body;
  const { error } = await supabase
    .from("request")
    .update({ return_completed })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ result: "success" });
}
