"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, useAccessibility } from "@/frontend/providers";
import {
  Heart, Shield, Brain, User, Settings, Activity,
  MessageCircle, PhoneCall, ChevronDown,
  Volume2, MapPin, Menu, X, ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const { user } = useAuth();
  const { speak } = useAccessibility();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const features = [
    { icon: <MapPin className="w-6 h-6 text-primary" />, title: "Real-Time Live Location", description: "Always-on GPS tracking gives doctors and caregivers instant visibility. If a patient wanders, their live coordinates update automatically — viewable on Google Maps with one click." },
    { icon: <Brain className="w-6 h-6 text-primary" />, title: "Memory Profiles", description: "Secure cards featuring family photos, descriptions, and narration to trigger comforting recognition of people and places." },
    { icon: <Activity className="w-6 h-6 text-accent-foreground" />, title: "Routine Timelines", description: "Visual, animated checklists for morning, afternoon, and night routines to simplify daily schedules." },
    { icon: <MessageCircle className="w-6 h-6 text-info-blue-foreground" />, title: "AI Memory Assistant", description: "A patient companion trained to speak in calm, short sentences, answering questions like 'Who is Sarah?' using actual profile data." },
    { icon: <Shield className="w-6 h-6 text-primary" />, title: "Role-Based Security", description: "Doctors edit profiles and set medication schedules. Caregivers assist, and patients experience a zero-stress, read-only UI." },
    { icon: <Volume2 className="w-6 h-6 text-accent-foreground" />, title: "TTS Accessibility", description: "Read aloud details, messages, and schedules at a soothing pace with one-click narration to reduce cognitive overload." },
    { icon: <PhoneCall className="w-6 h-6 text-warning-orange-foreground" />, title: "One-Click Emergency SOS", description: "Large, high-contrast buttons allowing patients to instantly trigger emergency notifications to their primary caregivers." },
  ];

  const faqs = [
    { question: "How does the platform help Alzheimer's patients?", answer: "RememberMe is designed from the ground up for low cognitive load. It features extremely large buttons, clean typography, soft soothing colors, and text-to-speech voice narration. This reduces anxiety and helps patients independently review who their family members are, what medications to take, and daily routine steps." },
    { question: "Can patients accidentally edit or delete their medical data?", answer: "No. The system uses strict role-based access controls. Only the assigned primary doctor (and caregivers with explicit permission) can modify patient memory files, medication guidelines, or details. The patient dashboard is strictly read-only and interaction-focused." },
    { question: "Does the AI assistant share patient data?", answer: "Patient privacy is our priority. The AI assistant constructs its knowledge base strictly from the private PostgreSQL database entries created by the doctor. No data is stored or shared externally outside of secure contextual API calls." },
    { question: "How does the 'Memory Mode' work?", answer: "Memory Mode is a full-screen focus feature. When a patient clicks on a person or place, the app dims the background, plays a gentle animation, and speaks the name, relationship, and a positive reassuring memory aloud using a calming voice narration." },
  ];

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#story", label: "Our Mission" },
    { href: "#faq", label: "FAQ" },
    { href: "#contact", label: "Contact" },
  ];

  const dashboardHref = user
    ? (user.role === "DOCTOR" ? "/doctor" : user.role === "CAREGIVER" ? "/caregiver" : user.role === "SUPERVISOR" ? "/supervisor" : "/patient")
    : null;

  return (
    <div className="flex flex-col min-h-screen text-foreground transition-colors duration-300">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 glass-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-info-blue flex items-center justify-center shadow-md animate-calm-pulse">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-secondary-foreground bg-clip-text text-transparent">
              RememberMe
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="hover:text-primary transition">{l.label}</a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">

            {/* Desktop auth buttons */}
            {mounted && (
              <div className="hidden sm:flex items-center gap-2">
                {dashboardHref ? (
                  <Link href={dashboardHref} className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:shadow-lg transition">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/auth/login" className="px-3 py-2 rounded-full hover:bg-muted text-sm font-medium transition">Sign In</Link>
                    <Link href="/auth/register" className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:shadow-lg transition">Join Now</Link>
                  </>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileNav(!mobileNav)} className="md:hidden p-2 rounded-xl hover:bg-muted transition" aria-label="Menu">
              {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileNav && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden md:hidden border-t border-border bg-background/95 backdrop-blur"
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                {navLinks.map(l => (
                  <a key={l.href} href={l.href} onClick={() => setMobileNav(false)}
                    className="py-3 px-4 rounded-xl font-semibold text-sm hover:bg-muted transition">
                    {l.label}
                  </a>
                ))}
                <div className="border-t border-border mt-2 pt-3 flex flex-col gap-2">
                  {mounted && (dashboardHref ? (
                    <Link href={dashboardHref} onClick={() => setMobileNav(false)}
                      className="w-full py-3 rounded-2xl bg-primary text-white text-sm font-bold text-center">
                      Go to Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link href="/auth/login" onClick={() => setMobileNav(false)}
                        className="w-full py-3 rounded-2xl border border-border text-sm font-semibold text-center hover:bg-muted transition">
                        Sign In
                      </Link>
                      <Link href="/auth/register" onClick={() => setMobileNav(false)}
                        className="w-full py-3 rounded-2xl bg-primary text-white text-sm font-bold text-center">
                        Create Account
                      </Link>
                    </>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-14 sm:py-20 md:py-28 px-4 sm:px-6 bg-gradient-to-b from-secondary/30 to-transparent">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
          {/* Text */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="flex flex-col gap-5 text-center md:text-left items-center md:items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold border border-primary/20">
              <Heart className="w-3 h-3" /> Compassionate Memory Care
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              A peaceful space to <span className="text-primary">remember</span>, connect, and thrive.
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg">
              Designed with love and medical rigor, RememberMe helps individuals with Alzheimer's retain their memories of family, places, and routines in a comforting, voice-assisted interface.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link href="/auth/register"
                className="px-6 py-3.5 rounded-full bg-primary text-white font-semibold hover:shadow-xl transition hover:-translate-y-0.5 text-center flex items-center justify-center gap-2">
                Create Account <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => speak("Welcome to RememberMe. We are here to help you remember the moments and the people you love. Everything is safe.")}
                className="px-5 py-3.5 rounded-full border border-border bg-card font-medium hover:bg-muted transition flex items-center justify-center gap-2 text-sm">
                <Volume2 className="w-4 h-4" /> Listen to Welcome
              </button>
            </div>
          </motion.div>

          {/* Card preview */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative w-full max-w-sm mx-auto md:max-w-none">
            <div className="w-full rounded-3xl p-5 sm:p-6 shadow-2xl glass-card relative border border-white/60 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-info-blue to-accent" />
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-lg shrink-0">RC</div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Robert's Memory Card</h3>
                  <p className="text-xs text-muted-foreground">Updated by Dr. Emily Carter</p>
                </div>
              </div>
              <div className="bg-card/80 border border-border/50 rounded-2xl p-4 mb-4">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Daughter</div>
                <div className="font-bold text-base mb-1">Sarah Chen</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "Sarah is your daughter. She visits every Sunday afternoon. She loves baking apple pies with you."
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 px-3 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm hover:bg-primary hover:text-white transition">🔊 Read Aloud</button>
                <button className="py-2.5 px-3 rounded-xl bg-accent/20 text-accent-foreground font-bold text-sm hover:bg-accent/40 transition whitespace-nowrap">Memory 🌸</button>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-calm-pulse pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-accent/15 rounded-full blur-2xl animate-calm-pulse pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 flex flex-col gap-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">Everything needed for compassionate care</h2>
          <p className="text-muted-foreground text-sm sm:text-base">RememberMe provides doctors with medical configuration, caregivers with assisting dashboards, and patients with a stress-free environment.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {features.map((f, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
              className="p-5 sm:p-7 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition duration-300 flex flex-col gap-3"
            >
              <div className="w-11 h-11 rounded-2xl bg-secondary/50 flex items-center justify-center">{f.icon}</div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── MISSION ── */}
      <section id="story" className="py-14 sm:py-20 px-4 sm:px-6 bg-muted/30 border-y border-border">
        <div className="max-w-4xl mx-auto flex flex-col gap-6 text-center items-center">
          <Heart className="w-9 h-9 text-primary animate-calm-pulse" />
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight max-w-xl">
            "We built this because memories are the threads that bind us to who we love."
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl">
            Alzheimer's presents challenges that require dignity, calm, and clarity. RememberMe was designed alongside neurologists and occupational therapists to eliminate clinical clutter, replace red alarm systems with pastel comfort, and support cognitive anchoring through simple, repetitive confirmation.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white">Dr</span>
              <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-[10px] font-bold ring-2 ring-white">Cg</span>
              <span className="w-8 h-8 rounded-full bg-info-blue flex items-center justify-center text-info-blue-foreground text-[10px] font-bold ring-2 ring-white">Pt</span>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">Empowering 100+ families during early-to-mid stages.</span>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-24 px-4 sm:px-6 max-w-3xl mx-auto w-full">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
        </div>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-border rounded-2xl bg-card overflow-hidden">
              <button onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left font-bold text-sm sm:text-base flex items-start sm:items-center justify-between gap-3 hover:bg-muted/30 transition">
                <span className="leading-snug">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0 mt-0.5 sm:mt-0 ${activeFaq === index ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {activeFaq === index && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="overflow-hidden">
                    <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-border/30 text-muted-foreground text-sm leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-14 sm:py-20 px-4 sm:px-6 bg-gradient-to-t from-secondary/20 to-transparent border-t border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-start">
          {/* Info */}
          <div className="flex flex-col gap-5 text-center md:text-left items-center md:items-start">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Connect with our support team</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Have questions about HIPAA compliance, custom institutional deployments, or feedback? Send us a message — our team will reach out.
            </p>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground w-full">
              <a href="tel:+919380842043" className="flex items-center gap-2 justify-center md:justify-start py-3 px-4 rounded-2xl bg-card border border-border hover:border-primary transition">
                📞 +91 9380842043
              </a>
              <a href="mailto:gowdadilip11942@gmail.com" className="flex items-center gap-2 justify-center md:justify-start py-3 px-4 rounded-2xl bg-card border border-border hover:border-primary transition break-all">
                ✉️ gowdadilip11942@gmail.com
              </a>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
              btn.disabled = true; btn.textContent = "Sending…";
              try {
                const res = await fetch("https://formsubmit.co/ajax/gowdadilip11942@gmail.com", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Accept": "application/json" },
                  body: JSON.stringify({
                    name: (form.elements.namedItem("name") as HTMLInputElement).value,
                    email: (form.elements.namedItem("email") as HTMLInputElement).value,
                    role: (form.elements.namedItem("role") as HTMLSelectElement).value,
                    message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
                    _subject: "New RememberMe Inquiry", _template: "table",
                  }),
                });
                if (res.ok) { alert("✅ Message sent! We'll reach out shortly."); form.reset(); }
                else alert("❌ Failed. Please email us directly.");
              } catch { alert("❌ Network error. Please email us directly."); }
              finally { btn.disabled = false; btn.textContent = "Submit Message"; }
            }}
            className="bg-card border border-border p-5 sm:p-7 rounded-3xl shadow-sm flex flex-col gap-4"
          >
            <h3 className="font-bold text-lg mb-1">Send an inquiry</h3>
            {/* Name + Email stacked on mobile, side-by-side on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Name</label>
                <input required name="name" type="text" placeholder="Your name"
                  className="p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary w-full" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Email</label>
                <input required name="email" type="email" placeholder="name@domain.com"
                  className="p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary w-full" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Role</label>
              <select name="role" className="p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary w-full">
                <option>Caregiver / Family Member</option>
                <option>Clinical Doctor / Specialist</option>
                <option>Care Institution Administrator</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Message</label>
              <textarea required name="message" rows={4} placeholder="How can we assist you?"
                className="p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary resize-none w-full" />
            </div>
            <button type="submit" className="w-full py-3.5 bg-primary text-white font-bold rounded-2xl shadow-md hover:bg-primary/95 hover:shadow-lg transition">
              Submit Message
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="max-w-5xl mx-auto mt-14 sm:mt-20 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <span>© {new Date().getFullYear()} RememberMe Inc. All rights reserved.</span>
          <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">HIPAA Statement</a>
          </div>
        </div>
      </section>
    </div>
  );
}
