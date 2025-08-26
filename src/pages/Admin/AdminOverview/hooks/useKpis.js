// hooks/useKpis.js
import { useEffect, useState } from "react";
import { getUserGameCount } from "../services/admin.api.js";

function fmtDelta(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return "0%";
  const s = pct.toFixed(0);
  return (pct >= 0 ? "+" : "") + s + "%";
}

export function useKpis({ windowDays = 7 } = {}) {
  const [data, setData] = useState({
    totalUsers: 0,
    totalGames: 0,
    users: { deltaPct: 0 },
    games: { deltaPct: 0 },
    windowDays,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getUserGameCount({ windowDays });
        if (!alive) return;
        setData(res);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [windowDays]);

  const kpis = [
    { icon: "👥", label: "Total Users", value: data.totalUsers, delta: fmtDelta(data.users?.deltaPct) },
    { icon: "🎮", label: "Total Games", value: data.totalGames, delta: fmtDelta(data.games?.deltaPct) },
    { icon: "⭐", label: "Total Reviews", value: 28, delta: "+18%" }, // Reviews için backend yoksa şimdilik sabit
  ];

  return { data, kpis, loading };
}
