"use client";

import { Settings, ShieldCheck, MapPin, Map, Edit3, Image as ImageIcon, Loader2, X, Plus, Check, Camera } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";

export default function Profile() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Edit states
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [isEditingPrefs, setIsEditingPrefs] = useState(false);
    
    // Form fields
    const [editName, setEditName] = useState("");
    const [editTags, setEditTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState("");
    const [prefs, setPrefs] = useState({
        genderPreference: 'any',
        ageMin: 18,
        ageMax: 50,
        defaultGroupSize: 4
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data: any = await api.get('/api/users/profile');
            setUser(data);
            setEditName(data.displayName);
            setEditTags(data.vibeTags || []);
            setPrefs({
                genderPreference: data.genderPreference || 'any',
                ageMin: data.ageMin || 18,
                ageMax: data.ageMax || 50,
                defaultGroupSize: data.defaultGroupSize || 4
            });
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleUpdateProfile = async (updates: any) => {
        try {
            setIsSaving(true);
            const updatedUser: any = await api.patch('/api/users/profile', updates);
            setUser(prev => ({ ...prev, ...updatedUser }));
            setIsEditingName(false);
            setIsEditingTags(false);
            setIsEditingPrefs(false);
        } catch (error) {
            console.error("Failed to update profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsSaving(true);
            const res: any = await api.upload('/api/users/photo', file);
            setUser(prev => ({ ...prev, photo: res.photoUrl }));
        } catch (error) {
            console.error("Failed to upload photo:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const addTag = () => {
        if (newTag.trim() && !editTags.includes(newTag.trim().toLowerCase())) {
            setEditTags([...editTags, newTag.trim().toLowerCase()]);
            setNewTag("");
        }
    };

    const removeTag = (tag: string) => {
        setEditTags(editTags.filter(t => t !== tag));
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
            </div>
        );
    }

    if (!user) return <div className="p-12 text-center">User not found.</div>;

    const initials = user.displayName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "??";

    return (
        <div className="p-6 md:p-12 max-w-5xl mx-auto min-h-screen">
            <div className="flex items-start justify-between mb-12">
                <h1 className="font-serif text-[clamp(36px,5vw,48px)] leading-[1.1] mb-2 tracking-[-0.02em]">Your <em>profile</em></h1>
                <Link href="#" className="w-10 h-10 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted2)] flex items-center justify-center hover:bg-[var(--bg2)] hover:text-[var(--text)] transition-all">
                    <Settings size={18} />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Column - Card & Badges */}
                <div className="space-y-6">
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative">
                        <div className="h-[120px] w-full bg-[#f1f5f9] relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--border)] to-transparent opacity-50"></div>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSaving}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur border border-[rgba(0,0,0,0.1)] flex items-center justify-center text-[#475569] hover:bg-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Camera size={18} />}
                            </button>
                        </div>

                        <div className="px-6 pb-8 pt-0 relative flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full bg-white border-4 border-[var(--surface)] -mt-12 flex items-center justify-center font-medium text-[28px] text-[var(--muted2)] shadow-sm relative overflow-hidden">
                                {user.photo ? (
                                    <img src={user.photo} alt={user.displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="bg-[#cbd5e1] w-full h-full flex items-center justify-center text-white">{initials}</div>
                                )}
                            </div>

                            <div className="mt-4 text-center w-full px-4">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 mb-2">
                                        <input 
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-[8px] px-3 py-1 text-[18px] font-medium outline-none focus:border-[var(--accent)]"
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && handleUpdateProfile({ displayName: editName })}
                                        />
                                        <button onClick={() => handleUpdateProfile({ displayName: editName })} className="p-1.5 bg-[var(--accent)] text-white rounded-[8px] hover:bg-[var(--accent-dark)] transition-colors">
                                            <Check size={16} />
                                        </button>
                                        <button onClick={() => { setIsEditingName(false); setEditName(user.displayName); }} className="p-1.5 bg-[#f3f4f6] text-[#6b7280] rounded-[8px] hover:bg-[#e5e7eb] transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="group relative">
                                        <h2 className="text-[20px] font-medium leading-tight mb-1">{user.displayName}</h2>
                                        <button onClick={() => setIsEditingName(true)} className="absolute -top-1 -right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--muted)] hover:text-[var(--text)]">
                                            <Edit3 size={14} />
                                        </button>
                                    </div>
                                )}
                                <p className="text-[13px] text-[var(--muted2)] capitalize">{user.gender || 'Unknown'}, {user.age || '??'} <span className="mx-1.5">•</span> Jakarta</p>
                            </div>

                            <div className="mt-6 w-full flex gap-2 justify-center">
                                <span className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] rounded-[100px] border ${user.reliabilityScore >= 90 ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent-text)]' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                    <ShieldCheck size={14} /> {user.reliabilityScore >= 90 ? 'Reliable' : 'Risk'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 lg:p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[14px] font-medium font-serif text-[18px]">Vibe Tags</h3>
                            {!isEditingTags && (
                                <button onClick={() => setIsEditingTags(true)} className="text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                                    <Edit3 size={14} />
                                </button>
                            )}
                        </div>
                        
                        {isEditingTags ? (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {editTags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg2)] border border-[var(--accent)] text-[var(--accent-text)] rounded-[100px] text-[12px] font-medium animate-fadeUp">
                                            {tag}
                                            <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={12}/></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        placeholder="Add tag (e.g. coffee, gaming)"
                                        value={newTag}
                                        onChange={e => setNewTag(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addTag()}
                                        className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-[8px] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
                                    />
                                    <button onClick={addTag} className="p-2 bg-[var(--accent)] text-white rounded-[8px] hover:bg-[var(--accent-dark)] transition-all">
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                                    <button onClick={() => handleUpdateProfile({ vibeTags: editTags })} className="flex-1 py-1.5 bg-[var(--text)] text-white rounded-[8px] text-[12px] font-bold hover:bg-[#202517] transition-all">Save Tags</button>
                                    <button onClick={() => { setIsEditingTags(false); setEditTags(user.vibeTags || []); }} className="px-4 py-1.5 bg-[#f3f4f6] text-[#6b7280] rounded-[8px] text-[12px] font-medium hover:bg-[#e5e7eb] transition-all">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {user.vibeTags?.length > 0 ? user.vibeTags.map((tag: string) => (
                                    <span key={tag} className="px-3 py-1.5 bg-[var(--bg2)] border border-[var(--border)] rounded-[100px] text-[12px] font-medium text-[var(--muted2)]">
                                        {tag}
                                    </span>
                                )) : (
                                    <p className="text-[13px] text-[var(--muted)] italic">No tags added yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Stats & Preferences */}
                <div className="md:col-span-2 space-y-8">

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-5 text-center shadow-sm">
                            <div className="font-serif text-[40px] leading-none mb-1 text-[var(--text)]">{user.reliabilityScore}</div>
                            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[var(--muted)]">Reliability</div>
                        </div>
                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-5 text-center shadow-sm">
                            <div className="font-serif text-[40px] leading-none mb-1 text-[var(--text)]">{user.ratingAvg || '0'}</div>
                            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[var(--muted)]">Avg Rating</div>
                        </div>
                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-5 text-center shadow-sm">
                            <div className="font-serif text-[40px] leading-none mb-1 text-[var(--text)]">{user.eventsAttended || '0'}</div>
                            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[var(--muted)]">Squads Joined</div>
                        </div>
                        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-5 text-center shadow-sm">
                            <div className="font-serif text-[40px] leading-none mb-1 text-[var(--text)]">{user.ratingCount || '0'}</div>
                            <div className="text-[11px] uppercase tracking-[0.05em] font-medium text-[var(--muted)]">Ratings</div>
                        </div>
                    </div>

                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 lg:p-8 relative overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-serif text-[28px] leading-none">Match Preferences</h3>
                            {!isEditingPrefs && (
                                <button onClick={() => setIsEditingPrefs(true)} className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--bg2)] transition-all">
                                    <Edit3 size={18} />
                                </button>
                            )}
                        </div>

                        {isEditingPrefs ? (
                            <div className="space-y-8 max-w-xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-wider">Buddy Gender</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['any', 'male', 'female'].map(g => (
                                                <button 
                                                    key={g}
                                                    onClick={() => setPrefs({...prefs, genderPreference: g})}
                                                    className={`py-2 text-[13px] font-medium rounded-[8px] border transition-all capitalize ${prefs.genderPreference === g ? 'bg-[var(--text)] text-white border-[var(--text)] shadow-md' : 'bg-[var(--bg)] border-[var(--border)] text-[var(--muted2)] hover:border-[var(--muted)]'}`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-wider">Default Squad Size</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[3, 4, 5].map(s => (
                                                <button 
                                                    key={s}
                                                    onClick={() => setPrefs({...prefs, defaultGroupSize: s})}
                                                    className={`py-2 text-[13px] font-medium rounded-[8px] border transition-all ${prefs.defaultGroupSize === s ? 'bg-[var(--text)] text-white border-[var(--text)] shadow-md' : 'bg-[var(--bg)] border-[var(--border)] text-[var(--muted2)] hover:border-[var(--muted)]'}`}
                                                >
                                                    {s} members
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-wider">Age Range</label>
                                        <span className="text-[14px] font-medium">{prefs.ageMin} - {prefs.ageMax} yrs</span>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <input 
                                            type="range" min="18" max="60" value={prefs.ageMin} 
                                            onChange={e => setPrefs({...prefs, ageMin: parseInt(e.target.value), ageMax: Math.max(parseInt(e.target.value), prefs.ageMax)})}
                                            className="flex-1 accent-[var(--accent)]" 
                                        />
                                        <input 
                                            type="range" min="18" max="60" value={prefs.ageMax} 
                                            onChange={e => setPrefs({...prefs, ageMax: parseInt(e.target.value), ageMin: Math.min(parseInt(e.target.value), prefs.ageMin)})}
                                            className="flex-1 accent-[var(--accent)]" 
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-6 border-t border-[var(--border)]">
                                    <button 
                                        onClick={() => handleUpdateProfile(prefs)}
                                        disabled={isSaving}
                                        className="flex-1 py-3.5 bg-[var(--text)] text-white rounded-[12px] text-[14px] font-bold hover:bg-[#202517] transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSaving && <Loader2 size={16} className="animate-spin" />} Save Preferences
                                    </button>
                                    <button onClick={() => setIsEditingPrefs(false)} className="px-8 py-3.5 bg-[#f3f4f6] text-[#6b7280] rounded-[12px] text-[14px] font-medium hover:bg-[#e5e7eb] transition-all">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 max-w-sm">
                                <div className="border-b border-[var(--border)] pb-6 hover:border-[var(--muted)] transition-colors">
                                    <div className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-[0.1em] mb-3">Ideal Group Size</div>
                                    <div className="text-[18px] font-medium">Squad of {user.defaultGroupSize || 4} <span className="text-[14px] text-[var(--muted)] font-normal ml-1">(1 + { (user.defaultGroupSize || 4) - 1 })</span></div>
                                </div>
                                <div className="border-b border-[var(--border)] pb-6 hover:border-[var(--muted)] transition-colors">
                                    <div className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-[0.1em] mb-3">Buddy Gender</div>
                                    <div className="text-[18px] font-medium capitalize">{user.genderPreference === 'any' ? 'Everyone welcome' : `${user.genderPreference} only`}</div>
                                </div>
                                <div className="hover:border-[var(--muted)] transition-colors">
                                    <div className="text-[12px] font-bold text-[var(--muted)] uppercase tracking-[0.1em] mb-3">Age Range</div>
                                    <div className="text-[18px] font-medium">{user.ageMin || 18} - {user.ageMax || 50} years old</div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
