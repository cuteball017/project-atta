"use client";

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { supabase } from "@/utils/supabase";

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
}: {
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, []);

  // 마지막으로 처리한 요청 ID를 기억
  const latestIdRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    const fetchNewRequests = async () => {
      // 현재까지 가장 큰 ID보다 큰 것들만 가져오기
      const { data, error } = await supabase
        .from("request")
        .select("id")
        .gt("id", latestIdRef.current)
        .order("id", { ascending: true });

      if (error) {
        console.error("Polling error:", error);
        return;
      }
      if (!data || data.length === 0) return;

      for (const row of data) {
        // 마운트 상태 확인
        if (!isMounted) break;

        const newId = row.id;
        // 알림 디스패치
        dispatch({
          type: "ADD",
          payload: {
            id: String(newId),
            message: `새로운 신청(등록ID:${newId})이 추가되었습니다.`,
          },
        });
        // 최신 ID 업데이트
        latestIdRef.current = newId;
      }
    };

    // 최초 한 번 페치해서 latestId 세팅
    (async () => {
      const { data } = await supabase
        .from("request")
        .select("id")
        .order("id", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        latestIdRef.current = data[0].id;
      }
    })();

    // 5초마다 폴링
    const interval = setInterval(fetchNewRequests, 5_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ state, dispatch }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  return context;
}
