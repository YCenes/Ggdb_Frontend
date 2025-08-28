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

export default function CreativeStoryModal({ open, onClose, editable, data, onSave }) {
  const [draft, setDraft] = useState(data);

  useEffect(() => { setDraft(data); }, [data, open]);

  useEffect(() => {
    const handler = () => onSave(draft);
    window.addEventListener("ggdb:creative-save-request", handler);
    return () => window.removeEventListener("ggdb:creative-save-request", handler);
  }, [draft, onSave]);

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big">
        <div className="grid">
          {/* Game Engine */}
          <div className="col">
            <label>Game Engine</label>
            <TagInput
              values={draft.gameEngine || []}
              setValues={(v) => setDraft({ ...draft, gameEngine: v })}
              placeholder="Type and press comma..."
              disabled={!editable}
            />
          </div>

          {/* Cast */}
          <div className="col">
            <label>Cast</label>
            <TagInput
              values={draft.cast || []}
              setValues={(v) => setDraft({ ...draft, cast: v })}
              placeholder="Type and press comma..."
              disabled={!editable}
            />
          </div>

          {/* DLCs */}
          <div className="col">
            <label>DLCs</label>
            <TagInput
              values={draft.dlcs || []}
              setValues={(v) => setDraft({ ...draft, dlcs: v })}
              placeholder="Type and press comma..."
              disabled={!editable}
            />
          </div>

          {/* Story */}
          <div className="col" style={{ gridColumn: "span 2" }}>
            <label>Story</label>
            <textarea
              value={draft.story || (editable ? "" : "-")}
              readOnly={!editable}
              onChange={(e) => setDraft({ ...draft, story: e.target.value })}
              rows={4}
            />
          </div>
        </div>
      </div>
    </BottomModal>
  );
}
