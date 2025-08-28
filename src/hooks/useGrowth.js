import { useEffect, useMemo, useState } from "react";
import { getGrowth } from "../services/admin.api.js";
import { addDays, fmtDay, toISODate } from "../services/date.js";

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
    const niceTop = (v) => {
  if (v <= 10) return 10;            // en az 10’a kadar göster
  if (v <= 100) return Math.ceil(v / 10) * 10; 
  if (v <= 1000) return Math.ceil(v / 100) * 100;
  return Math.ceil(v / 1000) * 1000;
};
    const yMax = niceTop(rawMax);
    const yAt = (v) => pad + (h - pad * 2) * (1 - (v - 0) / (yMax - 0 || 1));

    const toPath = (arr) => arr.map((v, i) => `${i ? "L" : "M"} ${xAt(i)} ${yAt(v)}`).join(" ");

    const makeStep = (top) => {
  // 1–2–5 ölçeği: daha “güzel” basamaklar
  const targets = 4; // ~4 aralık (5 tick)
  const rough = top / targets;
  const pow10 = Math.pow(10, Math.floor(Math.log10(Math.max(1, rough))));
  const n = rough / pow10;
  let step;
  if (n <= 1) step = 1 * pow10;
  else if (n <= 2) step = 2 * pow10;
  else if (n <= 5) step = 5 * pow10;
  else step = 10 * pow10;
  return step;
};

const step = makeStep(yMax);
const yTicks = [];
for (let v = 0; v <= yMax + 1e-6; v += step) {
  yTicks.push(Math.round(v));
}
// son tick tam tepe değilse ekle
if (yTicks[yTicks.length - 1] !== yMax) yTicks.push(yMax);


    return { w, h, pad, xAt, yAt, yTicks, yMax, pathUsers: toPath(series.users), pathGames: toPath(series.games) };
  }, [series]);

  return { series, dims, loading, err };
}
