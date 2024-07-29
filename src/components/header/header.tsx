import Image from "next/image";
import styles from "./index.module.css";

function Header() {
    return (
        <div className={styles.header}>
            <h1 className={styles.logo}>Atta</h1>
            <Image src="/gear.svg" alt="gear" width={32} height={32} />
        </div>
    );
}

export default Header;