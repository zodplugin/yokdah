/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Camera, Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { uploadClient } from "@/lib/upload";

export default function Onboarding() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const totalSteps = 4;

    const vibeTags = [
        'chill',
        'hype',
        'introvert-friendly',
        'first-timer',
        'regular',
        'early bird',
        'night owl',
        'social butterfly',
        'quiet vibes',
        'adventurous',
        'spontaneous',
        'planner'
    ]

    const [formData, setFormData] = useState({
        displayName: '',
        age: '',
        gender: '',
        photo: null as File | null,
        photoPreview: '',
        vibeTags: [] as string[],
        genderPreference: 'any',
        ageMin: 18,
        ageMax: 35,
        defaultGroupSize: 'flexible'
    });

    const [tempUser, setTempUser] = useState<any>(null);

    useEffect(() => {
        const tempUserStr = localStorage.getItem('tempUser');
        if (tempUserStr) {
            setTempUser(JSON.parse(tempUserStr));
        } else {
            router.push('/login');
        }
    }, [router]);

    const nextStep = () => {
        if (step === 1) {
            if (!formData.displayName || !formData.age || !formData.gender) {
                alert('Please fill in all fields');
                return;
            }
            if (parseInt(formData.age) < 18) {
                alert('You must be at least 18 years old');
                return;
            }
        }
        if (step === 2 && !formData.photo) {
            alert('Please upload a photo');
            return;
        }
        if (step === 3 && formData.vibeTags.length === 0) {
            alert('Please select at least 1 vibe tag');
            return;
        }
        setStep(s => Math.min(s + 1, totalSteps));
    };

    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const toggleTag = (tag: string) => {
        setFormData(prev => {
            const tags = prev.vibeTags;
            if (tags.includes(tag)) {
                return { ...prev, vibeTags: tags.filter(t => t !== tag) };
            } else if (tags.length < 3) {
                return { ...prev, vibeTags: [...tags, tag] };
            }
            return prev;
        });
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validation = uploadClient.validateImage(file);

            if (!validation.valid) {
                alert(validation.error);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    photo: file,
                    photoPreview: reader.result as string
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleComplete = async () => {
        if (!tempUser) return;

        setIsLoading(true);
        try {
            let photoUrl = '';
            if (formData.photo) {
                try {
                    const uploadResult = await uploadClient.uploadImage(formData.photo);
                    photoUrl = uploadResult.url;
                } catch (uploadError: any) {
                    alert(uploadError.error || 'Failed to upload photo');
                    setIsLoading(false);
                    return;
                }
            }

            const completeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/complete-onboarding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('tempToken')}`
                },
                body: JSON.stringify({
                    displayName: formData.displayName,
                    age: formData.age,
                    gender: formData.gender,
                    photo: photoUrl,
                    vibeTags: formData.vibeTags,
                    genderPreference: formData.genderPreference,
                    ageMin: formData.ageMin,
                    ageMax: formData.ageMax,
                    defaultGroupSize: formData.defaultGroupSize
                })
            });

            if (completeResponse.ok) {
                const data = await completeResponse.json();
                localStorage.setItem('token', data.token);
                document.cookie = `token=${data.token}; path=/; max-age=604800`;
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.removeItem('tempToken');
                localStorage.removeItem('tempUser');
                // Redirect to the original destination or default to events
                const redirect = typeof window !== 'undefined'
                    ? new URLSearchParams(window.location.search).get('redirect')
                    : null;
                router.push(redirect || '/events');
            } else {
                const errorData = await completeResponse.json();
                alert(errorData.error || errorData.message || 'Failed to complete onboarding');
            }
        } catch (error) {
            console.error('Onboarding error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!tempUser) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <main className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
            {/* Top Nav */}
            <nav className="flex items-center justify-between px-6 py-6 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-4">
                    {step > 1 ? (
                        <button onClick={prevStep} className="w-10 h-10 flex items-center justify-center rounded-[10px] border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                            <ArrowLeft size={18} />
                        </button>
                    ) : (
                        <div className="w-10 h-10"></div>
                    )}
                    <Link className="flex items-center gap-2.5 text-slate-900 no-underline hover:opacity-80 transition-opacity" href="/">
                        <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-lg">B</div>
                        <span className="font-bold text-lg tracking-tight">Budd</span>
                    </Link>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                    <div className="text-[13px] text-slate-400 font-medium hidden sm:block">Step {step} of {totalSteps}</div>
                    <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`h-1.5 w-6 sm:w-8 rounded-full transition-colors duration-300 ${i <= step ? 'bg-emerald-500' : 'bg-[var(--border)]'}`} />
                        ))}
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-lg">

                    {/* STEP 1: Identity */}
                    {step === 1 && (
                        <div className="animate-fadeUp">
                            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] font-medium text-white mb-4">
                                <span className="w-4 h-px bg-[var(--accent-text)]"></span>
                                Identity
                            </div>
                            <h1 className="font-sans font-extrabold tracking-tight text-[clamp(36px,4vw,56px)] leading-[1.1] tracking-[-0.02em] mb-8">
                                Tell us about <em>yourself</em>
                            </h1>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[13px] font-medium text-slate-500 mb-2 ml-1">Display Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="What should we call you?" 
                                        value={formData.displayName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                                        maxLength={20}
                                        className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-3.5 text-[15px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                                    />
                                    <p className="text-[12px] text-slate-400 mt-1 ml-1">Max 20 characters</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[13px] font-medium text-slate-500 mb-2 ml-1">Age</label>
                                        <input 
                                            type="number" 
                                            placeholder="22" 
                                            value={formData.age}
                                            onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                                            min={18}
                                            className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-3.5 text-[15px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-medium text-slate-500 mb-2 ml-1">Gender</label>
                                        <select 
                                            value={formData.gender}
                                            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                                            className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-3.5 text-[15px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select...</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="prefer-not-to-say">Prefer not to say</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex justify-end">
                                <button onClick={nextStep} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[15px] py-3.5 px-8 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1">
                                    Continue <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Photo */}
                    {step === 2 && (
                        <div className="animate-fadeUp">
                            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] font-medium text-white mb-4">
                                <span className="w-4 h-px bg-[var(--accent-text)]"></span>
                                Appearance
                            </div>
                            <h1 className="font-sans font-extrabold tracking-tight text-[clamp(36px,4vw,56px)] leading-[1.1] tracking-[-0.02em] mb-4">
                                Put a face to the <em>name</em>
                            </h1>
                            <p className="text-[15px] text-slate-500 mb-8">
                                Upload a clear photo of yourself. This is what your future squad will see.
                            </p>

                            {formData.photoPreview ? (
                                <div className="relative">
                                    <img 
                                        src={formData.photoPreview} 
                                        alt="Preview" 
                                        className="w-full max-w-[300px] mx-auto rounded-[32px] aspect-square object-cover"
                                    />
                                    <button 
                                        onClick={() => setFormData(prev => ({ ...prev, photo: null, photoPreview: '' }))}
                                        className="absolute top-2 right-2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <label className="border-2 border-dashed border-slate-300 rounded-[32px] bg-white p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[var(--accent-dark)] hover:bg-slate-50 transition-all group">
                                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-[14px] flex items-center justify-center mb-4 text-slate-500 group-hover:text-white group-hover:bg-emerald-50 transition-colors">
                                        <Camera size={28} />
                                    </div>
                                    <div className="text-[15px] font-medium mb-1">Click to upload</div>
                                    <div className="text-[13px] text-slate-400">JPEG, PNG, or WEBP, max 5MB</div>
                                    <input 
                                        type="file" 
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </label>
                            )}

                            <div className="mt-12 flex justify-end">
                                <button onClick={nextStep} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[15px] py-3.5 px-8 rounded-full flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1">
                                    Continue <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Vibe Tags */}
                    {step === 3 && (
                        <div className="animate-fadeUp">
                            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] font-medium text-white mb-4">
                                <span className="w-4 h-px bg-[var(--accent-text)]"></span>
                                Energy
                            </div>
                            <h1 className="font-sans font-extrabold tracking-tight text-[clamp(36px,4vw,56px)] leading-[1.1] tracking-[-0.02em] mb-4">
                                What&apos;s your <em>vibe</em>?
                            </h1>
                            <p className="text-[15px] text-slate-500 mb-8">
                                Pick up to 3 tags that describe your event energy. Our matching engine relies heavily on these.
                            </p>

                            <div className="flex flex-wrap gap-3">
                                {vibeTags.map(tag => {
                                    const isSelected = formData.vibeTags.includes(tag);
                                    const isMax = formData.vibeTags.length >= 3 && !isSelected;
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            disabled={isMax}
                                            className={`
                                            px-5 py-3 rounded-[100px] border text-[14px] font-medium transition-all
                                            ${isSelected
                                                    ? 'bg-emerald-500 border-[var(--accent)] text-white shadow-[0_0_15px_rgba(184,240,64,0.2)]'
                                                    : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}
                        ${isMax ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                                        >
                                            {tag}
                                            {isSelected && <Check size={14} className="inline-block ml-2" />}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-4 text-[13px] text-slate-400">
                                {formData.vibeTags.length}/3 selected
                            </div>

                            <div className="mt-12 flex justify-end">
                                <button onClick={nextStep} disabled={formData.vibeTags.length === 0} className={`py-3.5 px-8 rounded-full flex items-center gap-2 transition-all font-bold text-[15px] ${formData.vibeTags.length > 0 ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1' : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'}`}>
                                    Continue <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Preferences */}
                    {step === 4 && (
                        <div className="animate-fadeUp">
                            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] font-medium text-white mb-4">
                                <span className="w-4 h-px bg-[var(--accent-text)]"></span>
                                Preferences
                            </div>
                            <h1 className="font-sans font-extrabold tracking-tight text-[clamp(36px,4vw,56px)] leading-[1.1] tracking-[-0.02em] mb-4">
                                Who do you want to <em>meet</em>?
                            </h1>
                            <p className="text-[15px] text-slate-500 mb-8">
                                Tell us your ideal group composition for events.
                            </p>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[15px] font-medium text-slate-900 mb-3">Buddy Gender</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { label: 'Anyone', value: 'any' },
                                            { label: 'Women only', value: 'female' },
                                            { label: 'Men only', value: 'male' }
                                        ].map(opt => (
                                            <div key={opt.value} className="relative">
                                                <input
                                                    type="radio"
                                                    id={`gender-${opt.value}`}
                                                    name="pref_gender"
                                                    value={opt.value}
                                                    checked={formData.genderPreference === opt.value}
                                                    onChange={(e) => {
                                                        console.log('Gender selected:', e.target.value);
                                                        setFormData(prev => ({ ...prev, genderPreference: e.target.value as any }));
                                                    }}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor={`gender-${opt.value}`}
                                                    className={`flex items-center justify-center px-4 py-3 bg-white border border-slate-200 rounded-[10px] cursor-pointer hover:bg-slate-50 transition-all select-none ${formData.genderPreference === opt.value ? 'border-[var(--accent-dark)] bg-emerald-50 text-white shadow-[0_0_15px_rgba(184,240,64,0.3)]' : ''}`}
                                                >
                                                    <span className="text-[14px] font-medium">{opt.label}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[15px] font-medium text-slate-900 mb-1">Age Range</label>
                                    <p className="text-[13px] text-slate-400 mb-4">We&apos;ll try our best to match you with people in this range.</p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[13px] text-slate-400 mb-2 block">Min Age</label>
                                            <input 
                                                type="number" 
                                                min={18} 
                                                max={50}
                                                value={formData.ageMin}
                                                onChange={(e) => setFormData(prev => ({ ...prev, ageMin: parseInt(e.target.value) || 18 }))}
                                                className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-3 text-[15px] outline-none focus:border-emerald-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[13px] text-slate-400 mb-2 block">Max Age</label>
                                            <input 
                                                type="number" 
                                                min={18} 
                                                max={50}
                                                value={formData.ageMax}
                                                onChange={(e) => setFormData(prev => ({ ...prev, ageMax: parseInt(e.target.value) || 35 }))}
                                                className="w-full bg-white border border-slate-200 rounded-[10px] px-4 py-3 text-[15px] outline-none focus:border-emerald-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex justify-end">
                                <button 
                                    onClick={handleComplete}
                                    disabled={isLoading}
                                    className={`bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[15px] py-3.5 px-8 rounded-full flex items-center gap-2 transition-all hover:-translate-y-1 shadow-lg shadow-emerald-500/25 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Complete Setup'}
                                    {!isLoading && <Check size={18} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
