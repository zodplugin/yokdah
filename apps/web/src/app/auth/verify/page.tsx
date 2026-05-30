"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type VerifyStatus = "loading" | "success" | "error";

export default function VerifyPage() {
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("");
  const isVerifiedRef = useRef(false);

  useEffect(() => {
    // Prevent infinite loop - only run verification once
    if (isVerifiedRef.current) {
      return;
    }

    const verifyToken = async () => {
      const token = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("token")
        : null;

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/magic-link/verify`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();

          // Update auth context directly
          loginWithToken(data.token, data.user);

          setStatus("success");
          setMessage("Successfully logged in!");

          // Redirect after a short delay
          setTimeout(() => {
            if (data.user.onboardingCompleted) {
              router.push("/events");
            } else {
              localStorage.setItem('tempToken', data.token);
              localStorage.setItem('tempUser', JSON.stringify({ email: data.user.email, whatsappNumber: data.user.whatsappNumber }));
              router.push("/onboarding");
            }
          }, 1500);
        } else {
          const errorData = await response.json();
          setStatus("error");
          setMessage(errorData.error || "Verification failed");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verifyToken();
    isVerifiedRef.current = true;
  }, [loginWithToken, router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-900 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-[32px] p-8 md:p-12 shadow-2xl shadow-slate-200/50 text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 size={32} className="animate-spin text-slate-400" />
            </div>
            <h1 className="font-sans font-extrabold tracking-tight text-[32px]  leading-[1.1] tracking-[-0.02em] mb-4">
              Verifying...
            </h1>
            <p className="text-[15px] text-slate-500">
              Please wait while we verify your magic link.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="font-sans font-extrabold tracking-tight text-[32px]  leading-[1.1] tracking-[-0.02em] mb-4">
              Welcome back!
            </h1>
            <p className="text-[15px] text-slate-500">
              {message}
            </p>
            <p className="text-[13px] text-slate-400 mt-4">
              Redirecting you now...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} />
            </div>
            <h1 className="font-sans font-extrabold tracking-tight text-[32px]  leading-[1.1] tracking-[-0.02em] mb-4">
              Verification failed
            </h1>
            <p className="text-[15px] text-slate-500 mb-8">
              {message}
            </p>
            <button
              onClick={() => router.push("/login")}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[15px] py-3.5 px-8 rounded-full flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 mx-auto"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </main>
  );
}
