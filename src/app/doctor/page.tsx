"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/frontend/providers";
import { 
  User, 
  Users, 
  Brain, 
  MapPin, 
  Activity, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  Pill, 
  FileText,
  Loader2,
  Heart,
  ChevronRight,
  Sparkles,
  Menu,
  X
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  profileImage?: string;
  latitude?: number;
  longitude?: number;
  locationUpdatedAt?: string;
  user: {
    email: string;
  };
}

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  
  // Patient lists
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // Sub-resource lists for selected patient
  const [people, setPeople] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"profile" | "people" | "places" | "allergies" | "meds" | "reminders" | "journals">("profile");

  // Dialog / Form States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAddPeopleOpen, setIsAddPeopleOpen] = useState(false);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);
  const [isAddAllergyOpen, setIsAddAllergyOpen] = useState(false);
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [isAddJournalOpen, setIsAddJournalOpen] = useState(false);

  // Register Form
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regBlood, setRegBlood] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regContact, setRegContact] = useState("");

  // Sub-Resource Forms
  const [formName, setFormName] = useState("");
  const [formRelationship, setFormRelationship] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formMemory, setFormMemory] = useState("");
  const [uploading, setUploading] = useState(false);

  // Handle file upload from device
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setFormPhoto(data.url);
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const [formAddress, setFormAddress] = useState("");
  const [formMaps, setFormMaps] = useState("");

  const [formType, setFormType] = useState("FOOD");
  const [formItem, setFormItem] = useState("");
  const [formReaction, setFormReaction] = useState("");
  const [formSeverity, setFormSeverity] = useState("MEDIUM");

  const [formDosage, setFormDosage] = useState("");
  const [formFreq, setFormFreq] = useState("Once daily");
  const [formTime, setFormTime] = useState("Morning");
  const [formTimeHour, setFormTimeHour] = useState("08:00");
  const [formInstructions, setFormInstructions] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  
  const [formContent, setFormContent] = useState("");
  const [formMediaType, setFormMediaType] = useState("IMAGE");

  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Fetch Patients List
  const fetchPatients = async (selectIdAfter?: string) => {
    try {
      const res = await fetch("/api/patients");
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
        
        // Auto select first patient or reselect
        if (data.patients && data.patients.length > 0) {
          if (selectIdAfter) {
            const reselected = data.patients.find((p: any) => p.id === selectIdAfter);
            if (reselected) setSelectedPatient(reselected);
          } else if (!selectedPatient) {
            setSelectedPatient(data.patients[0]);
          }
        } else {
          setSelectedPatient(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Patient Sub-resources
  const fetchSubResources = async (patientId: string) => {
    try {
      const pRes = await fetch(`/api/patients/${patientId}/people`);
      const pData = await pRes.json();
      setPeople(pData.people || []);

      const plRes = await fetch(`/api/patients/${patientId}/places`);
      const plData = await plRes.json();
      setPlaces(plData.places || []);

      const aRes = await fetch(`/api/patients/${patientId}/allergies`);
      const aData = await aRes.json();
      setAllergies(aData.allergies || []);

      const mRes = await fetch(`/api/patients/${patientId}/medications`);
      const mData = await mRes.json();
      setMeds(mData.medications || []);

      const rRes = await fetch(`/api/patients/${patientId}/reminders`);
      const rData = await rRes.json();
      setReminders(rData.reminders || []);

      const jRes = await fetch(`/api/patients/${patientId}/journals`);
      const jData = await jRes.json();
      setJournals(jData.journals || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchSubResources(selectedPatient.id);
    }
  }, [selectedPatient]);

  // Poll selected patient's latest location details
  useEffect(() => {
    if (!selectedPatient?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/patients/${selectedPatient.id}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedPatient(data.patient);
        }
      } catch (e) {
        console.error("Error polling patient details:", e);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedPatient?.id]);

  // Handle patient deletion
  const handleDeletePatient = async (id: string) => {
    if (!confirm("Are you absolutely sure you want to delete this patient's profile and account? All their memory logs will be permanently deleted.")) return;
    try {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedPatient(null);
        fetchPatients();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // POST Request Helper
  const handleAddSubresource = async (endpoint: string, payload: any, toggleModal: (b: boolean) => void) => {
    if (!selectedPatient) return;
    setSubmitting(true);
    setFeedbackMsg("");
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toggleModal(false);
        fetchSubResources(selectedPatient.id);
        // Clear forms
        setFormName("");
        setFormRelationship("");
        setFormDesc("");
        setFormPhoto("");
        setFormMemory("");
        setFormAddress("");
        setFormMaps("");
        setFormItem("");
        setFormReaction("");
        setFormDosage("");
        setFormInstructions("");
        setFormTitle("");
        setFormDate("");
        setFormContent("");
      } else {
        setFeedbackMsg(data.error || "Failed to save item.");
      }
    } catch (e) {
      setFeedbackMsg("Network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // DELETE Request Helper
  const handleDeleteSubresource = async (endpoint: string, paramName: string, itemId: string) => {
    if (!selectedPatient) return;
    try {
      const res = await fetch(`/api/patients/${selectedPatient.id}/${endpoint}?${paramName}=${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSubResources(selectedPatient.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Patient User
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedbackMsg("");

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          name: regName,
          age: parseInt(regAge),
          bloodGroup: regBlood,
          address: regAddress,
          emergencyContact: regContact,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsRegisterOpen(false);
        setRegEmail("");
        setRegPassword("");
        setRegName("");
        setRegAge("");
        setRegBlood("");
        setRegAddress("");
        setRegContact("");
        fetchPatients(data.patient?.id);
      } else {
        setFeedbackMsg(data.error || "Failed to create patient account.");
      }
    } catch (err) {
      setFeedbackMsg("Connection error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center gap-4 bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-bold text-lg text-muted-foreground">Loading Clinical Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-foreground bg-background">
      {/* ── DESKTOP SIDEBAR ── (hidden on mobile, shown md+) */}
      <aside className="hidden md:flex w-72 lg:w-80 shrink-0 border-r border-border bg-card flex-col h-screen sticky top-0 overflow-y-auto">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight">RememberMe</span>
          </div>
          <span className="text-[10px] uppercase font-black text-primary px-2 py-1 rounded-full bg-primary/10">Clinician</span>
        </div>
        <div className="p-4 border-b border-border">
          <button onClick={() => { setIsRegisterOpen(true); setFeedbackMsg(""); }}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:shadow-md transition">
            <Plus className="w-4 h-4" /> Add New Patient
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2 px-2">Patients ({patients.length})</p>
          {patients.length === 0 ? (
            <div className="p-4 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">No patients yet</div>
          ) : patients.map((p) => (
            <button key={p.id} onClick={() => setSelectedPatient(p)}
              className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition ${
                selectedPatient?.id === p.id ? "bg-primary/10 border border-primary/30 text-foreground" : "hover:bg-muted border border-transparent text-muted-foreground"
              }`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center font-black text-sm text-primary uppercase shrink-0">
                {p.name.substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.user.email}</p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-border">
          <button onClick={logout} className="w-full py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition text-muted-foreground">Sign Out</button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">

        {/* ── TOP HEADER ── */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile logo */}
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md md:hidden shrink-0">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-sm leading-tight">Clinical Dashboard</p>
              <p className="text-[10px] text-muted-foreground truncate hidden sm:block">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <button onClick={logout} className="md:hidden px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition">Out</button>
            <button onClick={logout} className="hidden md:block px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition">Sign Out</button>
          </div>
        </header>

        {/* ── MOBILE: Patient Picker ── */}
        <div className="md:hidden px-4 py-3 border-b border-border bg-card flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">Selected Patient</p>
            <select
              value={selectedPatient?.id || ""}
              onChange={(e) => {
                const p = patients.find(pt => pt.id === e.target.value);
                if (p) setSelectedPatient(p);
              }}
              className="w-full text-sm font-bold bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary appearance-none"
            >
              {patients.length === 0 && <option value="">No patients</option>}
              {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={() => { setIsRegisterOpen(true); setFeedbackMsg(""); }}
            className="shrink-0 w-11 h-11 mt-4 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 active:bg-primary/90 transition">
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* ── CONTENT AREA ── */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:pb-8 max-w-4xl w-full mx-auto">
          {!selectedPatient ? (
            <div className="flex flex-col gap-5 mt-2">
              {/* Welcome Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/20 border border-primary/15 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg leading-tight">Welcome, Dr. {user?.profile?.name || "Doctor"}</h2>
                  <p className="text-muted-foreground text-xs mt-0.5">Manage patient memory records, medications, and more.</p>
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Patients", val: patients.length, icon: <Users className="w-5 h-5 text-primary" />, bg: "bg-primary/10" },
                  { label: "Active Meds", val: "✓", icon: <Pill className="w-5 h-5 text-orange-500" />, bg: "bg-orange-50" },
                  { label: "SOS Ready", val: "✓", icon: <AlertTriangle className="w-5 h-5 text-red-500" />, bg: "bg-red-50" },
                ].map((s, i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl p-3 sm:p-4 flex flex-col gap-2">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>{s.icon}</div>
                    <p className="text-xl sm:text-2xl font-black">{s.val}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Patient list cards on mobile when no selection */}
              {patients.length > 0 && (
                <div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3">Your Patients</p>
                  <div className="flex flex-col gap-2">
                    {patients.map(p => (
                      <button key={p.id} onClick={() => setSelectedPatient(p)}
                        className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 active:bg-muted transition text-left">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center font-black text-white text-base shrink-0">
                          {p.name.substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.user.email}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Patient Hero Card */}
              <div className="bg-gradient-to-br from-primary/10 to-background border border-primary/15 rounded-3xl p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-primary/20 shrink-0">
                      {selectedPatient.name.substring(0, 2)}
                    </div>
                    <div>
                      <h2 className="font-extrabold text-xl leading-tight">{selectedPatient.name}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Age {selectedPatient.age} · {selectedPatient.bloodGroup || "N/A"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{selectedPatient.user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeletePatient(selectedPatient.id)}
                    className="px-3 py-1.5 text-xs font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition">
                    Delete
                  </button>
                </div>
              </div>

              {/* Tab Pills (horizontal scrollable) */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
                {[
                  { id: "profile", label: "Profile", icon: <User className="w-3.5 h-3.5" /> },
                  { id: "people", label: "People", icon: <Brain className="w-3.5 h-3.5" /> },
                  { id: "places", label: "Places", icon: <MapPin className="w-3.5 h-3.5" /> },
                  { id: "allergies", label: "Allergies", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                  { id: "meds", label: "Meds", icon: <Pill className="w-3.5 h-3.5" /> },
                  { id: "reminders", label: "Routines", icon: <Activity className="w-3.5 h-3.5" /> },
                  { id: "journals", label: "Journal", icon: <FileText className="w-3.5 h-3.5" /> },
                ].map((t) => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-black whitespace-nowrap transition shrink-0 ${
                      activeTab === t.id ? "bg-primary text-white shadow-lg shadow-primary/25" : "bg-card border border-border text-muted-foreground hover:border-primary/50"
                    }`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 min-h-[300px]">

                {/* PROFILE */}
                {activeTab === "profile" && (
                  <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-base border-b border-border pb-2">Patient Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: "Email", val: selectedPatient.user.email },
                        { label: "Address", val: selectedPatient.address || "None listed" },
                        { label: "Emergency Contact", val: selectedPatient.emergencyContact || "None listed" },
                        { label: "Blood Group", val: selectedPatient.bloodGroup || "Not specified" },
                      ].map((row, i) => (
                        <div key={i} className="bg-muted/50 rounded-2xl p-3">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1">{row.label}</p>
                          <p className="font-semibold text-sm break-words">{row.val}</p>
                        </div>
                      ))}
                    </div>
                    {/* Live Location */}
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                        <span className="text-xs font-black text-primary uppercase tracking-wider">Live Location</span>
                      </div>
                      {selectedPatient.latitude ? (
                        <div className="flex flex-col gap-2">
                          <p className="font-bold text-sm font-mono">{selectedPatient.latitude.toFixed(5)}, {selectedPatient.longitude?.toFixed(5)}</p>
                          {selectedPatient.locationUpdatedAt && <p className="text-xs text-muted-foreground">Updated: {new Date(selectedPatient.locationUpdatedAt).toLocaleString()}</p>}
                          <a href={`https://www.google.com/maps?q=${selectedPatient.latitude},${selectedPatient.longitude}`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary px-4 py-2.5 rounded-xl w-fit">
                            📍 Open Google Maps
                          </a>
                        </div>
                      ) : <p className="text-xs text-muted-foreground">No location yet. Patient device will share when they log in.</p>}
                    </div>
                  </div>
                )}

                {/* PEOPLE */}
                {activeTab === "people" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-base">Known People</h3>
                      <button onClick={() => setIsAddPeopleOpen(true)} className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add</button>
                    </div>
                    {people.length === 0 ? <p className="text-xs text-muted-foreground text-center py-10">No people listed yet.</p> : (
                      <div className="flex flex-col gap-2">
                        {people.map((p) => (
                          <div key={p.id} className="flex items-start gap-3 p-4 border border-border rounded-2xl">
                            <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-border">
                              {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">{p.name[0]}</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm">{p.name} <span className="text-xs text-muted-foreground font-normal">({p.relationship})</span></p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{p.description}</p>
                              {p.positiveMemory && <p className="text-xs text-primary font-semibold mt-1">🌸 {p.positiveMemory}</p>}
                            </div>
                            <button onClick={() => handleDeleteSubresource("people", "personId", p.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl shrink-0"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PLACES */}
                {activeTab === "places" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-base">Visited Places</h3>
                      <button onClick={() => setIsAddPlaceOpen(true)} className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add</button>
                    </div>
                    {places.length === 0 ? <p className="text-xs text-muted-foreground text-center py-10">No places listed yet.</p> : (
                      <div className="flex flex-col gap-2">
                        {places.map((pl) => (
                          <div key={pl.id} className="flex items-start gap-3 p-4 border border-border rounded-2xl">
                            <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-border">
                              {pl.photoUrl ? <img src={pl.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground">{pl.name[0]}</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm">{pl.name}</p>
                              {pl.address && <p className="text-xs text-muted-foreground">📍 {pl.address}</p>}
                              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{pl.description}</p>
                            </div>
                            <button onClick={() => handleDeleteSubresource("places", "placeId", pl.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl shrink-0"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ALLERGIES */}
                {activeTab === "allergies" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-base">Allergies & Warnings</h3>
                      <button onClick={() => setIsAddAllergyOpen(true)} className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add</button>
                    </div>
                    {allergies.length === 0 ? <p className="text-xs text-muted-foreground text-center py-10">No allergies logged.</p> : (
                      <div className="flex flex-col gap-2">
                        {allergies.map((a) => (
                          <div key={a.id} className={`flex items-center gap-3 p-4 rounded-2xl border ${a.severity === "HIGH" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-100"}`}>
                            <AlertTriangle className={`w-5 h-5 shrink-0 ${a.severity === "HIGH" ? "text-red-500" : "text-orange-500"}`} />
                            <div className="flex-1">
                              <p className="font-bold text-sm">{a.item} <span className="text-xs font-normal opacity-70">({a.type})</span></p>
                              {a.reaction && <p className="text-xs mt-0.5">{a.reaction}</p>}
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${a.severity === "HIGH" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>{a.severity}</span>
                            </div>
                            <button onClick={() => handleDeleteSubresource("allergies", "allergyId", a.id)} className="p-2 text-red-400 hover:bg-red-100 rounded-xl shrink-0"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MEDICATIONS */}
                {activeTab === "meds" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-base">Medications</h3>
                      <button onClick={() => setIsAddMedOpen(true)} className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add</button>
                    </div>
                    {meds.length === 0 ? <p className="text-xs text-muted-foreground text-center py-10">No medications scheduled.</p> : (
                      <div className="flex flex-col gap-2">
                        {meds.map((m) => (
                          <div key={m.id} className="flex items-center gap-3 p-4 border border-border rounded-2xl bg-orange-50/40">
                            <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center text-xl shrink-0">💊</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm">{m.name} <span className="text-muted-foreground font-normal">({m.dosage})</span></p>
                              <p className="text-xs text-muted-foreground">{m.frequency} · {m.timeOfDay}</p>
                              {m.instructions && <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.instructions}</p>}
                            </div>
                            <button onClick={() => handleDeleteSubresource("medications", "medicationId", m.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl shrink-0"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ROUTINES */}
                {activeTab === "reminders" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-base">Routines & Activities</h3>
                      <button onClick={() => setIsAddReminderOpen(true)} className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add</button>
                    </div>
                    {reminders.length === 0 ? <p className="text-xs text-muted-foreground text-center py-10">No routines scheduled.</p> : (
                      <div className="flex flex-col gap-2">
                        {reminders.map((r) => (
                          <div key={r.id} className="flex items-center gap-3 p-4 border border-border rounded-2xl">
                            <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm">{r.title}</p>
                              {r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
                              <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(r.dateTime).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${r.completed ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>{r.completed ? "Done" : "Pending"}</span>
                              <button onClick={() => handleDeleteSubresource("reminders", "reminderId", r.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* JOURNALS */}
                {activeTab === "journals" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-base">Memory Journal</h3>
                      <button onClick={() => setIsAddJournalOpen(true)} className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add</button>
                    </div>
                    {journals.length === 0 ? <p className="text-xs text-muted-foreground text-center py-10">No journal entries yet.</p> : (
                      <div className="flex flex-col gap-3">
                        {journals.map((j) => (
                          <div key={j.id} className="p-4 border border-border rounded-2xl flex flex-col gap-2">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <p className="font-bold text-sm text-primary">{j.title}</p>
                                <p className="text-[10px] text-muted-foreground">{new Date(j.createdAt).toLocaleDateString()}</p>
                              </div>
                              <button onClick={() => handleDeleteSubresource("journals", "journalId", j.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl shrink-0"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{j.content}</p>
                            {j.mediaUrl && <div className="w-full rounded-xl overflow-hidden max-h-40 bg-muted"><img src={j.mediaUrl} alt={j.title} className="w-full h-full object-cover" /></div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MODALS ── */}

      {/* Register Patient */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form onSubmit={handleRegisterPatient} className="w-full sm:max-w-lg bg-card border border-border p-5 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Register New Patient</h3>
              <button type="button" onClick={() => setIsRegisterOpen(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            {feedbackMsg && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">{feedbackMsg}</div>}
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Full Name</label><input required type="text" value={regName} onChange={e=>setRegName(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="Robert Chen" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Email</label><input required type="email" value={regEmail} onChange={e=>setRegEmail(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="robert@mail.com" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Password</label><input required type="password" value={regPassword} onChange={e=>setRegPassword(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="••••••••" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Age</label><input required type="number" value={regAge} onChange={e=>setRegAge(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="78" /></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Blood Group</label><input type="text" value={regBlood} onChange={e=>setRegBlood(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="AB+" /></div>
            </div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Home Address</label><input type="text" value={regAddress} onChange={e=>setRegAddress(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="123 Lavender Lane" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Emergency Contact</label><input type="text" value={regContact} onChange={e=>setRegContact(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="Sarah Chen (Daughter) - 555-0199" /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsRegisterOpen(false)} className="flex-1 py-3 border border-border rounded-2xl text-sm font-bold hover:bg-muted transition">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold hover:bg-primary/90 transition">{submitting ? "Creating..." : "Create Account"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Person */}
      {isAddPeopleOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-card border border-border p-5 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h3 className="font-bold text-lg">Add Known Person</h3><button onClick={() => setIsAddPeopleOpen(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button></div>
            {feedbackMsg && <p className="text-xs text-red-500 bg-red-50 p-2 rounded-xl">{feedbackMsg}</p>}
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Name</label><input type="text" value={formName} onChange={e=>setFormName(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="Sarah Chen" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Relationship</label><input type="text" value={formRelationship} onChange={e=>setFormRelationship(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="Daughter" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Description</label><textarea rows={3} value={formDesc} onChange={e=>setFormDesc(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary resize-none" placeholder="Sarah is your daughter..." /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Positive Memory</label><input type="text" value={formMemory} onChange={e=>setFormMemory(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="She taught her to ride a bike..." /></div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Photo</label>
              <div className="flex gap-2 items-center">
                <label className={`px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer border ${uploading ? "bg-muted text-muted-foreground border-border" : "bg-primary/10 text-primary border-primary/30"}`}>
                  {uploading ? "Uploading..." : "📁 Upload"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
                </label>
                <input type="text" value={formPhoto} onChange={e=>setFormPhoto(e.target.value)} className="flex-1 p-2.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="or paste URL..." />
              </div>
              {formPhoto && <img src={formPhoto} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-border" />}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsAddPeopleOpen(false)} className="flex-1 py-3 border border-border rounded-2xl text-sm font-bold hover:bg-muted">Cancel</button>
              <button onClick={() => handleAddSubresource("people", { name: formName, relationship: formRelationship, description: formDesc, photoUrl: formPhoto, positiveMemory: formMemory }, setIsAddPeopleOpen)} className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Place */}
      {isAddPlaceOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-card border border-border p-5 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h3 className="font-bold text-lg">Add Visited Place</h3><button onClick={() => setIsAddPlaceOpen(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Place Name</label><input type="text" value={formName} onChange={e=>setFormName(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="Green Lake Park" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Address</label><input type="text" value={formAddress} onChange={e=>setFormAddress(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="7201 E Green Lake Dr" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Description</label><textarea rows={3} value={formDesc} onChange={e=>setFormDesc(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary resize-none" placeholder="You love walking here..." /></div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Photo</label>
              <div className="flex gap-2 items-center">
                <label className={`px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer border ${uploading ? "bg-muted text-muted-foreground border-border" : "bg-primary/10 text-primary border-primary/30"}`}>
                  {uploading ? "Uploading..." : "📁 Upload"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
                </label>
                <input type="text" value={formPhoto} onChange={e=>setFormPhoto(e.target.value)} className="flex-1 p-2.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="or paste URL..." />
              </div>
              {formPhoto && <img src={formPhoto} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-border" />}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsAddPlaceOpen(false)} className="flex-1 py-3 border border-border rounded-2xl text-sm font-bold hover:bg-muted">Cancel</button>
              <button onClick={() => handleAddSubresource("places", { name: formName, address: formAddress, description: formDesc, photoUrl: formPhoto }, setIsAddPlaceOpen)} className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Allergy */}
      {isAddAllergyOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-card border border-border p-5 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between"><h3 className="font-bold text-lg">Add Allergy</h3><button onClick={() => setIsAddAllergyOpen(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Type</label><select value={formType} onChange={e=>setFormType(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary"><option>FOOD</option><option>MEDICINE</option><option>ENVIRONMENT</option><option>OTHER</option></select></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Severity</label><select value={formSeverity} onChange={e=>setFormSeverity(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></div>
            </div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Allergy Item</label><input type="text" value={formItem} onChange={e=>setFormItem(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="e.g. Peanuts" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Reaction</label><input type="text" value={formReaction} onChange={e=>setFormReaction(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="e.g. Swelling" /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsAddAllergyOpen(false)} className="flex-1 py-3 border border-border rounded-2xl text-sm font-bold hover:bg-muted">Cancel</button>
              <button onClick={() => handleAddSubresource("allergies", { type: formType, item: formItem, reaction: formReaction, severity: formSeverity }, setIsAddAllergyOpen)} className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medication */}
      {isAddMedOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-card border border-border p-5 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h3 className="font-bold text-lg">Add Medication</h3><button onClick={() => setIsAddMedOpen(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Medicine</label><input type="text" value={formName} onChange={e=>setFormName(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="Donepezil" /></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Dosage</label><input type="text" value={formDosage} onChange={e=>setFormDosage(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="10 mg" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Frequency</label><input type="text" value={formFreq} onChange={e=>setFormFreq(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="Once daily" /></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Time of Day</label><select value={formTime} onChange={e=>setFormTime(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary"><option>Morning</option><option>Afternoon</option><option>Night</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Reminder (HH:MM)</label><input type="text" value={formTimeHour} onChange={e=>setFormTimeHour(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="08:00" /></div>
              <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Instructions</label><input type="text" value={formInstructions} onChange={e=>setFormInstructions(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="With food" /></div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Image (Optional)</label>
              <div className="flex gap-2 items-center">
                <label className={`px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer border ${uploading ? "bg-muted border-border" : "bg-primary/10 text-primary border-primary/30"}`}>
                  {uploading ? "Uploading..." : "📁 Upload"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
                </label>
                <input type="text" value={formPhoto} onChange={e=>setFormPhoto(e.target.value)} className="flex-1 p-2.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="or paste URL" />
              </div>
              {formPhoto && <img src={formPhoto} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-border" />}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsAddMedOpen(false)} className="flex-1 py-3 border border-border rounded-2xl text-sm font-bold hover:bg-muted">Cancel</button>
              <button onClick={() => handleAddSubresource("medications", { name: formName, dosage: formDosage, frequency: formFreq, timeOfDay: formTime, reminderTime: formTimeHour, imageUrl: formPhoto, instructions: formInstructions }, setIsAddMedOpen)} className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Routine */}
      {isAddReminderOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-card border border-border p-5 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between"><h3 className="font-bold text-lg">Add Routine Activity</h3><button onClick={() => setIsAddReminderOpen(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Activity Title</label><input type="text" value={formTitle} onChange={e=>setFormTitle(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="Eat breakfast" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Description</label><input type="text" value={formDesc} onChange={e=>setFormDesc(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="Oatmeal with berries" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Date & Time</label><input type="datetime-local" value={formDate} onChange={e=>setFormDate(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" /></div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsAddReminderOpen(false)} className="flex-1 py-3 border border-border rounded-2xl text-sm font-bold hover:bg-muted">Cancel</button>
              <button onClick={() => handleAddSubresource("reminders", { title: formTitle, description: formDesc, dateTime: formDate }, setIsAddReminderOpen)} className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Journal */}
      {isAddJournalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-card border border-border p-5 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between"><h3 className="font-bold text-lg">Log Memory Journal</h3><button onClick={() => setIsAddJournalOpen(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Title</label><input type="text" value={formTitle} onChange={e=>setFormTitle(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="Robert's Cozy Birthday" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-muted-foreground">Memory Details</label><textarea rows={4} value={formContent} onChange={e=>setFormContent(e.target.value)} className="w-full p-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary resize-none" placeholder="We gathered at Robert's home..." /></div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Photo</label>
              <div className="flex gap-2 items-center">
                <label className={`px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer border ${uploading ? "bg-muted border-border" : "bg-primary/10 text-primary border-primary/30"}`}>
                  {uploading ? "Uploading..." : "📁 Upload"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
                </label>
                <input type="text" value={formPhoto} onChange={e=>setFormPhoto(e.target.value)} className="flex-1 p-2.5 rounded-xl border border-border text-sm bg-background focus:outline-none focus:border-primary" placeholder="or paste URL..." />
              </div>
              {formPhoto && <img src={formPhoto} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-border" />}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setIsAddJournalOpen(false)} className="flex-1 py-3 border border-border rounded-2xl text-sm font-bold hover:bg-muted">Cancel</button>
              <button onClick={() => handleAddSubresource("journals", { title: formTitle, content: formContent, mediaUrl: formPhoto, mediaType: formMediaType }, setIsAddJournalOpen)} className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
