"use client";

import { useEffect, useState } from "react";
import { User, Music, Headphones, Guitar, Target, MessageSquare, Sparkles, Lock, Zap, Map, Star, Flame } from "lucide-react";

export default function BuddLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (token) setIsLoggedIn(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".reveal").forEach((r) => observer.observe(r));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');

        *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #FFFFFF;
          --bg2: #F7F8F5;
          --bg3: #F0F2EC;
          --surface: #FFFFFF;
          --border: #E8EAE3;
          --border2: #D4D8CC;
          --text: #0F1209;
          --muted: #9AA08C;
          --muted2: #5C6050;
          --accent: #B8F040;
          --accent2: #94CC20;
          --accent-dim: rgba(184,240,64,0.15);
          --accent-text: #3D5A00;
          
          --radius: 14px;
          --radius-sm: 8px;
        }

        html { scroll-behavior: smooth; }
        body { 
          background: var(--bg); 
          color: var(--text); 
          font-family: 'Geist', sans-serif; 
          font-size: 15px; 
          line-height: 1.65; 
          overflow-x: hidden; 
          -webkit-font-smoothing: antialiased;
          background-image: radial-gradient(#E8EAE3 1px, transparent 1px);
          background-size: 24px 24px;
        }

        /* Nav */
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 48px;
          border-bottom: 1px solid transparent;
          transition: border-color .3s, background .3s, backdrop-filter .3s;
        }
        nav.scrolled {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-bottom-color: var(--border);
        }
        .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-mark {
          width: 32px; height: 32px; background: var(--accent); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Instrument Serif', serif; font-size: 18px; color: var(--text); font-weight: 400;
        }
        .logo-text { font-size: 18px; font-weight: 500; color: var(--text); letter-spacing: -0.02em; }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .nav-links a { color: var(--muted2); text-decoration: none; font-size: 14px; font-weight: 400; transition: color .2s; }
        .nav-links a:hover { color: var(--text); }
        .nav-cta {
          background: var(--accent); color: var(--text);
          padding: 9px 20px; border-radius: 10px;
          font-size: 14px; font-weight: 500; text-decoration: none;
          transition: background .2s, transform .15s, box-shadow .2s;
        }
        .nav-cta:hover { 
          background: var(--accent2); 
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(184,240,64,0.3);
        }

        /* Hero */
        .hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 120px 48px 80px; text-align: center;
          position: relative; z-index: 1;
          background: linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,1)), url('/images/image.webp') center/cover no-repeat;
        }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          border: 1px solid var(--border); background: var(--surface);
          padding: 6px 14px; border-radius: 100px; margin-bottom: 32px;
          font-size: 13px; color: var(--muted2);
          animation: fadeUp .6s ease both;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .hero-badge span { color: var(--accent-text); font-weight: 500; }
        .badge-dot { width: 6px; height: 6px; background: var(--accent-dark); border-radius: 50%; animation: pulse 2s infinite; }

        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .6; transform: scale(0.8); } }

        .hero h1 {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(52px, 7vw, 88px);
          font-weight: 400; line-height: 1.05;
          letter-spacing: -0.03em;
          max-width: 900px;
          animation: fadeUp .7s .1s ease both;
          color: var(--text);
        }
        .hero h1 em { font-style: italic; color: var(--accent-text); }

        .hero-sub {
          font-size: 18px; color: var(--muted2); line-height: 1.6;
          max-width: 520px; margin: 24px auto 0;
          font-weight: 400;
          animation: fadeUp .7s .2s ease both;
        }

        .hero-actions {
          display: flex; align-items: center; gap: 16px; margin-top: 40px;
          animation: fadeUp .7s .3s ease both;
        }
        .btn-primary {
          background: var(--accent); color: var(--text);
          padding: 14px 28px; border-radius: 10px;
          font-size: 15px; font-weight: 500; text-decoration: none;
          transition: background .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 0 30px rgba(184,240,64,0.25);
        }
        .btn-primary:hover { 
          background: var(--accent2); 
          transform: translateY(-2px); 
          box-shadow: 0 0 40px rgba(184,240,64,0.35); 
        }
        .btn-ghost {
          color: var(--text); padding: 14px 24px;
          font-size: 15px; text-decoration: none;
          border: 1px solid var(--border); border-radius: 10px;
          background: var(--surface);
          transition: color .2s, border-color .2s, background .2s;
        }
        .btn-ghost:hover { 
          background: var(--bg2); 
          border-color: var(--border2); 
        }

        .hero-social-proof {
          margin-top: 56px;
          display: flex; align-items: center; gap: 16px;
          animation: fadeUp .7s .4s ease both;
        }
        .avatars { display: flex; }
        .avatar {
          width: 32px; height: 32px; border-radius: 50%;
          border: 2px solid var(--bg);
          margin-left: -10px;
          background: var(--bg2);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
        }
        .avatar:first-child { margin-left: 0; }
        .proof-text { font-size: 13px; color: var(--muted2); }
        .proof-text strong { color: var(--text); }

        /* Preview Window */
        .preview-wrap {
          position: relative; z-index: 1;
          padding: 0 48px 80px;
          animation: fadeUp .8s .5s ease both;
        }
        .preview-frame {
          max-width: 1000px; margin: 0 auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
          position: relative;
        }
        .preview-bar {
          background: var(--bg2);
          padding: 14px 20px;
          display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid var(--border);
        }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-r { background: #ff5f57; } .dot-y { background: #febc2e; } .dot-g { background: #28c840; }
        .preview-url {
          margin-left: 16px; background: var(--surface);
          border-radius: 6px; padding: 4px 14px;
          border: 1px solid var(--border);
          font-size: 12px; color: var(--muted); flex: 1; max-width: 260px;
        }

        .preview-body { display: flex; height: 480px; }
        .preview-sidebar {
          width: 220px; background: var(--bg2); border-right: 1px solid var(--border);
          padding: 20px 0; flex-shrink: 0;
        }
        .sidebar-item {
          padding: 10px 20px; font-size: 13px; color: var(--muted2);
          display: flex; align-items: center; gap: 10px; cursor: default;
          transition: background .15s;
        }
        .sidebar-item.active { background: var(--accent-dim); color: var(--accent-text); font-weight: 500; }
        .sidebar-item.active .s-dot { background: var(--accent-text); }
        .s-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
        .sidebar-section {
          padding: 16px 20px 8px; font-size: 11px; letter-spacing: .08em;
          text-transform: uppercase; color: var(--muted);
        }

        .preview-main { flex: 1; padding: 28px; overflow: hidden; background: var(--surface); }
        .preview-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .preview-title { font-size: 18px; font-weight: 500; letter-spacing: -0.02em; }
        .preview-tag {
          background: var(--accent-dim); color: var(--accent-text);
          font-size: 11px; padding: 3px 10px; border-radius: 100px;
        }

        .event-cards { display: flex; flex-direction: column; gap: 12px; }
        .ecard {
          background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
          padding: 16px; display: flex; align-items: center; gap: 16px;
          transition: border-color .2s, box-shadow .2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .ecard:hover { 
          border-color: var(--border2); 
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        .ecard-icon {
          width: 44px; height: 44px; border-radius: 10px;
          background: var(--bg2); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; flex-shrink: 0;
        }
        .ecard-info { flex: 1; }
        .ecard-name { font-size: 14px; font-weight: 500; margin-bottom: 2px; }
        .ecard-meta { font-size: 12px; color: var(--muted); }
        .ecard-badge {
          font-size: 11px; padding: 4px 10px; border-radius: 100px;
          background: var(--accent); color: var(--text);
          font-weight: 500; white-space: nowrap;
        }
        .ecard-badge.hot { background: #ffe4e1; color: #d63c30; }

        .match-panel {
          width: 220px; background: var(--bg2); border-left: 1px solid var(--border);
          padding: 20px; flex-shrink: 0;
        }
        .match-title { font-size: 13px; font-weight: 500; margin-bottom: 16px; color: var(--muted2); }
        .match-card {
          background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
          padding: 14px; margin-bottom: 10px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .match-name { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
        .match-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
        .tag {
          font-size: 10px; padding: 2px 8px; border-radius: 100px;
          background: var(--bg3); color: var(--muted2); border: 1px solid var(--border);
        }
        .score-bar { margin-top: 10px; height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; }
        .score-fill { height: 100%; background: var(--accent); border-radius: 2px; }

        /* Logos */
        .logos-section {
          padding: 0 48px 80px; position: relative; z-index: 1;
        }
        .logos-label { text-align: center; font-size: 11px; text-transform: uppercase; color: var(--muted); margin-bottom: 28px; letter-spacing: .08em; }
        .logos-row { display: flex; align-items: center; justify-content: center; gap: 48px; flex-wrap: wrap; }
        .logo-pill {
          font-size: 14px; font-weight: 500; color: var(--muted2);
          padding: 8px 20px; border: 1px solid var(--border); border-radius: 100px;
          transition: color .2s, border-color .2s;
          background: var(--surface);
        }
        .logo-pill:hover { color: var(--text); border-color: var(--border2); }

        /* Features */
        .section { padding: 100px 48px; position: relative; z-index: 1; background: var(--surface); }
        .section-label {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11px; letter-spacing: .08em; text-transform: uppercase;
          color: var(--accent-text); margin-bottom: 16px; font-weight: 500;
        }
        .section-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 400; line-height: 1.1; letter-spacing: -0.02em;
          max-width: 640px; color: var(--text);
        }
        .section-title em { font-style: italic; color: var(--accent-text); }

        .features-grid {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-top: 60px;
        }
        .feature-cell {
          background: var(--bg); padding: 36px;
          border-radius: 14px; border: 1px solid var(--border);
          transition: box-shadow .2s, transform .2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .feature-cell:hover {
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }
        .feature-icon {
          width: 40px; height: 40px; border-radius: 10px;
          background: var(--accent-dim); border: 1px solid var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; margin-bottom: 20px;
        }
        .feature-name { font-size: 16px; font-weight: 500; margin-bottom: 8px; letter-spacing: -0.01em; }
        .feature-desc { font-size: 14px; color: var(--muted2); line-height: 1.6; }

        /* How it works */
        .steps {
          display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 24px; margin-top: 60px;
        }
        .step { position: relative; padding: 32px; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .step-num {
          font-family: 'Instrument Serif', serif; font-size: 48px;
          color: var(--border2); line-height: 1; margin-bottom: 16px;
          font-weight: 400;
        }
        .step-title { font-size: 15px; font-weight: 500; margin-bottom: 8px; }
        .step-desc { font-size: 13px; color: var(--muted2); line-height: 1.6; }
        .step-connector {
          position: absolute; top: 50%; right: -13px;
          width: 24px; height: 1px; background: var(--border); z-index: 2;
        }
        .step:last-child .step-connector { display: none; }

        /* Testimonials */
        .testimonials { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 60px; }
        .tcard {
          background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
          padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .tcard-quote {
          font-size: 15px; line-height: 1.65; color: var(--text); margin-bottom: 20px;
          font-weight: 400;
        }
        .tcard-author { display: flex; align-items: center; gap: 12px; }
        .tcard-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--bg2); border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center; font-size: 15px;
        }
        .tcard-name { font-size: 13px; font-weight: 500; }
        .tcard-meta { font-size: 12px; color: var(--muted); }
        .stars { color: #f59e0b; font-size: 12px; margin-bottom: 12px; letter-spacing: 2px; }

        /* CTA */
        .cta-section { 
          padding: 200px 48px; position: relative; z-index: 1; text-align: center; 
          background: linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,1)), url('/images/homev4.jpeg') center/cover no-repeat;
        }
        .cta-box {
          max-width: 700px; margin: 0 auto;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px; padding: 72px 48px;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }
        .cta-title {
          font-family: 'Instrument Serif', serif;
          font-size: clamp(36px, 4vw, 56px);
          font-weight: 400; line-height: 1.1;
          letter-spacing: -0.02em; margin-bottom: 16px;
        }
        .cta-title em { font-style: italic; color: var(--accent-text); }
        .cta-sub { font-size: 16px; color: var(--muted2); margin-bottom: 36px; }

        /* Footer */
        footer {
          border-top: 1px solid var(--border);
          padding: 40px 48px; background: var(--surface);
          display: flex; align-items: center; justify-content: space-between;
          position: relative; z-index: 1;
        }
        .footer-copy { font-size: 13px; color: var(--muted); }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-size: 13px; color: var(--muted); text-decoration: none; transition: color .2s; }
        .footer-links a:hover { color: var(--text); }

        /* Animations */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity .7s ease, transform .7s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }

        @media(max-width: 900px) {
          nav { padding: 16px 24px; }
          .hero { padding: 100px 24px 60px; }
          .preview-wrap { padding: 0 24px 60px; }
          .logos-section, .section, .cta-section { padding: 60px 24px; }
          .features-grid { grid-template-columns: 1fr; }
          .steps { grid-template-columns: 1fr 1fr; }
          .testimonials { grid-template-columns: 1fr; }
          .preview-main, .match-panel { display: none; }
          footer { flex-direction: column; gap: 16px; padding: 32px 24px; }
          .nav-links { display: none; }
        }
      `}} />

      <nav id="nav" className={scrolled ? "scrolled" : ""}>
        <a className="logo" href="#">
          <div className="logo-mark">B</div>
          <span className="logo-text">Budd</span>
        </a>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#stories">Stories</a>
        </div>
        <a className="nav-cta" href={isLoggedIn ? "/events" : "/register"}>
          {isLoggedIn ? "Browse events" : "Get early access"}
        </a>
      </nav>

      <section className="hero">
        <div className="hero-badge">
          <span className="badge-dot"></span>
          <span>Now live in 12 cities</span> — global rollout underway
        </div>

        <h1>Find the right people<br />for every <em>experience</em></h1>

        <p className="hero-sub">
          Smart buddy matching for concerts, parties, and activities.
          Never show up alone to something worth sharing.
        </p>

        <div className="hero-actions">
          <a href={isLoggedIn ? "/events" : "/register"} className="btn-primary">
            {isLoggedIn ? "Browse events" : "Find your buddy"}
          </a>
          <a href="#how" className="btn-ghost">See how it works</a>
        </div>

        <div className="hero-social-proof">
          <div className="avatars">
            <div className="avatar"><User size={16} /></div>
            <div className="avatar"><User size={16} /></div>
            <div className="avatar"><User size={16} /></div>
            <div className="avatar"><User size={16} /></div>
            <div className="avatar"><User size={16} /></div>
          </div>
          <p className="proof-text"><strong>4,200+</strong> buddies matched this month</p>
        </div>
      </section>

      {/* APP PREVIEW */}
      <div className="preview-wrap">
        <div className="preview-frame">
          <div className="preview-bar">
            <div className="dot dot-r"></div>
            <div className="dot dot-y"></div>
            <div className="dot dot-g"></div>
            <div className="preview-url">app.budd.io/events</div>
          </div>
          <div className="preview-body">
            <div className="preview-sidebar">
              <div className="sidebar-section">Navigation</div>
              <div className="sidebar-item active"><span className="s-dot"></span>Browse events</div>
              <div className="sidebar-item"><span className="s-dot"></span>My matches</div>
              <div className="sidebar-item"><span className="s-dot"></span>Messages</div>
              <div className="sidebar-section">Account</div>
              <div className="sidebar-item"><span className="s-dot"></span>Profile</div>
              <div className="sidebar-item"><span className="s-dot"></span>Settings</div>
            </div>
            <div className="preview-main">
              <div className="preview-header">
                <div className="preview-title">Events near you</div>
                <div className="preview-tag">Jakarta · This week</div>
              </div>
              <div className="event-cards">
                <div className="ecard">
                  <div className="ecard-icon"><Music size={20} /></div>
                  <div className="ecard-info">
                    <div className="ecard-name">SCENTROPOLIS.JKT</div>
                    <div className="ecard-meta">11 Apr - 12 Apr 2026 · 10:00 - 20:00 · Chillax Sudirman</div>
                  </div>
                  <div className="ecard-badge hot" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Flame size={12} /> Hot</div>
                </div>
                <div className="ecard">
                  <div className="ecard-icon"><Headphones size={20} /></div>
                  <div className="ecard-info">
                    <div className="ecard-name">KONSER 30th Project Pop</div>
                    <div className="ecard-meta">08 Aug 2026 · 19:00 - 21:00 · Tennis Indoor Senayan</div>
                  </div>
                  <div className="ecard-badge">Join</div>
                </div>
                <div className="ecard">
                  <div className="ecard-icon"><Guitar size={20} /></div>
                  <div className="ecard-info">
                    <div className="ecard-name">Pestapora 2026</div>
                    <div className="ecard-meta">25 Sep - 27 Sep 2026 · 15:00 - 23:59 · JAKARTA</div>
                  </div>
                  <div className="ecard-badge">Join</div>
                </div>
                <div className="ecard">
                  <div className="ecard-icon"><Music size={20} /></div>
                  <div className="ecard-info">
                    <div className="ecard-name">2026 WOODZ WORLD TOUR ' Archive. 1 ' IN JAKARTA</div>
                    <div className="ecard-meta">09 May 2026 · 19:00 - 21:00 · The Kasablanka</div>
                  </div>
                  <div className="ecard-badge">Join</div>
                </div>
                <div className="ecard">
                  <div className="ecard-icon"><Headphones size={20} /></div>
                  <div className="ecard-info">
                    <div className="ecard-name">2026 MONSTA X WORLD TOUR [THE X : NEXUS] IN JAKARTA</div>
                    <div className="ecard-meta">18 Apr 2026 · 19:00 - 22:00 · THE KASABLANKA HALL</div>
                  </div>
                  <div className="ecard-badge">Join</div>
                </div>
                <div className="ecard">
                  <div className="ecard-icon"><Guitar size={20} /></div>
                  <div className="ecard-info">
                    <div className="ecard-name">Afgan - retrospektif The Concert 2026</div>
                    <div className="ecard-meta">18 Jul 2026 · 13:00 - 22:00 · Plenary Hall JCC, Senayan</div>
                  </div>
                  <div className="ecard-badge">Join</div>
                </div>
                <div className="ecard">
                  <div className="ecard-icon"><Music size={20} /></div>
                  <div className="ecard-info">
                    <div className="ecard-name">Interaksi Festival 2026</div>
                    <div className="ecard-meta">25 Jul 2026 · 15:00 - 23:00 · Stadion Pakansari</div>
                  </div>
                  <div className="ecard-badge">Join</div>
                </div>
                <div className="ecard">
                  <div className="ecard-icon"><Headphones size={20} /></div>
                  <div className="ecard-info">
                    <div className="ecard-name">WHISKY LIVE JAKARTA 2026</div>
                    <div className="ecard-meta">11 Apr - 12 Apr 2026 · 13:00 - 23:00 · Park Hyatt Jakarta</div>
                  </div>
                  <div className="ecard-badge">Join</div>
                </div>
                <div className="ecard">
                  <div className="ecard-icon"><Guitar size={20} /></div>
                  <div className="ecard-info">
                    <div className="ecard-name">JakCloth Lebaran 2026 - Bekasi</div>
                    <div className="ecard-meta">07 Mar - 18 Mar 2026 · 13:00 - 23:00 · Pasar Modern Kota Harapan Indah</div>
                  </div>
                  <div className="ecard-badge">Join</div>
                </div>
                <div className="ecard">
                  <div className="ecard-icon"><Music size={20} /></div>
                  <div className="ecard-info">
                    <div className="ecard-name">JakCloth Lebaran 2026 - Cikarang</div>
                    <div className="ecard-meta">07 Mar - 18 Mar 2026 · 13:00 - 23:00 · Mall Lippo Cikarang</div>
                  </div>
                  <div className="ecard-badge">Join</div>
                </div>
              </div>
            </div>
            <div className="match-panel">
              <div className="match-title">Your matches</div>
              <div className="match-card">
                <div className="match-name">Sophie K.</div>
                <div className="match-tags">
                  <span className="tag">chill</span>
                  <span className="tag">regular</span>
                </div>
                <div className="score-bar"><div className="score-fill" style={{ width: '88%' }}></div></div>
              </div>
              <div className="match-card">
                <div className="match-name">Mika R.</div>
                <div className="match-tags">
                  <span className="tag">hype</span>
                  <span className="tag">first-timer</span>
                </div>
                <div className="score-bar"><div className="score-fill" style={{ width: '72%' }}></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOGOS */}
      <div className="logos-section reveal">
        <p className="logos-label">Trusted by communities in</p>
        <div className="logos-row">
          <span className="logo-pill">Amsterdam</span>
          <span className="logo-pill">London</span>
          <span className="logo-pill">Berlin</span>
          <span className="logo-pill">Jakarta</span>
          <span className="logo-pill">New York</span>
          <span className="logo-pill">Barcelona</span>
        </div>
      </div>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="reveal">
          <div className="section-label">Features</div>
          <h2 className="section-title">Everything you need to <em>never go alone</em></h2>
        </div>
        <div className="features-grid reveal">
          <div className="feature-cell">
            <div className="feature-icon"><Target size={20} /></div>
            <div className="feature-name">Smart matching</div>
            <p className="feature-desc">Weighted scoring across vibe tags, age, preferences, and past ratings. Not random — actually compatible.</p>
          </div>
          <div className="feature-cell">
            <div className="feature-icon"><MessageSquare size={20} /></div>
            <div className="feature-name">Real-time chat</div>
            <p className="feature-desc">Instant messaging with typing indicators, read receipts, and auto ice-breaker prompts so first messages aren't awkward.</p>
          </div>
          <div className="feature-cell">
            <div className="feature-icon"><Sparkles size={20} /></div>
            <div className="feature-name">Vibe tags</div>
            <p className="feature-desc">Tag yourself as chill, hype, introvert-friendly, first-timer. Match with people who actually get your energy.</p>
          </div>
          <div className="feature-cell">
            <div className="feature-icon"><Lock size={20} /></div>
            <div className="feature-name">Identity verified</div>
            <p className="feature-desc">Optional KYC verification through a trusted third party. See who's verified before you agree to meet.</p>
          </div>
          <div className="feature-cell">
            <div className="feature-icon"><Zap size={20} /></div>
            <div className="feature-name">Instant notifications</div>
            <p className="feature-desc">Get notified the moment you're matched — not hours later via a batch email. Real-time, every time.</p>
          </div>
          <div className="feature-cell">
            <div className="feature-icon"><Map size={20} /></div>
            <div className="feature-name">Global events</div>
            <p className="feature-desc">Concerts, parties, museum visits, padel, escape rooms — any experience, any city. We're adding more every week.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section" id="how" style={{ background: 'var(--bg2)' }}>
        <div className="reveal">
          <div className="section-label">How it works</div>
          <h2 className="section-title">From solo to <em>squad</em> in minutes</h2>
        </div>
        <div className="steps reveal">
          <div className="step">
            <div className="step-num">01</div>
            <div className="step-title">Set your vibe</div>
            <p className="step-desc">Pick your vibe tags, age range, and gender preference during a 60-second onboarding.</p>
            <div className="step-connector"></div>
          </div>
          <div className="step">
            <div className="step-num">02</div>
            <div className="step-title">Find an event</div>
            <p className="step-desc">Browse upcoming events or activities and tap "join" on anything that interests you.</p>
            <div className="step-connector"></div>
          </div>
          <div className="step">
            <div className="step-num">03</div>
            <div className="step-title">Get matched</div>
            <p className="step-desc">Our engine scores all candidates and pairs you with the highest compatible buddy.</p>
            <div className="step-connector"></div>
          </div>
          <div className="step">
            <div className="step-num">04</div>
            <div className="step-title">Go enjoy it</div>
            <p className="step-desc">Chat, coordinate your meetup, and show up together. Rate each other after for better future matches.</p>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" id="stories">
        <div className="reveal">
          <div className="section-label">Stories</div>
          <h2 className="section-title">People who stopped <em>going alone</em></h2>
        </div>
        <div className="testimonials reveal">
          <div className="tcard">
            <div className="stars" style={{ display: 'flex', gap: '2px' }}>
              <Star size={12} fill="currentColor" strokeWidth={0} />
              <Star size={12} fill="currentColor" strokeWidth={0} />
              <Star size={12} fill="currentColor" strokeWidth={0} />
              <Star size={12} fill="currentColor" strokeWidth={0} />
              <Star size={12} fill="currentColor" strokeWidth={0} />
            </div>
            <p className="tcard-quote">"I wanted to go to a party at TillaTec but didn't want to go alone. Matched with three other girls. Same energy, same vibe. Would totally use it again."</p>
            <div className="tcard-author">
              <div className="tcard-avatar"><User size={16} /></div>
              <div>
                <div className="tcard-name">Elise van D.</div>
                <div className="tcard-meta">Amsterdam · Concerts</div>
              </div>
            </div>
          </div>
          <div className="tcard">
            <div className="stars" style={{ display: 'flex', gap: '2px' }}>
              <Star size={12} fill="currentColor" strokeWidth={0} />
              <Star size={12} fill="currentColor" strokeWidth={0} />
              <Star size={12} fill="currentColor" strokeWidth={0} />
              <Star size={12} fill="currentColor" strokeWidth={0} />
              <Star size={12} fill="currentColor" strokeWidth={0} />
            </div>
            <p className="tcard-quote">"The vibe tags made all the difference. Matched with someone who was also a first-timer at DGTL — we navigated it together. Perfect."</p>
            <div className="tcard-author">
              <div className="tcard-avatar"><User size={16} /></div>
              <div>
                <div className="tcard-name">Ravi M.</div>
                <div className="tcard-meta">London · Festivals</div>
              </div>
            </div>
          </div>
          <div className="tcard">
            <div className="stars" style={{ display: 'flex', gap: '2px' }}>
              <Star size={12} fill="currentColor" strokeWidth={0} />
              <Star size={12} fill="currentColor" strokeWidth={0} />
              <Star size={12} fill="currentColor" strokeWidth={0} />
              <Star size={12} fill="currentColor" strokeWidth={0} />
              <Star size={12} fill="currentColor" strokeWidth={0} />
            </div>
            <p className="tcard-quote">"Used it for a museum trip and ended up spending 4 hours there. My buddy knew everything about the exhibition. Best unexpected afternoon."</p>
            <div className="tcard-author">
              <div className="tcard-avatar"><User size={16} /></div>
              <div>
                <div className="tcard-name">Aiko T.</div>
                <div className="tcard-meta">Berlin · Activities</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-box reveal">
          <h2 className="cta-title">Ready to find your <em>person</em>?</h2>
          <p className="cta-sub">Join thousands of people who stopped letting great experiences pass them by.</p>
          <a href={isLoggedIn ? "/events" : "/register"} className="btn-primary">
            {isLoggedIn ? "Browse events" : "Get early access — it's free"}
          </a>
        </div>
      </section>

      <footer>
        <span className="footer-copy">© 2026 Budd. All rights reserved.</span>
        <div className="footer-links">
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">Contact</a>
        </div>
      </footer>
    </>
  );
}
