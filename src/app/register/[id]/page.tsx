"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { useRouter } from "next/navigation";
import dotenv from "dotenv";
import styles from "./index.module.css";

dotenv.config();

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
      const vision = new ChatGoogleGenerativeAI({
        modelName: "gemini-1.5-pro",
        maxOutputTokens: 2048,
        apiKey: '',
      });

      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString("base64");

      const input2 = [
        new HumanMessage({
          content: [
            {
              type: "text",
              text: "画像の特徴を分析し、次の形式で結果を出力してください。 name: color: brand: feature: ",
            },
            {
              type: "image_url",
              image_url: `data:image/png;base64,${base64Image}`,
            },
          ],
        }),
      ];

      const res = await vision.invoke(input2);
      console.log(res);

      const nameMatch = res.text.match(/name:\s*([^\n]+)/);
      const brandMatch = res.text.match(/brand:\s*([^\n]+)/);
      const colorMatch = res.text.match(/color:\s*([^\n]+)/);
      const featureMatch = res.text.match(/feature:\s*([^\n]+)/);

      if (nameRef.current) nameRef.current.value = nameMatch ? nameMatch[1].trim() : "";
      if (brandRef.current) brandRef.current.value = brandMatch ? brandMatch[1].trim() : "";
      if (colorRef.current) colorRef.current.value = colorMatch ? colorMatch[1].trim() : "";
      if (featureRef.current) featureRef.current.value = featureMatch ? featureMatch[1].trim() : "";

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
            <label htmlFor="other">その他</label>
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

