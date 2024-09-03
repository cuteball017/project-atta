import Image from "next/image";
import Link from "next/link";

import styles from "./index.module.css";

function NavBar() {
  return (
    <div className={styles.navBar}>
      <ul>
        <li>
          <Link href="/">
            <Image src="/home.svg" alt="home" width={45} height={45} />
            <div>ホーム</div>
          </Link>
        </li>
        <li>
          <Link href="/search">
            <Image src="/search.png" alt="search" width={45} height={45} />
            <div>検索</div>
          </Link>
        </li>
        <li>
          <Link href="/register">
          <Image src="/camera.svg" alt="camera" width={45} height={45} />
          <div>登録</div>
          </Link>
        </li>
        <li>
          <Link href="/product_list">
            <Image src="/list.svg" alt="list" width={45} height={45} />
            <div>一覧</div>
          </Link>
        </li>
        <li>
          <Link href="/notification">
            <Image
              src="/notification.svg"
              alt="notification"
              width={45}
              height={45}
            />
          <div>通知</div>
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default NavBar;
