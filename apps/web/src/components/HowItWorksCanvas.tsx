"use client";

import React, { useEffect, useRef, useState } from "react";

const steps = [
  { step: "01", title: "Set your vibe", desc: "Pick your tags, age range, and preferences during a fast onboarding." },
  { step: "02", title: "Find an event", desc: "Browse upcoming events or activities and tap join on anything." },
  { step: "03", title: "Get matched", desc: "Our engine pairs you with the highest compatible buddy automatically." },
  { step: "04", title: "Go enjoy it", desc: "Coordinate your meetup, show up together, and rate each other after." }
];

export default function HowItWorksCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 3

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate how far we scrolled through the container
      const start = rect.top - windowHeight * 0.7;
      const end = rect.bottom - windowHeight * 0.4;
      const total = end - start;
      const current = -start;

      let p = current / total;
      if (p < 0) p = 0;
      if (p > 1) p = 1;

      // We have 4 steps, so progress goes from 0 to 3.5
      const mappedProgress = p * 3.5;
      setProgress(mappedProgress);
      setActiveStep(Math.min(3, Math.floor(mappedProgress)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // init

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", resize);
    resize();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const isMobile = width < 768;

      // Node positions
      const nodes = [];
      const numNodes = steps.length;

      if (isMobile) {
        // Vertical layout
        const spacing = height / numNodes;
        for (let i = 0; i < numNodes; i++) {
          nodes.push({ x: 20, y: spacing * i + spacing / 2 });
        }
      } else {
        // Horizontal layout
        const spacing = width / numNodes;
        for (let i = 0; i < numNodes; i++) {
          nodes.push({ x: spacing * i + spacing / 2, y: height / 2 });
        }
      }

      // Draw base line
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);
      for (let i = 1; i < nodes.length; i++) {
        ctx.lineTo(nodes[i].x, nodes[i].y);
      }
      ctx.strokeStyle = "#e2e8f0"; // slate-200
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw active line
      if (progress > 0) {
        ctx.beginPath();
        ctx.moveTo(nodes[0].x, nodes[0].y);

        const currentIdx = Math.floor(progress);
        const remainder = progress - currentIdx;

        for (let i = 1; i <= currentIdx && i < nodes.length; i++) {
          ctx.lineTo(nodes[i].x, nodes[i].y);
        }

        if (currentIdx < nodes.length - 1 && remainder > 0) {
          const nextNode = nodes[currentIdx + 1];
          const currNode = nodes[currentIdx];
          const cx = currNode.x + (nextNode.x - currNode.x) * remainder;
          const cy = currNode.y + (nextNode.y - currNode.y) * remainder;
          ctx.lineTo(cx, cy);
        }

        ctx.strokeStyle = "#10b981"; // emerald-500
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Draw nodes
      nodes.forEach((node, idx) => {
        const isActive = progress >= idx;

        ctx.beginPath();
        ctx.arc(node.x, node.y, isActive ? 12 : 8, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? "#10b981" : "#fff";
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = isActive ? "#fff" : "#e2e8f0";
        ctx.stroke();

        if (isActive) {
          // Glow effect
          ctx.beginPath();
          ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
          ctx.fill();
        }
      });

      requestAnimationFrame(draw);
    };

    let animationId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [progress]);

  return (
    <section id="how" className="py-24 md:py-32 px-6 bg-slate-50 border-y border-slate-200" ref={containerRef}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 md:mb-20">
          <div className="text-emerald-500 font-bold text-sm uppercase tracking-widest mb-4">How it works</div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">From solo to squad in minutes</h2>
        </div>

        <div className="relative">
          {/* Canvas Background */}
          <div className="absolute inset-0 pointer-events-none z-0" style={{ margin: isMobile() ? '0 -10px' : '-20px 0' }}>
            <canvas ref={canvasRef} className="w-full h-full" style={{ width: '100%', height: '100%' }} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10 pt-8 pb-8">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`transition-all duration-700 ease-out bg-white border rounded-3xl p-8 shadow-sm ${activeStep >= idx
                  ? "border-emerald-500 shadow-emerald-500/20 shadow-xl -translate-y-2 opacity-100"
                  : "border-slate-200 opacity-60 scale-95"
                  }`}
              >
                <div className={`text-6xl font-extrabold mb-6 leading-none transition-colors duration-500 ${activeStep >= idx ? "text-emerald-100" : "text-slate-100"}`}>{step.step}</div>
                <h3 className={`text-lg font-bold mb-3 transition-colors duration-500 ${activeStep >= idx ? "text-emerald-600" : "text-slate-900"}`}>{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Simple helper for rendering logic
function isMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}
