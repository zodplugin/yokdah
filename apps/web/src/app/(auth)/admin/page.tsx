"use client";

import { Users, Calendar, MessageSquare, AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";

export default function AdminDashboard() {
    const stats = [
        { title: "Total Users", value: "14,892", change: "+124 today", icon: Users },
        { title: "Active Events", value: "342", change: "+12 pending review", icon: Calendar },
        { title: "Matches Formed", value: "8,210", change: "+45 today", icon: CheckCircle2 },
        { title: "Match Success", value: "84%", change: "+2.4% vs last week", icon: TrendingUp },
        { title: "Active Chats", value: "412", change: "Real-time", icon: MessageSquare },
        { title: "Pending Reports", value: "8", change: "Requires attention", icon: AlertTriangle, alert: true }
    ];

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen">
            <div className="mb-10">
                <h1 className="font-serif text-[40px] leading-none mb-2 text-[#0f172a]">Command Center</h1>
                <p className="text-[15px] text-[#64748b]">Overview of platform activity and queues.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {stats.map((stat, idx) => (
                    <div key={idx} className={`bg-white rounded-[20px] p-6 border shadow-sm ${stat.alert ? 'border-red-200 bg-red-50' : 'border-[#e2e8f0]'}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${stat.alert ? 'bg-red-100 text-red-600' : 'bg-[#f1f5f9] text-[#475569]'}`}>
                                <stat.icon size={22} />
                            </div>
                        </div>
                        <h3 className="text-[32px] font-serif leading-none mb-1 text-[#0f172a]">{stat.value}</h3>
                        <div className="flex items-baseline justify-between">
                            <span className="text-[14px] font-medium text-[#64748b]">{stat.title}</span>
                            <span className={`text-[12px] font-medium ${stat.alert ? 'text-red-600' : 'text-[#10b981]'}`}>{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Events Review */}
                <div className="bg-white border text-[#0f172a] border-[#e2e8f0] rounded-[20px] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
                        <h3 className="font-medium">Events Pending Review</h3>
                        <span className="bg-[#e2e8f0] text-[#475569] text-[12px] px-2.5 py-1 rounded-[100px] font-medium">12 New</span>
                    </div>
                    <div className="divide-y divide-[#e2e8f0]">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="p-5 flex items-center justify-between hover:bg-[#f8fafc] transition-colors">
                                <div>
                                    <div className="font-medium text-[14px] mb-1">Boiler Room Amsterdam</div>
                                    <div className="text-[13px] text-[#64748b]">Resident Advisor • 18 Oct 2025</div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 text-[12px] font-medium bg-[#10b981] text-white rounded-[8px] hover:bg-[#059669]">Approve</button>
                                    <button className="px-3 py-1.5 text-[12px] font-medium bg-white border border-[#e2e8f0] text-[#475569] rounded-[8px] hover:bg-[#f1f5f9]">Hide</button>
                                </div>
                            </div>
                        ))}
                        <div className="p-4 text-center">
                            <button className="text-[13px] font-medium text-[var(--accent-text)] hover:underline">View all pending events</button>
                        </div>
                    </div>
                </div>

                {/* Active Reports */}
                <div className="bg-white border text-[#0f172a] border-[#e2e8f0] rounded-[20px] shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
                        <h3 className="font-medium text-red-600 flex items-center gap-2"><AlertTriangle size={16} /> Action Required</h3>
                        <span className="bg-red-100 text-red-600 text-[12px] px-2.5 py-1 rounded-[100px] font-medium">8 Reports</span>
                    </div>
                    <div className="divide-y divide-[#e2e8f0]">
                        {[1, 2].map(i => (
                            <div key={i} className="p-5 hover:bg-[#f8fafc] transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        <span className="font-medium text-[14px]">johndoe@email.com</span>
                                    </div>
                                    <span className="text-[11px] text-[#64748b] font-medium uppercase">3rd Strike</span>
                                </div>
                                <div className="text-[13px] text-[#475569] bg-[#f1f5f9] p-3 rounded-[8px] mb-3">
                                    "User has no-showed twice this month without any notice."
                                </div>
                                <div className="flex gap-2">
                                    <button className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-[12px] font-medium rounded-[8px]">Suspend 7 Days</button>
                                    <button className="w-full py-2 bg-white border border-[#e2e8f0] hover:bg-[#f1f5f9] text-[#475569] text-[12px] font-medium rounded-[8px]">Review Log</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
