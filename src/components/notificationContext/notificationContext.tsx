"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { SupabaseContext } from "@/lib/supabaseContext";
import { decodeUserId } from "@/lib/tokenUtils";

export interface Notification {
  id: string;
  message: string;
}

type Action =
  | { type: "ADD"; payload: Notification }
  | { type: "REMOVE"; payload: { id: string } };

interface NotificationContextType {
  state: Notification[];
  dispatch: React.Dispatch<Action>;
}

const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

function reducer(state: Notification[], action: Action): Notification[] {
  switch (action.type) {
    case "ADD":
      return state.some((n) => n.id === action.payload.id)
        ? state
        : [...state, action.payload];
    case "REMOVE":
      return state.filter((n) => n.id !== action.payload.id);
    default:
      return state;
  }
}

export function NotificationProvider({
  children,
  initialAccessToken,
  initialRefreshToken,
}: {
  children: ReactNode;
  initialAccessToken?: string | null;
  initialRefreshToken?: string | null;
}) {
  const [state, dispatch] = useReducer(reducer, []);
  const router = useRouter();
  const pathname = usePathname();
  const channelRef = useRef<any>(null);

  // ✅ 1️⃣ 글로벌 제거: useState로 클라이언트 격리 생성
  const [supabase] = useState(() =>
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  // ✅ Realtime 구독 함수 (useCallback으로 메모이제이션)
  const subscribeRealtime = useCallback(async () => {
    // 기존 채널 제거
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // 새 채널 구독
    const channel = supabase
      .channel("request-insert-listener")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "request" },
        (payload) => {
          console.log("[Realtime payload arrived]", payload);

          const row = payload.new as any;
          if (!row) return;

          const reqId = String(row.id);
          const productId = row.product_id;

          dispatch({
            type: "ADD",
            payload: {
              id: reqId,
              message: `🆕 新しい申請（商品ID: ${productId}）が追加されました。`,
            },
          });

          setTimeout(() => {
            dispatch({ type: "REMOVE", payload: { id: reqId } });
          }, 10_000);
        }
      )
      .subscribe((status, err) => {
        console.log("[Realtime subscribe status]", status);
        if (err) console.error("[Realtime subscribe error]", err);
      });

    channelRef.current = channel;
  }, [supabase, dispatch]);

  // ✅ 2️⃣ 최초 1회만: 토큰 설정 + userId 검증
  useEffect(() => {
    const initSession = async () => {
      try {
        // 토큰이 있으면 세션 설정
        if (initialAccessToken && initialRefreshToken) {
          await supabase.auth.setSession({
            access_token: initialAccessToken,
            refresh_token: initialRefreshToken,
          });
          console.log("[NotificationProvider] Session set from server tokens");

          // ✅ 다중 로그인 검증: 클라이언트 userId와 서버 userId 비교
          const clientUserId = decodeUserId(initialAccessToken);

          try {
            const response = await fetch("/api/auth/verify-session");
            const { userId: serverUserId } = await response.json();

            // ⚠️ 다른 사용자 감지 (메모리 오염 발생!)
            if (
              clientUserId &&
              serverUserId &&
              clientUserId !== serverUserId
            ) {
              console.warn(
                `[Mismatch] Client: ${clientUserId}, Server: ${serverUserId}`
              );
              await supabase.auth.signOut();
              router.push("/login");
              return;
            }
          } catch (err) {
            console.error("[verify-session] Failed:", err);
          }
        }

        // Realtime 구독 시작
        await subscribeRealtime();
      } catch (error) {
        console.error("[initSession] Error:", error);
      }
    };

    initSession();

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [supabase, subscribeRealtime]); // ✅ 의존성 수정

  // ✅ 3️⃣ 자동 토큰 갱신: onAuthStateChanged로 처리
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[Auth state changed]", event, session?.user?.id);

        if (session?.access_token) {
          // 토큰 갱신됨 → realtime auth 업데이트
          await supabase.realtime.setAuth(session.access_token);
          console.log("[Realtime auth updated after token refresh]");
        } else if (event === "SIGNED_OUT") {
          // 로그아웃됨 → 리다이렉트
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/login")
          ) {
            try {
              router.replace("/login");
            } catch (e) {
              window.location.assign("/login");
            }
          }
        }

        // Realtime 재구독
        await subscribeRealtime();
      }
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase, subscribeRealtime, router]);

  // ✅ 로그인 페이지 리다이렉트 (클라이언트 헬퍼)
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (
      !initialAccessToken &&
      !pathname?.startsWith("/login") &&
      !pathname?.startsWith("/api")
    ) {
      try {
        router.replace("/login");
      } catch (e) {
        window.location.assign("/login");
      }
    }
  }, [initialAccessToken, pathname, router]);

  return (
    // ✅ SupabaseContext로 클라이언트 제공 (글로벌 제거!)
    <SupabaseContext.Provider value={supabase}>
      <NotificationContext.Provider value={{ state, dispatch }}>
        {children}
      </NotificationContext.Provider>
    </SupabaseContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return context;
}
