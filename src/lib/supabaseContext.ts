import { createContext, useContext } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * ✅ Supabase 클라이언트를 Context로 제공
 * - 글로벌 상태 제거
 * - 각 렌더링마다 메모리 격리
 * - 모든 자식 컴포넌트에서 useSupabaseClient() 사용 가능
 */
export const SupabaseContext = createContext<SupabaseClient | null>(null);

export const useSupabaseClient = () => {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error(
      'useSupabaseClient must be used within NotificationProvider'
    );
  }
  return client;
};
