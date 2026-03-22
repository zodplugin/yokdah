"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import socket from "@/lib/socket";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [toasts, setToasts] = useState<{id: number, msg: string, link?: string}[]>([]);

  const addToast = useCallback((toastData: { msg: string, link?: string } | string) => {
    const id = Date.now();
    const newToast = typeof toastData === 'string' ? { id, msg: toastData } : { id, ...toastData };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    if (isAuthenticated && typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        socket.connect(token);

        const handleNewMessage = (data: any) => {
          const isSys = data.isSystem || data.senderId === 'system' || data.type === 'system';
          if (!isSys) {
             const mId = data.matchId || data.chatId;
             if (!window.location.pathname.includes(`/matches/${mId}`) && !window.location.pathname.includes(`/matches/${data.chatId}`)) {
                 addToast({
                     msg: `${data.senderName || 'Someone'} sent a message in ${data.eventName || 'Squad'}`,
                     link: `/matches/${mId}`
                 });
             }
          }
        };

        const handleConfirmation = (data: any) => {
           if (!window.location.pathname.includes('/matches')) {
               addToast({
                  msg: `Group update: ${data.userName} responded: ${data.status === 'going' ? "I'm in!" : "Can't go"}`,
                  link: `/matches/${data.matchId || data.chatId}`
               });
           }
        };

        const handleMemberLeft = (data: any) => {
           const mId = data.matchId || data.chatId;
           if (!window.location.pathname.includes(`/matches/${mId}`) && !window.location.pathname.includes(`/matches/${data.chatId}`)) {
               addToast({
                  msg: `Group update: ${data.userName} has left the squad.`,
                  link: `/matches/${mId}`
               });
           }
        };

        socket.on('global-new-message', handleNewMessage);
        socket.on('global-confirmation_update', handleConfirmation);
        socket.on('global-member_left', handleMemberLeft);

        return () => {
          socket.off('global-new-message', handleNewMessage);
          socket.off('global-confirmation_update', handleConfirmation);
          socket.off('global-member_left', handleMemberLeft);
        };
      }
    }
  }, [isAuthenticated, addToast]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none">
          {toasts.map(t => (
              <div 
                  key={t.id} 
                  onClick={() => t.link ? router.push(t.link) : undefined}
                  className={`bg-[var(--text)] text-[var(--bg)] px-5 py-3 rounded-[100px] text-[14px] font-medium shadow-xl animate-fadeUp pointer-events-auto ${t.link ? 'cursor-pointer hover:bg-[var(--accent)] hover:text-[var(--text)] transition-colors' : ''}`}
              >
                  {t.msg}
              </div>
          ))}
      </div>
      {children}
    </>
  );
}
