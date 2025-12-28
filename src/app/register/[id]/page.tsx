"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./index.module.css";

interface Params {
  id: string;
}

type Analysis = {
  name?: string;
  brand?: string;
  color?: string;
  feature?: string;
};

function Page({ params }: { params: Params }) {
  // 画像URL
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  // 画像URL取得のエラー（上部バナーで表示）
  const [imageError, setImageError] = useState<string | null>(null);
  // Gemini の特徴分析エラー（画像の下で表示）
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  // 分析中フラグ：true の間は「画像 + ローディング」のみを表示
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);
  // 分析結果の保持（フォーム初期値と「特徴の分析」要約に使用）
  const [analysis, setAnalysis] = useState<Analysis>({});

  // 入力フィールド参照
  const nameRef = useRef<HTMLInputElement>(null);
  const brandRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const featureRef = useRef<HTMLInputElement>(null);
  const placeRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);  const remarksRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  /**
   * 画像URL取得 → 取得できたら Gemini の分析を実行
   */
  const fetchImageData = useCallback(async () => {
    setImageError(null);
    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      const res = await fetch(`/api/img?id=${params.id}`);
      if (!res.ok) throw new Error("画像URL API 応答エラー");

      const data = await res.json();
      const url = data?.data?.publicUrl;
      if (!url) throw new Error("画像データが無効です");

      setImgUrl(url);
      // URL が取れたら分析へ
      await analyzeImageWithGemini(url);
    } catch (e) {
      console.error(e);
      setImageError("画像URLの取得に失敗しました。時間をおいて再試行してください。");
      // 画像が取れないと分析できないため、分析中フラグは下ろす
      setIsAnalyzing(false);
    }
  }, [params.id]);

  /**
   * Gemini による特徴分析
   * 成功: analysis をセットし、フォーム初期値にも反映
   * 失敗: 画像下にエラー表示、フォームは空で表示（手入力可）
   */
  const analyzeImageWithGemini = useCallback(async (imageUrl: string) => {
    setAnalysisError(null);
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/gemini`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) throw new Error("Gemini API 応答エラー");

      const data: Analysis = await res.json();
      setAnalysis(data ?? {});

      // 取得値をフォームへ事前入力
      if (nameRef.current) nameRef.current.value = data?.name ?? "";
      if (brandRef.current) brandRef.current.value = data?.brand ?? "";
      if (colorRef.current) colorRef.current.value = data?.color ?? "";
      if (featureRef.current) featureRef.current.value = data?.feature ?? "";
    } catch (e) {
      console.error(e);
      setAnalysisError("特徴抽出に失敗しました。手入力するか、再試行してください。");
      setAnalysis({});
      // フォームは空で表示させる（ユーザーの手入力を許可）
      if (nameRef.current) nameRef.current.value = "";
      if (brandRef.current) brandRef.current.value = "";
      if (colorRef.current) colorRef.current.value = "";
      if (featureRef.current) featureRef.current.value = "";
    } finally {
      // 成否に関わらずローディングは終了
      setIsAnalyzing(false);
    }
  }, []);

  // 初期マウント時に画像URL取得を走らせる
  useEffect(() => {
    fetchImageData();
  }, [fetchImageData]);

  /**
   * 登録処理
   */
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = nameRef.current?.value;
    const brand = brandRef.current?.value;
    const color = colorRef.current?.value;
    const feature = featureRef.current?.value;
    const place = placeRef.current?.value;
    const category = categoryRef.current?.value;
    const remarks = remarksRef.current?.value;

    const response = await fetch(`/api/register/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, brand, color, feature, place, category, remarks }),
    });

    if (response.ok) {
      alert("登録しました。");
      // 登録完了後はカメラモードで即再登録できるよう戻す
      router.push(`/register?mode=camera`);
    } else {
      alert("登録に失敗しました。");
      // エラー時は画面に留まり再試行・編集できるようする
    }
  };

  /**
   * 再試行ボタン（画像URLの再取得 → 分析まで）
   */
  const handleRetryAll = () => {
    fetchImageData();
  };

  /**
   * 分析のみ再試行（画像URLは既存を利用）
   */
  const handleRetryAnalyze = () => {
    if (imgUrl) analyzeImageWithGemini(imgUrl);
  };

  return (
    <>
      {/* 画像URL取得エラー（上部バナー） */}
      {imageError && (
        <div className={styles.errorBanner} role="alert" aria-live="assertive">
          <span>{imageError}</span>
          <button
            type="button"
            className={styles.retryButton}
            onClick={handleRetryAll}
          >
            再試行
          </button>
        </div>
      )}

      {/* 분석중은 「画像 + ローディング」のみを表示 */}
      {isAnalyzing ? (
        <div className={styles.loadingWrap}>
          {imgUrl && (
            <div className={styles.imgWrapper}>
              <Image
                src={imgUrl}
                width={240}
                height={240}
                alt="解析対象の画像"
                className={styles.img}
              />
            </div>
          )}
          <div className={styles.status} role="status" aria-live="polite">
            <span className={styles.spinner} aria-hidden="true" />
            <span>画像を解析中です…</span>
          </div>
        </div>
      ) : null}

      {/* 画像URL取得エラーやフォームは常に表示（分析中でも） */}
      <form onSubmit={onSubmit} className={styles.form}>
        {/* 分析完了後に画像を表示 */}
        {!isAnalyzing && imgUrl && (
          <div className={styles.imgWrapper}>
            <Image
              src={imgUrl}
              width={240}
              height={240}
              alt="解析対象の画像"
              className={styles.img}
            />
          </div>
        )}

        {/* 特徴分析エラー（画像の直下で明示） */}
        {analysisError && (
          <div className={styles.inlineError} role="alert" aria-live="assertive">
            <div>{analysisError}</div>
            <button
              type="button"
              className={styles.retryButtonDark}
              onClick={handleRetryAnalyze}
            >
              特徴分析を再試行
            </button>
          </div>
        )}

        {/* 成功時は要約を表示（分析完了後のみ） */}
        {!isAnalyzing &&
          !analysisError &&
          (analysis?.feature ||
            analysis?.name ||
            analysis?.brand ||
            analysis?.color) && (
            <div className={styles.analysisBox}>
              <h3 className={styles.analysisTitle}>特徴の分析</h3>
              <ul className={styles.analysisList}>
                {analysis?.name && (
                  <li>
                    <strong>名称:</strong> {analysis.name}
                  </li>
                )}
                {analysis?.brand && (
                  <li>
                    <strong>ブランド:</strong> {analysis.brand}
                  </li>
                )}
                {analysis?.color && (
                  <li>
                    <strong>色:</strong> {analysis.color}
                  </li>
                )}
                {analysis?.feature && (
                  <li>
                    <strong>特徴:</strong> {analysis.feature}
                  </li>
                )}
              </ul>
            </div>
          )}

        {/* 入力フォーム（分析中でも表示） */}
        <div className={styles.inputContainer}>
          <div className={styles.inputBox}>
            <label htmlFor="name">名称</label>
            <input
              type="text"
              id="name"
              ref={nameRef}
              defaultValue={analysis?.name ?? ""}
              placeholder="例）ワイヤレスイヤホン"
              aria-label="名称"
            />
          </div>
          <div className={styles.inputBox}>
            <label htmlFor="brand">ブランド名</label>
            <input
              type="text"
              id="brand"
              ref={brandRef}
              defaultValue={analysis?.brand ?? ""}
              placeholder="例）Sony"
              aria-label="ブランド名"
            />
          </div>
          <div className={styles.inputBox}>
            <label htmlFor="color">色</label>
            <input
              type="text"
              id="color"
              ref={colorRef}
              defaultValue={analysis?.color ?? ""}
              placeholder="例）ブラック"
              aria-label="色"
            />
          </div>
          <div className={styles.inputBox}>
            <label htmlFor="feature">特徴</label>
            <input
              type="text"
              id="feature"
              ref={featureRef}
              defaultValue={analysis?.feature ?? ""}
              placeholder="例）ノイズキャンセリング、ケース付属 など"
              aria-label="特徴"
            />
          </div>
          <div className={styles.inputBox}>
            <label htmlFor="place">場所</label>
            <input
              type="text"
              id="place"
              ref={placeRef}
              placeholder="例）H棟1F エントランス"
              aria-label="場所"
            />
          </div>
          <div className={styles.inputBox}>
            <label htmlFor="category">カテゴリー</label>
            <select
              id="category"
              ref={categoryRef}
              className={styles.selectBox}
              defaultValue="イヤホン"
              aria-label="カテゴリー"
            >
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
            <label htmlFor="remarks">備考</label>
            <textarea
              id="remarks"
              ref={remarksRef}
              placeholder="例）傷あり、バッテリー残量70% など"
              aria-label="備考"
              rows={3}
              style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
            />
          </div>
        </div>

        {/* 登録ボタンは分析完了後にのみ表示 */}
        {!isAnalyzing && (
          <button className={styles.button} type="submit">
            登録する
          </button>
        )}
      </form>
    </>
  );
}

