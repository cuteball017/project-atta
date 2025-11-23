import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, brand, color, feature, place, category, img_url } = body;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("lost_items")
      .update({ name, brand, color, feature, place, category, img_url })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ result: "updated" });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
