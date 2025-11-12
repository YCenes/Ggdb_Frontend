// src/pages/admin/SettingsPage.tsx (veya dosyan nerede ise)
import React, { useEffect, useMemo, useState } from "react";
import "../../styles/admin/_settings-admin.scss";
import { useSettings } from "../../hooks/settingsHooks.ts"; // ← kendi yoluna göre düzelt

/** Küçük yardımcılar */
const cx = (...a) => a.filter(Boolean).join(" ");

/** Toggle bileşeni (SCSS: .toggle + .active) */
function Toggle({ checked, onChange, id }) {
  return (
    <div
      id={id}
      role="switch"
      aria-checked={checked}
      className={cx("toggle", checked && "active")}
      onClick={() => onChange(!checked)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
    />
  );
}

/** Dosya seçme butonu (SCSS: .file-btn) */
function FileButton({ id, label = "Choose File", onPick, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <label htmlFor={id} className="file-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 3a4 4 0 00-4 4v2H6a3 3 0 000 6h12a3 3 0 000-6h-2V7a4 4 0 00-4-4z" />
        </svg>
        {label}
      </label>
      <input
        id={id}
        type="file"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick?.(f);
        }}
      />
      {right}
    </div>
  );
}

const TABS = [
  { key: "general", label: "General Settings" },
  { key: "security", label: "Security Settings" },
  { key: "content", label: "Content Management" },
  { key: "seo", label: "SEO Settings" },
];

