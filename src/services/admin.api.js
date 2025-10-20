import API from "./api.js";

/** @returns {Promise<{totalUsers:number,totalGames:number,windowDays:number,users:{current:number,previous:number,deltaPct:number},games:{current:number,previous:number,deltaPct:number}}>} */
export async function getUserGameCount(params = {}) {
  const { windowDays = 7 } = params;
  const r = await API.get("/admin/usergamecount", { params: { windowDays } });
  return r?.data ?? { totalUsers: 0, totalGames: 0, users: { deltaPct: 0 }, games: { deltaPct: 0 } };
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

export async function getGameById(id) {
  const res = await API.get(`/admin/games/${id}`);
  return res.data; // GameDetailDto
}

export async function updateGameById(id, dto) {
  const res = await API.put(`/admin/games/${id}`, dto);
  return res.data; // { message: "Game ... updated" } veya 200 ok
}

export async function getUsers() {
  // Cookie tabanlı auth varsa withCredentials true; bearer varsa interceptor gönderecektir.
  const { data } = await API.get("/admin/getUsers", { withCredentials: true });
  return data; // List<UserDto>
}

export async function deleteUser(id) {
  const { data } = await API.delete(`/admin/deleteUser/${id}`);
  return data; // { message: "User xxx deleted" }
}

export async function updateUserRole(id, role) {
  const { data } = await API.patch(`/admin/${id}/role`, { role });
  return data;
}

export async function setUserBan(id, isBanned) {
  return API.patch(`/admin/${id}/ban`, { isBanned });
}
