"use client";
import { useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import WebcamCapture from "@/components/webCam/webCam";
import styles from "./index.module.css";

/**
 * 텍스트 수기 입력 폼
 * - 기존 디자인 클래스(index.module.css)를 그대로 사용
 * - 이미지 ID 없이 직접 등록하는 POST를 시도
 */
function ManualRegisterForm({ onBack, onSuccess }: { onBack: () => void; onSuccess?: () => void }) {

  const nameRef = useRef<HTMLInputElement>(null);
  const brandRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const featureRef = useRef<HTMLInputElement>(null);
  const placeRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const remarksRef = useRef<HTMLTextAreaElement>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      name: nameRef.current?.value,
      brand: brandRef.current?.value,
      color: colorRef.current?.value,
      feature: featureRef.current?.value,
      place: placeRef.current?.value,
      category: categoryRef.current?.value,
      remarks: remarksRef.current?.value,
    };

    let res = await fetch(`/api/register/sample_pic`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("登録しました");
      // 클라이언트에서 즉시 다시 등록할 수 있도록 입력값을 초기화하고
      // 부모에게 성공 콜백을 호출해 UI를 유지하도록 한다
      if (nameRef.current) nameRef.current.value = "";
      if (brandRef.current) brandRef.current.value = "";
      if (colorRef.current) colorRef.current.value = "";
      if (featureRef.current) featureRef.current.value = "";
      if (placeRef.current) placeRef.current.value = "";
      if (categoryRef.current) categoryRef.current.value = "";
      if (remarksRef.current) remarksRef.current.value = "";
      if (onSuccess) onSuccess();
    } else {
      alert("登録に失敗しました");
      // 失敗時はフォームのままにして再試行可能にする
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
            <option value="スマートフォン">スマートフォン</option>
            <option value="時計">時計</option>
            <option value="文具">文具</option>
            <option value="衣類">衣類</option>
            <option value="イヤホン">イヤホン</option>
            <option value="日用品・雑貨">日用品・雑貨</option>
            <option value="貴金属類">貴金属類</option>
          </select>
        </div>
        <div className={styles.inputBox}>
          <label htmlFor="remarks">備考 (オプション)</label>
          <textarea
            id="remarks"
            ref={remarksRef}
            placeholder="例）傷あり、バッテリー残量70% など"
            rows={3}
            style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
          />
        </div>
      </div>

      <div className={styles.actionsRow}>
        <button className={styles.button} type="submit">
          Register
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => onBack()}
        >
          戻る
        </button>
      </div>
    </form>
  );
}

function Page() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams?.get("mode") as "choice" | "camera" | "manual") ?? "choice";
  const [mode, setMode] = useState<"choice" | "camera" | "manual">(initialMode);
  const router = useRouter();

  if (mode === "camera") {
    // 사진으로부터 등록: 기존 흐름(WebcamCapture) 유지
    return (
      <div>
        <WebcamCapture />
        <div className={styles.centeredSmall}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => setMode('choice')}
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  if (mode === "manual") {
    // 텍스트 입력: 수기 폼 즉시 표시
    return (
      <ManualRegisterForm
        onBack={() => setMode("choice")}
        onSuccess={() => {
          // 성공 후에도 계속 텍スト登録できるよう、여기서는 mode를 유지するだけ
          setMode("manual");
        }}
      />
    );
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
        <div className={styles.centeredSmall}>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => router.push('/')}
          >
            ホームへ戻る
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