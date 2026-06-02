"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useTheme } from "@/frontend/providers";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Stethoscope, Activity, MapPin, Moon, Sun,
  ChevronDown, ChevronRight, Eye, EyeOff, Shield,
  AlertCircle, Clock, Pill, Phone, Mail, LogOut
} from "lucide-react";

interface Stats {
  doctors: number;
  patients: number;
  caregivers: number;
  pendingReminders: number;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  user: { email: string; createdAt: string };
  patients: Patient[];
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
  doctor: { name: string; specialization: string };
  caregivers: { caregiver: { name: string; phone: string } }[];
  medications: { name: string; dosage: string; timeOfDay: string }[];
  reminders: { title: string; dateTime: string }[];
  emergencyContacts: { name: string; phone: string; isPrimary: boolean }[];
}

export default function SupervisorPage() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<"doctors" | "patients">("doctors");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user && user.role !== "SUPERVISOR") {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
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
      }
    };
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredDoctors = doctors.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.doctor?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (iso: string) => new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
  });

  const timeSince = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-white/60 text-sm">Loading supervisor console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">Supervisor Console</h1>
            <p className="text-[11px] text-white/40 mt-0.5">Silent oversight mode • Read-only</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-400">LIVE</span>
          </div>

          <span className="text-sm text-white/50 hidden md:block">{user?.email}</span>

          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-white/10 transition">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Doctors", value: stats.doctors, icon: <Stethoscope className="w-5 h-5" />, color: "from-violet-600 to-violet-400" },
              { label: "Patients", value: stats.patients, icon: <Users className="w-5 h-5" />, color: "from-blue-600 to-blue-400" },
              { label: "Caregivers", value: stats.caregivers, icon: <Activity className="w-5 h-5" />, color: "from-emerald-600 to-emerald-400" },
              { label: "Pending Reminders", value: stats.pendingReminders, icon: <Clock className="w-5 h-5" />, color: "from-orange-600 to-orange-400" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                  {s.icon}
                </div>
                <p className="text-3xl font-extrabold">{s.value}</p>
                <p className="text-white/50 text-sm mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Search + Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            {(["doctors", "patients"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition ${
                  activeTab === tab
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                    : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                {tab} ({tab === "doctors" ? filteredDoctors.length : filteredPatients.length})
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500 w-full sm:w-64 transition"
          />
        </div>

        {/* DOCTORS VIEW */}
        {activeTab === "doctors" && (
          <div className="space-y-3">
            {filteredDoctors.length === 0 && (
              <div className="text-center py-12 text-white/30 text-sm">No doctors found</div>
            )}
            {filteredDoctors.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
              >
                {/* Doctor header */}
                <button
                  onClick={() => setExpandedDoctor(expandedDoctor === doc.id ? null : doc.id)}
                  className="w-full flex items-center gap-4 p-5 hover:bg-white/5 transition text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center font-bold text-lg shrink-0 shadow-lg shadow-violet-500/20">
                    {doc.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-base">Dr. {doc.name}</p>
                      {doc.specialization && (
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                          {doc.specialization}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-white/40 text-xs flex-wrap">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{doc.user.email}</span>
                      {doc.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{doc.phone}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-bold border border-blue-500/20">
                      {doc.patients.length} patients
                    </span>
                    {expandedDoctor === doc.id
                      ? <ChevronDown className="w-4 h-4 text-white/40" />
                      : <ChevronRight className="w-4 h-4 text-white/40" />
                    }
                  </div>
                </button>

                {/* Patients list */}
                <AnimatePresence>
                  {expandedDoctor === doc.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-white/10"
                    >
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {doc.patients.length === 0 ? (
                          <p className="text-white/30 text-sm py-4 px-2">No patients assigned</p>
                        ) : doc.patients.map((pat) => (
                          <button
                            key={pat.id}
                            onClick={() => setSelectedPatient(pat as any)}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 transition text-left group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-blue-600/30 flex items-center justify-center font-bold text-sm">
                              {pat.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{pat.name}</p>
                              <p className="text-white/40 text-xs">Age {pat.age} • {pat.bloodGroup || "N/A"}</p>
                            </div>
                            {pat.latitude && (
                              <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                              </div>
                            )}
                            <Eye className="w-4 h-4 text-white/20 group-hover:text-violet-400 transition" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* PATIENTS VIEW */}
        {activeTab === "patients" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPatients.length === 0 && (
              <div className="col-span-3 text-center py-12 text-white/30 text-sm">No patients found</div>
            )}
            {filteredPatients.map((pat, i) => (
              <motion.button
                key={pat.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedPatient(pat)}
                className="rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-white/8 p-5 text-left transition group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20">
                    {pat.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold">{pat.name}</p>
                    <p className="text-white/40 text-xs">Age {pat.age} • {pat.bloodGroup || "N/A"}</p>
                  </div>
                  {pat.latitude && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-400">LIVE</span>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-white/50">
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="w-3 h-3 text-violet-400" />
                    Dr. {pat.doctor?.name}
                    {pat.doctor?.specialization && <span className="text-white/30">• {pat.doctor.specialization}</span>}
                  </div>
                  {pat.caregivers.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-blue-400" />
                      {pat.caregivers[0].caregiver.name}
                      {pat.caregivers.length > 1 && <span className="text-white/30">+{pat.caregivers.length - 1} more</span>}
                    </div>
                  )}
                  {pat.medications.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Pill className="w-3 h-3 text-orange-400" />
                      {pat.medications.length} active medication{pat.medications.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-white/30">Click to view full profile</span>
                  <Eye className="w-4 h-4 text-white/20 group-hover:text-violet-400 transition" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPatient(null)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center font-black text-2xl shadow-xl">
                    {selectedPatient.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold">{selectedPatient.name}</h2>
                    <p className="text-white/40 text-sm">Age {selectedPatient.age} • {selectedPatient.bloodGroup || "N/A"} • {selectedPatient.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="p-2 rounded-xl hover:bg-white/10 transition text-white/50"
                >✕</button>
              </div>

              <div className="p-6 space-y-5">
                {/* Doctor & Caregivers */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4">
                    <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">Doctor</p>
                    <p className="font-bold text-sm">Dr. {selectedPatient.doctor?.name}</p>
                    <p className="text-white/40 text-xs">{selectedPatient.doctor?.specialization}</p>
                    {selectedPatient.doctor?.phone && <p className="text-white/40 text-xs mt-0.5">{selectedPatient.doctor.phone}</p>}
                  </div>
                  <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Caregivers</p>
                    {selectedPatient.caregivers.length === 0
                      ? <p className="text-white/30 text-xs">No caregivers</p>
                      : selectedPatient.caregivers.map((c, i) => (
                        <div key={i}>
                          <p className="font-bold text-sm">{c.caregiver.name}</p>
                          {c.caregiver.phone && <p className="text-white/40 text-xs">{c.caregiver.phone}</p>}
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Live Location */}
                {selectedPatient.latitude && (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        Live Location
                      </p>
                      <p className="text-sm font-mono text-white/70">
                        {selectedPatient.latitude.toFixed(5)}, {selectedPatient.longitude?.toFixed(5)}
                      </p>
                      {selectedPatient.locationUpdatedAt && (
                        <p className="text-[10px] text-white/30 mt-0.5">Updated {timeSince(selectedPatient.locationUpdatedAt)}</p>
                      )}
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${selectedPatient.latitude},${selectedPatient.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-400 transition flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Open Maps
                    </a>
                  </div>
                )}

                {/* Medications */}
                {selectedPatient.medications.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Active Medications</p>
                    <div className="space-y-1.5">
                      {selectedPatient.medications.map((m, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-sm">
                          <div className="flex items-center gap-2">
                            <Pill className="w-3.5 h-3.5 text-orange-400" />
                            <span className="font-semibold">{m.name}</span>
                            <span className="text-white/40">{m.dosage}</span>
                          </div>
                          <span className="text-white/30 text-xs">{m.timeOfDay}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Reminders */}
                {selectedPatient.reminders.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Upcoming Reminders</p>
                    <div className="space-y-1.5">
                      {selectedPatient.reminders.map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-yellow-400" />
                            <span>{r.title}</span>
                          </div>
                          <span className="text-white/30 text-xs">{formatTime(r.dateTime)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emergency Contacts */}
                {selectedPatient.emergencyContacts.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Emergency Contacts</p>
                    {selectedPatient.emergencyContacts.map((ec, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-sm">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="font-semibold">{ec.name}</span>
                        <span className="text-white/40">{ec.phone}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Address */}
                {selectedPatient.address && (
                  <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-sm text-white/50">
                    📍 {selectedPatient.address}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
