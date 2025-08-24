import React, { useEffect, useState, useMemo } from "react";
import { Bell, ShieldCheck, Search, Users, Gamepad2 } from "lucide-react";
import API from "../../../services/api.js";
import BG from "../../../assets/anonim.webp";

export default function Header({
  title = "Admin Panel",
  subtitle = "Manage your gaming platform efficiently",
}) {
  const [user, setUser] = useState(null);       
  const [loading, setLoading] = useState(true);
  const [counts , setCounts] = useState({ totalUsers: 0, totalGames: 0 });

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

  // Avatar için güvenli fallback
const avatarUrl = user?.profileImageUrl && user.profileImageUrl.trim() !== ""
  ? user.profileImageUrl
  : BG;

  // İsim/rol fallback
const displayName = user?.userName || "Guest";
const displayRole = user?.userType === 1 ? "Admin" : "User";
const totalUser = counts?.totalUsers ?? 0;
const totalGame = counts?.totalGames ?? 0;

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

          {/* Kullanıcı bloğu: loading durumunda da güvenli */}
          <div className={`user ${loading ? "is-loading" : ""}`}>
            <img src={avatarUrl} alt="avatar" />
            <div className="meta">
              <span className="name">{displayName}</span>
              <span className="role">{displayRole}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
