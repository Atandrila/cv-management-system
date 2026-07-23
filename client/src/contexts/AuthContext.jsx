/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { api, apiEnvelope, json } from "../api/client";

export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true); const [authError, setAuthError] = useState(""); const [oauthAvailability, setOauthAvailability] = useState({}); const [demoLoginAvailable, setDemoLoginAvailable] = useState(false);
  const loadCurrentUser = useCallback(async () => {
    setLoading(true); setAuthError("");
    try { const result = await apiEnvelope("/auth/me"); setUser(result.authenticated ? result.data : null); setOauthAvailability(result.oauthAvailability || {}); setDemoLoginAvailable(Boolean(result.demoLoginAvailable)); }
    catch (error) { setUser(null); setAuthError(error.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadCurrentUser(); }, [loadCurrentUser]);
  const loginWith = (provider) => window.location.assign(`/api/auth/${provider}`);
  const demoLogin = async (role) => { const data = await api("/auth/demo", json("POST", { role })); setUser(data); return data; };
  const logout = async () => { await api("/auth/logout", { method: "POST" }); setUser(null); };
  const value = useMemo(() => ({ user, setUser, loading, authError, oauthAvailability, demoLoginAvailable, isAuthenticated: Boolean(user), loginWith, demoLogin, logout, refreshUser: loadCurrentUser }), [user, loading, authError, oauthAvailability, demoLoginAvailable, loadCurrentUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
