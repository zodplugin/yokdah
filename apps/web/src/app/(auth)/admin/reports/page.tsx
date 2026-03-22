"use client";

import { ShieldAlert, CheckCircle, Clock, XCircle, Search, Filter, MessageSquare, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function AdminReports() {
    const [activeTab, setActiveTab] = useState("pending");

    const reports = [
        { id: "r1", reporter: "Elise van D.", reported: "Mika R.", category: "No-show without notice", status: "pending", date: "2 hours ago", details: "Mika didn't show up to the DGTL pre-drinks and stopped replying to our messages on the app." },
        { id: "r2", reporter: "Anonymous", reported: "John Doe", category: "Inappropriate messages", status: "pending", date: "5 hours ago", details: "Sent highly inappropriate and aggressive messages after I said I couldn't make it to the event." },
        { id: "r3", reporter: "Aiko T.", reported: "Sarah J.", category: "Spam", status: "resolved", date: "1 day ago", details: "Keeps sending links to crypto scams in the event group chat." },
        { id: "r4", reporter: "Tom M.", reported: "Elise van D.", category: "Fake profile", status: "dismissed", date: "2 days ago", details: "Profile picture looks AI generated." },
    ];

    const filteredReports = reports.filter(r => {
        if (activeTab === "all") return true;
        return r.status === activeTab;
    });

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen text-[#0f172a]">
            <div className="mb-8">
                <h1 className="font-serif text-[40px] leading-none mb-2 text-[#0f172a]">Reports Queue</h1>
                <p className="text-[15px] text-[#64748b]">Review user reports, moderate disputes, and issue account penalties.</p>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-[20px] shadow-sm overflow-hidden flex flex-col">
                {/* Filters and Search */}
                <div className="p-6 border-b border-[#e2e8f0] flex flex-col md:flex-row md:items-center gap-4 bg-[#f8fafc]">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                        <input type="text" placeholder="Search by user, reporter, or keywords..." className="w-full bg-white border border-[#e2e8f0] rounded-[10px] pl-11 pr-4 py-2.5 text-[14px] outline-none focus:border-[#cbd5e1] focus:ring-2 focus:ring-[#f1f5f9] transition-all" />
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-white border border-[#e2e8f0] text-[#475569] px-4 py-2.5 rounded-[10px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#f1f5f9]">
                            <Filter size={16} /> Filters
                        </button>
                        <select className="bg-white border border-[#e2e8f0] text-[#475569] px-4 py-2.5 rounded-[10px] text-[14px] font-medium outline-none cursor-pointer hover:bg-[#f1f5f9]">
                            <option>Sort: Oldest First</option>
                            <option>Sort: Newest</option>
                            <option>Sort: Severity</option>
                        </select>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 px-6 border-b border-[#e2e8f0] bg-white text-[14px] font-medium">
                    <button onClick={() => setActiveTab("pending")} className={`py-4 px-1 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'border-[#ef4444] text-[#ef4444]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}>
                        Action Required <span className="bg-[#fee2e2] text-[#b91c1c] px-2 py-0.5 rounded-full text-[11px]">2</span>
                    </button>
                    <button onClick={() => setActiveTab("resolved")} className={`py-4 px-1 border-b-2 transition-colors ${activeTab === 'resolved' ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}>Resolved</button>
                    <button onClick={() => setActiveTab("dismissed")} className={`py-4 px-1 border-b-2 transition-colors ${activeTab === 'dismissed' ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}>Dismissed</button>
                    <button onClick={() => setActiveTab("all")} className={`py-4 px-1 border-b-2 transition-colors ${activeTab === 'all' ? 'border-[#0f172a] text-[#0f172a]' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'}`}>All Reports</button>
                </div>

                {/* List */}
                <div className="divide-y divide-[#e2e8f0] bg-[#f8fafc]">
                    {filteredReports.map(r => (
                        <div key={r.id} className="p-6 md:p-8 bg-white hover:bg-[#f8fafc] transition-colors">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Report Metadata */}
                                <div className="w-full md:w-1/3 flex-shrink-0">
                                    <div className="flex items-center gap-2 mb-3">
                                        {r.status === "pending" && <span className="inline-flex items-center gap-1 bg-[#fef9c3] text-[#854d0e] border border-[#fde047] px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"><Clock size={10} /> Pending</span>}
                                        {r.status === "resolved" && <span className="inline-flex items-center gap-1 bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"><CheckCircle size={10} /> Resolved</span>}
                                        {r.status === "dismissed" && <span className="inline-flex items-center gap-1 bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0] px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"><XCircle size={10} /> Dismissed</span>}
                                        <span className="text-[12px] text-[#64748b]">{r.date}</span>
                                    </div>

                                    <div className="mb-4">
                                        <div className="text-[11px] uppercase tracking-wider text-[#64748b] font-medium mb-1">Reported User</div>
                                        <div className="text-[15px] font-medium text-[#0f172a] underline decoration-[#cbd5e1] underline-offset-4 decoration-dashed hover:decoration-solid cursor-pointer">{r.reported}</div>
                                    </div>

                                    <div>
                                        <div className="text-[11px] uppercase tracking-wider text-[#64748b] font-medium mb-1">Reported By</div>
                                        <div className="text-[14px] text-[#475569]">{r.reporter}</div>
                                    </div>
                                </div>

                                {/* Report Content */}
                                <div className="flex-1">
                                    <div className="text-[16px] font-medium text-[#0f172a] mb-2 flex items-center gap-2">
                                        <ShieldAlert size={16} className={r.status === 'pending' ? 'text-red-500' : 'text-[#64748b]'} />
                                        {r.category}
                                    </div>
                                    <div className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-[12px] p-4 text-[14px] text-[#475569] leading-relaxed mb-4">
                                        "{r.details}"
                                    </div>

                                    {/* Actions */}
                                    {r.status === "pending" && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-[8px] text-[13px] font-medium transition-colors shadow-sm">Suspend 7 Days</button>
                                            <button className="px-4 py-2 bg-white border border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9] rounded-[8px] text-[13px] font-medium transition-colors shadow-sm flex items-center gap-1.5"><AlertTriangle size={14} /> Send Warning</button>
                                            <button className="px-4 py-2 bg-white border border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9] rounded-[8px] text-[13px] font-medium transition-colors shadow-sm flex items-center gap-1.5"><MessageSquare size={14} /> View Chat Log</button>
                                            <div className="flex-1 min-w-[10px]"></div>
                                            <button className="px-4 py-2 text-[#64748b] hover:bg-[#f1f5f9] rounded-[8px] text-[13px] font-medium transition-colors">Dismiss Report</button>
                                        </div>
                                    )}
                                    {r.status !== "pending" && (
                                        <div className="text-[13px] text-[#64748b] font-medium">
                                            Action taken by admin. Case closed.
                                            <button className="ml-2 text-[#3b82f6] hover:underline">Re-open case</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredReports.length === 0 && (
                        <div className="p-12 text-center text-[#64748b]">
                            <ShieldAlert size={32} className="mx-auto mb-4 opacity-50" />
                            <p className="text-[15px] font-medium">No reports in this queue.</p>
                            <p className="text-[14px]">You're all caught up!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
