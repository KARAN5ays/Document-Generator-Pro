import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Search, Loader2, X, CheckSquare, MessageSquare, AlertCircle } from 'lucide-react'
import API from '../api/client'

export default function MemoInbox({ token, onNavigate }) {
    const [memos, setMemos] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedMemo, setSelectedMemo] = useState(null)
    const [userRole, setUserRole] = useState('')

    // Approval action state
    const [remarks, setRemarks] = useState('')
    const [isActionLoading, setIsActionLoading] = useState(false)
    const [actionError, setActionError] = useState('')

    useEffect(() => {
        // Fetch User role first to correctly filter pending approvals
        const init = async () => {
            setIsLoading(true)
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } }
                const userRes = await API.get('users/me/', config)
                // Need the actual string name of the role
                const myRoleName = userRes.data.role || 'User'
                setUserRole(myRoleName)

                // Fetch memos directly (backend limits to merchant/user automatically)
                const memosRes = await API.get('memos/', config)
                setMemos(memosRes.data)
            } catch (err) {
                console.error("Failed to load memo inbox", err)
            } finally {
                setIsLoading(false)
            }
        }
        init()
    }, [token])

    // Memo inbox: Pending memos where an action is required.
    // We let the backend handle the 403 permission error if they click approve and are unauthorized.
    const pendingMemos = memos.filter(memo => {
        if (memo.approval_status !== 'Pending') return false
        if (!memo.next_action) return false
        return true
    })

    const filteredMemos = pendingMemos.filter(memo => {
        return memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            memo.reference_number.toLowerCase().includes(searchTerm.toLowerCase())
    })

    const handleAction = async (actionType) => {
        setIsActionLoading(true)
        setActionError('')
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } }
            // POST /memos/<id>/approve/ or /reject/
            await API.post(`memos/${selectedMemo.id}/${actionType}/`, { remarks }, config)

            // Re-fetch memos after successful action to update the Inbox
            const memosRes = await API.get('memos/', config)
            setMemos(memosRes.data)

            // Close the modal and show success (implicitly by disappearing from Inbox)
            setSelectedMemo(null)
            setRemarks('')
        } catch (err) {
            console.error(`Failed to ${actionType} memo`, err)
            setActionError(err.response?.data?.detail || "Action failed due to a server error. Please try again.")
        } finally {
            setIsActionLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col h-[calc(100vh-8rem)]"
        >
            <div className="mb-8 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-light text-brand-navy tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                            <CheckSquare className="w-5 h-5" />
                        </div>
                        Memo Inbox
                    </h1>
                    <p className="text-slate-500 mt-2 ml-14">Memos requiring your attention and approval.</p>
                </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-[1.25rem] border border-slate-100/80 shadow-card p-2 flex flex-col md:flex-row gap-2 transition-smooth shrink-0 mb-6 z-10">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search pending requests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-transparent bg-transparent text-slate-800 placeholder:text-slate-400 focus:bg-slate-50/50 focus:border-slate-200 transition-all outline-none font-light"
                    />
                </div>
            </div>

            <div className="flex-1 bg-white/95 backdrop-blur-md rounded-[1.25rem] border border-slate-100/80 shadow-card overflow-hidden transition-smooth flex flex-col h-full">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                        <p className="text-slate-400 text-sm font-light">Loading inbox...</p>
                    </div>
                ) : filteredMemos.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <CheckSquare className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg text-slate-700 font-light mb-1">You're all caught up!</h3>
                        <p className="text-slate-400 text-sm font-light max-w-sm">
                            {searchTerm
                                ? "No pending memos match your search."
                                : "There are no memos awaiting your approval at this time."}
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr className="border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-light text-slate-400 uppercase tracking-widest bg-slate-50/50">Request Details</th>
                                    <th className="px-6 py-4 text-xs font-light text-slate-400 uppercase tracking-widest bg-slate-50/50">Amount</th>
                                    <th className="px-6 py-4 text-xs font-light text-slate-400 uppercase tracking-widest bg-slate-50/50 text-right">Action Required</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMemos.map((memo) => (
                                    <tr
                                        key={memo.id}
                                        onClick={() => setSelectedMemo(memo)}
                                        className="border-b border-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                                    <FileText className="w-5 h-5 text-indigo-500 drop-shadow-sm" />
                                                </div>
                                                <div>
                                                    <h3 className="font-light text-brand-navy text-base group-hover:text-indigo-600 transition-colors">
                                                        {memo.title}
                                                    </h3>
                                                    <p className="text-[10px] text-slate-400 mt-0.5 font-light">
                                                        From: {memo.from_department} • Ref: {memo.reference_number}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 font-light text-sm">
                                                ${parseFloat(memo.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-light bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                Awaiting Review
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Action Side Panel */}
            <AnimatePresence>
                {selectedMemo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex justify-end"
                        onClick={() => !isActionLoading && setSelectedMemo(null)}
                    >
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col rounded-l-3xl overflow-hidden"
                        >
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                                <h2 className="text-xl font-light text-brand-navy tracking-tight flex items-center gap-2">
                                    Pending Review
                                </h2>
                                <button
                                    onClick={() => !isActionLoading && setSelectedMemo(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-6 pb-32"> {/* Extra padding bottom for fixed action bar */}

                                {actionError && (
                                    <div className="p-4 mb-6 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 text-sm">
                                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                        {actionError}
                                    </div>
                                )}

                                <div className="mb-8">
                                    <span className="text-xs text-indigo-500 font-light bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 mb-3 inline-block">
                                        Action Required: {selectedMemo.next_action?.name}
                                    </span>
                                    <h3 className="text-2xl font-light text-brand-navy leading-tight mt-1 mb-1">
                                        {selectedMemo.title}
                                    </h3>
                                    <p className="text-slate-400 font-light text-sm">Ref: {selectedMemo.reference_number} • From: {selectedMemo.from_department}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-50 p-4 rounded-[1.25rem]">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Requested Amount</p>
                                        <p className="text-slate-800 font-light text-lg tracking-tight">${parseFloat(selectedMemo.amount).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-[1.25rem]">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Recipient Dept</p>
                                        <p className="text-slate-800 font-light text-lg tracking-tight">{selectedMemo.to_department}</p>
                                    </div>
                                </div>

                                <div className="space-y-6 bg-slate-50/50 p-6 rounded-[1.25rem] border border-slate-100">
                                    <div>
                                        <h4 className="text-xs uppercase tracking-widest text-slate-400 mb-2">Subject</h4>
                                        <p className="text-slate-700 font-light">{selectedMemo.subject}</p>
                                    </div>
                                    <div className="h-px bg-slate-200" />
                                    <div>
                                        <h4 className="text-xs uppercase tracking-widest text-slate-400 mb-2">Background</h4>
                                        <p className="text-slate-700 font-light whitespace-pre-wrap leading-relaxed">{selectedMemo.background}</p>
                                    </div>
                                    <div className="h-px bg-slate-200" />
                                    <div>
                                        <h4 className="text-xs uppercase tracking-widest text-slate-400 mb-2">Purpose</h4>
                                        <p className="text-slate-700 font-light whitespace-pre-wrap leading-relaxed">{selectedMemo.purpose}</p>
                                    </div>
                                </div>

                                {/* Remarks Textarea for Action */}
                                <div className="mt-8">
                                    <label className="text-sm font-light text-slate-600 mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-slate-400" />
                                        Your Remarks (Optional)
                                    </label>
                                    <textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        rows={3}
                                        disabled={isActionLoading}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-light resize-y"
                                        placeholder="Add notes for the timeline or reasons for rejection..."
                                    />
                                </div>
                            </div>

                            {/* Fixed Action Bottom Bar */}
                            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 flex gap-4">
                                <button
                                    onClick={() => handleAction('reject')}
                                    disabled={isActionLoading}
                                    className="flex-1 py-3.5 rounded-xl font-light text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-50"
                                >
                                    {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Reject Memo'}
                                </button>
                                <button
                                    onClick={() => handleAction('approve')}
                                    disabled={isActionLoading}
                                    className="flex-1 py-3.5 rounded-xl font-light text-white bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Approve Memo'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
