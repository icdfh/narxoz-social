import React from "react";
import styles from "./TabBar.module.css";

export default function TabBar({ tabs, current, onChange }) {
  return (
    <div className={styles.bar}>
      {tabs.map((t) => (
        <button
          key={t.key}
          className={current === t.key ? styles.active : styles.item}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
