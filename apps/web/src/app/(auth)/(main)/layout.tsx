"use client";

import { Map, Users, MessageSquare, User, Settings, Bell, LogOut, Flame, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import socket from "@/lib/socket";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string, matchId: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.get<any>("/api/users/profile");
                setUser(data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker.register("/notifications-sw.js").then((reg) => {
                console.log("Service Worker registered:", reg.scope);
            }).catch((err) => {
                console.error("Service Worker registration failed:", err);
            });
        }
    }, []);

    const playNotificationSound = useCallback(() => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.debug("Audio play blocked by browser policy"));
    }, []);

    useEffect(() => {
        const handleGlobalMessage = (data: any) => {
            if (!pathname.includes(`/matches/${data.matchId}`)) {
                playNotificationSound();
                setToast({
                    message: `${data.senderName} in ${data.eventName}: ${data.message || 'New message'}`,
                    matchId: data.matchId
                });
                setTimeout(() => setToast(null), 5000);

                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                    if ("serviceWorker" in navigator) {
                        navigator.serviceWorker.ready.then((registration) => {
                            registration.showNotification(`${data.senderName} in ${data.eventName}`, {
                                body: data.message || 'New message',
                                icon: '/logo.png', // Add a valid internal icon path if available
                                data: {
                                    url: `${window.location.origin}/matches/${data.matchId}`
                                },
                                tag: `chat-${data.matchId}`, // Collapse multiple notifications from same chat
                                renotify: true
                            } as any);
                        });
                    } else {
                        new Notification(`${data.senderName} in ${data.eventName}`, {
                            body: data.message || 'New message',
                        });
                    }
                }
            }
        };
        const token = localStorage.getItem('token');
        if (token) {
            socket.connect(token);
            socket.on('global-new-message', handleGlobalMessage);
        }

        return () => {
            socket.off('global-new-message', handleGlobalMessage);
        };
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        api.clearToken();
        router.push("/");
    };

    const navItems = [
        { name: "Browse events", icon: Map, href: "/events" },
        { name: "My matches", icon: Users, href: "/matches" },
        { name: "Notifications", icon: Bell, href: "/notifications", badge: user?.unreadNotifications || 0 }
    ];

    return (
        <div className="flex bg-[var(--bg)] min-h-screen font-sans text-[var(--text)]">
            {/* Sidebar */}
            <aside className="w-[260px] bg-[var(--surface)] border-r border-[var(--border)] flex-shrink-0 flex-col hidden md:flex h-screen sticky top-0">
                <div className="p-6 pb-2">
                    <Link href="/" className="font-serif text-[28px]">Budd</Link>
                </div>

                <div className="flex-1 px-4 py-6 space-y-8">
                    <div>
                        <div className="px-3 text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--muted)] mb-3">Navigation</div>
                        <nav className="space-y-1">
                            {navItems.map(item => {
                                const active = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-colors ${active ? 'bg-[var(--accent-dim)] text-[var(--accent-text)]' : 'text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--bg2)]'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={18} />
                                            {item.name}
                                        </div>
                                        {item.badge && (
                                            <span className="bg-[#ef4444] text-white text-[11px] font-bold px-2 py-0.5 rounded-[100px] leading-none flex items-center justify-center">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div>
                        <div className="px-3 text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--muted)] mb-3">Account</div>
                        <nav className="space-y-1">
                            <Link href="/profile" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] transition-colors">
                                <User size={18} /> Profile
                            </Link>
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-[#ef4444] hover:bg-[#ef444410] transition-colors">
                                <LogOut size={18} /> Logout
                            </button>
                        </nav>
                    </div>
                </div>

                <div className="p-4 border-t border-[var(--border)]">
                    <div className="flex items-center gap-3 p-2">
                        {user?.photo ? (
                            <img src={user.photo} alt={user.displayName} className="w-8 h-8 rounded-full object-cover border border-[var(--border)]" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--bg2)] border border-[var(--border)] flex items-center justify-center"><User size={14} /></div>
                        )}
                        <div className="flex-1 overflow-hidden">
                            <div className="text-[13px] font-medium leading-none mb-1 truncate">{user?.displayName || "Loading..."}</div>
                            <div className="text-[11px] text-[var(--muted)] leading-none">Reliability: {user?.reliabilityScore || 100}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden border-l border-[var(--border)] ml-[-1px] pb-[70px] md:pb-0">
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] border-t border-[var(--border)] flex md:hidden items-center justify-around h-[70px] px-2 z-[200] pb-safe">
                {navItems.map(item => {
                    const active = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center p-2 min-w-[64px] transition-colors relative ${active ? 'text-[var(--accent-text)]' : 'text-[var(--muted2)] hover:text-[var(--text)]'}`}
                        >
                            <div className={`p-1.5 rounded-full transition-all ${active ? 'bg-[var(--accent-dim)]' : ''}`}>
                                <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
                            </div>
                            <span className="text-[10px] font-medium mt-1 uppercase tracking-[0.05em]">{item.name.split(' ')[0]}</span>
                            {item.badge && (
                                <span className="absolute top-1 right-2 bg-[#ef4444] text-white text-[10px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border-2 border-[var(--surface)]">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
                <Link
                    href="/profile"
                    className={`flex flex-col items-center justify-center p-2 min-w-[64px] transition-colors relative ${pathname === '/profile' ? 'text-[var(--accent-text)]' : 'text-[var(--muted2)]'}`}
                >
                    <div className={`p-1.5 rounded-full transition-all ${pathname === '/profile' ? 'bg-[var(--accent-dim)]' : ''}`}>
                        <User size={22} strokeWidth={pathname === '/profile' ? 2.5 : 2} />
                    </div>
                    <span className="text-[10px] font-medium mt-1 uppercase tracking-[0.05em]">Profile</span>
                </Link>
            </nav>

            {/* Global Notification Toast */}
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[300] animate-fadeDown w-[90%] md:w-auto">
                    <Link href={`/matches/${toast.matchId}`} className="bg-[var(--text)] text-[var(--bg)] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 hover:-translate-y-0.5 transition-all">
                        <Flame size={18} className="text-[var(--accent)]" />
                        <span className="text-[14px] font-medium truncate">{toast.message}</span>
                        <X size={16} className="ml-2 opacity-50 flex-shrink-0" onClick={(e) => { e.preventDefault(); setToast(null); }} />
                    </Link>
                </div>
            )}
        </div>
    );
}
