/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, json } from "../api/client";
import useAuth from "../hooks/useAuth";

const PreferencesContext = createContext(null);

const text = {
  EN: {
    home: "Home",
    positions: "Positions",
    cvs: "CVs",
    profile: "My profile",
    attributes: "Attributes",
    users: "Users",
    search: "Search everything",
    signIn: "Sign in",
    signOut: "Sign out",
    language: "Language",
    theme: "Theme",
    english: "English",
    bengali: "বাংলা",
    account: "Account",
    candidate: "Candidate",
    recruiter: "Recruiter",
    administrator: "Administrator",
    loading: "Loading...",
    noCvs: "No CVs found.",
    myCvs: "My CVs",
    publishedCandidateCvs: "Published candidate CVs",
    candidateCvHelp: "One live, profile-linked CV per position.",
    recruiterCvHelp: "Browse CVs that candidates have published for recruiters.",
    createFromPosition: "Create from a position",
    selected: "{count} selected",
    open: "Open",
    delete: "Delete",
    candidateColumn: "Candidate",
    position: "Position",
    company: "Company",
    status: "Status",
    updated: "Updated",
    likes: "Likes",
    selectRows: "Select a row to reveal actions. Double-click to open.",
    draft: "Draft",
    published: "Published",
    allCvs: "All CVs",
    printPdf: "Print / Save PDF",
    publishCv: "Publish CV",
    publishing: "Publishing...",
    publishReady: "All required information is complete. This CV is ready to publish.",
    publishMissing: "Complete these required fields before publishing: {fields}.",
    editProfile: "Complete profile",
    missingInformation: "Missing information",
    requiredBeforePublishing: "Required before publishing",
    choose: "Choose...",
    profileValueSaved: "Profile value saved. Every linked CV now uses it.",
    cvPublished: "CV published. Recruiters can now see it.",
    curriculumVitae: "Curriculum Vitae",
    locationMissing: "Location not provided",
    professionalInformation: "Professional information",
    selectedProjects: "Selected projects",
    present: "Present",
    cvFooter: "Generated for {position} at {company}. This CV uses live values from the candidate profile.",
    recruitingOrganization: "the recruiting organization",
    recruiterEmpty: "No candidates have published a CV yet.",
    candidateEmpty: "You have not created a CV yet.",
    refresh: "Refresh",
    positionsHelp: "Position templates and access-aware opportunities.",
    createPosition: "Create position",
    edit: "Edit",
    duplicate: "Duplicate",
    title: "Title",
    level: "Level",
    access: "Access",
    tags: "Tags",
    public: "Public",
    restricted: "Restricted",
    noPositions: "No accessible positions found.",
    selectPositionRows: "Select rows to reveal actions. Double-click a row to open it.",
    deletePositionsConfirm: "Delete {count} selected position(s)?",
    heroEyebrow: "The smarter career workspace",
    heroTitleStart: "One profile.",
    heroTitleAccent: "Every opportunity.",
    heroLead: "Create a reusable professional profile, match it to the right positions, and generate polished CVs without rebuilding your story every time.",
    explorePositions: "Explore positions",
    openWorkspace: "Open workspace",
    createProfile: "Create your profile",
    freeToUse: "Free to use",
    secureOauth: "Secure OAuth",
    roleAccess: "Role-based access",
    candidates: "Candidates",
    recruiters: "Recruiters",
    publishedCvs: "Published CVs",
    cvsToday: "CVs today",
    discover: "Discover",
    latestOpportunities: "Latest opportunities",
    latestHelp: "Fresh position templates ready for tailored applications.",
    browseAllPositions: "Browse all positions",
    updatedRecently: "Updated recently",
    independent: "Independent",
    trending: "Trending",
    mostPopular: "Most popular",
    openOpportunity: "Open opportunity",
    skillsDemand: "Skills in demand",
  },
  BN: {
    home: "হোম",
    positions: "পদসমূহ",
    cvs: "সিভি",
    profile: "আমার প্রোফাইল",
    attributes: "অ্যাট্রিবিউট",
    users: "ব্যবহারকারী",
    search: "সবকিছু খুঁজুন",
    signIn: "সাইন ইন",
    signOut: "সাইন আউট",
    language: "ভাষা",
    theme: "থিম",
    english: "ইংরেজি",
    bengali: "বাংলা",
    account: "অ্যাকাউন্ট",
    candidate: "প্রার্থী",
    recruiter: "রিক্রুটার",
    administrator: "অ্যাডমিনিস্ট্রেটর",
    loading: "লোড হচ্ছে...",
    noCvs: "কোনো সিভি পাওয়া যায়নি।",
    myCvs: "আমার সিভি",
    publishedCandidateCvs: "প্রকাশিত প্রার্থীদের সিভি",
    candidateCvHelp: "প্রতিটি পদের জন্য একটি প্রোফাইল-সংযুক্ত লাইভ সিভি।",
    recruiterCvHelp: "প্রার্থীরা রিক্রুটারদের জন্য যে সিভিগুলো প্রকাশ করেছেন সেগুলো দেখুন।",
    createFromPosition: "পদ থেকে সিভি তৈরি করুন",
    selected: "{count}টি নির্বাচিত",
    open: "খুলুন",
    delete: "মুছুন",
    candidateColumn: "প্রার্থী",
    position: "পদ",
    company: "কোম্পানি",
    status: "অবস্থা",
    updated: "হালনাগাদ",
    likes: "পছন্দ",
    selectRows: "কাজ দেখতে একটি সারি নির্বাচন করুন। খুলতে ডাবল-ক্লিক করুন।",
    draft: "খসড়া",
    published: "প্রকাশিত",
    allCvs: "সব সিভি",
    printPdf: "প্রিন্ট / PDF সংরক্ষণ",
    publishCv: "সিভি প্রকাশ করুন",
    publishing: "প্রকাশ করা হচ্ছে...",
    publishReady: "সব প্রয়োজনীয় তথ্য সম্পূর্ণ। সিভিটি প্রকাশের জন্য প্রস্তুত।",
    publishMissing: "প্রকাশের আগে এই প্রয়োজনীয় তথ্যগুলো পূরণ করুন: {fields}।",
    editProfile: "প্রোফাইল সম্পূর্ণ করুন",
    missingInformation: "তথ্য দেওয়া হয়নি",
    requiredBeforePublishing: "প্রকাশের আগে এটি আবশ্যক",
    choose: "নির্বাচন করুন...",
    profileValueSaved: "প্রোফাইলের তথ্য সংরক্ষিত হয়েছে। সংযুক্ত সব সিভিতে এটি ব্যবহার হবে।",
    cvPublished: "সিভি প্রকাশিত হয়েছে। রিক্রুটাররা এখন এটি দেখতে পারবেন।",
    curriculumVitae: "জীবনবৃত্তান্ত",
    locationMissing: "অবস্থান দেওয়া হয়নি",
    professionalInformation: "পেশাগত তথ্য",
    selectedProjects: "নির্বাচিত প্রকল্প",
    present: "বর্তমান",
    cvFooter: "{company}-এ {position} পদের জন্য তৈরি। এই সিভিতে প্রার্থীর প্রোফাইলের লাইভ তথ্য ব্যবহৃত হয়েছে।",
    recruitingOrganization: "নিয়োগকারী প্রতিষ্ঠান",
    recruiterEmpty: "এখনও কোনো প্রার্থী সিভি প্রকাশ করেননি।",
    candidateEmpty: "আপনি এখনও কোনো সিভি তৈরি করেননি।",
    refresh: "রিফ্রেশ",
    positionsHelp: "পদের টেমপ্লেট এবং প্রবেশাধিকার অনুযায়ী সুযোগসমূহ।",
    createPosition: "পদ তৈরি করুন",
    edit: "সম্পাদনা",
    duplicate: "অনুলিপি",
    title: "শিরোনাম",
    level: "স্তর",
    access: "প্রবেশাধিকার",
    tags: "ট্যাগ",
    public: "সবার জন্য",
    restricted: "সীমাবদ্ধ",
    noPositions: "প্রবেশযোগ্য কোনো পদ পাওয়া যায়নি।",
    selectPositionRows: "কাজ দেখতে সারি নির্বাচন করুন। খুলতে একটি সারিতে ডাবল-ক্লিক করুন।",
    deletePositionsConfirm: "নির্বাচিত {count}টি পদ মুছবেন?",
    heroEyebrow: "আরও স্মার্ট ক্যারিয়ার ওয়ার্কস্পেস",
    heroTitleStart: "একটি প্রোফাইল।",
    heroTitleAccent: "প্রতিটি সুযোগ।",
    heroLead: "একটি পুনর্ব্যবহারযোগ্য পেশাগত প্রোফাইল তৈরি করুন, উপযুক্ত পদের সঙ্গে মিল খুঁজুন এবং প্রতিবার নতুন করে তথ্য না লিখেই সুন্দর সিভি তৈরি করুন।",
    explorePositions: "পদগুলো দেখুন",
    openWorkspace: "ওয়ার্কস্পেস খুলুন",
    createProfile: "প্রোফাইল তৈরি করুন",
    freeToUse: "বিনামূল্যে ব্যবহার",
    secureOauth: "নিরাপদ OAuth",
    roleAccess: "ভূমিকা-ভিত্তিক প্রবেশাধিকার",
    candidates: "প্রার্থী",
    recruiters: "রিক্রুটার",
    publishedCvs: "প্রকাশিত সিভি",
    cvsToday: "আজকের সিভি",
    discover: "খুঁজে দেখুন",
    latestOpportunities: "সর্বশেষ সুযোগ",
    latestHelp: "আপনার আবেদনের জন্য প্রস্তুত নতুন পদের টেমপ্লেট।",
    browseAllPositions: "সব পদ দেখুন",
    updatedRecently: "সম্প্রতি হালনাগাদ",
    independent: "স্বতন্ত্র",
    trending: "জনপ্রিয়",
    mostPopular: "সবচেয়ে জনপ্রিয়",
    openOpportunity: "উন্মুক্ত সুযোগ",
    skillsDemand: "চাহিদাসম্পন্ন দক্ষতা",
  },
};

