"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/frontend/providers";
import { 
  User, 
  Brain, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  Calendar, 
  Pill, 
  FileText,
  Loader2,
  Heart,
  Plus,
  Trash2,
  CheckCircle,
  Clock
} from "lucide-react";

export default function CaregiverDashboard() {
  const { user, logout } = useAuth();
  
  // Caregiver and patient data
  const [caregiver, setCaregiver] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sub-resources of the patient
  const [people, setPeople] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);

  // Modals / forms
  const [isAddJournalOpen, setIsAddJournalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCaregiverData = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) return;
      const meData = await meRes.json();
      
      const cg = meData.user.profile;
      setCaregiver(cg);

      // Find the first assigned patient
      if (cg && cg.patients && cg.patients.length > 0) {
        const patientId = cg.patients[0].patientId;
        
        // Fetch patient details
        const patientRes = await fetch(`/api/patients/${patientId}`);
        const patientData = await patientRes.json();
        setPatient(patientData.patient);

        // Fetch subresources
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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregiverData();
  }, []);

  // Poll live location details every 10 seconds
  useEffect(() => {
    if (!patient?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/patients/${patient.id}`);
        if (res.ok) {
          const data = await res.json();
          setPatient(data.patient);
        }
      } catch (e) {
        console.error("Error polling location:", e);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [patient?.id]);

  const handleAddJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/patients/${patient.id}/journals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          content: formContent,
          mediaUrl: formPhoto,
          mediaType: "IMAGE",
        }),
      });

      if (res.ok) {
        setIsAddJournalOpen(false);
        setFormTitle("");
        setFormContent("");
        setFormPhoto("");
        // Refetch journals
        const jRes = await fetch(`/api/patients/${patient.id}/journals`);
        const jData = await jRes.json();
        setJournals(jData.journals || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center gap-4 bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-bold text-lg text-muted-foreground">Loading Caregiver Assistant Portal...</p>
      </div>
    );
  }

  const completedRoutinesCount = reminders.filter(r => r.completed).length;

  return (
    <div className="flex flex-col min-h-screen text-foreground pb-12">
      {/* Top Header */}
      <header className="px-8 py-5 border-b border-border bg-card flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Heart className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="font-bold text-md tracking-tight">RememberMe</span>
          <span className="text-[10px] uppercase font-bold text-accent-foreground px-2.5 py-1 rounded-full bg-accent/20">Caregiver</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <h4 className="font-bold text-sm">{caregiver?.name || "Caregiver Partner"}</h4>
            <p className="text-xs text-muted-foreground">{caregiver?.relationshipToPatient || "Family Representative"}</p>
          </div>
          <button onClick={logout} className="px-4 py-2 border border-border hover:bg-muted text-xs font-bold rounded-xl transition">
            Sign Out
          </button>
        </div>
      </header>

      {/* Portal Layout */}
      {!patient ? (
        <div className="max-w-xl mx-auto mt-20 p-8 rounded-3xl bg-card border border-border text-center flex flex-col items-center gap-4">
          <User className="w-12 h-12 text-muted-foreground" />
          <h3 className="text-xl font-bold">No Patients Assigned</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your caregiver profile is created successfully. Please ask your primary doctor to link your profile to the patient's account in their clinical dashboard.
          </p>
        </div>
      ) : (
        <main className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: PATIENT BIO CARD & QUICK METRICS */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <div className="p-6 bg-card border border-border rounded-3xl shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Patient Profile</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-lg">
                  {patient.name.substring(0, 2)}
                </div>
                <div>
                  <h4 className="font-extrabold text-lg">{patient.name}</h4>
                  <p className="text-xs text-muted-foreground">Age {patient.age} | Blood {patient.bloodGroup || "O+"}</p>
                </div>
              </div>
              
              <div className="border-t border-border/50 pt-4 flex flex-col gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block font-bold uppercase">Home Address</span>
                  <span className="font-semibold">{patient.address || "None listed"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-bold uppercase">Emergency Contact Info</span>
                  <span className="font-semibold">{patient.emergencyContact || "None listed"}</span>
                </div>

                {/* Live Geolocation Section */}
                <div className="mt-2 p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-1.5 shadow-inner">
                  <span className="font-bold text-[10px] uppercase text-primary block flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    🔴 Live Location (Always On)
                  </span>
                  {patient.latitude && patient.longitude ? (
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-xs text-foreground">
                        {patient.latitude.toFixed(6)}, {patient.longitude.toFixed(6)}
                      </span>
                      {patient.locationUpdatedAt && (
                        <span className="text-[10px] text-muted-foreground">
                          Updated: {new Date(patient.locationUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <a
                        href={`https://www.google.com/maps?q=${patient.latitude},${patient.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block text-[10px] font-bold text-center text-white bg-primary py-2 rounded-xl hover:shadow-sm transition"
                      >
                        View on Google Maps
                      </a>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Waiting for patient device location update...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cognitive Progress Overview */}
            <div className="p-6 bg-card border border-border rounded-3xl shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Routine Progress Tracker</h3>
              
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Routines Done</span>
                </div>
                <span className="text-sm font-bold bg-secondary/50 px-2.5 py-0.5 rounded-full text-secondary-foreground">
                  {completedRoutinesCount} / {reminders.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-warning-orange-foreground" />
                  <span className="text-sm font-semibold">Active Medications</span>
                </div>
                <span className="text-sm font-bold bg-warning-orange/15 px-2.5 py-0.5 rounded-full text-warning-orange-foreground">
                  {meds.length} scheduled
                </span>
              </div>
            </div>
          </div>

          {/* MIDDLE & RIGHT: PATIENT LOG DETAILS & JOURNAL */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Medication & Allergies */}
            <div className="p-6 bg-card border border-border rounded-3xl shadow-sm flex flex-col gap-4">
              <h3 className="font-bold text-md tracking-tight">Active Medications & Alerts</h3>
              
              {allergies.length > 0 && (
                <div className="flex flex-col gap-2">
                  {allergies.map((a) => (
                    <div key={a.id} className="p-3 bg-warning-orange/15 border border-warning-orange/20 rounded-xl text-xs text-warning-orange-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span><strong>Warning: {a.item}</strong> ({a.type} allergy) causes {a.reaction || "allergic response"}.</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3">
                {meds.map((m) => (
                  <div key={m.id} className="p-3.5 border border-border rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold">{m.name} ({m.dosage})</h4>
                      <p className="text-muted-foreground mt-0.5">Instructions: {m.instructions || "Take with meals"}</p>
                    </div>
                    <span className="font-bold text-[10px] uppercase tracking-wider bg-secondary px-2.5 py-1 rounded-full text-secondary-foreground">{m.timeOfDay}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory Journal / Story Logs */}
            <div className="p-6 bg-card border border-border rounded-3xl shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-md tracking-tight flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Memory Journal Stories</h3>
                <button onClick={() => setIsAddJournalOpen(true)} className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Add Story
                </button>
              </div>

              {journals.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No journal memories logged. Click Add Story to start building their history book.</p>
              ) : (
                <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
                  {journals.map((j) => (
                    <div key={j.id} className="p-4 border border-border rounded-2xl flex flex-col gap-2">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-bold text-sm text-primary">{j.title}</h4>
                        <span className="text-[10px] text-muted-foreground">{new Date(j.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">{j.content}</p>
                      {j.mediaUrl && (
                        <div className="w-48 rounded-xl overflow-hidden max-h-32 bg-muted border mt-1">
                          <img src={j.mediaUrl} alt={j.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </main>
      )}

      {/* --- ADD STORY FORM OVERLAY --- */}
      {isAddJournalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddJournal} className="w-full max-w-md bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-lg">Add Family Story Log</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Story Title</label>
              <input required type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Robert at Green Lake" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Story Details / Memories</label>
              <textarea required rows={4} value={formContent} onChange={(e) => setFormContent(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="Write a happy story to share..." />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-muted-foreground">Photo URL (Optional)</label>
              <input type="text" value={formPhoto} onChange={(e) => setFormPhoto(e.target.value)} className="p-2.5 rounded-xl border border-border text-sm" placeholder="https://..." />
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button type="button" onClick={() => setIsAddJournalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">
                {submitting ? "Saving..." : "Save Story"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
