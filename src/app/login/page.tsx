"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const body = {
      email: form.get("email"),
      password: form.get("password"),
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // ensure cookies set by server are accepted by the browser
        credentials: "same-origin",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setStatus("error");
        setMessage("認証に失敗しました。");
        return;
      }

      setStatus("idle");
      setMessage("ログインしました。");

      // Login API has set HttpOnly cookies and returned session confirmation.
      // Navigate immediately - no additional verification call needed.
      try {
        router.replace("/");
        router.refresh();
      } catch (e) {
        console.error("router navigation failed, using window.location as last resort", e);
        window.location.assign("/");
      }
    } catch (error) {
      console.error("Login error", error);
      setStatus("error");
      setMessage("ログイン処理でエラーが発生しました。");
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <div className={styles.iconWrapper}>
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className={styles.loginTitle}>ログイン</h1>
          <p className={styles.loginSubtitle}>
            アカウント情報を入力してサインインしてください
          </p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>メールアドレス</label>
            <div className={styles.inputWrapper}>
              <svg
                className={styles.inputIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className={styles.formInput}
                placeholder="example@email.com"
                disabled={status === "loading"}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>パスワード</label>
            <div className={styles.inputWrapper}>
              <svg
                className={styles.inputIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={styles.formInput}
                placeholder="••••••••"
                disabled={status === "loading"}
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <>
                <div className={styles.spinner}></div>
                認証中...
              </>
            ) : (
              "ログイン"
            )}
          </button>
        </form>

        {message && (
          <div
            className={`${styles.messageBox} ${
              status === "error" ? styles.error : styles.success
            }`}
          >
            {status === "error" ? (
              <svg
                className={styles.messageIcon}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className={styles.messageIcon}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <p className={styles.messageText}>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
