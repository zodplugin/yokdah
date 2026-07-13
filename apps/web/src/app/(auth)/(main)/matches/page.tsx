"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Clock, ArrowRight, X, ArrowLeft, Search, User, Calendar, Hash, CheckCircle2, AlertCircle, Loader2, Music, Headphones, Guitar, Sparkles, Target, Filter, ChevronDown, MapPin, Heart, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import socket from "@/lib/socket";
import { motion, AnimatePresence } from "framer-motion";

interface Event {
  _id: string;
  name: string;
  date: string;
  category: string;
  city: string;
  coverImage?: string;
  image?: string;
  venue?: string;
}

interface MatchRequest {
  _id: string;
  eventId: {
    _id: string;
    name: string;
    date: string;
    category: string;
    city: string;
    venue?: string;
    coverImage?: string;
    image?: string;
  };
  status: 'pending' | 'matched' | 'confirmed' | 'cancelled';
  groupSize: string;
  createdAt: string;
  matchId?: string;
  chatRoomId?: string;
  unreadCount?: number;
  funInfo?: string;
  members?: {
    id: string;
    displayName: string;
    photo: string;
    reliabilityScore: number;
  }[];
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface ApiRequestsResponse {
  requests: MatchRequest[];
  pagination: PaginationData;
}

interface ApiMatchResponse {
  id: string;
  event: Event;
  status: 'matched' | 'confirmed';
  unreadCount: number;
  funInfo?: string;
  members: {
    id: string;
    displayName: string;
    photo: string;
    reliabilityScore: number;
  }[];
  chatRoomId: string;
}


const EventImage = ({ src, alt, category }: { src?: string; alt: string; category?: string }) => {
  const [error, setError] = useState(false);

  const getCategoryIcon = (cat?: string) => {
    const className = "text-slate-400 opacity-40";
    switch (cat?.toLowerCase()) {
      case 'concert': return <Music size={32} className={className} />;
      case 'festival': return <Guitar size={32} className={className} />;
      case 'activity': return <Target size={32} className={className} />;
      case 'sport': return <Target size={32} className={className} />;
      case 'party': return <Headphones size={32} className={className} />;
      default: return <Sparkles size={32} className={className} />;
    }
  };

  if (!src || error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(var(--text) 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
        {getCategoryIcon(category)}
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

export default function MatchesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get("eventId");

  // Find Squad form states
  const [groupSize, setGroupSize] = useState<string>('1+1');
  const [genderPreference, setGenderPreference] = useState<'any' | 'female' | 'male'>('any');
  const [ageMin, setAgeMin] = useState<number>(18);
  const [ageMax, setAgeMax] = useState<number>(30);
  const [vibeTags, setVibeTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Squads view states
  const [requestsData, setRequestsData] = useState<ApiRequestsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeMatches, setActiveMatches] = useState<ApiMatchResponse[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Fetch event for find squad form
  const [event, setEvent] = useState<Event | null>(null);

  // Fetch data
  const [knownMatchIds, setKnownMatchIds] = useState<string[]>([]);
  const isFirstLoad = useRef(true);
  const [showMatchOverlay, setShowMatchOverlay] = useState<ApiMatchResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [activeResponse, pendingResponse] = await Promise.all([
          api.get<ApiRequestsResponse>(`/api/matches/requests?status=matched,confirmed&limit=50`),
          api.get<ApiRequestsResponse>(`/api/matches/requests?status=pending&page=${currentPage}&limit=9`)
        ]);

        setRequestsData(pendingResponse);

        // Extract matches from active requests
        const matches = activeResponse.requests
          .filter((r): r is MatchRequest & { status: 'matched' | 'confirmed' } => (r.status === 'matched' || r.status === 'confirmed') && r.eventId != null)
          .map((r): ApiMatchResponse => ({
            id: r.matchId || r._id,
            event: r.eventId,
            status: r.status === 'matched' ? 'matched' : 'confirmed',
            unreadCount: r.unreadCount || 0,
            members: r.members || [],
            chatRoomId: r.chatRoomId || '',
            funInfo: r.funInfo
          }));

        // Filter out matches with missing events/dates
        const validMatches = matches.filter(m => m.event && m.event.date);
        setActiveMatches(validMatches);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage]);

  // Fetch event if eventId is present
  useEffect(() => {
    // Listen to socket match-found event in real-time
    const handleMatchFound = (newMatch: ApiMatchResponse) => {
      console.log("Socket: Match found event received!", newMatch);
      // Trigger the celebration overlay modal
      setShowMatchOverlay(newMatch);
      
      // Update active matches list state to immediately reflect the new match
      setActiveMatches(prev => {
        if (prev.some(m => m.id === newMatch.id)) return prev;
        return [newMatch, ...prev];
      });

      // Update pending requests list
      api.get<ApiRequestsResponse>(`/api/matches/requests?status=pending&page=${currentPage}&limit=9`)
        .then(res => setRequestsData(res))
        .catch(err => console.error("Failed to refresh pending requests", err));
    };

    socket.on('match-found', handleMatchFound);

    return () => {
      socket.off('match-found', handleMatchFound);
    };
  }, [currentPage]);

  // Fetch event if eventId is present
  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}`);
          if (response.ok) {
            const data = await response.json();
            setEvent(data);
          }
        } catch (error) {
          console.error("Failed to fetch event:", error);
        }
      };
      fetchEvent();
    }
  }, [eventId]);

  // Cancel request
  const cancelRequest = async (requestId: string) => {
    try {
      await api.delete(`/api/matches/requests/${requestId}`);
      // Refresh data on current page
      const pendingResponse = await api.get<ApiRequestsResponse>(`/api/matches/requests?status=pending&page=${currentPage}&limit=9`);
      setRequestsData(pendingResponse);

      // Update active matches as well
      const activeResponse = await api.get<ApiRequestsResponse>(`/api/matches/requests?status=matched,confirmed&limit=50`);
      const matches = activeResponse.requests
        .filter((r): r is MatchRequest & { status: 'matched' | 'confirmed' } => (r.status === 'matched' || r.status === 'confirmed') && r.eventId != null)
        .map((r): ApiMatchResponse => ({
          id: r.matchId || r._id,
          event: r.eventId,
          status: r.status === 'matched' ? 'matched' : 'confirmed',
          unreadCount: r.unreadCount || 0,
          members: r.members || [],
          chatRoomId: r.chatRoomId || '',
          funInfo: r.funInfo
        }));
      setActiveMatches(matches.filter(m => m.event && m.event.date));
    } catch (error) {
      console.error("Failed to cancel request:", error);
    }
  };

  // Submit match request
  const handleSubmit = async () => {
    if (!eventId) return;

    setErrorMessage("");
    setSubmitting(true);

    try {
      const response = await api.post('/api/matches/request', {
        eventId,
        groupSize,
        genderPreference,
        ageMin,
        ageMax,
        vibeTags
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        router.push('/matches');
      }, 2000);
    } catch (error: unknown) {
      const err = error as { error?: string; message?: string };
      setErrorMessage(err?.error || err?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date
  const formatDate = (date: string) => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return d.toLocaleDateString("en-US", options);
  };

  // Format date for event
  const formatEventDate = (date: string) => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return d.toLocaleDateString("en-US", options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-10 h-10 border-3 border-slate-200 border-t-[#10b981] rounded-full"></div>
      </div>
    );
  }

  // Find Squad View (when eventId is present)
  if (eventId && event) {
    return (
      <div className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen">
        {/* Back Button */}
        <Link
          href={`/events/${eventId}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          Back to event
        </Link>

        {/* Event Header */}
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-[4px] inline-block mb-3">
            {event.category}
          </div>
          <h1 className="font-sans font-extrabold tracking-tight text-[clamp(28px,4vw,40px)] leading-[1.1] mb-2 tracking-[-0.02em]">
            Find your <em>squad</em>
          </h1>
          <p className="text-[15px] text-slate-400">
            Join {event.name} · {formatEventDate(event.date)} · {event.city}
          </p>
        </div>

        {/* Group Size Selection */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Users size={24} className="text-emerald-600" />
            <h2 className="font-sans font-extrabold tracking-tight text-[22px]">Group Size</h2>
          </div>
          <p className="text-[14px] text-slate-400 mb-6">
            How many people in your squad?
          </p>
          <div className="flex flex-wrap gap-3">
            {['1+1', '1+2', '1+3', '1+4', 'flexible'].map((size) => (
              <button
                key={size}
                onClick={() => setGroupSize(size)}
                className={`px-6 py-3 rounded-full font-medium text-[15px] transition-all ${groupSize === size
                  ? "bg-emerald-500 text-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/25"
                  : "bg-white text-slate-900 border-2 border-slate-200 hover:border-slate-300"
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Gender Preference */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <User size={24} className="text-emerald-600" />
            <h2 className="font-sans font-extrabold tracking-tight text-[22px]">Gender Preference</h2>
          </div>
          <p className="text-[14px] text-slate-400 mb-6">
            Who do you want to match with?
          </p>
          <div className="flex flex-wrap gap-3">
            {(['any', 'female', 'male'] as const).map((pref) => (
              <button
                key={pref}
                onClick={() => setGenderPreference(pref)}
                className={`px-6 py-3 rounded-full font-medium text-[15px] transition-all capitalize ${genderPreference === pref
                  ? "bg-emerald-500 text-white border-2 border-emerald-500 shadow-lg shadow-emerald-500/25"
                  : "bg-white text-slate-900 border-2 border-slate-200 hover:border-slate-300"
                  }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={24} className="text-emerald-600" />
            <h2 className="font-sans font-extrabold tracking-tight text-[22px]">Age Range</h2>
          </div>
          <p className="text-[14px] text-slate-400 mb-6">
            Preferred age range for your squad.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] text-slate-500 font-medium mb-2 block">Min Age</label>
              <input
                type="number"
                min="18"
                max="99"
                value={ageMin}
                onChange={(e) => setAgeMin(parseInt(e.target.value))}
                className="w-full bg-white border-2 border-slate-200 rounded-full py-3 px-4 text-[15px] focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-[13px] text-slate-500 font-medium mb-2 block">Max Age</label>
              <input
                type="number"
                min="18"
                max="99"
                value={ageMax}
                onChange={(e) => setAgeMax(parseInt(e.target.value))}
                className="w-full bg-white border-2 border-slate-200 rounded-full py-3 px-4 text-[15px] focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Vibe Tags */}
        <div className="bg-white border border-slate-200 rounded-[24px] p-6 md:p-8 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Hash size={24} className="text-emerald-600" />
            <h2 className="font-sans font-extrabold tracking-tight text-[22px]">Vibe Tags</h2>
          </div>
          <p className="text-[14px] text-slate-400 mb-6">
            Select your squad&apos;s vibe (optional).
          </p>
          <div className="flex flex-wrap gap-3">
            {['chill', 'hype', 'introvert-friendly', 'first-timer', 'regular', 'early bird', 'night owl', 'social butterfly', 'quiet vibes', 'adventurous', 'spontaneous', 'planner'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (vibeTags.includes(tag)) {
                    setVibeTags(vibeTags.filter(t => t !== tag));
                  } else {
                    setVibeTags([...vibeTags, tag]);
                  }
                }}
                className={`px-4 py-2 rounded-full font-medium text-[14px] transition-all capitalize ${vibeTags.includes(tag)
                  ? "bg-emerald-500 text-white border-2 border-emerald-500"
                  : "bg-white text-slate-900 border-2 border-slate-200 hover:border-slate-300"
                  }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-full text-red-700 mb-6">
            <AlertCircle size={18} />
            <span className="text-[14px]">{errorMessage}</span>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-full text-green-700 mb-6">
            <CheckCircle2 size={18} />
            <span className="text-[14px]">Your request has been submitted! Redirecting...</span>
          </div>
        )}

        {/* Submit CTA */}
        <button
          onClick={handleSubmit}
          disabled={submitting || submitSuccess}
          className={`w-full font-medium text-[16px] py-4 px-6 rounded-full transition-all flex items-center justify-center gap-2 ${submitting || submitSuccess
            ? "bg-[#e2e8f0] text-slate-500 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5"
            }`}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Finding your squad...
            </>
          ) : (
            <>
              <Search size={20} />
              Find My Squad
            </>
          )}
        </button>
      </div>
    );
  }

  // Your Squads View (when no eventId)
  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto min-h-screen">
      <div className="mb-10">
        <h1 className="font-sans font-extrabold tracking-tight text-[clamp(36px,5vw,48px)] leading-[1.1] mb-2 tracking-[-0.02em]">
          Your <em>squads</em>
        </h1>
        <p className="text-[15px] text-slate-400">Active groups and pending matching requests.</p>
      </div>

      <div className="space-y-12">

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10 pb-6 border-b border-slate-200">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search your events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-[100px] py-2.5 pl-11 pr-4 text-[14px] focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-400 font-medium text-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 rounded-[100px] text-[13px] font-medium transition-all"
              >
                <Filter size={14} />
                {categoryFilter === 'All' ? 'All categories' : categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}
                <ChevronDown size={14} />
              </button>

              {showCategoryDropdown && (
                <div className="absolute z-50 top-full mt-1 right-0 sm:left-0 sm:right-auto bg-white border border-slate-200 rounded-[20px] shadow-2xl shadow-slate-200/50 backdrop-blur-xl bg-white/95 overflow-hidden min-w-[160px]">
                  {[
                    { name: "All categories", value: "All" },
                    { name: "Concerts", value: "concert" },
                    { name: "Festivals", value: "festival" },
                    { name: "Activities", value: "activity" },
                    { name: "Sports", value: "sport" },
                  ].map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => { setCategoryFilter(cat.value); setShowCategoryDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-[13px] font-medium hover:bg-slate-50 transition-colors ${categoryFilter === cat.value ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setCategoryFilter("All")}
                className={`flex items-center gap-2 px-4 py-2 rounded-[100px] text-[13px] font-medium transition-all ${categoryFilter === 'All' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-transform' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                All
              </button>
              <button
                onClick={() => setCategoryFilter("concert")}
                className={`flex items-center gap-2 px-4 py-2 rounded-[100px] text-[13px] font-medium transition-all ${categoryFilter === "concert" ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-transform' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                Concerts
              </button>
              <button
                onClick={() => setCategoryFilter("festival")}
                className={`flex items-center gap-2 px-4 py-2 rounded-[100px] text-[13px] font-medium transition-all ${categoryFilter === "festival" ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-transform' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                Festivals
              </button>
              <button
                onClick={() => setCategoryFilter("activity")}
                className={`flex items-center gap-2 px-4 py-2 rounded-[100px] text-[13px] font-medium transition-all ${categoryFilter === "activity" ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-transform' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                Activities
              </button>
              <button
                onClick={() => setCategoryFilter("sport")}
                className={`flex items-center gap-2 px-4 py-2 rounded-[100px] text-[13px] font-medium transition-all ${categoryFilter === "sport" ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-transform' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                Sports
              </button>
            </div>
          </div>
        </div>

        {/* Active Matches */}
        {activeMatches.length > 0 && (
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.08em] font-medium text-slate-500 mb-5 flex items-center gap-2">
              <Users size={16} /> Active Squads
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {activeMatches.filter(m => (categoryFilter === "All" || m.event.category?.toLowerCase() === categoryFilter.toLowerCase()) && m.event.name.toLowerCase().includes(searchQuery.toLowerCase())).map((match, idx) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, scale: 0.95, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 80, damping: 15, delay: idx * 0.08 }}
                  className="h-full"
                >
                  <Link
                    href={`/matches/${match.id}`}
                    className="bg-white border border-slate-200 rounded-[24px] flex flex-col h-full hover:border-slate-300 transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 group relative overflow-hidden"
                  >
                    {match.unreadCount > 0 && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white text-[13px] font-extrabold rounded-full flex items-center justify-center border-[4px] border-white shadow-lg z-20 animate-pulse">
                        {match.unreadCount}
                      </div>
                    )}

                    <div className="h-32 sm:h-40 relative w-full border-b border-slate-200 bg-slate-50 flex-shrink-0 overflow-hidden mb-6">
                      <EventImage src={match.event.coverImage || match.event.image} alt={match.event.name} category={match.event.category} />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="p-6 md:p-8 pt-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-8 gap-4">
                        <div>
                          <h3 className="font-sans font-extrabold tracking-tight text-lg md:text-lg leading-tight mb-1.5 md:mb-2 group-hover:text-emerald-600 transition-colors text-slate-900 line-clamp-2 break-words" title={match.event.name.split(/ - |—/)[0].trim()}>
                            {match.event.name.split(/ - |—/)[0].trim()}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[12px] font-medium text-slate-500">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{formatDate(match.event.date)}</span>
                            </div>
                            {(match.event.name.split(/ - |—/)[1] || match.event.venue || match.event.city) && (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-[12px] font-medium text-slate-500">
                                <MapPin size={13} className="text-slate-400" />
                                <span>{(match.event.name.split(/ - |—/)[1] || match.event.venue || match.event.city).trim()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-500 flex items-center justify-center font-medium text-[14px] group-hover:bg-emerald-500 group-hover:text-white group-shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all">
                          {match.members.length}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex -space-x-3">
                          {match.members.slice(0, 3).map((member, i) => (
                            <motion.div 
                              key={member.id} 
                              animate={{ y: [0, -4, 0] }}
                              transition={{ repeat: Infinity, duration: 2.8, delay: i * 0.2, ease: "easeInOut" }}
                              className="relative"
                            >
                              {member.photo ? (
                                <img
                                  src={member.photo}
                                  alt={member.displayName}
                                  className="w-12 h-12 rounded-full border-[2px] border-[white] object-cover bg-slate-100 shadow-sm"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full border-[2px] border-[white] bg-slate-100 flex items-center justify-center font-medium text-[13px] text-slate-400 shadow-sm">
                                  {member.displayName?.slice(0, 2) || '??'}
                                </div>
                              )}
                            </motion.div>
                          ))}
                          {match.members.length > 3 && (
                            <motion.div 
                              animate={{ y: [0, -4, 0] }}
                              transition={{ repeat: Infinity, duration: 2.8, delay: 3 * 0.2, ease: "easeInOut" }}
                              className="w-12 h-12 rounded-full border-[2px] border-[white] bg-[#bbf7d0] flex items-center justify-center font-medium text-[13px] text-[#166534] shadow-sm z-10"
                            >
                              +{match.members.length - 3}
                            </motion.div>
                          )}
                        </div>
                        <div className="text-[13px] text-slate-400 font-medium">
                          {match.members.length} squad member{match.members.length > 1 ? 's' : ''}
                        </div>
                      </div>

                      {match.funInfo && (
                        <div className="mb-6 p-3 bg-emerald-50 rounded-2xl border border-emerald-100/80 text-[12px] text-emerald-800 font-semibold flex items-center gap-2">
                          <Sparkles size={14} className="text-emerald-500 animate-pulse shrink-0" />
                          <span>{match.funInfo}</span>
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between text-[14px] font-medium pt-5 border-t border-slate-200">
                        <span className="text-slate-900 flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          {match.status === 'confirmed' ? 'Confirmed' : 'Matched'}
                        </span>
                        <span className="text-slate-900 flex items-center gap-1 group-hover:gap-2 transition-all">
                          Open chat <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Pending Requests */}
        <section>
          <h2 className="text-[13px] uppercase tracking-[0.08em] font-medium text-slate-500 mb-5 flex items-center gap-2">
            <Clock size={16} /> Pending Requests
          </h2>

          {requestsData?.requests.filter(r => r.status === "pending" && (categoryFilter === "All" || r.eventId.category?.toLowerCase() === categoryFilter.toLowerCase()) && r.eventId.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
            <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-[32px] p-16 text-center shadow-sm">
              <Users size={48} className="text-slate-500 mx-auto mb-4" />
              <h3 className="font-sans font-extrabold tracking-tight text-[24px] mb-2">No pending requests</h3>
              <p className="text-[15px] text-slate-400 mb-6">
                You don&apos;t have any active squad requests. Find an event to start matching!
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-full transition-all"
              >
                Browse Events
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requestsData?.requests.filter(r => r.status === "pending" && (categoryFilter === "All" || r.eventId.category?.toLowerCase() === categoryFilter.toLowerCase()) && r.eventId.name.toLowerCase().includes(searchQuery.toLowerCase())).map((request) => (
                <div
                  key={request._id}
                  className="relative bg-white border border-slate-200 rounded-[24px] overflow-hidden flex flex-col h-full hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all group"
                >

                  <button
                    onClick={() => cancelRequest(request._id)}
                    className="absolute top-4 right-4 z-30 bg-white/95 backdrop-blur-md hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200/50 hover:border-red-200 rounded-full px-3 py-1.5 text-[12px] font-medium shadow-sm transition-all flex items-center gap-1.5 opacity-90 hover:opacity-100"
                  >
                    <X size={14} />
                    Cancel
                  </button>

                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[#e2e8f0] z-20">
                    <div className="h-full bg-emerald-500 w-1/3 animate-pulse"></div>
                  </div>
                  <div className="h-28 relative w-full border-b border-slate-200 bg-slate-50 flex-shrink-0 overflow-hidden">
                    <EventImage src={request.eventId.coverImage || request.eventId.image} alt={request.eventId.name} category={request.eventId.category} />
                    <div className="absolute inset-0 bg-black/10"></div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-sans font-extrabold tracking-tight text-lg md:text-lg leading-tight mb-1.5 md:mb-2 text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 break-words" title={request.eventId.name.split(/ - |—/)[0].trim()}>
                          {request.eventId.name.split(/ - |—/)[0].trim()}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-[11px] font-medium text-slate-500">
                            <Users size={12} className="text-slate-400" />
                            Squad of {request.groupSize}
                          </div>
                          {(request.eventId.name.split(/ - |—/)[1] || request.eventId.venue || request.eventId.city) && (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-[11px] font-medium text-slate-500">
                              <MapPin size={12} className="text-slate-400" />
                              <span>{(request.eventId.name.split(/ - |—/)[1] || request.eventId.venue || request.eventId.city).trim()}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-[12px] text-slate-400 font-medium">
                          Requested: {formatDate(request.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-200 flex items-center gap-3">
                      <div className="relative w-5 h-5 flex items-center justify-center mr-1">
                        <motion.div
                          animate={{ scale: [1, 2.2, 2.8], opacity: [0.6, 0.3, 0] }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                          className="absolute w-4 h-4 rounded-full bg-emerald-500/40"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.8, 2.4], opacity: [0.6, 0.2, 0] }}
                          transition={{ repeat: Infinity, duration: 1.8, delay: 0.6, ease: "easeOut" }}
                          className="absolute w-4 h-4 rounded-full bg-emerald-500/30"
                        />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative z-10 shadow-sm shadow-emerald-500/50" />
                      </div>
                      <span className="text-[13px] text-slate-400 font-medium">
                        Matching in progress...
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pagination */}
        {requestsData && requestsData.pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-2 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-[14px] font-medium text-slate-400">
              Page {currentPage} of {requestsData.pagination.pages}
            </span>
            <button
              disabled={currentPage === requestsData.pagination.pages}
              onClick={() => setCurrentPage(prev => Math.min(requestsData.pagination.pages, prev + 1))}
              className="p-2 rounded-full border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* "It's a Match!" Celebration Overlay (Light Mode) */}
        <AnimatePresence>
          {showMatchOverlay && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-white/95 backdrop-blur-xl z-[9999] flex flex-col items-center justify-center p-6 text-slate-900 text-center"
            >
              {/* Background elements */}
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              
              {/* Glowing background blob */}
              <div className="absolute w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="max-w-md w-full space-y-8 flex flex-col items-center"
              >
                {/* Star Badge */}
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-yellow-500/20"
                >
                  <Sparkles size={28} className="fill-white" />
                </motion.div>

                {/* Title */}
                <div className="space-y-2">
                  <motion.h1 
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="font-sans font-black tracking-wider text-4xl md:text-5xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent"
                  >
                    IT'S A MATCH!
                  </motion.h1>
                  <p className="text-slate-600 text-sm md:text-base font-semibold px-4">
                    You matched for <strong className="text-slate-900">{showMatchOverlay.event.name.split("—")[0]}</strong>!
                  </p>
                </div>

                {/* Matching Avatars Collage */}
                <div className="relative w-full h-32 flex items-center justify-center mt-6">
                  {/* Floating confetti particles */}
                  {[...Array(24)].map((_, i) => {
                    const angle = (i / 24) * 360 + (Math.random() * 15 - 7.5);
                    const rad = (angle * Math.PI) / 180;
                    const distance = 100 + Math.random() * 140;
                    const x = Math.cos(rad) * distance;
                    const y = Math.sin(rad) * distance;
                    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#fb7185"];
                    const randomColor = colors[i % colors.length];

                    return (
                      <motion.div
                        key={i}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                        animate={{ 
                          x: x, 
                          y: y, 
                          scale: [0, 1.3, 0.8, 0],
                          opacity: [1, 1, 0.7, 0],
                          rotate: [0, Math.random() * 360 + 180] 
                        }}
                        transition={{ 
                          duration: 2 + Math.random() * 1.2, 
                          ease: "easeOut",
                          delay: 0.7 
                        }}
                        className="absolute w-2 h-4 rounded-[2px]"
                        style={{ backgroundColor: randomColor }}
                      />
                    );
                  })}

                  {/* Avatar A */}
                  <motion.div 
                    initial={{ x: -100, opacity: 0, rotate: -20 }}
                    animate={{ x: -16, opacity: 1, rotate: -6 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.3 }}
                    className="w-20 h-20 rounded-full border-4 border-emerald-500 overflow-hidden bg-slate-100 shadow-xl shadow-slate-200 z-10"
                  >
                    <img 
                      src={showMatchOverlay.members[0]?.photo || "https://i.pravatar.cc/100?img=11"} 
                      alt="User" 
                      className="w-full h-full object-cover" 
                    />
                  </motion.div>

                  {/* Pulsing Match Center Icon */}
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.8 }}
                    className="w-10 h-10 rounded-full bg-emerald-500 border-4 border-white text-white flex items-center justify-center z-20 shadow-md shadow-emerald-500/25"
                  >
                    <Sparkles size={14} className="text-white" />
                  </motion.div>

                  {/* Avatar B */}
                  <motion.div 
                    initial={{ x: 100, opacity: 0, rotate: 20 }}
                    animate={{ x: 16, opacity: 1, rotate: 6 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.35 }}
                    className="w-20 h-20 rounded-full border-4 border-emerald-500 overflow-hidden bg-slate-100 shadow-xl shadow-slate-200 z-10"
                  >
                    <img 
                      src={showMatchOverlay.members[1]?.photo || showMatchOverlay.members[0]?.photo || "https://i.pravatar.cc/100?img=33"} 
                      alt="Matched Buddy" 
                      className="w-full h-full object-cover" 
                    />
                  </motion.div>
                </div>

                {/* Match Description */}
                {showMatchOverlay.funInfo && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-emerald-50 border border-emerald-100/80 rounded-2xl p-4 max-w-sm shadow-sm"
                  >
                    <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                      "{showMatchOverlay.funInfo}"
                    </p>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 w-full px-8 mt-6">
                  <Link
                    href={`/matches/${showMatchOverlay.id}`}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-6 rounded-full transition-all text-center shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm"
                  >
                    <MessageSquare size={16} />
                    Open Chat Room
                  </Link>
                  <button
                    onClick={() => setShowMatchOverlay(null)}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 font-bold py-3 px-6 rounded-full transition-all text-sm shadow-sm"
                  >
                    Keep Browsing
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}