export default Page;









// "use client";
// import { useEffect, useState, useRef } from "react";
// import Image from "next/image";
// import { HumanMessage } from "@langchain/core/messages";
// import { useRouter } from "next/navigation";
// import { gemini } from "@/utils/gemini";
// import styles from "./index.module.css";

// const { NEXT_PUBLIC_GOOGLE_API_KEY } = process.env;

// interface Params {
//   id: string;
// }

// function Page({ params }: { params: Params }) {
//   const [imgUrl, setImgUrl] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // 入力フィールドの参照を作成
//   const nameRef = useRef<HTMLInputElement>(null);
//   const brandRef = useRef<HTMLInputElement>(null);
//   const colorRef = useRef<HTMLInputElement>(null);
//   const featureRef = useRef<HTMLInputElement>(null);
//   const placeRef = useRef<HTMLInputElement>(null);
//   const categoryRef = useRef<HTMLSelectElement>(null);

//   const router = useRouter();

//   useEffect(() => {
//     // 画像のURLと分析結果を取得
//     const fetchImageData = async () => {
//       try {
//         const res = await fetch(`/api/img?id=${params.id}`);
//         const data = await res.json();

//         if (data.data && data.data.publicUrl) {
//           setImgUrl(data.data.publicUrl);
//           await analyzeImageWithGemini(data.data.publicUrl); // 画像分析後にローディング状態を更新
//         } else {
//           throw new Error("画像データが無効です");
//         }
//       } catch (err) {
//         setError("画像URLの取得に失敗しました");
//         console.error(err);
//         setLoading(false);
//       }
//     };

