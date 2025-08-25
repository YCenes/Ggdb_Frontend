import React, { useState } from "react";

export default function LineChart({ title, series, dims }) {
  const { days = [], users = [], games = [] } = series || {};
  const { w, h, pad, xAt, yAt, yTicks, pathUsers, pathGames } = dims || {};

  const [hi, setHi] = useState(null);
  const [tip, setTip] = useState({ x: 0, y: 0, show: false });

  return (
    <div className="card chart-card linechart-wrap">
      <div className="card-title">
        <span className="title-ico">📈</span> {title}
      </div>

      <div className="svg-holder" onMouseLeave={() => setTip((s) => ({ ...s, show: false }))}>
        <svg viewBox={`0 0 ${w} ${h}`} className="linechart">
          {/* Yatay grid + y etiketleri */}
          {yTicks.map((v, i) => {
            const y = yAt(v);
            return (
              <g key={`gy-${i}`}>
                <line className="grid" x1={pad} x2={w - pad} y1={y} y2={y} />
                <text className="tick" x={pad} y={y - 4} textAnchor="start">{v}</text>
              </g>
            );
          })}

          {/* Dikey grid */}
          {days.map((_, i) => (
            <line key={`gx-${i}`} className="grid" x1={xAt(i)} x2={xAt(i)} y1={pad} y2={h - pad} />
          ))}

          {/* Çizgiler */}
          <path d={pathUsers} className="line line-users" fill="none" />
          <path d={pathGames} className="line line-games" fill="none" />

          {/* Users noktalar */}
          {users.map((v, i) => {
            const cx = xAt(i), cy = yAt(v), active = hi === i;
            return (
              <g key={`u-${i}`}>
                <circle
                  cx={cx} cy={cy} r="14" fill="transparent" style={{ pointerEvents: "all" }}
                  onMouseEnter={() => {
                    setHi(i);
                    setTip({ x: cx, y: Math.min(yAt(users[i]), yAt(games[i])) - 12, show: true });
                  }}
                />
                <circle className={`dot-u ${active ? "is-active" : ""}`} cx={cx} cy={cy} r={active ? 6 : 4} />
              </g>
            );
          })}

          {/* Games noktalar */}
          {games.map((v, i) => {
            const cx = xAt(i), cy = yAt(v), active = hi === i;
            return (
              <g key={`g-${i}`}>
                <circle
                  cx={cx} cy={cy} r="14" fill="transparent" style={{ pointerEvents: "all" }}
                  onMouseEnter={() => {
                    setHi(i);
                    setTip({ x: cx, y: Math.min(yAt(users[i]), yAt(games[i])) - 12, show: true });
                  }}
                />
                <circle className={`dot-g ${active ? "is-active" : ""}`} cx={cx} cy={cy} r={active ? 6 : 4} />
              </g>
            );
          })}

          {/* X etiketleri */}
          {days.map((d, i) => (
            <text key={`tx-${i}`} className="tick" x={xAt(i)} y={h - 4} textAnchor="middle">{d}</text>
          ))}

          {/* Hover dikey kılavuz */}
          {hi !== null && tip.show && (
            <line className="hover-line" x1={xAt(hi)} x2={xAt(hi)} y1={pad} y2={h - pad} />
          )}
        </svg>

        {/* Nokta üstü mini tag'ler */}
        {hi !== null && tip.show && (
          <>
            <div className="point-tag users" style={{ left: Math.max(0, Math.min(xAt(hi) - 75, w)), top: yAt(users[hi]) - 30 }}>
              {users[hi]?.toLocaleString?.() ?? users[hi]}
            </div>
            <div className="point-tag games" style={{ left: Math.max(0, Math.min(xAt(hi) - 75, w)), top: yAt(games[hi]) - 30 }}>
              {games[hi]?.toLocaleString?.() ?? games[hi]}
            </div>
          </>
        )}

        {/* Tooltip panel */}
        {hi !== null && tip.show && (
          <div className="tooltip" style={{ left: Math.min(tip.x + 14, w - 220), top: Math.max(tip.y, 8) }}>
            <div className="tip-date">{days[hi]}</div>
            <div className="tip-row"><span className="dot dot-users" /> <b>Users</b> : {users[hi]?.toLocaleString?.() ?? users[hi]}</div>
            <div className="tip-row"><span className="dot dot-games" /> <b>Games</b> : {games[hi]?.toLocaleString?.() ?? games[hi]}</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="legend">
        <span><span className="dot" style={{ backgroundColor: "var(--blue)" }} /> Users</span>
        <span><span className="dot" style={{ backgroundColor: "var(--green)" }} /> Games</span>
      </div>
    </div>
  );
}
