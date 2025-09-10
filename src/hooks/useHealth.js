import { useEffect, useState } from "react";
import API from "../services/api"; // axios.create({ baseURL: "http://localhost:5201/api" })

export function useHealth({ refreshMs = 0 } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const STATUS_LABELS = { 0: "Healthy", 1: "Degraded", 2: "Down" };
  function normalizeStatus(s) {
    if (typeof s === "number") return STATUS_LABELS[s] ?? "Unknown";
    if (!s) return "Healthy";
    const t = String(s).toLowerCase();
    if (t.includes("healthy")) return "Healthy";
    if (t.includes("degraded")) return "Degraded";
    if (t.includes("down")) return "Down";
    return s;
  }

  async function fetchOnce() {
    try {
      setLoading(true);
      const { data } = await API.get("/system/health");
      const mapped = (data?.items || data?.Items || []).map((it) => {
        const status = normalizeStatus(it.status ?? it.Status);
        const color =
          it.color ||
          it.Color ||
          (status === "Healthy" ? "#22C55E" : status === "Degraded" ? "#F59E0B" : "#EF4444");
        return {
          title: it.title || it.Title,
          status,
          color,
          latencyMs: it.latencyMs ?? it.LatencyMs ?? null,
          detail: it.detail || it.Detail || null,
        };
      });
      setItems(mapped);
      setError(null);
    } catch (e) {
      setError(e?.message || "Failed to load health");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    let timer;
    (async () => {
      if (!alive) return;
      await fetchOnce();
      if (refreshMs && refreshMs > 0) {
        timer = setInterval(() => { if (alive) fetchOnce(); }, refreshMs);
      }
    })();
    return () => { alive = false; if (timer) clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMs]);

  return { items, loading, error, refetch: fetchOnce };
}
