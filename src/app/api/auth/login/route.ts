import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_JWT_MAX_AGE = process.env.SUPABASE_JWT_MAX_AGE ?? "604800";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase environment variables are not configured");
}

const SUPABASE_URL_VALUE = SUPABASE_URL as string;
const SUPABASE_ANON_KEY_VALUE = SUPABASE_ANON_KEY as string;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

  const supabase = createClient(SUPABASE_URL_VALUE, SUPABASE_ANON_KEY_VALUE, {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = NextResponse.json({ user: data.user });
    const maxAge = Number.isFinite(Number(SUPABASE_JWT_MAX_AGE))
      ? Number(SUPABASE_JWT_MAX_AGE)
      : 60 * 60 * 24 * 7;
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge,
    };

    response.cookies.set("sb-access-token", data.session.access_token, cookieOptions);
    response.cookies.set("sb-refresh-token", data.session.refresh_token, cookieOptions);

    return response;
  } catch (error) {
    console.error("Login route error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
