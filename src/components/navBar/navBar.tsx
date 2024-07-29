import Image from "next/image";

import styles from "./index.module.css"

function NavBar() {
    return (
        <div className={styles.navBar}>
            <ul>
                <li>
                    <Image src="/home.svg" alt="home" width={45} height={45} />
                    <div>ホーム</div>
                </li>
                <li>
                    <Image src="/search.png" alt="search" width={45} height={45} />
                    <div>検索</div>
                </li>
                <li>
                    <Image src="/camera.svg" alt="camera" width={45} height={45} />
                    <div>登録</div>
                </li>
                <li>
                    <Image src="/list.svg" alt="list" width={45} height={45} />
                    <div>一覧</div>
                </li>
                <li>
                    <Image src="/notification.svg" alt="notification" width={45} height={45} />
                    <div>通知</div>
                </li>
            </ul>
        </div>
    );
}

export default NavBar;