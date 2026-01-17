import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseServer";

export async function POST(req: Request) {
  try {
    const { leadTime } = await req.json();

    if (!leadTime) {
      return NextResponse.json(
        { error: "leadTime is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from("evaluation_factor").insert({
      lead_time: leadTime,
    });

    if (error) {
      console.error("Evaluation factor insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ response: "success" });
  } catch (err) {
    console.error("/api/evaluation-factor POST error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
