import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabaseServer";

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data.session) return NextResponse.json({ error: "no-session" }, { status: 401 });

    // return minimal session/user data for client verification
    return NextResponse.json({ session: data.session, user: data.session.user });
  } catch (e) {
    console.error("/api/auth/session error", e);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
