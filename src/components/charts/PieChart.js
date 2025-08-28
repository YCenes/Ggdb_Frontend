import React from "react";

export default function PieChart({ data, style }) {
  return (
    <div className="card pie-card" style={style}>
      <div className="card-title">
        <span className="title-ico">👁️</span> Activity Distribution
      </div>

      <div className="pie-wrap">
        <svg viewBox="0 0 420 280" className="piechart">
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

              start = end;
              return (
                <g key={i}>
                  <path d={d} fill={item.color} className="pie-slice" />
                  <path d={`M ${rx} ${ry} L ${lx} ${ly} L ${hx} ${ly}`} className="leader" />
                  <text x={hx} y={ly - 4} textAnchor={anchor} className={`label label-${i}`}>
                    {label}
                  </text>
                </g>
              );
            });
          })()}
        </svg>
      </div>
    </div>
  );
}
