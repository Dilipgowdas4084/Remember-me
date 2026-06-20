"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/frontend/providers";
import { Heart, Key, Mail, AlertCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || "Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-secondary/20 to-background justify-center items-center px-4 py-12">
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm font-semibold hover:text-primary transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="w-full max-w-md glass-card rounded-3xl p-7 sm:p-9 shadow-xl border border-white/60">
        {/* Logo */}
        <div className="text-center flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Welcome Back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to access memory logs and dashboards</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-start gap-2.5 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── GOOGLE BUTTON — plain <a> tag, always works ── */}
        <a
          href="/api/auth/google"
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm font-semibold text-sm text-gray-700 mb-4 active:scale-[0.98] no-underline"
          style={{ textDecoration: "none" }}
        >
          {/* Official Google G logo */}
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path d="M47.532 24.552c0-1.636-.132-3.232-.388-4.776H24.48v9.046h12.96c-.572 3.004-2.248 5.548-4.764 7.248v5.992h7.704c4.508-4.152 7.152-10.268 7.152-17.51z" fill="#4285F4"/>
            <path d="M24.48 48c6.48 0 11.916-2.144 15.888-5.824l-7.704-5.992c-2.148 1.44-4.896 2.292-8.184 2.292-6.288 0-11.616-4.244-13.524-9.952H3.012v6.184C6.96 43.228 15.132 48 24.48 48z" fill="#34A853"/>
            <path d="M10.956 28.524A14.514 14.514 0 0 1 9.96 24c0-1.564.268-3.08.996-4.524V13.29H3.012A23.982 23.982 0 0 0 .48 24c0 3.86.924 7.5 2.532 10.708l7.944-6.184z" fill="#FBBC05"/>
            <path d="M24.48 9.524c3.54 0 6.72 1.22 9.22 3.6l6.876-6.876C36.396 2.372 30.96 0 24.48 0 15.132 0 6.96 4.772 3.012 13.29l7.944 6.184c1.908-5.708 7.236-9.95 13.524-9.95z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </a>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-semibold">or sign in with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition"
                placeholder="doctor@rememberme.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-primary font-bold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
