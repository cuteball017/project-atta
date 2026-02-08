import Image from "next/image";
import Link from "next/link";
import styles from "./index.module.css";

function Header() {
  return (
    <div className={styles.header}>
      <Link href="/" style={{textDecoration: "none"}}>
        <h1 className={styles.logo}>Atta</h1>
      </Link>
      <Image src="/gear.svg" alt="gear" width={32} height={32} />
    </div>
  );
}

export default Header;
