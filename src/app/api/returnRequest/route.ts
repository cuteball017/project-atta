// エラーがなかったら消す
// /api/returnRequest/route.ts (App Router例)
import { createServerSupabaseClient } from "@/utils/supabaseServer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { product_id, applicant, return_at} = body;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("lost_items")
    .update({ return_at, applicant})
    .eq("id", product_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ result: "success" });
}
