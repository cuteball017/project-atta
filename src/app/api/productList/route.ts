import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export const fetchCache = 'force-no-store'

export async function GET(req: Request) {
    const { data, error } = await supabase.from("lost_items").select();

    return NextResponse.json({ data });
}
