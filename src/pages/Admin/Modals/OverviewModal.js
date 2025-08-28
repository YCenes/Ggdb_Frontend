// src/pages/admin/modals/OverviewModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import "../../../styles/pages/admin/_game-detail-admin.scss";
import TagInput from "./TagInput"



/** Basit bottom modal (header actions YOK) */
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

export default function OverviewModal({ open, onClose, editable, data, onSave }) {
  // Modal içi taslak (draft) – Save ile parent’a aktarılır
  const [draft, setDraft] = useState(data);
  useEffect(() => { setDraft(data); }, [data, open]);

  // Parent Save butonuna basınca, buradan onSave'i tetiklemek için
  useEffect(() => {
    const handler = () => onSave(draft);
    window.addEventListener("ggdb:overview-save-request", handler);
    return () => window.removeEventListener("ggdb:overview-save-request", handler);
  }, [draft, onSave]);

  const bind = useMemo(() => ({
  text: (k) => ({
    value: draft[k] && draft[k].trim() !== "" 
      ? draft[k] 
      : (!editable ? "-" : ""),   // sadece readonly modda "-"
    readOnly: !editable,
    onChange: (e) => setDraft({ ...draft, [k]: e.target.value }),
  }),
  number: (k) => ({
    value: draft[k] !== undefined && draft[k] !== null && draft[k] !== ""
      ? draft[k]
      : (!editable ? "-" : ""),
    readOnly: !editable,
    onChange: (e) => setDraft({ ...draft, [k]: e.target.value }),
    inputMode: "numeric",
  }),
}), [draft, editable]);


  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big">
        {/* ÜSTTE tek başlık/aksiyon olduğu için burada yok */}
        <div className="grid">
          <div className="col">
            <label>Game Title</label>
            <input {...bind.text("title")} />
          </div>
          <div className="col">
            <label>Developer</label>
            <input {...bind.text("developer")} />
          </div>

          <div className="col">
            <label>Publisher</label>
            <input {...bind.text("publisher")} />
          </div>
          <div className="col">
            <label>Studio</label>
            <input {...bind.text("studio")} />
          </div>

          <div className="col">
            <label>Release Date</label>
            <input {...bind.text("releaseDate")} />
          </div>
          <div className="col">
            <label>Platforms</label>
            <TagInput
              values={draft.platforms}
              setValues={(v) => setDraft({ ...draft, platforms: v })}
              placeholder="Type and press enter"
              disabled={!editable}
            />
          </div>

          <div className="col">
            <label>Genres</label>
            <TagInput
              values={draft.genres}
              setValues={(v) => setDraft({ ...draft, genres: v })}
              placeholder="Type and press comma..."
              disabled={!editable}
            />
          </div>
          <div className="col">
            <label>Tags</label>
            <TagInput
              values={draft.tags}
              setValues={(v) => setDraft({ ...draft, tags: v })}
              placeholder="Type and press comma..."
              disabled={!editable}
            />
          </div>

          <div className="col trio">
            <div>
              <label>🎮 Main Story</label>
              <input {...bind.text("mainStory")} placeholder="e.g. 10" />
            </div>
            <div>
              <label>❇️ Extras</label>
              <input {...bind.text("extras")} placeholder="e.g. 15" />
            </div>
            <div>
              <label>🏆 Completionist</label>
              <input {...bind.text("completionist")} placeholder="e.g. 25" />
            </div>
          </div>

          <div className="col">
            <label>GGDB Rating</label>
            <input {...bind.number("ggdbRating")} />
          </div>
          <div className="col">
            <label>Metacritic Score</label>
            <input {...bind.number("metaScore")} />
          </div>
        </div>
      </div>
    </BottomModal>
  );
}