//     fetchImageData();
//   }, [params.id]);

//   // // name, brand, color を一括で日本語に翻訳
//   // const translateMultipleToJapaneseWithGemini = async (data: {
//   //   name: string;
//   //   brand: string;
//   //   color: string;
//   // }) => {
//   //   try {
//   //     const res = await fetch(`/api/translate`, {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify(data),
//   //     });

//   //     const result = await res.json();
//   //     return result; // 例: { name: "名前", brand: "ブランド", color: "色" }
//   //   } catch (err) {
//   //     console.error("翻訳に失敗しました:", err);
//   //     return data; // エラー時は元のデータを返す
//   //   }
//   // };

//   // // Gemini による画像の内容分析と翻訳
//   // const analyzeImageWithGemini = async (imageUrl: string) => {
//   //   try {
//   //     const res = await fetch(`/api/gemini`, {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify({ imageUrl }),
//   //     });

//   //     const data = await res.json(); // 返却例: { name, brand, color, feature }

//   //     // ✅ 翻訳処理（まとめて実行）
//   //     const translated = await translateMultipleToJapaneseWithGemini({
//   //       name: data.name,
//   //       brand: data.brand,
//   //       color: data.color,
//   //     });

//   //     console.log("翻訳結果:", translated);

//   //     // 入力欄に自動入力（翻訳後の値を優先）
//   //     if (nameRef.current) nameRef.current.value = translated.name || data.name;
//   //     if (brandRef.current) brandRef.current.value = translated.brand || data.brand;
//   //     if (colorRef.current) colorRef.current.value = translated.color || data.color;
//   //     if (featureRef.current) featureRef.current.value = data.feature || "";

