"use client";

import { useState } from "react";

import styles from "./index.module.css";
import NavBar from "@/components/navBar/navBar";
import SearchInput from "@/components/searchInput/searchInput";

export default function Home() {
  const [showUI, setShowUI] = useState(false);
  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.heading}>検索</h1>
        <SearchInput showUI={showUI} setShowUI={setShowUI} />

        <div className={styles.category}>
          <h1>カテゴリーを選択</h1>
          <ul>
            <li>財布</li>
            <li>時計</li>
            <li>眼鏡</li>
            <li>携帯電話</li>
            <li>その他</li>
            <li>財布</li>
            <li>時計</li>
            <li>眼鏡</li>
            <li>携帯電話</li>
            <li>その他</li>
            <li>財布</li>
            <li>時計</li>
            <li>眼鏡</li>
            <li>携帯電話</li>
            <li>その他</li>
          </ul>
        </div>
      </div>
      <NavBar />
    </>
  );
}
