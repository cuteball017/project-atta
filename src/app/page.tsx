"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import styles from "./index.module.css"
import NavBar from "@/components/navBar/navBar"
import SignatureCanvas from "react-signature-canvas"
import { useRouter, useSearchParams } from "next/navigation"

export const fetchCache = "force-no-store"

interface Product {
  id: number
  name: string
  brand: string
  color: string
  feature: string
  place: string
  img_url: string
  created_at: string
  category: string
  applicant?: string | null
  return_at?: string | null
  remarks?: string | null
}

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const openProductIdParam = searchParams.get("openProductId")

  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [hideCompleted, setHideCompleted] = useState(false)

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showEditConfirm, setShowEditConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState("")
  const [editBrand, setEditBrand] = useState("")
  const [editColor, setEditColor] = useState("")
  const [editFeature, setEditFeature] = useState("")
  const [editPlace, setEditPlace] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editImgUrl, setEditImgUrl] = useState("")
  const [editRemarks, setEditRemarks] = useState("")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const [showReturnModal, setShowReturnModal] = useState(false)
  const [returnStep, setReturnStep] = useState<1 | 2 | 3>(1)
  const [returnName, setReturnName] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [returnRemarks, setReturnRemarks] = useState("")
  const [userChoice, setUserChoice] = useState<"" | "はい" | "いいえ">("")
  const [isReturnCompleted, setIsReturnCompleted] = useState(false)

  const padRef = useRef<InstanceType<typeof SignatureCanvas> | null>(null)
  const [signatureDataURL, setSignatureDataURL] = useState<string | null>(null)

  // fetch products helper so we can refresh after updates
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/productList", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      })
      if (!response.ok) throw new Error("データの取得に失敗しました")

      const result = await response.json()
      const sorted: Product[] = result.data.sort(
        (a: Product, b: Product) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      setProducts(sorted)
      setFilteredProducts(sorted.slice(0, 30))
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    onResize()
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isReturned = (p: Product) =>
    Boolean((p.applicant ?? "").trim() && (p.return_at ?? "").trim())

  useEffect(() => {
    let base = [...products].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

    const hasSearch = searchQuery.trim() !== ""
    const hasDate = startDate !== "" || endDate !== ""

    if (hasSearch) {
      const q = searchQuery.toLowerCase()
      base = base.filter((p) =>
        [p.id, p.name, p.brand, p.color, p.feature, p.place, p.category].some((v) =>
          String(v).toLowerCase().includes(q),
        ),
      )
    }

    if (selectedCategory) {
      base = base.filter((p) => p.category === selectedCategory)
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(`${startDate}T00:00:00`) : null
      const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null
      base = base.filter((p) => {
        const createdAt = new Date(p.created_at)
        return (!start || createdAt >= start) && (!end || createdAt <= end)
      })
    }

    if (hideCompleted) {
      base = base.filter((p) => !isReturned(p))
    }

    if (!hasSearch && !hasDate) {
      base = base.slice(0, 30)
    }

    setFilteredProducts(base)
  }, [searchQuery, selectedCategory, startDate, endDate, hideCompleted, products])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeProductDetailModal()
        setShowReturnModal(false)
        setReturnStep(1)
        setUserChoice("")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const openProductId = useMemo(() => {
    if (!openProductIdParam) return null
    const pid = Number(openProductIdParam)
    if (Number.isNaN(pid)) return null
    return pid
  }, [openProductIdParam])

  useEffect(() => {
    if (!openProductId) return
    if (products.length === 0) return

    const found = products.find((p) => p.id === openProductId)
    if (found) {
      setSelectedProduct(found)
    } else {
      alert("指定された商品が見つかりません。")
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete("openProductId")
    const query = params.toString()
    router.replace(query ? `/?${query}` : "/")
  }, [openProductId, products])

  useEffect(() => {
    if (selectedProduct !== null || showEditModal || showReturnModal) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [selectedProduct, showEditModal, showReturnModal])

  const closeProductDetailModal = () => {
    setSelectedProduct(null)

    const params = new URLSearchParams(searchParams.toString())
    params.delete("openProductId")
    const query = params.toString()
    router.replace(query ? `/?${query}` : "/",{ scroll: false })
  }

  const goReturnStep2 = () => {
    if (!returnName.trim() || !returnDate.trim()) {
      alert("氏名と日付を入力してください。")
      return
    }
    setReturnStep(2)
    setUserChoice("")
  }

  const handleYes = () => setUserChoice("はい")

  const handleNo = () => {
    setUserChoice("いいえ")
    closeReturnModal()
  }

  const clearSignature = () => {
    padRef.current?.clear()
    setSignatureDataURL(null)
  }

  const saveSignature = async () => {
    const dataURL = padRef.current?.toDataURL("image/png")
    if (!dataURL) {
      alert("署名がありません。")
      return
    }
    setSignatureDataURL(dataURL)
    try {
      const res = await fetch(`/api/signatureSave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData: dataURL, product_id: selectedProduct?.id }),
      })
      if (!res.ok) throw new Error("署名保存に失敗しました")
      alert("署名を保存しました。")
    } catch (err) {
      console.error(err)
      alert("署名保存中にエラーが発生しました")
    }
  }

  const completeReturn = async () => {
    if (!selectedProduct) return
    if (!signatureDataURL) {
      alert("署名を保存してください。")
      return
    }

    try {
      const res = await fetch(`/api/returnRequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          applicant: returnName,
          return_at: returnDate,
          remarks: returnRemarks,
        }),
      })

      if (!res.ok) throw new Error("返却処理に失敗しました")
      closeReturnModal()
      window.location.reload()
      alert("返却処理が完了しました")
    } catch (err) {
      console.error(err)
      alert("エラーが発生しました")
    }
  }

  const closeReturnModal = () => {
    setShowReturnModal(false)
    setSelectedProduct(null)
    setReturnStep(1)
    setUserChoice("")
    setReturnName("")
    setReturnDate("")
    setReturnRemarks("")
    clearSignature()
    setIsReturnCompleted(false)

    const params = new URLSearchParams(searchParams.toString())
    params.delete("openProductId")
    const query = params.toString()
    router.replace(query ? `/?${query}` : "/",{ scroll: false })
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.filterContainer}>
          <div className={styles.searchSection}>
            <div className={styles.searchBarWrapper}>
              <label htmlFor="searchQuery" className={styles.filterLabel}>
                検索
              </label>
              <input
                id="searchQuery"
                className={styles.searchBar}
                placeholder="商品名やブランドを入力"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.categoryWrapper}>
              <label htmlFor="category" className={styles.filterLabel}>
                カテゴリー
              </label>
              <select
                id="category"
                className={styles.selectBox}
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">すべて</option>
                <option value="スマートフォン">スマートフォン</option>
                <option value="時計">時計</option>
                <option value="文具">文具</option>
                <option value="衣類">衣類</option>
                <option value="イヤホン">イヤホン</option>
                <option value="日用品・雑貨">日用品・雑貨</option>
                <option value="貴金属類">貴金属類</option>
              </select>
            </div>
          </div>

          {isMobile ? (
            <div className={styles.dateFilter}>
              <div className={styles.dateFilterRow}>
                <label htmlFor="startDate">開始日</label>
                <input
                  type="date"
                  id="startDate"
                  className={styles.dateInput}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className={styles.dateFilterRow}>
                <label htmlFor="endDate">終了日</label>
                <input
                  type="date"
                  id="endDate"
                  className={styles.dateInput}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <button
                className={`${styles.hideCompletedButton} ${hideCompleted ? styles.active : ""}`}
                onClick={() => setHideCompleted((s) => !s)}
              >
                {hideCompleted ? "✓ " : ""}返却済みを非表示
              </button>
            </div>
          ) : (
            <div className={styles.dateFilter}>
              <label htmlFor="startDate">開始日</label>
              <input
                type="date"
                id="startDate"
                className={styles.dateInput}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className={styles.dateSeparator}>-</span>
              <label htmlFor="endDate">終了日</label>
              <input
                type="date"
                id="endDate"
                className={styles.dateInput}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />

              <button
                className={`${styles.hideCompletedButton} ${hideCompleted ? styles.active : ""}`}
                onClick={() => setHideCompleted((s) => !s)}
              >
                {hideCompleted ? "✓ " : ""}返却済みを非表示
              </button>
            </div>
          )}
        </div>

        {loading && <p className={styles.loading}>Loading...</p>}
        {error && <p className={styles.error}>⚠️ {error}</p>}

        {!loading && !error && (
          <div className={styles.resultsContainer}>
            <div className={styles.resultsHeader}>
              <h2 className={styles.resultsTitle}>
                検索結果: {filteredProducts.length}件
              </h2>
            </div>
            <ul className={styles.productLists}>
              {filteredProducts.map((product) => {
                const returned = isReturned(product)
                return (
                  <li
                    key={product.id}
                    className={
                      returned
                        ? `${styles.productItem} ${styles.returnedItem}`
                        : styles.productItem
                    }
                    onClick={() => setSelectedProduct(product)}
                    title={returned ? "返却完了（参照のみ）" : "詳細を表示"}
                  >
                    <div className={styles.productImageContainer}>
                      <Image
                        src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${product.img_url}`}
                        alt="Product Image"
                        width={150}
                        height={150}
                        className={styles.productImage}
                        sizes="(max-width: 767px) 45vw, 150px"
                      />
                    </div>
                    <div className={styles.productDetails}>
                      <div className={styles.productId}>ID: {product.id}</div>
                      <div className={styles.productName}>{product.name}</div>
                      <div className={styles.productInfo}>
                        <span className={styles.label}>ブランド:</span> {product.brand}
                      </div>
                      <div className={styles.productInfo}>
                        <span className={styles.label}>場所:</span> {product.place}
                      </div>
                      <div className={styles.productInfo}>
                        <span className={styles.label}>カテゴリー:</span>{" "}
                        {product.category}
                      </div>
                      <div className={styles.productDate}>
                        {new Date(product.created_at).toLocaleDateString()}
                      </div>
                      {returned && (
                        <div className={styles.returnCompletedLabel}>返却完了</div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {selectedProduct && (
          <div
            className={styles.modalOverlay}
            onClick={closeProductDetailModal}
          >
            <div
              className={styles.modal}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className={styles.closeButton}
                onClick={closeProductDetailModal}
              >
                ×
              </button>

              <div className={styles.modalContent}>
                <div className={styles.modalImageContainer}>
                  <div className={styles.modalImageBox}>
                    <Image
                      src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
                      alt="Product Image"
                      fill
                      sizes="(max-width: 767px) 90vw, 40vw"
                      className={styles.modalImage}
                    />
                  </div>
                </div>

                <div className={styles.modalDetails}>
                  <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
                  <div className={styles.modalInfo}>
                    <div className={styles.modalInfoItem}>
                      <span className={styles.modalLabel}>商品ID：</span>
                      {selectedProduct.id}
                    </div>
                    <div className={styles.modalInfoItem}>
                      <span className={styles.modalLabel}>ブランド：</span>
                      {selectedProduct.brand}
                    </div>
                    <div className={styles.modalInfoItem}>
                      <span className={styles.modalLabel}>色：</span>
                      {selectedProduct.color}
                    </div>
                    <div className={styles.modalInfoItem}>
                      <span className={styles.modalLabel}>特徴：</span>
                      {selectedProduct.feature}
                    </div>
                    <div className={styles.modalInfoItem}>
                      <span className={styles.modalLabel}>場所：</span>
                      {selectedProduct.place}
                    </div>
                    <div className={styles.modalInfoItem}>
                      <span className={styles.modalLabel}>カテゴリー：</span>
                      {selectedProduct.category}
                    </div>
                    <div className={styles.modalInfoItem}>
                      <span className={styles.modalLabel}>登録日：</span>
                      {new Date(selectedProduct.created_at).toLocaleDateString()}
                    </div>
                    {selectedProduct.remarks && (
                      <div className={styles.modalInfoItem}>
                        <span className={styles.modalLabel}>備考：</span>
                        {selectedProduct.remarks}
                      </div>
                    )}
                  </div>

                  {isReturned(selectedProduct) ? (
                    <p className={styles.alreadyReturned}>
                      すでに返却完了されています。
                    </p>
                  ) : (
                    <div className={styles.modalButtons}>
                      <button
                        className={styles.modalButton}
                        onClick={() => {
                          setShowReturnModal(true)
                          setReturnStep(1)
                          setUserChoice("")
                        }}
                      >
                        返却処理
                      </button>
                      <button
                        className={styles.modalButton}
                        onClick={() => setShowEditConfirm(true)}
                      >
                        内容編集
                      </button>
                      <button
                        className={styles.modalButton}
                        onClick={closeProductDetailModal}
                      >
                        閉じる
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEditConfirm && selectedProduct && (
        <div className={styles.modalOverlay} onClick={() => setShowEditConfirm(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setShowEditConfirm(false)}>×</button>
            <h3>本当に内容を編集しますか？</h3>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalButton}
                onClick={() => {
                  // open edit modal with prefilled values
                  setEditName(selectedProduct.name || "")
                  setEditBrand(selectedProduct.brand || "")
                  setEditColor(selectedProduct.color || "")
                  setEditFeature(selectedProduct.feature || "")
                  setEditPlace(selectedProduct.place || "")
                  setEditCategory(selectedProduct.category || "")
                  setEditImgUrl(selectedProduct.img_url || "")
                  setEditRemarks(selectedProduct.remarks || "")
                  setShowEditConfirm(false)
                  setShowEditModal(true)
                }}
              >
                はい
              </button>
              <button className={styles.modalButton} onClick={() => setShowEditConfirm(false)}>
                いいえ
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedProduct && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setShowEditModal(false)}>×</button>
            <h3>内容編集</h3>
            <div className={styles.editForm}>
              <div className={styles.editField}>
                <label>名称</label>
                <input className={styles.editInput} placeholder="名称を入力" type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className={styles.editField}>
                <label>ブランド</label>
                <input className={styles.editInput} placeholder="ブランドを入力" type="text" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} />
              </div>
              <div className={styles.editField}>
                <label>色</label>
                <input className={styles.editInput} placeholder="色を入力" type="text" value={editColor} onChange={(e) => setEditColor(e.target.value)} />
              </div>
              <div className={styles.editField}>
                <label>特徴</label>
                <input className={styles.editInput} placeholder="特徴を入力" type="text" value={editFeature} onChange={(e) => setEditFeature(e.target.value)} />
              </div>
              <div className={styles.editField}>
                <label>場所</label>
                <input className={styles.editInput} placeholder="場所を入力" type="text" value={editPlace} onChange={(e) => setEditPlace(e.target.value)} />
              </div>
              <div className={styles.editField}>
                <label>カテゴリー</label>
                <input className={styles.editInput} placeholder="カテゴリーを入力" type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} />
              </div>
              <div className={styles.editField}>
                <label>画像ファイル名</label>
                <input className={styles.editInput} placeholder="例: sample.jpg" type="text" value={editImgUrl} onChange={(e) => setEditImgUrl(e.target.value)} />
              </div>
              <div className={styles.editField}>
                <label>備考</label>
                <textarea className={styles.editInput} placeholder="例）傷あり、バッテリー残量70% など" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} rows={3} style={{ width: "100%" }} />
              </div>
            </div>
            <div className={styles.modalButtons}>
              <button
                className={styles.modalButton}
                onClick={async () => {
                  try {
                    const res = await fetch("/api/productUpdate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: selectedProduct.id,
                        name: editName,
                        brand: editBrand,
                        color: editColor,
                        feature: editFeature,
                        place: editPlace,
                        category: editCategory,
                        img_url: editImgUrl,
                        remarks: editRemarks,
                      }),
                    })
                    if (!res.ok) {
                      const j = await res.json()
                      alert(j.error || "更新に失敗しました")
                      return
                    }
                    setShowEditModal(false)
                    setSelectedProduct(null)
                    // refresh list and selected product details
                    await fetchProducts()
                    alert("更新しました")
                  } catch (e) {
                    console.error(e)
                    alert("更新中にエラーが発生しました")
                  }
                }}
              >
                編集反映
              </button>
              <button className={styles.modalButton} onClick={() => setShowEditModal(false)}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <NavBar />

      {showReturnModal && selectedProduct && (
        <div className={styles.modalOverlay} onClick={closeReturnModal}>
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.closeButton} onClick={closeReturnModal}>
              ×
            </button>

            <div className={styles.returnModalImageBox}>
              <Image
                src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
                alt="Product Image"
                fill
                sizes="200px"
                className={styles.modalImage}
              />
            </div>

            <p className={styles.returnModalText}>
              <strong>商品ID:</strong> {selectedProduct.id}
            </p>
            <p className={styles.returnModalText}>
              <strong>名称:</strong> {selectedProduct.name}
            </p>
            <p className={styles.returnModalText}>
              <strong>場所:</strong> {selectedProduct.place}
            </p>
            <p className={styles.returnModalText}>
              <strong>特徴:</strong> {selectedProduct.feature}
            </p>

            {returnStep === 1 && (
              <>
                <div className={styles.returnModalText}>
                  <input
                    type="text"
                    placeholder="受領者（氏名）"
                    value={returnName}
                    onChange={(e) => setReturnName(e.target.value)}
                  />
                  <div style={{ height: 5 }} />
                  <input
                    type="date"
                    placeholder="返却日"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>
                <div className={styles.modalButtons}>
                  <button
                    className={styles.modalButton}
                    onClick={goReturnStep2}
                  >
                    次へ
                  </button>
                  <button
                    className={styles.modalButton}
                    onClick={closeReturnModal}
                  >
                    戻る
                  </button>
                </div>
              </>
            )}

            {returnStep === 2 && (
              <>
                <p
                  className={`${styles.confirmMessage} ${styles.returnModalText}`}
                >
                  本当に自分のものと間違いないですか？<br />
                  後々に問題が起きた場合、責任を負うことになりますがよろしいですか？
                </p>

                {userChoice === "" && (
                  <div className={styles.modalButtons}>
                    <button
                      className={styles.modalButton}
                      onClick={handleYes}
                    >
                      はい
                    </button>
                    <button
                      className={styles.modalButton}
                      onClick={handleNo}
                    >
                      いいえ
                    </button>
                  </div>
                )}

                {userChoice === "はい" && (
                  <div className={styles.modalButtons}>
                    <button
                      className={styles.modalButton}
                      onClick={() => setReturnStep(3)}
                    >
                      署名へ
                    </button>
                    <button
                      className={styles.modalButton}
                      onClick={closeReturnModal}
                    >
                      戻る
                    </button>
                  </div>
                )}
              </>
            )}

            {returnStep === 3 && (
              <>
                <br />
                <div className={styles.signatureWrapper}>
                  <SignatureCanvas
                    ref={padRef}
                    canvasProps={{
                      className: styles.signatureCanvas,
                      style: { width: "100%", height: "180px" },
                    }}
                  />
                </div>

                <div
                  className={styles.modalButtons}
                  style={{ marginTop: 10 }}
                >
                  <button
                    className={styles.modalButton}
                    onClick={clearSignature}
                  >
                    Clear
                  </button>
                  <button
                    className={styles.modalButton}
                    onClick={saveSignature}
                  >
                    署名保存
                  </button>
                </div>

                {signatureDataURL && (
                  <img
                    src={signatureDataURL}
                    alt="signature preview"
                    style={{
                      marginTop: 10,
                      border: "1px solid #ccc",
                      width: 200,
                    }}
                  />
                )}

                <div
                  className={styles.modalButtons}
                  style={{ marginTop: 10 }}
                >
                  <button
                    className={styles.modalButton}
                    onClick={completeReturn}
                    disabled={!signatureDataURL}
                    style={{
                      opacity: signatureDataURL ? 1 : 0.5,
                      cursor: signatureDataURL ? "pointer" : "not-allowed",
                    }}
                  >
                    返却完了
                  </button>
                  <button
                    className={styles.modalButton}
                    onClick={closeReturnModal}
                  >
                    閉じる
                  </button>
                </div>

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
    </div>
  )
}









// "use client"

// import { useState, useEffect, useRef } from "react"
// import Image from "next/image"
// import styles from "./index.module.css"
// import NavBar from "@/components/navBar/navBar"
// import SignatureCanvas from "react-signature-canvas"

// // ページでブラウザキャッシュを使わない設定
// export const fetchCache = "force-no-store"

// interface Product {
//   id: number
//   name: string
//   brand: string
//   color: string
//   feature: string
//   place: string
//   img_url: string
//   created_at: string
//   category: string
//   applicant?: string | null
//   return_at?: string | null
// }

// export default function Home() {
//   // 一覧と検索結果
//   const [products, setProducts] = useState<Product[]>([])
//   const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

//   // フィルタ
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedCategory, setSelectedCategory] = useState("")
//   const [startDate, setStartDate] = useState("")
//   const [endDate, setEndDate] = useState("")
//   const [hideCompleted, setHideCompleted] = useState(false) // 返却済み非表示

//   // 詳細モーダル
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

//   // 状態系
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [isMobile, setIsMobile] = useState(false)

//   // 返却処理用の状態
//   const [showReturnModal, setShowReturnModal] = useState(false)
//   const [returnStep, setReturnStep] = useState<1 | 2 | 3>(1) // 1:氏名・日付入力, 2:確認(はい/いいえ), 3:署名と完了
//   const [returnName, setReturnName] = useState("")
//   const [returnDate, setReturnDate] = useState("")
//   const [userChoice, setUserChoice] = useState<"" | "はい" | "いいえ">("")
//   const [isReturnCompleted, setIsReturnCompleted] = useState(false)

//   // 署名パッド
//   const padRef = useRef<InstanceType<typeof SignatureCanvas> | null>(null)
//   const [signatureDataURL, setSignatureDataURL] = useState<string | null>(null)

//   // 画面幅によるモバイル判定
//   useEffect(() => {
//     const onResize = () => setIsMobile(window.innerWidth < 1024)
//     onResize()
//     window.addEventListener("resize", onResize)
//     return () => window.removeEventListener("resize", onResize)
//   }, [])

//   // データ取得（最新順で30件までを初期表示）
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true)
//         setError(null)

//         const response = await fetch("/api/productList", {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             "Cache-Control": "no-cache",
//           },
//         })
//         if (!response.ok) throw new Error("データの取得に失敗しました")

//         const result = await response.json()
//         const sorted: Product[] = result.data.sort(
//           (a: Product, b: Product) =>
//             new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
//         )
//         setProducts(sorted)
//         setFilteredProducts(sorted.slice(0, 30))
//       } catch (err) {
//         setError(err instanceof Error ? err.message : "エラーが発生しました")
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchData()
//   }, [])

//   // 「返却済み(完了)」判定
//   const isReturned = (p: Product) =>
//     Boolean((p.applicant ?? "").trim() && (p.return_at ?? "").trim())

//   // 検索・フィルタ
//   useEffect(() => {
//     let base = [...products].sort(
//       (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
//     )

//     const hasSearch = searchQuery.trim() !== ""
//     const hasDate = startDate !== "" || endDate !== ""

//     // キーワード検索
//     if (hasSearch) {
//       const q = searchQuery.toLowerCase()
//       base = base.filter((p) =>
//         [p.id, p.name, p.brand, p.color, p.feature, p.place, p.category].some((v) =>
//           String(v).toLowerCase().includes(q),
//         ),
//       )
//     }

//     // カテゴリー
//     if (selectedCategory) {
//       base = base.filter((p) => p.category === selectedCategory)
//     }

//     // 日付範囲
//     if (startDate || endDate) {
//       const start = startDate ? new Date(`${startDate}T00:00:00`) : null
//       const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null
//       base = base.filter((p) => {
//         const createdAt = new Date(p.created_at)
//         return (!start || createdAt >= start) && (!end || createdAt <= end)
//       })
//     }

//     // 返却済み(完了)項目隠し
//     if (hideCompleted) {
//       base = base.filter((p) => !isReturned(p))
//     }

//     if (!hasSearch && !hasDate) {
//       base = base.slice(0, 30)
//     }

//     setFilteredProducts(base)
//   }, [searchQuery, selectedCategory, startDate, endDate, hideCompleted, products])

//   // Escで各種モーダルを閉じる
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") {
//         setSelectedProduct(null)
//         setShowReturnModal(false)
//         setReturnStep(1)
//         setUserChoice("")
//       }
//     }
//     window.addEventListener("keydown", onKey)
//     return () => window.removeEventListener("keydown", onKey)
//   }, [])

//   // 返却処理：ステップ1からステップ2へ
//   const goReturnStep2 = () => {
//     if (!returnName.trim() || !returnDate.trim()) {
//       alert("氏名と日付を入力してください。")
//       return
//     }
//     setReturnStep(2)
//     setUserChoice("")
//   }

//   // 確認「はい」
//   const handleYes = () => setUserChoice("はい")

//   // 確認「いいえ」
//   const handleNo = () => {
//     setUserChoice("いいえ")
//     closeReturnModal()
//   }

//   // 署名のクリア
//   const clearSignature = () => {
//     padRef.current?.clear()
//     setSignatureDataURL(null)
//   }

//   // 署名の保存
//   const saveSignature = async () => {
//     const dataURL = padRef.current?.toDataURL("image/png")
//     if (!dataURL) {
//       alert("署名がありません。")
//       return
//     }
//     setSignatureDataURL(dataURL)
//     try {
//       const res = await fetch(`/api/signatureSave`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ signatureData: dataURL, product_id: selectedProduct?.id }),
//       })
//       if (!res.ok) throw new Error("署名保存に失敗しました")
//       alert("署名を保存しました。")
//     } catch (err) {
//       console.error(err)
//       alert("署名保存中にエラーが発生しました")
//     }
//   }

//   // 返却完了処理
//   const completeReturn = async () => {
//     if (!selectedProduct) return
//     if (!signatureDataURL) {
//       alert("署名を保存してください。")
//       return
//     }

//     try {
//       const res = await fetch(`/api/returnRequest`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           product_id: selectedProduct.id,
//           applicant: returnName,
//           return_at: returnDate,
//         }),
//       })
     
//       if (!res.ok) throw new Error("返却処理に失敗しました")
//       closeReturnModal()
//       window.location.reload();
//       alert("返却処理が完了しました")
//     } catch (err) {
//       console.error(err)
//       alert("エラーが発生しました")
//     }
//   }

//   // 返却処理モーダルを閉じる
//   const closeReturnModal = () => {
//     setShowReturnModal(false)
//     setSelectedProduct(null)
//     setReturnStep(1)
//     setUserChoice("")
//     setReturnName("")
//     setReturnDate("")
//     clearSignature()
//     setIsReturnCompleted(false)
//   }

//   return (
//     <div className={styles.pageWrapper}>
//       <div className={styles.container}>
//         {/* フィルタ UI */}
//         <div className={styles.filterContainer}>
//           <div className={styles.searchSection}>
//             <div className={styles.searchBarWrapper}>
//               <label htmlFor="searchQuery" className={styles.filterLabel}>
//                 検索
//               </label>
//               <input
//                 id="searchQuery"
//                 className={styles.searchBar}
//                 placeholder="商品名やブランドを入力"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>

//             <div className={styles.categoryWrapper}>
//               <label htmlFor="category" className={styles.filterLabel}>
//                 カテゴリー
//               </label>
//               <select
//                 id="category"
//                 className={styles.selectBox}
//                 value={selectedCategory}
//                 onChange={(e) => setSelectedCategory(e.target.value)}
//               >
//                 <option value="">すべて</option>
//                 <option value="イヤホン">イヤホン</option>
//                 <option value="スマートフォン">スマートフォン</option>
//                 <option value="周辺機器">周辺機器</option>
//                 <option value="財布">財布</option>
//                 <option value="時計">時計</option>
//                 <option value="水筒">水筒</option>
//                 <option value="文具">文具</option>
//                 <option value="かばん">かばん</option>
//                 <option value="衣類">衣類</option>
//               </select>
//             </div>
//           </div>

//           {isMobile ? (
//             <div className={styles.dateFilter}>
//               <div className={styles.dateFilterRow}>
//                 <label htmlFor="startDate">開始日</label>
//                 <input
//                   type="date"
//                   id="startDate"
//                   className={styles.dateInput}
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                 />
//               </div>
//               <div className={styles.dateFilterRow}>
//                 <label htmlFor="endDate">終了日</label>
//                 <input
//                   type="date"
//                   id="endDate"
//                   className={styles.dateInput}
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                 />
//               </div>

//               <button
//                 className={`${styles.hideCompletedButton} ${
//                   hideCompleted ? styles.active : ""
//                 }`}
//                 onClick={() => setHideCompleted((s) => !s)}
//               >
//                 {hideCompleted ? "✓ " : ""}返却済みを非表示
//               </button>
//             </div>
//           ) : (
//             <div className={styles.dateFilter}>
//               <label htmlFor="startDate">開始日</label>
//               <input
//                 type="date"
//                 id="startDate"
//                 className={styles.dateInput}
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//               />
//               <span className={styles.dateSeparator}>-</span>
//               <label htmlFor="endDate">終了日</label>
//               <input
//                 type="date"
//                 id="endDate"
//                 className={styles.dateInput}
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//               />

//               <button
//                 className={`${styles.hideCompletedButton} ${
//                   hideCompleted ? styles.active : ""
//                 }`}
//                 onClick={() => setHideCompleted((s) => !s)}
//               >
//                 {hideCompleted ? "✓ " : ""}返却済みを非表示
//               </button>
//             </div>
//           )}
//         </div>

//         {loading && <p className={styles.loading}>Loading...</p>}
//         {error && <p className={styles.error}>⚠️ {error}</p>}

//         {!loading && !error && (
//           <div className={styles.resultsContainer}>
//             <div className={styles.resultsHeader}>
//               <h2 className={styles.resultsTitle}>
//                 検索結果: {filteredProducts.length}件
//               </h2>
//             </div>
//             <ul className={styles.productLists}>
//               {filteredProducts.map((product) => {
//                 const returned = isReturned(product)
//                 return (
//                   <li
//                     key={product.id}
//                     className={
//                       returned
//                         ? `${styles.productItem} ${styles.returnedItem}`
//                         : styles.productItem
//                     }
//                     onClick={() => setSelectedProduct(product)}
//                     title={returned ? "返却完了（参照のみ）" : "詳細を表示"}
//                   >
//                     <div className={styles.productImageContainer}>
//                       <Image
//                         src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${product.img_url}`}
//                         alt="Product Image"
//                         width={150}
//                         height={150}
//                         className={styles.productImage}
//                         sizes="(max-width: 767px) 45vw, 150px"
//                       />
//                     </div>
//                     <div className={styles.productDetails}>
//                       <div className={styles.productId}>ID: {product.id}</div>
//                       <div className={styles.productName}>{product.name}</div>
//                       <div className={styles.productInfo}>
//                         <span className={styles.label}>ブランド:</span> {product.brand}
//                       </div>
//                       <div className={styles.productInfo}>
//                         <span className={styles.label}>場所:</span> {product.place}
//                       </div>
//                       <div className={styles.productInfo}>
//                         <span className={styles.label}>カテゴリー:</span>{" "}
//                         {product.category}
//                       </div>
//                       <div className={styles.productDate}>
//                         {new Date(product.created_at).toLocaleDateString()}
//                       </div>
//                       {returned && (
//                         <div className={styles.returnCompletedLabel}>返却完了</div>
//                       )}
//                     </div>
//                   </li>
//                 )
//               })}
//             </ul>
//           </div>
//         )}

//         {/* 詳細モーダル */}
//         {selectedProduct && (
//           <div
//             className={styles.modalOverlay}
//             onClick={() => setSelectedProduct(null)}
//           >
//             <div
//               className={styles.modal}
//               onClick={(e) => e.stopPropagation()}
//             >
//               <button
//                 className={styles.closeButton}
//                 onClick={() => setSelectedProduct(null)}
//               >
//                 ×
//               </button>

//               <div className={styles.modalContent}>
//                 <div className={styles.modalImageContainer}>
//                   <div className={styles.modalImageBox}>
//                     <Image
//                       src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
//                       alt="Product Image"
//                       fill
//                       sizes="(max-width: 767px) 90vw, 40vw"
//                       className={styles.modalImage}
//                     />
//                   </div>
//                 </div>

//                 <div className={styles.modalDetails}>
//                   <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
//                   <div className={styles.modalInfo}>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>商品ID：</span>
//                       {selectedProduct.id}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>ブランド：</span>
//                       {selectedProduct.brand}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>色：</span>
//                       {selectedProduct.color}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>特徴：</span>
//                       {selectedProduct.feature}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>場所：</span>
//                       {selectedProduct.place}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>カテゴリー：</span>
//                       {selectedProduct.category}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>登録日：</span>
//                       {new Date(
//                         selectedProduct.created_at,
//                       ).toLocaleDateString()}
//                     </div>
//                   </div>

//                   {isReturned(selectedProduct) ? (
//                     <p className={styles.alreadyReturned}>
//                       すでに返却完了されています。
//                     </p>
//                   ) : (
//                     <div className={styles.modalButtons}>
//                       <button
//                         className={styles.modalButton}
//                         onClick={() => {
//                           setShowReturnModal(true)
//                           setReturnStep(1)
//                           setUserChoice("")
//                         }}
//                       >
//                         返却処理
//                       </button>
//                       <button
//                         className={styles.modalButton}
//                         onClick={() => setSelectedProduct(null)}
//                       >
//                         閉じる
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       <NavBar />

//       {/* 返却処理モーダル */}
//       {showReturnModal && selectedProduct && (
//         <div className={styles.modalOverlay} onClick={closeReturnModal}>
//           <div
//             className={styles.modal}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <button className={styles.closeButton} onClick={closeReturnModal}>
//               ×
//             </button>

//             <div className={styles.returnModalImageBox}>
//               <Image
//                 src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
//                 alt="Product Image"
//                 fill
//                 sizes="200px"
//                 className={styles.modalImage}
//               />
//             </div>

//             <p className={styles.returnModalText}>
//               <strong>商品ID:</strong> {selectedProduct.id}
//             </p>
//             <p className={styles.returnModalText}>
//               <strong>名称:</strong> {selectedProduct.name}
//             </p>
//             <p className={styles.returnModalText}>
//               <strong>場所:</strong> {selectedProduct.place}
//             </p>
//             <p className={styles.returnModalText}>
//               <strong>特徴:</strong> {selectedProduct.feature}
//             </p>

//             {returnStep === 1 && (
//               <>
//                 <div className={styles.returnModalText}>
//                   <input
//                     type="text"
//                     placeholder="受領者（氏名）"
//                     value={returnName}
//                     onChange={(e) => setReturnName(e.target.value)}
//                   />
//                   <div style={{ height: 5 }} />
//                   <input
//                     type="date"
//                     placeholder="返却日"
//                     value={returnDate}
//                     onChange={(e) => setReturnDate(e.target.value)}
//                   />
//                 </div>
//                 <div className={styles.modalButtons}>
//                   <button
//                     className={styles.modalButton}
//                     onClick={goReturnStep2}
//                   >
//                     次へ
//                   </button>
//                   <button
//                     className={styles.modalButton}
//                     onClick={closeReturnModal}
//                   >
//                     戻る
//                   </button>
//                 </div>
//               </>
//             )}

//             {returnStep === 2 && (
//               <>
//                 <p
//                   className={`${styles.confirmMessage} ${styles.returnModalText}`}
//                 >
//                   本当に自分のものと間違いないですか？<br />
//                   後々に問題が起きた場合、責任を負うことになりますがよろしいですか？
//                 </p>

//                 {userChoice === "" && (
//                   <div className={styles.modalButtons}>
//                     <button
//                       className={styles.modalButton}
//                       onClick={handleYes}
//                     >
//                       はい
//                     </button>
//                     <button
//                       className={styles.modalButton}
//                       onClick={handleNo}
//                     >
//                       いいえ
//                     </button>
//                   </div>
//                 )}

//                 {userChoice === "はい" && (
//                   <div className={styles.modalButtons}>
//                     <button
//                       className={styles.modalButton}
//                       onClick={() => setReturnStep(3)}
//                     >
//                       署名へ
//                     </button>
//                     <button
//                       className={styles.modalButton}
//                       onClick={closeReturnModal}
//                     >
//                       戻る
//                     </button>
//                   </div>
//                 )}
//               </>
//             )}

//             {returnStep === 3 && (
//               <>
//                 <br />
//                 <div className={styles.signatureWrapper}>
//                   <SignatureCanvas
//                     ref={padRef}
//                     canvasProps={{
//                       className: styles.signatureCanvas,
//                       style: { width: "100%", height: "180px" },
//                     }}
//                   />
//                 </div>

//                 <div
//                   className={styles.modalButtons}
//                   style={{ marginTop: 10 }}
//                 >
//                   <button
//                     className={styles.modalButton}
//                     onClick={clearSignature}
//                   >
//                     Clear
//                   </button>
//                   <button
//                     className={styles.modalButton}
//                     onClick={saveSignature}
//                   >
//                     署名保存
//                   </button>
//                 </div>

//                 {signatureDataURL && (
//                   <img
//                     src={signatureDataURL}
//                     alt="signature preview"
//                     style={{
//                       marginTop: 10,
//                       border: "1px solid #ccc",
//                       width: 200,
//                     }}
//                   />
//                 )}

//                 <div
//                   className={styles.modalButtons}
//                   style={{ marginTop: 10 }}
//                 >
//                   <button
//                     className={styles.modalButton}
//                     onClick={completeReturn}
//                     disabled={!signatureDataURL}
//                     style={{
//                       opacity: signatureDataURL ? 1 : 0.5,
//                       cursor: signatureDataURL ? "pointer" : "not-allowed",
//                     }}
//                   >
//                     返却完了
//                   </button>
//                   <button
//                     className={styles.modalButton}
//                     onClick={closeReturnModal}
//                   >
//                     閉じる
//                   </button>
//                 </div>

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
//     </div>
//   )
// }









// "use client"

// import { useState, useEffect, useRef } from "react"
// import Image from "next/image"
// import styles from "./index.module.css"
// import NavBar from "@/components/navBar/navBar"
// import SignatureCanvas from "react-signature-canvas"

// // ページでブラウザキャッシュを使わない設定
// export const fetchCache = "force-no-store"

// interface Product {
//   id: number
//   name: string
//   brand: string
//   color: string
//   feature: string
//   place: string
//   img_url: string
//   created_at: string
//   category: string
//   applicant?: string | null
//   return_at?: string | null
// }

// export default function Home() {
//   // 一覧と検索結果
//   const [products, setProducts] = useState<Product[]>([])
//   const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

//   // フィルタ
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedCategory, setSelectedCategory] = useState("")
//   const [startDate, setStartDate] = useState("")
//   const [endDate, setEndDate] = useState("")
//   const [hideCompleted, setHideCompleted] = useState(false) // 返却済み非表示

//   // 詳細モーダル
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

//   // 状態系
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [isMobile, setIsMobile] = useState(false)

//   // 返却処理用の状態
//   const [showReturnModal, setShowReturnModal] = useState(false)
//   const [returnStep, setReturnStep] = useState<1 | 2 | 3>(1) // 1:氏名・日付入力, 2:確認(はい/いいえ), 3:署名と完了
//   const [returnName, setReturnName] = useState("")
//   const [returnDate, setReturnDate] = useState("")
//   const [userChoice, setUserChoice] = useState<"" | "はい" | "いいえ">("")
//   const [isReturnCompleted, setIsReturnCompleted] = useState(false)

//   // 署名パッド
//   const padRef = useRef<InstanceType<typeof SignatureCanvas> | null>(null)
//   const [signatureDataURL, setSignatureDataURL] = useState<string | null>(null)

//   // 画面幅によるモバイル判定
//   useEffect(() => {
//     const onResize = () => setIsMobile(window.innerWidth < 1024)
//     onResize()
//     window.addEventListener("resize", onResize)
//     return () => window.removeEventListener("resize", onResize)
//   }, [])

//   // データ取得（最新順で30件までを初期表示）
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true)
//         setError(null)

//         const response = await fetch("/api/productList", {
//           method: "GET",
//           headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
//         })
//         if (!response.ok) throw new Error("データの取得に失敗しました")

//         const result = await response.json()
//         const sorted: Product[] = result.data.sort(
//           (a: Product, b: Product) =>
//             new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
//         )
//         setProducts(sorted)
//         setFilteredProducts(sorted.slice(0, 30))
//       } catch (err) {
//         setError(err instanceof Error ? err.message : "エラーが発生しました")
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchData()
//   }, [])

  

//   // 「返却済み(完了)」
//   const isReturned = (p: Product) => Boolean((p.applicant ?? "").trim() && (p.return_at ?? "").trim())

//   // 検索・フィルタ
//   useEffect(() => {
//     let base = [...products].sort(
//       (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
//     )

//     const hasSearch = searchQuery.trim() !== ""
//     const hasDate = startDate !== "" || endDate !== ""

//     if (hasSearch) {
//       const q = searchQuery.toLowerCase()
//       base = base.filter((p) =>
//         [p.id, p.name, p.brand, p.color, p.feature, p.place, p.category].some((v) =>
//           String(v).toLowerCase().includes(q),
//         ),
//       )
//     }

//     if (selectedCategory) {
//       base = base.filter((p) => p.category === selectedCategory)
//     }

//     if (startDate || endDate) {
//       const start = startDate ? new Date(`${startDate}T00:00:00`) : null
//       const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null
//       base = base.filter((p) => {
//         const createdAt = new Date(p.created_at)
//         return (!start || createdAt >= start) && (!end || createdAt <= end)
//       })
//     }

//     // 返却済み(完了)項目隠し
//     if (hideCompleted) {
//       base = base.filter((p) => !isReturned(p))
//     }

//     if (!hasSearch && !hasDate && !hideCompleted) base = base.slice(0, 30)

//     setFilteredProducts(base)
//   }, [searchQuery, selectedCategory, startDate, endDate, hideCompleted, products])

//   // Escで各種モーダルを閉じる
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") {
//         setSelectedProduct(null)
//         setShowReturnModal(false)
//         setReturnStep(1)
//         setUserChoice("")
//       }
//     }
//     window.addEventListener("keydown", onKey)
//     return () => window.removeEventListener("keydown", onKey)
//   }, [])

//   // 返却処理：ステップ1からステップ2へ
//   const goReturnStep2 = () => {
//     if (!returnName.trim() || !returnDate.trim()) {
//       alert("氏名と日付を入力してください。")
//       return
//     }
//     setReturnStep(2)
//     setUserChoice("")
//   }

//   // 確認「はい」
//   const handleYes = () => setUserChoice("はい")

//   // 確認「いいえ」
//   const handleNo = () => {
//     setUserChoice("いいえ")
//     setShowReturnModal(false)
//     setReturnName("")
//     setReturnDate("")
//     setReturnStep(1)
//   }

//   // 署名のクリア
//   const clearSignature = () => {
//     padRef.current?.clear()
//     setSignatureDataURL(null)
//   }

//   // 署名の保存
//   const saveSignature = async () => {
//     const dataURL = padRef.current?.toDataURL("image/png")
//     if (!dataURL) {
//       alert("署名がありません。")
//       return
//     }
//     setSignatureDataURL(dataURL)
//     try {
//       const res = await fetch(`/api/signatureSave`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ signatureData: dataURL, product_id: selectedProduct?.id }),
//       })
//       if (!res.ok) throw new Error("署名保存に失敗しました")
//       alert("署名を保存しました。")
//     } catch (err) {
//       console.error(err)
//       alert("署名保存中にエラーが発生しました")
//     }
//   }

//   // 返却完了処理
//   const completeReturn = async () => {
//     if (!selectedProduct) return
//     try {
//       const res = await fetch("/api/returnRequest", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           product_id: selectedProduct.id,
//           applicant: returnName,
//           return_at: returnDate
//         }),
//       })
//       if (!res.ok) throw new Error("返却処理に失敗しました")

//       // UI 即時反映: applicant/return_at を埋めて完了状態に表示
//       setProducts((prev) =>
//         prev.map((p) =>
//           p.id === selectedProduct.id ? { ...p, applicant: returnName, return_at: returnDate } : p,
//         ),
//       )
//       setFilteredProducts((prev) =>
//         prev.map((p) =>
//           p.id === selectedProduct.id ? { ...p, applicant: returnName, return_at: returnDate } : p,
//         ),
//       )
//       setIsReturnCompleted(true)
//       setSelectedProduct(null)
//       window.location.reload()
//       alert("返却処理が完了しました")
//     } catch (err) {
//       console.error(err)
//       alert("エラーが発生しました")
//     }
//   }

//   // 返却処理モーダルを閉じる
//   const closeReturnModal = () => {
//     setShowReturnModal(false)
//     setReturnStep(1)
//     setUserChoice("")
//     setReturnName("")
//     setReturnDate("")
//     clearSignature()
//     setIsReturnCompleted(false)
//   }

//   return (
//     <div className={styles.pageWrapper}>
//       <div className={styles.container}>
//         <div className={styles.filterContainer}>
//           <div className={styles.searchSection}>
//             <div className={styles.searchBarWrapper}>
//               <label htmlFor="searchQuery" className={styles.filterLabel}>検索</label>
//               <input
//                 id="searchQuery"
//                 className={styles.searchBar}
//                 placeholder="商品名やブランドを入力"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>

//             <div className={styles.categoryWrapper}>
//               <label htmlFor="category" className={styles.filterLabel}>カテゴリー</label>
//               <select
//                 id="category"
//                 className={styles.selectBox}
//                 value={selectedCategory}
//                 onChange={(e) => setSelectedCategory(e.target.value)}
//               >
//                 <option value="">すべて</option>
//                 <option value="イヤホン">イヤホン</option>
//                 <option value="スマートフォン">スマートフォン</option>
//                 <option value="周辺機器">周辺機器</option>
//                 <option value="財布">財布</option>
//                 <option value="時計">時計</option>
//                 <option value="水筒">水筒</option>
//                 <option value="文具">文具</option>
//                 <option value="かばん">かばん</option>
//                 <option value="衣類">衣類</option>
//               </select>
//             </div>
//           </div>

//           {isMobile ? (
//             <div className={styles.dateFilter}>
//               <div className={styles.dateFilterRow}>
//                 <label htmlFor="startDate">開始日</label>
//                 <input
//                   type="date"
//                   id="startDate"
//                   className={styles.dateInput}
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                 />
//               </div>
//               <div className={styles.dateFilterRow}>
//                 <label htmlFor="endDate">終了日</label>
//                 <input
//                   type="date"
//                   id="endDate"
//                   className={styles.dateInput}
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                 />
//               </div>

//               {/* ▼ 返却済み非表示ボタン */}
//               <button
//                 className={`${styles.hideCompletedButton} ${hideCompleted ? styles.active : ""}`}
//                 onClick={() => setHideCompleted((s) => !s)}
//               >
//                 {hideCompleted ? "✓ " : ""}返却済みを非表示
//               </button>
//             </div>
//           ) : (
//             <div className={styles.dateFilter}>
//               <label htmlFor="startDate">開始日</label>
//               <input
//                 type="date"
//                 id="startDate"
//                 className={styles.dateInput}
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//               />
//               <span className={styles.dateSeparator}>-</span>
//               <label htmlFor="endDate">終了日</label>
//               <input
//                 type="date"
//                 id="endDate"
//                 className={styles.dateInput}
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//               />

//               {/* ▼ 返却済み非表示ボタン */}
//               <button
//                 className={`${styles.hideCompletedButton} ${hideCompleted ? styles.active : ""}`}
//                 onClick={() => setHideCompleted((s) => !s)}
//               >
//                 {hideCompleted ? "✓ " : ""}返却済みを非表示
//               </button>
//             </div>
//           )}
//         </div>

//         {loading && <p className={styles.loading}>Loading...</p>}
//         {error && <p className={styles.error}>⚠️ {error}</p>}

//         {!loading && !error && (
//           <div className={styles.resultsContainer}>
//             <div className={styles.resultsHeader}>
//               <h2 className={styles.resultsTitle}>検索結果: {filteredProducts.length}件</h2>
//             </div>
//             <ul className={styles.productLists}>
//               {filteredProducts.map((product) => {
//                 const returned = isReturned(product)
//                 return (
//                   <li
//                     key={product.id}
//                     className={returned ? `${styles.productItem} ${styles.returnedItem}` : styles.productItem}
//                     onClick={() => setSelectedProduct(product)}
//                     title={returned ? "返却完了（参照のみ）" : "詳細を表示"}
//                   >
//                     <div className={styles.productImageContainer}>
//                       <Image
//                         src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${product.img_url}`}
//                         alt="Product Image"
//                         width={150}
//                         height={150}
//                         className={styles.productImage}
//                         sizes="(max-width: 767px) 45vw, 150px"
//                       />
//                     </div>
//                     <div className={styles.productDetails}>
//                       <div className={styles.productId}>ID: {product.id}</div>
//                       <div className={styles.productName}>{product.name}</div>
//                       <div className={styles.productInfo}><span className={styles.label}>ブランド:</span> {product.brand}</div>
//                       <div className={styles.productInfo}><span className={styles.label}>場所:</span> {product.place}</div>
//                       <div className={styles.productInfo}><span className={styles.label}>カテゴリー:</span> {product.category}</div>
//                       <div className={styles.productDate}>{new Date(product.created_at).toLocaleDateString()}</div>
//                       {returned && <div className={styles.returnCompletedLabel}>返却完了</div>}
//                     </div>
//                   </li>
//                 )
//               })}
//             </ul>
//           </div>
//         )}

//         {selectedProduct && (
//           <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
//             <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//               <button className={styles.closeButton} onClick={() => setSelectedProduct(null)}>×</button>

//               <div className={styles.modalContent}>
//                 {/* 画像 */}
//                 <div className={styles.modalImageContainer}>
//                   <div className={styles.modalImageBox}>
//                     <Image
//                       src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
//                       alt="Product Image"
//                       fill
//                       sizes="(max-width: 767px) 90vw, 40vw"
//                       className={styles.modalImage}
//                     />
//                   </div>
//                 </div>

//                 <div className={styles.modalDetails}>
//                   <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
//                   <div className={styles.modalInfo}>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>商品ID：</span>{selectedProduct.id}</div>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>ブランド：</span>{selectedProduct.brand}</div>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>色：</span>{selectedProduct.color}</div>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>特徴：</span>{selectedProduct.feature}</div>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>場所：</span>{selectedProduct.place}</div>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>カテゴリー：</span>{selectedProduct.category}</div>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>登録日：</span>{new Date(selectedProduct.created_at).toLocaleDateString()}</div>
//                   </div>

//                   {isReturned(selectedProduct) ? (
//                     <p className={styles.alreadyReturned}>すでに返却完了されています。</p>
//                   ) : (
//                     <div className={styles.modalButtons}>
//                       <button
//                         className={styles.modalButton}
//                         onClick={() => {
//                           setShowReturnModal(true)
//                           setReturnStep(1)
//                           setUserChoice("")
//                         }}
//                       >
//                         返却処理
//                       </button>
//                       <button className={styles.modalButton} onClick={() => setSelectedProduct(null)}>閉じる</button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       <NavBar />

//       {showReturnModal && selectedProduct && (
//         <div className={styles.modalOverlay} onClick={closeReturnModal}>
//           <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//             <button className={styles.closeButton} onClick={closeReturnModal}>×</button>

//             {/* 返却処理モーダル内 */}
//             <div className={styles.returnModalImageBox}>
//               <Image
//                 src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
//                 alt="Product Image"
//                 fill
//                 sizes="200px"
//                 className={styles.modalImage}
//               />
//             </div>

//             <p className={styles.returnModalText}><strong>商品ID:</strong> {selectedProduct.id}</p>
//             <p className={styles.returnModalText}><strong>名称:</strong> {selectedProduct.name}</p>
//             <p className={styles.returnModalText}><strong>場所:</strong> {selectedProduct.place}</p>
//             <p className={styles.returnModalText}><strong>特徴:</strong> {selectedProduct.feature}</p>

//             {returnStep === 1 && (
//               <>
//                 <div className={styles.returnModalText}>
//                   <input
//                     type="text"
//                     placeholder="受領者（氏名）"
//                     value={returnName}
//                     onChange={(e) => setReturnName(e.target.value)}
//                   />
//                   <div style={{ height: 5 }}></div>
//                   <input
//                     type="date"
//                     placeholder="返却日"
//                     value={returnDate}
//                     onChange={(e) => setReturnDate(e.target.value)}
//                   />
//                 </div>
//                 <div className={styles.modalButtons}>
//                   <button className={styles.modalButton} onClick={goReturnStep2}>次へ</button>
//                   <button className={styles.modalButton} onClick={closeReturnModal}>戻る</button>
//                 </div>
//               </>
//             )}

//             {returnStep === 2 && (
//               <>
//                 <p className={`${styles.confirmMessage} ${styles.returnModalText}`}>
//                   本当に自分のものと間違いないですか？<br />
//                   後々に問題が起きた場合、責任を負うことになりますがよろしいですか？
//                 </p>

//                 {userChoice === "" && (
//                   <div className={styles.modalButtons}>
//                     <button className={styles.modalButton} onClick={handleYes}>はい</button>
//                     <button className={styles.modalButton} onClick={handleNo}>いいえ</button>
//                   </div>
//                 )}

//                 {userChoice === "はい" && (
//                   <div className={styles.modalButtons}>
//                     <button className={styles.modalButton} onClick={() => setReturnStep(3)}>署名へ</button>
//                     <button className={styles.modalButton} onClick={closeReturnModal}>戻る</button>
//                   </div>
//                 )}
//               </>
//             )}

//             {returnStep === 3 && (
//               <>
//                 <br />
//                 <div className={styles.signatureWrapper}>
//                   <SignatureCanvas
//                     ref={padRef}
//                     canvasProps={{
//                       className: styles.signatureCanvas,
//                       style: { width: "100%", height: "180px" },
//                     }}
//                   />
//                 </div>

//                 <div className={styles.modalButtons} style={{ marginTop: 10 }}>
//                   <button className={styles.modalButton} onClick={clearSignature}>Clear</button>
//                   <button className={styles.modalButton} onClick={saveSignature}>署名保存</button>
//                 </div>

//                 {signatureDataURL && (
//                   <img
//                     src={signatureDataURL}
//                     alt="signature preview"
//                     style={{ marginTop: 10, border: "1px solid #ccc", width: 200 }}
//                   />
//                 )}

//                 <div className={styles.modalButtons} style={{ marginTop: 10 }}>
//                    {/* 🔸 署名が存在する場合のみボタンを有効 */}
//                     <button
//                       className={styles.modalButton}
//                       onClick={completeReturn}
//                       disabled={!signatureDataURL}
//                       style={{
//                         opacity: signatureDataURL ? 1 : 0.5,
//                         cursor: signatureDataURL ? "pointer" : "not-allowed",
//                       }}
//                     >
//                       返却完了
//                     </button>
//                   <button className={styles.modalButton} onClick={closeReturnModal}>閉じる</button>
//                 </div>

//                 {isReturnCompleted && <p className={styles.returnCompletedLabel}>返却が完了しました。</p>}
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }







// "use client"

// import { useState, useEffect, useRef } from "react"
// import Image from "next/image"
// import styles from "./index.module.css"
// import NavBar from "@/components/navBar/navBar"
// import SignatureCanvas from "react-signature-canvas"

// // ページでブラウザキャッシュを使わない設定
// export const fetchCache = "force-no-store"

// interface Product {
//   id: number
//   name: string
//   brand: string
//   color: string
//   feature: string
//   place: string
//   img_url: string
//   created_at: string
//   category: string
//   // 返却完了の表示用フラグ（サーバ側に列がある場合はそれを使用）
//   return_completed?: "はい" | ""
// }

// export default function Home() {
//   // 一覧と検索結果
//   const [products, setProducts] = useState<Product[]>([])
//   const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

//   // フィルタ
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedCategory, setSelectedCategory] = useState("")
//   const [startDate, setStartDate] = useState("")
//   const [endDate, setEndDate] = useState("")

//   // 詳細モーダル
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

//   // 状態系
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [isMobile, setIsMobile] = useState(false)

//   // 返却処理用の状態
//   const [showReturnModal, setShowReturnModal] = useState(false)
//   const [returnStep, setReturnStep] = useState<1 | 2 | 3>(1) // 1:氏名・日付入力, 2:確認(はい/いいえ), 3:署名と完了
//   const [returnName, setReturnName] = useState("")
//   const [returnDate, setReturnDate] = useState("")
//   const [userChoice, setUserChoice] = useState<"" | "はい" | "いいえ">("")
//   const [isReturnCompleted, setIsReturnCompleted] = useState(false)

//   // 署名パッド
//   const padRef = useRef<InstanceType<typeof SignatureCanvas> | null>(null)
//   const [signatureDataURL, setSignatureDataURL] = useState<string | null>(null)

//   // 画面幅によるモバイル判定
//   useEffect(() => {
//     const onResize = () => setIsMobile(window.innerWidth < 1024)
//     onResize()
//     window.addEventListener("resize", onResize)
//     return () => window.removeEventListener("resize", onResize)
//   }, [])

//   // データ取得（最新順で30件までを初期表示）
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true)
//         setError(null)

//         const response = await fetch("/api/productList", {
//           method: "GET",
//           headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
//         })
//         if (!response.ok) throw new Error("データの取得に失敗しました")

//         const result = await response.json()
//         const sorted: Product[] = result.data.sort(
//           (a: Product, b: Product) =>
//             new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
//         )
//         setProducts(sorted)
//         setFilteredProducts(sorted.slice(0, 30))
//       } catch (err) {
//         setError(err instanceof Error ? err.message : "エラーが発生しました")
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchData()
//   }, [])

//   // 検索・フィルタ
//   useEffect(() => {
//     let base = [...products].sort(
//       (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
//     )

//     const hasSearch = searchQuery.trim() !== ""
//     const hasDate = startDate !== "" || endDate !== ""

//     if (hasSearch) {
//       const q = searchQuery.toLowerCase()
//       base = base.filter((p) =>
//         [p.id, p.name, p.brand, p.color, p.feature, p.place, p.category]
//           .some((v) => String(v).toLowerCase().includes(q)),
//       )
//     }

//     if (selectedCategory) {
//       base = base.filter((p) => p.category === selectedCategory)
//     }

//     if (startDate || endDate) {
//       const start = startDate ? new Date(`${startDate}T00:00:00`) : null
//       const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null
//       base = base.filter((p) => {
//         const createdAt = new Date(p.created_at)
//         return (!start || createdAt >= start) && (!end || createdAt <= end)
//       })
//     }

//     if (!hasSearch && !hasDate) base = base.slice(0, 30)

//     setFilteredProducts(base)
//   }, [searchQuery, selectedCategory, startDate, endDate, products])

//   // Escで各種モーダルを閉じる
//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (e.key === "Escape") {
//         setSelectedProduct(null)
//         setShowReturnModal(false)
//         setReturnStep(1)
//         setUserChoice("")
//       }
//     }
//     window.addEventListener("keydown", onKey)
//     return () => window.removeEventListener("keydown", onKey)
//   }, [])

//   // 返却処理：ステップ1からステップ2へ
//   const goReturnStep2 = () => {
//     if (!returnName.trim() || !returnDate.trim()) {
//       alert("氏名と日付を入力してください。")
//       return
//     }
//     setReturnStep(2)
//     setUserChoice("")
//   }

//   // 確認「はい」
//   const handleYes = () => setUserChoice("はい")

//   // 確認「いいえ」
//   const handleNo = () => {
//     setUserChoice("いいえ")
//     setShowReturnModal(false)
//     setReturnStep(1)
//   }

//   // 署名のクリア
//   const clearSignature = () => {
//     padRef.current?.clear()
//     setSignatureDataURL(null)
//   }

//   // 署名の保存（必要に応じてAPIを調整）
//   const saveSignature = async () => {
//     const dataURL = padRef.current?.toDataURL("image/png")
//     if (!dataURL) {
//       alert("署名がありません。")
//       return
//     }
//     setSignatureDataURL(dataURL)
//     try {
//       const res = await fetch(`/api/signatureSave`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ signatureData: dataURL, product_id: selectedProduct?.id }),
//       })
//       if (!res.ok) throw new Error("署名保存に失敗しました")
//       alert("署名を保存しました。")
//     } catch (err) {
//       console.error(err)
//       alert("署名保存中にエラーが発生しました")
//     }
//   }

//   // 返却完了処理（必要に応じてAPIを調整）
//   const completeReturn = async () => {
//     if (!selectedProduct) return
//     try {
//       const res = await fetch("/api/returnRequest", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           product_id: selectedProduct.id,
//           applicant: returnName,
//           return_at: returnDate,
//           signatureDataURL,
//         }),
//       })
//       if (!res.ok) throw new Error("返却処理に失敗しました")

//       // UIを即時更新（他端末はRealtimeやポーリングで追従させる）
//       setProducts((prev) =>
//         prev.map((p) =>
//           p.id === selectedProduct.id ? { ...p, return_completed: "はい" } : p,
//         ),
//       )
//       setFilteredProducts((prev) =>
//         prev.map((p) =>
//           p.id === selectedProduct.id ? { ...p, return_completed: "はい" } : p,
//         ),
//       )
//       setIsReturnCompleted(true)
//       alert("返却処理が完了しました")
//     } catch (err) {
//       console.error(err)
//       alert("エラーが発生しました")
//     }
//   }

//   // 返却処理モーダルを閉じる
//   const closeReturnModal = () => {
//     setShowReturnModal(false)
//     setReturnStep(1)
//     setUserChoice("")
//     setReturnName("")
//     setReturnDate("")
//     clearSignature()
//     setIsReturnCompleted(false)
//   }

//   return (
//     <div className={styles.pageWrapper}>
//       <div className={styles.container}>
//         <div className={styles.filterContainer}>
//           <div className={styles.searchSection}>
//             <div className={styles.searchBarWrapper}>
//               <label htmlFor="searchQuery" className={styles.filterLabel}>検索</label>
//               <input
//                 id="searchQuery"
//                 className={styles.searchBar}
//                 placeholder="商品名やブランドを入力"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>

//             <div className={styles.categoryWrapper}>
//               <label htmlFor="category" className={styles.filterLabel}>カテゴリー</label>
//               <select
//                 id="category"
//                 className={styles.selectBox}
//                 value={selectedCategory}
//                 onChange={(e) => setSelectedCategory(e.target.value)}
//               >
//                 <option value="">すべて</option>
//                 <option value="イヤホン">イヤホン</option>
//                 <option value="スマートフォン">スマートフォン</option>
//                 <option value="周辺機器">周辺機器</option>
//                 <option value="財布">財布</option>
//                 <option value="時計">時計</option>
//                 <option value="水筒">水筒</option>
//                 <option value="文具">文具</option>
//                 <option value="かばん">かばん</option>
//                 <option value="衣類">衣類</option>
//               </select>
//             </div>
//           </div>

//           {isMobile ? (
//             <div className={styles.dateFilter}>
//               <div className={styles.dateFilterRow}>
//                 <label htmlFor="startDate">開始日</label>
//                 <input
//                   type="date"
//                   id="startDate"
//                   className={styles.dateInput}
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                 />
//               </div>
//               <div className={styles.dateFilterRow}>
//                 <label htmlFor="endDate">終了日</label>
//                 <input
//                   type="date"
//                   id="endDate"
//                   className={styles.dateInput}
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                 />
//               </div>
//             </div>
//           ) : (
//             <div className={styles.dateFilter}>
//               <label htmlFor="startDate">開始日</label>
//               <input
//                 type="date"
//                 id="startDate"
//                 className={styles.dateInput}
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//               />
//               <span className={styles.dateSeparator}>-</span>
//               <label htmlFor="endDate">終了日</label>
//               <input
//                 type="date"
//                 id="endDate"
//                 className={styles.dateInput}
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//               />
//             </div>
//           )}
//         </div>

//         {loading && <p className={styles.loading}>Loading...</p>}
//         {error && <p className={styles.error}>⚠️ {error}</p>}

//         {!loading && !error && (
//           <div className={styles.resultsContainer}>
//             <div className={styles.resultsHeader}>
//               <h2 className={styles.resultsTitle}>検索結果: {filteredProducts.length}件</h2>
//             </div>
//             <ul className={styles.productLists}>
//               {filteredProducts.map((product) => {
//                 const returned = product.return_completed === "はい"
//                 return (
//                   <li
//                     key={product.id}
//                     className={returned ? `${styles.productItem} ${styles.returnedItem}` : styles.productItem}
//                     onClick={() => setSelectedProduct(product)}
//                     title={returned ? "返却完了（参照のみ）" : "詳細を表示"}
//                   >
//                     <div className={styles.productImageContainer}>
//                       <Image
//                         src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${product.img_url}`}
//                         alt="Product Image"
//                         width={150}
//                         height={150}
//                         className={styles.productImage}
//                         sizes="(max-width: 767px) 45vw, 150px"
//                       />
//                     </div>
//                     <div className={styles.productDetails}>
//                       <div className={styles.productId}>ID: {product.id}</div>
//                       <div className={styles.productName}>{product.name}</div>
//                       <div className={styles.productInfo}><span className={styles.label}>ブランド:</span> {product.brand}</div>
//                       <div className={styles.productInfo}><span className={styles.label}>場所:</span> {product.place}</div>
//                       <div className={styles.productInfo}><span className={styles.label}>カテゴリー:</span> {product.category}</div>
//                       <div className={styles.productDate}>{new Date(product.created_at).toLocaleDateString()}</div>
//                       {returned && <div className={styles.returnCompletedLabel}>返却完了</div>}
//                     </div>
//                   </li>
//                 )
//               })}
//             </ul>
//           </div>
//         )}

//         {selectedProduct && (
//           <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
//             <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//               <button className={styles.closeButton} onClick={() => setSelectedProduct(null)}>×</button>

//               <div className={styles.modalContent}>
//                 {/* 画像を安全に収めるためのボックス（fill + contain） */}
//                 <div className={styles.modalImageContainer}>
//                   <div className={styles.modalImageBox}>
//                     <Image
//                       src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
//                       alt="Product Image"
//                       fill
//                       sizes="(max-width: 767px) 90vw, 40vw"
//                       className={styles.modalImage}
//                     />
//                   </div>
//                 </div>

//                 <div className={styles.modalDetails}>
//                   <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
//                   <div className={styles.modalInfo}>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>商品ID：</span>{selectedProduct.id}</div>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>ブランド：</span>{selectedProduct.brand}</div>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>色：</span>{selectedProduct.color}</div>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>特徴：</span>{selectedProduct.feature}</div>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>場所：</span>{selectedProduct.place}</div>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>カテゴリー：</span>{selectedProduct.category}</div>
//                     <div className={styles.modalInfoItem}><span className={styles.modalLabel}>登録日：</span>{new Date(selectedProduct.created_at).toLocaleDateString()}</div>
//                   </div>

//                   {selectedProduct.return_completed === "はい" ? (
//                     <p className={styles.alreadyReturned}>すでに返却完了されています。</p>
//                   ) : (
//                     <div className={styles.modalButtons}>
//                       <button
//                         className={styles.modalButton}
//                         onClick={() => {
//                           setShowReturnModal(true)
//                           setReturnStep(1)
//                           setUserChoice("")
//                         }}
//                       >
//                         返却処理
//                       </button>
//                       <button className={styles.modalButton} onClick={() => setSelectedProduct(null)}>閉じる</button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>

//       <NavBar />

//       {showReturnModal && selectedProduct && (
//         <div className={styles.modalOverlay} onClick={closeReturnModal}>
//           <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//             <button className={styles.closeButton} onClick={closeReturnModal}>×</button>

//             {/* 返却処理モーダル内の画像は固定サイズボックスで表示 */}
//             <div className={styles.returnModalImageBox}>
//               <Image
//                 src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
//                 alt="Product Image"
//                 fill
//                 sizes="200px"
//                 className={styles.modalImage}
//               />
//             </div>

//             <p className={styles.returnModalText}><strong>商品ID:</strong> {selectedProduct.id}</p>
//             <p className={styles.returnModalText}><strong>名称:</strong> {selectedProduct.name}</p>
//             <p className={styles.returnModalText}><strong>場所:</strong> {selectedProduct.place}</p>
//             <p className={styles.returnModalText}><strong>特徴:</strong> {selectedProduct.feature}</p>

//             {returnStep === 1 && (
//               <>
//                 <div className={styles.returnModalText}>
//                   <input
//                     type="text"
//                     placeholder="受領者（氏名）"
//                     value={returnName}
//                     onChange={(e) => setReturnName(e.target.value)}
//                   />
//                   <div style={{ height: 5 }}></div>
//                   <input
//                     type="date"
//                     placeholder="返却日"
//                     value={returnDate}
//                     onChange={(e) => setReturnDate(e.target.value)}
//                   />
//                 </div>  
//                 <div className={styles.modalButtons}>
//                   <button className={styles.modalButton} onClick={goReturnStep2}>次へ</button>
//                   <button className={styles.modalButton} onClick={closeReturnModal}>戻る</button>
//                 </div>
//               </>
//             )}

//             {returnStep === 2 && (
//               <>
//                 <p className={`${styles.confirmMessage} ${styles.returnModalText}`}>
//                   本当に自分のものと間違いないですか？<br />
//                   後々に問題が起きた場合、責任を負うことになりますがよろしいですか？
//                 </p>

//                 {userChoice === "" && (
//                   <div className={styles.modalButtons}>
//                     <button className={styles.modalButton} onClick={handleYes}>はい</button>
//                     <button className={styles.modalButton} onClick={handleNo}>いいえ</button>
//                   </div>
//                 )}

//                 {userChoice === "はい" && (
//                   <div className={styles.modalButtons}>
//                     <button className={styles.modalButton} onClick={() => setReturnStep(3)}>署名へ</button>
//                     <button className={styles.modalButton} onClick={closeReturnModal}>戻る</button>
//                   </div>
//                 )}
//               </>
//             )}

//             {returnStep === 3 && (
//               <>
//                 <br/>
//                 <div className={styles.signatureWrapper}>
//                   <SignatureCanvas ref={padRef} canvasProps={{ className: styles.signatureCanvas }} />
//                 </div>
//                 <div className={styles.modalButtons} style={{ marginTop: 10 }}>
//                   <button className={styles.modalButton} onClick={clearSignature}>Clear</button>
//                   <button className={styles.modalButton} onClick={saveSignature}>署名保存</button>
//                 </div>

//                 {signatureDataURL && (
//                   <img
//                     src={signatureDataURL}
//                     alt="signature preview"
//                     style={{ marginTop: 10, border: "1px solid #ccc", width: "100%", height: "180px" }}
//                   />
//                 )}

//                 <div className={styles.modalButtons} style={{ marginTop: 10 }}>
//                   <button className={styles.modalButton} onClick={completeReturn}>返却完了</button>
//                   <button className={styles.modalButton} onClick={closeReturnModal}>閉じる</button>
//                 </div>

//                 {isReturnCompleted && <p className={styles.returnCompletedLabel}>返却が完了しました。</p>}
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }










// "use client"
// import { useState, useEffect } from "react"
// import Image from "next/image"
// import styles from "./index.module.css"
// import NavBar from "@/components/navBar/navBar"

// export const fetchCache = "force-no-store"

// interface Product {
//   id: number
//   name: string
//   brand: string
//   color: string
//   feature: string
//   place: string
//   img_url: string
//   created_at: string
//   category: string
// }

// export default function Home() {
//   const [products, setProducts] = useState<Product[]>([])
//   const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
//   const [searchQuery, setSearchQuery] = useState("") // 検索キーワード
//   const [selectedCategory, setSelectedCategory] = useState("") // カテゴリーフィルター
//   const [startDate, setStartDate] = useState("") // 開始日
//   const [endDate, setEndDate] = useState("") // 終了日
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null) // モーダルに表示する商品
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [isMobile, setIsMobile] = useState(false)

