import React, { useEffect, useState, useMemo, useRef } from "react";
import { Bell, ShieldCheck, Search, Users, Gamepad2, ExternalLink, LogOut } from "lucide-react";
import API from "../../../services/api.js";
import BG from "../../../assets/anonim.webp";

export default function Header({
  title = "Admin Panel",
  subtitle = "Manage your gaming platform efficiently",
}) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counts , setCounts] = useState({ totalUsers: 0, totalGames: 0 });

  // ▼ NEW: dropdown state & refs
  const [menuOpen, setMenuOpen] = useState(false);
  const userBtnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await API.get("/auth/me");
        if (alive) setUser(res.data);
      } catch (err) {
        console.error("Kullanıcı bilgisi alınamadı:", err?.response?.status || err?.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await API.get("/admin/usergamecount");
        if (alive) setCounts(res.data ?? { totalUsers: 0, totalGames: 0 });
      } catch (err) {
        if (alive) setCounts({ totalUsers: 0, totalGames: 0 });
      }
    })();
    return () => { alive = false; };
  }, []);

  // ▼ NEW: click-outside & esc kapatma
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        userBtnRef.current &&
        !userBtnRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    const onEsc = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  // Avatar & isim/rol
  const avatarUrl = user?.profileImageUrl && user.profileImageUrl.trim() !== "" ? user.profileImageUrl : BG;
  const displayName = user?.userName || "Guest";
  const displayRole = user?.userType === 1 ? "Admin" : "User";
  const totalUser = counts?.totalUsers ?? 0;
  const totalGame = counts?.totalGames ?? 0;

  // ▼ NEW: actions
  const handleToggleMenu = () => setMenuOpen((s) => !s);

  const handleKeyToggle = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setMenuOpen((s) => !s);
    }
  };

  const handleVisit = () => {
    // canlı sitede ana sayfaya yönlendir
    window.location.href = "/";
  };

  const handleLogout = async () => {
    try {
      // backend'in varsa:
      if (API?.post) {
        try { await API.post("/auth/logout"); } catch {}
      }
      // token/oturum temizliği (uygulamana göre düzenle)
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <header className="admin-header">
      <div className="inner">
        {/* Sol: Başlık */}
        <div className="header-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        {/* Orta: Search */}
        <div className="search">
          <span className="search-icon"><Search size={16} /></span>
          <input type="text" placeholder="Search users, games, studios..." />
        </div>

        {/* Sağ: metrikler/ikonlar */}
        <div className="header-right">
          <span className="chip"><Users size={14} /> {totalUser} <span className="text-dim">Users</span></span>
          <span className="chip"><Gamepad2 size={14} /> {totalGame} <span className="text-dim">Games</span></span>
          <span className="chip ok"><ShieldCheck size={14} /> Secure</span>

          <button className="icon-btn notif-btn" aria-label="Notifications">
            <Bell size={18} />
            <span className="badge">2</span>
          </button>

          {/* Kullanıcı bloğu + dropdown trigger */}
          <div className="user-wrap">
            <button
              ref={userBtnRef}
              className={`user ${loading ? "is-loading" : ""}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={handleToggleMenu}
              onKeyDown={handleKeyToggle}
            >
              <img src={avatarUrl} alt="avatar" />
              <div className="meta">
                <span className="name">{displayName}</span>
                <span className="role">{displayRole}</span>
              </div>
            </button>

            {/* ▼ NEW: açılır menü */}
            {menuOpen && (
              <div ref={menuRef} className="user-menu" role="menu">
                <button className="menu-item" role="menuitem" onClick={handleVisit}>
                  <ExternalLink size={16} />
                  Visit site
                </button>
                <button className="menu-item danger" role="menuitem" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
