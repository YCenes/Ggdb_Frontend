import React, { useEffect, useState } from "react";
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

export default function SystemModal({ open, onClose, editable, data, onSave }) {
  const [draft, setDraft] = useState(data);
  useEffect(() => { setDraft(data); }, [data, open]);

  // Parent "Save" butonuna basıldığında tetiklenecek event
  useEffect(() => {
    const handler = () => onSave(draft);
    window.addEventListener("ggdb:system-save-request", handler);
    return () => window.removeEventListener("ggdb:system-save-request", handler);
  }, [draft, onSave]);

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big">
        <div className="grid">
          {/* Content Warnings */}
          <div className="col">
            <label>Content Warnings</label>
            <TagInput
              values={draft.contentWarnings || []}
              setValues={(v) => setDraft({ ...draft, contentWarnings: v })}
              placeholder="Type and press comma..."
              disabled={!editable}
            />
          </div>

          {/* Age Ratings */}
          <div className="col">
            <label>Age Ratings</label>
            <TagInput
              values={draft.ageRatings || []}
              setValues={(v) => setDraft({ ...draft, ageRatings: v })}
              placeholder="e.g. PEGI 18, ESRB M... (Enter/Comma)"
              disabled={!editable}
            />
          </div>

          {/* Min Requirements */}
          <div className="col" style={{ gridColumn: "span 2" }}>
            <label>Minimum System Requirements</label>
            <textarea
              value={draft.minRequirements || (editable ? "" : "-")}
              readOnly={!editable}
              onChange={(e) =>
                setDraft({ ...draft, minRequirements: e.target.value })
              }
              rows={6}
              placeholder="CPU, GPU, RAM, Storage, OS ..."
            />
          </div>

          {/* Recommended Requirements */}
          <div className="col" style={{ gridColumn: "span 2" }}>
            <label>Recommended System Requirements</label>
            <textarea
              value={draft.recRequirements || (editable ? "" : "-")}
              readOnly={!editable}
              onChange={(e) =>
                setDraft({ ...draft, recRequirements: e.target.value })
              }
              rows={6}
              placeholder="CPU, GPU, RAM, Storage, OS ..."
            />
          </div>
        </div>
      </div>
    </BottomModal>
  );
}
