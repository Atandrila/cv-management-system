/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const PreferencesContext = createContext(null);
const text = {
  EN: { home: "Home", positions: "Positions", cvs: "CVs", profile: "My profile", attributes: "Attributes", users: "Users", search: "Search everything", signIn: "Sign in", signOut: "Sign out", language: "Language", theme: "Theme" },
  BN: { home: "হোম", positions: "পদসমূহ", cvs: "সিভি", profile: "আমার প্রোফাইল", attributes: "অ্যাট্রিবিউট", users: "ব্যবহারকারী", search: "সবকিছু খুঁজুন", signIn: "সাইন ইন", signOut: "সাইন আউট", language: "ভাষা", theme: "থিম" },
};

export function PreferencesProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("cv-language") || "EN");
  const [theme, setTheme] = useState(() => localStorage.getItem("cv-theme") || "LIGHT");
  useEffect(() => { localStorage.setItem("cv-language", language); }, [language]);
  useEffect(() => { localStorage.setItem("cv-theme", theme); document.documentElement.dataset.bsTheme = theme.toLowerCase(); }, [theme]);
  const value = useMemo(() => ({ language, setLanguage, theme, setTheme, t: (key) => text[language]?.[key] || text.EN[key] || key }), [language, theme]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export const usePreferences = () => useContext(PreferencesContext);
