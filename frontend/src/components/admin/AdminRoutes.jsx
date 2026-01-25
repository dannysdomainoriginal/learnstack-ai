import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Outlet } from "react-router-dom";

const AdminRoutes = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) return null;

  return isAdmin ? (
    <Outlet />
  ) : (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="text-slate-600 text-lg">You are unauthorized 🔐</p>
      </div>
    </div>
  );
};

export default AdminRoutes;
