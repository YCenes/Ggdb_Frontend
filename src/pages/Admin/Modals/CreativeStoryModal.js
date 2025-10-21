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

/**
 * DB alan eşlemeleri (camel + PascalCase toleranslı)
 *   gameDirector, writers[], artDirector,
 *   leadActors[], voiceActors[], musicComposer, cinematicsVfxTeam[]
 */
export default function CreativeStoryModal({ open, onClose, editable, data, onSave }) {
  const makeDraft = (src = {}) => ({
    gameDirector:      src.gameDirector      ?? src.GameDirector      ?? "",
    writers:           src.writers           ?? src.Writers           ?? [],
    artDirector:       src.artDirector       ?? src.ArtDirector       ?? "",
    leadActors:        src.leadActors        ?? src.LeadActors        ?? [],
    voiceActors:       src.voiceActors       ?? src.VoiceActors       ?? [],
    musicComposer:     src.musicComposer     ?? src.MusicComposer     ?? "",
    cinematicsVfxTeam: src.cinematicsVfxTeam ?? src.CinematicsVfxTeam ?? [],
  });

  const [draft, setDraft] = useState(makeDraft(data));

  // Modal her açıldığında & data değiştiğinde hydrate
  useEffect(() => {
    if (open) setDraft(makeDraft(data));
  }, [data, open]);

  // Üstteki global Save butonu basılınca bu modalı kaydettir
  useEffect(() => {
    const handler = () => onSave?.(draft);
    window.addEventListener("ggdb:creative-save-request", handler);
    return () => window.removeEventListener("ggdb:creative-save-request", handler);
  }, [draft, onSave]);

  // OverviewModal ile aynı bağlayıcı: readOnly modda "-" göster
  const bind = useMemo(() => ({
    text: (k) => ({
      value:
        draft[k] && String(draft[k]).trim() !== ""
          ? draft[k]
          : (!editable ? "-" : ""),
      readOnly: !editable,
      onChange: (e) => setDraft({ ...draft, [k]: e.target.value }),
    }),
  }), [draft, editable]);

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big" style={{ gap: 18 }}>
        {/* Director & Scenario */}
        <Section emoji="🎬" title="Director & Scenario" />
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="col">
            <label>Game Director</label>
            <input {...bind.text("gameDirector")} placeholder="-" />
          </div>
          <div className="col">
            <label>Writers / Scenario</label>
            <TagInput
              values={Array.isArray(draft.writers) ? draft.writers : []}
              setValues={(v) => setDraft({ ...draft, writers: v })}
              placeholder="Type and press Enter..."
              disabled={!editable}
            />
          </div>
          <div className="col" style={{ gridColumn: "1 / -1" }}>
            <label>Art Director</label>
            <input {...bind.text("artDirector")} placeholder="-" />
          </div>
        </div>

        {/* Cast & Voice */}
        <Section emoji="🎭" title="Cast & Voice" />
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="col">
            <label>Lead Actors</label>
            <TagInput
              values={Array.isArray(draft.leadActors) ? draft.leadActors : []}
              setValues={(v) => setDraft({ ...draft, leadActors: v })}
              placeholder="Type and press Enter..."
              disabled={!editable}
            />
          </div>
          <div className="col">
            <label>Voice Actors</label>
            <TagInput
              values={Array.isArray(draft.voiceActors) ? draft.voiceActors : []}
              setValues={(v) => setDraft({ ...draft, voiceActors: v })}
              placeholder="Type and press Enter..."
              disabled={!editable}
            />
          </div>
        </div>

        {/* Music & Visual Effects */}
        <Section emoji="🎼" title="Music & Visual Effects" />
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="col">
            <label>Composer / Music</label>
            <input {...bind.text("musicComposer")} placeholder="-" />
          </div>
          <div className="col">
            <label>Cinematics / VFX</label>
            <TagInput
              values={Array.isArray(draft.cinematicsVfxTeam) ? draft.cinematicsVfxTeam : []}
              setValues={(v) => setDraft({ ...draft, cinematicsVfxTeam: v })}
              placeholder="Type and press Enter..."
              disabled={!editable}
            />
          </div>
        </div>
      </div>
    </BottomModal>
  );
}
