// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

/** ====== 환경설정 (.env 로 조절 가능) ====== */
const REALM = process.env.BASIC_AUTH_REALM || "Restricted Area";
const USER = process.env.BASIC_AUTH_USER || "";
const PASS = process.env.BASIC_AUTH_PASS || "";
const MAX_ATTEMPTS = Number(process.env.BASIC_AUTH_MAX_ATTEMPTS || "10"); // 실패 허용 횟수
const LOCK_SECS   = Number(process.env.BASIC_AUTH_LOCK_SECS   || "60");  // 잠금 유지(초)

/** ====== 유틸 ====== */

// 상수시간 비교(타이밍 공격 완화)
function timingSafeEqual(a: string, b: string): boolean {
  const te = new TextEncoder();
  const ua = te.encode(a);
  const ub = te.encode(b);
  const len = Math.max(ua.length, ub.length);
  let diff = ua.length ^ ub.length;
  for (let i = 0; i < len; i++) {
    const ca = ua[i] ?? 0;
    const cb = ub[i] ?? 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}

// 보안 헤더 (DEV/PROD 분기 + Supabase/미디어/워커 허용)
function withSecurityHeaders(res: NextResponse, req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";

  const devCsp = [
    "default-src 'self'",
    "img-src 'self' https: data: blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' http: https: ws: wss:",
    "font-src 'self' data:",
    "media-src 'self' blob: data:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  const prodCsp = [
    "default-src 'self'",
    "img-src 'self' https: data: blob:",
    // nonce/hash를 별도로 안 쓰면 Next 인라인 런타임 차단 방지용으로 임시 허용
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    // Supabase 및 기타 외부 통신 허용 (필요 시 도메인 더 좁혀도 됨)
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https: http:",
    "font-src 'self' data:",
    "media-src 'self' blob: data:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  res.headers.set("Content-Security-Policy", isDev ? devCsp : prodCsp);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 카메라/마이크 허용 (자체 도메인 기준), 화면공유 사용 시 display-capture 포함
  res.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(self), camera=(self), display-capture=(self)"
  );

  const xfProto = req.headers.get("x-forwarded-proto");
  if (!isDev && xfProto === "https") {
    res.headers.set("Strict-Transport-Security", "max-age=15552000; includeSubDomains; preload");
  }
  return res;
}

function unauthorized(req: NextRequest, message?: string, retryAfterSec?: number) {
  const res = new NextResponse(message || "Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store",
      ...(retryAfterSec ? { "Retry-After": String(retryAfterSec) } : {}),
    },
  });
  return withSecurityHeaders(res, req);
}

function ok(req: NextRequest) {
  return withSecurityHeaders(NextResponse.next(), req);
}

// アプリ内ログイン必須判定（/login 自体は除外）
function isLoginFreePath(p: string) {
  return p === "/login";
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  const res = NextResponse.redirect(url);
  return withSecurityHeaders(res, req);
}

// 공개/정적/필수 경로 우회 (정적, API, 인증 콜백 등)
function isPublicPath(p: string) {
  return (
    p.startsWith("/_next/") ||
    p === "/favicon.ico" ||
    p === "/robots.txt" ||
    p === "/sitemap.xml" ||
    p.startsWith("/.well-known/") ||
    p.startsWith("/api/") ||           // API는 보호 대상에서 제외
    p === "/auth/callback" ||          // Supabase Auth Helpers 콜백
    p.startsWith("/auth/") ||          // 기타 인증 관련 경로
    p.startsWith("/sb-auth") ||        // 사용 중인 경우 대비
    p.startsWith("/supabase") ||       // 사용 중인 경우 대비
    p === "/healthz"                   // 헬스체크 등
  );
}

/** ====== 간단 브루트포스 억제(쿠키 기반) ====== */
const CK_FAIL = "ba_fail";
const CK_LOCK = "ba_lock";

