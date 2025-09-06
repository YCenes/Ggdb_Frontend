import React, { useEffect, useState } from "react";
import "../../../styles/pages/admin/_game-detail-admin.scss";
import TagInput from "./TagInput";

/** Modal shell (projendekiyle aynı) */
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
 * CreditsModal
 * - data: GameDetailDto (GET dönüşü)
 * - onSave(payload) -> parent handlePersist ile DTO'ya yazılıyor
 *
 * draft alan adları:
 *  gameDirector: string
 *  writers: string[]
 *  artDirector: string
 *  leadActors: string[]
 *  voiceActors: string[]
 *  musicComposer: string
 *  cinematicsVfxTeam: string[]
 */
export default function CreditsModal({ open, onClose, editable = true, data = {}, onSave }) {
  const mapIn = (src = {}) => ({
    gameDirector:      src.gameDirector      ?? src.GameDirector      ?? "",
    writers:           src.writers           ?? src.Writers           ?? [],
    artDirector:       src.artDirector       ?? src.ArtDirector       ?? "",
    leadActors:        src.leadActors        ?? src.LeadActors        ?? [],
    voiceActors:       src.voiceActors       ?? src.VoiceActors       ?? [],
    musicComposer:     src.musicComposer     ?? src.MusicComposer     ?? "",
    cinematicsVfxTeam: src.cinematicsVfxTeam ?? src.CinematicsVfxTeam ?? [],
  });

  const [draft, setDraft] = useState(mapIn(data));
  useEffect(() => { if (open) setDraft(mapIn(data)); }, [open, data]);

  // Global Save (üst bardaki Save'e basınca)
  useEffect(() => {
    const handler = () => {
      onSave?.({
        // camelCase -> parent merge,
        // (parent DTO derlerken camelCase/PascalCase'ı eşliyorsun)
        gameDirector: draft.gameDirector?.trim() ?? "",
        writers: draft.writers ?? [],
        artDirector: draft.artDirector?.trim() ?? "",
        leadActors: draft.leadActors ?? [],
        voiceActors: draft.voiceActors ?? [],
        musicComposer: draft.musicComposer?.trim() ?? "",
        cinematicsVfxTeam: draft.cinematicsVfxTeam ?? [],

        // istersen PascalCase de gönder (opsiyonel güvenlik):
        GameDirector: draft.gameDirector?.trim() ?? "",
        Writers: draft.writers ?? [],
        ArtDirector: draft.artDirector?.trim() ?? "",
        LeadActors: draft.leadActors ?? [],
        VoiceActors: draft.voiceActors ?? [],
        MusicComposer: draft.musicComposer?.trim() ?? "",
        CinematicsVfxTeam: draft.cinematicsVfxTeam ?? [],
      });
    };
    window.addEventListener("ggdb:credits-save-request", handler);
    return () => window.removeEventListener("ggdb:credits-save-request", handler);
  }, [draft, onSave]);

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big" style={{ gap: 18 }}>
        {/* Director & Scenario */}
        <Section emoji="🎬" title="Director & Scenario" />

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="col">
            <label>Game Director</label>
            <input
              type="text"
              placeholder="-"
              value={draft.gameDirector}
              onChange={(e) => setDraft(d => ({ ...d, gameDirector: e.target.value }))}
              disabled={!editable}
            />
          </div>

          <div className="col">
            <label>Writers / Scenario</label>
            <TagInput
              values={draft.writers || []}
              setValues={(v) => setDraft(d => ({ ...d, writers: v }))}
              placeholder="Type and press Enter..."
              disabled={!editable}
              /* enterOnly desteği eklediysen: enterOnly */
            />
          </div>

          <div className="col" style={{ gridColumn: "1 / -1" }}>
            <label>Art Director</label>
            <input
              type="text"
              placeholder="-"
              value={draft.artDirector}
              onChange={(e) => setDraft(d => ({ ...d, artDirector: e.target.value }))}
              disabled={!editable}
            />
          </div>
        </div>

        {/* Cast & Voice */}
        <Section emoji="🎭" title="Cast & Voice" />

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="col">
            <label>Lead Actors</label>
            <TagInput
              values={draft.leadActors || []}
              setValues={(v) => setDraft(d => ({ ...d, leadActors: v }))}
              placeholder="Type and press Enter..."
              disabled={!editable}
              /* enterOnly */
            />
          </div>

          <div className="col">
            <label>Voice Actors</label>
            <TagInput
              values={draft.voiceActors || []}
              setValues={(v) => setDraft(d => ({ ...d, voiceActors: v }))}
              placeholder="Type and press Enter..."
              disabled={!editable}
              /* enterOnly */
            />
          </div>
        </div>

        {/* Music & Visual Effects */}
        <Section emoji="🎼" title="Music & Visual Effects" />

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="col">
            <label>Composer / Music</label>
            <input
              type="text"
              placeholder="-"
              value={draft.musicComposer}
              onChange={(e) => setDraft(d => ({ ...d, musicComposer: e.target.value }))}
              disabled={!editable}
            />
          </div>

          <div className="col">
            <label>Cinematics / VFX</label>
            <TagInput
              values={draft.cinematicsVfxTeam || []}
              setValues={(v) => setDraft(d => ({ ...d, cinematicsVfxTeam: v }))}
              placeholder="Type and press Enter..."
              disabled={!editable}
              /* enterOnly */
            />
          </div>
        </div>

        {/* Alt eylemler */}
        <div className="grid" style={{ gridTemplateColumns: "auto auto 1fr", gap: 10, marginTop: 6 }}>
          <button type="button" className="btn ghost" onClick={onClose}>Close</button>
          {editable && (
            <button
              type="button"
              className="btn gradient blue"
              onClick={() => window.dispatchEvent(new CustomEvent("ggdb:credits-save-request"))}
            >
              Save
            </button>
          )}
        </div>
      </div>
    </BottomModal>
  );
}
