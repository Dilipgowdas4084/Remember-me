"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, Heart, MapPin } from "lucide-react";
import { useAccessibility } from "@/frontend/providers";

interface MemoryItem {
  name: string;
  relationship?: string;
  description: string;
  photoUrl?: string | null;
  positiveMemory?: string | null;
  address?: string | null;
}

interface MemoryModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: MemoryItem | null;
  type: "person" | "place";
}

export default function MemoryModeDialog({ isOpen, onClose, item, type }: MemoryModeDialogProps) {
  const { speak, stopSpeaking } = useAccessibility();

  useEffect(() => {
    if (isOpen && item) {
      // Build speech text
      let speechText = "";
      if (type === "person") {
        speechText = `This is ${item.name}, your ${item.relationship || "friend"}. ${item.description}`;
        if (item.positiveMemory) {
          speechText += `. A happy memory: ${item.positiveMemory}`;
        }
      } else {
        speechText = `This is ${item.name}. ${item.description}`;
        if (item.address) {
          speechText += `. It is located at ${item.address}`;
        }
      }

      // Delay slightly to allow transition animation
      const timer = setTimeout(() => {
        speak(speechText);
      }, 500);

      return () => {
        clearTimeout(timer);
        stopSpeaking();
      };
    }
  }, [isOpen, item, type]);

  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-2xl bg-card border-2 border-primary/30 rounded-[2.5rem] shadow-2xl p-6 md:p-10 flex flex-col gap-6 overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Calm background breathing bubble */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-calm-pulse pointer-events-none" />

          {/* Close button - Oversized for accessibility */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-4 rounded-full bg-muted hover:bg-secondary hover:text-secondary-foreground transition-all shadow-sm border border-border"
            title="Go Back"
            aria-label="Go Back"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Type Indicator Pill */}
          <div className="flex self-start">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              type === "person" ? "bg-primary/20 text-secondary-foreground" : "bg-accent/20 text-accent-foreground"
            }`}>
              {type === "person" ? (
                <>
                  <Heart className="w-3.5 h-3.5" /> Person I Know
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" /> Place I Visit
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mt-2">
            {/* Image Section */}
            <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden bg-muted border border-border/50 shadow-md">
              {item.photoUrl ? (
                <img
                  src={item.photoUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-semibold uppercase">
                  {item.name.substring(0, 2)}
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 text-primary-foreground dark:text-foreground">
                  {item.name}
                </h2>
                {item.relationship && (
                  <p className="text-lg font-bold text-muted-foreground">
                    Your {item.relationship}
                  </p>
                )}
                {item.address && (
                  <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                    📍 {item.address}
                  </p>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-secondary/30 border border-primary/10">
                <p className="text-md leading-relaxed font-medium">
                  {item.description}
                </p>
              </div>

              {type === "person" && item.positiveMemory && (
                <div className="p-5 rounded-2xl bg-accent/20 border border-accent/10">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-accent-foreground mb-1">
                    🌸 Happy Memory Together
                  </h4>
                  <p className="text-sm font-semibold leading-relaxed">
                    {item.positiveMemory}
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => {
                    let speechText = "";
                    if (type === "person") {
                      speechText = `This is ${item.name}, your ${item.relationship}. ${item.description}. ${item.positiveMemory || ""}`;
                    } else {
                      speechText = `This is ${item.name}. ${item.description}. ${item.address ? `It is at ${item.address}` : ""}`;
                    }
                    speak(speechText);
                  }}
                  className="flex-1 py-4 px-6 rounded-2xl bg-primary text-white font-bold text-md shadow-md hover:bg-primary/95 transition flex items-center justify-center gap-2"
                >
                  <Volume2 className="w-5 h-5" /> Repeat Narration
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
