import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export const fetchCache = 'force-no-store'

export async function GET(req: Request) {
    const { data, error } = await supabase.from("request").select();

    return NextResponse.json({ data });
}


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
