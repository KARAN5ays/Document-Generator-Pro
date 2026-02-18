import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Mail, User, ArrowRight, Loader2, AlertCircle, FileText } from 'lucide-react'

export default function Register({ onSwitchToLogin }) {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fullName: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
    })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match")
            return
        }
        if (!formData.agreeTerms) {
            setError("Please agree to the terms and conditions")
            return
        }

        setIsLoading(true)
        try {
            // Placeholder - backend may need registration endpoint
            setError("Registration is not yet available. Please contact your administrator.")
        } catch (err) {
            setError("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-brand-navy via-slate-900 to-brand-navy overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-pink/20 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
                <div className="absolute top-20 left-20 right-20">
                    <div className="flex items-center gap-3 mb-20">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-pink to-pink-600 flex items-center justify-center shadow-lg shadow-brand-pink/30">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">DocGen</span>
                    </div>
                    <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
                        Join DocGen today
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                        Get started with professional document generation and verification. Create certificates, receipts, and more in minutes.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-10 bg-slate-50/80">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="lg:hidden flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-pink to-pink-600 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-brand-navy">DocGen</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-card border border-slate-200 overflow-hidden">
                        <div className="px-8 pt-10 pb-6">
                            <h2 className="text-2xl font-bold text-brand-navy">Create account</h2>
                            <p className="text-slate-500 mt-1">Join DocGen and get started today</p>
                        </div>

                        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
                            {error && (
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3 text-amber-800 text-sm">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => handleChange('fullName', e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => handleChange('username', e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none"
                                        placeholder="johndoe"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleChange('password', e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.agreeTerms}
                                    onChange={(e) => handleChange('agreeTerms', e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-slate-300 text-brand-pink focus:ring-brand-pink"
                                />
                                <span className="text-sm text-slate-600">
                                    I agree to the{' '}
                                    <a href="#" className="text-brand-pink hover:underline">terms and conditions</a>
                                </span>
                            </label>

                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 bg-brand-navy hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none transition-all"
                                whileHover={!isLoading ? { y: -1 } : {}}
                                whileTap={!isLoading ? { scale: 0.99 } : {}}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                Create Account
                                {!isLoading && <ArrowRight className="w-4 h-4" />}
                            </motion.button>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-slate-500 text-sm">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="font-semibold text-brand-pink hover:underline"
                        >
                            Sign in
                        </button>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}
