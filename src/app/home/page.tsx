"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface Product {
  id: number;
  name: string;
  brand: string;
  color: string;
  feature: string;
  other: string;
  img_url: string;
}

function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    fetch("/api/productList")
      .then((res) => res.json())
      .then((data) => {
        console.log(data.data);
        setProducts(data.data);
      });
  }, []);
  return (
    <>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <Image src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${product.img_url}`} alt="Product Image" width={300} height={300} />
            <div>{product.name}</div>
            <div>{product.brand}</div>
            <div>{product.color}</div>
            <div>{product.feature}</div>
            <div>{product.other}</div>
          </li>
        ))}
      </ul>
    </>
  );
}

export default Home;
