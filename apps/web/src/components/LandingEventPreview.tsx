"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Flame, MapPin, Music, Guitar, Headphones, Sparkles, Target } from "lucide-react";

type EventItem = {
  id: string;
  name: string;
  date: string;
  category?: string;
  city?: string;
  venue?: string;
  coverImage?: string;
  image?: string;
  lookingCount?: number;
};

function formatDate(date: string) {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return d.toLocaleDateString("en-US", options);
}

function isHot(ev: EventItem) {
  return (ev.lookingCount || 0) > 10;
}

function CategoryIcon({ category }: { category?: string }) {
  const className = "text-slate-400 opacity-50";
  switch (category?.toLowerCase()) {
    case "concert":
      return <Music size={32} className={className} />;
    case "festival":
      return <Guitar size={32} className={className} />;
    case "party":
      return <Headphones size={32} className={className} />;
    case "activity":
    case "sport":
      return <Target size={32} className={className} />;
    default:
      return <Sparkles size={32} className={className} />;
  }
}

function EventImage({ src, alt, category }: { src?: string; alt: string; category?: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(#0f172a 1px, transparent 1px)", backgroundSize: "12px 12px" }}
        />
        <CategoryIcon category={category} />
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
}

export default function LandingEventPreview({
  isLoggedIn,
  city = "Jakarta",
  limit = 12,
}: {
  isLoggedIn: boolean;
  city?: string;
  limit?: number;
}) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001", []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setPage(1);
      try {
        const params = new URLSearchParams();
        if (city) params.set("city", city);
        params.set("page", "1");
        params.set("limit", String(limit));

        const res = await fetch(`${apiBase}/api/events?${params.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        setEvents(Array.isArray(data?.events) ? data.events : []);
        setHasMore(Boolean(data?.pagination?.pages && data.pagination.pages > 1));
      } catch {
        if (!cancelled) {
          setEvents([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [apiBase, city, limit]);

  const loadMore = async () => {
    if (loadingMore || loading || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      params.set("page", String(nextPage));
      params.set("limit", String(limit));
      const res = await fetch(`${apiBase}/api/events?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const data = await res.json();
      const nextEvents: EventItem[] = Array.isArray(data?.events) ? data.events : [];
      setEvents((prev) => [...prev, ...nextEvents]);
      setPage(nextPage);
      const totalPages = Number(data?.pagination?.pages || 0);
      setHasMore(totalPages ? nextPage < totalPages : nextEvents.length > 0);
    } catch {
      // keep existing list
    } finally {
      setLoadingMore(false);
    }
  };

  const cardHref = (ev: EventItem) => {
    if (isLoggedIn) return `/events/${ev.id}`;
    const redirect = encodeURIComponent(`/events/${ev.id}`);
    return `/register?redirect=${redirect}`;
  };

  return (
    <section id="events" className="py-24 md:py-28 px-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="text-emerald-500 font-bold text-sm uppercase tracking-widest mb-3">Preview</div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">Events you can join</h2>
          <p className="text-[15px] text-slate-500 mt-3 max-w-xl">
            Browse what’s happening in <span className="font-semibold text-slate-900">{city}</span> and find buddies before you go.
          </p>
        </div>

        <Link
          href={isLoggedIn ? "/events" : "/register?redirect=%2Fevents"}
          className="inline-flex items-center justify-center self-start md:self-auto bg-white border border-slate-200 hover:border-slate-300 text-slate-900 text-[13px] font-semibold px-5 py-2.5 rounded-full hover:bg-slate-50 transition-all"
        >
          See all events
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: limit }).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-[24px] overflow-hidden">
              <div className="h-40 bg-slate-100 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-6 w-3/4 bg-slate-100 animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-slate-100 animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-slate-100 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <Link
                key={ev.id}
                href={cardHref(ev)}
                className="group flex flex-col bg-white border border-slate-200 rounded-[24px] overflow-hidden hover:border-slate-300 transition-all hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1"
              >
                <div className="h-40 flex items-center justify-center relative overflow-hidden bg-slate-50 border-b border-slate-200">
                  <EventImage src={ev.coverImage || ev.image} alt={ev.name} category={ev.category} />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-sans font-extrabold tracking-tight text-[20px] leading-[1.2] mb-3 text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {String(ev.name || "").split("—")[0]}
                  </h3>

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-[4px] border border-slate-200">
                      {ev.category || "event"}
                    </span>
                    {isHot(ev) && (
                      <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-[100px] bg-[#ffe4e1] text-[#d63c30] border border-[#ffcdcd]">
                        <Flame size={12} /> Hot
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-2.5 text-[13px] text-slate-500 font-medium">
                      <Calendar size={16} className="text-slate-400" /> {ev.date ? formatDate(ev.date) : "TBA"}
                    </div>
                    <div className="flex items-center gap-2.5 text-[13px] text-slate-500 font-medium">
                      <MapPin size={16} className="text-slate-400" /> {ev.venue || ev.city || "TBA"}
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-emerald-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      {ev.lookingCount || 0} finding buddies
                    </div>
                    <div className="w-8 h-8 rounded-[8px] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white shadow-sm transition-colors">
                      <span className="font-medium text-[16px]">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-900 text-[13px] font-semibold px-6 py-3 rounded-full transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[24px] p-10 text-center">
          <div className="text-[15px] font-semibold text-slate-900 mb-2">No events found</div>
          <div className="text-[14px] text-slate-500">Try again later or open the full events page.</div>
        </div>
      )}
    </section>
  );
}