//   // Check if device is mobile
//   useEffect(() => {
//     const checkScreenSize = () => {
//       setIsMobile(window.innerWidth < 1024)
//     }

//     // Initial check
//     checkScreenSize()

//     // Add event listener for window resize
//     window.addEventListener("resize", checkScreenSize)

//     // Cleanup
//     return () => window.removeEventListener("resize", checkScreenSize)
//   }, [])

//   // 🔹 データ取得（最新登録順にソートし、最大30件表示）
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true)
//         setError(null)

//         const response = await fetch("/api/productList", {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             "Cache-Control": "no-cache",
//           },
//         })

//         if (!response.ok) {
//           throw new Error("データの取得に失敗しました")
//         }

//         const result = await response.json()

//         // 🔹 最新登録順にソートし、最大30件を保存
//         const sortedProducts = result.data.sort(
//           (a: Product, b: Product) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
//         )

//         setProducts(result.data)
//         setFilteredProducts(sortedProducts.slice(0, 30))
//       } catch (error) {
//         setError(error instanceof Error ? error.message : "エラーが発生しました")
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchData()
//   }, [])

//   // 🔹 検索機能
//   useEffect(() => {
//     let base = [...products].sort(
//       (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//     );

//     const hasSearch = searchQuery.trim() !== "";
//     const hasDate = startDate !== "" || endDate !== "";

