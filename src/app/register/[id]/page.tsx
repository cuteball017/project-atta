"use client";
import { on } from "events";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

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
    } else {
      alert("登録に失敗しました");
    }
  }



  return (
    <>
      <form onSubmit={onSubmit}>
        {imgUrl && (
          <Image src={imgUrl} width={360} height={360} alt="Product Image" />
        )}
        <div>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" ref={nameRef} />
        </div>
        <div>
            <label htmlFor="brand">Brand</label>
            <input type="text" id="brand" ref={brandRef} />
        </div>
        <div>
            <label htmlFor="color">Color</label>
            <input type="text" id="color" ref={colorRef} />
        </div>
        <div>
            <label htmlFor="feature">Feature</label>
            <input type="text" id="feature" ref={featureRef} />
        </div>
        <div>
            <label htmlFor="other">Other</label>
            <input type="text" id="other" ref={otherRef} />
        </div>
        <button type="submit">Register</button>
      </form>
    </>
  );
}

export default Page;
