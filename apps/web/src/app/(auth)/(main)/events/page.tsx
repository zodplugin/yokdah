"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Flame, MapPin, Calendar, ChevronDown, Filter, X, Music, Headphones, Guitar, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

const CITIES = [
    { name: "Jakarta", country: "Indonesia" },
    { name: "Bandung", country: "Indonesia" },
    { name: "Depok", country: "Indonesia" },
    { name: "Surabaya", country: "Indonesia" },
    { name: "Bali", country: "Indonesia" },
    { name: "Ambon", country: "Indonesia" },
    { name: "Karawang", country: "Indonesia" },
    { name: "Sumbawa Besar", country: "Indonesia" },
    { name: "Jakarta Pusat", country: "Indonesia" },
    { name: "Tangerang", country: "Indonesia" },
    { name: "Pekanbaru", country: "Indonesia" },
    { name: "Cirebon", country: "Indonesia" },
    { name: "Solo", country: "Indonesia" },
    { name: "Kediri", country: "Indonesia" },
    { name: "Balikpapan", country: "Indonesia" },
    { name: "Medan", country: "Indonesia" },
    { name: "Tulungagung", country: "Indonesia" },
    { name: "Bogor", country: "Indonesia" },
    { name: "Tegal", country: "Indonesia" },
    { name: "Jombang", country: "Indonesia" },
    { name: "Jambi", country: "Indonesia" },
    { name: "Mojokerto", country: "Indonesia" },
    { name: "Batam", country: "Indonesia" },
    { name: "Cilacap", country: "Indonesia" },
    { name: "Banjarbaru", country: "Indonesia" },
    { name: "Jakarta Timur", country: "Indonesia" },
    { name: "Jakarta Selatan", country: "Indonesia" },
    { name: "Jakarta Utara", country: "Indonesia" },
    { name: "Jakarta Barat", country: "Indonesia" },
    { name: "Kota Tangerang", country: "Indonesia" },
    { name: "Kab. Bogor", country: "Indonesia" },
];

const EventImage = ({ src, alt, category }: { src?: string; alt: string; category?: string }) => {
    const [error, setError] = useState(false);
    
    const getCategoryIcon = (cat?: string) => {
        const className = "text-[var(--muted)] opacity-40";
        switch (cat?.toLowerCase()) {
            case 'concert': return <Music size={48} className={className} />;
            case 'festival': return <Guitar size={48} className={className} />;
            case 'activity': return <Target size={48} className={className} />;
            case 'sport': return <Target size={48} className={className} />;
            case 'party': return <Headphones size={48} className={className} />;
            default: return <Sparkles size={48} className={className} />;
        }
    };

    if (!src || error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--bg2)] to-[var(--bg3)] relative overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(var(--text) 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
                {getCategoryIcon(category)}
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mt-2 opacity-50">{category || 'Event'}</span>
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            onError={() => setError(true)}
            className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105" 
        />
    );
};

const CATEGORIES = [
    { name: "All", value: "" },
    { name: "Concerts", value: "concert" },
    { name: "Festivals", value: "festival" },
    { name: "Activities", value: "activity" },
    { name: "Sports", value: "sport" },
];

