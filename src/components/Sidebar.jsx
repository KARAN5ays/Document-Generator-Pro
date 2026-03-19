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
    ChevronUp,
    Users,
    Image,
    FileText,
    CheckSquare,
    List,
    ChevronDown,
} from 'lucide-react'

const NAV_SECTIONS = [
    {
        id: 'documents',
        label: 'Documents',
        color: 'brand-purple',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'generate', label: 'Create Document', icon: FilePlus },
            { id: 'documents', label: 'My Documents', icon: FolderOpen },
            { id: 'verify', label: 'Verify Document', icon: ShieldCheck },
            { id: 'builder', label: 'Template Builder', icon: FileEdit },
            { id: 'bulk', label: 'Bulk Issuance', icon: Users },
            { id: 'assets', label: 'Asset Manager', icon: Image },
        ]
    },
    {
        id: 'memos',
        label: 'Memos',
        color: 'brand-pink',
        items: [
            { id: 'memo-create', label: 'Create Memo', icon: FileText },
            { id: 'memo-list', label: 'My Memos', icon: List },
            { id: 'memo-inbox', label: 'Memo Inbox', icon: CheckSquare },
        ]
    },
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
    const initials = username
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const isMemoSection = (sectionId) => sectionId === 'memos'

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
                className={`fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-slate-200 py-0 flex flex-col z-40 transform transition-transform duration-300 ease-out
                    lg:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Brand Section */}
                <div className="h-16 px-6 flex items-center shrink-0">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-9 h-9 rounded-xl bg-brand-purple flex items-center justify-center shadow-md shadow-brand-purple/20 shrink-0">
                            <Layers className="text-white w-5 h-5" />
                        </div>
                        <h1 className="text-[20px] font-light tracking-tight text-brand-purple leading-none">Dastavez</h1>
                    </motion.div>
                </div>

                {/* Navigation Sections */}
                <nav className="flex-1 overflow-y-auto scrollbar-hide pt-3">
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                        {NAV_SECTIONS.map((section) => {
                            const isMemo = isMemoSection(section.id)
                            const activeColor = isMemo ? 'none' : 'none'
                            const activeBg = isMemo ? 'bg-pink-50 border-brand-pink   ' : 'bg-pink-50 border-brand-pink'
                            const activeIcon = isMemo ? 'text-brand-pink' : 'text-brand-pink'

                            return (
                                <div key={section.id}>
                                    {/* Section Header */}
                                    <motion.div
                                        variants={itemVariants}
                                        className="px-4 py-2"
                                    >
                                        <span className={`text-[10px] font-light uppercase tracking-widest ${isMemo ? 'text-brand-pink' : 'text-brand-pink'}`}>
                                            {section.label}
                                        </span>
                                    </motion.div>                                    {/* Section Items */}
                                    <div className="space-y-0.5 mt-1 mb-2">
                                        {section.items.map((item) => {
                                            const Icon = item.icon
                                            const isActive = activeView === item.id

                                            return (
                                                <motion.button
                                                    key={item.id}
                                                    variants={itemVariants}
                                                    onClick={() => onViewChange(item.id)}
                                                    className={`relative w-full flex items-center gap-3 pl-6 pr-4 py-2.5 text-sm font-light transition-all group overflow-hidden border-r-[3px] ${isActive
                                                        ? `${activeBg} ${activeColor}`
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
                                                        }`}
                                                >
                                                    <Icon
                                                        className={`w-[18px] h-[18px] transition-all relative z-10 ${isActive
                                                            ? activeIcon
                                                            : 'text-slate-400 group-hover:text-slate-600'
                                                            }`}
                                                        strokeWidth={2}
                                                    />
                                                    <span className={`relative z-10 transition-colors ${isActive ? 'font-light' : 'font-light'}`}>
                                                        {item.label}
                                                    </span>
                                                </motion.button>
                                            )
                                        })}
                                    </div>

                                    {/* Divider */}
                                    <div className="mx-4 border-t border-slate-100 mt-1" />
                                </div>
                            )
                        })}
                    </motion.div>
                </nav>

                {/* User Profile Section */}
                <div className="mt-auto px-4 pt-4 border-t border-slate-200">
                    <div className="relative group/profile">
                        <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left">
                            <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-brand-pink text-[11px] font-light shrink-0 ring-1 ring-slate-200/50">
                                {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-light text-slate-800 truncate leading-tight">{username}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-light mt-0.5">{role}</p>
                            </div>
                            <ChevronUp className="w-4 h-4 text-slate-400 group-hover/profile:text-slate-600 transition-colors" />
                        </button>

                        {/* Popover Menu */}
                        <div className="absolute bottom-full left-0 w-full mb-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-card opacity-0 scale-95 invisible group-hover/profile:opacity-100 group-hover/profile:scale-100 group-hover/profile:visible transition-all duration-200 origin-bottom">
                            <button
                                onClick={() => onViewChange('settings')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-light text-slate-600 hover:text-brand-navy hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <User className="w-4 h-4 text-slate-400" />
                                Profile
                            </button>
                            <button
                                onClick={() => onViewChange('settings')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-light text-slate-600 hover:text-brand-navy hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <Settings className="w-4 h-4 text-slate-400" />
                                Settings
                            </button>
                            <div className="my-1 border-t border-slate-100"></div>
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-light text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
