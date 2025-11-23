"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export function NotificationProvider({ children, initialAccessToken, initialRefreshToken }: { children: ReactNode; initialAccessToken?: string | null; initialRefreshToken?: string | null }) {
  const [state, dispatch] = useReducer(reducer, []);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // 채널 구독을 함수로 분리
  const subscribeRealtime = async () => {
    // 기존 채널 있으면 제거
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // 현재 세션으로 realtime auth 세팅
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      await supabase.realtime.setAuth(session.access_token);
      console.log("[Realtime auth set before subscribe]");
    } else {
      console.log("[No session yet -> subscribe as anon]");
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
  };

  // 1) 최초 1회 구독
  useEffect(() => {
    const init = async () => {
      // if server passed session tokens, set them in the client supabase instance
      try {
        if (initialAccessToken && initialRefreshToken) {
          await supabase.auth.setSession({ access_token: initialAccessToken, refresh_token: initialRefreshToken });
          console.log("[NotificationProvider] client session set from server tokens");
        }
      } catch (e) {
        console.warn("[NotificationProvider] setSession failed", e);
      }
      await subscribeRealtime();
    };
    init();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) 로그인/로그아웃(세션 변경) 시 재구독
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
        console.log("[Realtime auth updated -> resubscribe]");
      } else {
        console.log("[Logged out -> resubscribe]");
      }
      // ✅ 여기서 재구독
      subscribeRealtime();
    });

    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // polling removed — rely on realtime only

  return (
    <NotificationContext.Provider value={{ state, dispatch }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider");
  }
  return context;
}







// "use client";

// import {
//   createContext,
//   useContext,
//   useReducer,
//   ReactNode,
//   useEffect,
// } from "react";
// import { createClient } from "@supabase/supabase-js";

// // ✅ 클라이언트 Supabase (Realtime + Auth 세션 사용)
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// export interface Notification {
//   id: string;
//   message: string;
// }

// type Action =
//   | { type: "ADD"; payload: Notification }
//   | { type: "REMOVE"; payload: { id: string } };

// interface NotificationContextType {
//   state: Notification[];
//   dispatch: React.Dispatch<Action>;
// }

// const NotificationContext = createContext<
//   NotificationContextType | undefined
// >(undefined);

// function reducer(state: Notification[], action: Action): Notification[] {
//   switch (action.type) {
//     case "ADD":
//       // 중복 알림 방지
//       return state.some((n) => n.id === action.payload.id)
//         ? state
//         : [...state, action.payload];

//     case "REMOVE":
//       return state.filter((n) => n.id !== action.payload.id);

//     default:
//       return state;
//   }
// }

// export function NotificationProvider({ children }: { children: ReactNode }) {
//   const [state, dispatch] = useReducer(reducer, []);

//   useEffect(() => {
//     let channel: ReturnType<typeof supabase.channel> | null = null;
//     let alive = true;

//     const setupRealtime = async () => {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!alive) return;

//       if (session?.access_token) {
//         await supabase.realtime.setAuth(session.access_token);
//       }``
//       if (!alive) return;

//       channel = supabase
//         .channel("request-insert-listener")
//         .on("postgres_changes", {
//           event: "INSERT",
//           schema: "public",
//           table: "request",
//         }, (payload) => {
//           console.log("[Realtime payload arrived]", payload); 
//           if (!alive) return;

//           const row = payload.new as any;
//           if (!row) return;

//           const reqId = String(row.id);
//           const productId = row.product_id;

//           dispatch({
//             type: "ADD",
//             payload: {
//               id: reqId,
//               message: `🆕 新しい申請（商品ID: ${productId}）が追加されました。`,
//             },
//           });

//           const t = setTimeout(() => {
//             if (alive) {
//               dispatch({ type: "REMOVE", payload: { id: reqId } });
//             }
//           }, 10_000);
//         })
//         .subscribe();
//     };

//     setupRealtime();

//     return () => {
//       alive = false;
//       if (channel) supabase.removeChannel(channel);
//     };
//   }, []);

//   return (
//     <NotificationContext.Provider value={{ state, dispatch }}>
//       {children}
//     </NotificationContext.Provider>
//   );
// }

// export function useNotifications(): NotificationContextType {
//   const context = useContext(NotificationContext);
//   if (!context) {
//     throw new Error(
//       "useNotifications must be used inside NotificationProvider"
//     );
//   }
//   return context;
// }











// "use client";

// import {
//   createContext,
//   useContext,
//   useReducer,
//   ReactNode,
//   useEffect,
//   useRef,
// } from "react";
// import { supabase } from "@/utils/supabase";

// export interface Notification {
//   id: string;
//   message: string;
// }

// type Action =
//   | { type: "ADD"; payload: Notification }
//   | { type: "REMOVE"; payload: { id: string } };

// interface NotificationContextType {
//   state: Notification[];
//   dispatch: React.Dispatch<Action>;
// }

// const NotificationContext = createContext<
//   NotificationContextType | undefined
// >(undefined);

// function reducer(state: Notification[], action: Action): Notification[] {
//   switch (action.type) {
//     case "ADD":
//       return state.some((n) => n.id === action.payload.id)
//         ? state
//         : [...state, action.payload];
//     case "REMOVE":
//       return state.filter((n) => n.id !== action.payload.id);
//     default:
//       return state;
//   }
// }

// export function NotificationProvider({
//   children,
// }: {
//   children: ReactNode;
// }) {
//   const [state, dispatch] = useReducer(reducer, []);

//   // 마지막으로 처리한 요청 ID를 기억
//   const latestIdRef = useRef<number>(0);

//   useEffect(() => {
//     let isMounted = true;

//     const fetchNewRequests = async () => {
//       // 현재까지 가장 큰 ID보다 큰 것들만 가져오기
//       const { data, error } = await supabase
//         .from("request")
//         .select("id, product_id")
//         .gt("id", latestIdRef.current)
//         .order("id", { ascending: true });

//       if (error) {
//         console.error("Polling error:", error);
//         return;
//       }
//       if (!data || data.length === 0) return;

//       for (const row of data) {
//         // 마운트 상태 확인
//         if (!isMounted) break;

//         const newId = row.id;
//         const productId = row.product_id;
//         // 알림 디스패치
//         dispatch({
//           type: "ADD",
//           payload: {
//             id: String(productId),
//             message: `新しい申請(商品ID:${productId})が追加されました.`,
//           },
//         });
//         // 최신 ID 업데이트
//         latestIdRef.current = newId;
//       }
//     };

//     // 최초 한 번 페치해서 latestId 세팅
//     (async () => {
//       const { data } = await supabase
//         .from("request")
//         .select("id")
//         .order("id", { ascending: false })
//         .limit(1);
//       if (data && data.length > 0) {
//         latestIdRef.current = data[0].id;
//       }
//     })();

//     // 5초마다 폴링
//     const interval = setInterval(fetchNewRequests, 5_000);

//     return () => {
//       isMounted = false;
//       clearInterval(interval);
//     };
//   }, []);

//   return (
//     <NotificationContext.Provider value={{ state, dispatch }}>
//       {children}
//     </NotificationContext.Provider>
//   );
// }

// export function useNotifications(): NotificationContextType {
//   const context = useContext(NotificationContext);
//   if (!context)
//     throw new Error(
//       "useNotifications must be used within NotificationProvider"
//     );
//   return context;
// }
