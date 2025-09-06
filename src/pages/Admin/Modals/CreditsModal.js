import "../../../styles/pages/admin/Modal/MediaModal.scss";
import React, { useEffect, useState, useCallback } from "react";

/** Basit bottom sheet (projendekiyle aynı davranış) */
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

/* helpers */
const toCsv = (arr) => Array.isArray(arr) ? arr.join(", ") : (arr ?? "");
const toList = (s) =>
  (s || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);

/** Bölüm başlığı */
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
 * props:
 *  - open, onClose, editable
 *  - data: GameDetailDto benzeri (GET /games/{id} dönüşü)
 *  - onSave: (payload) => void
 *
 * Kaydederken DTO alan adlarıyla gönderir:
 *  GameDirector: string
 *  Writers: string[]
 *  ArtDirector: string
 *  LeadActors: string[]
 *  VoiceActors: string[]
 *  MusicComposer: string
 *  CinematicsVfxTeam: string[]
 */
export default function CreditsModal({ open, onClose, editable = true, data = {}, onSave }) {
  const mapIn = (src = {}) => ({
    // Hem PascalCase hem camelCase fallback'leri
    gameDirector: src.gameDirector ?? src.GameDirector ?? "",
    writersCsv: toCsv(src.writers ?? src.Writers ?? []),
    artDirector: src.artDirector ?? src.ArtDirector ?? "",
    leadActorsCsv: toCsv(src.leadActors ?? src.LeadActors ?? []),
    voiceActorsCsv: toCsv(src.voiceActors ?? src.VoiceActors ?? []),
    musicComposer: src.musicComposer ?? src.MusicComposer ?? "",
    cinematicsCsv: toCsv(src.cinematicsVfxTeam ?? src.CinematicsVfxTeam ?? []),
  });

  const [form, setForm] = useState(mapIn(data));

  useEffect(() => { if (open) setForm(mapIn(data)); }, [open, data]);

  const setVal = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const handleSave = useCallback(() => {
    if (!open) return; // modal kapalıysa kaydetme
     const payload = {
       gameDirector: (form.gameDirector || "").trim(),
       writers: toList(form.writersCsv),
       artDirector: (form.artDirector || "").trim(),
       leadActors: toList(form.leadActorsCsv),
       voiceActors: toList(form.voiceActorsCsv),
       musicComposer: (form.musicComposer || "").trim(),
       cinematicsVfxTeam: toList(form.cinematicsCsv),
     };
     onSave?.(payload);

  }, [open, form, onSave]);

  // Global Save (üstteki Save butonu basınca)
  useEffect(() => {
    window.addEventListener("ggdb:credits-save-request", handleSave);
    return () => window.removeEventListener("ggdb:credits-save-request", handleSave);
  }, [handleSave]);

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
              value={form.gameDirector}
              onChange={e => setVal("gameDirector", e.target.value)}
              disabled={!editable}
            />
          </div>
          <div className="col">
            <label>Writers / Scenario</label>
            <input
              type="text"
              placeholder="-"
              value={form.writersCsv}
              onChange={e => setVal("writersCsv", e.target.value)}
              disabled={!editable}
            />
          </div>

          <div className="col" style={{ gridColumn: "1 / -1" }}>
            <label>Art Director</label>
            <input
              type="text"
              placeholder="-"
              value={form.artDirector}
              onChange={e => setVal("artDirector", e.target.value)}
              disabled={!editable}
            />
          </div>
        </div>

        {/* Cast & Voice */}
        <Section emoji="🎭" title="Cast & Voice" />

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="col">
            <label>Lead Actors</label>
            <input
              type="text"
              placeholder="-"
              value={form.leadActorsCsv}
              onChange={e => setVal("leadActorsCsv", e.target.value)}
              disabled={!editable}
            />
          </div>
          <div className="col">
            <label>Voice Actors</label>
            <input
              type="text"
              placeholder="-"
              value={form.voiceActorsCsv}
              onChange={e => setVal("voiceActorsCsv", e.target.value)}
              disabled={!editable}
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
              value={form.musicComposer}
              onChange={e => setVal("musicComposer", e.target.value)}
              disabled={!editable}
            />
          </div>
          <div className="col">
            <label>Cinematics / VFX</label>
            <input
              type="text"
              placeholder="-"
              value={form.cinematicsCsv}
              onChange={e => setVal("cinematicsCsv", e.target.value)}
              disabled={!editable}
            />
          </div>
        </div>

      
      </div>
    </BottomModal>
  );
}
