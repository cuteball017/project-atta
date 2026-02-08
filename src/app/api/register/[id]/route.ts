import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseServer";
import axios from "axios";

interface Params {
  id: string;
}

export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const { id } = params;
    const { name, brand, color, feature, place, category, remarks, additionalImage } = await req.json();
    const fileName = `${id}.jpg`;
    console.log({ id, name, brand, color, feature, place, category, remarks, hasAdditionalImage: !!additionalImage });

    const supabase = await createServerSupabaseClient();

    // 追加画像をUPLOADする（base64データをバイナリに変換）
    let addImgUrl: string | null = null;
    if (additionalImage) {
      try {
        const base64Data = additionalImage;
        // base64をバイナリに変換
        const binaryString = atob(base64Data.split(',')[1] || base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        const additionalFileName = `add_${id}.jpg`;
        const { data, error } = await supabase.storage
          .from("lost-item-pics")
          .upload(additionalFileName, bytes, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (!error && data) {
          addImgUrl = additionalFileName;
        } else {
          console.error(`追加画像のアップロード失敗:`, error);
        }
      } catch (e) {
        console.error(`追加画像の処理失敗:`, e);
      }
    }

    const { data, error } = await supabase.from("lost_items").insert({ 
      name: name, 
      brand: brand, 
      color: color, 
      feature: feature, 
      place: place, 
      img_url: fileName, 
      category: category, 
      remarks: remarks,
      add_img_url: addImgUrl
    });

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

    return NextResponse.json({ response : "success", hasAddImage: !!addImgUrl });
  } catch (err) {
    console.error("/api/register/[id] POST error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}





// import { NextResponse } from "next/server";
// import { createServerSupabaseClient } from "@/utils/supabaseServer";
// import axios from "axios";

// interface Params {
//   id: string;
// }

// export async function POST(req: Request, { params }: { params: Params }) {
//   try {
//     const { id } = params;
//     const { name, brand, color, feature, place, category, remarks } = await req.json();
//     const fileName = `${id}.jpg`;
//     console.log({ id, name, brand, color, feature, place, category, remarks });

//     const supabase = await createServerSupabaseClient();

//     const { data, error } = await supabase.from("lost_items").insert({ name: name, brand: brand, color: color, feature: feature, place: place, img_url: fileName, category: category, remarks: remarks});

//     if (error) {
//       console.error("Supabase insert error:", error);
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }


//     //後日。追加する機能
//     // .select("id");
//     // const inserted = data[0];
//     // console.log(inserted.id);
    
//     // try {
//     //   await axios.post("https://atta-match.onrender.com/webhook", {
//     //     id: inserted.id.toString(),
//     //     name,
//     //     brand,
//     //     color,
//     //     feature,
//     //     place,
//     //     img_url: fileName,
//     //     category,
//     //     created_at: new Date().toISOString(), 
//     //   });
//     // } catch (webhookError) {
//     //   console.error("Render サーバ webhook 伝送失敗:", webhookError);
//     //   return NextResponse.json({ error: "Webhook　伝送失敗" }, { status: 500 });
//     // }

//     return NextResponse.json({ response : "success" });
//   } catch (err) {
//     console.error("/api/register/[id] POST error:", err);
//     const message = err instanceof Error ? err.message : String(err);
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }