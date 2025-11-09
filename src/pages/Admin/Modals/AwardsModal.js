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
  // 🏆 data.awards: AwardInfo[]
  const [draft, setDraft] = useState({ awards: data?.awards || [] });

  useEffect(() => {
    setDraft({ awards: data?.awards || [] });
  }, [data, open]);

  // parent save event (GGDB admin save tuşu)
  useEffect(() => {
    const handler = () => onSave({ awards: draft.awards });
    window.addEventListener("ggdb:awards-save-request", handler);
    return () => window.removeEventListener("ggdb:awards-save-request", handler);
  }, [draft, onSave]);

  const addAward = () => {
    if (!editable) return;
    setDraft((d) => ({
      awards: [
        ...(d.awards || []),
        { title: "", category: "", result: "", year: "" },
      ],
    }));
  };

  const setField = (index, key, value) => {
    if (!editable) return;
    setDraft((d) => {
      const arr = [...(d.awards || [])];
      arr[index] = { ...arr[index], [key]: value };
      return { awards: arr };
    });
  };

  const removeRow = (index) => {
    if (!editable) return;
    setDraft((d) => {
      const arr = [...(d.awards || [])];
      arr.splice(index, 1);
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
                <div key={i} className="award-row readonly">
                  <input
                    value={aw.title || ""}
                    placeholder="Title"
                    onChange={(e) => setField(i, "title", e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <input
                    value={aw.category || ""}
                    placeholder="Category"
                    onChange={(e) => setField(i, "category", e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <input
                    value={aw.result || ""}
                    placeholder="Result"
                    onChange={(e) => setField(i, "result", e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    value={aw.year || ""}
                    placeholder="Year"
                    onChange={(e) => setField(i, "year", e.target.value)}
                    style={{ width: 90 }}
                  />
                  <button
                    className="icon-btn danger"
                    onClick={() => removeRow(i)}
                  >
                    🗑️
                  </button>
                </div>
              ) : (
                <div key={i} className="award-row readonly">
                  <span style={{ flex: 2 }}>{aw.title}</span>
                  <span style={{ flex: 2 }}>{aw.category || "—"}</span>
                  <span style={{ flex: 1 }}>{aw.result || "—"}</span>
                  <span style={{ width: 80 }}>{aw.year || "—"}</span>
                </div>
              )
            )
          ) : (
            <div className="empty-row">No awards</div>
          )}
        </div>

        {editable && (
          <div style={{ marginTop: 16 }}>
            <button className="btn primary" onClick={addAward}>
              + Add Award
            </button>
          </div>
        )}
      </div>
    </BottomModal>
  );
}
