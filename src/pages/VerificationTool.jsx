import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Calendar,
  Fingerprint,
  Search,
  Copy,
  RefreshCw,
  Shield,
  CheckCircle,
  Clock,
  Award,
  Database,
  Lock,
  Server,
  HelpCircle,
  ArrowRight,
  Zap,
  Sparkles

} from 'lucide-react'
import API from '../api/client'

function sanitizeCode(str) {
  if (!str || typeof str !== 'string') return ''
  return str.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8)
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function VerificationTool({ initialCode = '' }) {
  const [inputCode, setInputCode] = useState(() => sanitizeCode(initialCode))
  const [verificationResult, setVerificationResult] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [stats, setStats] = useState({ total_verified: 0, recently_verified: [] })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get('verification-stats/')
        setStats({
          total_verified: res.data?.total_verified ?? 0,
          recently_verified: res.data?.recently_verified ?? [],
        })
      } catch {
        setStats({ total_verified: 0, recently_verified: [] })
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const verifyCode = useCallback(async (code) => {
    const cleanCode = sanitizeCode(code)
    if (cleanCode.length < 8) {
      setVerificationResult(null)
      setErrorMessage(cleanCode.length > 0 ? 'Code must be 8 characters' : null)
      return
    }

    setErrorMessage(null)
    setIsVerifying(true)
    setVerificationResult(null)

    try {
      // Simulate scanning for effect
      await new Promise(r => setTimeout(r, 1200))

      const response = await API.get(`verify/${cleanCode}/`)
      const doc = response.data?.document
      if (doc) {
        setVerificationResult({ valid: true, document: doc })
        setInputCode(cleanCode)
      } else {
        setVerificationResult({ valid: false })
      }
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.message || err.response?.data?.detail
      if (status === 404 || detail?.toLowerCase?.().includes('not found')) {
        setVerificationResult({ valid: false })
      } else {
        setErrorMessage(detail || 'Verification failed. Please try again.')
        setVerificationResult(null)
      }
    } finally {
      setIsVerifying(false)
    }
  }, [])

  const handleInputChange = (e) => {
    const cleaned = sanitizeCode(e.target.value)
    setInputCode(cleaned)
    setErrorMessage(null)
    if (cleaned.length < 8) {
      setVerificationResult(null)
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = (e.clipboardData?.getData('text') || '').trim()
    const cleaned = sanitizeCode(pasted)
    setInputCode(cleaned)
    setErrorMessage(null)
    setVerificationResult(null)
  }

  const handleReset = () => {
    setInputCode('')
    setVerificationResult(null)
    setErrorMessage(null)
  }

  useEffect(() => {
    const code = inputCode.trim().toUpperCase()
    if (code.length < 8) return

    const timer = setTimeout(() => {
      verifyCode(code)
    }, 600)
    return () => clearTimeout(timer)
  }, [inputCode, verifyCode])

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans selection:bg-brand-pink/30">
      {/* Dynamic Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-pink/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[60%] h-[20%] bg-rose-400/10 rounded-full blur-[100px]" />

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-50" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-pink/30 bg-brand-pink/10 text-brand-pink font-black tracking-widest uppercase mb-8 shadow-[0_0_30px_-5px_rgba(236,72,153,0.2)] text-xs">
            <Zap className="w-4 h-4" />
            Zero-Trust Validation Protocol
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-brand-navy tracking-tight leading-[1.1] mb-6">
            Verify the <br className="hidden sm:block" />
            <span className="text-brand-pink">
              Unforgeable Truth.
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Enter the unique tracking code to instantly authenticate any document against our secure cryptographic ledger.
          </p>
        </motion.div>

        {/* Search Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto relative z-20"
        >
          <div className="relative group">
            <div className={`absolute -inset-1 rounded-2xl blur-lg opacity-40 transition-all duration-500 ${isVerifying ? 'bg-brand-pink/20 animate-pulse' : inputCode.length === 8 ? 'bg-brand-pink/10' : 'bg-transparent'}`} />

            <div className="relative bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full flex items-center">
                <Search className={`absolute left-6 w-8 h-8 transition-colors duration-500 ${isVerifying ? 'text-brand-pink animate-pulse' : 'text-slate-400 group-focus-within:text-brand-pink'}`} />
                <input
                  type="text"
                  value={inputCode}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  placeholder="ENTER 8-DIGIT CODE"
                  maxLength={8}
                  className="w-full bg-transparent pl-20 pr-6 py-6 text-3xl sm:text-4xl font-mono font-black tracking-[0.3em] text-brand-navy placeholder:text-slate-300 outline-none uppercase"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>

              <div className="w-full sm:w-auto flex justify-center sm:justify-end pr-4">
                <AnimatePresence mode="wait">
                  {isVerifying ? (
                    <motion.div
                      key="scanning"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-3 px-6 py-4 rounded-xl bg-pink-50 border border-pink-100 text-brand-pink font-bold"
                    >
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="tracking-widest uppercase">Scanning Ledger</span>
                    </motion.div>
                  ) : inputCode.length === 8 ? (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center w-16 h-16 rounded-xl bg-brand-pink shadow-sm"
                    >
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="counter"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-6 py-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xl font-bold text-slate-400"
                    >
                      {inputCode.length}/8
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="mt-6 flex items-center justify-center gap-3 text-red-600 bg-red-50 border border-red-100 py-4 px-6 rounded-2xl mx-10 shadow-sm"
              >
                <AlertCircle className="w-6 h-6" />
                <span className="font-bold tracking-wide">{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Verification Results Panel */}
        <AnimatePresence mode="wait">
          {verificationResult && !isVerifying && (
            <motion.div
              key={verificationResult.valid ? 'valid' : 'invalid'}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="mt-16 relative z-10"
            >
              {verificationResult.valid ? (
                <div className="relative group rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                  {/* Glowing certificate background */}
                  <div className="absolute top-0 right-0 w-full h-[500px] bg-brand-soft/30 pointer-events-none" />

                  <div className="p-8 sm:p-16 relative z-10">
                    <div className="flex flex-col items-center mb-12 text-center">
                      <div className="relative w-28 h-28 mb-8">
                        <div className="absolute inset-0 bg-brand-pink rounded-full blur-xl opacity-10 animate-pulse" />
                        <div className="relative w-full h-full rounded-2xl bg-brand-pink p-[2px]">
                          <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                            <ShieldCheck className="w-12 h-12 text-brand-pink" />
                          </div>
                        </div>
                      </div>
                      <h2 className="text-4xl font-black text-brand-navy mb-2 tracking-tight">Authentic Record Verified</h2>
                      <p className="text-brand-pink font-mono tracking-widest text-lg bg-pink-50 px-4 py-1.5 rounded-lg border border-pink-100">
                        ID: {inputCode}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                      <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 shadow-sm">
                        <div className="space-y-8">
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-brand-pink" />
                              Document Type
                            </p>
                            <p className="text-2xl font-bold text-brand-navy tracking-wide">{verificationResult.document?.template_type}</p>
                          </div>
                          <div className="w-full h-[1px] bg-slate-200" />
                          <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-brand-pink" />
                              Issuance Timestamp
                            </p>
                            <p className="text-xl font-bold text-brand-navy tracking-wide">{formatDate(verificationResult.document?.created_at)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute -right-8 -bottom-8 opacity-[0.03] text-brand-navy">
                          <Fingerprint className="w-48 h-48" />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-rose-400" />
                          Cryptographic Metadata
                        </p>
                        <div className="grid gap-4 relative z-10">
                          {Object.entries(verificationResult.document.metadata || {})
                            .filter(([k, value]) => value != null && typeof value !== 'object' && k !== 'custom_fields')
                            .slice(0, 4)
                            .map(([key, value]) => (
                              <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-colors">
                                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 sm:mb-0">
                                  {String(key).replace(/_/g, ' ')}
                                </span>
                                <span className="font-mono text-brand-navy font-bold text-sm sm:text-right">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 flex justify-center">
                      <button
                        onClick={handleReset}
                        className="group relative px-8 py-4 bg-brand-navy text-white rounded-full font-black tracking-widest uppercase text-sm flex items-center gap-3 overflow-hidden shadow-[0_0_40px_-5px_rgba(15,23,42,0.3)] hover:shadow-[0_0_50px_-5px_rgba(15,23,42,0.4)] transition-all hover:scale-105 active:scale-95"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                        Verify Another
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center bg-white rounded-2xl border border-red-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-red-50 rounded-full blur-[80px] pointer-events-none" />

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-28 h-28 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-red-100"
                  >
                    <AlertCircle className="w-12 h-12 text-red-500" />
                  </motion.div>
                  <h3 className="text-4xl font-black text-brand-navy mb-4 tracking-tight">Record Not Found</h3>
                  <p className="text-slate-500 font-medium text-lg max-w-md mx-auto mb-10 leading-relaxed">
                    No authentic record matches the tracking code <span className="font-mono text-red-500 font-bold bg-red-50 px-3 py-1 rounded-lg border border-red-100">{inputCode}</span> in our ledger.
                  </p>
                  <button
                    onClick={handleReset}
                    className="px-8 py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-black text-sm tracking-widest rounded-xl transition-all flex items-center gap-3 mx-auto uppercase hover:scale-105"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Scanner
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Stats & Security Features */}
        {!verificationResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-32 space-y-32"
          >
            {/* Live Ledger Ticker */}
            <div>
              <div className="flex items-center justify-center gap-6 mb-12">
                <div className="h-[1px] w-full max-w-[100px] bg-gradient-to-r from-transparent to-slate-200" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] text-center">Live Global Ledger</p>
                <div className="h-[1px] w-full max-w-[100px] bg-gradient-to-l from-transparent to-slate-200" />
              </div>

              {statsLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-pink/50" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.recently_verified.slice(0, 3).map((item, idx) => (
                    <div key={item.tracking_field + idx} className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all shadow-sm group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center border border-brand-pink/20">
                          <CheckCircle className="w-5 h-5 text-brand-pink group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          {timeAgo(item.created_at)}
                        </span>
                      </div>
                      <p className="font-mono text-lg font-black text-brand-navy truncate tracking-widest">{item.tracking_field}</p>
                      <p className="text-xs text-brand-pink mt-1 font-semibold uppercase tracking-widest opacity-80">Authenticated Record</p>
                    </div>
                  ))}
                  {stats.recently_verified.length === 0 && (
                    <div className="col-span-3 text-center py-10 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-400 font-mono tracking-widest text-sm uppercase">Awaiting ledger activity...</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-16 text-center">
                <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="w-3 h-3 rounded-full bg-brand-pink" />
                  <p className="text-sm font-black tracking-widest uppercase text-slate-500">
                    <span className="text-brand-navy text-lg mr-2">{stats.total_verified.toLocaleString()}</span>
                    Records Secured
                  </p>
                </div>
              </div>
            </div>

            {/* Architecture Explainer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                { icon: Server, title: "Zero-Downtime Validation", desc: "Our distributed architecture ensures instant verification across the globe with <50ms latency." },
                { icon: Lock, title: "Cryptographic Hashing", desc: "Every document is hashed using AES-256 protocols, making forged replicas mathematically impossible." },
                { icon: Database, title: "Immutable Ledger", desc: "Issued documents are permanently recorded in an append-only structure that cannot be altered or deleted." }
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col items-center text-center group hover:-translate-y-1 transition-all">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-all">
                    <feature.icon className="w-8 h-8 text-brand-pink" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-navy mb-4">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
