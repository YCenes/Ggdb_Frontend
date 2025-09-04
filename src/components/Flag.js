// components/Flag.js
export default function Flag({ code, title }) {
  // ISO2 -> twemoji codepoints (ör. "TR" -> "1f1f9-1f1f7")
  const cc = String(code || "").trim().toUpperCase();
  const hex = Array.from(cc)
    .map(c => (127397 + c.charCodeAt(0)).toString(16))
    .join("-");
  const src = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${hex}.svg`;

  return (
    <img
      src={src}
      alt={cc}
      title={title || cc}
      className="flag-icon me-2"
      width={18}
      height={18}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