//     // 🔹 基本検索
//     if (hasSearch) {
//       const q = searchQuery.toLowerCase();
//       base = base.filter((p) =>
//         [p.id, p.name, p.brand, p.color, p.feature, p.place, p.category]
//           .some((v) => String(v).toLowerCase().includes(q))
//       );
//     }

//     // 🔹 カテゴリー検索
//     if (selectedCategory) {
//       base = base.filter((p) => p.category === selectedCategory);
//     }

//     // 🔹 日付検索（ローカル日付の1日範囲）
//     if (startDate || endDate) {
//       const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
//       const end   = endDate   ? new Date(`${endDate}T23:59:59.999`) : null;
//       base = base.filter((p) => {
//         const createdAt = new Date(p.created_at);
//         return (!start || createdAt >= start) && (!end || createdAt <= end);
//       });
//     }

//     // 🔹 検索/日付がない時は最新順で30件だけ
//     if (!hasSearch && !hasDate) {
//       base = base.slice(0, 30);
//     }

//     setFilteredProducts(base);
//   }, [searchQuery, selectedCategory, startDate, endDate, products]);

//   // 🔹 ESCキーでモーダルを閉じる機能
//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.key === "Escape") {
//         setSelectedProduct(null)
//       }
//     }

//     window.addEventListener("keydown", handleKeyDown)
//     return () => window.removeEventListener("keydown", handleKeyDown)
//   }, [])

