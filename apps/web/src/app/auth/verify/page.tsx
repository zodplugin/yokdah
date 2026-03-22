"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type VerifyStatus = "loading" | "success" | "error";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      const token = searchParams.get("token");

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
            if (data.user.isOnboardingComplete) {
              router.push("/events");
            } else {
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
  }, [searchParams, loginWithToken, router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg2)] text-[var(--text)] font-sans">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-8 md:p-12 shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-[var(--bg)] border border-[var(--border)] rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 size={32} className="animate-spin text-[var(--muted)]" />
            </div>
            <h1 className="font-serif text-[32px] font-normal leading-[1.1] tracking-[-0.02em] mb-4">
              Verifying...
            </h1>
            <p className="text-[15px] text-[var(--muted2)]">
              Please wait while we verify your magic link.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-[var(--accent)] text-[var(--accent-text)] rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="font-serif text-[32px] font-normal leading-[1.1] tracking-[-0.02em] mb-4">
              Welcome back!
            </h1>
            <p className="text-[15px] text-[var(--muted2)]">
              {message}
            </p>
            <p className="text-[13px] text-[var(--muted)] mt-4">
              Redirecting you now...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} />
            </div>
            <h1 className="font-serif text-[32px] font-normal leading-[1.1] tracking-[-0.02em] mb-4">
              Verification failed
            </h1>
            <p className="text-[15px] text-[var(--muted2)] mb-8">
              {message}
            </p>
            <button
              onClick={() => router.push("/login")}
              className="bg-[var(--accent)] hover:bg-[var(--accent2)] text-[var(--text)] font-medium text-[15px] py-3.5 px-6 rounded-[10px] flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(184,240,64,0.25)] hover:shadow-[0_0_40px_rgba(184,240,64,0.35)] mx-auto"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </main>
  );
}
