import { LayoutDashboard, Calendar, Users, ShieldAlert, LogOut } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const navItems = [
        { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
        { name: "Event Management", icon: Calendar, href: "/admin/events" },
        { name: "Users", icon: Users, href: "/admin/users" },
        { name: "Reports Queue", icon: ShieldAlert, href: "/admin/reports" }
    ];

    return (
        <div className="flex bg-[var(--bg)] min-h-screen font-sans text-[var(--text)]">
            {/* Sidebar */}
            <aside className="w-[260px] bg-[#1a1a1a] text-white flex-shrink-0 flex-col hidden md:flex h-screen sticky top-0 shadow-xl z-20">
                <div className="p-6 pb-2 border-b border-white/10 mb-4">
                    <Link href="/" className="font-serif text-[28px] text-white">Budd <span className="text-[14px] font-sans font-medium text-[var(--accent)] tracking-wider uppercase ml-2 bg-white/10 px-2 py-1 rounded">Admin</span></Link>
                </div>

                <div className="flex-1 px-4 py-4 space-y-1">
                    {navItems.map(item => {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-3 rounded-[10px] text-[14px] font-medium transition-colors text-white/70 hover:text-white hover:bg-white/10"
                            >
                                <item.icon size={18} />
                                {item.name}
                            </Link>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-white/10">
                    <button className="flex items-center gap-3 px-3 py-3 w-full rounded-[10px] text-[13px] font-medium transition-colors text-white/50 hover:text-white hover:bg-white/10">
                        <LogOut size={16} /> Logout Portal
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden bg-[#f8fafc]">
                {children}
            </main>
        </div>
    );
}
