"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import styles from "./index.module.css";
import NavBar from "@/components/navBar/navBar";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((res) => res.json());
interface Product {
  id: number;
  name: string;
  brand: string;
  color: string;
  feature: string;
  other: string;
  img_url: string;
}



export default function Home() {
  // const [showUI, setShowUI] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    fetch("/api/productList", { 
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
     })
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.data);
      });
  }, []);

  // const pathname = usePathname();
  // const { data, error } = useSWR("/api/productList", fetcher, { refreshInterval: 5000 });

  // useEffect(() => {
  //   if (data) {
  //     console.log("Fetched data:", data);
  //   }
  // }, [data, pathname]);

  // if (error) return <div>Failed to load</div>;
  // if (!data) return <div>Loading...</div>;

  // const products = data.data;
  return (
    <>
      <div className={styles.container}>
        {/* <SearchInput showUI={showUI} setShowUI={setShowUI} /> */}

          <ul className={styles.productLists}>
            {products.map((product: Product) => (
              <li key={product.id} className={styles.productItem}>
                <Image
                  src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${product.img_url}`}
                  alt="Product Image"
                  width={100}
                  height={100}
                  className={styles.productImage}
                />
                <div className={styles.item}>名称:{product.name}</div>
                {/* <div>{product.brand}</div>
                <div>{product.color}</div> */}
                <div className={styles.item}>特徴:{product.feature}</div>
                <div className={styles.item}>その他:{product.other}</div>
              </li>
            ))}
          </ul>
      </div>

      <NavBar />
    </>
  );
}