export default function SettingsPage() {
  const { data: srv, isLoading, error, save, uploadFav, refetch } = useSettings();

  // Server'dan gelen ayarların UI kopyası
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [active, setActive] = useState("general");

  // İlk yüklemede veya sunucu verisi değiştiğinde (ve form kirli değilse) formu doldur
  useEffect(() => {
    if (srv && !dirty) setForm(srv);
  }, [srv]);

  const setPart = (section, patch) => {
    if (!form) return;
    const next = { ...form, [section]: { ...form[section], ...patch } };
    setForm(next);
    setDirty(true);
  };

  const resetAll = () => {
    if (srv) {
      setForm(srv);
      setDirty(false);
    }
  };

  const saveAll = async () => {
    if (!form) return;
    try {
      await save.mutateAsync(form); // PUT /api/settings
      setDirty(false);
      alert("Settings saved");
    } catch (e) {
      const status = e?.response?.status;
      if (status === 409) {
        alert("Ayarlar başka bir yerde değişmiş. Güncel değerler yükleniyor.");
        const fresh = await refetch();
        if (fresh?.data) setForm(fresh.data);
        setDirty(false);
      } else if (status === 400) {
        const msgs = e?.response?.data;
        console.error("Validation error", msgs);
        alert("Validasyon hatası. Alanları kontrol et.");
      } else {
        console.error(e);
        alert("Kaydetme hatası.");
      }
    }
  };

  // Yükleme/bağlantı hatası durumları
  if (isLoading && !form) {
    return <div className="settings-page"><div className="settings-card"><h2>Loading settings…</h2></div></div>;
  }
  if (error && !form) {
    return <div className="settings-page"><div className="settings-card"><h2>Settings yüklenemedi.</h2></div></div>;
  }

  // Fallback: form boşsa basit defaultlar (çok kısa süreli)
  const data = form ?? {
    general: { siteName: "", siteDesc: "", maintenance: false, allowRegistrations: false, faviconUrl: "" },
    security: { twoFA: false, timeout: 30, maxAttempts: 5, minLength: 8 },
    content: { autoMod: true, requireApproval: true, allowReviews: true, maxFileMb: 10 },
    seo: {
      titleTpl: "%s | GGDB - Gaming Database",
      metaDesc: "",
      keywords: "",
      canonical: "",
      ogImage: "",
      twitterType: "summary_large_image",
      twitterHandle: "@GGDB",
      genSitemap: true,
      jsonLd: true,
      analyticsEnabled: false,
      analyticsId: "",
    },
  };

  return (
    <div className="settings-page">
      {/* Sekmeler */}
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={cx(active === t.key && "active")}
            onClick={() => setActive(t.key)}
            aria-current={active === t.key ? "page" : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* General */}
      {active === "general" && (
        <div className="settings-card" aria-labelledby="gen-title">
          <h2 id="gen-title">General Settings</h2>

          <div className="row">
            <div>
              <label htmlFor="siteName">Site Name</label>
              <small>The name of your gaming platform</small>
            </div>
            <div>
              <input
                id="siteName"
                type="text"
                value={data.general.siteName ?? ""}
                onChange={(e) => setPart("general", { siteName: e.target.value })}
                placeholder="GGDB"
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="siteDesc">Site Description</label>
              <small>A brief description of your platform</small>
            </div>
            <div>
              <textarea
                id="siteDesc"
                rows={3}
                value={data.general.siteDesc ?? ""}
                onChange={(e) => setPart("general", { siteDesc: e.target.value })}
                placeholder="The Ultimate Gaming Database"
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="maintenance">Maintenance Mode</label>
              <small>Temporarily disable the site for maintenance</small>
            </div>
            <div>
              <Toggle
                id="maintenance"
                checked={!!data.general.maintenance}
                onChange={(v) => setPart("general", { maintenance: v })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="allowRegs">Allow Registrations</label>
              <small>Enable new user registrations</small>
            </div>
            <div>
              <Toggle
                id="allowRegs"
                checked={!!data.general.allowRegistrations}
                onChange={(v) => setPart("general", { allowRegistrations: v })}
              />
            </div>
          </div>

          {/* Favicon: artık URL saklıyoruz (faviconUrl). Yükleme ayrı endpoint. */}
          <div className="row">
            <div>
              <label htmlFor="favicon">Site Favicon</label>
              <small>Upload .ico or .png only, max 64×64 px, max 1MB</small>
            </div>
            <div>
              <FileButton
                id="favicon"
                onPick={async (f) => {
                  try {
                    const url = await uploadFav.mutateAsync(f); // POST /settings/favicon
                    setPart("general", { faviconUrl: url });
                  } catch (e) {
                    console.error(e);
                    alert("Favicon yüklenemedi");
                  }
                }}
                right={
                  data.general.faviconUrl ? (
                    <a href={data.general.faviconUrl} target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,.7)", fontSize: 14 }}>
                      {data.general.faviconUrl}
                    </a>
                  ) : (
                    <span
                      style={{
                        fontSize: 12,
                        padding: "2px 8px",
                        borderRadius: 8,
                        background: "rgba(250,204,21,.15)",
                        color: "#facc15",
                      }}
                    >
                      Current
                    </span>
                  )
                }
              />
            </div>
          </div>

          <div className="actions">
            <button className="reset" onClick={resetAll} disabled={save.isPending || uploadFav.isPending}>
              Reset
            </button>
            <button className="save" onClick={saveAll} disabled={!dirty || save.isPending}>
              {save.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Security */}
      {active === "security" && (
        <div className="settings-card" aria-labelledby="sec-title">
          <h2 id="sec-title">Security Settings</h2>

          <div className="row">
            <div>
              <label htmlFor="twofa">Two-Factor Authentication</label>
              <small>Require 2FA for admin accounts</small>
            </div>
            <div>
              <Toggle
                id="twofa"
                checked={!!data.security.twoFA}
                onChange={(v) => setPart("security", { twoFA: v })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="timeout">Session Timeout</label>
              <small>Minutes before automatic logout</small>
            </div>
            <div>
              <input
                id="timeout"
                type="number"
                min={5}
                max={240}
                value={data.security.timeout ?? 30}
                onChange={(e) => setPart("security", { timeout: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="attempts">Max Login Attempts</label>
              <small>Failed attempts before account lockout</small>
            </div>
            <div>
              <input
                id="attempts"
                type="number"
                min={3}
                max={20}
                value={data.security.maxAttempts ?? 5}
                onChange={(e) => setPart("security", { maxAttempts: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="minlen">Password Min Length</label>
              <small>Minimum password length requirement</small>
            </div>
            <div>
              <input
                id="minlen"
                type="number"
                min={6}
                max={64}
                value={data.security.minLength ?? 8}
                onChange={(e) => setPart("security", { minLength: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="actions">
            <button className="reset" onClick={() => alert("Force logout (mock)")} disabled>
              Force Logout All
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {active === "content" && (
        <div className="settings-card" aria-labelledby="cnt-title">
          <h2 id="cnt-title">Content Management</h2>

        <div className="row">
            <div>
              <label htmlFor="automod">Auto Moderation</label>
              <small>Automatically moderate user content</small>
            </div>
            <div>
              <Toggle
                id="automod"
                checked={!!data.content.autoMod}
                onChange={(v) => setPart("content", { autoMod: v })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="approval">Require Game Approval</label>
              <small>All new games need admin approval</small>
            </div>
            <div>
              <Toggle
                id="approval"
                checked={!!data.content.requireApproval}
                onChange={(v) => setPart("content", { requireApproval: v })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="reviews">Allow User Reviews</label>
              <small>Users can post game reviews</small>
            </div>
            <div>
              <Toggle
                id="reviews"
                checked={!!data.content.allowReviews}
                onChange={(v) => setPart("content", { allowReviews: v })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="maxfile">Max File Size (MB)</label>
              <small>Maximum upload size for images</small>
            </div>
            <div>
              <input
                id="maxfile"
                type="number"
                min={1}
                max={100}
                value={data.content.maxFileMb ?? 10}
                onChange={(e) => setPart("content", { maxFileMb: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="actions">
            <button className="reset" onClick={resetAll} disabled={save.isPending}>
              Reset
            </button>
            <button className="save" onClick={saveAll} disabled={!dirty || save.isPending}>
              {save.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* SEO */}
      {active === "seo" && (
        <div className="settings-card" aria-labelledby="seo-title">
          <h2 id="seo-title">SEO Settings</h2>

          <div className="row">
            <div>
              <label htmlFor="titleTpl">Title Template</label>
              <small>Use %s for page title</small>
            </div>
            <div>
              <input
                id="titleTpl"
                type="text"
                value={data.seo.titleTpl ?? ""}
                onChange={(e) => setPart("seo", { titleTpl: e.target.value })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="metaDesc">Default Meta Description</label>
              <small>Used when page-specific description is missing</small>
            </div>
            <div>
              <textarea
                id="metaDesc"
                rows={3}
                value={data.seo.metaDesc ?? ""}
                onChange={(e) => setPart("seo", { metaDesc: e.target.value })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="keywords">Default Keywords</label>
              <small>Comma-separated keywords</small>
            </div>
            <div>
              <input
                id="keywords"
                type="text"
                value={data.seo.keywords ?? ""}
                onChange={(e) => setPart("seo", { keywords: e.target.value })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="canonical">Canonical URL</label>
            </div>
            <div>
              <input
                id="canonical"
                type="text"
                value={data.seo.canonical ?? ""}
                onChange={(e) => setPart("seo", { canonical: e.target.value })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="og">Default Open Graph Image</label>
            </div>
            <div>
              <input
                id="og"
                type="text"
                value={data.seo.ogImage ?? ""}
                onChange={(e) => setPart("seo", { ogImage: e.target.value })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="twType">Twitter Card Type</label>
            </div>
            <div>
              <select
                id="twType"
                value={data.seo.twitterType ?? "summary_large_image"}
                onChange={(e) => setPart("seo", { twitterType: e.target.value })}
              >
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
                <option value="app">App</option>
                <option value="player">Player</option>
              </select>
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="twHandle">Twitter Site Handle</label>
            </div>
            <div>
              <input
                id="twHandle"
                type="text"
                value={data.seo.twitterHandle ?? ""}
                onChange={(e) => setPart("seo", { twitterHandle: e.target.value })}
                placeholder="@GGDB"
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="sitemap">Generate Sitemap</label>
            </div>
            <div>
              <Toggle
                id="sitemap"
                checked={!!data.seo.genSitemap}
                onChange={(v) => setPart("seo", { genSitemap: v })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="jsonld">JSON-LD Schema</label>
              <small>Enable structured data</small>
            </div>
            <div>
              <Toggle
                id="jsonld"
                checked={!!data.seo.jsonLd}
                onChange={(v) => setPart("seo", { jsonLd: v })}
              />
            </div>
          </div>

          <div className="row">
            <div>
              <label htmlFor="analytics">Analytics Tracking</label>
              <small>Enable analytics & set property id</small>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Toggle
                id="analytics"
                checked={!!data.seo.analyticsEnabled}
                onChange={(v) => setPart("seo", { analyticsEnabled: v })}
              />
              <input
                type="text"
                placeholder="G-XXXXXXXXXX / UA-XXXXXX-X"
                value={data.seo.analyticsId ?? ""}
                onChange={(e) => setPart("seo", { analyticsId: e.target.value })}
                disabled={!data.seo.analyticsEnabled}
              />
            </div>
          </div>

          <div className="actions">
            <button className="reset" onClick={resetAll} disabled={save.isPending}>
              Reset
            </button>
            <button className="save" onClick={saveAll} disabled={!dirty || save.isPending}>
              {save.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
