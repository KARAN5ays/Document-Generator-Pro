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
  Download,
  Loader2,
  Database,
  RefreshCw
} from 'lucide-react'
import API from '../api/client'
import PdfPreviewer from '../components/PdfPreviewer'

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
            <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50">
              <div className="p-2 bg-white rounded-lg text-brand-navy shadow-sm border border-slate-100">
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
  const [pdfUrl, setPdfUrl] = useState(null)
  const [isLoadingPdf, setIsLoadingPdf] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const loadPdf = async (force = false) => {
    if (force) setIsRegenerating(true)
    else setIsLoadingPdf(true)

    try {
      const url = `documents/${doc.tracking_field}/download/${force ? '?force=true' : ''}`
      const response = await API.get(url, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const objectUrl = URL.createObjectURL(blob)
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      setPdfUrl(objectUrl)
    } catch (err) {
      console.error('Failed to load PDF preview in modal', err)
    } finally {
      setIsLoadingPdf(false)
      setIsRegenerating(false)
    }
  }

  useEffect(() => {
    if (doc?.tracking_field) loadPdf()
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [doc?.tracking_field])

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `${doc.document_type_name}_${doc.tracking_field}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
    }
  }

  return (
    <motion.div
      key="details-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="shrink-0 p-6 pb-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-6 h-6 text-brand-pink" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-navy leading-tight">
                {doc?.document_type_name || 'Document View'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {doc?.tracking_field}
                </span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(doc?.created_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onShare?.(doc)}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-pink-50 text-slate-500 hover:text-brand-pink hover:border-pink-200 transition-all shadow-sm"
              title="Share Document"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              disabled={!pdfUrl || isLoadingPdf || isRegenerating}
              className="p-2.5 rounded-xl bg-brand-navy hover:bg-slate-800 text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-4 font-bold text-sm"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <div className="w-px h-8 bg-slate-200 mx-1" />
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-brand-navy transition-all shadow-sm"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: PDF Preview */}
        <div className="flex-1 overflow-auto bg-slate-100/50 relative p-6">
          {isLoadingPdf ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand-pink" />
              <p className="font-medium">Loading Document View...</p>
            </div>
          ) : pdfUrl ? (
            <div className="h-full min-h-[500px] w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row">
              <div className="flex-1 border-r border-slate-100 flex flex-col h-full relative">
                {isRegenerating && (
                  <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-pink" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Regenerating...</p>
                  </div>
                )}
                <iframe
                  src={`${pdfUrl}#toolbar=0`}
                  className="w-full h-full border-none"
                  title="Document PDF Preview"
                />
              </div>

              <div className="w-full md:w-72 bg-slate-50 overflow-y-auto p-5 shrink-0 h-full max-h-[500px] md:max-h-full">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Database className="w-3 h-3 text-brand-pink" />
                    Document Data
                  </h4>
                  <button
                    onClick={() => loadPdf(true)}
                    disabled={isRegenerating}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 text-[9px] font-black text-slate-500 hover:text-brand-pink hover:border-pink-200 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                <div className="space-y-4">
                  {getMetadataRows(doc?.metadata).length === 0 ? (
                    <div className="py-8 text-center bg-white rounded-xl border border-slate-200 border-dashed">
                      <p className="text-xs text-slate-400">No data fields found</p>
                    </div>
                  ) : (
                    getMetadataRows(doc?.metadata).map((row, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          {row.label}
                        </label>
                        <p className="text-sm font-semibold text-brand-navy break-words leading-relaxed">
                          {row.value}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
              <AlertTriangle className="w-8 h-8 mb-4 text-slate-300" />
              <p className="font-medium">Failed to load document preview</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-4 border-t border-slate-100 bg-white flex justify-between items-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${doc?.status === 'valid' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${doc?.status === 'valid' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {doc?.status || 'Unknown Status'}
          </span>

          <button
            onClick={() => {
              onClose();
              doc.onDelete?.(doc);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Document
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function DocumentsTable({ documents, onViewDetails, onShare, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider backdrop-blur-sm sticky top-0 z-10">
              <th className="px-6 py-4">Document</th>
              <th className="px-6 py-4">Tracking ID</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <motion.tr
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-slate-50/50 transition-colors group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center text-brand-pink font-bold shrink-0">
                      <FileText className="w-4 h-4" />
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
