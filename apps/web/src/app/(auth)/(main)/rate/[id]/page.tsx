"use client";

import { useState } from "react";
import { Star, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RateSquad() {
    const router = useRouter();

    // State for ratings. In real app, tied to match members
    const [ratings, setRatings] = useState<{ [key: string]: { stars: number, note: string } }>({
        "m2": { stars: 0, note: "" }, // Mika
        "m3": { stars: 0, note: "" }  // Elise
    });

    const members = [
        { id: "m2", name: "Mika R.", initial: "MR", color: "#854d0e", bg: "#fef08a" },
        { id: "m3", name: "Elise K.", initial: "EK", color: "#475569", bg: "#e2e8f0" }
    ];

    const handleStar = (memberId: string, starVal: number) => {
        setRatings(prev => ({
            ...prev,
            [memberId]: { ...prev[memberId], stars: starVal }
        }));
    };

    const handleNote = (memberId: string, noteVal: string) => {
        setRatings(prev => ({
            ...prev,
            [memberId]: { ...prev[memberId], note: noteVal }
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const allRated = Object.values(ratings).every(r => r.stars > 0);
        if (allRated) {
            router.push("/matches");
        } else {
            alert("Please give a star rating to everyone before submitting.");
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg2)] text-[var(--text)] font-sans py-12 px-4 md:px-0">
            <div className="max-w-2xl mx-auto">
                <div className="mb-10 text-center animate-fadeUp">
                    <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--accent-text)] mb-4">
                        <span className="w-4 h-px bg-[var(--accent-text)]"></span>
                        Post-event rating
                    </div>
                    <h1 className="font-serif text-[clamp(36px,5vw,56px)] leading-[1.1] mb-2 tracking-[-0.02em]">Rate your <em>squad</em></h1>
                    <p className="text-[15px] text-[var(--muted2)]">How was DGTL Amsterdam? Rating helps build a safer, better community.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {members.map((m, idx) => (
                        <div key={m.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)] animate-fadeUp" style={{ animationDelay: `${0.1 * idx}s` }}>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full border border-[var(--border)] flex items-center justify-center font-medium text-[16px] shadow-sm" style={{ backgroundColor: m.bg, color: m.color }}>{m.initial}</div>
                                <div>
                                    <h3 className="text-[18px] font-medium leading-tight mb-1">{m.name}</h3>
                                    <p className="text-[13px] text-[var(--muted2)]">Rate their vibe & reliability</p>
                                </div>
                            </div>

                            <div className="flex gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        type="button"
                                        key={star}
                                        onClick={() => handleStar(m.id, star)}
                                        className="w-12 h-12 md:w-14 md:h-14 rounded-[12px] border border-[var(--border)] bg-[var(--bg2)] flex items-center justify-center text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent-dark)] transition-all"
                                    >
                                        <Star size={24} fill={ratings[m.id].stars >= star ? "currentColor" : "none"} className={ratings[m.id].stars >= star ? "text-[#f59e0b]" : ""} />
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="block text-[13px] font-medium text-[var(--muted2)] mb-2 ml-1">Private Note (Optional)</label>
                                <textarea
                                    placeholder={`How was hanging out with ${m.name.split(' ')[0]}? (max 100 char)`}
                                    value={ratings[m.id].note}
                                    onChange={e => handleNote(m.id, e.target.value)}
                                    maxLength={100}
                                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-[12px] px-4 py-3 text-[14px] outline-none focus:border-[var(--accent-dark)] transition-all resize-none h-[80px]"
                                />
                                <div className="text-right mt-1 text-[11px] text-[var(--muted)] font-medium">{ratings[m.id].note.length}/100</div>
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-between pt-6 border-t border-[var(--border)] animate-fadeUp" style={{ animationDelay: '0.3s' }}>
                        <Link href="/events" className="text-[14px] font-medium text-[var(--muted2)] hover:text-[var(--text)] transition-colors">Skip rating</Link>
                        <button type="submit" className="bg-[var(--accent)] hover:bg-[var(--accent2)] text-[var(--text)] font-medium text-[15px] py-4 px-8 rounded-[12px] flex items-center gap-2 transition-all shadow-[0_4px_24px_rgba(184,240,64,0.25)] hover:shadow-[0_4px_32px_rgba(184,240,64,0.35)] hover:-translate-y-0.5">
                            Submit all ratings <CheckCircle size={18} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
