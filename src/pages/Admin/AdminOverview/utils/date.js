export function toISODate(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const utc = new Date(x.getTime() - x.getTimezoneOffset() * 60000);
  return utc.toISOString().slice(0, 10);
}

export function fmtDay(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