//   return (
//     <div className={styles.pageWrapper}>
//       {/* No additional settings icon needed - using the original one */}

//       <div className={styles.container}>
//         {/* 🔹 検索フィルターUI */}
//         <div className={styles.filterContainer}>
//           <div className={styles.searchSection}>
//             {/* 🔍 検索バー */}
//             <div className={styles.searchBarWrapper}>
//               <label htmlFor="searchQuery" className={styles.filterLabel}>
//                 検索
//               </label>
//               <input
//                 type="text"
//                 id="searchQuery"
//                 name="searchQuery"
//                 placeholder="商品名やブランドを入力"
//                 title="検索欄に文字を入力してください"
//                 className={styles.searchBar}
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>

//             {/* 🔹 カテゴリー選択 */}
//             <div className={styles.categoryWrapper}>
//               <label htmlFor="category" className={styles.filterLabel}>
//                 カテゴリー
//               </label>
//               <select
//                 id="category"
//                 name="category"
//                 className={styles.selectBox}
//                 value={selectedCategory}
//                 onChange={(e) => setSelectedCategory(e.target.value)}
//               >
//                 <option value="">すべて</option>
//                 <option value="イヤホン">イヤホン</option>
//                 <option value="スマートフォン">スマートフォン</option>
//                 <option value="周辺機器">周辺機器</option>
//                 <option value="財布">財布</option>
//                 <option value="時計">時計</option>
//                 <option value="水筒">水筒</option>
//                 <option value="文具">文具</option>
//                 <option value="かばん">かばん</option>
//                 <option value="衣類">衣類</option>
//               </select>
//             </div>
//           </div>

