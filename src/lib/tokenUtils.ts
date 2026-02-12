/**
 * ✅ JWT 토큰 유틸리티
 * - 토큰 디코딩 (userId 추출)
 * - 다중 로그인 검증에 사용
 */

/**
 * JWT 토큰에서 userId (sub claim) 추출
 * @param token - JWT 액세스 토큰
 * @returns userId 또는 null
 */
export const decodeUserId = (token: string | null | undefined): string | null => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // JWT payload는 base64url 인코딩됨
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    // Supabase에서는 userId를 'sub' claim에 저장
    return payload.sub || null;
  } catch (error) {
    console.error('[decodeUserId] Failed to decode token:', error);
    return null;
  }
};

/**
 * JWT 토큰에서 이메일 추출
 * @param token - JWT 액세스 토큰
 * @returns 이메일 또는 null
 */
export const decodeUserEmail = (token: string | null | undefined): string | null => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return payload.email || null;
  } catch (error) {
    console.error('[decodeUserEmail] Failed to decode token:', error);
    return null;
  }
};

/**
 * 두 토큰의 userId가 같은지 비교
 * @param token1 - 첫 번째 토큰
 * @param token2 - 두 번째 토큰
 * @returns 같은 사용자면 true, 다르거나 오류면 false
 */
export const isSameUser = (
  token1: string | null | undefined,
  token2: string | null | undefined
): boolean => {
  const userId1 = decodeUserId(token1);
  const userId2 = decodeUserId(token2);

  if (!userId1 || !userId2) return false;
  return userId1 === userId2;
};
