"use client";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./index.module.css";

interface Params {
  id: string;
}

function Page({ params }: { params: Params }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const brandRef = useRef<HTMLInputElement>(null);
  const featureRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  useEffect(() => {
    fetch(`/api/img?id=${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setImgUrl(data.data.publicUrl);
      });
  }, [params.id]);

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
    </>
  );
}

export default Page;
