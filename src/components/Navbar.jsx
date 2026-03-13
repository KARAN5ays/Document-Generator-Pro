
import { motion } from 'framer-motion'
import { Layers, Menu } from 'lucide-react'

export default function Navbar({ onToggleSidebar }) {
    return (
        <motion.nav
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 lg:left-[260px] right-0 h-16 bg-white border-b border-slate-200 shadow-sm z-30 flex items-center"
        >
            <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sm:gap-6">
                {/* Left Section - Logo + Mobile Menu */}
                <div className="flex items-center gap-3">
                    {onToggleSidebar && (
                        <motion.button
                            onClick={onToggleSidebar}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-50 text-slate-500"
                            whileTap={{ scale: 0.95 }}
                            aria-label="Toggle menu"
                        >
                            <Menu className="w-5 h-5" />
                        </motion.button>
                    )}
                    {/* Empty left section for desktop, just mobile menu */}
                </div>
            </div>
        </motion.nav>
    )
}
