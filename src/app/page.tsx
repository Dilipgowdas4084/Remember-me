"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth, useTheme, useAccessibility } from "@/frontend/providers";
import { 
  Heart, 
  Shield, 
  Brain, 
  User, 
  Settings, 
  Activity, 
  MessageCircle, 
  PhoneCall, 
  Sun, 
  Moon,
  ChevronDown,
  Volume2,
  MapPin
} from "lucide-react";
import { useState, useEffect } from "react";

export default function LandingPage() {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { speak } = useAccessibility();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: <MapPin className="w-8 h-8 text-primary" />,
      title: "Real-Time Live Location",
      description: "Always-on GPS tracking gives doctors and caregivers instant visibility into a patient's whereabouts. If a patient wanders, their live coordinates update automatically — viewable on Google Maps with one click."
    },
    {
      icon: <Brain className="w-8 h-8 text-primary" />,
      title: "Memory Profiles",
      description: "Secure cards featuring family photos, descriptions, and narration to trigger comforting recognition of people and places."
    },
    {
      icon: <Activity className="w-8 h-8 text-accent-foreground" />,
      title: "Routine Timelines",
      description: "Visual, animated checklists for morning, afternoon, and night routines to simplify daily schedules."
    },
    {
      icon: <MessageCircle className="w-8 h-8 text-info-blue-foreground" />,
      title: "AI Memory Assistant",
      description: "A patient companion trained to speak in calm, short sentences, answering questions like 'Who is Sarah?' using actual profile data."
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Role-Based Security",
      description: "Doctors edit profiles and set medication schedules. Caregivers assist, and patients experience a zero-stress, read-only UI."
    },
    {
      icon: <Volume2 className="w-8 h-8 text-accent-foreground" />,
      title: "TTS Accessibility",
      description: "Read aloud details, messages, and schedules at a soothing pace with one-click narration to reduce cognitive overload."
    },
    {
      icon: <PhoneCall className="w-8 h-8 text-warning-orange-foreground" />,
      title: "One-Click Emergency SOS",
      description: "Large, high-contrast buttons allowing patients to instantly trigger emergency notifications to their primary caregivers."
    }
  ];

  const faqs = [
    {
      question: "How does the platform help Alzheimer's patients?",
      answer: "RememberMe is designed from the ground up for low cognitive load. It features extremely large buttons, clean typography, soft soothing colors, and text-to-speech voice narration. This reduces anxiety and helps patients independently review who their family members are, what medications to take, and daily routine steps."
    },
    {
      question: "Can patients accidentally edit or delete their medical data?",
      answer: "No. The system uses strict role-based access controls. Only the assigned primary doctor (and caregivers with explicit permission) can modify patient memory files, medication guidelines, or details. The patient dashboard is strictly read-only and interaction-focused."
    },
    {
      question: "Does the AI assistant share patient data?",
      answer: "Patient privacy is our priority. The AI assistant constructs its knowledge base strictly from the private PostgreSQL database entries created by the doctor. No data is stored or shared externally outside of secure contextual API calls."
    },
    {
      question: "How does the 'Memory Mode' work?",
      answer: "Memory Mode is a full-screen focus feature. When a patient clicks on a person or place, the app dims the background, plays a gentle animation, and speaks the name, relationship, and a positive reassuring memory aloud using a calming voice narration."
    }
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen text-foreground transition-colors duration-300">
      {/* Navigation */}
      <header className="sticky top-0 z-50 glass-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-info-blue flex items-center justify-center shadow-md animate-calm-pulse">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-secondary-foreground bg-clip-text text-transparent">
            RememberMe
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#features" className="hover:text-primary transition">Features</a>
          <a href="#story" className="hover:text-primary transition">Our Mission</a>
          <a href="#faq" className="hover:text-primary transition">FAQ</a>
          <a href="#contact" className="hover:text-primary transition">Contact</a>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-muted transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {mounted && isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {!mounted ? (
            <div className="w-16 h-8 bg-muted/40 rounded-full animate-pulse" />
          ) : user ? (
            <Link 
              href={user.role === "DOCTOR" ? "/doctor" : user.role === "CAREGIVER" ? "/caregiver" : "/patient"}
              className="px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:shadow-lg transition duration-200"
            >
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                href="/auth/login"
                className="px-4 py-2 rounded-full hover:bg-muted text-sm font-medium transition"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/register"
                className="px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:shadow-lg transition duration-200"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32 px-6 bg-gradient-to-b from-secondary/30 to-transparent">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold self-start border border-primary/20">
              <Heart className="w-3.5 h-3.5" /> Compassionate Memory Care
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              A peaceful space to <span className="text-primary">remember</span>, connect, and thrive.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
              Designed with love and medical rigor, RememberMe helps individuals with Alzheimer's retain their memories of family, places, and routines in a comforting, voice-assisted interface.
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <Link 
                href="/auth/register"
                className="px-8 py-3.5 rounded-full bg-primary text-white font-semibold hover:shadow-xl transition-transform hover:-translate-y-0.5"
              >
                Create Account
              </Link>
              <button 
                onClick={() => speak("Welcome to RememberMe. We are here to help you remember the moments and the people you love. Everything is safe.")}
                className="px-6 py-3.5 rounded-full border border-border bg-card font-medium hover:bg-muted transition flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" /> Listen to Welcome
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Visual presentation card simulating Patient UI */}
            <div className="w-full max-w-md mx-auto rounded-3xl p-6 shadow-2xl glass-card relative border border-white/60 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-info-blue to-accent" />
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xl">
                  RC
                </div>
                <div>
                  <h3 className="font-bold text-lg">Robert's Memory Card</h3>
                  <p className="text-xs text-muted-foreground">Updated by Dr. Emily Carter</p>
                </div>
              </div>
              <div className="bg-card/80 border border-border/50 rounded-2xl p-4 mb-4">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Daughter</div>
                <div className="font-bold text-lg mb-1">Sarah Chen</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "Sarah is your daughter. She visits every Sunday afternoon. She loves baking apple pies with you."
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex-1 py-3 px-4 rounded-xl bg-secondary text-secondary-foreground font-bold text-sm text-center hover:bg-primary hover:text-white transition">
                  🔊 Read Aloud
                </button>
                <button className="py-3 px-4 rounded-xl bg-accent/20 text-accent-foreground font-bold text-sm hover:bg-accent/40 transition">
                  Memory Mode 🌸
                </button>
              </div>
            </div>
            
            {/* Floating decoration bubble */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-calm-pulse" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-accent/15 rounded-full blur-2xl animate-calm-pulse" />
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Everything needed for compassionate care</h2>
          <p className="text-muted-foreground text-md">
            RememberMe provides doctors with medical configuration, caregivers with assisting dashboards, and patients with a stress-free environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition duration-300 flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mb-2">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold tracking-tight">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Emotional Story / Mission */}
      <section id="story" className="py-20 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-4xl mx-auto flex flex-col gap-8 text-center items-center">
          <Heart className="w-10 h-10 text-primary animate-calm-pulse" />
          <h2 className="text-3xl font-extrabold tracking-tight max-w-xl">
            "We built this because memories are the threads that bind us to who we love."
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            Alzheimer's presents challenges that require dignity, calm, and clarity. RememberMe was designed alongside neurologists and occupational therapists to eliminate clinical clutter, replace red alarm systems with pastel comfort, and support cognitive anchoring through simple, repetitive confirmation.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex -space-x-2">
              <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">Dr</span>
              <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-[10px] font-bold">Cg</span>
              <span className="w-8 h-8 rounded-full bg-info-blue flex items-center justify-center text-info-blue-foreground text-[10px] font-bold">Pt</span>
            </div>
            <span className="text-sm font-semibold text-muted-foreground">Empowering 100+ families during early-to-mid stages.</span>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-border rounded-2xl bg-card overflow-hidden">
              <button 
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-5 text-left font-bold flex items-center justify-between hover:bg-muted/30 transition"
              >
                <span>{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${activeFaq === index ? "rotate-180" : ""}`} />
              </button>
              {activeFaq === index && (
                <div className="px-6 pb-6 pt-1 border-t border-border/30 text-muted-foreground text-sm leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact & Footer Section */}
      <section id="contact" className="py-20 px-6 bg-gradient-to-t from-secondary/20 to-transparent border-t border-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-extrabold tracking-tight">Connect with our support team</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Have questions about HIPAA compliance, custom institutional deployments, or feedback? Send us a message, and our compassionate clinical success team will reach out.
            </p>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">📞 24/7 Helpline: +91 9380842043</span>
              <span className="flex items-center gap-2">✉️ Support: gowdadilip11942@gmail.com</span>
            </div>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            submitBtn.disabled = true;
            submitBtn.textContent = "Sending...";
            try {
              const res = await fetch("https://formsubmit.co/ajax/gowdadilip11942@gmail.com", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({
                  name: (form.elements.namedItem("name") as HTMLInputElement).value,
                  email: (form.elements.namedItem("email") as HTMLInputElement).value,
                  role: (form.elements.namedItem("role") as HTMLSelectElement).value,
                  message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
                  _subject: "New RememberMe Inquiry",
                  _template: "table",
                }),
              });
              if (res.ok) {
                alert("✅ Message sent! We'll reach out to you shortly at your email.");
                form.reset();
              } else {
                alert("❌ Failed to send. Please try emailing us directly at gowdadilip11942@gmail.com");
              }
            } catch {
              alert("❌ Network error. Please try emailing us directly at gowdadilip11942@gmail.com");
            } finally {
              submitBtn.disabled = false;
              submitBtn.textContent = "Submit Message";
            }
          }} className="bg-card border border-border p-8 rounded-3xl shadow-sm flex flex-col gap-4">
            <h3 className="font-bold text-lg mb-2">Send an inquiry</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Name</label>
                <input required name="name" type="text" className="p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" placeholder="Your name" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Email</label>
                <input required name="email" type="email" className="p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" placeholder="name@domain.com" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Role</label>
              <select name="role" className="p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary">
                <option>Caregiver / Family Member</option>
                <option>Clinical Doctor / Specialist</option>
                <option>Care Institution Administrator</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Message</label>
              <textarea required name="message" rows={4} className="p-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary" placeholder="How can we assist you?" />
            </div>
            <button type="submit" className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/95 hover:shadow-lg transition">
              Submit Message
            </button>
          </form>
        </div>

        <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <span>&copy; {new Date().getFullYear()} RememberMe Inc. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">HIPAA Statement</a>
          </div>
        </div>
      </section>
    </div>
  );
}
