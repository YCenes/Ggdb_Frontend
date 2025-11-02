// src/pages/admin/modals/CreativeStoryModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../../../styles/pages/admin/_game-detail-admin.scss";
import TagInput from "./TagInput";

function BottomModal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="bm-wrap" role="dialog" aria-modal="true">
      <div className="bm-backdrop" onClick={onClose} />
      <div className="bm-sheet full">
        <div className="bm-body">{children}</div>
      </div>
    </div>
  );
}

function Section({ emoji, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 8px" }}>
      <span style={{ fontSize: 20 }}>{emoji}</span>
      <h4 style={{ margin: 0 }}>{title}</h4>
    </div>
  );
}

const toMoney = (v) => (v === null || v === undefined || v === "") ? "" : String(v);
const parseMoney = (s) => {
  if (s === "" || s === null || s === undefined) return null;
  const n = Number(String(s).replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
};

const normalizeDlcsLocal = (src) => {
  const arr = Array.isArray(src?.dlcs ?? src?.Dlcs) ? (src.dlcs ?? src.Dlcs) : [];
  return arr
    .map((x) => {
      if (!x) return null;
      if (typeof x === "string") return { name: x.trim(), price: null };
      const name = (x.name ?? x.Name ?? "").trim();
      const pr = x.price ?? x.Price;
      const price = (pr === "" || pr === null || pr === undefined) ? null : (Number.isFinite(+pr) ? +pr : null);
      return name ? { name, price } : null;
    })
    .filter(Boolean);
};


/**
 * İstenen alanlar:
 * Franchise (string)
 * Engines (List<string>)
 * Director (string)
 * Soundtrack (List<string>)
 * Cast (List<string>)
 * InspiredBy (string)
 * DLCs (List<string>)
 * Story (string)
 *
 * Camel/Pascal toleranslı okuma ve sadece okuma modunda "-" gösterme
 */
export default function CreativeStoryModal({ open, onClose, editable, data, onSave }) {
  const makeDraft = (src = {}) => ({
    franchise:  src.franchise  ?? src.Franchise  ?? "",
    director:   src.director   ?? src.Director   ?? "",
    inspiredBy: src.inspiredBy ?? src.InspiredBy ?? "",
    story:      src.story      ?? src.Story      ?? "",

    engines:    Array.isArray(src.engines    ?? src.Engines)    ? (src.engines    ?? src.Engines)    : [],
    soundtrack: Array.isArray(src.soundtrack ?? src.Soundtrack) ? (src.soundtrack ?? src.Soundtrack) : [],
    cast:       Array.isArray(src.cast       ?? src.Cast)       ? (src.cast       ?? src.Cast)       : [],
    dlcs:       normalizeDlcsLocal(src),
  });

  const [draft, setDraft] = useState(makeDraft(data));

  useEffect(() => {
    if (open) setDraft(makeDraft(data));
  }, [data, open]);

  // Üstteki global Save tetikleyicisi
  useEffect(() => {
    const handler = () => onSave?.(draft);
    window.addEventListener("ggdb:creative-save-request", handler);
    return () => window.removeEventListener("ggdb:creative-save-request", handler);
  }, [draft, onSave]);

  const disabled = !editable;

  const bind = useMemo(
    () => ({
      text: (k) => ({
        value: draft[k] && String(draft[k]).trim() !== "" ? draft[k] : !editable ? "-" : "",
        readOnly: !editable,
        onChange: (e) => setDraft({ ...draft, [k]: e.target.value }),
      }),
      area: (k) => ({
        value: draft[k] && String(draft[k]).trim() !== "" ? draft[k] : !editable ? "-" : "",
        readOnly: !editable,
        onChange: (e) => setDraft({ ...draft, [k]: e.target.value }),
        rows: 6,
      }),
    }),
    [draft, editable]
  );

  

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big" style={{ gap: 18 }}>
        {/* Franchise & InspiredBy */}
        <Section emoji="🧬" title="Franchise & Inspiration" />
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="col">
            <label>Franchise</label>
            <input {...bind.text("franchise")} placeholder="-" />
          </div>
          <div className="col">
            <label>Inspired By</label>
            <input {...bind.text("inspiredBy")} placeholder="-" />
          </div>
        </div>

        {/* Director */}
        <Section emoji="🎬" title="Director" />
        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 16 }}>
          <div className="col">
            <label>Director</label>
            <input {...bind.text("director")} placeholder="-" />
          </div>
        </div>

        {/* Engines / Soundtrack / Cast */}
        <Section emoji="🧩" title="Engines, Soundtrack & Cast" />
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="col">
            <label>Engines</label>
            <TagInput
              values={Array.isArray(draft.engines) ? draft.engines : []}
              setValues={(v) => setDraft({ ...draft, engines: v })}
              placeholder="Unity, Unreal Engine…"
              disabled={disabled}
            />
          </div>
          <div className="col">
            <label>Soundtrack</label>
            <TagInput
              values={Array.isArray(draft.soundtrack) ? draft.soundtrack : []}
              setValues={(v) => setDraft({ ...draft, soundtrack: v })}
              placeholder="Track / Song / Album…"
              disabled={disabled}
            />
          </div>
          <div className="col" style={{ gridColumn: "1 / -1" }}>
            <label>Cast</label>
            <TagInput
              values={Array.isArray(draft.cast) ? draft.cast : []}
              setValues={(v) => setDraft({ ...draft, cast: v })}
              placeholder="Actor / Voice Actor…"
              disabled={disabled}
            />
          </div>
        </div>

        {/* DLCs (List<string>) */}
        {/* DLCs (List<{name, price}> ) */}
 <Section emoji="🧩" title="DLCs" />
 <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
   <div className="col">
     {(!draft.dlcs || draft.dlcs.length === 0) && !editable && (
       <div className="muted">-</div>
     )}
     {Array.isArray(draft.dlcs) && draft.dlcs.length > 0 && (
      <div className="table-like" style={{ display: "grid", gridTemplateColumns: "1fr 140px 40px", gap: 8, alignItems: "center" }}>
         {/* Header */}
         <div className="muted" style={{ fontSize: 12 }}>Name</div>
         <div className="muted" style={{ fontSize: 12 }}>Price</div>
         <div />
         {/* Rows */}
         {draft.dlcs.map((row, idx) => (
           <React.Fragment key={idx}>
             <input
               placeholder="DLC name"
               value={row.name}
               readOnly={!editable}
               onChange={(e) => {
                 const v = e.target.value;
                 const next = [...draft.dlcs];
                 next[idx] = { ...next[idx], name: v };
                 setDraft({ ...draft, dlcs: next });
               }}
             />
             <input
               placeholder="e.g. 9.99"
               value={toMoney(row.price)}
               readOnly={!editable}
               onChange={(e) => {
                 const next = [...draft.dlcs];
                 next[idx] = { ...next[idx], price: parseMoney(e.target.value) };
                 setDraft({ ...draft, dlcs: next });
               }}
             />
             {editable ? (
               <button
                 type="button"
                 className="btn danger"
                 title="Remove"
                 onClick={() => {
                   const next = draft.dlcs.filter((_, i) => i !== idx);
                   setDraft({ ...draft, dlcs: next });
                 }}
               >
                 🗑
               </button>
             ) : <div />}
           </React.Fragment>
         ))}
       </div>
     )}
     {editable && (
       <div style={{ marginTop: 10 }}>
         <button
           type="button"
           className="btn ghost"
           onClick={() => setDraft({ ...draft, dlcs: [...(draft.dlcs || []), { name: "", price: null }] })}
         >
           ➕ Add DLC
         </button>
       </div>
     )}
   </div>
 </div>

        {/* Story */}
        <Section emoji="📖" title="Story" />
        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 16 }}>
          <div className="col">
            <label>Story / Synopsis</label>
            <textarea {...bind.area("story")} placeholder="-" />
          </div>
        </div>
      </div>
    </BottomModal>
  );
}