//           {/* 🔹 日付検索フィールド - モバイルでは2行に分割 */}
//           {isMobile ? (
//             <div className={styles.dateFilter}>
//               <div className={styles.dateFilterRow}>
//                 <label htmlFor="startDate">開始日</label>
//                 <input
//                   type="date"
//                   id="startDate"
//                   name="startDate"
//                   className={styles.dateInput}
//                   title="開始日を選択してください"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                 />
//               </div>
//               <div className={styles.dateFilterRow}>
//                 <label htmlFor="endDate">終了日</label>
//                 <input
//                   type="date"
//                   id="endDate"
//                   name="endDate"
//                   className={styles.dateInput}
//                   title="終了日を選択してください"
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                 />
//               </div>
//             </div>
//           ) : (
//             <div className={styles.dateFilter}>
//               <label htmlFor="startDate">開始日</label>
//               <input
//                 type="date"
//                 id="startDate"
//                 name="startDate"
//                 className={styles.dateInput}
//                 title="開始日を選択してください"
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//               />

//               <span className={styles.dateSeparator}>-</span>

//               <label htmlFor="endDate">終了日</label>
//               <input
//                 type="date"
//                 id="endDate"
//                 name="endDate"
//                 className={styles.dateInput}
//                 title="終了日を選択してください"
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//               />
//             </div>
//           )}
//         </div>

