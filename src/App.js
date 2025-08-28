import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Public pages
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Layouts
import PublicShell from "./components/layout/PublicShell";
import AdminShell from "./components/layout/AdminShell";

// Admin pages
import Overview from "./pages/Admin/AdminOverview/AdminOverview"; 


// NEW
import { AuthProvider } from "./context/AuthContext.js";
import RequireAdmin from "./components/routing/RequireAdmin.js";

import "./styles/main.scss";
import ManageGame from "./pages/Admin/ManageGame.js";
import GameDetailAdmin from "./pages/Admin/AdminDetails.js";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public site (Header + Footer) */}
          <Route element={<PublicShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Admin (korumalı) */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminShell />
              </RequireAdmin>
            }
          >
            <Route index element={<Overview />} />
             <Route path="managegame" element={<ManageGame />} />
             <Route path="gamedetail" element={<GameDetailAdmin />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<div style={{ padding: 24 }}>Sayfa bulunamadı</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
