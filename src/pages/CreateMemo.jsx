import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Send, Loader2, AlertCircle, Building2, AlignLeft, Target, AlignRight, LayoutList, DollarSign } from 'lucide-react'
import API from '../api/client'

const MEMO_TYPES = [
    { value: 'GENERAL', label: 'General' },
    { value: 'FINANCE', label: 'Finance' },
    { value: 'HR', label: 'Human Resources' },
    { value: 'IT', label: 'Information Technology' },
    { value: 'OTHER', label: 'Other' },
]

export default function CreateMemo({ token, onNavigate }) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [merchantId, setMerchantId] = useState(null)

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        from_department: '',
        to_department: '',
        subject: '',
        purpose: '',
        background: '',
        memo_type: 'GENERAL',
    })

    // Fetch user's merchant ID on mount
    useEffect(() => {
        const fetchUserAndMerchant = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } }
                const res = await API.get('users/me/', config)
                // We assume res.data contains merchant or we need another endpoint
                if (res.data.merchant) {
                    setMerchantId(res.data.merchant)
                }
            } catch (err) {
                console.error("Failed to fetch user merchant", err)
            }
        }
        fetchUserAndMerchant()
    }, [token])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        if (!merchantId) {
            setError("Cannot determine your merchant ID. Please contact support.")
            return
        }

        setIsLoading(true)
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } }
            const payload = {
                ...formData,
                merchant: merchantId,
                amount: parseFloat(formData.amount) || 0.00
            }

            await API.post('memos/', payload, config)
            setSuccess(true)

            // Reset form
            setFormData({
                title: '',
                amount: '',
                from_department: '',
                to_department: '',
                subject: '',
                purpose: '',
                background: '',
                memo_type: 'GENERAL',
            })

            // Navigate to My Memos after short delay
            setTimeout(() => {
                onNavigate('memo-list')
            }, 1500)

        } catch (err) {
            console.error("Failed to create memo", err)
            setError(err.response?.data?.detail || "Failed to create memo. Please check the fields and try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto px-4"
        >
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-light text-brand-navy tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-brand-pink shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        Create New Memo
                    </h1>
                    <p className="text-slate-500 mt-2 ml-14">Draft and submit a new memorandum for approval.</p>
                </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md rounded-[1.25rem] border border-slate-100/80 shadow-card overflow-hidden transition-smooth">
                <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm overflow-hidden"
                            >
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 text-emerald-700 text-sm overflow-hidden"
                            >
                                <Target className="w-5 h-5 shrink-0 mt-0.5" />
                                Memo created successfully! Redirecting...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Meta section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                        <div>
                            <label className="block text-xs font-light text-slate-500 uppercase tracking-wider mb-2">Memo Type</label>
                            <div className="relative">
                                <LayoutList className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <select
                                    name="memo_type"
                                    value={formData.memo_type}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all outline-none font-light appearance-none"
                                >
                                    {MEMO_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-light text-slate-500 uppercase tracking-wider mb-2">Amount (if applicable)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="number"
                                    name="amount"
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all outline-none font-light"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Departments */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                        <div>
                            <label className="block text-xs font-light text-slate-500 uppercase tracking-wider mb-2">From Department</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="from_department"
                                    value={formData.from_department}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all outline-none font-light"
                                    placeholder="e.g. IT Department"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-light text-slate-500 uppercase tracking-wider mb-2">To Department</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    name="to_department"
                                    value={formData.to_department}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all outline-none font-light"
                                    placeholder="e.g. Finance"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-light text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all outline-none font-light text-lg"
                                placeholder="Brief subject of the memo"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-light text-slate-500 uppercase tracking-wider mb-2">Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all outline-none font-light text-xl"
                                placeholder="Full formal title"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-light text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlignLeft className="w-4 h-4" /> Background
                            </label>
                            <textarea
                                name="background"
                                value={formData.background}
                                onChange={handleChange}
                                required
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all outline-none font-light resize-y"
                                placeholder="Provide the context and background for this memo..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-light text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlignRight className="w-4 h-4" /> Purpose
                            </label>
                            <textarea
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleChange}
                                required
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all outline-none font-light resize-y"
                                placeholder="Clearly state the purpose and required actions..."
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => onNavigate('dashboard')}
                            className="px-6 py-3 rounded-xl font-light text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !merchantId}
                            className={`px-8 py-3 rounded-xl font-light flex items-center gap-2 transition-all ${isLoading || !merchantId
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-brand-navy hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 hover:shadow-xl'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Submit for Approval
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    )
}
