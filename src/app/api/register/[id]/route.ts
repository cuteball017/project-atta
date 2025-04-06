import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";
import axios from "axios";

interface Params {
  id: string;
}

export async function POST(req: Request, { params }: { params: Params }) {
    const { id } = params;
    const { name, brand, color, feature, place, category } = await req.json();
    const fileName = `${id}.jpg`;
    console.log({ id, name, brand, color, feature, place, category });

    const { data, error } = await supabase.from("lost_items").insert({ name: name, brand: brand, color: color, feature: feature, place: place, img_url: fileName, category: category})  
    

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
}