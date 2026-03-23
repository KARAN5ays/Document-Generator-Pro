import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Search, Filter, Loader2, ArrowRight, X, Clock, CheckCircle2, XCircle } from 'lucide-react'
import API from '../api/client'

export default function MyMemos({ token, onNavigate }) {
    const [memos, setMemos] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('ALL') // ALL, Pending, Approved, Rejected
    const [selectedMemo, setSelectedMemo] = useState(null)
    const [approvalLogs, setApprovalLogs] = useState([])
    const [isLogsLoading, setIsLogsLoading] = useState(false)

    useEffect(() => {
        fetchMemos()
    }, [token])

    const fetchMemos = async () => {
        setIsLoading(true)
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } }
            const res = await API.get('memos/', config)
            // Filter only memos created by me... wait, backend /memos/ already gives user's memos.
            // If they are an approver, it gives all merchant memos. Let's just show them all in My Memos for now, 
            // or we could filter by created_by if needed.
            setMemos(res.data)
        } catch (err) {
            console.error("Failed to fetch memos", err)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchMemoLogs = async (memoId) => {
        setIsLogsLoading(true)
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } }
            const res = await API.get(`memos/${memoId}/approval_logs/`, config)
            setApprovalLogs(res.data)
        } catch (err) {
            console.error("Failed to fetch memo logs", err)
        } finally {
            setIsLogsLoading(false)
        }
    }

    const handleViewMemo = (memo) => {
        setSelectedMemo(memo)
        fetchMemoLogs(memo.id)
    }

    const filteredMemos = memos.filter(memo => {
        const matchesSearch = memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            memo.reference_number.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'ALL' || memo.approval_status === filterStatus
        return matchesSearch && matchesStatus
    })

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
            case 'Rejected': return 'bg-red-50 text-red-600 border-red-100'
            case 'Pending':
            default: return 'bg-amber-50 text-amber-600 border-amber-100'
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col h-[calc(100vh-8rem)]" // Maximize height for inner scrolling
        >
            {/* Header */}
            <div className="mb-8 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-light text-brand-navy tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-brand-pink shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        My Memos
                    </h1>
                    <p className="text-slate-500 mt-2 ml-14">View and track the status of your memos.</p>
                </div>
                <button
                    onClick={() => onNavigate('memo-create')}
                    className="px-5 py-2.5 rounded-xl bg-brand-pink text-white font-light text-sm shadow-card transition-smooth"
                >
                    Create a Memo
                </button>
            </div>

            {/* Controls Bar */}
            <div className="bg-white/95 backdrop-blur-md rounded-[1.25rem] border border-slate-100/80 shadow-card p-2 flex flex-col md:flex-row gap-2 transition-smooth shrink-0 mb-6 z-10">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search memos by title or reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-transparent bg-transparent text-slate-800 placeholder:text-slate-400 focus:bg-slate-50/50 focus:border-slate-200 transition-all outline-none font-light"
                    />
                </div>
                <div className="h-px md:h-12 w-full md:w-px bg-slate-100 mx-2" />
                <div className="flex items-center gap-2 px-2">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-transparent border-none text-slate-600 font-light outline-none cursor-pointer pr-4"
                    >
                        <option value="ALL">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex gap-6">

                {/* List of Memos */}
                <div className="flex-1 bg-white/95 backdrop-blur-md rounded-[1.25rem] border border-slate-100/80 shadow-card overflow-hidden transition-smooth flex flex-col h-full">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 text-brand-pink animate-spin mb-3" />
                            <p className="text-slate-400 text-sm font-light">Loading memos...</p>
                        </div>
                    ) : filteredMemos.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg text-slate-700 font-light mb-1">No memos found</h3>
                            <p className="text-slate-400 text-sm font-light max-w-sm">
                                {searchTerm || filterStatus !== 'ALL'
                                    ? "No memos match your current search and filters."
                                    : "You haven't created any memos yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto w-full">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr className="border-b border-slate-100">
                                        <th className="px-6 py-4 text-xs font-light text-slate-400 uppercase tracking-widest bg-slate-50/50">Details</th>
                                        <th className="px-6 py-4 text-xs font-light text-slate-400 uppercase tracking-widest bg-slate-50/50">Amount</th>
                                        <th className="px-6 py-4 text-xs font-light text-slate-400 uppercase tracking-widest bg-slate-50/50 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMemos.map((memo) => (
                                        <tr
                                            key={memo.id}
                                            onClick={() => handleViewMemo(memo)}
                                            className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                                                        <FileText className="w-5 h-5 text-brand-pink drop-shadow-sm" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-light text-brand-navy text-base group-hover:text-brand-pink transition-colors">
                                                            {memo.title}
                                                        </h3>
                                                        <p className="text-[10px] text-slate-400 mt-0.5 font-light">
                                                            Ref: {memo.reference_number} • {new Date(memo.created_at).toLocaleDateString()}
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
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-light border ${getStatusStyle(memo.approval_status)}`}>
                                                    {memo.approval_status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                    {memo.approval_status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                                                    {memo.approval_status === 'Pending' && <Clock className="w-3.5 h-3.5" />}
                                                    {memo.approval_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Details Side Panel Modal (In a real app this might be a full modal or side panel) */}
                <AnimatePresence>
                    {selectedMemo && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex justify-end"
                            onClick={() => setSelectedMemo(null)}
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
                                    <h2 className="text-xl font-light text-brand-navy tracking-tight">Memo Details</h2>
                                    <button
                                        onClick={() => setSelectedMemo(null)}
                                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-light border ${getStatusStyle(selectedMemo.approval_status)}`}>
                                                {selectedMemo.approval_status}
                                            </span>
                                            <span className="text-xs text-slate-400 font-light bg-slate-100 px-3 py-1 rounded-full">
                                                {selectedMemo.memo_type}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-light text-brand-navy leading-tight mt-3 mb-1">
                                            {selectedMemo.title}
                                        </h3>
                                        <p className="text-slate-400 font-light text-sm">Ref: {selectedMemo.reference_number}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-slate-50 p-4 rounded-[1.25rem]">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">From</p>
                                            <p className="text-slate-800 font-light text-sm">{selectedMemo.from_department}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-[1.25rem]">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">To</p>
                                            <p className="text-slate-800 font-light text-sm">{selectedMemo.to_department}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-[1.25rem]">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Amount</p>
                                            <p className="text-slate-800 font-light text-sm">${parseFloat(selectedMemo.amount).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-[1.25rem]">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Next Action</p>
                                            <p className="text-brand-pink font-light text-sm truncate">
                                                {selectedMemo.next_action ? selectedMemo.next_action.name : 'None'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs uppercase tracking-widest text-slate-400 mb-2">Subject</h4>
                                            <p className="text-slate-700 font-light">{selectedMemo.subject}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs uppercase tracking-widest text-slate-400 mb-2">Background</h4>
                                            <p className="text-slate-700 font-light whitespace-pre-wrap leading-relaxed">{selectedMemo.background}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-xs uppercase tracking-widest text-slate-400 mb-2">Purpose</h4>
                                            <p className="text-slate-700 font-light whitespace-pre-wrap leading-relaxed">{selectedMemo.purpose}</p>
                                        </div>
                                    </div>

                                    <div className="mt-12">
                                        <h4 className="text-sm border-b border-slate-100 pb-2 mb-4 font-light text-brand-navy">Approval Timeline</h4>
                                        {isLogsLoading ? (
                                            <div className="flex justify-center py-6">
                                                <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                                            </div>
                                        ) : approvalLogs.length === 0 ? (
                                            <p className="text-slate-400 font-light text-sm">No actions recorded yet.</p>
                                        ) : (
                                            <div className="space-y-4">
                                                {approvalLogs.map((log, index) => (
                                                    <div key={log.id} className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-3 h-3 rounded-full bg-brand-pink ring-4 ring-pink-50" />
                                                            {index !== approvalLogs.length - 1 && (
                                                                <div className="w-px h-full bg-slate-100 mt-2" />
                                                            )}
                                                        </div>
                                                        <div className="pb-4">
                                                            <p className="text-sm text-slate-700 font-light">
                                                                <span className="text-brand-navy">{log.actor_name}</span> performed <span className="text-brand-pink">{log.action}</span>
                                                            </p>
                                                            <p className="text-xs text-slate-400 font-light mt-1">
                                                                {new Date(log.created_at).toLocaleString()}
                                                            </p>
                                                            {log.remarks && (
                                                                <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm text-slate-600 font-light">
                                                                    "{log.remarks}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}
