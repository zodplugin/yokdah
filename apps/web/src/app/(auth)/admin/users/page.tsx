"use client";

import { Search, Filter, Shield, AlertTriangle, UserX, UserCheck, Trash2, List } from "lucide-react";
import { useState } from "react";

export default function AdminUsers() {
    const users = [
        { id: "u1", name: "Elise van D.", email: "elise@example.com", reliability: 94, joined: "Nov 2025", status: "active", reports: 0 },
        { id: "u2", name: "Mika R.", email: "mika.r@example.com", reliability: 32, joined: "Nov 2025", status: "warned", reports: 2 },
        { id: "u3", name: "John Doe", email: "johndoe@email.com", reliability: 15, joined: "Dec 2025", status: "suspended", reports: 4 },
        { id: "u4", name: "Aiko T.", email: "aiko.t@example.com", reliability: 88, joined: "Jan 2026", status: "active", reports: 0 },
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen text-[#0f172a]">
            <div className="mb-8">
                <h1 className="font-serif text-[40px] leading-none mb-2 text-[#0f172a]">User Management</h1>
                <p className="text-[15px] text-[#64748b]">Search user accounts, review history, and apply moderation actions.</p>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-[20px] shadow-sm overflow-hidden flex flex-col">
                {/* Filters and Search */}
                <div className="p-6 border-b border-[#e2e8f0] flex flex-col md:flex-row md:items-center gap-4 bg-[#f8fafc]">
                    <div className="flex-1 relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                        <input type="text" placeholder="Search by email or display name..." className="w-full bg-white border border-[#e2e8f0] rounded-[10px] pl-11 pr-4 py-2.5 text-[14px] outline-none focus:border-[#cbd5e1] focus:ring-2 focus:ring-[#f1f5f9] transition-all" />
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-white border border-[#e2e8f0] text-[#475569] px-4 py-2.5 rounded-[10px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#f1f5f9]">
                            <Filter size={16} /> Filters
                        </button>
                        <select className="bg-white border border-[#e2e8f0] text-[#475569] px-4 py-2.5 rounded-[10px] text-[14px] font-medium outline-none cursor-pointer hover:bg-[#f1f5f9]">
                            <option>Sort: Newest</option>
                            <option>Sort: Lowest Reliability</option>
                            <option>Sort: Most Reports</option>
                        </select>
                    </div>
                </div>

                {/* Table/List */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f8fafc] text-[#64748b] text-[12px] uppercase tracking-wider font-medium border-b border-[#e2e8f0]">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Trust Metrics</th>
                                <th className="px-6 py-4 hidden sm:table-cell">Account Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0] bg-white">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-[#f8fafc] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center font-medium text-[13px] text-[#475569] font-sans shadow-sm">
                                                {u.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-[14px] text-[#0f172a] mb-0.5">{u.name}</div>
                                                <div className="text-[12px] text-[#64748b]">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-[13px]">
                                                <span className="text-[#64748b] w-[70px]">Reliability:</span>
                                                <span className={`font-medium ${u.reliability >= 80 ? 'text-[#10b981]' : u.reliability >= 40 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>{u.reliability}/100</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[13px]">
                                                <span className="text-[#64748b] w-[70px]">Reports:</span>
                                                <span className={`font-medium ${u.reports > 0 ? 'text-[#ef4444]' : 'text-[#0f172a]'}`}>{u.reports}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell">
                                        {u.status === "active" && <span className="inline-flex items-center gap-1 bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] px-2.5 py-1 rounded-[100px] text-[11px] font-medium uppercase tracking-wider"><Shield size={12} /> Active</span>}
                                        {u.status === "warned" && <span className="inline-flex items-center gap-1 bg-[#fef9c3] text-[#854d0e] border border-[#fde047] px-2.5 py-1 rounded-[100px] text-[11px] font-medium uppercase tracking-wider"><AlertTriangle size={12} /> Warned</span>}
                                        {u.status === "suspended" && <span className="inline-flex items-center gap-1 bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca] px-2.5 py-1 rounded-[100px] text-[11px] font-medium uppercase tracking-wider"><UserX size={12} /> Suspended</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-2 text-[#475569] hover:bg-[#f1f5f9] rounded-[8px] transition-colors tooltip" title="View Profile History"><List size={18} /></button>
                                            {u.status === "suspended" ? (
                                                <button className="p-2 text-[#10b981] hover:bg-[#dcfce7] rounded-[8px] transition-colors tooltip" title="Unsuspend/Unban"><UserCheck size={18} /></button>
                                            ) : (
                                                <button className="p-2 text-[#f59e0b] hover:bg-[#fef3c7] rounded-[8px] transition-colors tooltip" title="Suspend 7 Days"><AlertTriangle size={18} /></button>
                                            )}
                                            <button className="p-2 text-[#ef4444] hover:bg-[#fee2e2] rounded-[8px] transition-colors tooltip" title="Ban Permanent"><UserX size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