function bumpFailAndMaybeLock(req: NextRequest): NextResponse {
  const now = Math.floor(Date.now() / 1000);
  const lockUntil = Number(req.cookies.get(CK_LOCK)?.value || "0");
  if (lockUntil && lockUntil > now) {
    return unauthorized(req, "Too many attempts.", lockUntil - now);
  }

  const curr = Number(req.cookies.get(CK_FAIL)?.value || "0") + 1;
  const res = unauthorized(req, "Unauthorized");

  // 실패 횟수 갱신 (쿠키는 브라우저 단 억제용)
  res.cookies.set(CK_FAIL, String(curr), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: LOCK_SECS,
  });

  if (curr >= MAX_ATTEMPTS) {
    const until = now + LOCK_SECS;
    res.cookies.set(CK_LOCK, String(until), {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: LOCK_SECS,
    });
    res.headers.set("Retry-After", String(LOCK_SECS));
  }
  return res;
}

function clearFailCookies(res: NextResponse) {
  res.cookies.set(CK_FAIL, "", { path: "/", maxAge: 0 });
  res.cookies.set(CK_LOCK, "", { path: "/", maxAge: 0 });
}

/** ====== 미들웨어 본체 ====== */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 0) 프리플라이트(OPTIONS)는 무조건 통과 (CORS 안정성)
  if (req.method === "OPTIONS") {
    return ok(req);
  }

  // 1) 공개/예외 경로는 통과
  if (isPublicPath(pathname)) return ok(req);

  // 2) 환경변수 미설정 시 보호 비활성 (운영 안전)
  if (!USER || !PASS) return ok(req);

  // 3) 잠금 체크
  const now = Math.floor(Date.now() / 1000);
  const lockUntil = Number(req.cookies.get(CK_LOCK)?.value || "0");
  if (lockUntil && lockUntil > now) {
    return unauthorized(req, "Too many attempts.", lockUntil - now);
  }

  // 4) Basic Auth 검사
  const auth = req.headers.get("authorization");
  if (!auth) return unauthorized(req);

  const [schemeRaw, encoded] = auth.split(" ");
  const scheme = schemeRaw?.toLowerCase();
  if (scheme !== "basic" || !encoded) return unauthorized(req);

  // Base64 디코드 (Edge 런타임: atob 사용)
  let decoded = "";
  try {
    decoded = atob(encoded);
  } catch {
    return unauthorized(req);
  }

  // "username:password" (비번에 ':' 포함 허용)
  const idx = decoded.indexOf(":");
  if (idx < 0) return unauthorized(req);
  const givenUser = decoded.slice(0, idx);
  const givenPass = decoded.slice(idx + 1);

  // 상수시간 비교
  const userOk = timingSafeEqual(givenUser, USER);
  const passOk = timingSafeEqual(givenPass, PASS);

    if (userOk && passOk) {
      // Basic 認証通過後、アプリのログイン（Supabaseセッション）チェック
      // If sb-login-flag is set (fresh login), skip session validation for this request
      const isJustLoggedIn = Boolean(req.cookies.get("sb-login-flag")?.value);
      const hasSbSession = Boolean(req.cookies.get("sb-access-token")?.value);
      
      if (!isJustLoggedIn && !hasSbSession && !isLoginFreePath(pathname)) {
        return redirectToLogin(req);
      }

      const res = ok(req);
      clearFailCookies(res);
      return res;
    }  return bumpFailAndMaybeLock(req);
}

/** ====== 매처 ====== */
export const config = {
  // 정적/이미지/API/인증 콜백 등은 아예 매처에서 제외해 비용/부작용 절감
  matcher: [
    "/((?!_next/|favicon.ico|robots.txt|sitemap.xml|\\.well-known/|api/|auth/callback|auth/.*|sb-auth|supabase|healthz).*)",
  ],
};






// // middleware.ts
// import { NextRequest, NextResponse } from "next/server";

// /** ====== 환경설정 (.env 로 조절 가능) ====== */
// const REALM = process.env.BASIC_AUTH_REALM || "Restricted Area";
// const USER = process.env.BASIC_AUTH_USER || "";
// const PASS = process.env.BASIC_AUTH_PASS || "";
// const MAX_ATTEMPTS = Number(process.env.BASIC_AUTH_MAX_ATTEMPTS || "10"); // 실패 허용 횟수
// const LOCK_SECS   = Number(process.env.BASIC_AUTH_LOCK_SECS   || "60");  // 잠금 유지(초)

// /** ====== 유틸 ====== */

