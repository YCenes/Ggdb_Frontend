import React from "react";
import "./styles/AdminOverview.scss";
import { useKpis } from "./hooks/useKpis.js";
import { useGrowth } from "./hooks/useGrowth.js";
import LineChart from "./components/LineChart.js";
import PieChart from "./components/PieChart.js";

const ArrowUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 4l6 6h-4v10h-4V10H6z" fill="currentColor" />
  </svg>
);

export default function AdminOverview() {
  // KPI'lar
  const { data: counts } = useKpis();
  const kpis = [
    { icon: "👥", label: "Total Users", value: counts?.totalUsers ?? 0, delta: "+12%" },
    { icon: "🎮", label: "Total Games", value: counts?.totalGames ?? 0, delta: "+5%" },
    { icon: "⭐", label: "Total Reviews", value: 28, delta: "+18%" },
  ];

  // Growth (backend'ten)
  const { series, dims } = useGrowth({ days: 7, mode: "cumulative" });

  // Pie verisi (statik örnek)
  const pieData = [
    { label: "Registrations", value: 25, color: "var(--blue)" },
    { label: "Game Submissions", value: 20, color: "var(--green)" },
    { label: "Reviews", value: 35, color: "var(--orange)" },
    { label: "Other", value: 5, color: "var(--purple)" },
    { label: "Reports", value: 15, color: "var(--red)" },
  ];
  const pieStyle = { "--blue": "#4361ee", "--green": "#06d6a0", "--orange": "#ffb74d", "--purple": "#9d4edd", "--red": "#ef476f" };

  const recent = [
    { type: "danger", text: "Banned user @spammer123 for violations", time: "2 minutes ago" },
    { type: "warn", text: 'Approved game "Cyberpunk Adventure"', time: "15 minutes ago" },
    { type: "danger", text: "API response time threshold exceeded", time: "1 hour ago" },
    { type: "ok", text: "Verified 12 new user accounts", time: "2 hours ago" },
  ];

  const health = [
    { title: "Server", status: "Healthy", color: "#22C55E" },
    { title: "Database", status: "Healthy", color: "#22C55E" },
    { title: "Cdn", status: "Healthy", color: "#22C55E" },
    { title: "Apis", status: "Healthy", color: "#22C55E" },
  ];

  return (
    <div className="admin-page mt-5">
      <header className="page-head">
        <h1>Admin Overview</h1>
        <p>Monitor your platform’s performance and activity</p>
      </header>

      {/* KPI */}
      <section className="kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className="card kpi">
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-body">
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
            <div className="kpi-delta">
              <span className="delta"><ArrowUp /> {k.delta}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid-2">
        <LineChart title="Platform Growth" series={series} dims={dims} />
        <PieChart data={pieData} style={pieStyle} />
      </section>

      {/* Actions */}
      <section className="card actions">
        <div className="card-title"><span className="title-ico">🕒</span> Recent Admin Actions</div>
        <ul className="action-list">
          {recent.map((r, i) => (
            <li key={i} className={`item ${r.type}`}>
              <div className="ico" />
              <div className="body">
                <div className="txt">{r.text}</div>
                <div className="time">{r.time}</div>
              </div>
              <span className="trail-dot" />
            </li>
          ))}
        </ul>
        <button className="view-all">View all activity</button>
      </section>

      {/* Health */}
      <section className="health-grid">
        {health.map((h, i) => (
          <div key={i} className="card health">
            <div className="head">{h.title}</div>
            <div className="foot">
              <span className="state">{h.status}</span>
              <span className="lamp" style={{ backgroundColor: h.color }} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
