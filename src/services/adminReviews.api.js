// services/adminReviews.api.js
import API from "./api.js";

// Oyuna ait review'lar (backend'in /api/reviews/byGame/{gameId})
export async function adminGetGameReviews(gameId, page = 1, pageSize = 20, viewerUserId = null) {
  const { data } = await API.get(`/reviews/byGame/${gameId}`, {
    params: { page, pageSize, viewerUserId },
  });
  return data; // { page, pageSize, total, items:[...] }
}

// Bir review'ın reply'ları
export async function adminGetReviewReplies(reviewId, page = 1, pageSize = 20) {
  const { data } = await API.get(`/reviews/${reviewId}/replies`, {
    params: { page, pageSize },
  });
  return data; // { page, pageSize, total, items:[...] }
}

// Oy verme
export async function adminVoteReview(reviewId, userId, value) {
  const { data } = await API.post(`/reviews/${reviewId}/vote`, { userId, value });
  return data; // { myVote }
}
export async function adminUnvoteReview(reviewId, userId) {
  return API.delete(`/reviews/${reviewId}/vote`, { params: { userId } });
}

// Review güncelle/sil
export async function adminUpdateReview(reviewId, payload) {
  const { data } = await API.put(`/reviews/${reviewId}`, payload);
  return data;
}
export async function adminDeleteReview(reviewId) {
  return API.delete(`/reviews/${reviewId}`);
}

// Reply oluştur/sil
export async function adminCreateReply(reviewId, payload) {
  const { data } = await API.post(`/reviews/${reviewId}/replies`, payload);
  return data;
}
export async function adminDeleteReply(replyId) {
  return API.delete(`/replies/${replyId}`);
}

// Review'i begenen/begenmeyenler (likes/dislikes)
export async function adminGetReviewVoters(reviewId) {
  // Backend tarafında aşağıdaki endpoint'i eklediğini varsayıyorum:
  // GET /api/reviews/{id}/voters -> { likes: [{userId}], dislikes: [{userId}] }
  const { data } = await API.get(`/reviews/${reviewId}/voters`);
  return data; // { likes:[{userId:string}], dislikes:[{userId:string}] }
}