// // 상수시간 비교(타이밍 공격 완화)
// function timingSafeEqual(a: string, b: string): boolean {
//   const te = new TextEncoder();
//   const ua = te.encode(a);
//   const ub = te.encode(b);
//   const len = Math.max(ua.length, ub.length);
//   let diff = ua.length ^ ub.length;
//   for (let i = 0; i < len; i++) {
//     const ca = ua[i] ?? 0;
//     const cb = ub[i] ?? 0;
//     diff |= ca ^ cb;
//   }
//   return diff === 0;
// }

// // 보안 헤더 (DEV/PROD 분기 + HMR 허용)
// function withSecurityHeaders(res: NextResponse, req: NextRequest) {
//   const isDev = process.env.NODE_ENV !== "production";

//   const devCsp = [
//     "default-src 'self'",
//     "img-src 'self' https: data: blob:",
//     "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
//     "style-src 'self' 'unsafe-inline'",
//     "connect-src 'self' http: https: ws: wss:",
//     "font-src 'self' data:",
//     "frame-ancestors 'none'",
//     "base-uri 'self'",
//     "form-action 'self'",
//   ].join("; ");

//   const prodCsp = [
//     "default-src 'self'",
//     "img-src 'self' https: data:",
//     "script-src 'self'",               // 필요 시 nonce/hash로 세분화
//     "style-src 'self' 'unsafe-inline'",
//     "connect-src 'self' https:",
//     "font-src 'self' data:",
//     "frame-ancestors 'none'",
//     "base-uri 'self'",
//     "form-action 'self'",
//   ].join("; ");

//   res.headers.set("Content-Security-Policy", isDev ? devCsp : prodCsp);
//   res.headers.set("X-Content-Type-Options", "nosniff");
//   res.headers.set("X-Frame-Options", "DENY");
//   res.headers.set("Referrer-Policy", "no-referrer");
//   res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

//   const xfProto = req.headers.get("x-forwarded-proto");
//   if (!isDev && xfProto === "https") {
//     res.headers.set("Strict-Transport-Security", "max-age=15552000; includeSubDomains; preload");
//   }
//   return res;
// }

// function unauthorized(req: NextRequest, message?: string, retryAfterSec?: number) {
//   const res = new NextResponse(message || "Authentication required.", {
//     status: 401,
//     headers: {
//       "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
//       "Cache-Control": "no-store",
//       ...(retryAfterSec ? { "Retry-After": String(retryAfterSec) } : {}),
//     },
//   });
//   return withSecurityHeaders(res, req);
// }

// function ok(req: NextRequest) {
//   return withSecurityHeaders(NextResponse.next(), req);
// }

// // 공개/정적 경로 우회
// function isPublicPath(p: string) {
//   return (
//     p.startsWith("/_next/") ||
//     p === "/favicon.ico" ||
//     p === "/robots.txt" ||
//     p === "/sitemap.xml" ||
//     p.startsWith("/.well-known/")
//   );
// }

// /** ====== 간단 브루트포스 억제(쿠키 기반) ====== */
// const CK_FAIL = "ba_fail";
// const CK_LOCK = "ba_lock";

// function bumpFailAndMaybeLock(req: NextRequest): NextResponse {
//   const now = Math.floor(Date.now() / 1000);
//   const lockUntil = Number(req.cookies.get(CK_LOCK)?.value || "0");
//   if (lockUntil && lockUntil > now) {
//     return unauthorized(req, "Too many attempts.", lockUntil - now);
//   }

//   const curr = Number(req.cookies.get(CK_FAIL)?.value || "0") + 1;
//   const res = unauthorized(req, "Unauthorized");

//   // 실패 횟수 갱신 (쿠키는 브라우저 단 억제용이므로 공격자가 지우면 우회 가능 → 실서비스는 WAF/Redis 권장)
//   res.cookies.set(CK_FAIL, String(curr), {
//     httpOnly: true,
//     secure: true,
//     sameSite: "strict",
//     path: "/",
//     maxAge: LOCK_SECS,
//   });

//   if (curr >= MAX_ATTEMPTS) {
//     const until = now + LOCK_SECS;
//     res.cookies.set(CK_LOCK, String(until), {
//       httpOnly: true,
//       secure: true,
//       sameSite: "strict",
//       path: "/",
//       maxAge: LOCK_SECS,
//     });
//     res.headers.set("Retry-After", String(LOCK_SECS));
//   }
//   return res;
// }

