import styles from "./AnimatedLogo.module.css";

const LETTERS = ["P", "I", "N", "E", "A", "P", "P", "L", "E"] as const;

type AnimatedLogoProps = {
  variant?: "desktop" | "mobile" | "compact";
  className?: string;
  textColor?: string;
};

export default function AnimatedLogo({ variant = "desktop", className = "", textColor }: AnimatedLogoProps) {
  const variantClass = styles[variant] || styles.desktop;
  const customStyle = textColor ? ({ "--logo-color": textColor } as React.CSSProperties) : undefined;

  return (
    <div className={`${styles.logoWrapper} ${className}`} style={customStyle}>
      <span className={`${styles.brandLogo} ${variantClass}`} aria-label="PINEAPPLE Home">
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
