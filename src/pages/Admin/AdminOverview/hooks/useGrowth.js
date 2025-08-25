import { useEffect, useMemo, useState } from "react";
import { getGrowth } from "../services/admin.api.js";
import { addDays, fmtDay, toISODate } from "../utils/date.js";

/**
 * @param {{days?:number, mode?:'daily'|'cumulative'}} opts
 * @returns {{ series:{days:string[],users:number[],games:number[]}, dims:object, loading:boolean, err:any }}
 */
export function useGrowth(opts = {}) {
  const daysCount = opts.days ?? 7;
  const mode = opts.mode ?? "cumulative";

  const [series, setSeries] = useState({ days: [], users: [], games: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const end = new Date();
        const start = addDays(end, -(daysCount - 1));
        const rows = await getGrowth({ from: toISODate(start), to: toISODate(end), mode });

        rows.sort((a, b) => new Date(a.date) - new Date(b.date));
        const days = rows.map((r) => fmtDay(r.date));
        const users = rows.map((r) => r.users);
        const games = rows.map((r) => r.games);

        if (alive) setSeries({ days, users, games });
      } catch (e) {
        if (alive) setErr(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [daysCount, mode]);

  // grafik boyutları & path hesapları
  const dims = useMemo(() => {
    const w = 640, h = 280, pad = 32;
    const xAt = (i) => pad + (i * (w - pad * 2)) / Math.max(1, (series.days.length - 1));

    const rawMax = Math.max(0, ...series.users, ...series.games);
    const niceTop = (v) => Math.ceil(v / 3500) * 3500;
    const yMax = Math.max(14000, niceTop(rawMax));
    const yAt = (v) => pad + (h - pad * 2) * (1 - (v - 0) / (yMax - 0 || 1));

    const toPath = (arr) => arr.map((v, i) => `${i ? "L" : "M"} ${xAt(i)} ${yAt(v)}`).join(" ");

    const yTicks = [0, 3500, 7000, 10500, 14000].filter((v) => v <= yMax);

    return { w, h, pad, xAt, yAt, yTicks, yMax, pathUsers: toPath(series.users), pathGames: toPath(series.games) };
  }, [series]);

  return { series, dims, loading, err };
}