// function clearFailCookies(res: NextResponse) {
//   res.cookies.set(CK_FAIL, "", { path: "/", maxAge: 0 });
//   res.cookies.set(CK_LOCK, "", { path: "/", maxAge: 0 });
// }

// /** ====== 미들웨어 본체 ====== */
// export function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;

//   // 공개 경로 우회
//   if (isPublicPath(pathname)) return ok(req);

//   // 환경변수 미설정 → 차단
//   if (!USER || !PASS) return unauthorized(req);

//   // 잠금 체크
//   const now = Math.floor(Date.now() / 1000);
//   const lockUntil = Number(req.cookies.get(CK_LOCK)?.value || "0");
//   if (lockUntil && lockUntil > now) {
//     return unauthorized(req, "Too many attempts.", lockUntil - now);
//   }

//   const auth = req.headers.get("authorization");
//   if (!auth) return unauthorized(req);

//   const [schemeRaw, encoded] = auth.split(" ");
//   const scheme = schemeRaw?.toLowerCase();
//   if (scheme !== "basic" || !encoded) return unauthorized(req);

//   // Base64 디코드 (Edge 런타임: atob 사용)
//   let decoded = "";
//   try {
//     decoded = atob(encoded);
//   } catch {
//     return unauthorized(req);
//   }

//   // "username:password" (비번에 ':' 포함 허용)
//   const idx = decoded.indexOf(":");
//   if (idx < 0) return unauthorized(req);
//   const givenUser = decoded.slice(0, idx);
//   const givenPass = decoded.slice(idx + 1);

//   // 상수시간 비교
//   const userOk = timingSafeEqual(givenUser, USER);
//   const passOk = timingSafeEqual(givenPass, PASS);

//   if (userOk && passOk) {
//     const res = ok(req);
//     clearFailCookies(res);
//     return res;
//   }

//   return bumpFailAndMaybeLock(req);
// }

// /** ====== 매처 ====== */
// export const config = {
//   // 상세 예외는 isPublicPath에서 처리하므로 매처는 간단히 유지
//   matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml|\\.well-known/).*)"],
// };



// // middleware.ts
// import { NextRequest, NextResponse } from "next/server";

// /** 브라우저 기본 인증 창을 띄우는 401 응답 */
// function unauthorized() {
//   const realm = process.env.BASIC_AUTH_REALM || "Restricted Area";
//   return new NextResponse("Authentication required.", {
//     status: 401,
//     headers: {
//       // ← 이 헤더가 있으면 모든 브라우저가 기본 인증 팝업을 띄운다
//       "WWW-Authenticate": `Basic realm="${realm}", charset="UTF-8"`,
//     },
//   });
// }

// export function middleware(req: NextRequest) {
//   const user = process.env.BASIC_AUTH_USER || "";
//   const pass = process.env.BASIC_AUTH_PASS || "";

//   // 환경변수 미설정 시, 안전하게 모든 접근 차단
//   if (!user || !pass) return unauthorized();

//   const auth = req.headers.get("authorization");

//   // Authorization 헤더가 없으면 팝업 유도
//   if (!auth) return unauthorized();

//   // 형식: "Basic base64(username:password)"
//   const [scheme, encoded] = auth.split(" ");
//   if (scheme !== "Basic" || !encoded) return unauthorized();

//   // Edge 런타임은 atob 사용 (Buffer 미보장)
//   let decoded = "";
//   try {
//     decoded = atob(encoded);
//   } catch {
//     return unauthorized();
//   }

//   const [givenUser, givenPass] = decoded.split(":");

//   // 자격 증명 검사
//   if (givenUser === user && givenPass === pass) {
//     return NextResponse.next(); // 통과 → 다음 단계(페이지/에셋)로 진행
//   }

//   // 틀리면 다시 팝업
//   return unauthorized();
// }

// /**
//  * (권장) 정적 리소스 일부는 제외해도 됨.
//  * 제외하지 않아도 동작엔 문제 없지만, 불필요한 미들웨어 실행을 줄여 약간의 이득.
//  */
// export const config = {
//   matcher: [
//     // _next/static, _next/image, favicon 제외하고 모두 보호
//     "/((?!_next/static|_next/image|favicon.ico).*)",
//   ],
// };