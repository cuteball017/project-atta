import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseServer";

export const fetchCache = 'force-no-store'

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");

  const supabase = await createServerSupabaseClient();

  // Require authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase.from("request").select();
  if (sinceParam) {
    const sinceId = Number(sinceParam);
    if (!Number.isNaN(sinceId)) {
      query = query.gt("id", sinceId).order("id", { ascending: true });
    }
  } else {
    query = query.order("id", { ascending: false }).limit(100);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}


export async function POST(req: Request) {
  const body = await req.json();
  const { id, return_completed } = body;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("request")
    .update({ return_completed })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ result: "success" });
}
