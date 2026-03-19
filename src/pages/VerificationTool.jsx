import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileText,
  Calendar,
  RefreshCw,
  Database,
  Hash
} from 'lucide-react'
import API from '../api/client'

function sanitizeCode(str) {
  if (!str || typeof str !== 'string') return ''
  return str.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8)
}

function getMetadataRows(metadata) {
  if (!metadata) return []
  return Object.entries(metadata)
    .filter(([key, value]) => {
      // Filter out internal or redundant keys
      const internalKeys = ['custom_fields', 'customFields', 'grade', 'items']
      return !internalKeys.includes(key) && value !== null && value !== undefined && value !== ''
    })
    .map(([key, value]) => ({
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: String(value),
    }))
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

export default function VerificationTool({ initialCode = '', onNavigate }) {
  const [codeDigits, setCodeDigits] = useState(() => {
    const init = sanitizeCode(initialCode).padEnd(8, '').split('')
    return init.length === 8 ? init : Array(8).fill('')
  })

  const inputRefs = useRef([])

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
      await new Promise(r => setTimeout(r, 1200))

      const response = await API.get(`verify/${cleanCode}/`)
      const doc = response.data?.document
      if (doc) {
        setVerificationResult({ valid: true, document: doc })
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

  const handleDigitChange = (index, value) => {
    const cleanValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-1)

    setCodeDigits(prev => {
      const next = [...prev]
      next[index] = cleanValue
      return next
    })

    setErrorMessage(null)
    setVerificationResult(null)

    if (cleanValue && index < 7) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'Enter') {
      handleVerifyClick()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = (e.clipboardData?.getData('text') || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (!pasted) return

    const newDigits = [...codeDigits]
    for (let i = 0; i < Math.min(8, pasted.length); i++) {
      newDigits[i] = pasted[i]
    }
    setCodeDigits(newDigits)
    setErrorMessage(null)
    setVerificationResult(null)

    const focusIndex = Math.min(7, pasted.length)
    inputRefs.current[focusIndex]?.focus()
  }

  const handleReset = () => {
    setCodeDigits(Array(8).fill(''))
    setVerificationResult(null)
    setErrorMessage(null)
    inputRefs.current[0]?.focus()
  }

  const handleVerifyClick = () => {
    const code = codeDigits.join('')
    if (code.length === 8) {
      verifyCode(code)
    } else {
      setErrorMessage('Please enter all 8 characters')
    }
  }

  const inputCode = codeDigits.join('')

  return (
    <div className="min-h-[calc(100vh-64px)] w-full bg-slate-50 text-slate-800 font-sans selection:bg-brand-pink/30 flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Subtle Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-brand-pink/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-slate-300/20 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-2xl mx-auto relative z-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!verificationResult ? (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/90 backdrop-blur-md rounded-[1.25rem] shadow-card p-8 sm:p-12 border border-slate-100/80 w-full transition-smooth"
            >
              <div className="text-center mb-10">
                <div className="flex justify-center mb-4">
                  <ShieldCheck className="w-12 h-12 text-brand-pink" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl text-slate-800 tracking-tight font-normal">Document Verification</h2>
                <p className="text-base text-slate-500 mt-3 font-normal">
                  Enter the 8-digit tracking code found on the document
                </p>
              </div>

              <div className="flex justify-center gap-2 sm:gap-4 mb-8" onPaste={handlePaste}>
                {codeDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    value={digit}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-12 h-16 sm:w-16 sm:h-20 bg-slate-50 text-center text-3xl font-light border border-slate-200 rounded-lg focus:border-brand-pink focus:outline-none focus:ring-1 focus:ring-brand-pink transition-colors text-brand-navy"
                    maxLength={2}
                    autoComplete="off"
                    spellCheck="false"
                  />
                ))}
              </div>

              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-center text-sm text-red-500 mb-6 font-normal"
                  >
                    {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="max-w-md mx-auto">
                <button
                  onClick={handleVerifyClick}
                  disabled={isVerifying}
                  className="w-full bg-brand-pink text-white py-4 rounded-lg hover:bg-pink-600 transition-colors flex justify-center items-center gap-2 text-lg font-normal"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Confirm Code'
                  )}
                </button>
              </div>

              <div className="mt-8 flex flex-col items-center gap-4">
                <button onClick={handleReset} className="text-sm text-slate-500 hover:text-brand-pink transition-colors font-normal">
                  Clear input
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={verificationResult.valid ? 'valid' : 'invalid'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              {verificationResult.valid ? (
                <div className="bg-white/90 backdrop-blur-md rounded-[1.25rem] shadow-card p-8 sm:p-12 border border-slate-100/80 w-full transition-smooth">
                  <div className="text-center mb-10">
                    <div className="flex justify-center mb-4">
                      <ShieldCheck className="w-16 h-16 text-emerald-500" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl text-brand-navy tracking-tight font-normal mb-2">Authentic Record Verified</h2>
                    <p className="text-emerald-600/80 font-mono text-sm tracking-wider font-normal bg-emerald-50 inline-block px-3 py-1 rounded">
                      ID: {inputCode}
                    </p>
                  </div>

                  <div className="space-y-4 max-w-lg mx-auto">
                    <div className="flex items-center justify-between py-4 border-b border-slate-100">
                      <p className="text-sm text-slate-500 flex items-center gap-2 font-normal">
                        <FileText className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                        Document Type
                      </p>
                      <p className="text-base text-brand-navy font-normal">{verificationResult.document?.template_type}</p>
                    </div>
                    <div className="flex items-center justify-between py-4 border-b border-slate-100">
                      <p className="text-sm text-slate-500 flex items-center gap-2 font-normal">
                        <Calendar className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                        Issued Date
                      </p>
                      <p className="text-base text-brand-navy font-normal">{formatDate(verificationResult.document?.created_at)}</p>
                    </div>

                    {getMetadataRows(verificationResult.document?.metadata).length > 0 && (
                      <div className="pt-6">
                        <h4 className="text-sm text-slate-500 mb-4 flex items-center gap-2 font-normal">
                          <Database className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                          Verification Details
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {getMetadataRows(verificationResult.document?.metadata).map((row, i) => (
                            <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                              <label className="block text-xs text-slate-500 mb-1 font-normal">
                                {row.label}
                              </label>
                              <p className="text-sm text-slate-800 break-words font-normal">
                                {row.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-10 max-w-sm mx-auto">
                    <button
                      onClick={handleReset}
                      className="w-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-3 rounded-lg transition-colors flex justify-center items-center gap-2 text-sm font-normal"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Verify Another Document
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/90 backdrop-blur-md rounded-[1.25rem] shadow-card p-8 sm:p-12 text-center border border-red-100/50 w-full transition-smooth">
                  <div className="flex justify-center mb-6">
                    <AlertCircle className="w-16 h-16 text-red-500" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-2xl text-brand-navy tracking-tight mb-3 font-normal">Record Not Found</h3>
                  <p className="text-slate-500 font-normal text-base max-w-sm mx-auto mb-8">
                    No authentic record matches the code <span className="font-mono text-red-500 font-normal">{inputCode}</span> in our ledger.
                  </p>
                  <div className="max-w-xs mx-auto">
                    <button
                      onClick={handleReset}
                      className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg py-3 transition-colors flex items-center justify-center gap-2 text-sm font-normal"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Informational Elements (Trust Indicators) */}
        {!verificationResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-3xl mx-auto px-4"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3.5 rounded-full shadow-sm border border-slate-100/50">
                <ShieldCheck className="w-5 h-5 text-brand-pink" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-sm text-slate-700 font-normal mb-1">Secure Verification</h4>
                <p className="text-[13px] text-slate-400 font-light">Cryptographically secured document checking</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3.5 rounded-full shadow-sm border border-slate-100/50">
                <Database className="w-5 h-5 text-brand-pink" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-sm text-slate-700 font-normal mb-1">Immutable Records</h4>
                <p className="text-[13px] text-slate-400 font-light">Tamper-proof storage of authenticity</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3.5 rounded-full shadow-sm border border-slate-100/50">
                <FileText className="w-5 h-5 text-brand-pink" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-sm text-slate-700 font-normal mb-1">Instant Results</h4>
                <p className="text-[13px] text-slate-400 font-light">Real-time digital status of your documents</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
