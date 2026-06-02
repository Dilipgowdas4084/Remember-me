"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, User, Mail, Key, Shield, ArrowLeft, Loader2 } from "lucide-react";

interface DoctorItem {
  id: string;
  name: string;
  specialization?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"DOCTOR" | "PATIENT" | "CAREGIVER" | "SUPERVISOR">("DOCTOR");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [supervisorCode, setSupervisorCode] = useState("");
  
  // Doctor fields
  const [specialization, setSpecialization] = useState("");
  
  // Caregiver fields
  const [relationshipToPatient, setRelationshipToPatient] = useState("");
  const [phone, setPhone] = useState("");

  // Patient fields
  const [age, setAge] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [doctorId, setDoctorId] = useState("");

  // Doctors list (for Patient registration selection)
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      setDoctorsLoading(true);
      try {
        const res = await fetch("/api/doctors");
        if (res.ok) {
          const data = await res.json();
          setDoctors(data.doctors || []);
          if (data.doctors && data.doctors.length > 0) {
            setDoctorId(data.doctors[0].id);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setDoctorsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: any = {
      email,
      password,
      role,
      name,
      phone,
    };

    if (role === "DOCTOR") {
      payload.specialization = specialization;
    } else if (role === "CAREGIVER") {
      payload.relationshipToPatient = relationshipToPatient;
    } else if (role === "PATIENT") {
      payload.age = parseInt(age);
      payload.bloodGroup = bloodGroup;
      payload.address = address;
      payload.emergencyContact = emergencyContact;
      payload.doctorId = doctorId;
    } else if (role === "SUPERVISOR") {
      payload.supervisorCode = supervisorCode;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        // Registration logs them in automatically (sets token cookie)
        // Refresh and redirect
        window.location.href = role === "DOCTOR" ? "/doctor" : role === "CAREGIVER" ? "/caregiver" : role === "SUPERVISOR" ? "/supervisor" : "/patient";
      } else {
        setError(data.error || "Failed to register account.");
        setLoading(false);
      }
    } catch (err) {
      setError("A connection error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-secondary/20 to-background justify-center items-center px-6 py-12">
      <Link 
        href="/" 
        className="absolute top-8 left-8 flex items-center gap-2 text-sm font-semibold hover:text-primary transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="w-full max-w-lg glass-card rounded-3xl p-8 shadow-xl border border-white/60 my-6">
        <div className="text-center flex flex-col items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md">
            <Heart className="w-5.5 h-5.5 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Create an Account</h2>
          <p className="text-xs text-muted-foreground">Select your role and fill in the required medical/personal details</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-4 gap-2 bg-muted p-1.5 rounded-xl mb-6">
          {(["DOCTOR", "CAREGIVER", "PATIENT", "SUPERVISOR"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`py-2 rounded-lg text-xs font-bold transition ${
                role === r
                  ? r === "SUPERVISOR"
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "SUPERVISOR" ? "🔒 Supervisor" : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-warning-orange/20 text-warning-orange-foreground border border-warning-orange/30 text-sm flex items-start gap-2">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. John Doe"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. email@domain.com"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. 555-0199"
              />
            </div>
          </div>

          {/* DOCTOR SPECIFIC FIELDS */}
          {role === "DOCTOR" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Medical Specialization</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. Neurology, Geriatrics"
              />
            </div>
          )}

          {/* CAREGIVER SPECIFIC FIELDS */}
          {role === "CAREGIVER" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Relationship to Patient</label>
              <input
                type="text"
                value={relationshipToPatient}
                onChange={(e) => setRelationshipToPatient(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. Daughter, Spouse, Professional Caregiver"
              />
            </div>
          )}

          {/* PATIENT SPECIFIC FIELDS */}
          {role === "PATIENT" && (
            <div className="flex flex-col gap-4 border-t border-border/50 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Age</label>
                  <input
                    required
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    placeholder="e.g. 78"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Blood Group</label>
                  <input
                    type="text"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    placeholder="e.g. O+, AB-"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Home Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. 123 Lavender Lane, Seattle"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Emergency Contact (Details)</label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                  placeholder="e.g. Sarah Chen (Daughter) - 555-0199"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Doctor Assignment</label>
                {doctorsLoading ? (
                  <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading doctors...
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="text-xs text-warning-orange-foreground bg-warning-orange/20 p-3 rounded-xl">
                    No doctors are currently registered. Please ask your Doctor to register on the platform first.
                  </div>
                ) : (
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary"
                  >
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.specialization ? `(${d.specialization})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {/* SUPERVISOR SPECIFIC FIELDS */}
          {role === "SUPERVISOR" && (
            <div className="flex flex-col gap-3 border border-violet-500/30 bg-violet-500/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-violet-600 font-bold text-sm">
                <Shield className="w-4 h-4" /> Supervisor Access
              </div>
              <p className="text-xs text-muted-foreground">
                Supervisor accounts have silent, read-only access to all doctors and patients. An access code is required.
              </p>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Supervisor Access Code</label>
                <input
                  required
                  type="password"
                  value={supervisorCode}
                  onChange={(e) => setSupervisorCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-violet-500/40 bg-background text-sm focus:outline-none focus:border-violet-500"
                  placeholder="Enter your access code"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (role === "PATIENT" && doctors.length === 0)}
            className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/95 transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Registering...
              </>
            ) : (
              "Register Account"
            )}
          </button>
        </form>

        <div className="text-center mt-5 text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-bold hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
