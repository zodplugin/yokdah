"use client";

import { useState, useEffect } from "react";
import { Users, Clock, ArrowRight, X, ArrowLeft, Search, User, Calendar, Hash, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

interface Event {
  _id: string;
  name: string;
  date: string;
  category: string;
  city: string;
}

interface MatchRequest {
  _id: string;
  eventId: {
    _id: string;
    name: string;
    date: string;
    category: string;
    city: string;
  };
  status: 'pending' | 'matched' | 'confirmed' | 'cancelled';
  groupSize: string;
  createdAt: string;
  matchId?: string;
  chatRoomId?: string;
  unreadCount?: number;
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
  members: {
    id: string;
    displayName: string;
    photo: string;
    reliabilityScore: number;
  }[];
  chatRoomId: string;
}

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

  // Fetch event for find squad form
  const [event, setEvent] = useState<Event | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get<ApiRequestsResponse>(`/api/matches/requests?status=pending,matched,confirmed&page=${currentPage}&limit=10`);
        setRequestsData(response);

        // Extract matches from requests
        const matches = response.requests
          .filter((r): r is MatchRequest & { status: 'matched' | 'confirmed' } => (r.status === 'matched' || r.status === 'confirmed') && r.eventId != null)
          .map((r): ApiMatchResponse => ({
            id: r.matchId || r._id,
            event: r.eventId,
            status: r.status === 'matched' ? 'matched' : 'confirmed',
            unreadCount: r.unreadCount || 0,
            members: r.members || [],
            chatRoomId: r.chatRoomId || '',
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
      const response = await api.get<ApiRequestsResponse>(`/api/matches/requests?status=pending,matched,confirmed&page=${currentPage}&limit=10`);
      setRequestsData(response);

      // Update active matches as well
      const matches = response.requests
        .filter((r): r is MatchRequest & { status: 'matched' | 'confirmed' } => (r.status === 'matched' || r.status === 'confirmed') && r.eventId != null)
        .map((r): ApiMatchResponse => ({
          id: r.matchId || r._id,
          event: r.eventId,
          status: r.status === 'matched' ? 'matched' : 'confirmed',
          unreadCount: r.unreadCount || 0,
          members: r.members || [],
          chatRoomId: r.chatRoomId || '',
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
        <div className="animate-spin w-10 h-10 border-3 border-[var(--border)] border-t-[var(--accent)] rounded-full"></div>
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
          className="inline-flex items-center gap-2 text-[var(--muted2)] hover:text-[var(--text)] transition-colors mb-8"
        >
          <ArrowLeft size={18} />
          Back to event
        </Link>

        {/* Event Header */}
        <div className="mb-10">
          <div className="text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--muted)] bg-[var(--bg2)] px-2.5 py-1 rounded-[4px] inline-block mb-3">
            {event.category}
          </div>
          <h1 className="font-serif text-[clamp(28px,4vw,40px)] leading-[1.1] mb-2 tracking-[-0.02em]">
            Find your <em>squad</em>
          </h1>
          <p className="text-[15px] text-[var(--muted2)]">
            Join {event.name} · {formatEventDate(event.date)} · {event.city}
          </p>
        </div>

        {/* Group Size Selection */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Users size={24} className="text-[var(--accent-dark)]" />
            <h2 className="font-serif text-[22px]">Group Size</h2>
          </div>
          <p className="text-[14px] text-[var(--muted2)] mb-6">
            How many people in your squad?
          </p>
          <div className="flex flex-wrap gap-3">
            {['1+1', '1+2', '1+3', '1+4', 'flexible'].map((size) => (
              <button
                key={size}
                onClick={() => setGroupSize(size)}
                className={`px-6 py-3 rounded-[12px] font-medium text-[15px] transition-all ${groupSize === size
                    ? "bg-[var(--accent)] text-[var(--accent-text)] border-2 border-[var(--accent)] shadow-[0_4px_16px_rgba(184,240,64,0.3)]"
                    : "bg-[var(--bg)] text-[var(--text)] border-2 border-[var(--border)] hover:border-[var(--border2)]"
                  }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Gender Preference */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <User size={24} className="text-[var(--accent-dark)]" />
            <h2 className="font-serif text-[22px]">Gender Preference</h2>
          </div>
          <p className="text-[14px] text-[var(--muted2)] mb-6">
            Who do you want to match with?
          </p>
          <div className="flex flex-wrap gap-3">
            {(['any', 'female', 'male'] as const).map((pref) => (
              <button
                key={pref}
                onClick={() => setGenderPreference(pref)}
                className={`px-6 py-3 rounded-[12px] font-medium text-[15px] transition-all capitalize ${genderPreference === pref
                    ? "bg-[var(--accent)] text-[var(--accent-text)] border-2 border-[var(--accent)] shadow-[0_4px_16px_rgba(184,240,64,0.3)]"
                    : "bg-[var(--bg)] text-[var(--text)] border-2 border-[var(--border)] hover:border-[var(--border2)]"
                  }`}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={24} className="text-[var(--accent-dark)]" />
            <h2 className="font-serif text-[22px]">Age Range</h2>
          </div>
          <p className="text-[14px] text-[var(--muted2)] mb-6">
            Preferred age range for your squad.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[13px] text-[var(--muted)] font-medium mb-2 block">Min Age</label>
              <input
                type="number"
                min="18"
                max="99"
                value={ageMin}
                onChange={(e) => setAgeMin(parseInt(e.target.value))}
                className="w-full bg-[var(--bg)] border-2 border-[var(--border)] rounded-[10px] py-3 px-4 text-[15px] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
            <div>
              <label className="text-[13px] text-[var(--muted)] font-medium mb-2 block">Max Age</label>
              <input
                type="number"
                min="18"
                max="99"
                value={ageMax}
                onChange={(e) => setAgeMax(parseInt(e.target.value))}
                className="w-full bg-[var(--bg)] border-2 border-[var(--border)] rounded-[10px] py-3 px-4 text-[15px] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Vibe Tags */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 md:p-8 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Hash size={24} className="text-[var(--accent-dark)]" />
            <h2 className="font-serif text-[22px]">Vibe Tags</h2>
          </div>
          <p className="text-[14px] text-[var(--muted2)] mb-6">
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
                className={`px-4 py-2 rounded-[10px] font-medium text-[14px] transition-all capitalize ${vibeTags.includes(tag)
                    ? "bg-[var(--accent)] text-[var(--accent-text)] border-2 border-[var(--accent)]"
                    : "bg-[var(--bg)] text-[var(--text)] border-2 border-[var(--border)] hover:border-[var(--border2)]"
                  }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-[12px] text-red-700 mb-6">
            <AlertCircle size={18} />
            <span className="text-[14px]">{errorMessage}</span>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-[12px] text-green-700 mb-6">
            <CheckCircle2 size={18} />
            <span className="text-[14px]">Your request has been submitted! Redirecting...</span>
          </div>
        )}

        {/* Submit CTA */}
        <button
          onClick={handleSubmit}
          disabled={submitting || submitSuccess}
          className={`w-full font-medium text-[16px] py-4 px-6 rounded-[12px] transition-all flex items-center justify-center gap-2 ${submitting || submitSuccess
              ? "bg-[var(--border)] text-[var(--muted)] cursor-not-allowed"
              : "bg-[var(--accent)] hover:bg-[var(--accent2)] text-[var(--accent-text)] hover:shadow-[0_4px_24px_rgba(184,240,64,0.25)]"
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
        <h1 className="font-serif text-[clamp(36px,5vw,48px)] leading-[1.1] mb-2 tracking-[-0.02em]">
          Your <em>squads</em>
        </h1>
        <p className="text-[15px] text-[var(--muted2)]">Active groups and pending matching requests.</p>
      </div>

      <div className="space-y-12">
        {/* Active Matches */}
        {activeMatches.length > 0 && (
          <section>
            <h2 className="text-[13px] uppercase tracking-[0.08em] font-medium text-[var(--muted)] mb-5 flex items-center gap-2">
              <Users size={16} /> Active Squads
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {activeMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 md:p-8 hover:border-[var(--border2)] transition-all hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 group relative"
                >
                  {match.unreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-[#ef4444] text-white text-[12px] font-bold rounded-full flex items-center justify-center border-[3px] border-[var(--bg)] shadow-xl z-10 animate-pulse">
                      {match.unreadCount}
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="font-serif text-[28px] leading-tight mb-1.5">
                        {match.event.name}
                      </h3>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--bg3)] border border-[var(--border)] rounded-[100px] text-[12px] font-medium text-[var(--muted2)]">
                        <span>{formatDate(match.event.date)}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-dim)] text-[var(--accent-text)] border border-[var(--accent)] flex items-center justify-center font-medium text-[14px] group-hover:bg-[var(--accent)] group-hover:shadow-[0_4px_12px_rgba(184,240,64,0.25)] transition-all">
                      {match.members.length}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex -space-x-3">
                      {match.members.slice(0, 3).map((member) => (
                        <div key={member.id} className="relative">
                          {member.photo ? (
                            <img
                              src={member.photo}
                              alt={member.displayName}
                              className="w-12 h-12 rounded-full border-[2px] border-[var(--surface)] object-cover bg-[var(--bg3)]"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full border-[2px] border-[var(--surface)] bg-[var(--bg3)] flex items-center justify-center font-medium text-[13px] text-[var(--muted2)]">
                              {member.displayName?.slice(0, 2) || '??'}
                            </div>
                          )}
                        </div>
                      ))}
                      {match.members.length > 3 && (
                        <div className="w-12 h-12 rounded-full border-[2px] border-[var(--surface)] bg-[#bbf7d0] flex items-center justify-center font-medium text-[13px] text-[#166534]">
                          +{match.members.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-[13px] text-[var(--muted2)] font-medium">
                      {match.members.length} squad member{match.members.length > 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[14px] font-medium pt-5 border-t border-[var(--border)]">
                    <span className="text-[var(--text)] flex items-center gap-2">
                      <Users size={16} />
                      {match.status === 'confirmed' ? 'Confirmed' : 'Matched'}
                    </span>
                    <span className="text-[var(--text)] flex items-center gap-1 group-hover:gap-2 transition-all">
                      Open chat <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Pending Requests */}
        <section>
          <h2 className="text-[13px] uppercase tracking-[0.08em] font-medium text-[var(--muted)] mb-5 flex items-center gap-2">
            <Clock size={16} /> Pending Requests
          </h2>

          {requestsData?.requests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[20px] p-12 text-center">
              <Users size={48} className="text-[var(--muted)] mx-auto mb-4" />
              <h3 className="font-serif text-[24px] mb-2">No pending requests</h3>
              <p className="text-[15px] text-[var(--muted2)] mb-6">
                You don&apos;t have any active squad requests. Find an event to start matching!
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent2)] text-[var(--accent-text)] font-medium rounded-[12px] transition-all"
              >
                Browse Events
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requestsData?.requests.filter(r => r.status === 'pending').map((request) => (
                <div
                  key={request._id}
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-[var(--border)]">
                    <div className="h-full bg-[var(--accent)] w-1/3 animate-pulse"></div>
                  </div>

                  <div className="flex items-start justify-between p-6 mt-2">
                    <div>
                      <h3 className="font-serif text-[24px] leading-tight mb-1 text-[var(--muted2)]">
                        {request.eventId.name}
                      </h3>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[var(--bg3)] rounded-[100px] text-[11px] font-medium text-[var(--muted)]">
                        Requested: Squad of {request.groupSize}
                      </div>
                      <div className="text-[13px] text-[var(--muted2)] mt-1">
                        {formatDate(request.createdAt)}
                      </div>
                    </div>

                    <button
                      onClick={() => cancelRequest(request._id)}
                      className="text-[13px] font-medium text-[var(--muted)] hover:text-[var(--text)] bg-[var(--bg)] px-3 py-1 rounded-[10px] border-2 border-[var(--border)] transition-all hover:bg-[var(--bg2)] hover:border-[var(--border2)] flex items-center gap-1"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>

                  <div className="mt-8 pt-4 border-t border-[var(--border)] flex items-center gap-3 px-6 pb-6">
                    <div className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse"></div>
                    <span className="text-[13px] text-[var(--muted2)] font-medium">
                      Matching in progress...
                    </span>
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
              className="p-2 rounded-full border border-[var(--border)] disabled:opacity-30 hover:bg-[var(--bg2)] transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-[14px] font-medium text-[var(--muted2)]">
              Page {currentPage} of {requestsData.pagination.pages}
            </span>
            <button
              disabled={currentPage === requestsData.pagination.pages}
              onClick={() => setCurrentPage(prev => Math.min(requestsData.pagination.pages, prev + 1))}
              className="p-2 rounded-full border border-[var(--border)] disabled:opacity-30 hover:bg-[var(--bg2)] transition-colors"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}