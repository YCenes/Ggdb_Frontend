import React, { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Home, Gauge, Layers3, Gamepad2, Users, BarChart3, Settings, ServerCog, Bug,
} from "lucide-react";

function Item({ icon: Icon, label, to = "#", onClick, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
    >
      <span className="icon"><Icon size={18} /></span>
      <span className="label">{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ open, setOpen, mobileOpen, setMobileOpen }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const isOpen = isMobile ? !!mobileOpen : !!open;

  const handleToggle = () => {
    if (isMobile) setMobileOpen(v => !v);
    else setOpen(v => !v);
  };

    // Header'daki burger'in yayınladığı olayı dinle
  useEffect(() => {
    const onToggle = () => {
      setMobileOpen(prev => !prev);
    };
    document.addEventListener("ggdb:toggle-sidebar", onToggle);
    return () => document.removeEventListener("ggdb:toggle-sidebar", onToggle);
  }, [setMobileOpen]);

  // Mobilde sidebar açıkken body scroll'u kilitle
  useEffect(() => {
    if (typeof document === "undefined") return;
    const shouldLock = isMobile && mobileOpen;
    if (shouldLock) document.body.classList.add("no-scroll");
    else document.body.classList.remove("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [isMobile, mobileOpen]);
  return (
    <>
      <div
        className={`admin-overlay ${mobileOpen ? "is-visible" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""} ${open ? "" : "is-collapsed"}`}>
        <div className="wrap">
          <div className="side-top">
            <NavLink to="/admin" className="brand">
              <span className="title">Admin Panel</span>
            </NavLink>

            <button
              type="button"
              aria-label="Toggle sidebar"
              className="icon-btn"
              onClick={handleToggle}
            >
              <span className={`burger ${isOpen ? "open" : ""}`} aria-hidden="true" />
            </button>
          </div>

          <nav>
            <Item icon={Home}    label="Site Home"        to="/"                 end onClick={() => setMobileOpen(false)} />
            <Item icon={Gauge}   label="Overview"         to="/admin"            end onClick={() => setMobileOpen(false)} />
            <Item icon={Layers3} label="Section Ordering" to="/admin/sections"       onClick={() => setMobileOpen(false)} />
            <Item icon={Gamepad2}label="Manage Games"     to="/admin/games"     onClick={() => setMobileOpen(false)} />
            <Item icon={Users}   label="Manage Users"     to="/admin/users"          onClick={() => setMobileOpen(false)} />
            <Item icon={BarChart3}label="Analytics"       to="/admin/analytics"      onClick={() => setMobileOpen(false)} />
            <Item icon={Settings}label="Settings"         to="/admin/settings"       onClick={() => setMobileOpen(false)} />
            <Item icon={ServerCog}label="System Logs"     to="/admin/logs"    onClick={() => setMobileOpen(false)} />
            <Item icon={Bug}     label="Error Logs"       to="/admin/error-logs"     onClick={() => setMobileOpen(false)} />
          </nav>

          <div className="footer">GGDB Admin • v1.0</div>
        </div>
      </aside>
    </>
  );
}
