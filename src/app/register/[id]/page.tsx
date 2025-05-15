"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { HumanMessage } from "@langchain/core/messages";
import { useRouter } from "next/navigation";
import { gemini } from "@/utils/gemini";
import styles from "./index.module.css";

const { NEXT_PUBLIC_GOOGLE_API_KEY } = process.env;

interface Params {
  id: string;
}

function Page({ params }: { params: Params }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 入力フィールドの参照を作成
  const nameRef = useRef<HTMLInputElement>(null);
  const brandRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const featureRef = useRef<HTMLInputElement>(null);
  const placeRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);

  const router = useRouter();

  useEffect(() => {
    // 画像のURLと分析結果を取得
    const fetchImageData = async () => {
      try {
        const res = await fetch(`/api/img?id=${params.id}`);
        const data = await res.json();

        if (data.data && data.data.publicUrl) {
          setImgUrl(data.data.publicUrl);
          await analyzeImageWithGemini(data.data.publicUrl); // 画像分析後にローディング状態を更新
        } else {
          throw new Error("画像データが無効です");
        }
      } catch (err) {
        setError("画像URLの取得に失敗しました");
        console.error(err);
        setLoading(false);
      }
    };

    fetchImageData();
  }, [params.id]);

  // // name, brand, color を一括で日本語に翻訳
  // const translateMultipleToJapaneseWithGemini = async (data: {
  //   name: string;
  //   brand: string;
  //   color: string;
  // }) => {
  //   try {
  //     const res = await fetch(`/api/translate`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(data),
  //     });

  //     const result = await res.json();
  //     return result; // 例: { name: "名前", brand: "ブランド", color: "色" }
  //   } catch (err) {
  //     console.error("翻訳に失敗しました:", err);
  //     return data; // エラー時は元のデータを返す
  //   }
  // };

  // // Gemini による画像の内容分析と翻訳
  // const analyzeImageWithGemini = async (imageUrl: string) => {
  //   try {
  //     const res = await fetch(`/api/gemini`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ imageUrl }),
  //     });

  //     const data = await res.json(); // 返却例: { name, brand, color, feature }

  //     // ✅ 翻訳処理（まとめて実行）
  //     const translated = await translateMultipleToJapaneseWithGemini({
  //       name: data.name,
  //       brand: data.brand,
  //       color: data.color,
  //     });

  //     console.log("翻訳結果:", translated);

  //     // 入力欄に自動入力（翻訳後の値を優先）
  //     if (nameRef.current) nameRef.current.value = translated.name || data.name;
  //     if (brandRef.current) brandRef.current.value = translated.brand || data.brand;
  //     if (colorRef.current) colorRef.current.value = translated.color || data.color;
  //     if (featureRef.current) featureRef.current.value = data.feature || "";

  //     setLoading(false);
  //   } catch (err) {
  //     setError("画像の分析に失敗しました");
  //     console.error(err);
  //     setLoading(false);
  //   }
  // };

  const analyzeImageWithGemini = async (imageUrl: string) => {
    try {
      const res = await fetch(`/api/gemini`, {
        method: "POST",
        body: JSON.stringify({ imageUrl }),
      });

      const data = await res.json();

      if (nameRef.current) nameRef.current.value = data.name;
      if (brandRef.current) brandRef.current.value = data.brand;
      if (colorRef.current) colorRef.current.value = data.color;
      if (featureRef.current) featureRef.current.value = data.feature;

      setLoading(false);
    } catch (err) {
      setError("Failed to analyze the image");
      console.error(err);
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = nameRef.current?.value;
    const brand = brandRef.current?.value;
    const color = colorRef.current?.value;
    const feature = featureRef.current?.value;
    const place = placeRef.current?.value;
    const category = categoryRef.current?.value;


    const response = await fetch(`/api/register/${params.id}`, {
      method: "POST",
      body: JSON.stringify({ name, brand, color, feature, place, category}),
    });

    if (response.ok) {
      alert("登録しました");
      router.push("/");
    } else {
      alert("登録に失敗しました");
      router.push("/");
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} className={styles.form}>
        {imgUrl && (
          <Image
            src={imgUrl}
            width={240}
            height={240}
            alt="Product Image"
            className={styles.img}
          />
        )}
        <div className={styles.inputContainer}>
          <div className={styles.inputBox}>
            <label htmlFor="name">名称</label>
            <input type="text" id="name" ref={nameRef} />
          </div>
          <div className={styles.inputBox}>
            <label htmlFor="brand">ブランド名</label>
            <input type="text" id="brand" ref={brandRef} />
          </div>
          <div className={styles.inputBox}>
            <label htmlFor="color">色</label>
            <input type="text" id="color" ref={colorRef} />
          </div>
          <div className={styles.inputBox}>
            <label htmlFor="feature">特徴</label>
            <input type="text" id="feature" ref={featureRef} />
          </div>
          <div className={styles.inputBox}>
            <label htmlFor="place">場所</label>
            <input type="text" id="place" ref={placeRef} />
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
      {error && <div>Error: {error}</div>}
      {loading && <div>Loading...</div>}
    </>
  );
}

export default Page;

