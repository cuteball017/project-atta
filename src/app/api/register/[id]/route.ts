import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseServer";
import axios from "axios";

interface Params {
  id: string;
}

export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    const { name, brand, color, feature, place, category, remarks } = await req.json();
    const fileName = `${id}.jpg`;
    console.log({ id, name, brand, color, feature, place, category, remarks });

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase.from("lost_items").insert({ name: name, brand: brand, color: color, feature: feature, place: place, img_url: fileName, category: category, remarks: remarks});

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }


    //後日。追加する機能
    // .select("id");
    // const inserted = data[0];
    // console.log(inserted.id);
    
    // try {
    //   await axios.post("https://atta-match.onrender.com/webhook", {
    //     id: inserted.id.toString(),
    //     name,
    //     brand,
    //     color,
    //     feature,
    //     place,
    //     img_url: fileName,
    //     category,
    //     created_at: new Date().toISOString(), 
    //   });
    // } catch (webhookError) {
    //   console.error("Render サーバ webhook 伝送失敗:", webhookError);
    //   return NextResponse.json({ error: "Webhook　伝送失敗" }, { status: 500 });
    // }

    return NextResponse.json({ response : "success" });
  } catch (err) {
    console.error("/api/register/[id] POST error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}