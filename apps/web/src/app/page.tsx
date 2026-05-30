"use client";

import { useEffect, useState } from "react";
import { User, Music, Headphones, Guitar, Target, MessageSquare, Sparkles, Lock, Zap, Map, Star, Flame } from "lucide-react";
import HowItWorksCanvas from "../components/HowItWorksCanvas";

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
            e.target.classList.remove("opacity-0", "translate-y-8", "blur-sm");
            e.target.classList.add("opacity-100", "translate-y-0", "blur-none");
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
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 flex flex-col font-sans text-slate-900">
      <div
        className="flex-1 bg-white rounded-[32px] md:rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
      >
        <nav
          className={`fixed z-50 flex items-center justify-between top-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-5xl rounded-full transition-all duration-300 ${scrolled
            ? "bg-white/95 shadow-lg shadow-slate-200/50 py-3 px-6 border border-slate-200"
            : "bg-white/80 backdrop-blur-xl shadow-sm py-4 px-6 sm:px-8 border border-slate-200"
            }`}
        >
          <a className="flex items-center gap-2.5 text-slate-900 no-underline" href="#">
            <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-lg">B</div>
            <span className="font-bold text-lg tracking-tight">Budd</span>
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Features</a>
            <a href="#how" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">How it works</a>
            <a href="#stories" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Stories</a>
          </div>
          <a
            href={isLoggedIn ? "/events" : "/register"}
            className="bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-md shadow-emerald-500/20 inline-flex items-center justify-center"
          >
            {isLoggedIn ? "Browse events" : "Get early access"}
          </a>
        </nav>

        <section
          className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-40 pb-20 relative"
          style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0.7) 0%, rgba(255,255,255,1) 100%), url('/images/homev4.jpeg') center/cover no-repeat"
          }}
        >
          <div className="reveal opacity-0 translate-y-8 blur-sm transition-all duration-700 ease-out inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-sm font-semibold text-slate-500 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Now live in 12 cities across Indonesia
          </div>

          <h1
            className="reveal opacity-0 translate-y-8 blur-sm transition-all duration-700 ease-out text-5xl md:text-7xl lg:text-[80px] font-extrabold leading-[1.05] tracking-tight max-w-4xl text-slate-900 mb-6"
            style={{ transitionDelay: '100ms' }}
          >
            Find the right people<br />for every <span className="text-emerald-500">experience</span>
          </h1>

          <p
            className="reveal opacity-0 translate-y-8 blur-sm transition-all duration-700 ease-out text-lg text-slate-500 max-w-xl leading-relaxed font-medium mb-10"
            style={{ transitionDelay: '200ms' }}
          >
            Smart buddy matching for concerts, parties, and activities.
            Never show up alone to something worth sharing.
          </p>

          <div
            className="reveal opacity-0 translate-y-8 blur-sm transition-all duration-700 ease-out flex flex-col sm:flex-row items-center gap-4"
            style={{ transitionDelay: '300ms' }}
          >
            <a
              href={isLoggedIn ? "/events" : "/register"}
              className="bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 text-white font-bold px-8 py-4 rounded-full transition-all shadow-lg shadow-emerald-500/25 w-full sm:w-auto"
            >
              {isLoggedIn ? "Browse events" : "Find your buddy"}
            </a>
            <a
              href="#how"
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 font-bold px-8 py-4 rounded-full transition-colors w-full sm:w-auto"
            >
              See how it works
            </a>
          </div>

          <div
            className="reveal opacity-0 translate-y-8 blur-sm transition-all duration-700 ease-out mt-16 flex items-center justify-center gap-4"
            style={{ transitionDelay: '400ms' }}
          >
            <div className="flex">
              {[
                "https://i.pravatar.cc/100?img=11",
                "https://i.pravatar.cc/100?img=22",
                "https://i.pravatar.cc/100?img=33",
                "https://i.pravatar.cc/100?img=44"
              ].map((url, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 -ml-3 flex items-center justify-center text-slate-400 first:ml-0 z-10 overflow-hidden relative">
                  <img src={url} alt="Buddy" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 font-medium">
              <strong className="text-slate-900 font-bold">4,200+</strong> buddies matched this month
            </p>
          </div>
        </section>

        <section className="px-6 pb-24 md:pb-32">
          <div className="reveal opacity-0 translate-y-8 blur-sm transition-all duration-700 ease-out max-w-5xl mx-auto bg-white border border-slate-200 rounded-[24px] md:rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50">
            <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <div className="ml-4 bg-white border border-slate-200 rounded-lg px-4 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
                app.budd.io/events
              </div>
            </div>
            <div className="p-6 md:p-10 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/50">
              {[
                { icon: Music, title: "SCENTROPOLIS.JKT", meta: "11 Apr 2026 · Chillax Sudirman" },
                { icon: Guitar, title: "Pestapora 2026", meta: "25 Sep 2026 · JAKARTA" },
                { icon: Headphones, title: "WHISKY LIVE JAKARTA", meta: "11 Apr 2026 · Park Hyatt" },
                { icon: Flame, title: "Interaksi Festival", meta: "25 Jul 2026 · Stadion Pakansari" }
              ].map((card, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 flex items-start gap-4 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                    <card.icon size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 mb-1">{card.title}</div>
                    <div className="text-sm text-slate-500">{card.meta}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6 border-y border-slate-200 bg-slate-50 text-center">
          <div className="max-w-6xl mx-auto">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Trusted by thousands of event-goers in</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {(([
                { name: "JAKARTA", image: "https://images.pexels.com/photos/2116719/pexels-photo-2116719.jpeg?cs=srgb&dl=pexels-tomfisk-2116719.jpg&fm=jpg" },
                { name: "BANDUNG", image: "https://images.unsplash.com/photo-1549473889-14f410d83298?auto=format&fit=crop&q=80&w=600" },
                { name: "SURABAYA", image: "https://plus.unsplash.com/premium_photo-1690959214934-802fdf410b3e?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c3VyYWJheWF8ZW58MHx8MHx8fDA%3D" },
                { name: "BALI", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=600" },
                { name: "SEMARANG", image: "https://images.pexels.com/photos/31863754/pexels-photo-31863754/free-photo-of-arsitektur-tua.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" }
              ] as Array<{ name: string; image: string; video?: string }>)).map((city, idx) => (
                <div
                  key={city.name}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 reveal opacity-0 translate-y-8 blur-sm"
                  style={{ transitionDelay: `${idx * 100}ms` }}
                >
                  {city?.video ? (
                    <video
                      autoPlay loop muted playsInline
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      src={city?.video}
                    />
                  ) : (
                    <img
                      src={city.image}
                      alt={city.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 transition-colors duration-300"></div>
                  <div className="absolute bottom-6 left-0 right-0 text-center">
                    <span className="text-xl font-extrabold text-white tracking-wide">{city.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-24 md:py-32 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <div className="text-emerald-500 font-bold text-sm uppercase tracking-widest mb-4">Features</div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">Everything you need</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: Target, title: "Smart matching", desc: "Weighted scoring across vibe tags, age, preferences, and past ratings. Not random — actually compatible.", delay: "0ms" },
              { icon: MessageSquare, title: "Real-time chat", desc: "Instant messaging with typing indicators and auto ice-breaker prompts so first messages aren't awkward.", delay: "100ms" },
              { icon: Lock, title: "Identity verified", desc: "Optional KYC verification through a trusted third party. See who's verified before you agree to meet.", delay: "200ms" }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="reveal opacity-0 translate-y-8 blur-sm transition-all duration-700 ease-out bg-white border border-slate-200 rounded-3xl p-8 md:p-10 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1"
                style={{ transitionDelay: feature.delay }}
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-8">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <HowItWorksCanvas />

        <section className="py-24 md:py-32 px-6 text-center relative overflow-hidden">
          <video
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
            src="/videos/home.mp4"
          />
          {/* Subtle overlay over the video to make the center card pop more */}
          <div className="absolute inset-0 bg-black/30 z-0"></div>

          <div className="reveal opacity-0 translate-y-8 blur-sm transition-all duration-700 ease-out max-w-4xl mx-auto rounded-[32px] md:rounded-[40px] p-12 md:p-24 relative overflow-hidden shadow-2xl shadow-black/40 border border-white/20 bg-white/90 backdrop-blur-xl z-10">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 relative z-10">Ready to find your person?</h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto mb-10 relative z-10 font-medium">Join thousands of people who stopped letting great experiences pass them by.</p>
            <a
              href={isLoggedIn ? "/events" : "/register"}
              className="bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-1 text-white font-bold px-8 py-4 rounded-full transition-all shadow-lg shadow-emerald-500/25 inline-flex items-center justify-center relative z-10"
            >
              {isLoggedIn ? "Browse events" : "Get early access - it's free"}
            </a>
          </div>
        </section>

        <footer className="py-10 px-8 md:px-12 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="text-slate-500 text-sm font-medium">© 2026 Budd. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="text-slate-500 hover:text-slate-900 text-sm font-bold transition-colors">Terms</a>
            <a href="#" className="text-slate-500 hover:text-slate-900 text-sm font-bold transition-colors">Privacy</a>
            <a href="#" className="text-slate-500 hover:text-slate-900 text-sm font-bold transition-colors">Contact</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
