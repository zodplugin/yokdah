"use client";

import { useState, useEffect } from "react";
import { MapPin, Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[var(--border)] border-t-[var(--accent)] rounded-full mx-auto mb-4"></div>
          <p className="text-[15px] text-[var(--muted2)]">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg)]">
        <div className="text-center max-w-md">
          <MapPin size={48} className="text-[var(--muted)] mb-4 mx-auto" />
          <h1 className="font-serif text-[32px] font-medium mb-4">Event not found</h1>
          <p className="text-[15px] text-[var(--muted2)] mb-8">
            The event you're looking for doesn't exist or may have been removed.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent2)] text-[var(--accent-text)] font-medium text-[15px] py-3 px-6 rounded-[10px] transition-all"
          >
            <ArrowLeft size={18} />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/events" className="flex items-center gap-2 text-[var(--text)] hover:text-[var(--muted2)] transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Events</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShare(!showShare)}
              className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-4 py-2 text-[14px] font-medium text-[var(--text)] hover:bg-[var(--bg2)] hover:border-[var(--border2)] transition-all"
            >
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-64 md:h-96 bg-gradient-to-br from-[var(--accent-dim)] to-[var(--bg)] overflow-hidden">
        {event.coverImage && (
          <img
            src={event.coverImage}
            alt={event.name}
            className="w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <span className="text-[32px] md:text-[48px] md:text-[56px] font-serif font-bold text-white mb-4 block">
              {event.name.split(' - ')[0]}
            </span>
            <span className="text-[16px] md:text-[20px] text-white/90 font-medium">
              {event.category && (
                <span className="uppercase tracking-[0.08em] px-3 py-1 bg-white/20 rounded-full">
                  {event.category}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Event Info */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Event Title & Category */}
            <div>
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-[var(--muted)] bg-[var(--bg2)] px-2.5 py-1 rounded-[4px]">
                  {event.category}
                </span>
                <span className="text-[14px] text-[var(--muted2)]">
                  {event.city}
                </span>
              </div>
              <h1 className="font-serif text-[32px] md:text-[40px] font-normal leading-[1.1] mb-2">
                {event.name}
              </h1>
            </div>

            {/* Date & Time */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[var(--bg2)] flex items-center justify-center text-[var(--accent-dark)]">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="text-[14px] text-[var(--muted)] font-medium mb-1">Date</div>
                  <div className="text-[16px] font-medium text-[var(--text)]">{formatDate(event.date)}</div>
                  <div className="text-[14px] text-[var(--muted2)] mt-2">
                    {event.endTime && (
                      <>
                        <Clock size={14} className="inline mr-1" />
                        {formatTime(event.date)} - {formatTime(event.endTime)}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[var(--bg2)] flex items-center justify-center text-[var(--accent-dark)]">
                  <MapPin size={18} />
                </div>
                <div>
                  <div className="text-[14px] text-[var(--muted)] font-medium mb-1">Venue</div>
                  <div className="text-[16px] font-medium text-[var(--text)]">{event.venue}</div>
                  <div className="text-[14px] text-[var-muted2)] mt-2 flex items-center gap-1">
                    {event.city}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="text-[14px] text-[var(--muted)] font-medium mb-2">About this event</div>
                <p className="text-[15px] text-[var(--text)] leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>

            {/* Looking for buddies */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-[24px] font-medium">Looking for buddies</h3>
                <span className="text-[20px] font-bold text-[var(--accent-text)]">
                  {event.lookingCount || 0}
                </span>
              </div>
              <p className="text-[14px] text-[var(--muted2)] mb-4">
                Join the squad for this event and meet like-minded people who want to enjoy it together!
              </p>
              <Link
                href={`/matches?eventId=${event.id}`}
                className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent2)] text-[var(--accent-text)] font-medium text-[15px] py-3 px-6 rounded-[10px] transition-all hover:shadow-[0_4px_24px_rgba(184,240,64,0.25)]"
              >
                Find My Squad
              </Link>
            </div>
          </div>

          {/* Right Column - Cover Image */}
          <div className="relative">
            {event.coverImage ? (
              <img
                src={event.coverImage}
                alt={event.name}
                className="w-full h-64 md:h-96 object-cover rounded-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
              />
            ) : (
              <div className="w-full h-64 md:h-96 bg-[var(--bg2)] rounded-[16px] flex items-center justify-center border-2 border-dashed border-[var(--border)]">
                <MapPin size={48} className="text-[var(--muted)]" />
              </div>
            )}

            {/* Ticket CTA */}
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block w-full bg-[var(--text)] hover:bg-[var(--muted2)] text-[var(--bg)] font-medium text-[15px] py-4 px-6 rounded-[12px] text-center transition-all hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
            >
              Get Tickets
            </a>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShare && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] p-6 max-w-md w-full">
            <h3 className="font-serif text-[24px] font-medium mb-4">Share Event</h3>
            <p className="text-[15px] text-[var(--muted2)] mb-6">
              Share "{event.name}" with your friends!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleShare()}
                className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent2)] text-[var(--accent-text)] font-medium text-[15px] py-3 px-6 rounded-[10px] transition-all"
              >
                Share Now
              </button>
              <button
                onClick={() => setShowShare(false)}
                className="flex-1 bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] font-medium text-[15px] py-3 px-6 rounded-[10px] hover:bg-[var(--bg2)] transition-all"
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