//   //     setLoading(false);
//   //   } catch (err) {
//   //     setError("画像の分析に失敗しました");
//   //     console.error(err);
//   //     setLoading(false);
//   //   }
//   // };

//   const analyzeImageWithGemini = async (imageUrl: string) => {
//     try {
//       const res = await fetch(`/api/gemini`, {
//         method: "POST",
//         body: JSON.stringify({ imageUrl }),
//       });

//       const data = await res.json();

//       if (nameRef.current) nameRef.current.value = data.name;
//       if (brandRef.current) brandRef.current.value = data.brand;
//       if (colorRef.current) colorRef.current.value = data.color;
//       if (featureRef.current) featureRef.current.value = data.feature;

//       setLoading(false);
//     } catch (err) {
//       setError("Failed to analyze the image");
//       console.error(err);
//       setLoading(false);
//     }
//   };

//   const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     const name = nameRef.current?.value;
//     const brand = brandRef.current?.value;
//     const color = colorRef.current?.value;
//     const feature = featureRef.current?.value;
//     const place = placeRef.current?.value;
//     const category = categoryRef.current?.value;


//     const response = await fetch(`/api/register/${params.id}`, {
//       method: "POST",
//       body: JSON.stringify({ name, brand, color, feature, place, category}),
//     });

//     if (response.ok) {
//       alert("登録しました");
//       router.push("/");
//     } else {
//       alert("登録に失敗しました");
//       router.push("/");
//     }
//   };

//   return (
//     <>
//       <form onSubmit={onSubmit} className={styles.form}>
//         {imgUrl && (
//           <Image
//             src={imgUrl}
//             width={240}
//             height={240}
//             alt="Product Image"
//             className={styles.img}
//           />
//         )}
//         <div className={styles.inputContainer}>
//           <div className={styles.inputBox}>
//             <label htmlFor="name">名称</label>
//             <input type="text" id="name" ref={nameRef} />
//           </div>
//           <div className={styles.inputBox}>
//             <label htmlFor="brand">ブランド名</label>
//             <input type="text" id="brand" ref={brandRef} />
//           </div>
//           <div className={styles.inputBox}>
//             <label htmlFor="color">色</label>
//             <input type="text" id="color" ref={colorRef} />
//           </div>
//           <div className={styles.inputBox}>
//             <label htmlFor="feature">特徴</label>
//             <input type="text" id="feature" ref={featureRef} />
//           </div>
//           <div className={styles.inputBox}>
//             <label htmlFor="place">場所</label>
//             <input type="text" id="place" ref={placeRef} />
//           </div>
//           <div className={styles.inputBox}>
//           <label htmlFor="category">カテゴリー</label>
//             <select id="category" ref={categoryRef} className={styles.selectBox}>
//               <option value="イヤホン">イヤホン</option>
//               <option value="スマートフォン">スマートフォン</option>
//               <option value="周辺機器">周辺機器</option>
//               <option value="財布">財布</option>
//               <option value="時計">時計</option>
//               <option value="水筒">水筒</option>
//               <option value="文具">文具</option>
//               <option value="かばん">かばん</option>
//               <option value="衣類">衣類</option>
//             </select>
//           </div>
//         </div>
//         <button className={styles.button} type="submit">
//           Register
//         </button>
//       </form>
//       {error && <div>Error: {error}</div>}
//       {loading && <div>Loading...</div>}
//     </>
//   );
// }

// export default Page;