//         {/* ローディング表示 */}
//         {loading && <p className={styles.loading}>Loading...</p>}

//         {/* エラーメッセージ表示 */}
//         {error && <p className={styles.error}>⚠️ {error}</p>}

//         {/* 🔹 商品リスト */}
//         {!loading && !error && (
//           <div className={styles.resultsContainer}>
//             <div className={styles.resultsHeader}>
//               <h2 className={styles.resultsTitle}>検索結果: {filteredProducts.length}件</h2>
//             </div>
//             <ul className={styles.productLists}>
//               {filteredProducts.map((product) => (
//                 <li key={product.id} className={styles.productItem} onClick={() => setSelectedProduct(product)}>
//                   <div className={styles.productImageContainer}>
//                     <Image
//                       src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${product.img_url}`}
//                       alt="Product Image"
//                       width={150}
//                       height={150}
//                       className={styles.productImage}
//                     />
//                   </div>
//                   <div className={styles.productDetails}>
//                     <div className={styles.productId}>ID: {product.id}</div>
//                     <div className={styles.productName}>{product.name}</div>
//                     <div className={styles.productInfo}>
//                       <span className={styles.label}>ブランド:</span> {product.brand}
//                     </div>
//                     <div className={styles.productInfo}>
//                       <span className={styles.label}>場所:</span> {product.place}
//                     </div>
//                     <div className={styles.productInfo}>
//                       <span className={styles.label}>カテゴリー:</span> {product.category}
//                     </div>
//                     <div className={styles.productDate}>{new Date(product.created_at).toLocaleDateString()}</div>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}

