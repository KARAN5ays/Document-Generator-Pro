import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, User, Shield, ArrowRight, Loader2, AlertCircle, FileText, CheckCircle2, Search, CheckCircle, XCircle, Calendar, Fingerprint } from 'lucide-react'
import API from '../api/client'

export default function Login({ onLogin, onSwitchToRegister }) {
    const [activeTab, setActiveTab] = useState('login') // 'login' | 'verify'
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Verification State
    const [verifyCode, setVerifyCode] = useState('')
    const [verifyResult, setVerifyResult] = useState(null)
    const [isVerifying, setIsVerifying] = useState(false)
    const [verifyError, setVerifyError] = useState('')

    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const response = await API.post('token/', { username, password })
            const { access, refresh } = response.data
            localStorage.setItem('token', access)
            localStorage.setItem('refresh_token', refresh)
            onLogin(access)
        } catch (err) {
            console.error("Login failed", err)
            setError(err.response?.status === 401
                ? "Invalid username or password. Please try again."
                : "Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifySubmit = async (e) => {
        e.preventDefault()
        if (verifyCode.length < 8) return

        setIsVerifying(true)
        setVerifyResult(null)
        setVerifyError('')

        try {
            // Simulate scanning
            await new Promise(r => setTimeout(r, 600))

            const response = await API.get(`verify/${verifyCode}/`)
            const doc = response.data?.document
            if (doc) {
                setVerifyResult(doc)
            } else {
                setVerifyError('Document not found or invalid code.')
            }
        } catch (err) {
            console.error("Verification failed", err)
            setVerifyError('Document not found or invalid code.')
        } finally {
            setIsVerifying(false)
        }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    return (
        <div className="min-h-screen flex">
            {/* Left: Branded hero panel */}
            <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-brand-navy via-slate-900 to-brand-navy overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-pink/20 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
                <div className="absolute top-20 left-20 right-20 flex flex-col">
                    <div className="flex items-center gap-3 mb-20">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-pink to-pink-600 flex items-center justify-center shadow-lg shadow-brand-pink/30">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">DocGen</span>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="max-w-md"
                    >
                        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                            Create & verify documents in seconds
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed mb-12">
                            Professional certificates, receipts, letters, and more. Secure, trackable, and ready to share.
                        </p>
                        <div className="space-y-6">
                            {['Certificates', 'Receipts', 'Letters', 'ID Cards', 'Tickets'].map((item, i) => (
                                <motion.div
                                    key={item}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                    className="flex items-center gap-3 text-slate-300"
                                >
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <span>{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right: Auth form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-10 bg-slate-50/80">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-md"
                >
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-pink to-pink-600 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-brand-navy">DocGen</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">

                        {/* Tab Switcher */}
                        <div className="flex border-b border-slate-100">
                            <button
                                onClick={() => setActiveTab('login')}
                                className={`flex-1 py-4 text-sm font-bold text-center transition-colors relative ${activeTab === 'login' ? 'text-brand-navy' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            >
                                Member Login
                                {activeTab === 'login' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-pink" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('verify')}
                                className={`flex-1 py-4 text-sm font-bold text-center transition-colors relative ${activeTab === 'verify' ? 'text-brand-navy' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            >
                                Verify Document
                                {activeTab === 'verify' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-pink" />}
                            </button>
                        </div>

                        <div className="p-6 sm:p-8">
                            <AnimatePresence mode="wait">
                                {activeTab === 'login' ? (
                                    <motion.div
                                        key="login"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-pink/10 to-pink-50 flex items-center justify-center mb-4">
                                                <User className="w-6 h-6 text-brand-pink" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-brand-navy">Welcome back</h2>
                                            <p className="text-slate-500 mt-1">Sign in to your DocGen account</p>
                                        </div>

                                        <form onSubmit={handleLoginSubmit} className="space-y-5">
                                            <AnimatePresence mode="wait">
                                                {error && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm"
                                                    >
                                                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                                        {error}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={username}
                                                        onChange={(e) => setUsername(e.target.value)}
                                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all outline-none"
                                                        placeholder="Enter your username"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-slate-700">Password</label>
                                                    <button type="button" className="text-xs text-brand-pink hover:underline">
                                                        Forgot password?
                                                    </button>
                                                </div>
                                                <div className="relative">
                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all outline-none"
                                                        placeholder="Enter your password"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <motion.button
                                                type="submit"
                                                disabled={isLoading}
                                                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${isLoading
                                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                                    : 'bg-brand-navy hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 hover:shadow-xl'
                                                    }`}
                                                whileHover={!isLoading ? { y: -1 } : {}}
                                                whileTap={!isLoading ? { scale: 0.99 } : {}}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Signing in...
                                                    </>
                                                ) : (
                                                    <>
                                                        Sign In
                                                        <ArrowRight className="w-4 h-4" />
                                                    </>
                                                )}
                                            </motion.button>
                                        </form>

                                        <p className="mt-6 text-center text-slate-500 text-sm">
                                            Don&apos;t have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={onSwitchToRegister}
                                                className="font-semibold text-brand-pink hover:underline"
                                            >
                                                Create account
                                            </button>
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="verify"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                                                <Shield className="w-6 h-6 text-emerald-500" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-brand-navy">Verify Document</h2>
                                            <p className="text-slate-500 mt-1">Enter the 8-digit tracking code</p>
                                        </div>

                                        <form onSubmit={handleVerifySubmit} className="space-y-5">
                                            <div className="relative group">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                                <input
                                                    value={verifyCode}
                                                    onChange={(e) => {
                                                        const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
                                                        setVerifyCode(val)
                                                        setVerifyError('')
                                                        setVerifyResult(null)
                                                    }}
                                                    placeholder="e.g. 38BF6B23"
                                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 font-mono text-lg font-bold tracking-widest focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none uppercase"
                                                />
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {verifyError && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm"
                                                    >
                                                        <XCircle className="w-5 h-5 shrink-0" />
                                                        {verifyError}
                                                    </motion.div>
                                                )}

                                                {verifyResult && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3"
                                                    >
                                                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                                            <CheckCircle className="w-5 h-5" />
                                                            Verified Authentic
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-emerald-600/70 text-xs uppercase font-bold">Type</span>
                                                                <span className="font-semibold text-emerald-900">{verifyResult.template_type}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-emerald-600/70 text-xs uppercase font-bold">Date</span>
                                                                <span className="font-semibold text-emerald-900">{formatDate(verifyResult.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            <motion.button
                                                type="submit"
                                                disabled={isVerifying || verifyCode.length < 8}
                                                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${isVerifying || verifyCode.length < 8
                                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-xl'
                                                    }`}
                                                whileHover={!isVerifying && verifyCode.length >= 8 ? { y: -1 } : {}}
                                                whileTap={!isVerifying && verifyCode.length >= 8 ? { scale: 0.99 } : {}}
                                            >
                                                {isVerifying ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                        Verifying...
                                                    </>
                                                ) : (
                                                    <>
                                                        Verify Now
                                                        <ArrowRight className="w-4 h-4" />
                                                    </>
                                                )}
                                            </motion.button>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
