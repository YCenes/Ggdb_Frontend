import React, { useEffect, useState } from "react";
import "../../../styles/pages/admin/_game-detail-admin.scss";
import TagInput from "./TagInput";

/** Basit bottom sheet (diğer modallarla aynı) */
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

/** IGDB’den import butonu placeholder */
function IgdbImportBadge({ onClick }) {
  return (
    <button className="btn small" onClick={onClick} type="button">
      IGDB Data
    </button>
  );
}

const COMMON_LANGS = [
  "English","Turkish","French","Italian","German","Spanish (Spain)","Portuguese (Brazil)",
  "Portuguese","Japanese","Korean","Polish","Russian","Arabic","Chinese (Simplified)",
  "Chinese (Traditional)"
];

export default function LanguagesModal({ open, onClose, editable, data, onSave }) {
  // data içinden 3 listeyi al; yoksa boş dizi
  const [draft, setDraft] = useState({
    audioLanguages: data?.audioLanguages ?? data?.audio_language ?? data?.audio ?? [],
    subtitleLanguages: data?.subtitleLanguages ?? data?.subtitles ?? [],
    interfaceLanguages: data?.interfaceLanguages ?? data?.interface_language ?? [],
  });

  useEffect(() => {
    setDraft({
      audioLanguages: data?.audioLanguages ?? data?.audio_language ?? data?.audio ?? [],
      subtitleLanguages: data?.subtitleLanguages ?? data?.subtitles ?? [],
      interfaceLanguages: data?.interfaceLanguages ?? data?.interface_language ?? [],
    });
  }, [data, open]);

  // Parent “Save” tetiklediğinde yakala
  useEffect(() => {
    const handler = () => onSave({
      audioLanguages: draft.audioLanguages,
      subtitleLanguages: draft.subtitleLanguages,
      interfaceLanguages: draft.interfaceLanguages,
    });
    window.addEventListener("ggdb:languages-save-request", handler);
    return () => window.removeEventListener("ggdb:languages-save-request", handler);
  }, [draft, onSave]);

  const disabled = !editable;

  return (
    <BottomModal open={open} onClose={onClose}>
      <div className="gd-form is-insheet big" style={{ gap: 16 }}>
        {/* Header satırı: sol başlık + import/istatistik */}
        <div className="grid" style={{ gridTemplateColumns: "1fr", gap: 12 }}>
          <div className="col" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h3 style={{ margin: 0 }}>🌐 Language Support Management</h3>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <span className="gd-sub">
                {draft.audioLanguages.length + draft.subtitleLanguages.length + draft.interfaceLanguages.length} selections
              </span>
              <IgdbImportBadge onClick={() => alert("IGDB import (placeholder)")} />
            </div>
          </div>
        </div>

        {/* Audio */}
        <section className="grid" style={{ gridTemplateColumns: "1fr", gap: 8 }}>
          <div className="col">
            <div className="gd-label">🎙️ Audio Languages</div>
            <TagInput
              values={draft.audioLanguages}
              setValues={(v) => setDraft((s) => ({ ...s, audioLanguages: v }))}
              placeholder="Select or type a language and press Enter…"
              suggestions={COMMON_LANGS}
              disabled={disabled}
            />
            <div className="gd-sub" style={{ marginTop: 6 }}>
              {draft.audioLanguages.length} language{draft.audioLanguages.length === 1 ? "" : "s"} selected
            </div>
          </div>
        </section>

        {/* Subtitles */}
        <section className="grid" style={{ gridTemplateColumns: "1fr", gap: 8 }}>
          <div className="col">
            <div className="gd-label">💬 Subtitle Languages</div>
            <TagInput
              values={draft.subtitleLanguages}
              setValues={(v) => setDraft((s) => ({ ...s, subtitleLanguages: v }))}
              placeholder="Select or type a language and press Enter…"
              suggestions={COMMON_LANGS}
              disabled={disabled}
            />
            <div className="gd-sub" style={{ marginTop: 6 }}>
              {draft.subtitleLanguages.length} selected
            </div>
          </div>
        </section>

        {/* Interface */}
        <section className="grid" style={{ gridTemplateColumns: "1fr", gap: 8 }}>
          <div className="col">
            <div className="gd-label">🖥️ Interface Languages</div>
            <TagInput
              values={draft.interfaceLanguages}
              setValues={(v) => setDraft((s) => ({ ...s, interfaceLanguages: v }))}
              placeholder="Select or type a language and press Enter…"
              suggestions={COMMON_LANGS}
              disabled={disabled}
            />
            <div className="gd-sub" style={{ marginTop: 6 }}>
              {draft.interfaceLanguages.length} selected
            </div>
          </div>
        </section>
      </div>
    </BottomModal>
  );
}