//         {/* 🔹 モーダル（選択された商品の詳細を表示） */}
//         {selectedProduct && (
//           <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
//             <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//               <button className={styles.closeButton} onClick={() => setSelectedProduct(null)}>
//                 ×
//               </button>
//               <div className={styles.modalContent}>
//                 <div className={styles.modalImageContainer}>
//                   <Image
//                     src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
//                     alt="Product Image"
//                     width={300}
//                     height={300}
//                     className={styles.modalImage}
//                   />
//                 </div>
//                 <div className={styles.modalDetails}>
//                   <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
//                   <div className={styles.modalInfo}>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>商品ID：</span>
//                       {selectedProduct.id}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>ブランド：</span>
//                       {selectedProduct.brand}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>色：</span>
//                       {selectedProduct.color}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>特徴：</span>
//                       {selectedProduct.feature}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>場所：</span>
//                       {selectedProduct.place}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>カテゴリー：</span>
//                       {selectedProduct.category}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>登録日：</span>
//                       {new Date(selectedProduct.created_at).toLocaleDateString()}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//       <NavBar />
//     </div>
//   )
// }





// "use client"
// import { useState, useEffect } from "react"
// import Image from "next/image"
// import styles from "./index.module.css"
// import NavBar from "@/components/navBar/navBar"

// export const fetchCache = "force-no-store"

// interface Product {
//   id: number
//   name: string
//   brand: string
//   color: string
//   feature: string
//   place: string
//   img_url: string
//   created_at: string
//   category: string
// }

// export default function Home() {
//   const [products, setProducts] = useState<Product[]>([])
//   const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
//   const [searchQuery, setSearchQuery] = useState("") // 検索キーワード
//   const [selectedCategory, setSelectedCategory] = useState("") // カテゴリーフィルター
//   const [startDate, setStartDate] = useState("") // 開始日
//   const [endDate, setEndDate] = useState("") // 終了日
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null) // モーダルに表示する商品
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [isMobile, setIsMobile] = useState(false)

//   // Check if device is mobile
//   useEffect(() => {
//     const checkScreenSize = () => {
//       setIsMobile(window.innerWidth < 1024)
//     }

//     // Initial check
//     checkScreenSize()

//     // Add event listener for window resize
//     window.addEventListener("resize", checkScreenSize)

//     // Cleanup
//     return () => window.removeEventListener("resize", checkScreenSize)
//   }, [])

//   // 🔹 データ取得（最新登録順にソートし、最大30件表示）
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true)
//         setError(null)

//         const response = await fetch("/api/productList", {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             "Cache-Control": "no-cache",
//           },
//         })

//         if (!response.ok) {
//           throw new Error("データの取得に失敗しました")
//         }

//         const result = await response.json()

//         // 🔹 最新登録順にソートし、最大30件を保存
//         const sortedProducts = result.data.sort(
//           (a: Product, b: Product) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
//         )

//         setProducts(result.data)
//         setFilteredProducts(sortedProducts.slice(0, 30))
//       } catch (error) {
//         setError(error instanceof Error ? error.message : "エラーが発生しました")
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchData()
//   }, [])

//   // 🔹 検索機能
//   useEffect(() => {
//     let filtered = products

//     const hasSearch = searchQuery.trim() !== ""
//     const hasDate = startDate !== "" || endDate !== ""

//     // 🔹 基本検索
//     if (searchQuery) {
//       filtered = filtered.filter((product) =>
//         [product.id, product.name, product.brand, product.color, product.feature, product.place, product.category].some(
//           (value) => String(value).toLowerCase().includes(searchQuery.toLowerCase()),
//         ),
//       )
//     }

//     // 🔹 カテゴリー検索
//     if (selectedCategory) {
//       filtered = filtered.filter((product) => product.category === selectedCategory)
//     }

//     // 🔹 日付検索
//     if (startDate || endDate) {
//       const start = startDate ? new Date(`${startDate}T00:00:00`) : null
//       const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null

//       filtered = filtered.filter((product) => {
//         const createdAt = new Date(product.created_at)
//         return (!start || createdAt >= start) && (!end || createdAt <= end)
//       })
//     }

//     // 🔹 検索または日付指定がない場合、最大30件のみ表示
//     if (!hasSearch && !hasDate) {
//       filtered = filtered.slice(0, 30)
//     }

//     setFilteredProducts(filtered)
//   }, [searchQuery, selectedCategory, startDate, endDate, products])

//   // 🔹 ESCキーでモーダルを閉じる機能
//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.key === "Escape") {
//         setSelectedProduct(null)
//       }
//     }

//     window.addEventListener("keydown", handleKeyDown)
//     return () => window.removeEventListener("keydown", handleKeyDown)
//   }, [])

