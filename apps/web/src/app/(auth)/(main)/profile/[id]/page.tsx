"use client";

import { ShieldCheck, MapPin, Calendar, Users, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PublicProfile() {
    const params = useParams();

    // Public profile shouldn't show exact email or reliability score number
    return (
        <div className="p-6 md:p-12 max-w-3xl mx-auto min-h-screen">
            <Link href="/matches/1" className="inline-flex items-center gap-2 text-[14px] font-medium text-[var(--muted2)] hover:text-[var(--text)] mb-8 transition-colors">
                ← Back to chat
            </Link>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.02)] mb-8">
                <div className="p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="w-32 h-32 rounded-full bg-[#fef08a] border-4 border-[var(--bg)] flex-shrink-0 flex items-center justify-center font-medium text-[36px] text-[#854d0e] shadow-sm">MR</div>

                    <div className="text-center md:text-left flex-1">
                        <h1 className="font-serif text-[clamp(36px,5vw,48px)] leading-none mb-2">Mika R.</h1>
                        <p className="text-[15px] text-[var(--muted2)] mb-6">Female, 24 <span className="mx-2">•</span> Amsterdam</p>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
                            <span className="flex items-center gap-1.5 bg-[#fef9c3] border border-[#fde047] text-[#854d0e] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] rounded-[100px]">
                                <AlertTriangle size={14} /> Low Reliability
                            </span>
                            <span className="flex items-center gap-1.5 bg-[var(--accent-dim)] border border-[var(--accent)] text-[var(--accent-text)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] rounded-[100px]">
                                <ShieldCheck size={14} /> Verified ID
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 max-w-sm">
                            <div className="bg-[var(--bg2)] rounded-[12px] p-4 text-center md:text-left">
                                <div className="font-serif text-[28px] leading-none mb-1 text-[var(--text)]">8</div>
                                <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[var(--muted)]">Events Attended</div>
                            </div>
                            <div className="bg-[var(--bg2)] rounded-[12px] p-4 text-center md:text-left">
                                <div className="text-[14px] font-medium mb-1 flex items-center justify-center md:justify-start gap-1"><Calendar size={14} /> Nov '25</div>
                                <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[var(--muted)]">Member Since</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 lg:p-8">
                    <h3 className="font-serif text-[28px] leading-none mb-4">Event Vibe</h3>
                    <p className="text-[14px] text-[var(--muted2)] mb-6 leading-relaxed">Mika's usual energy when attending events and festivals.</p>

                    <div className="flex flex-wrap gap-2">
                        <span className="px-4 py-2 bg-[var(--bg2)] border border-[var(--border)] rounded-[100px] text-[13px] font-medium text-[var(--text)]">hype</span>
                        <span className="px-4 py-2 bg-[var(--bg2)] border border-[var(--border)] rounded-[100px] text-[13px] font-medium text-[var(--text)]">first-timer</span>
                    </div>
                </div>

                <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-[20px] p-6 lg:p-8">
                    <h3 className="font-serif text-[24px] text-[#881337] leading-none mb-2">Notice</h3>
                    <p className="text-[14px] text-[#9f1239] mb-6 leading-relaxed">This user has a history of last-minute cancellations or not responding to group confirmations.</p>

                    <button className="text-[12px] font-medium uppercase tracking-[0.05em] px-4 py-2 bg-[#ffe4e6] text-[#be123c] rounded-[12px] border border-[#fecdd3] hover:bg-[#fecdd3] transition-colors">
                        Report Profile
                    </button>
                </div>
            </div>
        </div>
    );
}
