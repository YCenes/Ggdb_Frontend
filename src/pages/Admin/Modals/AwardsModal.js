import React, { useEffect, useState } from "react";
import "../../../styles/pages/admin/_game-detail-admin.scss";

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

export default function AwardsModal({ open, onClose, editable, data, onSave }) {
  // data.awards: string[]
  const [draft, setDraft] = useState({ awards: data?.awards || [] });

  useEffect(() => {
    setDraft({ awards: data?.awards || [] });
  }, [data, open]);

  // parent save event
  useEffect(() => {
    const handler = () => onSave({ awards: draft.awards });
    window.addEventListener("ggdb:awards-save-request", handler);
    return () => window.removeEventListener("ggdb:awards-save-request", handler);
  }, [draft, onSave]);

  const addAward = () => {
    if (!editable) return;
    setDraft((d) => ({ awards: [...(d.awards || []), ""] }));
  };

  const setRow = (i, value) => {
    if (!editable) return;
    setDraft((d) => {
      const arr = [...(d.awards || [])];
      arr[i] = value;
      return { awards: arr };
    });
  };

  const removeRow = (i) => {
    if (!editable) return;
    setDraft((d) => {
      const arr = [...(d.awards || [])];
      arr.splice(i, 1);
      return { awards: arr };
    });
  };

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big">
        <h3>🏆 Awards</h3>
        <div className="award-list">
          {(draft.awards || []).length > 0 ? (
            draft.awards.map((aw, i) =>
              editable ? (
                <div key={i} className="award-row">
                  <input
                    value={aw}
                    placeholder="Award name"
                    onChange={(e) => setRow(i, e.target.value)}
                  />
                  <button className="icon-btn danger" onClick={() => removeRow(i)}>🗑️</button>
                </div>
              ) : (
                <div key={i} className="award-row readonly">
                  {aw || "—"}
                </div>
              )
            )
          ) : (
            <div className="empty-row">No awards</div>
          )}
        </div>
        {editable && (
          <div style={{ marginTop: 16 }}>
            <button className="btn primary" onClick={addAward}>+ Add Award</button>
          </div>
        )}
      </div>
    </BottomModal>
  );
}
