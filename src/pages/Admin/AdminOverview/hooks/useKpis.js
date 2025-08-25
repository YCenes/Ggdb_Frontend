import { useEffect, useState } from "react";
import { getUserGameCount } from "../services/admin.api.js";

/** KPI kutuları için toplamları getirir. */
export function useKpis() {
  const [data, setData] = useState({ totalUsers: 0, totalGames: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getUserGameCount();
        if (alive) setData(res);
      } catch (e) {
        if (alive) setErr(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return { data, loading, err };
}
