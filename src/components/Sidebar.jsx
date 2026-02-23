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
                        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            <aside
                className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-[260px] bg-white border-r border-slate-200 px-4 py-6 flex flex-col z-40 transform transition-transform duration-300 ease-out
                    lg:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Brand Section */}
                <div className="mb-8 px-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-pink to-pink-600 flex items-center justify-center shadow-md shadow-brand-pink/20 shrink-0">
                            <Layers className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-brand-navy leading-none">DocGen</h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold flex items-center gap-1 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                Tech Cloud
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
                            <div key={group.label} className="space-y-1">
                                {/* Group Header */}
                                <motion.div
                                    variants={itemVariants}
                                    className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2"
                                >
                                    {group.label}
                                </motion.div>

                                {/* Group Items */}
                                <div className="space-y-0.5">
                                    {group.items.map((item) => {
                                        const Icon = item.icon
                                        const isActive = activeView === item.id

                                        return (
                                            <motion.button
                                                key={item.id}
                                                variants={itemVariants}
                                                onClick={() => onViewChange(item.id)}
                                                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group overflow-hidden ${isActive
                                                    ? 'bg-pink-50 text-brand-pink'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeTabIndicator"
                                                        className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-pink"
                                                    />
                                                )}

                                                <Icon
                                                    className={`w-5 h-5 transition-all relative z-10 ${isActive
                                                        ? 'text-brand-pink'
                                                        : 'text-slate-400 group-hover:text-slate-600'
                                                        }`}
                                                    strokeWidth={2}
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
                <div className="mt-auto pt-4 border-t border-slate-200">
                    <div className="relative group/profile">
                        <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left">
                            <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-brand-pink text-[11px] font-bold shrink-0 ring-1 ring-slate-200/50">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate leading-tight">{username}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">{role}</p>
                            </div>
                            <ChevronUp className="w-4 h-4 text-slate-400 group-hover/profile:text-slate-600 transition-colors" />
                        </button>

                        {/* Popover Menu */}
                        <div className="absolute bottom-full left-0 w-full mb-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-card opacity-0 scale-95 invisible group-hover/profile:opacity-100 group-hover/profile:scale-100 group-hover/profile:visible transition-all duration-200 origin-bottom">
                            <button
                                onClick={() => onViewChange('settings')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-brand-navy hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <User className="w-4 h-4 text-slate-400" />
                                Profile
                            </button>
                            <button
                                onClick={() => onViewChange('settings')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-brand-navy hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <Settings className="w-4 h-4 text-slate-400" />
                                Settings
                            </button>
                            <div className="my-1 border-t border-slate-100"></div>
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4 text-red-500" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
