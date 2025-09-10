import React from "react";
import "../../styles/admin/AdminOverview.scss";
import { useKpis } from "../../hooks/useKpis.js";
import { useGrowth } from "../../hooks/useGrowth.js";
import { useHealth } from "../../hooks/useHealth.js";
import LineChart from "../../components/charts/LineChart.js";
import PieChart from "../../components/charts/PieChart.js";

const ArrowUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 4l6 6h-4v10h-4V10H6z" fill="currentColor" />
  </svg>
);

export default function AdminOverview() {
  const { kpis } = useKpis({ windowDays: 7 });
  const { series, dims } = useGrowth({ days: 7, mode: "cumulative" });
  const { items: healthItems, loading: healthLoading, error: healthError } = useHealth({ refreshMs: 0 });

  const pieData = [
    { label: "Registrations", value: 25, color: "var(--blue)" },
    { label: "Game Submissions", value: 20, color: "var(--green)" },
    { label: "Reviews", value: 35, color: "var(--orange)" },
    { label: "Other", value: 5, color: "var(--purple)" },
    { label: "Reports", value: 15, color: "var(--red)" },
  ];
  const pieStyle = {
    "--blue": "#4361ee",
    "--green": "#06d6a0",
    "--orange": "#ffb74d",
    "--purple": "#9d4edd",
    "--red": "#ef476f",
  };

  const recent = [
    { type: "danger", text: "Banned user @spammer123 for violations", time: "2 minutes ago" },
    { type: "warn", text: 'Approved game "Cyberpunk Adventure"', time: "15 minutes ago" },
    { type: "danger", text: "API response time threshold exceeded", time: "1 hour ago" },
    { type: "ok", text: "Verified 12 new user accounts", time: "2 hours ago" },
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

      {/* Charts */}
      <section className="grid-2">
        <LineChart title="Platform Growth" series={series} dims={dims} />
        <PieChart data={pieData} style={pieStyle} />
      </section>

      {/* Recent Admin Actions */}
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

      {/* Health (dynamic) */}
      <section className="health-grid">
        {healthLoading && (
          <>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card health skeleton">
                <div className="head">Loading…</div>
                <div className="foot">
                  <span className="state">—</span>
                  <span className="lamp" />
                </div>
              </div>
            ))}
          </>
        )}

        {!healthLoading && healthError && (
          <div className="card health error">
            <div className="head">Health</div>
            <div className="foot">
              <span className="state">Error</span>
              <span className="lamp" style={{ backgroundColor: "#EF4444" }} />
            </div>
            <div className="err-text">{healthError}</div>
          </div>
        )}

        {!healthLoading && !healthError && healthItems.map((h, i) => (
          <div key={i} className="card health" title={h.detail || undefined}>
            <div className="head">{h.title}</div>
            <div className="foot">
              <span className="state">
                {h.status}{h.latencyMs != null ? ` • ${h.latencyMs}ms` : ""}
              </span>
              <span className="lamp" style={{ backgroundColor: h.color }} />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
