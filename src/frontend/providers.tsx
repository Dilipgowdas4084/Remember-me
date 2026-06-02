"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

// --- AUTH TYPE & CONTEXT ---
interface User {
  id: string;
  email: string;
  role: "DOCTOR" | "PATIENT" | "CAREGIVER" | "SUPERVISOR";
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- ACCESSIBILITY TYPE & CONTEXT ---
export type FontSizeLevel = "normal" | "large" | "extra-large";

interface AccessibilityContextType {
  fontSize: FontSizeLevel;
  setFontSize: (level: FontSizeLevel) => void;
  speechEnabled: boolean;
  setSpeechEnabled: (enabled: boolean) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// --- THEME CONTEXT ---
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// --- COMBINED PROVIDER ---
export function AppProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Accessibility State
  const [fontSize, setFontSizeState] = useState<FontSizeLevel>("normal");
  const [speechEnabled, setSpeechEnabledState] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync user state on load
  const refetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []);

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    const storedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
      root.classList.add("dark");
      setIsDarkMode(true);
    } else {
      root.classList.remove("dark");
      setIsDarkMode(false);
    }

    // Load accessibility settings
    const storedFontSize = localStorage.getItem("fontSize") as FontSizeLevel;
    if (storedFontSize) setFontSizeState(storedFontSize);

    const storedSpeech = localStorage.getItem("speechEnabled");
    if (storedSpeech) setSpeechEnabledState(storedSpeech === "true");
  }, []);

  // Theme toggle
  const toggleTheme = () => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  // Font size setter
  const setFontSize = (level: FontSizeLevel) => {
    setFontSizeState(level);
    localStorage.setItem("fontSize", level);
  };

  // Speech toggler
  const setSpeechEnabled = (enabled: boolean) => {
    setSpeechEnabledState(enabled);
    localStorage.setItem("speechEnabled", String(enabled));
    if (!enabled) {
      stopSpeaking();
    }
  };

  // Text-To-Speech (SpeechSynthesis)
  const speak = (text: string) => {
    if (!speechEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel current speaking
    window.speechSynthesis.cancel();

    // Clean text of html tags or emojis
    const cleanText = text.replace(/<[^>]*>/g, "").trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.85; // Calmer, slightly slower pace
    utterance.pitch = 1.0;
    
    // Attempt to pick a soft, friendly English voice if available
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))
    );
    if (friendlyVoice) utterance.voice = friendlyVoice;

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Login handler
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        
        // Redirect based on role
        if (data.user.role === "DOCTOR") router.push("/doctor");
        else if (data.user.role === "CAREGIVER") router.push("/caregiver");
        else if (data.user.role === "PATIENT") router.push("/patient");
        else if (data.user.role === "SUPERVISOR") router.push("/supervisor");

        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (e: any) {
      return { success: false, error: "Network error occurred" };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await fetch("/api/auth/me", { method: "POST" });
      setUser(null);
      stopSpeaking();
      router.push("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetchUser }}>
      <AccessibilityContext.Provider
        value={{
          fontSize,
          setFontSize,
          speechEnabled,
          setSpeechEnabled,
          speak,
          stopSpeaking,
        }}
      >
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
          <div
            className={`flex flex-col min-h-screen ${
              fontSize === "large" ? "text-lg-accessible" : fontSize === "extra-large" ? "text-xl-accessible" : ""
            }`}
          >
            {children}
          </div>
        </ThemeContext.Provider>
      </AccessibilityContext.Provider>
    </AuthContext.Provider>
  );
}

// Custom Hooks
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AppProviders");
  return context;
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error("useAccessibility must be used within AppProviders");
  return context;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within AppProviders");
  return context;
}
