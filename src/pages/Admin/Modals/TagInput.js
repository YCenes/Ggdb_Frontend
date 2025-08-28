import React, { useState } from "react";

/**
 * Ortak TagInput
 * - values: string[]
 * - setValues: (string[]) => void
 * - disabled: boolean (readonly mod)
 * - placeholder: string
 * - showDashWhenEmpty: boolean  -> disabled + boşsa "-" göster
 * - dashLabel: string           -> default "-"
 */
export default function TagInput({
  values = [],
  setValues,
  placeholder = "Type and press comma...",
  disabled = false,
  showDashWhenEmpty = true,
  dashLabel = "-",
}) {
  const [buf, setBuf] = useState("");

  const remove = (i) => {
    if (disabled) return;
    const next = values.slice();
    next.splice(i, 1);
    setValues(next);
  };

  const commit = () => {
    if (disabled) return;
    const v = buf.trim().replace(/,$/, "");
    if (v) setValues([...(values || []), v]);
    setBuf("");
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Backspace" && !buf && values?.length) {
      remove(values.length - 1);
    }
  };

  // READONLY + BOŞ ise "-" göster
  if (disabled && showDashWhenEmpty && (!values || values.length === 0)) {
    return (
      <div className="tag-input is-disabled">
        <span className="chip">{dashLabel}</span>
      </div>
    );
  }

  return (
    <div className={`tag-input ${disabled ? "is-disabled" : ""}`}>
      {(values || []).map((v, i) => (
        <span key={`${v}-${i}`} className="chip" onClick={() => remove(i)}>
          {v} {disabled ? "" : "✕"}
        </span>
      ))}

      {!disabled && (
        <input
          placeholder={placeholder}
          value={buf}
          onChange={(e) => setBuf(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit} // dışarı tıklayınca da eklesin (opsiyonel)
        />
      )}
    </div>
  );
}
