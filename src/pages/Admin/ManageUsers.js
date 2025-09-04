import React, { useEffect, useMemo, useState } from "react";
import { Eye, Ban, Trash2, Search, User } from "lucide-react";
import { getUsers, deleteUser as apiDeleteUser, updateUserRole } from "../../services/admin.api";
import "../../styles/pages/admin/_manage-users.scss";
import Flag from "../../components/Flag";

const ROLES = ["All Roles", "Admin", "User"];
const COUNTRIES = [
  { label: "All Countries", value: "ALL", flag: "" },
  { label: "Türkiye", value: "TR", flag: flagEmojiFromCode("TR") },
];

// Ülke adı → ISO2 kod eşlemesi (gerektikçe genişlet)
const NAME_TO_ISO = {
  "Türkiye": "TR",
  "Turkey": "TR",
  "United States": "US",
  "USA": "US",
  "United Kingdom": "GB",
  "UK": "GB",
  "Germany": "DE",
  "France": "FR",
  "Spain": "ES",
  "Italy": "IT",
  "Canada": "CA",
  "Netherlands": "NL",
  "Japan": "JP",
};

// ISO2 → emoji dönüştürücü
function toFlagEmoji(iso2) {
  if (!iso2 || iso2.length !== 2) return "🏳️"; // bilinmiyorsa beyaz bayrak
  const base = 0x1F1E6; // Regional Indicator Symbol Letter A
  const chars = iso2.toUpperCase().split("");
  return String.fromCodePoint(base + (chars[0].charCodeAt(0) - 65))
       + String.fromCodePoint(base + (chars[1].charCodeAt(0) - 65));
}



function flagEmojiFromCode(code = "") {
  const cc = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "🏳️";
  const A = 0x41, RI = 0x1F1E6; // Regional Indicator base
  return String.fromCodePoint(
    cc.charCodeAt(0) - A + RI,
    cc.charCodeAt(1) - A + RI
  );
}
function Avatar({ name, imageUrl }) {
  const initials = React.useMemo(() => {
    const parts = (name || "").trim().split(/\s+|_/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [name]);

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="rounded-3 object-fit-cover me-3"
        style={{ width: 36, height: 36 }}
      />
    );
  }
  return (
    <div
      className="rounded-3 d-grid place-items-center me-3 fw-bold text-white"
      style={{ width: 36, height: 36, background: "#5b47ff" }}
    >
      {initials}
    </div>
  );
}

