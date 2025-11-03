// pages/admin/Modals/ReviewsAdminModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  adminGetGameReviews,
  adminGetReviewReplies,
  adminVoteReview,
  adminDeleteReview,
  adminCreateReply,
  adminDeleteReply,
  adminGetReviewVoters,
} from "../../../services/adminReviews.api";
import { getUsers } from "../../../services/admin.api"; // tüm kullanıcıları çekip mapleyeceğiz

function StarDisplay({ value = 0 }) {
  const v = Number(value || 0);
  return (
    <div className="rev-stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < v ? "on" : "off"}>★</span>
      ))}
    </div>
  );
}

export default function ReviewsAdminModal({ open, onClose,editable, gameId, adminUserId, }) {
  const [state, setState] = useState({ items: [], total: 0, page: 1, pageSize: 12 });
  const [loading, setLoading] = useState(false);
  

  // users cache: { [userId]: { userName, profileImageUrl } }
  const [usersMap, setUsersMap] = useState({});

  const [replies, setReplies] = useState({});    // { [reviewId]: { loading, items:[], total, page } }
  const [replyDraft, setReplyDraft] = useState({}); // { [reviewId]: "..." }

  // confirm modal (delete için)
  const [confirmState, setConfirmState] = useState({ open:false, message:"", resolve:null });
  const ask = (message) => new Promise((resolve)=> setConfirmState({ open:true, message, resolve }));
  const onConfirmYes = () => { confirmState.resolve?.(true); setConfirmState({ open:false, message:"", resolve:null }); };
  const onConfirmNo  = () => { confirmState.resolve?.(false); setConfirmState({ open:false, message:"", resolve:null }); };

  // voters modal
  const [votersOpen, setVotersOpen] = useState(false);
  const [votersType, setVotersType] = useState("likes"); // 'likes' | 'dislikes'
  const [votersLoading, setVotersLoading] = useState(false);
  const [voters, setVoters] = useState([]); // [{userId}]

  const upsertUsers = (arr) => {
    if (!Array.isArray(arr) || !arr.length) return;
    setUsersMap((prev) => {
      const next = { ...prev };
      for (const u of arr) {
        if (!u?.id) continue;
        next[u.id] = next[u.id] || { userName: u.userName || u.username || u.email?.split("@")[0] || u.id.slice(0,8), profileImageUrl: u.profileImageUrl || null };
      }
      return next;
    });
  };

  const fetchAllUsersOnce = async () => {
    // admin.getUsers() → tüm kullanıcıları çeker; sonra map'e basarız.
    // İleride istersen "basic by ids" gibi hafif endpoint düşeriz.
    try {
      const list = await getUsers();
      upsertUsers(list);
    } catch { /* yoksay */ }
  };

  const refresh = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminGetGameReviews(gameId, page, state.pageSize, adminUserId || null);
      setState({ ...res, page, pageSize: res.pageSize || state.pageSize });

      // review sahiplerini kullanıcı map'e koy
      const ids = Array.from(new Set((res.items || []).map((x)=>x.userId).filter(Boolean)));
      if (ids.length && Object.keys(usersMap).length === 0) {
        // mevcut tüm userları bir kere çek ve cache'e koy (basit çözüm)
        await fetchAllUsersOnce();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !gameId) return;
    refresh(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gameId]);

  if (!open) return null;

  const displayUser = (userId) => {
    const u = usersMap[userId];
    return {
      name: u?.userName || userId?.slice(0,8) || "Unknown",
      avatar: u?.profileImageUrl || `https://i.pravatar.cc/80?u=${userId}`,
    };
  };

  

  const deleteReview = async (id) => {
    if (!(await ask("Delete this review?"))) return;
    await adminDeleteReview(id);
    refresh(state.page);
  };

  const loadReplies = async (rid) => {
    const cur = replies[rid];
    if (cur?.items?.length) {
      setReplies((p) => { const n = { ...p }; delete n[rid]; return n; });
      return;
    }
    setReplies((p) => ({ ...p, [rid]: { loading: true, items: [], total: 0, page: 1 } }));
    const res = await adminGetReviewReplies(rid, 1, 20);
    setReplies((p) => ({ ...p, [rid]: { loading: false, items: res.items || [], total: res.total || 0, page: 1 } }));
    // reply sahiplerinin kullanıcılarını da map'e koy
    if (Object.keys(usersMap).length === 0) await fetchAllUsersOnce();
  };

  const sendReply = async (rid) => {
    const txt = (replyDraft[rid] || "").trim();
    if (!txt) return;
    if (!adminUserId) return alert("Login required to reply.");
    await adminCreateReply(rid, { userId: adminUserId, comment: txt });
    setReplyDraft((p) => ({ ...p, [rid]: "" }));
    const res = await adminGetReviewReplies(rid, 1, 20);
    setReplies((p) => ({ ...p, [rid]: { loading: false, items: res.items || [], total: res.total || 0, page: 1 } }));
    setState((prev) => ({
      ...prev,
      items: prev.items.map((r) => (r.id === rid ? { ...r, replyCount: (r.replyCount ?? 0) + 1 } : r)),
    }));
  };

  const removeReply = async (replyId, rid) => {
    if (!(await ask("Delete this reply?"))) return;
    await adminDeleteReply(replyId);
    const res = await adminGetReviewReplies(rid, 1, 20);
    setReplies((p) => ({ ...p, [rid]: { loading: false, items: res.items || [], total: res.total || 0, page: 1 } }));
  };

  const fmtDate = (d) => {
    if (!d) return null;
    const t = new Date(d);
    if (isNaN(t.getTime())) return null;
    return t.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };

  // voters modalı aç
  const openVoters = async (reviewId, type) => {
    setVotersType(type);
    setVotersOpen(true);
    setVotersLoading(true);
    try {
      const res = await adminGetReviewVoters(reviewId);
      const arr = type === "likes" ? (res.likes || []) : (res.dislikes || []);
      setVoters(arr);
      // kullanıcı cache boşsa doldur
      if (Object.keys(usersMap).length === 0) await fetchAllUsersOnce();
    } finally {
      setVotersLoading(false);
    }
  };

  return (
    <div className="gd-modal-wrap" role="dialog" aria-modal="true">
      <div className="gd-modal-box big">
        <div className="gd-modal-head">
          <h3>Reviews</h3>
          
        </div>

        <div className="gd-modal-body reviews-admin">
          {loading ? (
            <div className="loading">Loading…</div>
          ) : (
            <>
              {state.items.map((r) => {
                const rid = r.id;
                const owner = displayUser(r.userId);

                return (
                  <article key={rid} className="rev-card">
                    <div className="rev-top">
                      <div className="left">
                        <img src={owner.avatar} alt={owner.name} className="avatar" />
                        <div className="meta">
                          <div className="row">
                            <span className="username">{owner.name}</span>
                            {r.todayDate && <span className="date">{fmtDate(r.todayDate)}</span>}
                          </div>
                          <StarDisplay value={r.starCount} />
                        </div>
                      </div>

                      <div className="right actions">
                        <button
                          className={`act ${r.myVote === 1 ? "on" : ""}`}
                          onClick={() => openVoters(rid, "likes")}
                          title="Click to like, double-click to see who liked"
                        >
                          👍 {r.likeCount ?? 0}
                        </button>

                        <button
                          className={`act ${r.myVote === -1 ? "on" : ""}`}
                          onClick={() => openVoters(rid, "dislikes")}
                          title="Click to dislike, double-click to see who disliked"
                        >
                          👎 {r.dislikeCount ?? 0}
                        </button>

                        {/* Review delete */}
                        {editable && (
                        <button className="act danger" onClick={() => deleteReview(rid)}>🗑 Delete</button>
                        )}

                        <button className="act" onClick={() => loadReplies(rid)}>
                          💬 {replies[rid]?.items?.length ? "Hide" : `Replies (${r.replyCount ?? 0})`}
                        </button>
                      </div>
                    </div>

                    <div className="rev-body">
                      <div className="commentWrap">
                        <p className="comment">{r.comment || <i>No comment</i>}</p>
                      </div>
                    </div>

                    {/* Replies */}
                    {replies[rid]?.items && (
                      <div className="replies">
                        {replies[rid].loading ? (
                          <div className="loading small">Loading replies…</div>
                        ) : (
                          <>
                            {replies[rid].items.map((rp) => {
                              const u = displayUser(rp.userId);
                              return (
                                <div key={rp.id} className="reply-item">
                                  <img src={u.avatar} alt={u.name} className="reply-avatar" />
                                  <div className="reply-main">
                                    <div className="reply-meta">
                                      <span className="r-user">{u.name}</span>
                                      <span className="r-date">{fmtDate(rp.createdAt)}</span>
                                    </div>
                                    <div className="reply-text">{rp.comment}</div>
                                  </div>
                                  {/* Reply delete */}
                                {editable && (
                                <button className="reply-del" onClick={() => removeReply(rp.id, rid)}>Delete</button>
                                )}

                                </div>
                              );
                            })}

                            <div className="reply-add">
                              <input
                                placeholder="Write a reply…"
                                value={replyDraft[rid] || ""}
                                onChange={(e) => setReplyDraft((p) => ({ ...p, [rid]: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && sendReply(rid)}
                              />
                              <button onClick={() => sendReply(rid)}>Send</button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}

              {/* footer pager */}
              <div className="rev-pager">
                <button className="btn ghost" disabled={state.page <= 1} onClick={() => refresh(state.page - 1)}>← Prev</button>
                <span className="muted">Page {state.page} • {state.total} total</span>
                <button className="btn ghost" disabled={state.page * state.pageSize >= state.total} onClick={() => refresh(state.page + 1)}>Next →</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="gd-modal-backdrop" onClick={onClose} />

      {/* Confirm modal */}
      {confirmState.open && (
        <div className="gd-modal-wrap" role="dialog" aria-modal="true">
          <div className="gd-modal-box small">
            <div className="gd-modal-head">
              <h3>Confirm</h3>
              <button className="gd-close" onClick={onConfirmNo}>×</button>
            </div>
            <div className="gd-modal-body">
              <p style={{ marginBottom: 12 }}>{confirmState.message}</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="btn ghost" onClick={onConfirmNo}>Cancel</button>
                <button className="btn danger" onClick={onConfirmYes}>Delete</button>
              </div>
            </div>
          </div>
          <div className="gd-modal-backdrop" onClick={onConfirmNo} />
        </div>
      )}

      {/* Voters modal */}
      {/* Voters popup */}
{votersOpen && (
  <div className="voters-popup-overlay" onClick={() => setVotersOpen(false)}>
    <div
      className="voters-popup"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div className="voters-header">
        <h4>{votersType === "likes" ? "Liked by" : "Disliked by"}</h4>
        <button className="close-btn" onClick={() => setVotersOpen(false)}>×</button>
      </div>

      <div className="voters-content">
        {votersLoading ? (
          <div className="loading small">Loading…</div>
        ) : voters.length ? (
          voters.map((v) => {
            const u = displayUser(v.userId);
            return (
              <div key={v.userId} className="voter-item">
                <img src={u.avatar} alt={u.name} />
                <span>{u.name}</span>
              </div>
            );
          })
        ) : (
          <div className="muted empty">No users found</div>
        )}
      </div>
    </div>
  </div>
)}

    </div>
  );
}
