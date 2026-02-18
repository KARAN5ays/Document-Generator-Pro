import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Calendar,
  Search,
  FileX,
  Filter,
  Eye,
  X,
  Trash2,
  AlertTriangle,
  Share2,
  Link as LinkIcon,
  MessageCircle,
  Mail,
  Linkedin,
  Twitter,
  Hash,
  ChevronDown
} from 'lucide-react'
import API from '../api/client'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLabel(key) {
  return String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getMetadataRows(metadata) {
  if (!metadata || typeof metadata !== 'object') return []
  const rows = []
  const customFields = metadata.custom_fields
  Object.entries(metadata).forEach(([key, value]) => {
    if (key === 'custom_fields') return
    if (value == null) return
    if (typeof value === 'object' && !Array.isArray(value)) return
    rows.push({ label: formatLabel(key), value: String(value) })
  })
  if (Array.isArray(customFields)) {
    customFields.forEach((cf) => {
      if (cf && (cf.label || cf.value)) {
        rows.push({ label: cf.label || 'Custom', value: String(cf.value ?? '') })
      }
    })
  } else if (customFields && typeof customFields === 'object') {
    Object.entries(customFields).forEach(([k, v]) => {
      rows.push({ label: formatLabel(k), value: String(v ?? '') })
    })
  }
  return rows
}

// --- SHARE MODAL COMPONENT ---
function ShareModal({ doc, onClose }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/verify/${doc?.tracking_field}`
  const text = `Check out this document: ${doc?.document_type_name}`

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      href: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-slate-500 hover:bg-slate-600',
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-600 hover:bg-blue-700',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        <div className="p-6 pb-0 flex items-center justify-between">
          <h3 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <Share2 className="w-5 h-5 text-brand-pink" />
            Share Document
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* URL Copy Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Document Link</label>
            <div className="flex items-center gap-2 p-2 rounded-xl border border-pink-100 bg-pink-50/30">
              <div className="p-2 bg-white rounded-lg text-brand-pink">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                readOnly
                value={url}
                className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-brand-navy text-white hover:bg-slate-700'
                  }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social Share Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Share via</label>
            <div className="grid grid-cols-4 gap-3">
              {shareLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 ${link.color}`}>
                    <link.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 group-hover:text-brand-navy">{link.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 text-center text-xs text-slate-400">
          Anyone with this link can verify the document.
        </div>
      </motion.div>
    </motion.div>
  )
}

