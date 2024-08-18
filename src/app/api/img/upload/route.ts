import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/utils/supabase";

export async function POST(req: Request, res: NextResponse) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json(
      { error: "ファイルが見つかりません" },
      { status: 400 }
    );
  }

  const fileName = `${uuidv4()}.jpg`;

  const { data, error } = await supabase.storage
    .from("lost-item-pics")
    .upload(fileName, file);

  if (error) {
    console.error("Supabase upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
