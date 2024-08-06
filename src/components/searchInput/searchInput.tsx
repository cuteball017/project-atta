import Image from "next/image";

import styles from "./index.module.css";

function SearchInput({
  showUI,
  setShowUI,
}: {
  showUI: boolean;
  setShowUI: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const handleFocus = () => {
    setShowUI(true);
  };

  const handleBlur = () => {
    setShowUI(false);
  };
  return (
    <>
      <div className={styles.searchInput}>
        <label>
          <Image src="/search.png" alt="search" width={45} height={45} />
        </label>
        <input
          type="text"
          placeholder="取得物をさがす"
          onFocus={handleFocus}
          onBlur={handleBlur}
        ></input>
      </div>

      {showUI && (
        <div className={styles.additionalUI}>
          <div className={styles.category}>
            <h1 className={styles.heading}>カテゴリーを選択</h1>
            <ul>
              <li>財布</li>
              <li>時計</li>
              <li>眼鏡</li>
              <li>携帯電話</li>
              <li>その他</li>
            </ul>
          </div>

          <div className={styles.hotItems}>
            <h1 className={styles.heading}>よく調べられてるもの</h1>
            <ul>
                <li>ハンカチ</li>
                <li>イヤホン</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export default SearchInput;
