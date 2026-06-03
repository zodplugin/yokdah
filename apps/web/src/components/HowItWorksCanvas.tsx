"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Compass, Users, PartyPopper, Check, Heart } from "lucide-react";

const steps = [
  { 
    step: "01", 
    title: "Set your vibe", 
    desc: "Pick your vibe tags, age range, and music/activity preferences during a fast onboarding.",
    icon: Sparkles,
    color: "emerald"
  },
  { 
    step: "02", 
    title: "Find an event", 
    desc: "Browse upcoming events or activities and tap join on anything that looks interesting.",
    icon: Compass,
    color: "blue"
  },
  { 
    step: "03", 
    title: "Get matched", 
    desc: "Our matching engine pairs you with the most compatible buddy automatically.",
    icon: Users,
    color: "purple"
  },
  { 
    step: "04", 
    title: "Go enjoy it", 
    desc: "Coordinate your meetup location, show up together, and rate your buddy afterward.",
    icon: PartyPopper,
    color: "rose"
  }
];

export default function HowItWorksCanvas() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-step-index"));
            setActiveStep(index);
          }
        });
      },
      {
        root: null,
        // Detects when the step occupies the middle 40% of the screen
        rootMargin: "-30% 0px -30% 0px",
        threshold: 0.2
      }
    );

    const stepElements = document.querySelectorAll(".how-step-item");
    stepElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="how" 
      className="py-24 md:py-32 px-6 bg-slate-50 text-slate-900 border-y border-slate-200"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <div className="text-emerald-500 font-bold text-sm uppercase tracking-widest mb-4">How it works</div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">From solo to squad in minutes</h2>
        </div>

        {/* Page Flow Sticky Layout (No fake height, no nested scrollbar) */}
        <div className="relative flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
          
          {/* Left Side: Mockup Scene (Sticky on Desktop) */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-28 lg:h-[580px] flex items-center justify-center bg-slate-100/60 rounded-[32px] p-8 border border-slate-200/80 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            
            {/* Phone Mockup */}
            <div className="w-full max-w-[300px] aspect-[9/16] bg-slate-50 border-[8px] border-slate-800 rounded-[40px] shadow-xl shadow-slate-200/80 relative overflow-hidden flex flex-col justify-between p-4.5">
              {/* Speaker Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-3.5 bg-slate-800 rounded-full z-20" />
              
              {/* Screen Content */}
              <div className="flex-1 mt-3.5 relative flex flex-col justify-between overflow-hidden">
                <AnimatePresence mode="wait">
                  
                  {/* Scene 1: Vibes */}
                  {activeStep === 0 && (
                    <motion.div 
                      key="scene-1"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="h-full flex flex-col justify-center space-y-3.5"
                    >
                      <div className="text-center">
                        <div className="text-emerald-600 font-bold text-[10px] uppercase tracking-wider mb-0.5">Onboarding</div>
                        <h4 className="font-extrabold text-slate-800 text-sm">Select Your Vibes</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: " Concerts", active: true },
                          { label: "🎸 Rock Music", active: true },
                          { label: "⛺ Camping", active: false },
                          { label: "🍕 Foodie", active: true },
                          { label: "📸 Art Gallery", active: false },
                          { label: "🎤 Karaoke", active: true }
                        ].map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className={`p-2.5 rounded-xl border text-[11px] font-semibold text-center ${
                              item.active 
                                ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                                : "bg-white border-slate-200 text-slate-400"
                            }`}
                          >
                            {item.label}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Scene 2: Event Poster */}
                  {activeStep === 1 && (
                    <motion.div 
                      key="scene-2"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      className="h-full flex flex-col justify-center"
                    >
                      <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2.5 shadow-sm">
                        <div className="h-24 w-full bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl flex items-center justify-center text-slate-400 text-[10px] font-medium border border-slate-100">
                          Pestapora Poster
                        </div>
                        <div>
                          <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">CONCERT</span>
                          <h4 className="font-extrabold text-slate-800 text-xs mt-1">Pestapora Festival 2026</h4>
                          <p className="text-[9px] text-slate-500">Stadion Madya, Jakarta</p>
                        </div>
                        
                        <button className="w-full bg-emerald-500 text-white font-bold text-[10px] py-2 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/10">
                          Join Experience
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Scene 3: Match scanning */}
                  {activeStep === 2 && (
                    <motion.div 
                      key="scene-3"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="h-full flex flex-col items-center justify-center"
                    >
                      <div className="relative w-36 h-36 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border border-purple-200 animate-ping opacity-30" />
                        <div className="absolute inset-4 rounded-full border border-purple-100 animate-pulse" />
                        
                        <motion.svg className="absolute inset-0 w-full h-full" fill="none">
                          <motion.line 
                            x1="20%" y1="20%" x2="80%" y2="80%" 
                            stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, repeat: Infinity, repeatType: "loop" }}
                          />
                        </motion.svg>

                        <div className="absolute top-1 left-1 w-8 h-8 rounded-full border border-purple-500 overflow-hidden shadow-sm">
                          <img src="https://i.pravatar.cc/100?img=11" alt="Avatar" />
                        </div>
                        <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full border border-purple-500 overflow-hidden shadow-sm">
                          <img src="https://i.pravatar.cc/100?img=33" alt="Avatar" />
                        </div>

                        <motion.div 
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-16 h-16 rounded-full bg-purple-500 text-white flex flex-col items-center justify-center shadow-lg shadow-purple-500/20 z-10"
                        >
                          <Heart className="w-3 h-3 fill-white" />
                          <span className="font-black text-xs">96%</span>
                          <span className="text-[6px] font-bold uppercase tracking-wider">Match</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* Scene 4: Chat confirmation */}
                  {activeStep === 3 && (
                    <motion.div 
                      key="scene-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-full flex flex-col justify-center space-y-2.5"
                    >
                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-2 flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200">
                          <img src="https://i.pravatar.cc/100?img=11" alt="Avatar" />
                        </div>
                        <div className="text-[9px] text-slate-700 font-semibold">Matched with Desta</div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="bg-slate-100 text-slate-700 text-[9px] p-2 rounded-xl rounded-tl-none max-w-[85%] border border-slate-200">
                          Ready for Pestapora?
                        </div>
                        <div className="bg-emerald-500 text-white text-[9px] p-2 rounded-xl rounded-tr-none max-w-[85%] ml-auto">
                          Let's do it! Meet at Gate A.
                        </div>
                      </div>

                      <div className="bg-emerald-50/60 border border-emerald-500/20 rounded-lg p-1.5 flex items-center justify-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-wider">Meetup Confirmed</span>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
              
              {/* Phone Home Indicator */}
              <div className="w-20 h-1 bg-slate-800 rounded-full mx-auto mt-2" />
            </div>
          </div>

          {/* Right Side: Step details (Scrolls naturally with page) */}
          <div className="w-full lg:w-1/2 flex flex-col gap-24 lg:gap-32 py-10 lg:py-20">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = activeStep === idx;
              
              return (
                <div 
                  key={idx}
                  data-step-index={idx}
                  className="how-step-item flex flex-col justify-center transition-all duration-500 min-h-[180px]"
                  style={{ opacity: isActive ? 1 : 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-white text-emerald-500 flex items-center justify-center border border-slate-200 shadow-sm transition-transform ${isActive ? "scale-110" : ""}`}>
                      <StepIcon size={20} />
                    </div>
                    <span className="text-xs font-black tracking-widest text-emerald-500">STEP {step.step}</span>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-md">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