export default function ManageUsersBootstrap() {
  const [tab, setTab] = useState("active"); // active | banned
  const [q, setQ] = useState("");
  const [role, setRole] = useState("All Roles");
  const [country, setCountry] = useState("ALL");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [deletingIds, setDeletingIds] = useState(new Set());

  // Fetch
  useEffect(() => {
    (async () => {
      try {
        const data = await getUsers();
        const mapped = (data || []).map((u, idx) => {
          const id = u.id ?? u.Id ?? idx;
          const username = u.userName ?? u.UserName ?? "-";
          const email = u.email ?? u.Email ?? "-";
          let role = "User";
          if (u.userType !== undefined && u.userType !== null) {
            if (typeof u.userType === "string") role = u.userType;
            else role = u.userType === 1 ? "Admin" : "User";
          }
          const birthdate = u.birthdate ?? u.Birthdate ?? null;
          const profileImageUrl = u.profileImageUrl ?? u.ProfileImageUrl ?? null;

          // ülke
  const countryName = u.country ?? u.Country ?? "Türkiye";
  // Backend kodu varsa kullan; yoksa isimden bul; yine yoksa TR/UN gibi saçma tahmine gitme
  const iso2 =
    (u.countryCode ?? u.CountryCode ?? "").toString().toUpperCase() ||
    NAME_TO_ISO[countryName] ||
    null;

  const flag = toFlagEmoji(iso2 || "");
     

          return {
            id: id.toString(),
            username,
            email,
            role,
            dob: birthdate,
            country: {
      code: iso2 || "",
      name: countryName,
      flag
    },
            plan: "Free",
            profileImage: profileImageUrl,
          };
        });
        setUsers(mapped);
      } catch (e) {
        console.error(e);
        setUsers([]);
      }
    })();
  }, []);

  // Filters
  const filtered = useMemo(() => {
    let list = users.filter(() => tab === "active"); // demo
    if (q) {
      const s = q.toLowerCase();
      list = list.filter(
        (u) =>
          (u.username || "").toLowerCase().includes(s) ||
          (u.email || "").toLowerCase().includes(s) ||
          (u.id || "").toLowerCase().includes(s)
      );
    }
    if (role !== "All Roles")
      list = list.filter(
        (u) => (u.role || "").toLowerCase() === role.toLowerCase()
      );
    if (country !== "ALL")
      list = list.filter((u) => (u.country?.code || "") === country);
    return list;
  }, [users, tab, q, role, country]);

  const total = filtered.length;
  const lastPage = Math.max(1, Math.ceil(total / rowsPerPage));
  const pageItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);
  useEffect(() => { if (page > lastPage) setPage(lastPage); }, [lastPage, page]);

  const handleChangeRole = async (id, nextRole) => {
  // Optimistic update
  setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: nextRole } : u)));

  try {
    await updateUserRole(id, nextRole);
    // success – zaten UI güncellendi
  } catch (err) {
    console.error("updateUserRole error:", err);
    alert("Rol güncellenemedi.");
    // rollback
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, role: u.role === "Admin" ? "User" : "Admin" } : u
      )
    );
  }
};

   const handleDelete = async (id) => {
   // Emin misin?
   const ok = window.confirm("Bu kullanıcıyı silmek istediğine emin misin?");
   if (!ok) return;

   // optimistic update: önce UI'dan kaldır
   const prev = users;
   const next = users.filter(u => u.id !== id);
   setUsers(next);

   // butonu kilitle
   setDeletingIds(s => new Set([...s, id]));
   try {
     await apiDeleteUser(id);
     // başarı — zaten listeden kaldırdık, istersen alert gösterebilirsin+     // alert("Kullanıcı silindi.");
   } catch (err) {
     console.error("deleteUser error:", err);
     // hata — geri al
     setUsers(prev);
     alert("Silme işlemi başarısız oldu. Lütfen tekrar deneyin.");
   } finally {
     setDeletingIds(s => {
       const copy = new Set(s);
       copy.delete(id);
       return copy;
     });
   }
 };

 




  return (
    <div className="manage-users-bs container-fluid py-3 mt-5">
      {/* Header */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <User size={22} />
        <div>
          <h1 className="h5 mb-1">Manage Users</h1>
          <p className="mb-0 text-secondary small">
  <span className="text-info-emphasis fw-semibold">
    {pageItems.length} shown
  </span>{" "}
  / {total} total
</p>

        </div>
      </div>

      {/* Toolbar */}
      <div className="row g-2 align-items-center mb-3">
        <div className="col-12 col-lg-5 d-flex gap-2">
          <button
            className={`btn fw-semibold tab-pill ${tab === "active" ? "btn-primary" : "btn-dark-subtle"}`}
            onClick={() => setTab("active")}
          >
            <span className="me-1">✔</span> Active Users
          </button>
          <button
            className={`btn fw-semibold tab-pill ${tab === "banned" ? "btn-primary" : "btn-dark-subtle"}`}
            onClick={() => setTab("banned")}
          >
            <span className="me-1">⛔</span> Banned / Deleted
            <span className="badge rounded-pill bg-danger ms-2">4</span>
          </button>
        </div>

        <div className="col-12 col-lg-7">
          <div className="row g-2">
            <div className="col-12 col-md">
              <div className="position-relative">
                <Search size={16} className="position-absolute top-50 translate-middle-y ms-2 opacity-75" />
                <input
                  className="form-control ps-5"
                  placeholder="Search by name or email…"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select fw-semibold"
                value={role}
                onChange={(e) => { setRole(e.target.value); setPage(1); }}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select fw-semibold"
                value={country}
                onChange={(e) => { setCountry(e.target.value); setPage(1); }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.flag ? `${c.flag} ` : ""}{c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Card/Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-dark table-borderless align-middle mb-0">
              <thead className="table-header sticky-top">
                <tr>
                  <th className="w-25">Username</th>
                  <th className="d-none d-xl-table-cell">Email</th>
                  <th className="text-start role-th">Role</th>
                  <th>DOB</th>
                  <th>Country</th>
                  <th className="d-none d-lg-table-cell">Plan</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((u) => (
                  <tr key={u.id} className="row-hover">
                    {/* Username */}
                    <td>
                      <div className="d-flex align-items-center">
                        <Avatar name={u.username} imageUrl={u.profileImage} />
                        <div className="d-flex flex-column">
                          <div className="d-flex align-items-center gap-1">
                            <span className="fw-semibold">{u.username}</span>
                            <span className="text-warning small">✳</span>
                          </div>
                          <small className="text-secondary">{u.id}</small>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="d-none d-xl-table-cell">{u.email}</td>

                    {/* Role (tam Role başlığının altında ve ortada görünmesi için özel sınıf) */}
                    <td className="role-td">
                      <div className="role-cell">
                        <select
                          className="form-select form-select-sm role-select"
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                        >
                          {ROLES.filter((r) => r !== "All Roles").map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* DOB */}
                    <td>
                      {u.dob
                        ? new Date(u.dob).toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })
                        : "-"}
                    </td>

                    {/* Country */}
                   <td>
  <Flag code={u.country.code} title={u.country.name} />
  <span className="d-none d-sm-inline">{u.country.name}</span>
</td>

                    {/* Plan */}
                    <td className="d-none d-lg-table-cell">{u.plan}</td>

                    {/* Actions */}
                    <td>
                      <div className="d-flex gap-2 justify-content-start">
                        <button className="btn btn-sm btn-icon btn-view" title="View">
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-sm btn-icon btn-warn" title="Ban">
                          <Ban size={16} />
                        </button>
                        <button
                        className="btn btn-sm btn-outline-danger icon-btn"
                        title="Delete"
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingIds.has(u.id)}
                        aria-busy={deletingIds.has(u.id)}
                        >
                        <Trash2 size={16} />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 px-3 py-3 border-top">
            <div className="d-flex align-items-center gap-2 text-secondary">
              <span className="small">Rows per page:</span>
              <select
                className="form-select form-select-sm w-auto fw-semibold"
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
              >
                {[5,10,20].map((n)=>(
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="d-flex align-items-center gap-3 text-secondary small">
              <span>
                Showing {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, total)} of {total}
              </span>
              <div className="btn-group">
                <button
                  className="btn btn-sm btn-outline-light"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                {Array.from({ length: lastPage }).map((_, i) => {
                  const n = i + 1;
                  return (
                    <button
                      key={n}
                      className={`btn btn-sm ${page === n ? "btn-primary" : "btn-outline-light"}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  );
                })}
                <button
                  className="btn btn-sm btn-outline-light"
                  disabled={page === lastPage}
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
