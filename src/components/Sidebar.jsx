import { motion, AnimatePresence } from 'framer-motion'
import {
    FilePlus,
    ShieldCheck,
    LayoutDashboard,
    LogOut,
    Layers,
    FileEdit,
    FolderOpen,
    User,
    Settings,
    ChevronUp
} from 'lucide-react'

const NAV_GROUPS = [
    {
        label: 'Main',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'generate', label: 'Create Document', icon: FilePlus },
            { id: 'documents', label: 'Your Documents', icon: FolderOpen },
            { id: 'verify', label: 'Verify Document', icon: ShieldCheck },
            { id: 'builder', label: 'Template Builder', icon: FileEdit },
        ]
    }
]

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 }
}

export default function Sidebar({ activeView, onViewChange, onLogout, isOpen = false, onClose, username = 'Admin User', role = 'Standard User' }) {
    // Extract initials from username
    const initials = username
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            <aside
                className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-[#0f172a] text-white px-5 py-6 flex flex-col z-40 transform transition-transform duration-300 ease-out
                    lg:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Brand Section */}
                <div className="mb-6 pl-1">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-pink to-pink-600 flex items-center justify-center shadow-lg shadow-brand-pink/30 ring-1 ring-white/10">
                            <Layers className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">DocGen</h1>
                            <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                                Enterprise
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Navigation Groups */}
                <nav className="flex-1 overflow-y-auto scrollbar-hide pt-1">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-6"
                    >
                        {NAV_GROUPS.map((group) => (
                            <div key={group.label} className="space-y-1.5">
                                {/* Group Header */}
                                <motion.div
                                    variants={itemVariants}
                                    className="px-3 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider"
                                >
                                    {group.label}
                                </motion.div>

                                {/* Group Items */}
                                <div className="space-y-1">
                                    {group.items.map((item) => {
                                        const Icon = item.icon
                                        const isActive = activeView === item.id

                                        return (
                                            <motion.button
                                                key={item.id}
                                                variants={itemVariants}
                                                onClick={() => onViewChange(item.id)}
                                                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group overflow-hidden ${isActive
                                                    ? 'bg-white/10 text-white shadow-lg shadow-black/20 backdrop-blur-md border border-white/5'
                                                    : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                                                    }`}
                                                whileHover={{ x: 4 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeTabIndicator"
                                                        className="absolute left-0 top-0 bottom-0 w-1 bg-brand-pink rounded-r-full"
                                                    />
                                                )}

                                                <Icon
                                                    className={`w-5 h-5 transition-all relative z-10 ${isActive
                                                        ? 'text-brand-pink drop-shadow-md'
                                                        : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'
                                                        }`}
                                                    strokeWidth={isActive ? 2.5 : 2}
                                                />
                                                <span className={`relative z-10 transition-colors ${isActive ? 'font-bold' : 'font-medium'}`}>
                                                    {item.label}
                                                </span>
                                            </motion.button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </nav>

                {/* User Profile Section */}
                <div className="mt-auto pt-4 border-t border-white/10">
                    <div className="relative group">
                        <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-pink to-pink-600 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white/10 shrink-0">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{username}</p>
                                <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">{role}</p>
                            </div>
                            <ChevronUp className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
                        </button>

                        {/* Popover Menu (Simplified for Sidebar) */}
                        <div className="absolute bottom-full left-0 w-full mb-2 p-1.5 bg-[#1e293b] border border-white/10 rounded-xl shadow-xl opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible transition-all duration-200 origin-bottom">
                            <button
                                onClick={() => onViewChange('settings')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <User className="w-3.5 h-3.5" />
                                Profile
                            </button>
                            <button
                                onClick={() => onViewChange('settings')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                Settings
                            </button>
                            <div className="my-1 border-t border-white/5"></div>
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
