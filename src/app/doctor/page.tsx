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
    <div className="flex flex-col md:flex-row min-h-screen text-foreground">
      {/* LEFT COLUMN: PATIENTS LIST */}
      <aside className="w-full md:w-72 lg:w-80 shrink-0 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col md:h-screen md:sticky md:top-0 md:overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-md tracking-tight">RememberMe</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-primary px-2.5 py-1 rounded-full bg-secondary/80">Clinician</span>
        </div>

        {/* Action Button: Register New Patient */}
        <div className="p-4 border-b border-border">
          <button
            onClick={() => { setIsRegisterOpen(true); setFeedbackMsg(""); }}
            className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Add New Patient
          </button>
        </div>

        {/* Patients Selector Menu */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Assigned Patients</h3>
          {patients.length === 0 ? (
            <div className="p-4 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
              No patients assigned yet. Click "Add New Patient" to register one under your care.
            </div>
          ) : (
            patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPatient(p)}
                className={`w-full p-3.5 rounded-xl text-left flex items-center gap-3 transition cursor-pointer ${
                  selectedPatient?.id === p.id 
                    ? "bg-secondary/40 border border-primary/20 text-foreground" 
                    : "hover:bg-muted border border-transparent text-muted-foreground"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-sm text-primary uppercase shrink-0">
                  {p.name.substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{p.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{p.user.email}</p>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>
            ))
          )}
        </div>
      </aside>

      {/* RIGHT COLUMN: CORE DASHBOARD / DETAILS EDITOR */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Doctor Profile Bar */}
        <header className="px-4 sm:px-8 py-4 sm:py-5 border-b border-border bg-card flex flex-wrap justify-between items-center gap-3 sticky top-0 z-30">
          <div className="min-w-0">
            <h2 className="font-bold text-base sm:text-lg truncate">Clinical Control Center</h2>
            <p className="text-xs text-muted-foreground hidden sm:block">Logged in as {user?.email}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-sm font-semibold hidden sm:block">{user?.profile?.name || "Dr."}</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-secondary-foreground" />
            </div>
            <button onClick={logout} className="px-3 sm:px-4 py-1.5 sm:py-2 border border-border hover:bg-muted text-xs font-bold rounded-xl transition whitespace-nowrap">
              Sign Out
            </button>
          </div>
        </header>

        {/* Dashboard Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-5xl w-full">
          {!selectedPatient ? (
            /* Stats display if no patient selected */
            <div className="flex flex-col gap-8">
              <div className="p-5 sm:p-8 rounded-[2rem] bg-gradient-to-r from-secondary/30 to-background border border-primary/10 flex items-center gap-4 sm:gap-6">
                <Sparkles className="w-10 h-10 text-primary animate-calm-pulse" />
                <div>
                  <h3 className="text-2xl font-extrabold mb-1">Clinical Overview</h3>
                  <p className="text-muted-foreground text-sm">
                    Register and manage the memory records of patients. You have full edit control over their medication, timelines, family connections, and safety parameters.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-card border border-border flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div>
                  <div>
                    <div className="text-3xl font-extrabold">{patients.length}</div>
                    <div className="text-xs text-muted-foreground font-bold">Total Patients Assigned</div>
                  </div>
                </div>
                <div className="p-6 rounded-3xl bg-card border border-border flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center"><Pill className="w-6 h-6 text-accent-foreground" /></div>
                  <div>
                    <div className="text-3xl font-extrabold">Active</div>
                    <div className="text-xs text-muted-foreground font-bold">Medication Schedules</div>
                  </div>
                </div>
                <div className="p-6 rounded-3xl bg-card border border-border flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-warning-orange/15 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-warning-orange-foreground" /></div>
                  <div>
                    <div className="text-3xl font-extrabold">Ready</div>
                    <div className="text-xs text-muted-foreground font-bold">SOS Emergency Triggers</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Selected Patient Detailed Editor Board */
            <div className="flex flex-col gap-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center font-bold text-2xl text-primary uppercase shrink-0 border border-primary/10">
                    {selectedPatient.name.substring(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold tracking-tight">{selectedPatient.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      Age: {selectedPatient.age} | Blood Group: {selectedPatient.bloodGroup || "Not Specified"}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeletePatient(selectedPatient.id)}
                  className="px-4 py-2 text-xs font-bold text-warning-orange-foreground border border-warning-orange/20 rounded-xl hover:bg-warning-orange/10 transition"
                >
                  Delete Patient Profile
                </button>
              </div>

              {/* Tabs list */}
              <div className="flex border-b border-border gap-2 mt-4 overflow-x-auto pb-px">
                {[
                  { id: "profile", label: "Personal Info", icon: <User className="w-4 h-4" /> },
                  { id: "people", label: "Known People", icon: <Brain className="w-4 h-4" /> },
                  { id: "places", label: "Places", icon: <MapPin className="w-4 h-4" /> },
                  { id: "allergies", label: "Allergies", icon: <AlertTriangle className="w-4 h-4" /> },
                  { id: "meds", label: "Medication", icon: <Pill className="w-4 h-4" /> },
                  { id: "reminders", label: "Routine Timeline", icon: <Activity className="w-4 h-4" /> },
                  { id: "journals", label: "Memory Journal", icon: <FileText className="w-4 h-4" /> },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-4 py-2.5 font-bold text-sm border-b-2 flex items-center gap-2 transition cursor-pointer shrink-0 ${
                      activeTab === t.id 
                        ? "border-primary text-primary" 
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT PANELS */}
              <div className="mt-4 bg-card border border-border p-4 sm:p-6 rounded-3xl min-h-[300px]">
                
                {/* PROFILE TAB */}
                {activeTab === "profile" && (
                  <div className="flex flex-col gap-4 text-sm">
                    <h3 className="font-bold text-lg border-b pb-2 mb-2">Patient Profile Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block uppercase">Email Account</span>
                        <span className="font-semibold text-md">{selectedPatient.user.email}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block uppercase">Home Address</span>
                        <span className="font-semibold text-md">{selectedPatient.address || "None listed"}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block uppercase">Emergency Contacts</span>
                        <span className="font-semibold text-md">{selectedPatient.emergencyContact || "None listed"}</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-muted-foreground block uppercase">Blood Group</span>
                        <span className="font-semibold text-md">{selectedPatient.bloodGroup || "Not specified"}</span>
                      </div>

                      {/* Live Location Panel */}
                      <div className="col-span-2 mt-4 p-5 rounded-2xl bg-primary/5 border border-primary/20">
                        <span className="text-xs font-bold text-primary block uppercase mb-1.5 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                          🔴 Live Location (Always On)
                        </span>
                        {selectedPatient.latitude && selectedPatient.longitude ? (
                          <div className="flex flex-col gap-2">
                            <span className="font-extrabold text-md text-foreground">
                              Coordinates: {selectedPatient.latitude.toFixed(6)}, {selectedPatient.longitude.toFixed(6)}
                            </span>
                            {selectedPatient.locationUpdatedAt && (
                              <span className="text-xs text-muted-foreground">
                                Last updated: {new Date(selectedPatient.locationUpdatedAt).toLocaleString()}
                              </span>
                            )}
                            <a
                              href={`https://www.google.com/maps?q=${selectedPatient.latitude},${selectedPatient.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary px-4 py-2.5 rounded-xl hover:shadow-sm w-fit transition"
                            >
                              📍 View on Google Maps
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-semibold">
                            No location data received yet. The patient's device will update this automatically once they log in.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* PEOPLE TAB */}
                {activeTab === "people" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg">Known People List</h3>
                      <button onClick={() => setIsAddPeopleOpen(true)} className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Add Person
                      </button>
                    </div>

                    {people.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No family members or friends listed. Click Add Person to register one.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {people.map((p) => (
                          <div key={p.id} className="p-4 border border-border rounded-2xl flex gap-3 justify-between items-start">
                            <div className="flex gap-3">
                              <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden">
                                {p.photoUrl && <img src={p.photoUrl} className="w-full h-full object-cover" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm">{p.name} <span className="text-xs text-muted-foreground">({p.relationship})</span></h4>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{p.description}</p>
                                {p.positiveMemory && <p className="text-xs text-accent-foreground font-semibold mt-1">🌸 {p.positiveMemory}</p>}
                              </div>
                            </div>
                            <button onClick={() => handleDeleteSubresource("people", "personId", p.id)} className="p-2 text-warning-orange-foreground hover:bg-warning-orange/10 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PLACES TAB */}
                {activeTab === "places" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg">Visited Places</h3>
                      <button onClick={() => setIsAddPlaceOpen(true)} className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Add Place
                      </button>
                    </div>

                    {places.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No places listed. Click Add Place to register.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {places.map((pl) => (
                          <div key={pl.id} className="p-4 border border-border rounded-2xl flex gap-3 justify-between items-start">
                            <div className="flex gap-3">
                              <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden">
                                {pl.photoUrl && <img src={pl.photoUrl} className="w-full h-full object-cover" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm">{pl.name}</h4>
                                {pl.address && <p className="text-xs font-semibold text-muted-foreground mt-0.5">📍 {pl.address}</p>}
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{pl.description}</p>
                              </div>
                            </div>
                            <button onClick={() => handleDeleteSubresource("places", "placeId", pl.id)} className="p-2 text-warning-orange-foreground hover:bg-warning-orange/10 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ALLERGIES TAB */}
                {activeTab === "allergies" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg">Allergies & Medical Warnings</h3>
                      <button onClick={() => setIsAddAllergyOpen(true)} className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Add Allergy
                      </button>
                    </div>

                    {allergies.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No active allergies or reactions logged.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {allergies.map((a) => (
                          <div key={a.id} className={`p-4 rounded-2xl flex items-center justify-between border ${
                            a.severity === "HIGH" 
                              ? "bg-warning-orange/20 border-warning-orange/30 text-warning-orange-foreground" 
                              : "bg-muted border-border"
                          }`}>
                            <div className="flex items-center gap-3">
                              <AlertTriangle className="w-5 h-5 shrink-0" />
                              <div>
                                <h4 className="font-bold text-sm">{a.item} <span className="text-xs opacity-85">({a.type})</span></h4>
                                {a.reaction && <p className="text-xs mt-0.5 font-medium">{a.reaction}</p>}
                                <span className="text-[10px] font-bold uppercase tracking-wide border px-2 py-0.5 rounded-full mt-1.5 inline-block opacity-90">Severity: {a.severity}</span>
                              </div>
                            </div>
                            <button onClick={() => handleDeleteSubresource("allergies", "allergyId", a.id)} className="p-2 text-warning-orange-foreground hover:bg-warning-orange/10 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MEDICATION TAB */}
                {activeTab === "meds" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg">Active Medications</h3>
                      <button onClick={() => setIsAddMedOpen(true)} className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Add Medication
                      </button>
                    </div>

                    {meds.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No daily meds assigned.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {meds.map((m) => (
                          <div key={m.id} className="p-4 border border-border rounded-2xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-warning-orange/15 text-lg flex items-center justify-center">💊</div>
                              <div>
                                <h4 className="font-bold text-sm">{m.name} ({m.dosage})</h4>
                                <p className="text-xs text-muted-foreground font-medium">Frequency: {m.frequency} | {m.timeOfDay} ({m.reminderTime || "No time set"})</p>
                                {m.instructions && <p className="text-xs text-muted-foreground mt-0.5">{m.instructions}</p>}
                              </div>
                            </div>
                            <button onClick={() => handleDeleteSubresource("medications", "medicationId", m.id)} className="p-2 text-warning-orange-foreground hover:bg-warning-orange/10 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ROUTINES TAB */}
                {activeTab === "reminders" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg">Routines & Activities</h3>
                      <button onClick={() => setIsAddReminderOpen(true)} className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Add Routine
                      </button>
                    </div>

                    {reminders.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No routine schedules logged.</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {reminders.map((r) => (
                          <div key={r.id} className="p-4 border border-border rounded-2xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                              <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
                              <div>
                                <h4 className="font-bold text-sm">{r.title}</h4>
                                {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                                <p className="text-[10px] text-muted-foreground font-semibold mt-1">Time: {new Date(r.dateTime).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                r.completed ? "bg-accent/20 text-accent-foreground" : "bg-muted text-muted-foreground"
                              }`}>
                                {r.completed ? "Completed" : "Pending"}
                              </span>
                              <button onClick={() => handleDeleteSubresource("reminders", "reminderId", r.id)} className="p-2 text-warning-orange-foreground hover:bg-warning-orange/10 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* JOURNALS TAB */}
                {activeTab === "journals" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg">Memory Journal Logs</h3>
                      <button onClick={() => setIsAddJournalOpen(true)} className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:shadow-sm">
                        <Plus className="w-3.5 h-3.5" /> Add Entry
                      </button>
                    </div>

                    {journals.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-8">No journal memories logged yet.</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {journals.map((j) => (
                          <div key={j.id} className="p-5 border border-border rounded-2xl flex flex-col gap-3 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                              <div>
                                <h4 className="font-extrabold text-sm">{j.title}</h4>
                                <span className="text-[10px] text-muted-foreground font-semibold">{new Date(j.createdAt).toLocaleDateString()}</span>
                              </div>
                              <button onClick={() => handleDeleteSubresource("journals", "journalId", j.id)} className="p-2 text-warning-orange-foreground hover:bg-warning-orange/10 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">{j.content}</p>
                            {j.mediaUrl && (
                              <div className="mt-2 w-full max-w-sm rounded-xl overflow-hidden max-h-48 bg-muted">
                                <img src={j.mediaUrl} alt={j.title} className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- FORM OVERLAYS / MODALS --- */}
      
      {/* 1. Register Patient Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleRegisterPatient} className="w-full max-w-lg bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Register Patient & Account</h3>
            
            {feedbackMsg && <div className="p-3 bg-warning-orange/20 text-warning-orange-foreground rounded-xl text-xs">{feedbackMsg}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Robert Chen" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Email</label>
                <input required type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="robert@mail.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input required type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="••••••••" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Age</label>
                <input required type="number" value={regAge} onChange={(e) => setRegAge(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="78" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Home Address</label>
              <input type="text" value={regAddress} onChange={(e) => setRegAddress(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="123 Lavender Lane, Seattle" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" value={regBlood} onChange={(e) => setRegBlood(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="AB+" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Emergency Contact Details</label>
                <input type="text" value={regContact} onChange={(e) => setRegContact(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Sarah Chen (Daughter) - 555-0199" />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button type="button" onClick={() => setIsRegisterOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-muted">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95">
                {submitting ? "Saving..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Add Person Modal */}
      {isAddPeopleOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-lg">Add Known Person</h3>
            {feedbackMsg && <div className="p-2.5 bg-warning-orange/20 text-warning-orange-foreground rounded-lg text-xs">{feedbackMsg}</div>}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Name</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Sarah Chen" />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Relationship</label>
              <input type="text" value={formRelationship} onChange={(e) => setFormRelationship(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Daughter" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Memory Description</label>
              <textarea rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Sarah is your daughter. She visits every Sunday." />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Positive Reassuring Memory</label>
              <input type="text" value={formMemory} onChange={(e) => setFormMemory(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="She remembers when you taught her how to ride a bike." />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Photo (Optional)</label>
              <div className="flex gap-2 items-center">
                <label className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition border ${uploading ? "bg-muted text-muted-foreground border-border" : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"}`}>
                  {uploading ? "Uploading..." : "📁 Upload"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
                </label>
                <span className="text-xs text-muted-foreground">or</span>
                <input type="text" value={formPhoto} onChange={(e) => setFormPhoto(e.target.value)} className="flex-1 p-2.5 rounded-xl border border-border text-sm" placeholder="Paste URL https://..." />
              </div>
              {formPhoto && <img src={formPhoto} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-border mt-1" />}
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button onClick={() => setIsAddPeopleOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={() => handleAddSubresource("people", { name: formName, relationship: formRelationship, description: formDesc, photoUrl: formPhoto, positiveMemory: formMemory }, setIsAddPeopleOpen)} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Place Modal */}
      {isAddPlaceOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-lg">Add Visited Place</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Place Name</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Green Lake Park" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Address</label>
              <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="7201 E Green Lake Dr" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Memory Description</label>
              <textarea rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="You love walking around the lake in the morning." />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Photo (Optional)</label>
              <div className="flex gap-2 items-center">
                <label className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition border ${uploading ? "bg-muted text-muted-foreground border-border" : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"}`}>
                  {uploading ? "Uploading..." : "📁 Upload"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
                </label>
                <span className="text-xs text-muted-foreground">or</span>
                <input type="text" value={formPhoto} onChange={(e) => setFormPhoto(e.target.value)} className="flex-1 p-2.5 rounded-xl border border-border text-sm" placeholder="Paste URL https://..." />
              </div>
              {formPhoto && <img src={formPhoto} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-border mt-1" />}
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button onClick={() => setIsAddPlaceOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={() => handleAddSubresource("places", { name: formName, address: formAddress, description: formDesc, photoUrl: formPhoto }, setIsAddPlaceOpen)} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Allergy Modal */}
      {isAddAllergyOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-lg">Add Allergy Warning</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm">
                  <option>FOOD</option>
                  <option>MEDICINE</option>
                  <option>ENVIRONMENT</option>
                  <option>OTHER</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Severity</label>
                <select value={formSeverity} onChange={(e) => setFormSeverity(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm">
                  <option>LOW</option>
                  <option>MEDIUM</option>
                  <option>HIGH</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Allergy Item</label>
              <input type="text" value={formItem} onChange={(e) => setFormItem(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="e.g. Peanuts, Penicillin" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Reaction Description</label>
              <input type="text" value={formReaction} onChange={(e) => setFormReaction(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="e.g. Swelling, skin rash" />
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button onClick={() => setIsAddAllergyOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={() => handleAddSubresource("allergies", { type: formType, item: formItem, reaction: formReaction, severity: formSeverity }, setIsAddAllergyOpen)} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Medication Modal */}
      {isAddMedOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-lg">Schedule Medication</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Donepezil" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Dosage</label>
                <input type="text" value={formDosage} onChange={(e) => setFormDosage(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="10 mg" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" value={formFreq} onChange={(e) => setFormFreq(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Once daily" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Time of Day</label>
                <select value={formTime} onChange={(e) => setFormTime(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm">
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Night</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" value={formTimeHour} onChange={(e) => setFormTimeHour(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="08:00" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground">Image (Optional)</label>
                <div className="flex gap-2 items-center">
                  <label className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition border ${uploading ? "bg-muted text-muted-foreground border-border" : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"}`}>
                    {uploading ? "Uploading..." : "📁 Upload"}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
                  </label>
                  <input type="text" value={formPhoto} onChange={(e) => setFormPhoto(e.target.value)} className="flex-1 p-2.5 rounded-xl border border-border text-sm" placeholder="or paste URL" />
                </div>
                {formPhoto && <img src={formPhoto} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-border mt-1" />}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Instructions</label>
              <input type="text" value={formInstructions} onChange={(e) => setFormInstructions(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Take with breakfast." />
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button onClick={() => setIsAddMedOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={() => handleAddSubresource("medications", { name: formName, dosage: formDosage, frequency: formFreq, timeOfDay: formTime, reminderTime: formTimeHour, imageUrl: formPhoto, instructions: formInstructions }, setIsAddMedOpen)} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Add Reminder Modal */}
      {isAddReminderOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-lg">Add Routine Activity</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Activity Title</label>
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Eat breakfast" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Activity Description</label>
              <input type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Oatmeal with berries." />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Time Schedule (Date & Time)</label>
              <input type="datetime-local" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" />
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button onClick={() => setIsAddReminderOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={() => handleAddSubresource("reminders", { title: formTitle, description: formDesc, dateTime: formDate }, setIsAddReminderOpen)} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Add Journal Modal */}
      {isAddJournalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-lg">Log Memory Journal</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Memory Title</label>
              <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Robert's Cozy Birthday" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Memory Description / Details</label>
              <textarea rows={4} value={formContent} onChange={(e) => setFormContent(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="We gathered at Robert's home, ate pie, and played jazz..." />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Associated Photo</label>
              <div className="flex gap-2 items-center">
                <label className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition border ${uploading ? "bg-muted text-muted-foreground border-border" : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"}`}>
                  {uploading ? "Uploading..." : "📁 Upload"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
                </label>
                <span className="text-xs text-muted-foreground">or</span>
                <input type="text" value={formPhoto} onChange={(e) => setFormPhoto(e.target.value)} className="flex-1 p-2.5 rounded-xl border border-border text-sm" placeholder="Paste URL https://..." />
              </div>
              {formPhoto && <img src={formPhoto} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-border mt-1" />}
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button onClick={() => setIsAddJournalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button onClick={() => handleAddSubresource("journals", { title: formTitle, content: formContent, mediaUrl: formPhoto, mediaType: formMediaType }, setIsAddJournalOpen)} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
