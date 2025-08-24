import React, { useState } from "react";
import Header from "../layout/admin/Header";
import Sidebar from "../layout/admin/Sidebar";

/**
 * Layout with Header + Sidebar
 */
export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(true);          // desktop sidebar geniş/dar
  const [mobileOpen, setMobileOpen] = useState(false); // mobil çekmece

  return (
    <div className={`admin-layout has-sidebar ${open ? "" : "is-collapsed"}`}>
      <Header />  {/* Artık sadece search + right section var */}
      <Sidebar
        open={open}
        setOpen={setOpen}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="admin-content">{children}</div>
    </div>
  );
}