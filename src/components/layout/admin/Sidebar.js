import React from "react";
import { Link } from "react-router-dom";
import {
  Home, Gauge, Layers3, Gamepad2, Users, BarChart3, Settings, ServerCog, Bug,
} from "lucide-react";

function Item({ icon: Icon, label, to = "#", active = false, onClick }) {
  return (
    <Link to={to} className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <span className="icon"><Icon size={18} /></span>
      <span className="label">{label}</span>
    </Link>
  );
}

export default function Sidebar({ open, setOpen, mobileOpen, setMobileOpen }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const isOpen = isMobile ? !!mobileOpen : !!open;

  const handleToggle = () => {
    if (isMobile) setMobileOpen(v => !v);
    else setOpen(v => !v);
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`admin-overlay ${mobileOpen ? "is-visible" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""} ${open ? "" : "is-collapsed"}`}>
        <div className="wrap">
          {/* Üst şerit: Brand + Toggle */}
          <div className="side-top">
            <Link to="/admin" className="brand">
              <span className="title">Admin Panel</span>
            </Link>

            <button
              type="button"
              aria-label="Toggle sidebar"
              className="icon-btn"
              onClick={handleToggle}
            >
              <span className={`burger ${isOpen ? "open" : ""}`} aria-hidden="true" />
            </button>
          </div>

          {/* Menü */}
          <nav>
            <Item icon={Home} label="Site Home"        to="/"                onClick={() => setMobileOpen(false)} />
            <Item icon={Gauge} label="Overview"         to="/admin" active    onClick={() => setMobileOpen(false)} />
            <Item icon={Layers3} label="Section Ordering" to="/admin/sections" onClick={() => setMobileOpen(false)} />
            <Item icon={Gamepad2} label="Manage Games"  to="/admin/games"     onClick={() => setMobileOpen(false)} />
            <Item icon={Users} label="Manage Users"     to="/admin/users"     onClick={() => setMobileOpen(false)} />
            <Item icon={BarChart3} label="Analytics"    to="/admin/analytics" onClick={() => setMobileOpen(false)} />
            <Item icon={Settings} label="Settings"      to="/admin/settings"  onClick={() => setMobileOpen(false)} />
            <Item icon={ServerCog} label="System Logs"  to="/admin/system-logs" onClick={() => setMobileOpen(false)} />
            <Item icon={Bug} label="Error Logs"         to="/admin/error-logs"  onClick={() => setMobileOpen(false)} />
          </nav>

          <div className="footer">GGDB Admin • v1.0</div>
        </div>
      </aside>
    </>
  );
}
