"use client";

import { Send, Image as ImageIcon, ArrowLeft, Info, MoreHorizontal, User, CheckCircle2, Timer, AlertCircle, X, Target, Flame, Loader2, Reply, Pin } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import socket from "@/lib/socket";

export default function MatchChat() {
    const params = useParams();
    const router = useRouter();
    const matchId = params.id as string;

    // UI states
    const [msg, setMsg] = useState("");
    const [showInfo, setShowInfo] = useState(false);
    const [showConfirmPrompt, setShowConfirmPrompt] = useState(false);
    const [showKickModal, setShowKickModal] = useState(false);
    const [kickTarget, setKickTarget] = useState<any>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any>(null);
    const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);
    const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
    const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ message: string, matchId?: string } | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Data states
    const [matchInfo, setMatchInfo] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // Get current user profile for "You" checks
                let user: any;
                try {
                    user = await api.get<any>('/api/users/profile');
                    setCurrentUser(user);
                } catch (e) {
                    console.error("Failed to fetch user profile", e);
                }

                if (!matchId) return;

                // 1. Fetch match details
                const matchData = await api.get<any>(`/api/matches/${matchId}`);
                setMatchInfo(matchData);
                setPinnedMessageId(matchData.pinnedMessageId || null);

                // Show confirm prompt if user is pending confirmation
                if (user && matchData) {
                    const myConfirmStatus = matchData.confirmationStatus?.[user.id];
                    if (!myConfirmStatus || myConfirmStatus === 'pending') {
                        setShowConfirmPrompt(true);
                    }
                }

                // 2. Connect to socket
                const token = localStorage.getItem('token');
                if (token && matchData.chatRoomId) {
                    socket.connect(token);
                    socket.joinChat(matchData.chatRoomId);

                    // Handle incoming messages
                    const handleNewMessage = (data: any) => {
                        const incomingId = data._id || data.timestamp || Date.now().toString();
                        const isSys = data.isSystem || data.senderId === 'system' || data.type === 'system';

                        setMessages(prev => {
                            if (prev.find(m => m._id === incomingId)) {
                                return prev;
                            }

                            const formattedMsg = {
                                _id: incomingId,
                                content: data.message || data.content,
                                photoUrl: data.photoUrl,
                                type: data.photoUrl ? 'photo' : 'text',
                                replyTo: data.replyTo || null,
                                senderId: data.senderId,
                                isSystem: isSys,
                                createdAt: data.timestamp || data.createdAt || new Date().toISOString()
                            };

                            const isNearBottom = chatContainerRef.current && (chatContainerRef.current.scrollHeight - chatContainerRef.current.scrollTop - chatContainerRef.current.clientHeight < 250);
                            if (isNearBottom) {
                                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                            }

                            return [...prev, formattedMsg];
                        });
                    };
                    socket.on('new-message', handleNewMessage);

                    const handleConfirmUpdate = (data: any) => {
                        setMatchInfo((prev: any) => {
                            if (!prev) return prev;
                            return {
                                ...prev,
                                confirmationStatus: {
                                    ...(prev.confirmationStatus || {}),
                                    [data.userId]: data.status
                                }
                            };
                        });
                    };
                    socket.on('confirmation_update', handleConfirmUpdate);

                    const handleMemberLeft = (data: any) => {
                        // Handled by global notifications now. We just need to remove them from the list if desired, though UI stays.
                    };
                    socket.on('member_left', handleMemberLeft);

                    const handleMessagePinned = (data: any) => {
                        setPinnedMessageId(data.messageId);
                    };
                    socket.on('message-pinned', handleMessagePinned);

                    const handleUserPresence = ({ userId, online }: { userId: string, online: boolean }) => {
                        setOnlineUsers(prev => {
                            const next = new Set(prev);
                            if (online) next.add(userId);
                            else next.delete(userId);
                            return next;
                        });
                    };
                    socket.on('user-presence', handleUserPresence);

                    const handleOnlineUsers = (userIds: string[]) => {
                        setOnlineUsers(new Set(userIds));
                    };
                    socket.on('online-users', handleOnlineUsers);

                    const handleGlobalMessage = (data: any) => {
                        // Only show toast if it's NOT the current chat room
                        if (data.chatId !== matchData.chatRoomId) {
                            setToast({
                                message: `New message from ${data.senderName} in ${data.eventName}`,
                                matchId: data.matchId
                            });
                            setTimeout(() => setToast(null), 5000);
                        }
                    };
                    socket.on('global-new-message', handleGlobalMessage);

                    // 3. Fetch messages
                    const msgsData = await api.get<any>(`/api/chats/${matchData.chatRoomId}/messages`);
                    if (msgsData.messages) {
                        setMessages(msgsData.messages);
                        if (msgsData.messages.length < 50) setHasMore(false);
                        setTimeout(() => messagesEndRef.current?.scrollIntoView(), 150);
                    }

                    return () => {
                        socket.off('new-message', handleNewMessage);
                        socket.off('confirmation_update', handleConfirmUpdate);
                        socket.off('member_left', handleMemberLeft);
                        socket.off('message-pinned', handleMessagePinned);
                        socket.off('user-presence', handleUserPresence);
                        socket.off('online-users', handleOnlineUsers);
                        socket.off('global-new-message', handleGlobalMessage);
                        if (matchData?.chatRoomId) {
                            socket.leaveChat(matchData.chatRoomId);
                        }
                    };
                }
            } catch (err: any) {
                console.error("Failed to load match", err.message || err);
            } finally {
                setLoading(false);
            }
        };

        if (matchId) {
            init().catch(console.error);
        }

    }, [matchId]);

    const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        if (target.scrollTop === 0 && !loadingMore && hasMore && matchInfo?.chatRoomId) {
            setLoadingMore(true);
            const firstMsg = messages[0];
            if (firstMsg) {
                const previousScrollHeight = target.scrollHeight;
                try {
                    const msgsData = await api.get<any>(`/api/chats/${matchInfo.chatRoomId}/messages?before=${new Date(firstMsg.createdAt).toISOString()}`);
                    if (msgsData.messages && msgsData.messages.length > 0) {
                        setMessages(prev => [...msgsData.messages, ...prev]);
                        if (msgsData.messages.length < 50) setHasMore(false);

                        requestAnimationFrame(() => {
                            if (chatContainerRef.current) {
                                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight - previousScrollHeight;
                            }
                        });
                    } else {
                        setHasMore(false);
                    }
                } catch (err) {
                    console.error(err);
                }
            }
            setLoadingMore(false);
        }
    };

    const submitConfirm = async (status: 'going' | 'cant_go') => {
        try {
            if (matchInfo?.chatRoomId) {
                await api.post(`/api/chats/${matchInfo.chatRoomId}/confirm`, { status });
                setShowConfirmPrompt(false);
                
                if (status === 'cant_go') {
                    router.push('/matches');
                    return;
                }

                // Refresh match data
                const matchData = await api.get<any>(`/api/matches/${matchId}`);
                setMatchInfo(matchData);
            }
        } catch (err) {
            console.error("Failed to confirm status", err);
            if (status === 'cant_go') {
                router.push('/matches');
            }
        }
    };

    const handleSendMessage = async () => {
        if ((!msg.trim() && !pendingPhoto) || !matchInfo?.chatRoomId || !currentUser) return;

        const messageContent = msg.trim();
        const photoToUpload = pendingPhoto;
        setMsg("");
        setPendingPhoto(null);
        setPendingPhotoUrl(null);
        const currentReply = replyingTo;
        setReplyingTo(null);

        try {
            let photoUrl: string | undefined;
            if (photoToUpload) {
                setIsUploading(true);
                const uploadRes = await api.upload<any>(`/api/chats/${matchInfo.chatRoomId}/upload`, photoToUpload);
                photoUrl = uploadRes.photoUrl;
                setIsUploading(false);
            }

            const newMsg = await api.post<any>(`/api/chats/${matchInfo.chatRoomId}/messages`, { content: messageContent, photoUrl, replyToId: currentReply?._id });

            socket.sendMessage(matchInfo.chatRoomId, messageContent, photoUrl, currentReply, newMsg._id);

            setMessages(prev => [...prev, {
                _id: newMsg._id || Date.now().toString(),
                content: messageContent,
                photoUrl,
                type: photoUrl ? 'photo' : 'text',
                replyToId: currentReply?._id,
                replyTo: currentReply,
                senderId: {
                    _id: currentUser.id, // from /api/users/profile
                    displayName: currentUser.displayName,
                    photo: currentUser.photo
                },
                createdAt: new Date().toISOString()
            }]);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        } catch (err) {
            console.error("Failed to send message", err);
            setMsg(messageContent);
            setPendingPhoto(photoToUpload);
            setReplyingTo(currentReply);
            setIsUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPendingPhoto(file);
        setPendingPhotoUrl(URL.createObjectURL(file));

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const togglePin = async (messageId: string) => {
        if (!matchInfo?.chatRoomId) return;
        if (!/^[0-9a-fA-F]{24}$/.test(messageId)) {
            setToast({ message: "Waiting for sync..." });
            return;
        }
        try {
            const res = await api.post<any>(`/api/chats/${matchInfo.chatRoomId}/messages/${messageId}/pin`, {});
            setPinnedMessageId(res.pinnedMessageId);
        } catch (err) {
            console.error('Failed to pin message', err);
        }
    };

    const getSenderInfo = (senderData: any) => {
        if (!senderData) return { _id: 'unknown', displayName: 'Unknown' };
        if (typeof senderData === 'string') {
            const m = matchInfo?.members?.find((m: any) => m.id === senderData);
            return { _id: senderData, displayName: m?.displayName || 'Unknown', photo: m?.photo };
        }
        return { _id: senderData._id, displayName: senderData.displayName || 'Unknown', photo: senderData.photo };
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-[var(--bg)]"><Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" /></div>;
    }

    if (!matchInfo) {
        return <div className="flex h-screen items-center justify-center bg-[var(--bg)]">Chat not found or access denied.</div>;
    }

    return (
        <div className="flex h-screen bg-[var(--bg)] font-sans text-[var(--text)]">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">
                <header className="h-auto min-h-[76px] py-3 bg-[var(--surface)] border-b border-[var(--border)] flex flex-col justify-center px-6 flex-shrink-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between w-full mb-3">
                        <div className="flex items-center gap-4">
                            <Link href="/matches" className="w-10 h-10 rounded-[10px] border border-[var(--border)] flex items-center justify-center text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] transition-colors md:hidden">
                                <ArrowLeft size={18} />
                            </Link>
                            <div>
                                <h2 className="font-serif text-[24px] md:text-[28px] leading-none mb-1">{matchInfo.event?.name || 'Squad Chat'}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {matchInfo.event?.ticketUrl && (
                                <a
                                    href={matchInfo.event.ticketUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent2)] text-[var(--accent-text)] text-[13px] font-bold rounded-[10px] transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                >
                                    <Target size={16} /> Buy Ticket
                                </a>
                            )}
                            <button className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-colors ${showInfo ? 'bg-[var(--accent-dim)] text-[var(--accent-text)]' : 'text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--bg2)]'}`} onClick={() => setShowInfo(!showInfo)}>
                                <Info size={20} />
                            </button>
                            <button className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] transition-colors hidden sm:flex">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Member Statuses */}
                    <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium">
                        {matchInfo.members?.map((m: any) => {
                            const isMe = currentUser?.id === m.id;
                            const memberStatus = matchInfo.confirmationStatus?.[m.id];
                            const isGoing = memberStatus === 'going';
                            const isOnline = onlineUsers.has(m.id);
                            return (
                                <div key={m.id} className="flex items-center gap-1.5" onClick={() => { if (!isMe) { setKickTarget(m); setShowKickModal(true); } }}>
                                    <div className="relative">
                                        <span className={`cursor-pointer ${!isMe ? "border-b border-dashed border-[var(--muted)] hover:border-[var(--text)]" : ""}`}>
                                            {isMe ? "You" : m.displayName?.split(' ')[0]}
                                        </span>
                                        {isOnline && (
                                            <span className="absolute -top-1 -right-2 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                                        )}
                                    </div>
                                    {isGoing ? (
                                        <span className="flex items-center gap-1 bg-[#dcfce7] text-[#166534] px-1.5 py-0.5 rounded-[4px] text-[10px] uppercase tracking-wider font-bold">
                                            <CheckCircle2 size={12} /> Ready
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 bg-[#fef9c3] text-[#854d0e] px-1.5 py-0.5 rounded-[4px] text-[10px] uppercase tracking-wider font-bold">
                                            <Timer size={12} /> Waiting
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </header>

                {/* Pinned Message */}
                {pinnedMessageId && (
                    <div className="bg-[var(--accent-dim)] text-[var(--accent-text)] px-6 py-2.5 flex items-center gap-3 border-b border-[var(--border)] z-10 text-[13px] sticky top-0 cursor-pointer shadow-sm transition-colors hover:bg-[var(--accent)] hover:text-white"
                        onClick={() => {
                            const el = document.getElementById(`msg-${pinnedMessageId}`);
                            if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                el.classList.add('bg-[#fef08a]', 'dark:bg-[#854d0e]', 'transition-colors', 'duration-500');
                                setTimeout(() => el.classList.remove('bg-[#fef08a]', 'dark:bg-[#854d0e]'), 2000);
                            }
                        }}>
                        <Pin size={14} className="flex-shrink-0" />
                        <div className="flex-1 truncate font-medium">
                            {messages.find(m => m._id === pinnedMessageId)?.content || "Pinned attachment"}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); togglePin(pinnedMessageId); }} className="hover:opacity-70 flex-shrink-0"><X size={14} /></button>
                    </div>
                )}

                <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[var(--bg)] custom-scrollbar">
                    {loadingMore && <div className="flex justify-center my-2"><Loader2 className="w-5 h-5 animate-spin text-[var(--muted)]" /></div>}



                    {/* Messages */}
                    {messages.map((m, i) => {
                        if (m.type === 'system' || m.isSystem || m.senderId === 'system') {
                            return (
                                <div key={m._id || i} className="flex justify-center my-6 animate-fadeUp">
                                    <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[16px] py-4 px-6 text-center max-w-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                                        <span className="mb-3 flex justify-center text-[var(--muted)]"><Flame size={20} /></span>
                                        <p className="text-[14px] text-[var(--muted2)] font-medium italic leading-relaxed">
                                            {m.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        }

                        const sender = getSenderInfo(m.senderId);
                        const isMe = sender._id === currentUser?.id;
                        const showName = !isMe && (i === 0 || getSenderInfo(messages[i - 1].senderId)._id !== sender._id);

                        return (
                            <div key={m._id || i} id={`msg-${m._id}`} className={`flex gap-3 max-w-2xl animate-fadeUp relative group transition-colors duration-500 ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>

                                {!isMe && showName ? (
                                    <div className="w-8 h-8 rounded-full border border-[var(--border)] bg-[#fef08a] flex-shrink-0 flex items-center justify-center text-[11px] font-medium text-[#854d0e] mt-1 shadow-sm overflow-hidden">
                                        {sender.photo ? <img src={sender.photo} alt="Avatar" className="w-full h-full object-cover" /> : sender.displayName?.substring(0, 2).toUpperCase()}
                                    </div>
                                ) : !isMe ? (
                                    <div className="w-8 h-8 flex-shrink-0"></div>
                                ) : null}

                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {showName && (
                                        <div className="flex items-baseline gap-2 mb-1.5 ml-1">
                                            <span className="text-[13px] font-medium">{sender.displayName}</span>
                                            <span className="text-[11px] text-[var(--muted)]">
                                                {new Date(m.createdAt || m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {isMe && (
                                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0">
                                                <button className="p-1.5 hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] rounded-full text-[var(--muted)] hover:text-[var(--text)] transition-all" onClick={() => setReplyingTo({ _id: m._id, content: m.content, senderName: sender.displayName })}>
                                                    <Reply size={15} />
                                                </button>
                                                <button className="p-1.5 hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] rounded-full text-[var(--muted)] hover:text-[var(--text)] transition-all" onClick={() => togglePin(m._id)}>
                                                    <Pin size={15} className={pinnedMessageId === m._id ? 'text-[var(--accent)] fill-current' : ''} />
                                                </button>
                                            </div>
                                        )}
                                        <div className={`border rounded-[18px] px-5 py-3 text-[15px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] whitespace-pre-wrap break-words ${isMe
                                                ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--bg)] rounded-tr-sm'
                                                : 'bg-[var(--bg2)] border-[var(--border)] text-[var(--text)] rounded-tl-sm'
                                            }`}>
                                            {m.replyTo && (
                                                <div className="text-[12px] bg-black/10 dark:bg-white/10 rounded-[8px] p-2 mb-2 border-l-[3px] border-current opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                        const el = document.getElementById(`msg-${m.replyTo._id}`);
                                                        if (el) {
                                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            el.classList.add('bg-[#fef08a]', 'dark:bg-[#854d0e]', 'transition-colors', 'duration-500');
                                                            setTimeout(() => el.classList.remove('bg-[#fef08a]', 'dark:bg-[#854d0e]'), 2000);
                                                        }
                                                    }}>
                                                    <div className="font-medium mb-0.5 truncate">{m.replyTo.senderName || m.replyTo.senderId?.displayName || 'Someone'}</div>
                                                    <div className="truncate">{m.replyTo.content || 'Photo attachment'}</div>
                                                </div>
                                            )}
                                            {m.type === 'photo' && m.photoUrl && (
                                                <img 
                                                    src={m.photoUrl} 
                                                    alt="attachment" 
                                                    className="max-w-full max-h-[300px] rounded-[12px] mb-2 object-cover block cursor-pointer hover:brightness-90 transition-all" 
                                                    onClick={() => setPreviewImage(m.photoUrl)}
                                                />
                                            )}
                                            {m.content}
                                        </div>
                                        {!isMe && (
                                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0">
                                                <button className="p-1.5 hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] rounded-full text-[var(--muted)] hover:text-[var(--text)] transition-all" onClick={() => setReplyingTo({ _id: m._id, content: m.content, senderName: sender.displayName })}>
                                                    <Reply size={15} />
                                                </button>
                                                <button className="p-1.5 hover:bg-[var(--surface)] border border-transparent hover:border-[var(--border)] rounded-full text-[var(--muted)] hover:text-[var(--text)] transition-all" onClick={() => togglePin(m._id)}>
                                                    <Pin size={15} className={pinnedMessageId === m._id ? 'text-[var(--accent)] fill-current' : ''} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Interactive Confirmation Bubble */}
                    {showConfirmPrompt && (
                        <div className="flex flex-col items-center my-6 animate-fadeUp">
                            <div className="bg-[var(--surface)] text-[var(--text)] text-[14px] px-5 py-4 rounded-[16px] shadow-sm border border-[var(--border)] max-w-[85%] text-center">
                                <p className="mb-3 font-medium">Event is coming up! Let your squad know — are you going?</p>
                                <div className="flex gap-2 justify-center">
                                    <button onClick={() => submitConfirm('going')} className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent2)] text-white text-[13px] font-semibold rounded-full transition-colors">I'm in! 🙌</button>
                                    <button onClick={() => submitConfirm('cant_go')} className="px-4 py-2 bg-[var(--bg2)] hover:bg-[var(--surface)] text-[var(--text)] text-[13px] font-medium rounded-full border border-[var(--border)] transition-colors">Can't go</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 md:p-6 bg-[var(--surface)] border-t border-[var(--border)] flex-shrink-0">
                    <div className="max-w-4xl mx-auto flex flex-col bg-[var(--bg)] border border-[var(--border)] rounded-[16px] focus-within:border-[var(--accent-dark)] focus-within:ring-2 focus-within:ring-[var(--accent-dim)] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                        {replyingTo && (
                            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg2)] rounded-t-[16px] text-[13px] text-[var(--muted2)]">
                                <div className="flex-1 truncate mr-2">Replying to <span className="font-medium text-[var(--text)]">{replyingTo.senderName || 'Someone'}</span>: {replyingTo.content || 'Photo'}</div>
                                <button onClick={() => setReplyingTo(null)} className="hover:text-[var(--text)] flex-shrink-0"><X size={14} /></button>
                            </div>
                        )}
                        {pendingPhotoUrl && (
                            <div className="relative p-4 border-b border-[var(--border)] bg-[var(--bg)] rounded-t-[16px] flex justify-center">
                                <button onClick={() => { setPendingPhoto(null); setPendingPhotoUrl(null); }} className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10">
                                    <X size={16} />
                                </button>
                                <img src={pendingPhotoUrl} alt="Preview" className="max-h-[200px] rounded-[12px] object-cover border border-[var(--border)] shadow-sm" />
                            </div>
                        )}
                        <div className="flex items-end gap-3 p-2">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                            <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg2)] rounded-[12px] transition-colors disabled:opacity-50">
                                {isUploading ? <Loader2 size={22} className="animate-spin" /> : <ImageIcon size={22} />}
                            </button>
                            <textarea
                                value={msg}
                                onChange={e => setMsg(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder="Message squad..."
                                className="flex-1 bg-transparent max-h-[120px] min-h-[44px] resize-none outline-none py-2.5 text-[15px] font-medium custom-scrollbar"
                                rows={Math.max(1, Math.min(msg.split('\n').length, 4))}
                            />
                            <button onClick={handleSendMessage} disabled={isUploading} className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-[12px] transition-all shadow-sm ${msg.trim() || pendingPhoto || isUploading ? 'bg-[var(--text)] text-white hover:bg-[#202517] hover:-translate-y-0.5 shadow-md' : 'bg-[var(--bg2)] text-[var(--muted)] border border-[var(--border)] cursor-not-allowed'}`}>
                                <Send size={18} className={msg.trim() || pendingPhoto ? "ml-1" : ""} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Squad Info */}
            <aside className={`fixed inset-0 z-[150] lg:relative lg:z-0 lg:flex lg:w-[320px] bg-[var(--surface)] border-l border-[var(--border)] flex-shrink-0 flex-col h-full transform transition-transform duration-300 ${showInfo ? 'translate-x-0' : 'translate-x-full lg:hidden'}`}>
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-[16px] mb-1">Squad Details</h3>
                        <p className="text-[13px] text-[var(--muted2)]">Event: {matchInfo.event?.name}</p>
                    </div>
                    <button onClick={() => setShowInfo(false)} className="w-10 h-10 rounded-full hover:bg-[var(--bg2)] flex items-center justify-center lg:hidden">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {matchInfo.event?.ticketUrl && (
                        <div className="mb-4">
                            <a
                                href={matchInfo.event.ticketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#374151] text-[13px] font-bold rounded-[10px] transition-all border border-[#d1d5db]"
                            >
                                <Target size={16} /> Official Ticket Link
                            </a>
                        </div>
                    )}

                    <div>
                        <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--muted)] mb-4">Members ({matchInfo.members?.length})</div>
                        <div className="space-y-3">
                            {matchInfo.members?.map((m: any) => {
                                const isOnline = onlineUsers.has(m.id);
                                return (
                                    <div key={m.id} className="flex items-center justify-between group cursor-pointer" onClick={() => { if (m.id !== currentUser?.id) { setKickTarget(m); setShowKickModal(true); } }}>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-9 h-9 rounded-full bg-[#fef08a] border border-[var(--border)] flex items-center justify-center font-medium text-[12px] text-[#854d0e] overflow-hidden shadow-sm">
                                                    {m.photo ? <img src={m.photo} alt="" className="w-full h-full object-cover" /> : m.displayName?.substring(0, 2).toUpperCase()}
                                                </div>
                                                {isOnline && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--surface)]"></span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-[14px] font-medium leading-tight group-hover:text-[var(--accent-text)] transition-colors">
                                                    {m.displayName} {m.id === currentUser?.id && "(You)"}
                                                </div>
                                                <div className="text-[11px] text-[var(--muted2)]">Reliability: {m.reliabilityScore || 100}%</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {messages.filter(m => m.photoUrl).length > 0 && (
                        <div>
                            <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--muted)] mb-4">Shared Media</div>
                            <div className="grid grid-cols-3 gap-2">
                                {messages.filter(m => m.photoUrl).slice(-9).reverse().map((m, idx) => (
                                    <div
                                        key={m._id || idx}
                                        className="aspect-square rounded-[10px] overflow-hidden border border-[var(--border)] cursor-pointer hover:opacity-80 transition-opacity bg-[var(--bg2)]"
                                        onClick={() => setPreviewImage(m.photoUrl)}
                                    >
                                        <img src={m.photoUrl} alt="media" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Vote Kick Modal */}
            {showKickModal && kickTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowKickModal(false)}></div>
                    <div className="bg-[var(--surface)] w-full max-w-[400px] rounded-[24px] border border-[var(--border)] shadow-2xl relative z-10 p-8 animate-fadeUp">
                        <button className="absolute top-5 right-5 text-[var(--muted)] hover:text-[var(--text)] transition-colors" onClick={() => setShowKickModal(false)}><X size={20} /></button>
                        <h3 className="font-serif text-[32px] leading-[1.1] mb-2">Request removal</h3>
                        <p className="text-[14px] text-[var(--muted2)] mb-6">Are you sure you want to request removing <strong>{kickTarget.displayName}</strong> from this group? This will trigger a majority vote.</p>

                        <div className="space-y-4 mb-8">
                            <label className="block text-[13px] font-medium text-[var(--muted2)] ml-1">Reason for removal</label>
                            <select className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-[14px] outline-none focus:border-[var(--accent-dark)] transition-all appearance-none cursor-pointer">
                                <option>Not responding / Ghosting</option>
                                <option>Inappropriate messages</option>
                                <option>Making others uncomfortable</option>
                                <option>Spam</option>
                                <option>Other</option>
                            </select>
                            <textarea placeholder="Optional details (max 100 char)" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-[14px] outline-none focus:border-[var(--accent-dark)] transition-all resize-none h-[80px]" maxLength={100}></textarea>
                        </div>

                        <button onClick={() => setShowKickModal(false)} className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-medium text-[15px] py-3.5 rounded-[10px] transition-all shadow-[0_4px_12px_rgba(239,68,68,0.25)] hover:-translate-y-0.5">Submit Request</button>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {toast && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[250] animate-fadeDown">
                    <div className="bg-[var(--text)] text-[var(--bg)] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                        <Flame size={18} className="text-[var(--accent)]" />
                        <span className="text-[14px] font-medium">{toast.message}</span>
                        <X size={16} className="ml-2 opacity-50 cursor-pointer" onClick={() => setToast(null)} />
                    </div>
                </div>
            )}

            {/* Image Preview Lightbox */}
            {previewImage && (
                <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 md:p-12 animate-fadeIn" onClick={() => setPreviewImage(null)}>
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors" onClick={() => setPreviewImage(null)}>
                        <X size={32} />
                    </button>
                    <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                        <img 
                            src={previewImage} 
                            alt="Full preview" 
                            className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-[8px]" 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
