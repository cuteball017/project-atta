"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./index.module.css";
import NavBar from "@/components/navBar/navBar";

export const fetchCache = "force-no-store";

interface Product {
  id: number;
  name: string;
  brand: string;
  color: string;
  feature: string;
  place: string;
  img_url: string;
  created_at: string;
  category: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); // 검색어
  const [selectedCategory, setSelectedCategory] = useState(""); // 카테고리 필터
  const [startDate, setStartDate] = useState(""); // 시작 날짜
  const [endDate, setEndDate] = useState(""); // 종료 날짜
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // 모달에 표시할 상품
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 데이터 가져오기 (최신 등록순으로 정렬 후, 최대 30개만 표시)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/productList", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error("データの取得に失敗しました");
        }

        const result = await response.json();

        // 🔹 최신 등록순으로 정렬 후, 최대 30개만 저장
        const sortedProducts = result.data
          .sort((a: Product, b: Product) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 30);

        setProducts(result.data);
        setFilteredProducts(sortedProducts);
      } catch (error) {
        setError(error instanceof Error ? error.message : "エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔹 検索機能
  useEffect(() => {
    let filtered = products;

    // 🔹 基本検索
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        [product.name, product.brand, product.color, product.feature, product.place, product.category]
          .some((value) => typeof value === "string" && value.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // 🔹 カテゴリー検索
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }
    
    // 🔹 日付検索
    if (startDate && endDate && startDate === endDate) {
      const start = new Date(`${startDate}T00:00:00Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
      filtered = filtered.filter((product) => {
        const reqDate = new Date(product.created_at);
        return (start ? reqDate >= start : true) && (end ? reqDate <= end : true);
      });
    }else{
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      filtered = filtered.filter((product) => {
        const reqDate = new Date(product.created_at);
        return (start ? reqDate >= start : true) && (end ? reqDate <= end : true);
      });
    }

    // // 🔹 날짜 필터 적용
    // if (startDate == endDate) {
    //   const start = new Date(`${startDate}T00:00:00Z`);
    //   const end = new Date(`${endDate}T23:59:59.999Z`);
    //   filtered = filtered.filter((product) => {
    //     const productDate = new Date(product.created_at);
    //     if (start && end) {
    //       return productDate >= start && productDate <= end;
    //     }
    //     return true;
    //   }); 
    // }else{
    //   const start = startDate ? new Date(startDate) : null;
    //   const end = endDate ? new Date(endDate) : null;

    //   filtered = filtered.filter((product) => {
    //     const productDate = new Date(product.created_at);
    //     if (start && end) {
    //       return productDate >= start && productDate <= end;
    //     } else if (start) {
    //       return productDate >= start;
    //     } else if (end) {
    //       return productDate <= end;
    //     }
    //     return true;
    //   }); 
    // }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, startDate, endDate, products]);

  // 🔹 ESC 키로 모달 닫기 기능 추가
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedProduct(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <div className={styles.container}>
        {/* 🔹 검색 필터 UI */}
        <div className={styles.filterContainer}>
          {/* 🔍 검색 바 */}
          <label htmlFor="searchQuery" className={styles.filterLabel}>検索</label>
          <input
            type="text"
            id="searchQuery"
            name="searchQuery"
            placeholder="商品名やブランドを入力"
            title="検索欄に文字を入力してください"
            className={styles.searchBar}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* 🔹 날짜 검색 필드 */}
          <div className={styles.dateFilter}>
            <label htmlFor="startDate">開始日</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              className={styles.dateInput}
              title="開始日を選択してください"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <span className={styles.dateSeparator}> ~ </span>

            <label htmlFor="endDate">終了日</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              className={styles.dateInput}
              title="終了日を選択してください"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* 🔹 카테고리 선택 */}
          <label htmlFor="category" className={styles.filterLabel}>カテゴリー</label>
          <select
            id="category"
            name="category"
            className={styles.selectBox}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">すべて</option>
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

        {/* 로딩 표시 */}
        {loading && <p className={styles.loading}>Loading...</p>}

        {/* 에러 메시지 표시 */}
        {error && <p className={styles.error}>⚠️ {error}</p>}

        {/* 🔹 상품 목록 */}
        {!loading && !error && (
          <ul className={styles.productLists}>
            {filteredProducts.map((product) => (
              <li
                key={product.id}
                className={styles.productItem}
                onClick={() => setSelectedProduct(product)}
              >
                <Image
                  src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${product.img_url}`}
                  alt="Product Image"
                  width={100}
                  height={100}
                  className={styles.productImage}
                />
                <div className={styles.item}>商品ID:{product.id}</div>
                <div className={styles.item}>名称: {product.name}</div>
                <div className={styles.item}>ブランド: {product.brand}</div>
                <div className={styles.item}>場所: {product.place}</div>
                <div className={styles.item}>カテゴリー: {product.category}</div>
                <div className={styles.item}>登録日: {new Date(product.created_at).toLocaleDateString()}</div>
              </li>
            ))}
          </ul>
        )}

        {/* 🔹 모달 (선택한 상품 표시) */}
        {selectedProduct && (
          <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <button className={styles.closeButton} onClick={() => setSelectedProduct(null)}>×</button>
              <Image
                src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
                alt="Product Image"
                width={250}
                height={250}
                className={styles.modalImage}
              />
              <div className={styles.modalContent}>
                <h2>商品ID：{selectedProduct.id}</h2>
                <h2>名称：{selectedProduct.name}</h2>
                <p>ブランド: {selectedProduct.brand}</p>
                <p>色: {selectedProduct.color}</p>
                <p>特徴: {selectedProduct.feature}</p>
                <p>場所: {selectedProduct.place}</p>
                <p>カテゴリー: {selectedProduct.category}</p>
                <p>登録日: {new Date(selectedProduct.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <NavBar />
    </>
  );
}






// "use client";
// import { useState, useEffect } from "react";
// import Image from "next/image";
// import styles from "./index.module.css";
// import NavBar from "@/components/navBar/navBar";

// export const fetchCache = "force-no-store";

// interface Product {
//   id: number;
//   name: string;
//   brand: string;
//   color: string;
//   feature: string;
//   place: string;
//   img_url: string;
//   created_at: string;
//   category: string;
// }

// export default function Home() {
//   const [products, setProducts] = useState<Product[]>([]);
//   const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
//   const [searchQuery, setSearchQuery] = useState(""); // 검색어
//   const [selectedCategory, setSelectedCategory] = useState(""); // 카테고리 필터
//   const [startDate, setStartDate] = useState(""); // 시작 날짜
//   const [endDate, setEndDate] = useState(""); // 종료 날짜
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // 🔹 데이터 가져오기
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const response = await fetch("/api/productList", {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             "Cache-Control": "no-cache",
//           },
//         });

//         if (!response.ok) {
//           throw new Error("データの取得に失敗しました");
//         }

//         const result = await response.json();
//         setProducts(result.data);
//         setFilteredProducts(result.data);
//       } catch (error) {
//         setError(error instanceof Error ? error.message : "エラーが発生しました");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // 🔹 검색 및 필터링 기능 (카테고리, 날짜 포함)
//   useEffect(() => {
//     let filtered = products;

//     // 🔹 검색어 필터 적용
//     if (searchQuery) {
//       filtered = filtered.filter((product) =>
//         [product.name, product.brand, product.color, product.feature, product.place, product.category]
//           .some((value) => typeof value === "string" && value.toLowerCase().includes(searchQuery.toLowerCase()))
//       );
//     }

//     // 🔹 카테고리 필터 적용
//     if (selectedCategory) {
//       filtered = filtered.filter((product) => product.category === selectedCategory);
//     }

//     // 🔹 날짜 필터 적용
//     if (startDate || endDate) {
//       const start = startDate ? new Date(startDate) : null;
//       const end = endDate ? new Date(endDate) : null;

//       filtered = filtered.filter((product) => {
//         const productDate = new Date(product.created_at);
//         if (start && end) {
//           return productDate >= start && productDate <= end;
//         } else if (start) {
//           return productDate >= start;
//         } else if (end) {
//           return productDate <= end;
//         }
//         return true;
//       });
//     }

//     setFilteredProducts(filtered);
//   }, [searchQuery, selectedCategory, startDate, endDate, products]);

//   return (
//     <>
//       <div className={styles.container}>
//         {/* 🔹 검색 필터 UI */}
//         <div className={styles.filterContainer}>

//           {/* 🔍 검색 바 */}
//           <label htmlFor="searchQuery" className={styles.filterLabel}>検索:</label>
//           <input
//             type="text"
//             id="searchQuery"
//             name="searchQuery"
//             placeholder="商品名やブランドを入力"
//             title="検索欄に文字を入力してください"
//             className={styles.searchBar}
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />

//           {/* 🔹 날짜 검색 필드 */}
//           <div className={styles.dateFilter}>
//             <label htmlFor="startDate">開始日:</label>
//             <input
//               type="date"
//               id="startDate"
//               name="startDate"
//               className={styles.dateInput}
//               title="開始日を選択してください"
//               placeholder="YYYY-MM-DD"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//             />

//             <span className={styles.dateSeparator}> ~</span>

//             <label htmlFor="endDate">終了日:</label>
//             <input
//               type="date"
//               id="endDate"
//               name="endDate"
//               className={styles.dateInput}
//               title="終了日を選択してください"
//               placeholder="YYYY-MM-DD"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//             />
//           </div>
//           {/* 🔹 카테고리 선택 */}
//           <label htmlFor="category" className={styles.filterLabel}>カテゴリー:</label>
//           <select
//             id="category"
//             name="category"
//             className={styles.selectBox}
//             value={selectedCategory}
//             onChange={(e) => setSelectedCategory(e.target.value)}
//           >
//             <option value="">すべて</option>
//             <option value="イヤホン">イヤホン</option>
//             <option value="スマートフォン">スマートフォン</option>
//             <option value="周辺機器">周辺機器</option>
//             <option value="財布">財布</option>
//             <option value="時計">時計</option>
//             <option value="水筒">水筒</option>
//             <option value="文具">文具</option>
//             <option value="かばん">かばん</option>
//             <option value="衣類">衣類</option>
//           </select>
//         </div>

//         {/* 로딩 표시 */}
//         {loading && <p className={styles.loading}>Loading...</p>}

//         {/* 에러 메시지 표시 */}
//         {error && <p className={styles.error}>⚠️ {error}</p>}

//         {/* 상품 목록 */}
//         {!loading && !error && (
//           <ul className={styles.productLists}>
//             {filteredProducts.map((product: Product) => (
//               <li key={product.id} className={styles.productItem}>
//                 <Image
//                   src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${product.img_url}`}
//                   alt="Product Image"
//                   width={100}
//                   height={100}
//                   className={styles.productImage}
//                 />
//                 <div className={styles.item}>名称: {product.name}</div>
//                 <div className={styles.item}>ブランド: {product.brand}</div>
//                 <div className={styles.item}>特徴: {product.feature}</div>
//                 <div className={styles.item}>色: {product.color}</div>
//                 <div className={styles.item}>場所: {product.place}</div>
//                 <div className={styles.item}>カテゴリー： {product.category}</div>
//                 <div className={styles.item}>登録日: {new Date(product.created_at).toLocaleDateString()}</div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//       <NavBar />
//     </>
//   );
// }





// "use client";
// import { useState, useEffect } from "react";
// import Image from "next/image";
// import { usePathname } from "next/navigation";
// import useSWR from "swr";
// import styles from "./index.module.css";
// import NavBar from "@/components/navBar/navBar";
// export const fetchCache = 'force-no-store'

// const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((res) => res.json());
// interface Product {
//   id: number;
//   name: string;
//   brand: string;
//   color: string;
//   feature: string;
//   other: string;
//   img_url: string;
// }



// export default function Home() {
//   // const [showUI, setShowUI] = useState(false);
//   const [products, setProducts] = useState<Product[]>([]);
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await fetch("/api/productList", { 
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             "Cache-Control": "no-cache",
//           },
//         });
//         const result = await response.json();
//         setProducts(result.data);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     };

//     fetchData();
//   }, []);

//   // const pathname = usePathname();
//   // const { data, error } = useSWR("/api/productList", fetcher, { refreshInterval: 5000 });

//   // useEffect(() => {
//   //   if (data) {
//   //     console.log("Fetched data:", data);
//   //   }
//   // }, [data, pathname]);

//   // if (error) return <div>Failed to load</div>;
//   // if (!data) return <div>Loading...</div>;

//   // const products = data.data;
//   return (
//     <>
//       <div className={styles.container}>
//         {/* <SearchInput showUI={showUI} setShowUI={setShowUI} /> */}

//           <ul className={styles.productLists}>
//             {products.map((product: Product) => (
//               <li key={product.id} className={styles.productItem}>
//                 <Image
//                   src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${product.img_url}`}
//                   alt="Product Image"
//                   width={100}
//                   height={100}
//                   className={styles.productImage}
//                 />
//                 <div className={styles.item}>名称:{product.name}</div>
//                 {/* <div>{product.brand}</div>
//                 <div>{product.color}</div> */}
//                 <div className={styles.item}>特徴:{product.feature}</div>
//                 <div className={styles.item}>その他:{product.other}</div>
//               </li>
//             ))}
//           </ul>
//       </div>

//       <NavBar />
//     </>
//   );
// }
