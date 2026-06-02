"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/frontend/providers";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Stethoscope, Activity, MapPin, Shield,
  Clock, Pill, Phone, Mail, LogOut,
  ChevronDown, ChevronRight, Eye, Search, RefreshCw,
  Heart, Calendar, User, Home, Siren, Menu, X
} from "lucide-react";

interface Stats {
  doctors: number;
  patients: number;
  caregivers: number;
  pendingReminders: number;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  bloodGroup: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  locationUpdatedAt: string | null;
  user: { email: string; createdAt: string };
  doctor: { name: string; specialization: string; phone?: string };
  caregivers: { caregiver: { name: string; phone: string } }[];
  medications: { name: string; dosage: string; timeOfDay: string; frequency: string }[];
  reminders: { title: string; dateTime: string; description?: string }[];
  emergencyContacts: { name: string; phone: string; relationship: string; isPrimary: boolean }[];
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  user: { email: string; createdAt: string };
  patients: Patient[];
}

export default function SupervisorPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);
  const [expandedPatient, setExpandedPatient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"doctors" | "patients">("patients");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== "SUPERVISOR") router.replace("/");
  }, [user, router]);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [sRes, dRes, pRes] = await Promise.all([
        fetch("/api/supervisor/stats"),
        fetch("/api/supervisor/doctors"),
        fetch("/api/supervisor/patients"),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (dRes.ok) setDoctors((await dRes.json()).doctors || []);
      if (pRes.ok) setPatients((await pRes.json()).patients || []);
    } catch (e) {
      console.error("Failed to load supervisor data", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredDoctors = doctors.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.doctor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (iso: string) => new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  const formatTimeShort = (iso: string) => new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
  });

  const timeSince = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-50 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-xl shadow-violet-200">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="w-8 h-8 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-violet-600 font-semibold text-sm">Loading Supervisor Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-indigo-50/30">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-slate-800 text-sm leading-none">Supervisor</p>
                <p className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">Silent read-only mode</p>
              </div>
            </div>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-600">LIVE</span>
              </div>
              <button
                onClick={() => fetchAll(true)}
                disabled={refreshing}
                className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-violet-500" : ""}`} />
              </button>
              <span className="text-xs text-slate-400 max-w-[160px] truncate">{user?.email}</span>
              <button
                onClick={() => { logout(); router.push("/"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition border border-red-100"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-600" /> : <Menu className="w-5 h-5 text-slate-600" />}
            </button>
          </div>

          {/* Mobile menu dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden md:hidden"
              >
                <div className="py-3 border-t border-slate-100 mt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-emerald-600">LIVE — Auto refresh 30s</span>
                    </div>
                    <button
                      onClick={() => { fetchAll(true); setMobileMenuOpen(false); }}
                      disabled={refreshing}
                      className="p-2 rounded-xl bg-slate-100 text-slate-500"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-violet-500" : ""}`} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 truncate px-1">{user?.email}</p>
                  <button
                    onClick={() => { logout(); router.push("/"); }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* ── STATS ── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Doctors", value: stats.doctors, icon: <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />, bg: "bg-violet-600", text: "text-violet-600" },
              { label: "Patients", value: stats.patients, icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5" />, bg: "bg-blue-600", text: "text-blue-600" },
              { label: "Caregivers", value: stats.caregivers, icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />, bg: "bg-emerald-600", text: "text-emerald-600" },
              { label: "Pending Reminders", value: stats.pendingReminders, icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />, bg: "bg-orange-500", text: "text-orange-600" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5"
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3 text-white shadow-md`}>
                  {s.icon}
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-800">{s.value}</p>
                <p className={`text-[10px] sm:text-xs font-semibold mt-0.5 ${s.text}`}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── TABS + SEARCH ── */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            {(["patients", "doctors"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition ${
                  activeTab === tab
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                    : "bg-white text-slate-500 border border-slate-200 hover:border-violet-300"
                }`}
              >
                {tab} ({tab === "patients" ? filteredPatients.length : filteredDoctors.length})
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition"
            />
          </div>
        </div>

        {/* ══════════════════════════════════════
            PATIENTS VIEW
        ══════════════════════════════════════ */}
        {activeTab === "patients" && (
          <div className="space-y-3 sm:space-y-4">
            {filteredPatients.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm">No patients found</div>
            )}

            {filteredPatients.map((pat, i) => (
              <motion.div
                key={pat.id}
                id={`patient-${pat.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                {/* ── Patient Header ── */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-black text-xl sm:text-2xl text-white shadow-lg shadow-blue-100 shrink-0">
                      {pat.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-slate-800 text-base sm:text-lg leading-tight">{pat.name}</h3>
                            {pat.latitude && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] sm:text-[10px] font-black text-emerald-700">GPS ON</span>
                              </span>
                            )}
                          </div>
                          {/* Key info chips */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            <span className="text-xs text-slate-500 flex items-center gap-1"><User className="w-3 h-3" />Age {pat.age}</span>
                            {pat.bloodGroup && <span className="text-xs text-slate-500 flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" />{pat.bloodGroup}</span>}
                          </div>
                          {/* Email — hide on very small screens */}
                          <p className="text-xs text-slate-400 mt-0.5 hidden sm:block truncate">{pat.user.email}</p>
                          {pat.address && <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 truncate"><Home className="w-3 h-3 shrink-0" />{pat.address}</p>}
                        </div>

                        {/* Expand button */}
                        <button
                          onClick={() => setExpandedPatient(expandedPatient === pat.id ? null : pat.id)}
                          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold border border-violet-200 transition"
                        >
                          <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden sm:inline">{expandedPatient === pat.id ? "Collapse" : "Details"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Quick Info Grid (2 cols mobile, 4 cols desktop) ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-slate-100 divide-x divide-y lg:divide-y-0 divide-slate-100">
                  {/* Doctor */}
                  <div className="p-3 sm:p-4">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-violet-500" /> Doctor
                    </p>
                    <p className="text-sm font-bold text-slate-700 leading-tight">Dr. {pat.doctor?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{pat.doctor?.specialization || "—"}</p>
                    {pat.doctor?.phone && <p className="text-xs text-slate-400">{pat.doctor.phone}</p>}
                  </div>

                  {/* Caregiver */}
                  <div className="p-3 sm:p-4">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-500" /> Caregiver
                    </p>
                    {pat.caregivers.length === 0
                      ? <p className="text-xs text-slate-300 italic">None assigned</p>
                      : <>
                          <p className="text-sm font-bold text-slate-700 leading-tight">{pat.caregivers[0].caregiver.name}</p>
                          <p className="text-xs text-slate-400">{pat.caregivers[0].caregiver.phone || "—"}</p>
                          {pat.caregivers.length > 1 && <p className="text-[10px] text-slate-400">+{pat.caregivers.length - 1} more</p>}
                        </>
                    }
                  </div>

                  {/* Live Location */}
                  <div className="p-3 sm:p-4">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" /> Location
                    </p>
                    {pat.latitude ? (
                      <>
                        <a
                          href={`https://maps.google.com/?q=${pat.latitude},${pat.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 leading-tight"
                          onClick={e => e.stopPropagation()}
                        >
                          <MapPin className="w-3 h-3 shrink-0" /> Open Maps ↗
                        </a>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">{pat.latitude.toFixed(4)}, {pat.longitude?.toFixed(4)}</p>
                        {pat.locationUpdatedAt && <p className="text-[10px] text-emerald-500">{timeSince(pat.locationUpdatedAt)}</p>}
                      </>
                    ) : (
                      <p className="text-xs text-slate-300 italic">Not sharing</p>
                    )}
                  </div>

                  {/* Emergency */}
                  <div className="p-3 sm:p-4">
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Siren className="w-3 h-3 text-red-500" /> Emergency
                    </p>
                    {pat.emergencyContacts.length === 0
                      ? <p className="text-xs text-slate-300 italic">None listed</p>
                      : <>
                          <p className="text-sm font-bold text-red-600 leading-tight">{pat.emergencyContacts[0].name}</p>
                          <p className="text-xs text-slate-500">{pat.emergencyContacts[0].phone}</p>
                          <p className="text-[10px] text-slate-400">{pat.emergencyContacts[0].relationship}</p>
                        </>
                    }
                  </div>
                </div>

                {/* ── Expanded Details ── */}
                <AnimatePresence>
                  {expandedPatient === pat.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <div className="p-3 sm:p-5 bg-slate-50/60 space-y-4">
                        {/* Email (mobile) */}
                        <div className="sm:hidden text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {pat.user.email}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Medications */}
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-orange-500" /> Medications ({pat.medications.length})
                            </p>
                            {pat.medications.length === 0
                              ? <p className="text-xs text-slate-300 italic">None active</p>
                              : <div className="space-y-2">
                                  {pat.medications.map((m, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-3 py-2.5 shadow-sm gap-2">
                                      <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm leading-tight truncate">{m.name}</p>
                                        <p className="text-xs text-slate-400">{m.dosage} • {m.frequency}</p>
                                      </div>
                                      <span className="px-2 py-1 rounded-lg bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-100 shrink-0">
                                        {m.timeOfDay}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                            }
                          </div>

                          {/* Reminders */}
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-yellow-500" /> Reminders ({pat.reminders.length})
                            </p>
                            {pat.reminders.length === 0
                              ? <p className="text-xs text-slate-300 italic">None pending</p>
                              : <div className="space-y-2">
                                  {pat.reminders.map((r, idx) => (
                                    <div key={idx} className="bg-white rounded-xl border border-slate-100 px-3 py-2.5 shadow-sm">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="font-bold text-slate-800 text-sm leading-tight">{r.title}</p>
                                        <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">{formatTimeShort(r.dateTime)}</span>
                                      </div>
                                      {r.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{r.description}</p>}
                                    </div>
                                  ))}
                                </div>
                            }
                          </div>

                          {/* All Emergency Contacts */}
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Siren className="w-3.5 h-3.5 text-red-500" /> All Emergency Contacts
                            </p>
                            {pat.emergencyContacts.length === 0
                              ? <p className="text-xs text-slate-300 italic">None listed</p>
                              : <div className="space-y-2">
                                  {pat.emergencyContacts.map((ec, idx) => (
                                    <div key={idx} className={`flex items-center gap-3 bg-white rounded-xl border px-3 py-2.5 shadow-sm ${ec.isPrimary ? "border-red-200" : "border-slate-100"}`}>
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ec.isPrimary ? "bg-red-100" : "bg-slate-100"}`}>
                                        <Phone className={`w-3.5 h-3.5 ${ec.isPrimary ? "text-red-500" : "text-slate-400"}`} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 text-sm leading-tight">{ec.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{ec.relationship} • {ec.phone}</p>
                                      </div>
                                      {ec.isPrimary && (
                                        <span className="text-[9px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100 shrink-0">PRIMARY</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                            }
                          </div>

                          {/* All Caregivers */}
                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-blue-500" /> All Caregivers
                            </p>
                            {pat.caregivers.length === 0
                              ? <p className="text-xs text-slate-300 italic">None assigned</p>
                              : <div className="space-y-2">
                                  {pat.caregivers.map((c, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-3 py-2.5 shadow-sm">
                                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs shrink-0">
                                        {c.caregiver.name.charAt(0)}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-slate-800 text-sm leading-tight">{c.caregiver.name}</p>
                                        <p className="text-xs text-slate-400">{c.caregiver.phone || "No phone"}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                            }
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════
            DOCTORS VIEW
        ══════════════════════════════════════ */}
        {activeTab === "doctors" && (
          <div className="space-y-3">
            {filteredDoctors.length === 0 && (
              <div className="text-center py-16 text-slate-400 text-sm">No doctors found</div>
            )}
            {filteredDoctors.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedDoctor(expandedDoctor === doc.id ? null : doc.id)}
                  className="w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-slate-50 transition text-left"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center font-black text-lg sm:text-xl text-white shadow-lg shadow-violet-100 shrink-0">
                    {doc.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">Dr. {doc.name}</p>
                      {doc.specialization && (
                        <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-wider hidden sm:inline-block">
                          {doc.specialization}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-slate-400 text-xs">
                      <span className="flex items-center gap-1 truncate max-w-[180px]"><Mail className="w-3 h-3 shrink-0" />{doc.user.email}</span>
                      {doc.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{doc.phone}</span>}
                    </div>
                    {doc.specialization && (
                      <span className="sm:hidden text-[10px] text-violet-600 font-bold">{doc.specialization}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-xs font-black border border-blue-100">
                      {doc.patients.length}
                    </span>
                    {expandedDoctor === doc.id
                      ? <ChevronDown className="w-4 h-4 text-slate-400" />
                      : <ChevronRight className="w-4 h-4 text-slate-400" />
                    }
                  </div>
                </button>

                <AnimatePresence>
                  {expandedDoctor === doc.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-slate-100"
                    >
                      <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 bg-slate-50/50">
                        {doc.patients.length === 0
                          ? <p className="text-slate-400 text-sm py-3 col-span-3">No patients assigned yet.</p>
                          : doc.patients.map((pat) => (
                              <button
                                key={pat.id}
                                onClick={() => {
                                  setActiveTab("patients");
                                  setExpandedPatient(pat.id);
                                }}
                                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-violet-300 hover:shadow-md transition text-left group"
                              >
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center font-bold text-white text-sm shrink-0">
                                  {pat.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-800 text-sm leading-tight truncate">{pat.name}</p>
                                  <p className="text-xs text-slate-400">Age {pat.age} • {pat.bloodGroup || "N/A"}</p>
                                </div>
                                {pat.latitude && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Location active" />
                                )}
                              </button>
                            ))
                        }
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
