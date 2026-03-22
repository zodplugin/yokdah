"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Register() {
    const [email, setEmail] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !whatsappNumber) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, whatsappNumber })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('tempToken', data.token);
                document.cookie = `token=${data.token}; path=/; max-age=604800`;
                localStorage.setItem('tempUser', JSON.stringify(data.user));
                router.push("/onboarding");
            } else {
                const data = await response.json();
                alert(data.error || 'Registration failed');
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
                <div className="w-12 h-12 bg-[var(--text)] text-white rounded-[10px] flex items-center justify-center mb-8 shadow-md">
                    <Sparkles size={24} />
                </div>

                <form onSubmit={handleSubmit} className="animate-fadeUp">
                    <h1 className="font-serif text-[36px] font-normal leading-[1.1] tracking-[-0.02em] mb-4">
                        Find your <em>people</em>
                    </h1>
                    <p className="text-[15px] text-[var(--muted2)] mb-8">
                        Create an account to start matching for the best events.
                    </p>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label htmlFor="email" className="block text-[13px] font-medium text-[var(--muted2)] mb-2 ml-1">
                                Email address
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="hello@example.com"
                                required
                                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-[15px] outline-none focus:border-[var(--accent-dark)] focus:ring-2 focus:ring-[var(--accent-dim)] transition-all"
                            />
                        </div>

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
                            <p className="text-[12px] text-[var(--muted)] mt-2 ml-1">Format: 08xxxxxxxxxx (for notifications)</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[var(--accent)] hover:bg-[var(--accent2)] text-[var(--text)] font-medium text-[15px] py-3.5 px-6 rounded-[10px] flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(184,240,64,0.25)] hover:shadow-[0_0_40px_rgba(184,240,64,0.35)] hover:-translate-y-0.5 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Continue to onboarding'}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>

                    <div className="text-center">
                        <span className="text-[14px] text-[var(--muted2)]">Already have an account? </span>
                        <Link href="/login" className="text-[14px] font-medium text-[var(--text)] hover:text-[var(--accent-text)] transition-colors">Log in</Link>
                    </div>
                </form>
            </div>
        </main>
    );
}
