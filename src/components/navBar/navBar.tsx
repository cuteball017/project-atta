"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import styles from "./index.module.css"

function NavBar() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    // Initial check
    checkScreenSize()

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize)

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize)
  }, [])

  return (
    <div className={styles.navBar}>
      <ul className={styles.navList}>
        <li className={styles.navItem}>
          <Link href="/" className={styles.navLink}>
            <Image src="/home.svg" alt="home" width={isMobile ? 45 : 24} height={isMobile ? 45 : 24} />
            <span className={styles.navText}>ホーム</span>
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/register" className={styles.navLink}>
            <Image src="/camera.svg" alt="camera" width={isMobile ? 45 : 24} height={isMobile ? 45 : 24} />
            <span className={styles.navText}>登録</span>
          </Link>
        </li>
        <li className={styles.navItem}>
          <Link href="/notification" className={styles.navLink}>
            <Image src="/notification.svg" alt="notification" width={isMobile ? 45 : 24} height={isMobile ? 45 : 24} />
            <span className={styles.navText}>通知</span>
          </Link>
        </li>
      </ul>
    </div>
  )
}

export default NavBar





// import Image from "next/image";
// import Link from "next/link";

// import styles from "./index.module.css";

// function NavBar() {
//   return (
//     <div className={styles.navBar}>
//       <ul>
//         <li>
//           <Link href="/">
//             <Image src="/home.svg" alt="home" width={45} height={45} />
//             <div>ホーム</div>
//           </Link>
//         </li>
//         <li>
//           <Link href="/register">
//           <Image src="/camera.svg" alt="camera" width={45} height={45} />
//           <div>登録</div>
//           </Link>
//         </li>
//         <li>
//           <Link href="/notification">
//             <Image
//               src="/notification.svg"
//               alt="notification"
//               width={45}
//               height={45}
//             />
//           <div>通知</div>
//           </Link>
//         </li>
//       </ul>
//     </div>
//   );
// }

// export default NavBar;
