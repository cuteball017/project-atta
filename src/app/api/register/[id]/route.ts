import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

interface Params {
  id: string;
}

export async function POST(req: Request, { params }: { params: Params }) {
    const { id } = params;
    const { name, brand, color, feature, other } = await req.json();
    const fileName = `${id}.jpg`;
    console.log({ id, name, brand, color, feature, other });

    const { error } = await supabase.from("lost_items").insert({ name: name, brand: brand, color: color, feature: feature, other: other, img_url: fileName });

    if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ response : "success" });
}
