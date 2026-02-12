import { createServerSupabaseClient } from '@/utils/supabaseServer';
import { NextResponse } from 'next/server';

/**
 * ✅ 서버에서 현재 세션 토큰 검증
 * - 클라이언트의 토큰과 비교하여 다중 로그인 감시
 * - 매 요청마다 호출되어 메모리 오염 감지
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getSession();

    if (!data.session || !data.session.user) {
      return NextResponse.json(
        { userId: null, accessToken: null, error: 'No session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      userId: data.session.user.id,
      email: data.session.user.email,
      accessToken: data.session.access_token,
    });
  } catch (error) {
    console.error('[verify-session] Error:', error);
    return NextResponse.json(
      { userId: null, error: 'Server error' },
      { status: 500 }
    );
  }
}
