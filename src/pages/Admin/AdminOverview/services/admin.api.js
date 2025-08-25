import API from "../../../../services/api.js";

/** @returns {Promise<{totalUsers:number,totalGames:number}>} */
export async function getUserGameCount() {
  const r = await API.get("/admin/usergamecount");
  return r?.data ?? { totalUsers: 0, totalGames: 0 };
}

/**
 * @param {{from:string,to:string,mode?:'daily'|'cumulative'}} params
 * @returns {Promise<Array<{date:string, users:number, games:number}>>}
 */
export async function getGrowth(params) {
  const r = await API.get("/admin/growth", { params });
  const arr = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.data) ? r.data.data : []);
  return arr.map((x) => ({
    date: x.date ?? x.day ?? x.ts,
    users: Number(x.users ?? x.totalUsers ?? x.u ?? 0),
    games: Number(x.games ?? x.totalGames ?? x.g ?? 0),
  }));
}
