import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  // Auth verisi hâlâ yükleniyor → basit bir skeleton
  if (loading) {
    return (
      <div style={{ padding: 24, color: "#cbd5e1" }}>
        Checking permissions…
      </div>
    );
  }

  // Oturum yoksa → login'e
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc }} />;
  }

  // userType kontrolü (ör: 1 = Admin)
  if (user.userType !== 1) {
    // yetkisiz: istersen özel /unauthorized sayfasına yönlendir
    return <Navigate to="/" replace />;
  }

  return children;
}
