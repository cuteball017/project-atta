"use client";
import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 360,
  height: 360,
  facingMode: "environment",
};

const WebCamCapture: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [picId, setPicId] = useState<string | null>(null);
  const router = useRouter();

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setUrl(imageSrc);
    }
  }, [webcamRef]);

  const register = async () => {

    if (url) {
      const blob = atob(url.replace(/^.*,/, ""));
      let buffer = new Uint8Array(blob.length);
      for (let i = 0; i < blob.length; i++) {
        buffer[i] = blob.charCodeAt(i);
      }
      let data = new FormData();
      data.append(
        "file",
        new File([buffer.buffer], "image.jpg", { type: "image/jpeg" })
      );
      const response = await fetch("/api/img/upload", {
        method: "POST",
        body: data,
      });
      if (response.ok) {
        alert("登録しました");
        const { data } = await response.json();
        const fileNameWithoutExtension = data.path.replace(/\.jpg$/, ""); // .jpgを除去
        setPicId(fileNameWithoutExtension);
        router.push(`/register/${fileNameWithoutExtension}`);

      } else {
        alert("登録に失敗しました");
      }
    }
  };

  return (
    <>
      {!url && (
        <>
          <div>
            <Webcam
              audio={false}
              width={360}
              height={360}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
            />
          </div>
          <button onClick={capture}>撮影!</button>
        </>
      )}

      {url && (
        <>
          <div>撮影した写真</div>
          <div>
            <Image src={url} alt="Screenshot" width={360} height={360} />
          </div>
          <div>
            <button
              onClick={() => {
                setUrl(null);
              }}
            >
              撮り直す
            </button>
            <button
              onClick={() => {
                register();
              }}
            >
              登録
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default WebCamCapture;