//   return (
//     <div className={styles.pageWrapper}>
//       {/* No additional settings icon needed - using the original one */}

//       <div className={styles.container}>
//         {/* 🔹 検索フィルターUI */}
//         <div className={styles.filterContainer}>
//           <div className={styles.searchSection}>
//             {/* 🔍 検索バー */}
//             <div className={styles.searchBarWrapper}>
//               <label htmlFor="searchQuery" className={styles.filterLabel}>
//                 検索
//               </label>
//               <input
//                 type="text"
//                 id="searchQuery"
//                 name="searchQuery"
//                 placeholder="商品名やブランドを入力"
//                 title="検索欄に文字を入力してください"
//                 className={styles.searchBar}
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>

//             {/* 🔹 カテゴリー選択 */}
//             <div className={styles.categoryWrapper}>
//               <label htmlFor="category" className={styles.filterLabel}>
//                 カテゴリー
//               </label>
//               <select
//                 id="category"
//                 name="category"
//                 className={styles.selectBox}
//                 value={selectedCategory}
//                 onChange={(e) => setSelectedCategory(e.target.value)}
//               >
//                 <option value="">すべて</option>
//                 <option value="イヤホン">イヤホン</option>
//                 <option value="スマートフォン">スマートフォン</option>
//                 <option value="周辺機器">周辺機器</option>
//                 <option value="財布">財布</option>
//                 <option value="時計">時計</option>
//                 <option value="水筒">水筒</option>
//                 <option value="文具">文具</option>
//                 <option value="かばん">かばん</option>
//                 <option value="衣類">衣類</option>
//               </select>
//             </div>
//           </div>

//           {/* 🔹 日付検索フィールド - モバイルでは2行に分割 */}
//           {isMobile ? (
//             <div className={styles.dateFilter}>
//               <div className={styles.dateFilterRow}>
//                 <label htmlFor="startDate">開始日</label>
//                 <input
//                   type="date"
//                   id="startDate"
//                   name="startDate"
//                   className={styles.dateInput}
//                   title="開始日を選択してください"
//                   value={startDate}
//                   onChange={(e) => setStartDate(e.target.value)}
//                 />
//               </div>
//               <div className={styles.dateFilterRow}>
//                 <label htmlFor="endDate">終了日</label>
//                 <input
//                   type="date"
//                   id="endDate"
//                   name="endDate"
//                   className={styles.dateInput}
//                   title="終了日を選択してください"
//                   value={endDate}
//                   onChange={(e) => setEndDate(e.target.value)}
//                 />
//               </div>
//             </div>
//           ) : (
//             <div className={styles.dateFilter}>
//               <label htmlFor="startDate">開始日</label>
//               <input
//                 type="date"
//                 id="startDate"
//                 name="startDate"
//                 className={styles.dateInput}
//                 title="開始日を選択してください"
//                 value={startDate}
//                 onChange={(e) => setStartDate(e.target.value)}
//               />

//               <span className={styles.dateSeparator}>-</span>

//               <label htmlFor="endDate">終了日</label>
//               <input
//                 type="date"
//                 id="endDate"
//                 name="endDate"
//                 className={styles.dateInput}
//                 title="終了日を選択してください"
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//               />
//             </div>
//           )}
//         </div>

//         {/* ローディング表示 */}
//         {loading && <p className={styles.loading}>Loading...</p>}

//         {/* エラーメッセージ表示 */}
//         {error && <p className={styles.error}>⚠️ {error}</p>}

//         {/* 🔹 商品リスト */}
//         {!loading && !error && (
//           <div className={styles.resultsContainer}>
//             <div className={styles.resultsHeader}>
//               <h2 className={styles.resultsTitle}>検索結果: {filteredProducts.length}件</h2>
//             </div>
//             <ul className={styles.productLists}>
//               {filteredProducts.map((product) => (
//                 <li key={product.id} className={styles.productItem} onClick={() => setSelectedProduct(product)}>
//                   <div className={styles.productImageContainer}>
//                     <Image
//                       src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${product.img_url}`}
//                       alt="Product Image"
//                       width={150}
//                       height={150}
//                       className={styles.productImage}
//                     />
//                   </div>
//                   <div className={styles.productDetails}>
//                     <div className={styles.productId}>ID: {product.id}</div>
//                     <div className={styles.productName}>{product.name}</div>
//                     <div className={styles.productInfo}>
//                       <span className={styles.label}>ブランド:</span> {product.brand}
//                     </div>
//                     <div className={styles.productInfo}>
//                       <span className={styles.label}>場所:</span> {product.place}
//                     </div>
//                     <div className={styles.productInfo}>
//                       <span className={styles.label}>カテゴリー:</span> {product.category}
//                     </div>
//                     <div className={styles.productDate}>{new Date(product.created_at).toLocaleDateString()}</div>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}

//         {/* 🔹 モーダル（選択された商品の詳細を表示） */}
//         {selectedProduct && (
//           <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
//             <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//               <button className={styles.closeButton} onClick={() => setSelectedProduct(null)}>
//                 ×
//               </button>
//               <div className={styles.modalContent}>
//                 <div className={styles.modalImageContainer}>
//                   <Image
//                     src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
//                     alt="Product Image"
//                     width={300}
//                     height={300}
//                     className={styles.modalImage}
//                   />
//                 </div>
//                 <div className={styles.modalDetails}>
//                   <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
//                   <div className={styles.modalInfo}>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>商品ID：</span>
//                       {selectedProduct.id}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>ブランド：</span>
//                       {selectedProduct.brand}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>色：</span>
//                       {selectedProduct.color}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>特徴：</span>
//                       {selectedProduct.feature}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>場所：</span>
//                       {selectedProduct.place}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>カテゴリー：</span>
//                       {selectedProduct.category}
//                     </div>
//                     <div className={styles.modalInfoItem}>
//                       <span className={styles.modalLabel}>登録日：</span>
//                       {new Date(selectedProduct.created_at).toLocaleDateString()}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//       <NavBar />
//     </div>
//   )
// }








// // "use client" ディレクティブ
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
//   const [searchQuery, setSearchQuery] = useState(""); // 検索キーワード
//   const [selectedCategory, setSelectedCategory] = useState(""); // カテゴリーフィルター
//   const [startDate, setStartDate] = useState(""); // 開始日
//   const [endDate, setEndDate] = useState(""); // 終了日
//   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // モーダルに表示する商品
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // 🔹 データ取得（最新登録順にソートし、最大30件表示）
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

//         // 🔹 最新登録順にソートし、最大30件を保存
//         const sortedProducts = result.data
//           .sort((a: Product, b: Product) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

//         setProducts(result.data);
//         setFilteredProducts(sortedProducts.slice(0, 30));
//       } catch (error) {
//         setError(error instanceof Error ? error.message : "エラーが発生しました");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // 🔹 検索機能
//   useEffect(() => {
//     let filtered = products;

//     const hasSearch = searchQuery.trim() !== "";
//     const hasDate = startDate !== "" || endDate !== "";

//     // 🔹 基本検索
//     if (searchQuery) {
//       filtered = filtered.filter((product) =>
//         [product.id, product.name, product.brand, product.color, product.feature, product.place, product.category]
//           .some((value) =>
//             String(value).toLowerCase().includes(searchQuery.toLowerCase())
//           )
//       );
//     }

//     // 🔹 カテゴリー検索
//     if (selectedCategory) {
//       filtered = filtered.filter((product) => product.category === selectedCategory);
//     }
    
//     // 🔹 日付検索
//     if (startDate || endDate) {
//       const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
//       const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

//       filtered = filtered.filter((product) => {
//         const createdAt = new Date(product.created_at);
//         return (!start || createdAt >= start) && (!end || createdAt <= end);
//       });
//     }

//     // 🔹 検索または日付指定がない場合、最大30件のみ表示
//     if (!hasSearch && !hasDate) {
//       filtered = filtered.slice(0, 30);
//     }
    
//     setFilteredProducts(filtered);
//   }, [searchQuery, selectedCategory, startDate, endDate, products]);

//   // 🔹 ESCキーでモーダルを閉じる機能
//   useEffect(() => {
//     const handleKeyDown = (event: KeyboardEvent) => {
//       if (event.key === "Escape") {
//         setSelectedProduct(null);
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, []);

//   return (
//     <>
//       <div className={styles.container}>
//         {/* 🔹 検索フィルターUI */}
//         <div className={styles.filterContainer}>
//           {/* 🔍 検索バー */}
//           <label htmlFor="searchQuery" className={styles.filterLabel}>検索</label>
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

//           {/* 🔹 日付検索フィールド */}
//           <div className={styles.dateFilter}>
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

//             <span className={styles.dateSeparator}>-</span>

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
//           </div>

//           {/* 🔹 カテゴリー選択 */}
//           <label htmlFor="category" className={styles.filterLabel}>カテゴリー</label>
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

//         {/* ローディング表示 */}
//         {loading && <p className={styles.loading}>Loading...</p>}

//         {/* エラーメッセージ表示 */}
//         {error && <p className={styles.error}>⚠️ {error}</p>}

//         {/* 🔹 商品リスト */}
//         {!loading && !error && (
//           <ul className={styles.productLists}>
//             {filteredProducts.map((product) => (
//               <li
//                 key={product.id}
//                 className={styles.productItem}
//                 onClick={() => setSelectedProduct(product)}
//               >
//                 <Image
//                   src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${product.img_url}`}
//                   alt="Product Image"
//                   width={100}
//                   height={100}
//                   className={styles.productImage}
//                 />
//                 <div className={styles.item}>商品ID:{product.id}</div>
//                 <div className={styles.item}>名称: {product.name}</div>
//                 <div className={styles.item}>ブランド: {product.brand}</div>
//                 <div className={styles.item}>場所: {product.place}</div>
//                 <div className={styles.item}>カテゴリー: {product.category}</div>
//                 <div className={styles.item}>登録日: {new Date(product.created_at).toLocaleDateString()}</div>
//               </li>
//             ))}
//           </ul>
//         )}

//         {/* 🔹 モーダル（選択された商品の詳細を表示） */}
//         {selectedProduct && (
//           <div className={styles.modalOverlay} onClick={() => setSelectedProduct(null)}>
//             <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
//               <button className={styles.closeButton} onClick={() => setSelectedProduct(null)}>×</button>
//               <Image
//                 src={`https://kezjxnkrmtahxlvafcuh.supabase.co/storage/v1/object/public/lost-item-pics/${selectedProduct.img_url}`}
//                 alt="Product Image"
//                 width={250}
//                 height={250}
//                 className={styles.modalImage}
//               />
//               <div className={styles.modalContent}>
//                 <h2>商品ID：{selectedProduct.id}</h2>
//                 <h2>名称：{selectedProduct.name}</h2>
//                 <p>ブランド: {selectedProduct.brand}</p>
//                 <p>色: {selectedProduct.color}</p>
//                 <p>特徴: {selectedProduct.feature}</p>
//                 <p>場所: {selectedProduct.place}</p>
//                 <p>カテゴリー: {selectedProduct.category}</p>
//                 <p>登録日: {new Date(selectedProduct.created_at).toLocaleDateString()}</p>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//       <NavBar />
//     </>
//   );
// }




// if (startDate && endDate && startDate === endDate) {
    //   const start = new Date(${startDate}T00:00:00Z);
    //   const end = new Date(${endDate}T23:59:59.999Z);
    //   filtered = filtered.filter((product) => {
    //     const reqDate = new Date(product.created_at);
    //     return (start ? reqDate >= start : true) && (end ? reqDate <= end : true);
    //   });
    // }else{
    //   const start = startDate ? new Date(startDate) : null;
    //   const end = endDate ? new Date(endDate) : null;
    //   filtered = filtered.filter((product) => {
    //     const reqDate = new Date(product.created_at);
    //     return (start ? reqDate >= start : true) && (end ? reqDate <= end : true);
    //   });
    // }

    // if (startDate == endDate) {
    //   const start = new Date(${startDate}T00:00:00Z);
    //   const end = new Date(${endDate}T23:59:59.999Z);
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
