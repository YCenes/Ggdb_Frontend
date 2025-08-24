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
import Overview from "./pages/Admin/Overview"; // İstersen AdminShell ile Outlet kullanırsan bu sayfayı sade de yapabilirsin

import "./styles/main.scss";

function App() {
  return (
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

        {/* Admin (Sadece AdminLayout: Sidebar + Header) */}
        <Route path="/admin" element={<AdminShell />}>
         <Route index element={<Overview />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div style={{ padding: 24 }}>Sayfa bulunamadı</div>} />
      </Routes>
    </Router>
  );
}
export default App;