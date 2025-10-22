import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseServer";

interface Params {
  id: string;
}

export async function POST(req: Request, { params }: { params: Params }) {
    const { id } = params;
    const { product_id, applicant, name, feature, place, lost_day, img_url, return_completed } = await req.json();
  const supabase = await createServerSupabaseClient();

    const { error } = await supabase.from("request").insert({ product_id: product_id, applicant: applicant, name: name, feature: feature, place: place, img_url: img_url, lost_day: lost_day, return_completed: return_completed });

    if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ response : "success" });
}