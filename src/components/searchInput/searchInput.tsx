import Image from "next/image";

import styles from "./index.module.css"

function SearchInput() {
  return (
    <>
      <div className={styles.searchInput}>
        <label>
          <Image src="/search.png" alt="search" width={45} height={45} />
        </label>
        <input type="text" placeholder="取得物をさがす"></input>
      </div>
    </>
  );
}

export default SearchInput;
