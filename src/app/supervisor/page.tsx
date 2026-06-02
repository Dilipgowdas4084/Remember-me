"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/frontend/providers";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Stethoscope, Activity, MapPin, Shield,
  Clock, Pill, Phone, LogOut, Heart,
  ChevronRight, Search, RefreshCw, Siren,
  User, Home, ArrowLeft, X, BarChart3, ChevronDown
} from "lucide-react";

interface Stats { doctors: number; patients: number; caregivers: number; pendingReminders: number; }
interface Patient {
  id: string; name: string; age: number; bloodGroup: string; address: string;
  latitude: number | null; longitude: number | null; locationUpdatedAt: string | null;
  user: { email: string; createdAt: string };
  doctor: { name: string; specialization: string; phone?: string };
  caregivers: { caregiver: { name: string; phone: string } }[];
  medications: { name: string; dosage: string; timeOfDay: string; frequency: string }[];
  reminders: { title: string; dateTime: string; description?: string }[];
  emergencyContacts: { name: string; phone: string; relationship: string; isPrimary: boolean }[];
}
interface Doctor {
  id: string; name: string; specialization: string; phone: string;
  user: { email: string; createdAt: string }; patients: Patient[];
}

export default function SupervisorPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState<"patients" | "doctors" | "stats">("patients");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailPatient, setDetailPatient] = useState<Patient | null>(null);
  const [detailDoctor, setDetailDoctor] = useState<Doctor | null>(null);

  useEffect(() => { if (user && user.role !== "SUPERVISOR") router.replace("/"); }, [user, router]);

  const fetchAll = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [sRes, dRes, pRes] = await Promise.all([
        fetch("/api/supervisor/stats"),
        fetch("/api/supervisor/doctors"),
        fetch("/api/supervisor/patients"),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (dRes.ok) setDoctors((await dRes.json()).doctors || []);
      if (pRes.ok) setPatients((await pRes.json()).patients || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchAll(); const t = setInterval(() => fetchAll(true), 30000); return () => clearInterval(t); }, []);

  const filteredPatients = patients.filter(p =>
    [p.name, p.doctor?.name, p.address].some(s => s?.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const filteredDoctors = doctors.filter(d =>
    [d.name, d.specialization].some(s => s?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const ago = (iso: string) => { const s = (Date.now() - +new Date(iso)) / 1000; return s < 60 ? `${~~s}s` : s < 3600 ? `${~~(s/60)}m` : s < 86400 ? `${~~(s/3600)}h` : `${~~(s/86400)}d`; };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-violet-50 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center shadow-2xl shadow-violet-300">
        <Shield className="w-8 h-8 text-white" />
      </div>
      <div className="w-7 h-7 rounded-full border-[3px] border-violet-500 border-t-transparent animate-spin" />
      <p className="text-violet-500 text-sm font-semibold">Loading console…</p>
    </div>
  );

  // ─── PATIENT DETAIL SHEET ────────────────────────────
  const PatientDetail = ({ pat }: { pat: Patient }) => (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-white flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Sheet header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
        <button onClick={() => setDetailPatient(null)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 active:bg-slate-200 transition">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-slate-800 text-base leading-tight truncate">{pat.name}</p>
          <p className="text-xs text-slate-400">Age {pat.age} {pat.bloodGroup ? `• ${pat.bloodGroup}` : ""}</p>
        </div>
        {pat.latitude && (
          <a href={`https://maps.google.com/?q=${pat.latitude},${pat.longitude}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-200 active:bg-emerald-600 transition shrink-0">
            <MapPin className="w-3.5 h-3.5" /> Maps
          </a>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Hero banner */}
        <div className="bg-gradient-to-br from-violet-600 to-blue-600 px-4 py-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center font-black text-3xl text-white shadow-lg shrink-0">
              {pat.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-black text-xl leading-tight">{pat.name}</h2>
              <p className="text-white/70 text-sm">{pat.user.email}</p>
              {pat.address && <p className="text-white/60 text-xs mt-1 flex items-center gap-1"><Home className="w-3 h-3" />{pat.address}</p>}
            </div>
          </div>
          {/* Live location badge */}
          {pat.latitude ? (
            <div className="mt-4 bg-white/15 backdrop-blur rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">Live Location</span>
                </div>
                <p className="text-white/80 text-xs font-mono">{pat.latitude.toFixed(5)}, {pat.longitude?.toFixed(5)}</p>
                {pat.locationUpdatedAt && <p className="text-white/50 text-[10px] mt-0.5">Updated {ago(pat.locationUpdatedAt)} ago</p>}
              </div>
              <a href={`https://maps.google.com/?q=${pat.latitude},${pat.longitude}`} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-400 text-white text-xs font-black active:bg-emerald-300 transition shadow">
                Open ↗
              </a>
            </div>
          ) : (
            <div className="mt-4 bg-white/10 rounded-2xl px-4 py-3">
              <p className="text-white/50 text-xs">📍 Location not being shared</p>
            </div>
          )}
        </div>

        <div className="px-4 py-5 space-y-5">
          {/* Doctor + Caregiver */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4">
              <p className="text-[10px] font-black text-violet-500 uppercase tracking-wider mb-2">Doctor</p>
              <p className="font-extrabold text-slate-800 text-sm leading-tight">Dr. {pat.doctor?.name}</p>
              {pat.doctor?.specialization && <p className="text-xs text-slate-500 mt-0.5">{pat.doctor.specialization}</p>}
              {pat.doctor?.phone && <a href={`tel:${pat.doctor.phone}`} className="text-xs text-violet-600 font-bold mt-1 flex items-center gap-1"><Phone className="w-3 h-3" />{pat.doctor.phone}</a>}
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-2">Caregiver</p>
              {pat.caregivers.length === 0
                ? <p className="text-xs text-slate-400 italic">None</p>
                : <>
                    <p className="font-extrabold text-slate-800 text-sm leading-tight">{pat.caregivers[0].caregiver.name}</p>
                    {pat.caregivers[0].caregiver.phone && <a href={`tel:${pat.caregivers[0].caregiver.phone}`} className="text-xs text-blue-600 font-bold mt-1 flex items-center gap-1"><Phone className="w-3 h-3" />{pat.caregivers[0].caregiver.phone}</a>}
                    {pat.caregivers.length > 1 && <p className="text-[10px] text-slate-400 mt-1">+{pat.caregivers.length - 1} more</p>}
                  </>
              }
            </div>
          </div>

          {/* Emergency Contacts */}
          {pat.emergencyContacts.length > 0 && (
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Siren className="w-3.5 h-3.5 text-red-500" />Emergency Contacts</p>
              <div className="space-y-2">
                {pat.emergencyContacts.map((ec, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${ec.isPrimary ? "bg-red-50 border-red-200" : "bg-white border-slate-100"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ec.isPrimary ? "bg-red-100" : "bg-slate-100"}`}>
                      <Phone className={`w-4 h-4 ${ec.isPrimary ? "text-red-500" : "text-slate-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm">{ec.name}</p>
                      <p className="text-xs text-slate-500">{ec.relationship}</p>
                    </div>
                    <a href={`tel:${ec.phone}`} className={`text-sm font-black px-3 py-1.5 rounded-xl ${ec.isPrimary ? "bg-red-500 text-white" : "bg-slate-100 text-slate-600"}`}>{ec.phone}</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medications */}
          {pat.medications.length > 0 && (
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Pill className="w-3.5 h-3.5 text-orange-500" />Active Medications</p>
              <div className="space-y-2">
                {pat.medications.map((m, i) => (
                  <div key={i} className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.dosage} · {m.frequency}</p>
                    </div>
                    <span className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-black">{m.timeOfDay}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reminders */}
          {pat.reminders.length > 0 && (
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-yellow-500" />Upcoming Reminders</p>
              <div className="space-y-2">
                {pat.reminders.map((r, i) => (
                  <div key={i} className="bg-yellow-50 border border-yellow-100 rounded-2xl px-4 py-3">
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-bold text-slate-800 text-sm">{r.title}</p>
                      <p className="text-xs text-slate-400 shrink-0 whitespace-nowrap">{fmt(r.dateTime)}</p>
                    </div>
                    {r.description && <p className="text-xs text-slate-500 mt-1">{r.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Caregivers */}
          {pat.caregivers.length > 1 && (
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Users className="w-3.5 h-3.5 text-blue-500" />All Caregivers</p>
              <div className="space-y-2">
                {pat.caregivers.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-200 flex items-center justify-center font-bold text-blue-700">{c.caregiver.name.charAt(0)}</div>
                    <div className="flex-1"><p className="font-bold text-slate-800 text-sm">{c.caregiver.name}</p><p className="text-xs text-slate-500">{c.caregiver.phone || "—"}</p></div>
                    {c.caregiver.phone && <a href={`tel:${c.caregiver.phone}`} className="p-2 rounded-xl bg-blue-100 text-blue-600"><Phone className="w-4 h-4" /></a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom padding for safe area */}
          <div className="h-6" />
        </div>
      </div>
    </motion.div>
  );

  // ─── DOCTOR DETAIL SHEET ─────────────────────────────
  const DoctorDetail = ({ doc }: { doc: Doctor }) => (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-white flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <button onClick={() => setDetailDoctor(null)} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center active:bg-slate-200">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <p className="font-extrabold text-slate-800 text-base leading-tight">Dr. {doc.name}</p>
          <p className="text-xs text-slate-400">{doc.specialization || "General"}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center font-black text-3xl">{doc.name.charAt(0)}</div>
            <div>
              <h2 className="font-black text-xl">Dr. {doc.name}</h2>
              <p className="text-white/70 text-sm">{doc.user.email}</p>
              {doc.phone && <a href={`tel:${doc.phone}`} className="text-white/80 text-xs flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{doc.phone}</a>}
            </div>
          </div>
          <div className="bg-white/15 rounded-2xl px-4 py-3 flex items-center justify-between">
            <p className="text-white font-bold">{doc.patients.length} Patients assigned</p>
            <span className="px-3 py-1 bg-white/20 rounded-xl text-xs font-black text-white">{doc.specialization || "General"}</span>
          </div>
        </div>
        <div className="px-4 py-5 space-y-3">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Patients</p>
          {doc.patients.length === 0
            ? <p className="text-sm text-slate-400 italic">No patients assigned</p>
            : doc.patients.map(pat => (
                <button key={pat.id} onClick={() => { setDetailDoctor(null); setDetailPatient(pat as any); }}
                  className="w-full flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3.5 hover:border-violet-200 active:bg-slate-50 transition shadow-sm text-left">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center font-bold text-white text-lg shrink-0">{pat.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">{pat.name}</p>
                    <p className="text-xs text-slate-400">Age {pat.age} · {pat.bloodGroup || "N/A"} · {pat.medications.length} meds</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pat.latitude && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </button>
              ))
          }
          <div className="h-6" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>

      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800 text-sm leading-none">Supervisor</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 font-bold">LIVE</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchAll(true)} disabled={refreshing} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition">
              <RefreshCw className={`w-4 h-4 text-slate-500 ${refreshing ? "animate-spin text-violet-500" : ""}`} />
            </button>
            <button onClick={() => { logout(); router.push("/"); }} className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center active:bg-red-100 transition border border-red-100">
              <LogOut className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </header>

      {/* ── SEARCH BAR ── */}
      <div className="sticky top-[57px] z-30 bg-white/95 backdrop-blur px-4 py-2.5 border-b border-slate-100 max-w-5xl mx-auto w-full">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            placeholder={`Search ${activeTab}…`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-violet-400 focus:bg-white transition"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center">
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main className="flex-1 overflow-y-auto pb-24 max-w-5xl mx-auto w-full px-4 pt-4">

        {/* STATS TAB */}
        {activeTab === "stats" && stats && (
          <div className="space-y-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Platform Overview</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Doctors", value: stats.doctors, icon: <Stethoscope className="w-6 h-6" />, from: "from-violet-500", to: "to-violet-700" },
                { label: "Patients", value: stats.patients, icon: <Heart className="w-6 h-6" />, from: "from-blue-500", to: "to-blue-700" },
                { label: "Caregivers", value: stats.caregivers, icon: <Users className="w-6 h-6" />, from: "from-emerald-500", to: "to-emerald-700" },
                { label: "Pending Reminders", value: stats.pendingReminders, icon: <Clock className="w-6 h-6" />, from: "from-orange-400", to: "to-orange-600" },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                  className={`bg-gradient-to-br ${s.from} ${s.to} rounded-3xl p-5 text-white shadow-lg`}>
                  <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">{s.icon}</div>
                  <p className="text-4xl font-black">{s.value}</p>
                  <p className="text-white/80 text-sm font-semibold mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
              <p className="font-bold text-slate-700 text-sm">{user?.email}</p>
              <button onClick={() => { logout(); router.push("/"); }}
                className="mt-4 w-full py-3 rounded-2xl bg-red-50 text-red-600 font-black text-sm border border-red-100 active:bg-red-100 transition flex items-center justify-center gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* PATIENTS TAB */}
        {activeTab === "patients" && (
          <div className="space-y-3">
            {filteredPatients.length === 0 && <div className="text-center py-20 text-slate-400 text-sm">No patients found</div>}
            {filteredPatients.map((pat, i) => (
              <motion.button
                key={pat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setDetailPatient(pat)}
                className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-4 text-left active:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-violet-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-blue-100 shrink-0">
                    {pat.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-slate-800 text-base leading-tight truncate">{pat.name}</p>
                      {pat.latitude && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Age {pat.age} {pat.bloodGroup ? `· ${pat.bloodGroup}` : ""}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                </div>

                {/* Info pills */}
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-violet-50 text-violet-700 text-xs font-semibold">
                    <Stethoscope className="w-3 h-3" /> Dr. {pat.doctor?.name}
                  </span>
                  {pat.latitude && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                      <MapPin className="w-3 h-3" /> Live GPS
                    </span>
                  )}
                  {pat.medications.length > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 text-xs font-semibold">
                      <Pill className="w-3 h-3" /> {pat.medications.length} meds
                    </span>
                  )}
                  {pat.emergencyContacts.length > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">
                      <Siren className="w-3 h-3" /> SOS
                    </span>
                  )}
                  {pat.reminders.length > 0 && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-yellow-50 text-yellow-700 text-xs font-semibold">
                      <Clock className="w-3 h-3" /> {pat.reminders.length} reminders
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* DOCTORS TAB */}
        {activeTab === "doctors" && (
          <div className="space-y-3">
            {filteredDoctors.length === 0 && <div className="text-center py-20 text-slate-400 text-sm">No doctors found</div>}
            {filteredDoctors.map((doc, i) => (
              <motion.button
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setDetailDoctor(doc)}
                className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-4 text-left active:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-violet-100 shrink-0">
                    {doc.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-slate-800 text-base leading-tight">Dr. {doc.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{doc.specialization || "General"} · {doc.user.email}</p>
                    {doc.phone && <p className="text-xs text-slate-400">{doc.phone}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="px-3 py-1.5 rounded-xl bg-violet-100 text-violet-700 text-xs font-black">{doc.patients.length} pts</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
                {doc.patients.length > 0 && (
                  <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                    {doc.patients.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                        {p.latitude && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        <span className="text-xs text-slate-600 font-semibold whitespace-nowrap">{p.name.split(" ")[0]}</span>
                      </div>
                    ))}
                    {doc.patients.length > 5 && <div className="flex items-center px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100 shrink-0 text-xs text-slate-400">+{doc.patients.length - 5}</div>}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </main>

      {/* ── BOTTOM TAB BAR ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around max-w-5xl mx-auto px-2 py-2">
          {([
            { id: "patients", label: "Patients", icon: <Heart className="w-5 h-5" />, count: patients.length },
            { id: "doctors", label: "Doctors", icon: <Stethoscope className="w-5 h-5" />, count: doctors.length },
            { id: "stats", label: "Overview", icon: <BarChart3 className="w-5 h-5" />, count: null },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1.5 px-5 rounded-2xl transition ${
                activeTab === tab.id ? "bg-violet-600 text-white shadow-lg shadow-violet-200" : "text-slate-400"
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-black leading-none">{tab.label}</span>
              {tab.count !== null && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* ── DETAIL SHEETS ── */}
      <AnimatePresence>
        {detailPatient && <PatientDetail pat={detailPatient} />}
        {detailDoctor && <DoctorDetail doc={detailDoctor} />}
      </AnimatePresence>
    </div>
  );
}
