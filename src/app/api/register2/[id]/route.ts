import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseServer";

interface Params {
  id: string;
}

export async function POST(req: Request, { params }: { params: Params }) {
    const { id } = params;
    const { product_id, img_url, application_date, remarks, applicant } = await req.json();
  const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("request")
      .insert({ product_id: product_id, img_url: img_url, application_date: application_date, remarks: remarks, applicant: applicant });

    if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ response : "success" });
}