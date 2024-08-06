"use client";
import { useState } from "react";
import Image from "next/image";
import styles from "./index.module.css";
import NavBar from "@/components/navBar/navBar";
import SearchInput from "@/components/searchInput/searchInput";

export default function Home() {
  const [showUI, setShowUI] = useState(false);
  return (
    <>
      <div className={styles.container}>
        <SearchInput showUI={showUI} setShowUI={setShowUI} />

        {!showUI && (
          <>
            <div className={styles.register}>
              <p>取得物を登録する</p>
              <Image
                src="/camera-white.svg"
                alt="camera"
                width={45}
                height={45}
              />
            </div>
            <div className={styles.recievedSchedule}>
              <h1 className={styles.heading}>本日のお渡し予定</h1>
              <ul>
                <li>No.10 財布</li>
                <li>No.1 時計</li>
              </ul>
            </div>
            <div className={styles.achievementRate}>
              <h1 className={styles.heading}>今月の取得物</h1>
              <div className={styles.forCenter}>
                <div className={styles.circle}>
                  <p className={styles.rate}>50%</p>
                  <p className={styles.total}>1000件</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <NavBar />
    </>
  );
}
