import React from "react";
import { Outlet } from "react-router-dom";
import AdminLayout from "./AdminLayout"; // ../layouts/AdminLayout.js

export default function AdminShell() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}