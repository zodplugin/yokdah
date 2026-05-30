"use client";

import { useState, useEffect } from "react";
import { MapPin, Calendar, Clock, ArrowLeft, Share2, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      } else {
        console.error("Failed to fetch event:", response.status);
        setEvent(null);
      }
    } catch (error) {
      console.error("Failed to fetch event:", error);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.name,
          text: `Join me at ${event.name}!`,
          url: window.location.href
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    }
    setShowShare(false);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return d.toLocaleDateString("en-US", options);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-slate-200 border-t-emerald-500 rounded-full mx-auto mb-4"></div>
          <p className="text-[15px] text-slate-500 font-medium">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
        <div className="text-center max-w-md">
          <MapPin size={48} className="text-slate-300 mb-4 mx-auto" />
          <h1 className="font-sans font-extrabold tracking-tight text-[32px] mb-2 text-slate-900">Event not found</h1>
          <p className="text-[15px] text-slate-500 mb-8">
            The event you're looking for doesn't exist or may have been removed.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[15px] py-3 px-6 rounded-full transition-all shadow-lg shadow-emerald-500/20"
          >
            <ArrowLeft size={18} />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/events" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <ArrowLeft size={18} />
            </div>
            <span className="font-medium text-[14px]">Back</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShare(!showShare)}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-2 text-[14px] font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-12">
        {/* Hero Section */}
        <div className="relative h-64 md:h-[400px] bg-slate-900 overflow-hidden rounded-[24px] mb-8 shadow-xl shadow-slate-200/50">
          {event.coverImage ? (
            <img
              src={event.coverImage}
              alt={event.name}
              className="w-full h-full object-cover opacity-60"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-slate-900 opacity-80" />
          )}
          <div className="absolute inset-0 flex items-end p-8 md:p-12 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
            <div>
              {event.category && (
                <span className="inline-block uppercase tracking-widest text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-4 backdrop-blur-md">
                  {event.category}
                </span>
              )}
              <h1 className="text-[32px] md:text-[56px] font-sans font-extrabold tracking-tight text-white leading-[1.1] mb-2">
                {event.name.split(' - ')[0]}
              </h1>
            </div>
          </div>
        </div>

        {/* Event Info */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-slate-200 rounded-[24px] p-8 shadow-sm">
              <h2 className="text-[20px] font-bold text-slate-900 mb-6">Event Details</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Date & Time */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <div className="text-[13px] text-slate-500 font-medium mb-1">Date & Time</div>
                    <div className="text-[15px] font-bold text-slate-900">{formatDate(event.date)}</div>
                    <div className="text-[14px] text-slate-500 mt-1 flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      {event.endTime ? `${formatTime(event.date)} - ${formatTime(event.endTime)}` : formatTime(event.date)}
                    </div>
                  </div>
                </div>

                {/* Venue */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex-shrink-0 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <div className="text-[13px] text-slate-500 font-medium mb-1">Venue</div>
                    <div className="text-[15px] font-bold text-slate-900">{event.venue}</div>
                    <div className="text-[14px] text-slate-500 mt-1">
                      {event.city}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-8 shadow-sm">
              <h2 className="text-[20px] font-bold text-slate-900 mb-4">About this event</h2>
              <p className="text-[15px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Looking for buddies */}
            <div className="bg-white border border-emerald-100 rounded-[24px] p-6 shadow-lg shadow-emerald-500/5 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex flex-col mb-4">
                  <h3 className="font-sans font-extrabold text-[24px] tracking-tight text-slate-900">Squad search</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-[14px]">
                      {event.lookingCount || 0}
                    </div>
                    <span className="text-[14px] font-medium text-emerald-600">looking for buddies</span>
                  </div>
                </div>
                <p className="text-[14px] text-slate-500 mb-6 leading-relaxed">
                  Join the squad for this event and meet like-minded people who want to enjoy it together!
                </p>
                <Link
                  href={`/matches?eventId=${event.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[15px] py-3.5 px-6 rounded-full transition-all shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5"
                >
                  Find My Squad
                </Link>
              </div>
            </div>

            {/* Ticket CTA */}
            {event.ticketUrl && (
              <a
                href={event.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-center items-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[15px] py-3.5 px-6 rounded-full transition-all shadow-lg shadow-slate-900/20 hover:-translate-y-0.5"
              >
                Get Tickets
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowShare(false)}>
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-sans font-extrabold text-[20px] mb-2 text-slate-900">Share Event</h3>
            <p className="text-[14px] text-slate-500 mb-6">
              Share "{event.name}" with your friends!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleShare()}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[14px] py-2.5 px-4 rounded-full transition-all"
              >
                Share Now
              </button>
              <button
                onClick={() => setShowShare(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold text-[14px] py-2.5 px-4 rounded-full hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
