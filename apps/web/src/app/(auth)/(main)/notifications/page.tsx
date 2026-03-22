"use client";

import { Bell, Check, Users, ShieldAlert, Star, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response: any = await api.get('/api/notifications');
            setNotifications(response.notifications || []);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAllRead = async () => {
        try {
            await api.post('/api/notifications/read-all', {});
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Failed to mark all read:", error);
        }
    };

    const markAsRead = async (id: string) => {
        const notif = notifications.find(n => n._id === id);
        if (notif && notif.isRead) return;

        try {
            await api.patch(`/api/notifications/${id}/read`, {});
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getTimeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    const getIconConfig = (type: string) => {
        switch (type) {
            case 'match_found':
                return { icon: Users, color: "text-[#10b981]", bg: "bg-[#dcfce7]", link: "/matches" };
            case 'confirmation_req':
                return { icon: Bell, color: "text-[#f59e0b]", bg: "bg-[#fef3c7]", link: "/matches" };
            case 'new_message':
                return { icon: MessageSquare, color: "text-[#3b82f6]", bg: "bg-[#dbeafe]", link: "/matches" };
            case 'rating_request':
                return { icon: Star, color: "text-[#8b5cf6]", bg: "bg-[#ede9fe]", link: "/matches" };
            case 'reliability_warn':
            case 'account_locked':
                return { icon: ShieldAlert, color: "text-[#ef4444]", bg: "bg-[#fee2e2]", link: "/profile" };
            default:
                return { icon: Bell, color: "text-[var(--muted2)]", bg: "bg-[var(--bg3)]", link: "/matches" };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="font-serif text-[clamp(36px,5vw,48px)] leading-[1.1] mb-2 tracking-[-0.02em]">Your <em>notifications</em></h1>
                    <p className="text-[15px] text-[var(--muted2)]">Stay updated on your matches and events.</p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="text-[13px] font-medium text-[var(--text)] hover:text-[var(--accent-dark)] flex items-center gap-1.5 transition-colors bg-[var(--surface)] border border-[var(--border)] px-4 py-2 rounded-[10px] hover:bg-[var(--bg2)] self-start md:self-auto"
                    >
                        <Check size={16} /> Mark all read
                    </button>
                )}
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="divide-y divide-[var(--border)]">
                    {notifications.map((notif) => {
                        const config = getIconConfig(notif.type);
                        const link = notif.data?.matchId ? `/matches/${notif.data.matchId}` : (notif.data?.chatRoomId ? `/matches/${notif.data.chatRoomId}` : config.link);
                        
                        return (
                            <div
                                key={notif._id}
                                onClick={() => markAsRead(notif._id)}
                                className={`p-5 md:p-6 transition-colors flex gap-4 md:gap-5 ${!notif.isRead ? 'bg-[var(--bg)] hover:bg-[var(--bg2)] cursor-pointer' : 'bg-[var(--surface)] opacity-70'}`}
                            >
                                <div className={`w-12 h-12 flex-shrink-0 rounded-[14px] flex items-center justify-center ${config.bg} ${config.color} shadow-sm border border-[rgba(0,0,0,0.05)] mt-0.5`}>
                                    <config.icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4 mb-1">
                                        <Link href={link} className={`text-[15px] font-medium truncate hover:text-[var(--accent-text)] transition-colors ${!notif.isRead ? 'text-[var(--text)]' : 'text-[var(--muted2)]'}`}>
                                            {notif.title}
                                        </Link>
                                        <span className="text-[12px] text-[var(--muted)] flex-shrink-0 whitespace-nowrap">{getTimeAgo(notif.createdAt)}</span>
                                    </div>
                                    <p className="text-[14px] text-[var(--muted2)] line-clamp-1">
                                        {notif.message}
                                    </p>
                                </div>
                                {!notif.isRead && (
                                    <div className="flex-shrink-0 flex items-center">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-sm"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {notifications.length === 0 && (
                        <div className="p-12 text-center text-[var(--muted2)]">
                            <Bell size={32} className="mx-auto mb-4 opacity-50" />
                            <p className="text-[15px] font-medium">No notifications yet.</p>
                            <p className="text-[14px]">When you join events, they'll appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
