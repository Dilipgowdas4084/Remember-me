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
            <p className="text-sm text-muted-foreground mt-1">Sign in to your RememberMe account</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-start gap-2.5 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