function DetailsModal({ doc, onClose, onShare }) {
  const metadataRows = getMetadataRows(doc?.metadata)

  return (
    <motion.div
      key="details-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-pink-100 overflow-hidden"
      >
        <div className="h-1 w-full bg-gradient-to-r from-brand-pink to-pink-400" />
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-pink-100 flex items-center justify-center shrink-0">
                <FileText className="w-7 h-7 text-brand-pink" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-brand-navy">
                  {doc?.document_type_name || 'Document'}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 font-mono">
                  <Hash className="w-4 h-4 text-brand-pink" />
                  {doc?.tracking_field}
                </div>
                <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${doc?.status === 'valid' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                  {doc?.status || '—'}
                </span>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => onShare?.(doc)}
                className="p-2 rounded-xl hover:bg-pink-50 text-slate-500 hover:text-brand-pink transition-colors mr-2"
                title="Share Document"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-brand-navy transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4 pb-4 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-brand-pink" />
            Created: {formatDate(doc?.created_at)}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Document Details</h3>
            {metadataRows.length > 0 ? (
              <div className="space-y-2.5 rounded-xl bg-pink-50/50 border border-pink-100 p-4">
                {metadataRows.map((row, i) => (
                  <div key={i} className="flex justify-between items-start gap-4 text-sm">
                    <span className="text-slate-500 shrink-0">{row.label}:</span>
                    <span className="text-brand-navy font-medium text-right break-words">
                      {row.value || '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic py-4">No additional details</p>
            )}

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => doc.onDelete?.(doc)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Document
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

function DocumentsTable({ documents, onViewDetails, onShare, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/80 border-b border-pink-100/50 text-xs text-slate-500 uppercase tracking-wider backdrop-blur-sm sticky top-0 z-10">
              <th className="px-6 py-4 font-bold">Document</th>
              <th className="px-6 py-4 font-bold">Tracking ID</th>
              <th className="px-6 py-4 font-bold">Created</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pink-50">
            {documents.map((doc) => (
              <motion.tr
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-pink-50/40 transition-colors group border-b border-slate-50 last:border-0"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-brand-pink font-bold shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-brand-navy">{doc.document_type_name || 'Document'}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">
                    <Hash className="w-3 h-3 text-slate-400" />
                    {doc.tracking_field}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {formatDate(doc.created_at)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${doc.status === 'valid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${doc.status === 'valid' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {doc.status || '—'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onViewDetails(doc)} className="p-2 text-slate-400 hover:text-brand-pink hover:bg-pink-50 rounded-lg transition-colors" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onShare(doc)} className="p-2 text-slate-400 hover:text-brand-navy hover:bg-slate-100 rounded-lg transition-colors" title="Share">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(doc)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SkeletonTable() {
  return (
    <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-12 bg-slate-50 border-b border-pink-100" />
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center px-6 py-4 border-b border-pink-50 gap-4">
          <div className="w-10 h-10 bg-slate-100 rounded-xl" />
          <div className="flex-1 h-5 bg-slate-100 rounded w-1/4" />
          <div className="flex-1 h-5 bg-slate-100 rounded w-1/4" />
          <div className="flex-1 h-5 bg-slate-100 rounded w-1/4" />
        </div>
      ))}
    </div>
  )
}

export default function YourDocuments({ onNavigate }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [shareDoc, setShareDoc] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const res = await API.get('documents/')
        setDocuments(res.data || [])
      } catch (err) {
        console.error('Failed to fetch documents', err)
        setDocuments([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const handleDelete = async (doc) => {
    setDeleteConfirm(doc)
  }

  const handleShare = (doc) => {
    setShareDoc(doc)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      setIsDeleting(true)
      await API.delete(`documents/${deleteConfirm.tracking_field}/`)

      // Remove from state
      setDocuments(prev => prev.filter(d => d.tracking_field !== deleteConfirm.tracking_field))
      setDeleteConfirm(null)
      setSelectedDoc(null) // Close details if open

    } catch (err) {
      console.error('Failed to delete document', err)
      alert('Failed to delete document. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredDocs = documents
    .filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.tracking_field?.toUpperCase().includes(searchQuery.toUpperCase()) ||
        d.document_type_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.metadata && JSON.stringify(d.metadata).toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'valid' && d.status === 'valid') ||
        (statusFilter === 'revoked' && d.status !== 'valid')
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime()
      const db = new Date(b.created_at || 0).getTime()
      return sortBy === 'recent' ? db - da : da - db
    })

  const validCount = documents.filter((d) => d.status === 'valid').length
  const revokedCount = documents.length - validCount

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[1600px] mx-auto pb-20"
    >
      <AnimatePresence>
        {selectedDoc && (
          <DetailsModal
            doc={{ ...selectedDoc, onDelete: handleDelete }}
            onClose={() => setSelectedDoc(null)}
            onShare={handleShare}
          />
        )}
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Document?</h3>
                <p className="text-sm text-slate-500 mb-6">
                  Are you sure you want to delete <span className="font-mono font-medium text-slate-700">{deleteConfirm.tracking_field}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {shareDoc && (
          <ShareModal doc={shareDoc} onClose={() => setShareDoc(null)} />
        )}
      </AnimatePresence>

      {/* Modern Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">Your Documents</h1>
          <p className="text-slate-500 font-medium mt-1">Manage, verify, and share your generated documents.</p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate?.('generate')}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-pink hover:bg-pink-600 text-white font-bold shadow-lg shadow-brand-pink/25 hover:-translate-y-0.5 transition-all"
        >
          <FileText className="w-5 h-5" />
          Create New Document
        </button>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">

        {/* Controls Bar */}
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm p-2 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by code, name, or metadata..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-brand-pink focus:ring-2 focus:ring-brand-pink/20 outline-none transition-all font-medium text-slate-700"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <button onClick={() => setStatusFilter(statusFilter === 'all' ? 'valid' : statusFilter === 'valid' ? 'revoked' : 'all')} className="flex items-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl font-semibold text-slate-600 transition-colors whitespace-nowrap">
              <Filter className="w-4 h-4" />
              Status: <span className="text-brand-navy capitalize">{statusFilter}</span>
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="min-h-[400px]">
          {loading ? (
            <SkeletonTable />
          ) : filteredDocs.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <FileX className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">No documents found</h3>
              <p className="text-slate-400 mt-2">Try adjusting your filters or create a new document.</p>
            </motion.div>
          ) : (
            <DocumentsTable
              documents={filteredDocs}
              onViewDetails={setSelectedDoc}
              onShare={handleShare}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </motion.div>
  )
}