const validLanguage = (value) => value === "BN" ? "BN" : "EN";
const validTheme = (value) => value === "DARK" ? "DARK" : "LIGHT";

export function PreferencesProvider({ children }) {
  const { user, setUser } = useAuth();
  const hydratedUser = useRef(null);
  const [languageState, setLanguageState] = useState(() => validLanguage(localStorage.getItem("cv-language")));
  const [themeState, setThemeState] = useState(() => validTheme(localStorage.getItem("cv-theme")));

  useEffect(() => {
    if (!user || hydratedUser.current === user.id) return;
    hydratedUser.current = user.id;
    setLanguageState(validLanguage(user.preferredLanguage));
    setThemeState(validTheme(user.preferredTheme));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("cv-language", languageState);
    document.documentElement.lang = languageState === "BN" ? "bn" : "en";
  }, [languageState]);

  useEffect(() => {
    localStorage.setItem("cv-theme", themeState);
    document.documentElement.dataset.bsTheme = themeState.toLowerCase();
  }, [themeState]);

  const savePreference = useCallback(async (changes) => {
    if (!user) return;
    try {
      const updated = await api("/profile/preferences", json("PATCH", changes));
      setUser(updated);
    } catch {
      // The local preference remains usable if the network is temporarily unavailable.
    }
  }, [setUser, user]);

  const setLanguage = useCallback((next) => {
    const language = validLanguage(next);
    setLanguageState(language);
    void savePreference({ preferredLanguage: language });
  }, [savePreference]);

  const setTheme = useCallback((next) => {
    const theme = validTheme(next);
    setThemeState(theme);
    void savePreference({ preferredTheme: theme });
  }, [savePreference]);

  const t = useCallback((key, replacements = {}) => {
    const template = text[languageState]?.[key] || text.EN[key] || key;
    return Object.entries(replacements).reduce(
      (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
      template,
    );
  }, [languageState]);

  const value = useMemo(() => ({
    language: languageState,
    setLanguage,
    theme: themeState,
    setTheme,
    t,
    locale: languageState === "BN" ? "bn-BD" : "en-US",
  }), [languageState, setLanguage, setTheme, t, themeState]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export const usePreferences = () => useContext(PreferencesContext);
