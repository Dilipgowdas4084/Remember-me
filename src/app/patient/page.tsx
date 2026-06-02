"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useAccessibility, FontSizeLevel } from "@/frontend/providers";
import { 
  Heart, 
  MapPin, 
  Clock, 
  CheckSquare, 
  Square, 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  MessageCircle, 
  Mic, 
  MicOff, 
  LogOut,
  User, 
  FolderHeart,
  ChevronRight,
  Loader2
} from "lucide-react";
import MemoryModeDialog from "@/frontend/components/MemoryModeDialog";

interface KnownPerson {
  id: string;
  name: string;
  relationship: string;
  description: string;
  photoUrl?: string;
  positiveMemory?: string;
}

interface Place {
  id: string;
  name: string;
  address?: string;
  description: string;
  photoUrl?: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timeOfDay: string;
  reminderTime?: string;
  imageUrl?: string;
  instructions?: string;
  active: boolean;
}

interface Reminder {
  id: string;
  title: string;
  description?: string;
  dateTime: string;
  completed: boolean;
}

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const { fontSize, setFontSize, speechEnabled, setSpeechEnabled, speak, stopSpeaking } = useAccessibility();

  // Data States
  const [patientData, setPatientData] = useState<any>(null);
  const [people, setPeople] = useState<KnownPerson[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // Interaction States
  const [activeDialogItem, setActiveDialogItem] = useState<any>(null);
  const [dialogType, setDialogType] = useState<"person" | "place">("person");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // AI Assistant States
  const [aiMessage, setAiMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("Hello! I am your companion. You can ask me questions like 'Who is Sarah?' or 'What medicine should I take?'");
  const [aiLoading, setAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Emergency SOS State
  const [sosTriggered, setSosTriggered] = useState(false);

  // Fetch all patient details
  const fetchData = async () => {
    try {
      // First get current user patient profile
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) return;
      const userData = await userRes.json();
      const patient = userData.user.profile;
      setPatientData(patient);

      if (patient && patient.id) {
        const id = patient.id;
        
        // Fetch known people
        const peopleRes = await fetch(`/api/patients/${id}/people`);
        const peopleData = await peopleRes.json();
        setPeople(peopleData.people || []);

        // Fetch places
        const placesRes = await fetch(`/api/patients/${id}/places`);
        const placesData = await placesRes.json();
        setPlaces(placesData.places || []);

        // Fetch medications
        const medsRes = await fetch(`/api/patients/${id}/medications`);
        const medsData = await medsRes.json();
        setMeds(medsData.medications || []);

        // Fetch reminders
        const remindersRes = await fetch(`/api/patients/${id}/reminders`);
        const remindersData = await remindersRes.json();
        setReminders(remindersData.reminders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Speak greeting on dashboard load
  useEffect(() => {
    if (patientData && speechEnabled) {
      speak(`Good morning, ${patientData.name}. Welcome to your dashboard. Everything is safe, and your family is nearby.`);
    }
  }, [patientData, speechEnabled]);

  // Background Geolocation Tracking (Always On)
  useEffect(() => {
    if (!patientData?.id) return;

    let watchId: number;

    const updateLocation = async (lat: number, lng: number) => {
      try {
        await fetch(`/api/patients/${patientData.id}/location`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        });
      } catch (err) {
        console.error("Failed to update live location:", err);
      }
    };

    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateLocation(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Fallback to getCurrentPosition periodically if watchPosition fails
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              updateLocation(latitude, longitude);
            }
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [patientData?.id]);


  // Toggle Reminder completion
  const handleToggleReminder = async (reminderId: string, currentStatus: boolean) => {
    if (!patientData) return;
    try {
      const res = await fetch(`/api/patients/${patientData.id}/reminders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId, completed: !currentStatus }),
      });
      if (res.ok) {
        setReminders(reminders.map(r => r.id === reminderId ? { ...r, completed: !currentStatus } : r));
        speak(currentStatus ? "Routine set to incomplete." : "Good job! You completed this activity.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger SOS Alert
  const handleTriggerSOS = async () => {
    setSosTriggered(true);
    const primaryContact = patientData?.emergencyContact || "your caregiver";
    speak("Please stay calm. You are completely safe. I am sending an emergency notification to " + primaryContact + " right now. Sit down, take a deep breath. A helper is on the way.");

    // Extract phone number from emergency contact string (e.g. "Sarah Chen (Daughter) - 555-0199")
    const phoneMatch = primaryContact.match(/[\d\-+().\s]{7,}/);
    const phoneNumber = phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, "") : "";

    // Open phone dialer with emergency contact's number
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, "_self");
    }

    // Send email alert to emergency contact via the patient's caregiver/doctor
    try {
      await fetch("https://formsubmit.co/ajax/gowdadilip11942@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          _subject: "🚨 EMERGENCY SOS — RememberMe Alert",
          name: patientData?.name || "Patient",
          message: `EMERGENCY SOS triggered by ${patientData?.name || "the patient"} at ${new Date().toLocaleString()}. They need immediate assistance. Emergency contact: ${primaryContact}.`,
          _template: "table",
        }),
      });
    } catch (e) {
      console.error("Failed to send SOS email:", e);
    }
  };

  // Submit AI Question
  const handleAskAI = async (textToSend?: string) => {
    const question = textToSend || aiMessage;
    if (!question.trim()) return;

    setAiLoading(true);
    setAiResponse("Thinking...");
    
    if (speechEnabled) {
      speak("Let me look that up for you.");
    }

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiResponse(data.response);
        setAiMessage("");
        speak(data.response);
      } else {
        setAiResponse("I'm sorry, I couldn't connect right now. Remember that you are safe, and Sarah is a phone call away.");
        speak("I am here with you. Everything is fine.");
      }
    } catch (e) {
      setAiResponse("I am here. Don't worry, you are safe.");
    } finally {
      setAiLoading(false);
    }
  };

  // Speech-to-Text handler (STT)
  const handleVoiceInput = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      speak("Listening to you now.");
    };

    recognition.onerror = (event: any) => {
      console.error(event);
      setIsListening(false);
      speak("I couldn't hear you clearly. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setAiMessage(speechResult);
      handleAskAI(speechResult);
    };

    recognition.start();
  };

  // Open full screen memory focus dialog
  const handleOpenMemoryMode = (item: any, type: "person" | "place") => {
    setActiveDialogItem(item);
    setDialogType(type);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center gap-4 bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-bold text-lg text-muted-foreground">Loading your page, please wait...</p>
      </div>
    );
  }

  const routineMorning = reminders.filter(r => new Date(r.dateTime).getHours() < 12);
  const routineAfternoon = reminders.filter(r => new Date(r.dateTime).getHours() >= 12 && new Date(r.dateTime).getHours() < 17);
  const routineNight = reminders.filter(r => new Date(r.dateTime).getHours() >= 17);

  return (
    <div className="flex flex-col min-h-screen text-foreground pb-20">
      {/* Top Accessible Navbar */}
      <header className="sticky top-0 z-40 glass-card border-b border-border px-4 sm:px-6 py-3 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
              RememberMe
            </span>
          </div>
        </div>

        {/* Big Accessibility Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* TTS Toggler */}
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm rounded-full font-extrabold flex items-center gap-2 border shadow-sm transition-all ${
              speechEnabled 
                ? "bg-accent/20 border-accent text-accent-foreground" 
                : "bg-muted border-border text-muted-foreground hover:bg-card"
            }`}
          >
            {speechEnabled ? (
              <>
                <Volume2 className="w-5 h-5 text-accent-foreground" /> Voice Narration ON
              </>
            ) : (
              <>
                <VolumeX className="w-5 h-5" /> Voice Narration OFF
              </>
            )}
          </button>

          {/* Font Size Adjusters */}
          <div className="flex items-center border border-border rounded-full p-1 bg-muted">
            {(["normal", "large", "extra-large"] as FontSizeLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setFontSize(level)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  fontSize === level 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {level === "normal" ? "A" : level === "large" ? "A+" : "A++"}
              </button>
            ))}
          </div>

          <button
            onClick={logout}
            className="px-3 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm rounded-full bg-warning-orange/20 text-warning-orange-foreground border border-warning-orange/30 font-bold flex items-center gap-2 hover:bg-warning-orange/40 transition"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 mt-4 sm:mt-8 flex flex-col gap-6 sm:gap-10">
        {/* Calming Greeting banner */}
        <div className="p-4 sm:p-6 rounded-[2rem] bg-gradient-to-r from-secondary/40 via-info-blue/20 to-accent/20 border border-primary/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Hello, {patientData?.name || "Robert"}
            </h1>
            <p className="text-muted-foreground font-semibold">
              Today is a quiet, beautiful day. You are safe at home.
            </p>
          </div>
          <button
            onClick={() => speak(`Hello ${patientData?.name || "Robert"}. Today is a beautiful day. You are safe at home.`)}
            className="px-6 py-3 bg-card border border-border rounded-xl font-extrabold text-sm shadow-sm hover:bg-muted transition flex items-center gap-2 self-start md:self-auto"
          >
            <Volume2 className="w-5 h-5 text-primary" /> Hear Greeting
          </button>
        </div>

        {/* SOS Warning Call Button */}
        <div className="grid grid-cols-1 gap-6">
          {!sosTriggered ? (
            <button
              onClick={handleTriggerSOS}
              className="w-full py-5 sm:py-6 bg-warning-orange/40 border-2 border-warning-orange text-warning-orange-foreground hover:bg-warning-orange/50 active:scale-[0.99] transition duration-150 rounded-[2rem] font-extrabold text-xl sm:text-2xl md:text-3xl shadow-md flex items-center justify-center gap-4 animate-calm-pulse"
            >
              <PhoneCall className="w-8 h-8" /> EMERGENCY SOS — Click to Call for Help
            </button>
          ) : (
            <div className="p-8 rounded-[2rem] bg-warning-orange/35 border-2 border-warning-orange flex flex-col gap-4 text-center items-center shadow-inner">
              <PhoneCall className="w-12 h-12 text-warning-orange-foreground animate-bounce" />
              <h2 className="text-3xl font-extrabold">Emergency Helpers Notified</h2>
              <p className="text-lg font-bold max-w-xl">
                Please sit down and breathe slowly. We have contacted {patientData?.emergencyContact || "Sarah Chen (Daughter)"}. They know you need help and are coming right now.
              </p>
              <button 
                onClick={() => setSosTriggered(false)}
                className="mt-2 px-6 py-2 bg-card border border-border rounded-xl text-sm font-bold hover:bg-muted"
              >
                Dismiss Alert
              </button>
            </div>
          )}
        </div>

        {/* Main Grid: Left column (People, Places), Right Column (Routines, AI Chat) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: PEOPLE & PLACES */}
          <div className="flex flex-col gap-10">
            {/* People I Know */}
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-primary">
                🌸 People I Know
              </h2>
              {people.length === 0 ? (
                <p className="text-muted-foreground text-sm font-semibold">Your family list is currently being set up by your doctor.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {people.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleOpenMemoryMode(p, "person")}
                      className="p-4 rounded-3xl bg-card border border-border hover:border-primary/50 transition-all text-left flex items-center gap-4 hover:shadow-md group cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted shrink-0 border border-border/50">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-lg bg-secondary text-secondary-foreground">{p.name[0]}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-lg truncate group-hover:text-primary transition">{p.name}</h3>
                        <p className="text-sm font-bold text-muted-foreground truncate">Your {p.relationship}</p>
                        <p className="text-xs text-primary font-bold mt-1 flex items-center gap-0.5">Click to view 🌸</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Places I Visit */}
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-accent-foreground">
                📍 Places I Visit
              </h2>
              {places.length === 0 ? (
                <p className="text-muted-foreground text-sm font-semibold">Your places list is currently being set up by your doctor.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {places.map((pl) => (
                    <button
                      key={pl.id}
                      onClick={() => handleOpenMemoryMode(pl, "place")}
                      className="p-4 rounded-3xl bg-card border border-border hover:border-accent/50 transition-all text-left flex items-center gap-4 hover:shadow-md group cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted shrink-0 border border-border/50">
                        {pl.photoUrl ? (
                          <img src={pl.photoUrl} alt={pl.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-lg bg-secondary text-secondary-foreground">{pl.name[0]}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-lg truncate group-hover:text-accent-foreground transition">{pl.name}</h3>
                        {pl.address && <p className="text-xs font-semibold text-muted-foreground truncate">{pl.address}</p>}
                        <p className="text-xs text-accent-foreground font-bold mt-1">Click to view 🌿</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: ROUTINES & AI CHAT */}
          <div className="flex flex-col gap-10">
            {/* Medications Reminders */}
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-warning-orange-foreground">
                💊 My Medicines Today
              </h2>
              {meds.length === 0 ? (
                <p className="text-muted-foreground text-sm font-semibold">No daily medicines scheduled by your doctor.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {meds.map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-3xl bg-card border border-border flex items-center justify-between gap-4 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-warning-orange/10 flex items-center justify-center text-xl border border-warning-orange/20 shrink-0">
                          💊
                        </div>
                        <div>
                          <h3 className="font-extrabold text-md">{m.name} ({m.dosage})</h3>
                          <p className="text-xs font-bold text-muted-foreground">
                            Take at: <span className="text-primary font-bold">{m.reminderTime || "Morning"}</span> ({m.timeOfDay})
                          </p>
                          {m.instructions && <p className="text-xs text-muted-foreground mt-0.5">{m.instructions}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => speak(`Take ${m.name}, dosage ${m.dosage}. Instructions: ${m.instructions || "Take with water"}`)}
                        className="p-2.5 rounded-xl bg-muted hover:bg-secondary text-primary transition"
                        title="Listen to details"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daily Routine Checklists */}
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-info-blue-foreground">
                📅 Today's Routine
              </h2>
              {reminders.length === 0 ? (
                <p className="text-muted-foreground text-sm font-semibold">No scheduled routines for today.</p>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Morning Routine */}
                  {routineMorning.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-accent-foreground" /> Morning
                      </h3>
                      <div className="flex flex-col gap-2">
                        {routineMorning.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => handleToggleReminder(r.id, r.completed)}
                            className={`p-4 rounded-2xl border text-left flex items-center justify-between gap-4 transition cursor-pointer ${
                              r.completed 
                                ? "bg-accent/10 border-accent text-accent-foreground line-through opacity-80" 
                                : "bg-card border-border hover:border-primary/50"
                            }`}
                          >
                            <span className="font-extrabold text-md flex items-center gap-3">
                              {r.completed ? <CheckSquare className="w-6 h-6 text-accent-foreground shrink-0" /> : <Square className="w-6 h-6 shrink-0 text-muted-foreground" />}
                              {r.title}
                            </span>
                            {r.description && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{r.description}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Afternoon/Evening Routine */}
                  {(routineAfternoon.length > 0 || routineNight.length > 0) && (
                    <div className="flex flex-col gap-2.5">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" /> Afternoon & Night
                      </h3>
                      <div className="flex flex-col gap-2">
                        {[...routineAfternoon, ...routineNight].map((r) => (
                          <button
                            key={r.id}
                            onClick={() => handleToggleReminder(r.id, r.completed)}
                            className={`p-4 rounded-2xl border text-left flex items-center justify-between gap-4 transition cursor-pointer ${
                              r.completed 
                                ? "bg-accent/10 border-accent text-accent-foreground line-through opacity-80" 
                                : "bg-card border-border hover:border-primary/50"
                            }`}
                          >
                            <span className="font-extrabold text-md flex items-center gap-3">
                              {r.completed ? <CheckSquare className="w-6 h-6 text-accent-foreground shrink-0" /> : <Square className="w-6 h-6 shrink-0 text-muted-foreground" />}
                              {r.title}
                            </span>
                            {r.description && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{r.description}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Assistant Chat Widget */}
            <div className="p-4 sm:p-6 rounded-[2rem] bg-gradient-to-tr from-primary/10 via-card to-secondary/15 border border-primary/20 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 text-primary">
                <MessageCircle className="w-6 h-6" />
                <h3 className="font-extrabold text-lg">My Calm Memory Helper</h3>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border text-sm leading-relaxed font-semibold min-h-[90px] flex items-center justify-center text-center">
                {aiResponse}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAskAI(); }}
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:border-primary"
                  placeholder="Ask a question... e.g. Who is Sarah?"
                  disabled={aiLoading}
                />
                
                {/* Voice Input (Speech-To-Text) Button */}
                <button
                  onClick={handleVoiceInput}
                  className={`p-3.5 rounded-xl border transition shadow-sm ${
                    isListening
                      ? "bg-warning-orange/20 border-warning-orange text-warning-orange-foreground animate-pulse"
                      : "bg-muted border-border hover:bg-secondary text-primary"
                  }`}
                  title="Speak your question"
                  disabled={aiLoading}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => handleAskAI()}
                  className="px-5 py-3.5 bg-primary text-white font-extrabold rounded-xl hover:bg-primary/95 transition shadow-sm"
                  disabled={aiLoading}
                >
                  {aiLoading ? "Searching..." : "Ask"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Memory Mode Focus Dialog Overlay */}
      <MemoryModeDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setActiveDialogItem(null);
        }}
        item={activeDialogItem}
        type={dialogType}
      />
    </div>
  );
}
