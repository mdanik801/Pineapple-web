import styles from "./MobileAnimatedLogo.module.css";

const LETTERS = ["P", "I", "N", "E", "A", "P", "P", "L", "E"] as const;

export default function MobileAnimatedLogo() {
  return (
    <div className={styles.logoWrapper}>
      <span className={styles.brandLogo} aria-label="PINEAPPLE Home">
        <span className={styles.brandMark} aria-hidden="true" />
        <span className={styles.brandText}>
          {LETTERS.map((char, index) => (
            <span
              key={index}
              className={styles.char}
              style={{ animationDelay: `${(index * 0.07).toFixed(2)}s` }}
            >
              {char}
            </span>
          ))}
        </span>
      </span>
    </div>
  );
}
