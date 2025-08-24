import React, { useMemo, useState } from "react";
import "../../styles/pages/admin/_overview.scss";

const ArrowUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
    <path d="M12 4l6 6h-4v10h-4V10H6z" fill="currentColor" />
  </svg>
);

const Dot = ({ color = "var(--muted-3)" }) => (
  <span className="dot" style={{ backgroundColor: color }} />
);

export default function AdminOverview() {
  // --- MOCK DATA
  const kpis = [
    { icon: "👥", label: "Total Users", value: 14, delta: "+12%" },
    { icon: "🎮", label: "Total Games", value: 30, delta: "+5%" },
    { icon: "⭐", label: "Total Reviews", value: 28, delta: "+18%" },
  ];

  const days = ["Jun 24", "Jun 25", "Jun 26", "Jun 27", "Jun 28", "Jun 29", "Jun 30"];
  const seriesUsers = [12000, 12100, 12350, 12500, 12620, 12710, 12800];
  const seriesGames = [5200, 5250, 5280, 5300, 5325, 5350, 5380];

  /* ---------------- LINE CHART (paylaşılan y-ölçek + tooltip) ---------------- */
  const { w, h, pad, xAt, yAt, xTicks, yTickVals, pathUsers, pathGames, yMax } = useMemo(() => {
    const w = 640, h = 280, pad = 32;

    const xAt = (i) => pad + (i * (w - pad * 2)) / (days.length - 1);

    // paylaşılan y-ölçek
    const rawMax = Math.max(...seriesUsers, ...seriesGames);
    const niceTop = (v) => Math.ceil(v / 3500) * 3500;
    const yMin = 0;
    const yMax = Math.max(14000, niceTop(rawMax)); // en az 14000'e sabitle
    const yAt = (v) => pad + (h - pad * 2) * (1 - (v - yMin) / (yMax - yMin || 1));

    const pathFrom = (arr) => arr.map((v, i) => `${i ? "L" : "M"} ${xAt(i)} ${yAt(v)}`).join(" ");

    const yTickVals = [0, 3500, 7000, 10500, 14000].filter((v) => v <= yMax);
    const xTicks = days.map((d, i) => ({ x: xAt(i), label: d }));

    return {
      w, h, pad, xAt, yAt, xTicks, yTickVals,
      yMax,
      pathUsers: pathFrom(seriesUsers),
      pathGames: pathFrom(seriesGames),
    };
  }, [days, seriesUsers, seriesGames]);

  const [hi, setHi] = useState(null); // hover index
  const [tip, setTip] = useState({ x: 0, y: 0, show: false });

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const iFloat = (mx - pad) / ((w - pad * 2) / (days.length - 1));
    const i = Math.max(0, Math.min(days.length - 1, Math.round(iFloat)));
    setHi(i);
    // tooltip'i iki seriden daha yukarıda göstermek için min(yUsers,yGames) - 12
    const y = Math.min(yAt(seriesUsers[i]), yAt(seriesGames[i])) - 12;
    setTip({ x: xAt(i), y, show: true });
  };
  const onLeave = () => setTip((s) => ({ ...s, show: false }));

  /* ---------------- PIE CHART (seninki aynen) ---------------- */
  const data = [
    { label: "Registrations", value: 25, color: "var(--blue)" },
    { label: "Game Submissions", value: 20, color: "var(--green)" },
    { label: "Reviews", value: 35, color: "var(--orange)" },
    { label: "Other", value: 5, color: "var(--purple)" },
    { label: "Reports", value: 15, color: "var(--red)" },
  ];

  const style = {
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

  const health = [
    { title: "Server", status: "Healthy", color: "#22C55E" },
    { title: "Database", status: "Healthy", color: "#22C55E" },
    { title: "Cdn", status: "Healthy", color: "#22C55E" },
    { title: "Apis", status: "Healthy", color: "#22C55E" },
  ];

  return (
    <div className="admin-page">
      <header className="page-head">
        <h1>Admin Overview</h1>
        <p>Monitor your platform’s performance and activity</p>
      </header>

      {/* KPIs */}
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
        {/* ---------------- LINE CHART ---------------- */}
        <div className="card chart-card linechart-wrap">
          <div className="card-title">
            <span className="title-ico">📈</span> Platform Growth
          </div>

          <div className="svg-holder">
            <svg
              viewBox={`0 0 ${w} ${h}`}
              className="linechart"
              onMouseMove={onMove}
              onMouseLeave={onLeave}
            >
              {/* GRID (yatay) */}
              {yTickVals.map((v, i) => {
                const y = yAt(v);
                return (
                  <g key={`gy-${i}`}>
                    <line className="grid" x1={pad} x2={w - pad} y1={y} y2={y} />
                    <text className="tick" x={pad} y={y - 4} textAnchor="start">
                      {v}
                    </text>
                  </g>
                );
              })}

              {/* GRID (dikey) */}
              {xTicks.map((t, i) => (
                <line key={`gx-${i}`} className="grid" x1={t.x} x2={t.x} y1={pad} y2={h - pad} />
              ))}

              {/* ÇİZGİLER (paylaşılan ölçek) */}
              <path d={pathUsers} className="line line-users" fill="none" />
              <path d={pathGames} className="line line-games" fill="none" />

              {/* NOKTALAR */}
              {seriesUsers.map((v, i) => (
                <circle key={`u-${i}`} className="dot-u" cx={xAt(i)} cy={yAt(v)} r="4" />
              ))}
              {seriesGames.map((v, i) => (
                <circle key={`g-${i}`} className="dot-g" cx={xAt(i)} cy={yAt(v)} r="4" />
              ))}

              {/* X etiketleri */}
              {xTicks.map((t, i) => (
                <text key={`tx-${i}`} className="tick" x={t.x} y={h - 4} textAnchor="middle">
                  {t.label}
                </text>
              ))}

              {/* Hover dikey kılavuz */}
              {hi !== null && tip.show && (
                <line className="hover-line" x1={xAt(hi)} x2={xAt(hi)} y1={pad} y2={h - pad} />
              )}

              {/* Etkileşim için overlay */}
              <rect x="0" y="0" width={w} height={h} fill="transparent" pointerEvents="all" />
            </svg>

            {/* TOOLTIP */}
            {hi !== null && tip.show && (
              <div
                className="tooltip"
                style={{
                  left: Math.min(tip.x + 14, w - 220), // sağ kenardan taşma koruması
                  top: Math.max(tip.y, 8),
                }}
              >
                <div className="tip-date">{days[hi]}</div>
                <div className="tip-row">
                  <span className="dot dot-users" /> <b>Users</b> : {seriesUsers[hi].toLocaleString()}
                </div>
                <div className="tip-row">
                  <span className="dot dot-games" /> <b>Games</b> : {seriesGames[hi].toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="legend">
            <span><Dot color="var(--blue)" /> Users</span>
            <span><Dot color="var(--green)" /> Games</span>
          </div>
        </div>

        {/* ---------------- PIE CHART (seninki) ---------------- */}
        <div className="card pie-card" style={style}>
          <div className="card-title">
            <span className="title-ico">👁️</span> Activity Distribution
          </div>

          <div className="pie-wrap">
            <svg viewBox="0 0 420 280" className="piechart">
              {/* merkez: (210,140), r:85 */}
              <circle cx="210" cy="140" r="85" className="pie-bg" />
              {(() => {
                const cx = 210, cy = 140, r = 85;
                let start = 0;
                const toRad = (deg) => (deg - 90) * Math.PI / 180;

                return data.map((item, i) => {
                  const angle = (item.value / 100) * 360;
                  const end = start + angle;

                  const x1 = cx + r * Math.cos(toRad(start));
                  const y1 = cy + r * Math.sin(toRad(start));
                  const x2 = cx + r * Math.cos(toRad(end));
                  const y2 = cy + r * Math.sin(toRad(end));
                  const large = angle > 180 ? 1 : 0;
                  const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;

                  const mid = start + angle / 2;
                  const rx = cx + (r + 8) * Math.cos(toRad(mid));
                  const ry = cy + (r + 8) * Math.sin(toRad(mid));
                  const lx = cx + (r + 28) * Math.cos(toRad(mid));
                  const ly = cy + (r + 28) * Math.sin(toRad(mid));
                  const hx = lx + (Math.cos(toRad(mid)) >= 0 ? 40 : -40);
                  const anchor = Math.cos(toRad(mid)) >= 0 ? "start" : "end";
                  const label = `${item.label} ${item.value}%`;

                  const slice = (
                    <g key={i}>
                      <path d={d} fill={item.color} className="pie-slice" />
                      <path d={`M ${rx} ${ry} L ${lx} ${ly} L ${hx} ${ly}`} className="leader" />
                      <text x={hx} y={ly - 4} textAnchor={anchor} className={`label label-${i}`}>
                        {label}
                      </text>
                    </g>
                  );

                  start = end;
                  return slice;
                });
              })()}
            </svg>
          </div>
        </div>
      </section>

      {/* RECENT ACTIONS */}
      <section className="card actions">
        <div className="card-title">
          <span className="title-ico">🕒</span> Recent Admin Actions
        </div>
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

      {/* HEALTH */}
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
