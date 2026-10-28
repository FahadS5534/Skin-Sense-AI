import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCurrentUser, loginUser, registerUser,
  setStoredToken, getStoredToken, updateConsent, deleteAccount
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await getCurrentUser();
        setUser(profile);
      } catch (err) {
        console.warn("Could not load user profile:", err);
        setStoredToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    setStoredToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    setStoredToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  const handleUpdateConsent = async (consentData) => {
    const updated = await updateConsent(consentData);
    if (user) {
      setUser({ ...user, consent: updated });
    }
    return updated;
  };

  const handleDeleteAccount = async () => {
    await deleteAccount();
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateConsent: handleUpdateConsent,
        deleteAccount: handleDeleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
