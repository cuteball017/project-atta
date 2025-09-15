"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import WebcamCapture from "@/components/webCam/webCam";
import styles from "./index.module.css";

/**
 * 텍스트 수기 입력 폼
 * - 기존 디자인 클래스(index.module.css)를 그대로 사용
 * - 이미지 ID 없이 직접 등록하는 POST를 시도
 */
function ManualRegisterForm() {
  const router = useRouter();

  const nameRef = useRef<HTMLInputElement>(null);
  const brandRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const featureRef = useRef<HTMLInputElement>(null);
  const placeRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      name: nameRef.current?.value,
      brand: brandRef.current?.value,
      color: colorRef.current?.value,
      feature: featureRef.current?.value,
      place: placeRef.current?.value,
      category: categoryRef.current?.value,
    };

    let res = await fetch(`/api/register/sample_pic`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("登録しました");
      router.push("/");
    } else {
      alert("登録に失敗しました");
      router.push("/");
    }
  };

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <div className={styles.inputContainer}>
        <div className={styles.inputBox}>
          <label htmlFor="name">名称</label>
          <input id="name" type="text" ref={nameRef} />
        </div>
        <div className={styles.inputBox}>
          <label htmlFor="brand">ブランド名</label>
          <input id="brand" type="text" ref={brandRef} />
        </div>
        <div className={styles.inputBox}>
          <label htmlFor="color">色</label>
          <input id="color" type="text" ref={colorRef} />
        </div>
        <div className={styles.inputBox}>
          <label htmlFor="feature">特徴</label>
          <input id="feature" type="text" ref={featureRef} />
        </div>
        <div className={styles.inputBox}>
          <label htmlFor="place">場所</label>
          <input id="place" type="text" ref={placeRef} />
        </div>
        <div className={styles.inputBox}>
          <label htmlFor="category">カテゴリー</label>
          <select id="category" ref={categoryRef} className={styles.selectBox}>
            <option value="イヤホン">イヤホン</option>
            <option value="スマートフォン">スマートフォン</option>
            <option value="周辺機器">周辺機器</option>
            <option value="財布">財布</option>
            <option value="時計">時計</option>
            <option value="水筒">水筒</option>
            <option value="文具">文具</option>
            <option value="かばん">かばん</option>
            <option value="衣類">衣類</option>
          </select>
        </div>
      </div>

      <button className={styles.button} type="submit">
        Register
      </button>
    </form>
  );
}

function Page() {
  const [mode, setMode] = useState<"choice" | "camera" | "manual">("choice");

  if (mode === "camera") {
    // 사진으로부터 등록: 기존 흐름(WebcamCapture) 유지
    return <WebcamCapture />;
  }

  if (mode === "manual") {
    // 텍스트 입력: 수기 폼 즉시 표시
    return <ManualRegisterForm />;
  }

  // 최초 진입: 두 가지 선택 버튼 표시
  return (
    <div className={styles.choiceContainer}>
      <div className={styles.choiceCard}>
        <h2 className={styles.choiceTitle}>登録方法を選択してください</h2>
        <div className={styles.choiceButtons}>
          <button
            className={styles.button}
            onClick={() => setMode("camera")}
            type="button"
          >
            写真から登録
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => setMode("manual")}
            type="button"
          >
            テキスト入力
          </button>
        </div>
      </div>
    </div>
  );
}

export default Page;






// import WebcamCapture from "@/components/webCam/webCam";

// function Page() {
//     return (
//        <>
//          <WebcamCapture />
//        </>
//     );
// }

// export default Page;