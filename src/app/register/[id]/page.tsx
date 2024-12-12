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

  const nameRef = useRef<HTMLInputElement>(null);
  const brandRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const featureRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchImageData = async () => {
      try {
        const res = await fetch(`/api/img?id=${params.id}`);
        const data = await res.json();

        if (data.data && data.data.publicUrl) {
          setImgUrl(data.data.publicUrl);
          await analyzeImageWithGemini(data.data.publicUrl); // 이미지 분석 후 로딩 상태 변경
        } else {
          throw new Error("Invalid image data");
        }
      } catch (err) {
        setError("Failed to fetch image URL");
        console.error(err);
        setLoading(false);
      }
    };

    fetchImageData();
  }, [params.id]);

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
    const other = otherRef.current?.value;

    const response = await fetch(`/api/register/${params.id}`, {
      method: "POST",
      body: JSON.stringify({ name, brand, color, feature, other }),
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
            <label htmlFor="other">場所</label>
            <input type="text" id="other" ref={otherRef} />
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

