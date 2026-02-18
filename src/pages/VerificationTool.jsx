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
  ArrowRight
} from 'lucide-react'
import API from '../api/client'

// Sanitize code: only A-Z, 0-9, take first 8 chars, uppercase (handles paste from PDF etc.)
function sanitizeCode(str) {
  if (!str || typeof str !== 'string') return ''
  const cleaned = str.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8)
  return cleaned
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
      // Simulate slight delay for "scanning" effect
      await new Promise(r => setTimeout(r, 800))

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
    const raw = e.target.value
    const cleaned = sanitizeCode(raw)
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
    // Auto-verify triggered by useEffect when cleaned.length >= 8
  }

  const handleVerifyClick = () => {
    verifyCode(inputCode)
  }

  const handleReset = () => {
    setInputCode('')
    setVerificationResult(null)
    setErrorMessage(null)
  }

  // Auto-verify when user types or pastes 8 valid characters (debounced)
  useEffect(() => {
    const code = inputCode.trim().toUpperCase()
    if (code.length < 8) return

    const timer = setTimeout(() => {
      verifyCode(code)
    }, 400)
    return () => clearTimeout(timer)
  }, [inputCode]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-16 relative"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="inline-flex items-center justify-center p-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xl shadow-emerald-500/40 mb-8 border-4 border-white"
        >
          <ShieldCheck className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-4xl sm:text-5xl font-black text-brand-navy tracking-tight mb-4">
          Trusted <span className="text-emerald-600">Verification</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-xl mx-auto leading-relaxed">
          Input your 8-character secure tracking code to instantly validate any document issued by our platform.
        </p>
      </motion.div>

      {/* Main Verification Area */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative z-10"
      >
        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden">
          {/* Input Section */}
          <div className="p-10 sm:p-14 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
            <div className="max-w-xl mx-auto space-y-8">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none z-10">
                  <Search className={`w-7 h-7 transition-all duration-300 ${isVerifying ? 'text-emerald-500 animate-pulse' : 'text-slate-300 group-focus-within:text-emerald-500 group-focus-within:scale-110'}`} />
                </div>
                <input
                  type="text"
                  value={inputCode}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  placeholder="CODE"
                  maxLength={8}
                  className="block w-full pl-20 pr-24 py-7 rounded-[1.5rem] border-2 border-slate-100 bg-white text-center font-mono text-3xl sm:text-4xl font-black tracking-[0.25em] text-brand-navy placeholder:text-slate-200 focus:border-emerald-500 focus:ring-[12px] focus:ring-emerald-500/5 outline-none transition-all uppercase shadow-inner-sm hover:border-slate-200"
                  spellCheck={false}
                  autoComplete="off"
                />

                {/* Validation Indicator */}
                <div className="absolute inset-y-0 right-0 pr-6 flex items-center gap-3">
                  <AnimatePresence mode="wait">
                    {isVerifying ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="px-4 py-2.5 bg-emerald-50 rounded-xl flex items-center gap-2 text-emerald-600 font-bold text-xs"
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        SCANNING
                      </motion.div>
                    ) : inputCode.length === 8 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </motion.div>
                    ) : (
                      <span className="text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400">
                        {inputCode.length}/8
                      </span>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50/50 border border-red-100 rounded-2xl p-5 flex items-center gap-4 text-red-600 text-sm font-semibold justify-center"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {errorMessage}
                </motion.div>
              )}

              {inputCode.length === 0 && !verificationResult && (
                <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-3">
                  <span className="w-8 h-[1px] bg-slate-100" />
                  <span className="flex items-center gap-2">
                    <Copy className="w-3.5 h-3.5" />
                    Paste Tracking ID
                  </span>
                  <span className="w-8 h-[1px] bg-slate-100" />
                </p>
              )}
            </div>
          </div>

          {/* Result Section (Premium Certificate Style) */}
          <AnimatePresence mode="wait">
            {verificationResult && !isVerifying && (
              <motion.div
                key={verificationResult.valid ? 'valid' : 'invalid'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white"
              >
                {verificationResult.valid ? (
                  <div className="p-8 sm:p-16 text-center relative overflow-hidden">
                    {/* Security Watermarks */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="relative z-10 max-w-2xl mx-auto">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.1 }}
                        className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/30 ring-[12px] ring-emerald-50"
                      >
                        <Award className="w-12 h-12 text-white" />
                      </motion.div>

                      <div className="mb-12">
                        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight uppercase">Successfully Verified</h2>
                        <div className="h-1.5 w-24 bg-emerald-500 mx-auto rounded-full mb-6" />
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">
                          This digital certificate is authentic and safely recorded in our secure ledger.
                        </p>
                      </div>

                      <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 text-left relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Shield className="w-24 h-24" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 relative z-10">
                          <div className="space-y-6">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                Record Type
                              </p>
                              <p className="font-bold text-slate-800 text-lg">{verificationResult.document?.template_type}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                                Issuance Date
                              </p>
                              <p className="font-bold text-slate-800 text-lg">{formatDate(verificationResult.document?.created_at)}</p>
                            </div>
                          </div>

                          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Fingerprint className="w-3.5 h-3.5 text-emerald-500" />
                              Authenticity Metadata
                            </p>
                            <div className="space-y-3">
                              {Object.entries(verificationResult.document.metadata || {})
                                .filter(([k, value]) => value != null && typeof value !== 'object' && k !== 'custom_fields')
                                .slice(0, 4)
                                .map(([key, value]) => (
                                  <div key={key} className="flex justify-between items-center bg-white/40 p-2.5 rounded-xl border border-white/80">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{String(key).replace(/_/g, ' ')}</span>
                                    <span className="font-bold text-slate-700 text-xs">{String(value)}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleReset}
                        className="mt-12 group flex items-center gap-3 mx-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm tracking-widest hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200"
                      >
                        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        NEW VERIFICATION
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-16 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 ring-[16px] ring-red-50/50"
                    >
                      <AlertCircle className="w-12 h-12 text-red-500" />
                    </motion.div>
                    <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Record Not Found</h3>
                    <p className="text-slate-500 font-medium text-lg max-w-sm mx-auto mb-10">
                      We couldn't locate any record with tracking code <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{inputCode}</span>.
                    </p>
                    <button
                      onClick={handleReset}
                      className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-900 font-black text-sm tracking-widest rounded-[1.25rem] hover:bg-slate-50 transition-all shadow-sm flex items-center gap-3 mx-auto uppercase"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Another Code
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Recent Verifications Ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-20"
      >
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-[1px] w-12 bg-slate-200" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Live Verification Ledger</p>
          <div className="h-[1px] w-12 bg-slate-200" />
        </div>

        {statsLoading ? (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {stats.recently_verified.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {stats.recently_verified.slice(0, 3).map((item, idx) => (
                  <motion.div
                    key={item.tracking_field}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + (idx * 0.1) }}
                    className="flex items-center gap-4 p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-default"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0 shadow-inner">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-black text-slate-800 truncate">{item.tracking_field}</p>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 uppercase">
                        <Clock className="w-3 h-3" />
                        {timeAgo(item.created_at)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50/50 rounded-2xl p-6 text-center border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">No recent activity detected</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900 text-white text-[11px] font-black tracking-widest uppercase shadow-xl shadow-slate-200">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/50">{stats.total_verified.toLocaleString()}</span> Secure Documents Recorded
          </div>
        </div>
      </motion.div>

      {/* How It Works Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="mt-32 mb-20"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-brand-navy tracking-tight mb-4">
            Verifiable <span className="text-emerald-600">Trust</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Our blockchain-backed verification system ensures 100% authenticity for every document generated.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Search,
              title: "Input Code",
              desc: "Enter the unique 8-character tracking ID found on the document.",
              color: "blue"
            },
            {
              icon: Database,
              title: "Ledger Scan",
              desc: "System instantly queries our immutable secure ledger for a match.",
              color: "emerald"
            },
            {
              icon: ShieldCheck,
              title: "Instant Proof",
              desc: "Receive immediate confirmation of the document's validity and metadata.",
              color: "purple"
            }
          ].map((step, idx) => (
            <div key={idx} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${step.color}-500/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2`} />

              <div className={`w-14 h-14 rounded-2xl bg-${step.color}-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className={`w-7 h-7 text-${step.color}-500`} />
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
              <p className="text-slate-500 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security Features */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-16 relative overflow-hidden text-center sm:text-left"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-black tracking-widest uppercase mb-6">
              <Lock className="w-3.5 h-3.5" />
              Bank-Grade Security
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-6 leading-tight">
              Tamper-Proof <br />
              <span className="text-emerald-400">Document Integrity</span>
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              Every document acts as a digital asset. Once issued, the core metadata is cryptographically sealed, making it impossible to alter without detection.
            </p>

            <ul className="space-y-4">
              {[
                "256-bit AES Encryption",
                "Immutable Audit Logs",
                "Real-time fraud detection",
                "Global verification availability"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/50">
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Server className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Server-Side Validation</p>
                  <p className="text-slate-400 text-xs">0ms Latency</p>
                </div>
                <div className="ml-auto text-emerald-400 text-xs font-black bg-emerald-500/10 px-2 py-1 rounded">ACTIVE</div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Fingerprint className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Unique Digital Fingerprint</p>
                  <p className="text-slate-400 text-xs">SHA-256 Hash</p>
                </div>
                <div className="ml-auto text-emerald-400 text-xs font-black bg-emerald-500/10 px-2 py-1 rounded">SECURE</div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700 opacity-50">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-300 font-bold text-sm">Scanning Next Block...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-32 max-w-3xl mx-auto"
      >
        <h2 className="text-3xl font-black text-brand-navy text-center mb-12">Frequently Asked Questions</h2>

        <div className="space-y-4">
          {[
            {
              q: "How secure is the verification process?",
              a: "Extremely secure. We use industry-standard encryption and immutable records to ensure that a document's validity cannot be forged or tampered with."
            },
            {
              q: "Can I verify documents offline?",
              a: "No, an internet connection is required to query our secure real-time ledger for the most up-to-date status of any document."
            },
            {
              q: "What if my code is not found?",
              a: "Please double-check the 8-character code on your document. If it still doesn't work, the document may have been revoked or is not authentic."
            }
          ].map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                {faq.q}
              </h3>
              <p className="text-slate-500 leading-relaxed pl-8">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
