import Image from "next/image";
import styles from "./index.module.css";
import NavBar from "@/components/navBar/navBar";

export default function Home() {
  return (
    <div>
      <div className={styles.container}>
        <div className={styles.searchInput}>
          <label>
            <Image src="/search.png" alt="search" width={45} height={45} />
          </label>
          <input type="text" placeholder="取得物をさがす"></input>
        </div>
        <div className={styles.register}>
          <p>取得物を登録する</p>
          <Image src="/camera-white.svg" alt="camera" width={45} height={45} />
        </div>

        <div className={styles.recievedSchedule}>
          <h1>本日のお渡し予定</h1>
          <ul>
            <li>No.10 財布</li>
            <li>No.1 時計</li>
          </ul>
        </div>
      </div>
      <NavBar />
    </div>
  );
}
