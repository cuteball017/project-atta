// components/ToastContainer.tsx
"use client";

import { useNotifications } from "@/components/notificationContext/notificationContext";  // 절대경로 사용
import styles from "./toastContainer.module.css";

export default function ToastContainer(): JSX.Element {
  const { state, dispatch } = useNotifications();

  return (
    <div className={styles.container}>
      {state.map((notification) => (
        <div key={notification.id} className={styles.toast}>
          <span>{notification.message}</span>
          <button
            type="button"
            className={styles.close}
            onClick={() =>
              dispatch({
                type: "REMOVE",
                payload: { id: notification.id },
              })
            }
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}


