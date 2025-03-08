"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./index.module.css";
import NavBar from "@/components/navBar/navBar";

/** 申請データの型 */
interface RequestData {
  id: number;
  applicant: string;
  name: string;
  place: string;
  feature: string;
  lost_day: string;
  created_at: string;
  img_url: string;
  product_id: string;
  return_completed: string; 
}

/** 商品データの型 */
interface ProductData {
  id: number;
  name: string;
  place: string;
  feature: string;
  img_url: string;
}

export default function NotificationPage() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RequestData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);

  // 検索・フィルタ用
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // モーダル管理
  const [showProductModal, setShowProductModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // 新規申請用
  const [productId, setProductId] = useState("");
  const [newRequest, setNewRequest] = useState({
    applicant: "",
    lost_day: "",
    return_completed: "",
  });

  // 選択された request / product
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);

  // ローディング / エラー
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 返却処理用 state
  const [showReturnConfirmation, setShowReturnConfirmation] = useState(false);
  const [userChoice, setUserChoice] = useState<"" | "はい" | "いいえ">("");
  const [isReturnCompleted, setIsReturnCompleted] = useState(false);

  // -------------------------------
  // 初回マウント: リクエスト一覧を取得
  // -------------------------------
  useEffect(() => {
    fetchRequests();
  }, []);

  // -------------------------------
  // 検索・日付フィルタ適用
  // -------------------------------
  useEffect(() => {
    handleSearch();
  }, [searchQuery, startDate, endDate]);

  // リクエスト一覧の取得
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/requestList");
      if (!response.ok) throw new Error("データ取得失敗");
      const data = await response.json();

      // 最新30件
      const sortedData = data.data
        .sort((a: RequestData, b: RequestData) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 30);

      setRequests(sortedData);
      setFilteredRequests(sortedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // 検索・日付フィルタ
  const handleSearch = () => {
    let filtered = requests;
    if (searchQuery) {
      filtered = filtered.filter((req) =>
        [req.applicant, req.name, req.place, req.feature, req.lost_day].some(
          (value) => value.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    function toUtcRangeFromJst(dateString: string) {
      const start = new Date(`${dateString}T00:00:00.000+09:00`); 
      const startUtc = new Date(start.toISOString());
      const endPart = new Date(`${dateString}T23:59:59.999+09:00`);
      const endUtc = new Date(endPart.toISOString());
    
      return { startUtc, endUtc };
    }
    
    if (startDate && endDate) {
      if (startDate === endDate) {
        const { startUtc, endUtc } = toUtcRangeFromJst(startDate);
        filtered = filtered.filter((product) => {
          const utcDate = new Date(product.created_at); 
          return utcDate >= startUtc && utcDate <= endUtc;
        });
      } else {
        let startUtc = null;
        let endUtc   = null;
    
        if (startDate) {
          startUtc = toUtcRangeFromJst(startDate).startUtc;
        }
        if (endDate) {
          endUtc   = toUtcRangeFromJst(endDate).endUtc;
        }
    
        filtered = filtered.filter((product) => {
          const utcDate = new Date(product.created_at);
          const afterStart = !startUtc || utcDate >= startUtc;
          const beforeEnd  = !endUtc   || utcDate <= endUtc;
          return afterStart && beforeEnd;
        });
      }
    }
    
    
    // if (startDate && endDate && startDate === endDate) {
    //   const start = new Date(`${startDate}T00:00:00Z`);
    //   const end = new Date(`${endDate}T23:59:59.999Z`);
    //   filtered = filtered.filter((req) => {
    //     const reqDate = new Date(req.created_at);
    //     return (start ? reqDate >= start : true) && (end ? reqDate <= end : true);
    //   });
    // }else{
    //   const start = startDate ? new Date(startDate) : null;
    //   const end = endDate ? new Date(endDate) : null;
    //   filtered = filtered.filter((req) => {
    //     const reqDateUTC = new Date(req.created_at+ 9 * 60 * 60 * 1000);
    //     const reqDateJST = new Date(reqDateUTC.getTime() + 9 * 60 * 60 * 1000);
    //     return (start ? reqDateJST >= start : true) && (end ? reqDateJST <= end : true);
    //   });
    // }
    setFilteredRequests(filtered);
  };

  // 商品ID から商品検索
  const fetchProductById = async () => {
    try {
      if (!products || products.length === 0) {
        const resp = await fetch("/api/productList");
        if (!resp.ok) throw new Error("商品データ取得失敗");
        const result = await resp.json();
        setProducts(result.data);
      }

      // 最新の products から目的の商品を探す
      const found = (products.length > 0 ? products : [])
        .find(p => p.id === parseInt(productId, 10));

      if (found) {
        setSelectedProduct(found);
        setShowProductModal(false);
        setShowRequestModal(true);
      } else {
        alert("該当の商品IDが見つかりません");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 新規申請を登録
  const handleRegisterRequest = async () => {
    if (!selectedProduct) return;

    try {
      const requestData = {
        product_id: selectedProduct.id,
        name: selectedProduct.name,
        place: selectedProduct.place,
        feature: selectedProduct.feature,
        img_url: selectedProduct.img_url,
        applicant: newRequest.applicant,
        lost_day: newRequest.lost_day,
        return_completed: newRequest.return_completed,
      };
      const res = await fetch("/api/register2/POST", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      if (!res.ok) throw new Error("登録失敗");

      setShowRequestModal(false);
      fetchRequests();
    } catch (err) {
      console.error(err);
    }
  };

  // 詳細モーダル閉じる
  const closeDetailModal = () => {
    setSelectedRequest(null);
    setShowReturnConfirmation(false);
    setUserChoice("");
    setIsReturnCompleted(false);
  };

  // 返却処理フロー
  const handleStartReturnProcess = () => {
    setShowReturnConfirmation(true);
    setUserChoice("");
    setIsReturnCompleted(false);
  };

  const handleYes = () => {
    setUserChoice("はい");
  };

  const handleNo = () => {
    setUserChoice("いいえ");
    setShowReturnConfirmation(false);
  };

  const handleReturnComplete = async () => {
    if (!selectedRequest) return;
    try {
      const res = await fetch("/api/requestList", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRequest.id,
          return_completed: "はい",
        }),
      });
      if (!res.ok) throw new Error("返却処理失敗");

      alert("返却処理が完了しました");
      setIsReturnCompleted(true);
      fetchRequests();
      // closeDetailModal(); // 必要なら閉じる
    } catch (err) {
      console.error(err);
      alert("エラーが発生しました");
    }
  };

  // ================================
  // JSX
  // ================================
  return (
    <>
      <div className={styles.container}>
        <button
          className={styles.addButton}
          onClick={() => setShowProductModal(true)}
        >
          申請追加
        </button>

        {/* 検索バー */}
        <input
          type="text"
          className={styles.searchBar}
          placeholder="検索"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* 日付フィルタ */}
        <div className={styles.dateFilter}>
          <label htmlFor="startDate">開始日</label>
          <input
            type="date"
            id="startDate"
            className={styles.dateInput}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <label htmlFor="endDate">終了日</label>
          <input
            type="date"
            id="endDate"
            className={styles.dateInput}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {loading && <p className={styles.loading}>Loading...</p>}
        {error && <p className={styles.error}>⚠️ {error}</p>}

        <div className={styles.listGrid}>
          {filteredRequests.map((req) => {
            const isReturned = req.return_completed === "はい";
            return (
              <div
                key={req.id}
                className={
                  isReturned
                    ? `${styles.notificationItem} ${styles.returnedItem}`
                    : styles.notificationItem
                }
                onClick={() => setSelectedRequest(req)}
              >
                <Image
                  src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${req.img_url}`}
                  alt="Product Image"
                  width={100}
                  height={100}
                  className={styles.productImage}
                />
                <p><strong>申請ID:</strong> {req.id}</p>
                <p><strong>商品ID:</strong> {req.product_id}</p>
                <p><strong>申請者:</strong> {req.applicant}</p>
                <p><strong>名称:</strong> {req.name}</p>
                <p><strong>場所:</strong> {req.place}</p>
                <p><strong>特徴:</strong> {req.feature}</p>
                <p><strong>紛失日:</strong> {req.lost_day}</p>
                <p>
                  <strong>申請日:</strong>{" "}
                  {new Date(req.created_at).toLocaleDateString()}
                </p>
                {isReturned && (
                  <p className={styles.returnCompletedLabel}>
                    返却完了済み
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <NavBar />

      {/* ▼ 詳細モーダル */}
      {selectedRequest && (
        <div className={styles.modalOverlay} onClick={closeDetailModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>申請詳細</h2>
            <Image
              src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedRequest.img_url}`}
              alt="Product Image"
              width={100}
              height={100}
              className={styles.productImage}
            />
            <p><strong>申請ID:</strong> {selectedRequest.id}</p>
            <p><strong>商品ID:</strong> {selectedRequest.product_id}</p>
            <p><strong>申請者:</strong> {selectedRequest.applicant}</p>
            <p><strong>名称:</strong> {selectedRequest.name}</p>
            <p><strong>場所:</strong> {selectedRequest.place}</p>
            <p><strong>特徴:</strong> {selectedRequest.feature}</p>
            <p><strong>紛失日:</strong> {selectedRequest.lost_day}</p>
            <p>
              <strong>申請日:</strong>{" "}
              {new Date(selectedRequest.created_at).toLocaleDateString()}
            </p>

            {/* すでに返却完了かどうか */}
            {selectedRequest.return_completed === "はい" ? (
              <p className={styles.alreadyReturned}>
                すでに返却完了されています。
              </p>
            ) : (
              <>
                {/* まだ返却していない */}
                {!showReturnConfirmation && !isReturnCompleted && (
                  <div className={styles.modalButtons}>
                    <button
                      onClick={handleStartReturnProcess}
                      className={styles.modalButton}
                    >
                      返却処理
                    </button>
                    {/* 返却処理の横に閉じるボタンを置きたい */}
                    <button
                      onClick={closeDetailModal}
                      className={styles.modalButton}
                    >
                      閉じる
                    </button>
                  </div>
                )}

                {showReturnConfirmation && !isReturnCompleted && (
                  <div>
                    <p className={styles.confirmMessage}>
                      本当に自分のものと間違いないですか？<br/>
                      後々に問題が起きた場合、責任を負うことになりますがよろしいですか？
                    </p>

                    {userChoice === "" && (
                      <div className={styles.modalButtons}>
                        <button
                          onClick={handleYes}
                          className={styles.modalButton}
                        >
                          はい
                        </button>
                        <button
                          onClick={handleNo}
                          className={styles.modalButton}
                        >
                          いいえ
                        </button>
                      </div>
                    )}
                    {userChoice === "はい" && (
                      <div className={styles.modalButtons}>
                        <button
                          onClick={handleReturnComplete}
                          className={styles.modalButton}
                        >
                          返却完了
                        </button>
                        {/* 返却完了ボタンの横に閉じるボタン */}
                        <button
                          onClick={closeDetailModal}
                          className={styles.modalButton}
                        >
                          閉じる
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 返却完了後のメッセージ */}
                {isReturnCompleted && (
                  <p className={styles.returnCompletedLabel}>
                    返却が完了しました。
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ▼ 商品ID入力モーダル */}
      {showProductModal && (
        <div className={styles.modalOverlay} onClick={() => setShowProductModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>商品 ID 入力</h2>
            <input
              type="text"
              placeholder="商品 ID"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            />
            <div className={styles.modalButtons}>
              <button className={styles.modalButton} onClick={fetchProductById}>次へ</button>
              <button className={styles.modalButton} onClick={() => setShowProductModal(false)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* ▼ 申請追加モーダル */}
      {showRequestModal && selectedProduct && (
        <div className={styles.modalOverlay} onClick={() => setShowRequestModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>申請追加</h2>
            <Image
              src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
              alt="Product Image"
              width={100}
              height={100}
              className={styles.productImage}
            />
            <p><strong>商品ID:</strong> {selectedProduct.id}</p>
            <p><strong>名称:</strong> {selectedProduct.name}</p>
            <p><strong>場所:</strong> {selectedProduct.place}</p>
            <p><strong>特徴:</strong> {selectedProduct.feature}</p>

            <input
              type="text"
              placeholder="申請者"
              value={newRequest.applicant}
              onChange={(e) =>
                setNewRequest({ ...newRequest, applicant: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="紛失日"
              value={newRequest.lost_day}
              onChange={(e) =>
                setNewRequest({ ...newRequest, lost_day: e.target.value })
              }
            />
            <div className={styles.modalButtons}>
              <button className={styles.modalButton} onClick={handleRegisterRequest}>登録</button>
              <button className={styles.modalButton} onClick={() => setShowRequestModal(false)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}






// "use client";
// import { useState, useEffect } from "react";
// import Image from "next/image";
// import styles from "./index.module.css";
// import NavBar from "@/components/navBar/navBar";

// /** 申請データの型 */
// interface RequestData {
//   id: number;
//   applicant: string;
//   name: string;
//   place: string;
//   feature: string;
//   lost_day: string;
//   created_at: string;
//   img_url: string;
//   product_id: string;
//   return_completed: string; // "はい" / "いいえ" / ""
// }

// /** 商品データの型 */
// interface ProductData {
//   id: number;
//   name: string;
//   place: string;
//   feature: string;
//   img_url: string;
// }

// export default function NotificationPage() {
//   const [requests, setRequests] = useState<RequestData[]>([]);
//   const [filteredRequests, setFilteredRequests] = useState<RequestData[]>([]);
//   const [products, setProducts] = useState<ProductData[]>([]);

//   // 検索・フィルタ用
//   const [searchQuery, setSearchQuery] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");

//   // モーダル管理
//   const [showProductModal, setShowProductModal] = useState(false);
//   const [showRequestModal, setShowRequestModal] = useState(false);

//   // 新規申請用
//   const [productId, setProductId] = useState("");
//   const [newRequest, setNewRequest] = useState({
//     applicant: "",
//     lost_day: "",
//     return_completed: "",
//   });

//   // 選択された request / product
//   const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
//   const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);

//   // ローディング / エラー
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // 返却処理用 state
//   const [showReturnConfirmation, setShowReturnConfirmation] = useState(false);
//   const [userChoice, setUserChoice] = useState<"" | "はい" | "いいえ">("");
//   const [isReturnCompleted, setIsReturnCompleted] = useState(false);

//   // -------------------------------
//   // 初回マウント: リクエスト一覧を取得
//   // -------------------------------
//   useEffect(() => {
//     fetchRequests();
//   }, []);

//   // -------------------------------
//   // 検索・日付フィルタ適用
//   // -------------------------------
//   useEffect(() => {
//     handleSearch();
//   }, [searchQuery, startDate, endDate]);

//   // リクエスト一覧の取得
//   const fetchRequests = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await fetch("/api/requestList");
//       if (!response.ok) throw new Error("データ取得失敗");
//       const data = await response.json();

//       // 最新30件
//       const sortedData = data.data
//         .sort((a: RequestData, b: RequestData) =>
//           new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//         )
//         .slice(0, 30);

//       setRequests(sortedData);
//       setFilteredRequests(sortedData);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "エラーが発生しました");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = () => {
//     let filtered = requests;
  
//     // ①テキスト検索
//     if (searchQuery) {
//       filtered = filtered.filter((req) =>
//         [req.applicant, req.name, req.place, req.feature, req.lost_day].some(
//           (value) => value.toLowerCase().includes(searchQuery.toLowerCase())
//         )
//       );
//     }
  
//     // ②日付検索（開始日・終了日のどちらかが指定されていれば実行）
//     if (startDate || endDate) {
//       let start: Date | null = null;
//       let end: Date | null = null;
  
//       // 例: startDate = "2025-02-19" など
//       //    => "2025-02-19T00:00:00.000Z" として UTC 日付にする
//       if (startDate) {
//         start = new Date(`${startDate}T00:00:00.000Z`); 
//       }
  
//       // endDate = "2025-02-20" => "2025-02-20T23:59:59.999Z"
//       if (endDate) {
//         end = new Date(`${endDate}T23:59:59.999Z`); 
//       }
  
//       // created_at を UTC日付として解釈し、start～end でフィルタ
//       filtered = filtered.filter((req) => {
//         // DBにUTC形式(YYYY-MM-DDTHH:mm:ssZ)で入っていることが前提
//         const created = new Date(req.created_at);
  
//         // ミリ秒で比較
//         const createdMs = created.getTime();
//         const startMs = start ? start.getTime() : Number.NEGATIVE_INFINITY;
//         const endMs = end ? end.getTime() : Number.POSITIVE_INFINITY;
  
//         return (createdMs >= startMs) && (createdMs <= endMs);
//       });
//     }
  
//     setFilteredRequests(filtered);
//   };
  
  

//   const fetchProductById = async () => {
//     try {
//       // サーバからデータを取得
//       let updatedProducts = products;
//       if (!products || products.length === 0) {
//         const response = await fetch("/api/productList", {
//           method: "GET",
//           headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
//         });
//         if (!response.ok) throw new Error("データの取得に失敗しました");
//         const result = await response.json();
//         console.log(result.data);
//         updatedProducts = result.data; // ここで一旦変数に受け取る
//         setProducts(updatedProducts); // 状態を更新
//       }
      
//       // 状態を更新する前の products を使わず、updatedProducts を使って find する
//       const foundProduct = updatedProducts.find(
//         (p) => p.id === parseInt(productId, 10)
//       );
      
//       if (foundProduct) {
//         setSelectedProduct(foundProduct);
//         setShowProductModal(false);
//         setShowRequestModal(true);
//       } else {
//         alert("商品が見つかりません");
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   // 新規申請を登録
//   const handleRegisterRequest = async () => {
//     if (!selectedProduct) return;

//     try {
//       const requestData = {
//         product_id: selectedProduct.id,
//         name: selectedProduct.name,
//         place: selectedProduct.place,
//         feature: selectedProduct.feature,
//         img_url: selectedProduct.img_url,
//         applicant: newRequest.applicant,
//         lost_day: newRequest.lost_day,
//         return_completed: newRequest.return_completed,
//       };
//       const res = await fetch("/api/register2/POST", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(requestData),
//       });
//       if (!res.ok) throw new Error("登録失敗");

//       setShowRequestModal(false);
//       fetchRequests();
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // 詳細モーダル閉じる
//   const closeDetailModal = () => {
//     setSelectedRequest(null);
//     setShowReturnConfirmation(false);
//     setUserChoice("");
//     setIsReturnCompleted(false);
//   };

//   // 返却処理フロー
//   const handleStartReturnProcess = () => {
//     setShowReturnConfirmation(true);
//     setUserChoice("");
//     setIsReturnCompleted(false);
//   };

//   const handleYes = () => {
//     setUserChoice("はい");
//   };

//   const handleNo = () => {
//     setUserChoice("いいえ");
//     setShowReturnConfirmation(false);
//   };

//   const handleReturnComplete = async () => {
//     if (!selectedRequest) return;
//     try {
//       const res = await fetch("/api/returnRequest/POST", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           id: selectedRequest.id,
//           return_completed: "はい",
//         }),
//       });
//       if (!res.ok) throw new Error("返却処理失敗");

//       alert("返却処理が完了しました");
//       setIsReturnCompleted(true);
//       fetchRequests();
//       // closeDetailModal(); // 必要なら閉じる
//     } catch (err) {
//       console.error(err);
//       alert("エラーが発生しました");
//     }
//   };

//   // ================================
//   // JSX
//   // ================================
//   return (
//     <>
//       <div className={styles.container}>
//         <button
//           className={styles.addButton}
//           onClick={() => setShowProductModal(true)}
//         >
//           申請追加
//         </button>

//         {/* 検索バー */}
//         <input
//           type="text"
//           className={styles.searchBar}
//           placeholder="検索"
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//         />

//         {/* 日付フィルタ */}
//         <div className={styles.dateFilter}>
//           <label htmlFor="startDate">開始日</label>
//           <input
//             type="date"
//             id="startDate"
//             className={styles.dateInput}
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//           />

//           <label htmlFor="endDate">終了日</label>
//           <input
//             type="date"
//             id="endDate"
//             className={styles.dateInput}
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//           />
//         </div>

//         {loading && <p className={styles.loading}>Loading...</p>}
//         {error && <p className={styles.error}>⚠️ {error}</p>}

//         <div className={styles.listGrid}>
//           {filteredRequests.map((req) => {
//             const isReturned = req.return_completed === "はい";
//             return (
//               <div
//                 key={req.id}
//                 className={
//                   isReturned
//                     ? `${styles.notificationItem} ${styles.returnedItem}`
//                     : styles.notificationItem
//                 }
//                 onClick={() => setSelectedRequest(req)}
//               >
//                 <Image
//                   src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${req.img_url}`}
//                   alt="Product Image"
//                   width={100}
//                   height={100}
//                   className={styles.productImage}
//                 />
//                 <p><strong>申請ID:</strong> {req.id}</p>
//                 <p><strong>商品ID:</strong> {req.product_id}</p>
//                 <p><strong>申請者:</strong> {req.applicant}</p>
//                 <p><strong>名称:</strong> {req.name}</p>
//                 <p><strong>場所:</strong> {req.place}</p>
//                 <p><strong>特徴:</strong> {req.feature}</p>
//                 <p><strong>紛失日:</strong> {req.lost_day}</p>
//                 <p>
//                   <strong>申請日:</strong>{" "}
//                   {new Date(req.created_at).toLocaleDateString()}
//                 </p>
//                 {isReturned && (
//                   <p className={styles.returnCompletedLabel}>
//                     返却完了済み
//                   </p>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       <NavBar />

//       {/* ▼ 詳細モーダル */}
//       {selectedRequest && (
//         <div className={styles.modalOverlay} onClick={closeDetailModal}>
//           <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//             <h2>申請詳細</h2>
//             <Image
//               src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedRequest.img_url}`}
//               alt="Product Image"
//               width={100}
//               height={100}
//               className={styles.productImage}
//             />
//             <p><strong>申請ID:</strong> {selectedRequest.id}</p>
//             <p><strong>商品ID:</strong> {selectedRequest.product_id}</p>
//             <p><strong>申請者:</strong> {selectedRequest.applicant}</p>
//             <p><strong>名称:</strong> {selectedRequest.name}</p>
//             <p><strong>場所:</strong> {selectedRequest.place}</p>
//             <p><strong>特徴:</strong> {selectedRequest.feature}</p>
//             <p><strong>紛失日:</strong> {selectedRequest.lost_day}</p>
//             <p>
//               <strong>申請日:</strong>{" "}
//               {new Date(selectedRequest.created_at).toLocaleDateString("ja-JP", {
//                 timeZone: "UTC",
//               })}
//             </p>

//             {/* すでに返却完了かどうか */}
//             {selectedRequest.return_completed === "はい" ? (
//               <p className={styles.alreadyReturned}>
//                 すでに返却完了されています。
//               </p>
//             ) : (
//               <>
//                 {/* まだ返却していない */}
//                 {!showReturnConfirmation && !isReturnCompleted && (
//                   <div className={styles.modalButtons}>
//                     <button
//                       onClick={handleStartReturnProcess}
//                       className={styles.modalButton}
//                     >
//                       返却処理
//                     </button>
//                     {/* 返却処理の横に閉じるボタンを置きたい */}
//                     <button
//                       onClick={closeDetailModal}
//                       className={styles.modalButton}
//                     >
//                       閉じる
//                     </button>
//                   </div>
//                 )}

//                 {showReturnConfirmation && !isReturnCompleted && (
//                   <div>
//                     <p className={styles.confirmMessage}>
//                       本当に自分のものと間違いないですか？<br/>
//                       後々に問題が起きた場合、責任を負うことになりますがよろしいですか？
//                     </p>

//                     {userChoice === "" && (
//                       <div className={styles.modalButtons}>
//                         <button
//                           onClick={handleYes}
//                           className={styles.modalButton}
//                         >
//                           はい
//                         </button>
//                         <button
//                           onClick={handleNo}
//                           className={styles.modalButton}
//                         >
//                           いいえ
//                         </button>
//                       </div>
//                     )}
//                     {userChoice === "はい" && (
//                       <div className={styles.modalButtons}>
//                         <button
//                           onClick={handleReturnComplete}
//                           className={styles.modalButton}
//                         >
//                           返却完了
//                         </button>
//                         {/* 返却完了ボタンの横に閉じるボタン */}
//                         <button
//                           onClick={closeDetailModal}
//                           className={styles.modalButton}
//                         >
//                           閉じる
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* 返却完了後のメッセージ */}
//                 {isReturnCompleted && (
//                   <p className={styles.returnCompletedLabel}>
//                     返却が完了しました。
//                   </p>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       )}

//       {/* ▼ 商品ID入力モーダル */}
//       {showProductModal && (
//         <div className={styles.modalOverlay} onClick={() => setShowProductModal(false)}>
//           <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//             <h2>商品 ID 入力</h2>
//             <input
//               type="text"
//               placeholder="商品 ID"
//               value={productId}
//               onChange={(e) => setProductId(e.target.value)}
//             />
//             <div className={styles.modalButtons}>
//               <button className={styles.modalButton} onClick={fetchProductById}>次へ</button>
//               <button className={styles.modalButton} onClick={() => setShowProductModal(false)}>キャンセル</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ▼ 申請追加モーダル */}
//       {showRequestModal && selectedProduct && (
//         <div className={styles.modalOverlay} onClick={() => setShowRequestModal(false)}>
//           <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//             <h2>申請追加</h2>
//             <Image
//               src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
//               alt="Product Image"
//               width={100}
//               height={100}
//               className={styles.productImage}
//             />
//             <p><strong>商品ID:</strong> {selectedProduct.id}</p>
//             <p><strong>名称:</strong> {selectedProduct.name}</p>
//             <p><strong>場所:</strong> {selectedProduct.place}</p>
//             <p><strong>特徴:</strong> {selectedProduct.feature}</p>

//             <input
//               type="text"
//               placeholder="申請者"
//               value={newRequest.applicant}
//               onChange={(e) =>
//                 setNewRequest({ ...newRequest, applicant: e.target.value })
//               }
//             />
//             <input
//               type="text"
//               placeholder="紛失日"
//               value={newRequest.lost_day}
//               onChange={(e) =>
//                 setNewRequest({ ...newRequest, lost_day: e.target.value })
//               }
//             />
//             <div className={styles.modalButtons}>
//               <button className={styles.modalButton} onClick={handleRegisterRequest}>登録</button>
//               <button className={styles.modalButton} onClick={() => setShowRequestModal(false)}>キャンセル</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }







// "use client";
// import { useState, useEffect } from "react";
// import styles from "./index.module.css";
// import NavBar from "@/components/navBar/navBar";
// import Image from "next/image";

// interface RequestData {
//   id: number;
//   applicant: string;
//   name: string;
//   place: string;
//   feature: string;
//   lost_day: string;
//   created_at: string;
//   img_url: string;
//   product_id: string;
//   return_completed: string;
// }

// interface ProductData {
//   id: number;
//   name: string;
//   place: string;
//   feature: string;
//   img_url: string;
// }

// export default function NotificationPage() {
//   const [requests, setRequests] = useState<RequestData[]>([]);
//   const [products, setProducts] = useState<ProductData[]>([]);
//   const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
//   const [showProductModal, setShowProductModal] = useState(false);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [productId, setProductId] = useState("");
//   const [newRequest, setNewRequest] = useState({
//     applicant: "",
//     lost_day: "",
//     return_completed: ""
//   });


//   const [filteredRequests, setFilteredRequests] = useState<RequestData[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetchRequests();
//   }, []);

//   useEffect(() => {
//     handleSearch();
//   }, [searchQuery, startDate, endDate]);

//   const fetchRequests = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await fetch("/api/requestList", {
//         method: "GET",
//         headers: { "Content-Type": "application/json" },
//       });
//       if (!response.ok) throw new Error("데이터를 불러오는 데 실패했습니다.");
//       const data = await response.json();
//       const sortedData = data.data
//         .sort((a: RequestData, b: RequestData) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
//         .slice(0, 30);
//       setRequests(sortedData);
//       setFilteredRequests(sortedData);
//     } catch (error) {
//       setError(error instanceof Error ? error.message : "에러가 발생했습니다.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = () => {
//     let filtered = requests;
//     if (searchQuery) {
//       filtered = filtered.filter((req) =>
//         [req.applicant, req.name, req.place, req.feature, req.lost_day].some((value) =>
//           value.toLowerCase().includes(searchQuery.toLowerCase())
//         )
//       );
//     }
//     if (startDate || endDate) {
//       const start = startDate ? new Date(startDate) : null;
//       const end = endDate ? new Date(endDate) : null;
//       filtered = filtered.filter((req) => {
//         const reqDate = new Date(req.created_at);
//         return (start ? reqDate >= start : true) && (end ? reqDate <= end : true);
//       });
//     }
//     setFilteredRequests(filtered);
//   };

//   const fetchProductById = async () => {
//     try {
//       // サーバからデータを取得
//       let updatedProducts = products;
//       if (!products || products.length === 0) {
//         const response = await fetch("/api/productList", {
//           method: "GET",
//           headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
//         });
//         if (!response.ok) throw new Error("データの取得に失敗しました");
//         const result = await response.json();
//         console.log(result.data);
//         updatedProducts = result.data; // ここで一旦変数に受け取る
//         setProducts(updatedProducts); // 状態を更新
//       }
      
//       // 状態を更新する前の products を使わず、updatedProducts を使って find する
//       const foundProduct = updatedProducts.find(
//         (p) => p.id === parseInt(productId, 10)
//       );
      
//       if (foundProduct) {
//         setSelectedProduct(foundProduct);
//         setShowProductModal(false);
//         setShowRequestModal(true);
//       } else {
//         alert("商品が見つかりません");
//       }
//     } catch (error) {
//       console.error(error);
//     }
//   };
  

//   const handleRegisterRequest = async () => {
//     if (!selectedProduct) return;
//     try {
//       const requestData = {
//         product_id: selectedProduct.id,
//         name: selectedProduct.name,
//         place: selectedProduct.place,
//         feature: selectedProduct.feature,
//         img_url: selectedProduct.img_url,
//         applicant: newRequest.applicant,
//         lost_day: newRequest.lost_day,
//         return_completed: newRequest.return_completed
//       };
//       const response = await fetch(`/api/register2/POST`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(requestData),
//       });
//       if (!response.ok) throw new Error("登録失敗");
//       setShowRequestModal(false);
//       fetchRequests();
//     } catch (error) {
//       console.error(error);
//     }
//   };


//   return (
//     <>
//       <div className={styles.container}>
//         <button className={styles.addButton} onClick={() => setShowProductModal(true)}>申請追加</button>
//         {/* 검색 필터 */}
//         <input 
//           type="text" 
//           placeholder="検索" 
//           className={styles.searchBar}
//           value={searchQuery} 
//           onChange={(e) => setSearchQuery(e.target.value)} 
//         />

//         {/* 🔹 날짜 검색 필드 */}
//         <div className={styles.dateFilter}>
//             <label htmlFor="startDate">開始日</label>
//             <input
//               type="date"
//               id="startDate"
//               name="startDate"
//               className={styles.dateInput}
//               title="開始日を選択してください"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//             />

//             <label htmlFor="endDate">終了日</label>
//             <input
//               type="date"
//               id="endDate"
//               name="endDate"
//               className={styles.dateInput}
//               title="終了日を選択してください"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//             />
//         </div>

//         {loading && <p className={styles.loading}>Loading...</p>}
//         {error && <p className={styles.error}>⚠️ {error}</p>}

//         <div className={styles.listGrid}>
//           {filteredRequests.map((req) => (
//             <div key={req.id} className={styles.notificationItem} onClick={() => setSelectedRequest(req)}>
//               <Image
//               src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${req.img_url}`}
//               alt="Product Image"
//               width={100}
//               height={100}
//               className={styles.productImage}
//               />
//               <p><strong>申請ID:</strong> {req.id}</p>
//               <p><strong>商品ID:</strong> {req.product_id}</p>
//               <p><strong>申請者:</strong> {req.applicant}</p>
//               <p><strong>名称:</strong> {req.name}</p>
//               <p><strong>場所:</strong> {req.place}</p>
//               <p><strong>特徴:</strong> {req.feature}</p>
//               <p><strong>紛失日:</strong> {req.lost_day}</p>
//               <p><strong>申請日:</strong> {new Date(req.created_at).toLocaleDateString()}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//       <NavBar/>

//       {/* 상세 모달 */}
//       {selectedRequest && (
//         <div className={styles.modalOverlay} onClick={() => setSelectedRequest(null)}>
//           <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//             <h2>申請詳細</h2>
//             <Image
//             src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedRequest.img_url}`}
//             alt="Product Image"
//             width={100}
//             height={100}
//             className={styles.productImage}
//             />
//             <p><strong>申請ID:</strong> {selectedRequest.id}</p>
//             <p><strong>商品ID:</strong> {selectedRequest.product_id}</p>
//             <p><strong>申請者:</strong> {selectedRequest.applicant}</p>
//             <p><strong>名称:</strong> {selectedRequest.name}</p>
//             <p><strong>場所:</strong> {selectedRequest.place}</p>
//             <p><strong>特徴:</strong> {selectedRequest.feature}</p>
//             <p><strong>紛失日:</strong> {selectedRequest.lost_day}</p>
//             <p><strong>申請日:</strong> {new Date(selectedRequest.created_at).toLocaleDateString()}</p>
//             <button onClick={() => setSelectedRequest(null)} className={styles.modalButton}>閉じる</button>
//           </div>
//         </div>
//       )}

//       {showProductModal && (
//         <div className={styles.modalOverlay}>
//           <div className={styles.modal}>
//             <h2>商品 ID 入力</h2>
//             <input type="text" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="商品 ID" />
//             <div className={styles.modalButtons}>
//               <button onClick={fetchProductById}>次へ</button>
//               <button onClick={() => setShowProductModal(false)}>キャンセル</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {showRequestModal && selectedProduct && (
//         <div className={styles.modalOverlay}>
//           <div className={styles.modal}>
//             <h2>申請追加</h2>
//             <Image
//             src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
//             alt="Product Image"
//             width={100}
//             height={100}
//             className={styles.productImage}
//             />
//             <p><strong>商品ID:</strong> {selectedProduct.id}</p>
//             <p><strong>名称:</strong> {selectedProduct.name}</p>
//             <p><strong>場所:</strong> {selectedProduct.place}</p>
//             <p><strong>特徴:</strong> {selectedProduct.feature}</p>
//             <input type="text" placeholder="申請者" value={newRequest.applicant} onChange={(e) => setNewRequest({ ...newRequest, applicant: e.target.value })} />
//             <input type="text" placeholder="紛失日" value={newRequest.lost_day} onChange={(e) => setNewRequest({ ...newRequest, lost_day: e.target.value })} />
//             <div className={styles.modalButtons}>
//               <button onClick={handleRegisterRequest}>登録</button>
//               <button onClick={() => setShowRequestModal(false)}>キャンセル</button>
//             </div>
//           </div>
//         </div>
//       )}

//     </>
//   );
// }




// "use client";
// import { useState, useEffect } from "react";
// import styles from "./index.module.css";
// import NavBar from "@/components/navBar/navBar";

// interface RequestData {
//   id: number;
//   applicant: string;
//   name: string;
//   place: string;
//   feature: string;
//   lost_day: string;
//   created_at: string;
// }

// export default function NotificationPage() {
//   const [requests, setRequests] = useState<RequestData[]>([]);
//   const [filteredRequests, setFilteredRequests] = useState<RequestData[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
//   const [newRequest, setNewRequest] = useState<RequestData>({
//     id: 0,
//     applicant: "",
//     name: "",
//     place: "",
//     feature: "",
//     lost_day: "",
//     created_at: "",
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     fetchRequests();
//   }, []);

//   useEffect(() => {
//     handleSearch();
//   }, [searchQuery, startDate, endDate]);

//   const fetchRequests = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await fetch("/api/requestList", {
//         method: "GET",
//         headers: { "Content-Type": "application/json" },
//       });
//       if (!response.ok) throw new Error("데이터를 불러오는 데 실패했습니다.");
//       const data = await response.json();
//       const sortedData = data.data
//         .sort((a: RequestData, b: RequestData) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
//         .slice(0, 30);
//       setRequests(sortedData);
//       setFilteredRequests(sortedData);
//     } catch (error) {
//       setError(error instanceof Error ? error.message : "에러가 발생했습니다.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = () => {
//     let filtered = requests;
//     if (searchQuery) {
//       filtered = filtered.filter((req) =>
//         [req.applicant, req.name, req.place, req.feature, req.lost_day].some((value) =>
//           value.toLowerCase().includes(searchQuery.toLowerCase())
//         )
//       );
//     }
//     if (startDate || endDate) {
//       const start = startDate ? new Date(startDate) : null;
//       const end = endDate ? new Date(endDate) : null;
//       filtered = filtered.filter((req) => {
//         const reqDate = new Date(req.created_at);
//         return (start ? reqDate >= start : true) && (end ? reqDate <= end : true);
//       });
//     }
//     setFilteredRequests(filtered);
//   };

//   const handleAddRequest = async () => {
//     try {
//       const response = await fetch(`/api/register2/POST`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newRequest),
//       });
//       if (!response.ok) throw new Error("등록 실패");
//       setShowModal(false);
//       fetchRequests();
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <>
//       <div className={styles.container}>
//         <button className={styles.addButton} onClick={() => setShowModal(true)}>申請追加</button>

//         {/* 검색 필터 */}
//         <input 
//           type="text" 
//           placeholder="検索" 
//           className={styles.searchBar}
//           value={searchQuery} 
//           onChange={(e) => setSearchQuery(e.target.value)} 
//         />

//         {/* 🔹 날짜 검색 필드 */}
//         <div className={styles.dateFilter}>
//             <label htmlFor="startDate">開始日</label>
//             <input
//               type="date"
//               id="startDate"
//               name="startDate"
//               className={styles.dateInput}
//               title="開始日を選択してください"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//             />

//             <label htmlFor="endDate">終了日</label>
//             <input
//               type="date"
//               id="endDate"
//               name="endDate"
//               className={styles.dateInput}
//               title="終了日を選択してください"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//             />
//         </div>

//         {loading && <p className={styles.loading}>Loading...</p>}
//         {error && <p className={styles.error}>⚠️ {error}</p>}

//         <div className={styles.listGrid}>
//           {filteredRequests.map((req) => (
//             <div key={req.id} className={styles.notificationItem} onClick={() => setSelectedRequest(req)}>
//               <p><strong>申請者:</strong> {req.applicant}</p>
//               <p><strong>名称:</strong> {req.name}</p>
//               <p><strong>場所:</strong> {req.place}</p>
//               <p><strong>特徴:</strong> {req.feature}</p>
//               <p><strong>紛失日:</strong> {req.lost_day}</p>
//               <p><strong>申請日:</strong> {new Date(req.created_at).toLocaleDateString()}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//       <NavBar />

//       {/* 상세 모달 */}
//       {selectedRequest && (
//         <div className={styles.modalOverlay} onClick={() => setSelectedRequest(null)}>
//           <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//             <h2>申請詳細</h2>
//             <p><strong>申請者:</strong> {selectedRequest.applicant}</p>
//             <p><strong>名称:</strong> {selectedRequest.name}</p>
//             <p><strong>場所:</strong> {selectedRequest.place}</p>
//             <p><strong>特徴:</strong> {selectedRequest.feature}</p>
//             <p><strong>紛失日:</strong> {selectedRequest.lost_day}</p>
//             <p><strong>申請日:</strong> {new Date(selectedRequest.created_at).toLocaleDateString()}</p>
//             <button onClick={() => setSelectedRequest(null)} className={styles.modalButton}>閉じる</button>
//           </div>
//         </div>
//       )}

//       {/* 신청 추가 모달 */}
//       {showModal && (
//         <div className={styles.modalOverlay}>
//           <div className={styles.modal}>
//             <h2>申請追加</h2>
//             <input type="text" placeholder="申請者" value={newRequest.applicant} onChange={(e) => setNewRequest({ ...newRequest, applicant: e.target.value })} />
//             <input type="text" placeholder="名称" value={newRequest.name} onChange={(e) => setNewRequest({ ...newRequest, name: e.target.value })} />
//             <input type="text" placeholder="場所" value={newRequest.place} onChange={(e) => setNewRequest({ ...newRequest, place: e.target.value })} />
//             <input type="text" placeholder="特徴" value={newRequest.feature} onChange={(e) => setNewRequest({ ...newRequest, feature: e.target.value })} />
//             <input type="date" placeholder="紛失日" value={newRequest.lost_day} onChange={(e) => setNewRequest({ ...newRequest, lost_day: e.target.value })} />

//             {/* ✅ 버튼 컨테이너 추가 */}
//             <div className={styles.modalButtons}>
//               <button onClick={handleAddRequest} className={styles.modalButton}>登録</button>
//               <button onClick={() => setShowModal(false)} className={styles.closeButton}>キャンセル</button>
//             </div>
//           </div>
//         </div>
//       )}

//     </>
//   );
// }






// "use client";
// import { useState, useEffect } from "react";
// import styles from "./index.module.css";
// import NavBar from "@/components/navBar/navBar";
// import { useRouter } from "next/navigation";


// interface RequestData {
//   id: number;
//   applicant: string;
//   name: string;
//   place: string;
//   feature: string;
//   lost_day: string;
//   created_at: string;
// }

// export default function NotificationPage() {
//   const [requests, setRequests] = useState<RequestData[]>([]);
//   const [filteredRequests, setFilteredRequests] = useState<RequestData[]>([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [newRequest, setNewRequest] = useState<RequestData>({
//     id: 0,
//     applicant: "",
//     name: "",
//     place: "",
//     feature: "",
//     lost_day: "",
//     created_at: "",
//   });

//   const router = useRouter();

//   useEffect(() => {
//     fetchRequests();
//   }, []);

//   const fetchRequests = async () => {
//     try {
//       const response = await fetch("/api/requestList", {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });
//       if (!response.ok) throw new Error("데이터를 불러오는 데 실패했습니다.");
//       const data = await response.json();
//       setRequests(data.data);
//       setFilteredRequests(data.data);
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   const handleSearch = () => {
//     let filtered = requests;
//     if (searchQuery) {
//       filtered = filtered.filter((req) =>
//         [req.applicant, req.name, req.place, req.feature, req.lost_day].some((value) =>
//           value.toLowerCase().includes(searchQuery.toLowerCase())
//         )
//       );
//     }
//     if (startDate || endDate) {
//       const start = startDate ? new Date(startDate) : null;
//       const end = endDate ? new Date(endDate) : null;
//       filtered = filtered.filter((req) => {
//         const reqDate = new Date(req.created_at);
//         if (start && end) {
//           return reqDate >= start && reqDate <= end;
//         } else if (start) {
//           return reqDate >= start;
//         } else if (end) {
//           return reqDate <= end;
//         }
//         return true;
//       });
//     }
//     setFilteredRequests(filtered);
//   };

//   const handleAddRequest = async () => {
//     try {
//       const response = await fetch(`/api/register2/POST`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(newRequest),
//       });
//       if (!response.ok) throw new Error("등록 실패");
//       setShowModal(false);
//       fetchRequests();
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <>
//       <div className={styles.container}>
//         <button onClick={() => setShowModal(true)}>申請追加</button>

//         {/* 검색 필터 */}
//         <input
//           type="text"
//           placeholder="검색어 입력"
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//         />
//         <label htmlFor="startDate">開始日</label>
//         <input
//           type="date"
//           id="startDate"
//           title="시작 날짜를 선택하세요"
//           value={startDate}
//           onChange={(e) => setStartDate(e.target.value)}
//         />
//         <label htmlFor="endDate">終了日</label>
//         <input
//           type="date"
//           id="endDate"
//           title="종료 날짜를 선택하세요"
//           value={endDate}
//           onChange={(e) => setEndDate(e.target.value)}
//         />
//         <button onClick={handleSearch}>검색</button>

//         {/* 신청 리스트 */}
//         <div className={styles.listGrid}>
//           {filteredRequests.map((req) => (
//             <div key={req.id} className={styles.notificationItem}>
//               <p>申請者: {req.applicant}</p>
//               <p>名称: {req.name}</p>
//               <p>場所: {req.place}</p>
//               <p>特徴: {req.feature}</p>
//               <p>紛失日: {req.lost_day}</p>
//               <p>申請日: {new Date(req.created_at).toLocaleDateString()}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//       <NavBar />

//       {/* 신청 추가 모달 */}
//       {showModal && (
//         <div className={styles.modalOverlay}>
//           <div className={styles.modal}>
//             <h2>신청 추가</h2>
//             <input
//               type="text"
//               placeholder="신청자"
//               value={newRequest.applicant}
//               onChange={(e) => setNewRequest({ ...newRequest, applicant: e.target.value })}
//             />
//             <input
//               type="text"
//               placeholder="상품명"
//               value={newRequest.name}
//               onChange={(e) => setNewRequest({ ...newRequest, name: e.target.value })}
//             />
//             <input
//               type="text"
//               placeholder="위치"
//               value={newRequest.place}
//               onChange={(e) => setNewRequest({ ...newRequest, place: e.target.value })}
//             />
//             <input
//               type="text"
//               placeholder="특징"
//               value={newRequest.feature}
//               onChange={(e) => setNewRequest({ ...newRequest, feature: e.target.value })}
//             />
//             <input
//               type="date"
//               placeholder="분실일"
//               value={newRequest.lost_day}
//               onChange={(e) => setNewRequest({ ...newRequest, lost_day: e.target.value })}
//             />
//             <button onClick={handleAddRequest}>등록</button>
//             <button onClick={() => setShowModal(false)}>취소</button>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }




// "use client";

// import { useState } from "react";

// import styles from "./index.module.css";
// import NavBar from "@/components/navBar/navBar";


// export default function Home() {
//   const [showUI, setShowUI] = useState(false);
//   return (
//     <>
//     <div className={styles.container}>
//       <h1 className={styles.notificationTitle}>通知</h1>
//       <h2 className={styles.subTitle}>本日の通知</h2>
      
//       <div className={styles.notificationItem}>
//         <p>〇〇さんとマッチングしました。</p>
//         <p>・1/1　No.1　時計</p>
//         <p>本日受け取り予定</p>
//         <p className={styles.notificationDate}>2024/1/2 10:10</p>
//       </div>

//       <div className={styles.notificationItem}>
//         <p>〇〇さんとマッチングしました。</p>
//         <p>・1/1　No.10　財布</p>
//         <p>本日受け取り予定</p>
//         <p className={styles.notificationDate}>2024/1/2 10:01</p>
//       </div>

//       <div className={styles.notificationItem}>
//         <p>〇〇さんとマッチングしました。</p>
//         <p>・1/1　No.2　時計</p>
//         <p>1/4 受け取り予定</p>
//         <p className={styles.notificationDate}>2024/1/2 10:00</p>
//       </div>

//       <p className={styles.footerText}>過去の通知を見る</p>
//     </div>
//       <NavBar />
//     </>
//   );
// }
