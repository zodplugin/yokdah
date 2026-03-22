"use client";

import { Calendar, Search, Filter, Plus, Edit2, Trash2, Eye, EyeOff, CheckCircle, Clock } from "lucide-react";
import { useState } from "react";

export default function AdminEvents() {
    const [activeTab, setActiveTab] = useState("pending");

    const events = [
        { id: 1, name: "DGTL Amsterdam 2026", venue: "NDSM Loods", city: "Amsterdam", date: "04 Apr 2026", category: "Festival", source: "Resident Advisor", status: "approved", joined: 342 },
        { id: 2, name: "Boiler Room Amsterdam", venue: "Warehouse Elementenstraat", city: "Amsterdam", date: "18 Oct 2025", category: "Party", source: "Resident Advisor", status: "pending", joined: 0 },
        { id: 3, name: "Harry Styles Love On Tour", venue: "Johan Cruijff Arena", city: "Amsterdam", date: "23 May 2026", category: "Concert", source: "Ticketmaster", status: "approved", joined: 128 },
        { id: 4, name: "Moco Museum Exclusive", venue: "Museumplein", city: "Amsterdam", date: "12 Apr 2026", category: "Activity", source: "Eventbrite", status: "hidden", joined: 12 },
    ];

    const filteredEvents = events.filter(e => {
        if (activeTab === "all") return true;
        return e.status === activeTab;
    });

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen text-[#0f172a]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-serif text-[40px] leading-none mb-2 text-[#0f172a]">Event Management</h1>
                    <p className="text-[15px] text-[#64748b]">Review, approve, hide or manually add an event.</p>
                </div>
                <button className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-5 py-2.5 rounded-[10px] text-[14px] font-medium flex items-center gap-2 transition-colors self-start md:self-auto">
                    <Plus size={16} /> Add Manual Event
                </button>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-[20px] shadow-sm overflow-hidden flex flex-col">
                {/* Filters and Search */}
                <div className="p-6 border-b border-[#e2e8f0] flex flex-col md:flex-row md:items-center gap-4 bg-[#f8fafc]">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                        <input type="text" placeholder="Search by event name, venue, or city..." className="w-full bg-white border border-[#e2e8f0] rounded-[10px] pl-11 pr-4 py-2.5 text-[14px] outline-none focus:border-[#cbd5e1] focus:ring-2 focus:ring-[#f1f5f9] transition-all" />
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-white border border-[#e2e8f0] text-[#475569] px-4 py-2.5 rounded-[10px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#f1f5f9]">
                            <Filter size={16} /> Filters
                        </button>
                        <select className="bg-white border border-[#e2e8f0] text-[#475569] px-4 py-2.5 rounded-[10px] text-[14px] font-medium outline-none cursor-pointer hover:bg-[#f1f5f9]">
                            <option>Sort: Date Added</option>
                            <option>Sort: Event Date</option>
                            <option>Sort: Most Joined</option>
                        </select>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 px-6 border-b border-[#e2e8f0] bg-white text-[14px] font-medium">
                    <button onClick={() => setActiveTab("pending")} className={`py-4 px-1 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}>
                        Pending Review <span className="bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full text-[11px]">1</span>
                    </button>
                    <button onClick={() => setActiveTab("approved")} className={`py-4 px-1 border-b-2 transition-colors ${activeTab === 'approved' ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}>Approved</button>
                    <button onClick={() => setActiveTab("hidden")} className={`py-4 px-1 border-b-2 transition-colors ${activeTab === 'hidden' ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}>Hidden</button>
                    <button onClick={() => setActiveTab("all")} className={`py-4 px-1 border-b-2 transition-colors ${activeTab === 'all' ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}>All Events</button>
                </div>

                {/* Table/List */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f8fafc] text-[#64748b] text-[12px] uppercase tracking-wider font-medium border-b border-[#e2e8f0]">
                                <th className="px-6 py-4">Event Details</th>
                                <th className="px-6 py-4 hidden md:table-cell">Category & Source</th>
                                <th className="px-6 py-4 hidden sm:table-cell">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0] bg-white">
                            {filteredEvents.map(ev => (
                                <tr key={ev.id} className="hover:bg-[#f8fafc] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-[15px] mb-1">{ev.name}</div>
                                        <div className="text-[13px] text-[#64748b] flex items-center gap-1.5"><Calendar size={12} /> {ev.date} • {ev.venue}, {ev.city}</div>
                                        <div className="text-[12px] font-medium text-[var(--accent-text)] mt-1.5">{ev.joined} people joined</div>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <div className="text-[14px] text-[#0f172a] mb-1">{ev.category}</div>
                                        <div className="text-[12px] text-[#64748b]">{ev.source}</div>
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell">
                                        {ev.status === "approved" && <span className="inline-flex items-center gap-1 bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] px-2.5 py-1 rounded-[100px] text-[11px] font-medium uppercase tracking-wider"><CheckCircle size={12} /> Approved</span>}
                                        {ev.status === "pending" && <span className="inline-flex items-center gap-1 bg-[#fef9c3] text-[#854d0e] border border-[#fde047] px-2.5 py-1 rounded-[100px] text-[11px] font-medium uppercase tracking-wider"><Clock size={12} /> Pending</span>}
                                        {ev.status === "hidden" && <span className="inline-flex items-center gap-1 bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1] px-2.5 py-1 rounded-[100px] text-[11px] font-medium uppercase tracking-wider"><EyeOff size={12} /> Hidden</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {ev.status === "pending" && (
                                                <button className="p-2 text-[#10b981] hover:bg-[#dcfce7] rounded-[8px] transition-colors tooltip" title="Approve"><CheckCircle size={18} /></button>
                                            )}
                                            {ev.status !== "hidden" ? (
                                                <button className="p-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-[8px] transition-colors tooltip" title="Hide Event"><EyeOff size={18} /></button>
                                            ) : (
                                                <button className="p-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-[8px] transition-colors tooltip" title="Restore Visibility"><Eye size={18} /></button>
                                            )}
                                            <button className="p-2 text-[#3b82f6] hover:bg-[#dbeafe] rounded-[8px] transition-colors tooltip" title="Edit"><Edit2 size={18} /></button>
                                            <button className="p-2 text-[#ef4444] hover:bg-[#fee2e2] rounded-[8px] transition-colors tooltip" title="Delete Permanent"><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredEvents.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[#64748b] text-[14px]">
                                        No events found in this category.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
