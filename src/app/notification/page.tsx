"use client";

import { useState } from "react";

import styles from "./index.module.css";
import NavBar from "@/components/navBar/navBar";


export default function Home() {
  const [showUI, setShowUI] = useState(false);
  return (
    <>
    <div className={styles.container}>
      <h1 className={styles.notificationTitle}>通知</h1>
      <h2 className={styles.subTitle}>本日の通知</h2>
      
      <div className={styles.notificationItem}>
        <p>〇〇さんとマッチングしました。</p>
        <p>・1/1　No.1　時計</p>
        <p>本日受け取り予定</p>
        <p className={styles.notificationDate}>2024/1/2 10:10</p>
      </div>

      <div className={styles.notificationItem}>
        <p>〇〇さんとマッチングしました。</p>
        <p>・1/1　No.10　財布</p>
        <p>本日受け取り予定</p>
        <p className={styles.notificationDate}>2024/1/2 10:01</p>
      </div>

      <div className={styles.notificationItem}>
        <p>〇〇さんとマッチングしました。</p>
        <p>・1/1　No.2　時計</p>
        <p>1/4 受け取り予定</p>
        <p className={styles.notificationDate}>2024/1/2 10:00</p>
      </div>

      <p className={styles.footerText}>過去の通知を見る</p>
    </div>
      <NavBar />
    </>
  );
}
