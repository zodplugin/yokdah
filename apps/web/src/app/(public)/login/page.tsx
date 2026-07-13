"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [errorToast, setErrorToast] = useState("");
    const router = useRouter();
    const { loginWithToken } = useAuth();

    const showError = (msg: string) => {
        setErrorToast(msg);
        setTimeout(() => setErrorToast(""), 4000);
    };

    useEffect(() => {
        const initializeGoogleSignIn = () => {
            if (typeof window !== "undefined" && (window as any).google) {
                (window as any).google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "mock-client-id",
                    callback: handleGoogleCredentialResponse,
                });
                (window as any).google.accounts.id.renderButton(
                    document.getElementById("google-signin-button"),
                    { theme: "outline", size: "large", width: "100%", shape: "pill" }
                );
            }
        };

        if ((window as any).google) {
            initializeGoogleSignIn();
        } else {
            const interval = setInterval(() => {
                if ((window as any).google) {
                    initializeGoogleSignIn();
                    clearInterval(interval);
                }
            }, 500);
            return () => clearInterval(interval);
        }
    }, []);

    const handleGoogleCredentialResponse = async (response: any) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.isNewUser) {
                    localStorage.setItem('tempToken', data.token);
                    document.cookie = `token=${data.token}; path=/; max-age=604800`;
                    localStorage.setItem('tempUser', JSON.stringify(data.user));
                    router.push("/onboarding");
                } else {
                    loginWithToken(data.token, data.user);
                    const redirect = new URLSearchParams(window.location.search).get('redirect');
                    router.push(redirect || "/events");
                }
            } else {
                const data = await res.json();
                showError(data.message || data.error || 'Google login failed');
            }
        } catch (error) {
            showError('Something went wrong with Google Login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let formattedNumber = whatsappNumber.replace(/\D/g, '');
        if (formattedNumber.startsWith('8')) {
            formattedNumber = '0' + formattedNumber;
        }
        
        if (!formattedNumber) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/magic-link/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ whatsappNumber: formattedNumber })
            });

            if (response.ok) {
                setIsSent(true);
            } else {
                const data = await response.json();
                showError(data.message || data.error || 'Failed to send magic link');
            }
        } catch (error) {
            showError('Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900 font-sans relative overflow-hidden">
            <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
            {/* Decorative Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-300/20 blur-[100px] pointer-events-none mix-blend-multiply"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-300/20 blur-[120px] pointer-events-none mix-blend-multiply"></div>
            <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-purple-300/20 blur-[80px] pointer-events-none mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
            {errorToast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] animate-fadeDown w-[90%] md:w-auto">
                    <div className="bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                        <span className="text-[14px] font-medium">{errorToast}</span>
                        <button onClick={() => setErrorToast("")} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">×</button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-md bg-white border border-slate-200 rounded-[32px] p-8 md:p-12 shadow-2xl shadow-slate-200/50 relative">
                {!isSent ? (
                    <>
                        <div className="w-12 h-12 bg-emerald-500 text-white rounded-[10px] flex items-center justify-center mb-8">
                            <Sparkles size={24} />
                        </div>

                        <form onSubmit={handleSubmit} className="animate-fadeUp">
                            <h1 className="font-sans font-extrabold tracking-tight text-[36px]  leading-[1.1] tracking-[-0.02em] mb-4">
                                Welcome <em>back</em>
                            </h1>
                            <p className="text-[15px] text-slate-500 mb-8">
                                Enter your WhatsApp number to receive a magic link for login. No password needed!
                            </p>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label htmlFor="whatsapp" className="block text-[13px] font-medium text-slate-500 mb-2 ml-1">
                                        WhatsApp Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="whatsapp"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        placeholder="081234567890"
                                        required
                                        className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-3 text-[15px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                    />
                                    <p className="text-[12px] text-slate-400 mt-2 ml-1">Format: 08xxxxxxxxxx</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[15px] py-3.5 px-6 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Send magic link'}
                                {!isLoading && <ArrowRight size={18} />}
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-[13px] uppercase">
                                    <span className="bg-white px-3 text-slate-400 font-medium">Or continue with</span>
                                </div>
                            </div>

                            <div className="mb-6 flex justify-center min-h-[44px]">
                                <div id="google-signin-button" className="w-full"></div>
                            </div>

                            <div className="text-center">
                                <span className="text-[14px] text-slate-500">Don't have an account? </span>
                                <Link href="/register" className="text-[14px] font-medium text-slate-900 hover:text-emerald-500 transition-colors">Sign up</Link>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="animate-fadeUp text-center">
                        <div className="w-12 h-12 bg-emerald-500 text-white rounded-[10px] flex items-center justify-center mx-auto mb-8">
                            <Check size={24} />
                        </div>
                        <h1 className="font-sans font-extrabold tracking-tight text-[36px]  leading-[1.1] tracking-[-0.02em] mb-4">
                            Check your <em>WhatsApp</em>
                        </h1>
                        <p className="text-[15px] text-slate-500 mb-8">
                            We've sent a magic link to your WhatsApp. Click it to log in.
                        </p>
                        <p className="text-[13px] text-slate-400">
                            The link expires in 15 minutes.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
