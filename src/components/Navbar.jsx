
import { motion } from 'framer-motion'
import { Layers, Menu } from 'lucide-react'

export default function Navbar({ onToggleSidebar }) {
    return (
        <motion.nav
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm z-50"
        >
            <div className="h-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-6">
                {/* Left Section - Logo + Mobile Menu */}
                <div className="flex items-center gap-3">
                    {onToggleSidebar && (
                        <motion.button
                            onClick={onToggleSidebar}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                            whileTap={{ scale: 0.95 }}
                            aria-label="Toggle menu"
                        >
                            <Menu className="w-6 h-6" />
                        </motion.button>
                    )}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-pink to-pink-600 flex items-center justify-center shadow-md shadow-brand-pink/20 ring-1 ring-white/50">
                            <Layers className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-brand-pink tracking-tight">DocGen</h1>
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold -mt-0.5">
                                Tech Cloud
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.nav>
    )
}
