import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("swe0k:learnstack:token");
      const userStr = localStorage.getItem("swe0k:learnstack:user");

      if (token && userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error("Auth check failed", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem("swe0k:learnstack:token", token);
    localStorage.setItem("swe0k:learnstack:user", JSON.stringify(userData));

    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("swe0k:learnstack:token");
    localStorage.removeItem("swe0k:learnstack:user");

    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updates) => {
    const profile = { ...user, ...updates };

    localStorage.setItem("swe0k:learnstack:user", JSON.stringify(profile));
    setUser(profile);
  };

  const isAdmin = useMemo(() => {
    return !!user?.roles?.includes("admin");
  }, [user]);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    checkAuthStatus,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
