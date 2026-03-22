"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!whatsappNumber) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/magic-link/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ whatsappNumber })
            });

            if (response.ok) {
                setIsSent(true);
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to send magic link');
            }
        } catch (error) {
            alert('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg2)] text-[var(--text)] font-sans">
            <Link href="/" className="absolute top-6 left-6 md:top-12 md:left-12 font-serif text-[24px] text-[var(--text)] hover:text-[var(--accent-text)] transition-colors">
                Budd
            </Link>

            <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-8 md:p-12 shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative">
                {!isSent ? (
                    <>
                        <div className="w-12 h-12 bg-[var(--accent)] text-[var(--accent-text)] rounded-[10px] flex items-center justify-center mb-8">
                            <Sparkles size={24} />
                        </div>

                        <form onSubmit={handleSubmit} className="animate-fadeUp">
                            <h1 className="font-serif text-[36px] font-normal leading-[1.1] tracking-[-0.02em] mb-4">
                                Welcome <em>back</em>
                            </h1>
                            <p className="text-[15px] text-[var(--muted2)] mb-8">
                                Enter your WhatsApp number to receive a magic link for login. No password needed!
                            </p>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label htmlFor="whatsapp" className="block text-[13px] font-medium text-[var(--muted2)] mb-2 ml-1">
                                        WhatsApp Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="whatsapp"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        placeholder="081234567890"
                                        required
                                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-[15px] outline-none focus:border-[var(--accent-dark)] focus:ring-2 focus:ring-[var(--accent-dim)] transition-all"
                                    />
                                    <p className="text-[12px] text-[var(--muted)] mt-2 ml-1">Format: 08xxxxxxxxxx</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[var(--accent)] hover:bg-[var(--accent2)] text-[var(--text)] font-medium text-[15px] py-3.5 px-6 rounded-[10px] flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(184,240,64,0.25)] hover:shadow-[0_0_40px_rgba(184,240,64,0.35)] hover:-translate-y-0.5 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Send magic link'}
                                {!isLoading && <ArrowRight size={18} />}
                            </button>

                            <div className="text-center">
                                <span className="text-[14px] text-[var(--muted2)]">Don't have an account? </span>
                                <Link href="/register" className="text-[14px] font-medium text-[var(--text)] hover:text-[var(--accent-text)] transition-colors">Sign up</Link>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="animate-fadeUp text-center">
                        <div className="w-12 h-12 bg-[var(--accent)] text-[var(--accent-text)] rounded-[10px] flex items-center justify-center mx-auto mb-8">
                            <Check size={24} />
                        </div>
                        <h1 className="font-serif text-[36px] font-normal leading-[1.1] tracking-[-0.02em] mb-4">
                            Check your <em>WhatsApp</em>
                        </h1>
                        <p className="text-[15px] text-[var(--muted2)] mb-8">
                            We've sent a magic link to your WhatsApp. Click it to log in.
                        </p>
                        <p className="text-[13px] text-[var(--muted)]">
                            The link expires in 15 minutes.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