export default function EventsPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCity, setSelectedCity] = useState("Jakarta");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [pagination, setPagination] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }
        fetchTimeoutRef.current = setTimeout(() => {
            fetchEvents();
        }, 300); // 300ms debounce
    }, [selectedCity, selectedCategory, currentPage, searchQuery]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCity) params.append("city", selectedCity);
            if (selectedCategory) params.append("category", selectedCategory);
            if (searchQuery) params.append("name", searchQuery);
            params.append("page", currentPage.toString());
            params.append("limit", "12");

            const response: any = await api.get(`/api/events?${params.toString()}`);
            console.log('API Response:', response);
            console.log('Events data:', response.events);
            setEvents(response.events || []);
            setPagination(response.pagination);
        } catch (error) {
            console.error("Failed to fetch events:", error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handleCitySelect = (city: string) => {
        setSelectedCity(city);
        setShowCityDropdown(false);
    };

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
        setShowCategoryDropdown(false);
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const options: Intl.DateTimeFormatOptions = {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        };
        return d.toLocaleDateString("en-US", options);
    };

    const isHot = (event: any) => {
        return event.lookingCount && event.lookingCount > 10;
    };

    return (
        <div className="p-6 md:p-12 max-w-6xl mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="font-serif text-[clamp(36px,5vw,48px)] leading-[1.1] mb-2 tracking-[-0.02em]">Discover <em>events</em></h1>
                    <p className="text-[15px] text-[var(--muted2)]">Find your people before the event even starts.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-[280px]">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                        <input
                            type="text"
                            placeholder="Search artists, venues..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[100px] pl-10 pr-4 py-2.5 text-[14px] outline-none focus:border-[var(--accent-dark)] focus:ring-2 focus:ring-[var(--accent-dim)] transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Location Info Banner */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[var(--bg2)] flex items-center justify-center text-[var(--accent-dark)]">
                        <MapPin size={18} />
                    </div>
                    <div>
                        <h3 className="font-medium text-[15px] leading-tight mb-0.5">Events near {selectedCity}</h3>
                        <p className="text-[13px] text-[var(--muted2)]">Showing tailored recommendations based on your preferences and location.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCityDropdown(!showCityDropdown)}
                    className="text-[13px] font-medium text-[var(--text)] transition-colors bg-[var(--bg)] border border-[var(--border)] px-4 py-2 rounded-[100px] hover:bg-[var(--bg2)] whitespace-nowrap flex items-center gap-2"
                >
                    Change location <ChevronDown size={14} />
                </button>
            </div>

            {/* City Dropdown */}
            {showCityDropdown && (
                <div className="absolute z-50 w-full max-w-sm bg-[var(--surface)] border border-[var(--border)] rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] overflow-hidden" style={{ left: '50%', top: '320px', transform: 'translateX(-50%)' }}>
                    <div className="max-h-[400px] overflow-y-auto">
                        {CITIES.map((city) => (
                            <button
                                key={city.name}
                                onClick={() => handleCitySelect(city.name)}
                                className={`w-full text-left px-4 py-3 text-[14px] font-medium hover:bg-[var(--bg2)] transition-colors flex items-center justify-between ${selectedCity === city.name ? 'bg-[var(--accent-dim)] text-[var(--accent-text)]' : 'text-[var(--text)]'}`}
                            >
                                <span>{city.name}</span>
                                <span className="text-[12px] text-[var(--muted)] font-normal">{city.country}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-10 pb-6 border-b border-[var(--border)]">
                <div className="relative">
                    <button
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] hover:border-[var(--border2)] rounded-[100px] text-[13px] font-medium transition-all"
                    >
                        <Filter size={14} />
                        {selectedCategory || "All categories"}
                        <ChevronDown size={14} />
                    </button>

                    {showCategoryDropdown && (
                        <div className="absolute z-50 top-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-[12px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] overflow-hidden min-w-[160px]">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => handleCategorySelect(cat.value)}
                                    className={`w-full text-left px-4 py-2.5 text-[13px] font-medium hover:bg-[var(--bg2)] transition-colors ${selectedCategory === cat.value ? 'bg-[var(--accent-dim)] text-[var(--accent-text)]' : 'text-[var(--muted2)]'}`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => handleCategorySelect("")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-[100px] text-[13px] font-medium transition-all ${!selectedCategory ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-[0_0_15px_rgba(184,240,64,0.2)] hover:-translate-y-0.5 transition-transform' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] hover:border-[var(--border2)]'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => handleCategorySelect("concert")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-[100px] text-[13px] font-medium transition-all ${selectedCategory === "concert" ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-[0_0_15px_rgba(184,240,64,0.2)] hover:-translate-y-0.5 transition-transform' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] hover:border-[var(--border2)]'}`}
                    >
                        Concerts
                    </button>
                    <button
                        onClick={() => handleCategorySelect("festival")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-[100px] text-[13px] font-medium transition-all ${selectedCategory === "festival" ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-[0_0_15px_rgba(184,240,64,0.2)] hover:-translate-y-0.5 transition-transform' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] hover:border-[var(--border2)]'}`}
                    >
                        Festivals
                    </button>
                    <button
                        onClick={() => handleCategorySelect("activity")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-[100px] text-[13px] font-medium transition-all ${selectedCategory === "activity" ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-[0_0_15px_rgba(184,240,64,0.2)] hover:-translate-y-0.5 transition-transform' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] hover:border-[var(--border2)]'}`}
                    >
                        Activities
                    </button>
                    <button
                        onClick={() => handleCategorySelect("sport")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-[100px] text-[13px] font-medium transition-all ${selectedCategory === "sport" ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-[0_0_15px_rgba(184,240,64,0.2)] hover:-translate-y-0.5 transition-transform' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted2)] hover:text-[var(--text)] hover:bg-[var(--bg2)] hover:border-[var(--border2)]'}`}
                    >
                        Sports
                    </button>
                </div>
            </div>

            {/* Events Grid or Loading */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-[var(--muted)] text-[15px]">Loading events...</div>
                </div>
            ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <MapPin size={48} className="text-[var(--muted)] mb-4" />
                    <h3 className="text-[24px] font-medium mb-2 text-[var(--text)]">No events found</h3>
                    <p className="text-[15px] text-[var(--muted2)]">Try changing your location or category filter</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((ev) => (
                        <Link href={`/events/${ev.id}`} key={ev.id} className="group flex flex-col bg-[var(--surface)] border border-[var(--border)] rounded-[16px] overflow-hidden hover:border-[var(--border2)] transition-all hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1">
                            <div className="h-44 flex items-center justify-center relative overflow-hidden bg-[var(--bg2)] border-b border-[var(--border)]">
                                <EventImage src={ev.coverImage} alt={ev.name} category={ev.category} />
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-serif text-[22px] leading-[1.2] mb-3 group-hover:text-[var(--accent-text)] transition-colors">{ev.name.split('—')[0]}</h3>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--muted)] bg-[var(--bg2)] px-2.5 py-1 rounded-[4px] border border-[var(--border)]">{ev.category}</span>
                                    {isHot(ev) && <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-[100px] bg-[#ffe4e1] text-[#d63c30] border border-[#ffcdcd]"><Flame size={12} /> Hot</span>}
                                </div>

                                <div className="space-y-2.5 mb-6">
                                    <div className="flex items-center gap-2.5 text-[13px] text-[var(--muted2)] font-medium">
                                        <Calendar size={16} className="text-[var(--muted)]" /> {formatDate(ev.date)}
                                    </div>
                                    <div className="flex items-center gap-2.5 text-[13px] text-[var(--muted2)] font-medium">
                                        <MapPin size={16} className="text-[var(--muted)]" /> {ev.venue}
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--accent-text)]">
                                        <div className="w-2 h-2 rounded-full bg-[var(--accent-dark)]"></div>
                                        {ev.lookingCount || 0} finding buddies
                                    </div>
                                    <div className="w-8 h-8 rounded-[8px] bg-[var(--bg2)] border border-[var(--border)] flex items-center justify-center text-[var(--text)] group-hover:bg-[var(--accent)] group-hover:border-[var(--accent-dark)] group-hover:text-[var(--accent-text)] shadow-sm transition-colors">
                                        <span className="font-medium text-[16px]">→</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12 pb-12">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => {
                            setCurrentPage(prev => Math.max(1, prev - 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center disabled:opacity-30 hover:bg-[var(--bg2)] transition-colors"
                    >
                        <span className="text-[18px]">←</span>
                    </button>
                    <span className="text-[14px] font-medium text-[var(--muted2)]">
                        Page {currentPage} of {pagination.pages}
                    </span>
                    <button
                        disabled={currentPage === pagination.pages}
                        onClick={() => {
                            setCurrentPage(prev => Math.min(pagination.pages, prev + 1));
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center disabled:opacity-30 hover:bg-[var(--bg2)] transition-colors"
                    >
                        <span className="text-[18px]">→</span>
                    </button>
                </div>
            )}
        </div>
    );
}
