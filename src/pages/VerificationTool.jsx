import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileText,
  Calendar,
  RefreshCw,
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
    <div className="relative min-h-[calc(100vh-64px)] w-full bg-slate-50/50 text-slate-800 overflow-y-auto font-sans selection:bg-brand-pink/30 block pt-8 sm:pt-12 px-4 pb-20">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-pink/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!verificationResult ? (
            <motion.div
              key="input-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-[2rem] shadow-[0_15px_60px_-15px_rgba(0,0,0,0.05)] p-8 sm:p-12 relative border border-slate-100 mt-10"
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                <div className="w-20 h-20 rounded-t-[2.5rem] rounded-b-[2rem] bg-brand-pink text-white flex items-center justify-center shadow-lg shadow-brand-pink/30 mx-auto">
                  <ShieldCheck className="w-10 h-10" />
                </div>
              </div>

              <div className="text-center mt-6 mb-12">
                <h2 className="text-4xl font-black text-slate-800 tracking-tight">Document Verification</h2>
                <p className="text-lg font-medium text-slate-500 mt-4 mx-auto max-w-md">
                  Enter the 8-digit tracking code found on the document:
                </p>
              </div>

              <div className="flex justify-center gap-3 sm:gap-4 mb-12 px-4 sm:px-12" onPaste={handlePaste}>
                {codeDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    value={digit}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-14 h-16 sm:w-20 sm:h-24 bg-white text-center text-3xl sm:text-4xl font-black border-2 border-slate-200 rounded-2xl focus:border-brand-pink focus:outline-none focus:ring-4 focus:ring-brand-pink/10 transition-all text-brand-navy shadow-sm"
                    maxLength={2}
                    autoComplete="off"
                    spellCheck="false"
                  />
                ))}
              </div>

              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, mb: 0 }}
                    animate={{ opacity: 1, height: 'auto', mb: 20 }}
                    exit={{ opacity: 0, height: 0, mb: 0 }}
                    className="text-center text-xs font-bold text-red-500 pb-2"
                  >
                    {errorMessage}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="px-4 sm:px-16 pb-4">
                <button
                  onClick={handleVerifyClick}
                  disabled={isVerifying}
                  className="w-full bg-brand-pink text-white font-black py-5 sm:py-6 rounded-2xl hover:bg-pink-600 active:scale-[0.98] transition-all shadow-md shadow-brand-pink/25 flex justify-center items-center gap-2 text-lg tracking-wide"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Confirm'
                  )}
                </button>
              </div>

              <div className="mt-8 flex flex-col items-center gap-5">
                <button onClick={handleReset} className="text-base font-bold text-brand-pink hover:text-pink-600 transition-colors">
                  Wrong document? Go back
                </button>
                <div className="text-sm text-slate-500 font-medium pb-4">
                  Didn't find the code? <button className="text-brand-pink hover:underline font-bold">Resend Code</button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={verificationResult.valid ? 'valid' : 'invalid'}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="mt-10"
            >
              {verificationResult.valid ? (
                <div className="bg-white rounded-[2rem] shadow-[0_15px_60px_-15px_rgba(0,0,0,0.05)] p-8 sm:p-10 relative overflow-hidden border border-slate-100">
                  <div className="absolute top-0 right-0 w-full h-full bg-brand-soft/10 pointer-events-none" />

                  <div className="flex flex-col items-center mb-8 text-center relative z-10">
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                      <div className="w-20 h-20 rounded-t-[2.5rem] rounded-b-[2rem] bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mx-auto">
                        <ShieldCheck className="w-10 h-10" />
                      </div>
                    </div>

                    <h2 className="text-2xl font-black text-brand-navy mb-2 tracking-tight mt-6">Authentic Record Verified</h2>
                    <p className="text-brand-pink font-mono font-bold tracking-widest text-sm bg-pink-50 px-4 py-1.5 rounded-lg border border-pink-100">
                      ID: {inputCode}
                    </p>
                  </div>

                  <div className="space-y-4 relative z-10 w-full">
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-brand-pink" />
                        Type
                      </p>
                      <p className="text-sm font-bold text-brand-navy truncate">{verificationResult.document?.template_type}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center justify-between">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-brand-pink" />
                        Issued
                      </p>
                      <p className="text-sm font-bold text-brand-navy truncate">{formatDate(verificationResult.document?.created_at)}</p>
                    </div>
                  </div>

                  <div className="mt-8 relative z-10">
                    <button
                      onClick={handleReset}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold py-4 rounded-2xl transition-all shadow-sm flex justify-center items-center gap-2 uppercase tracking-widest text-[13px]"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Verify Another
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[2rem] shadow-[0_15px_60px_-15px_rgba(0,0,0,0.05)] p-8 sm:p-12 text-center relative overflow-hidden border border-red-100">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-red-50/50 pointer-events-none" />

                  <div className="relative z-10 pt-4">
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2">
                      <div className="w-20 h-20 rounded-t-[2.5rem] rounded-b-[2rem] bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 mx-auto">
                        <AlertCircle className="w-10 h-10" />
                      </div>
                    </div>

                    <h3 className="text-2xl font-black text-brand-navy mb-3 tracking-tight mt-6">Record Not Found</h3>
                    <p className="text-slate-500 font-medium text-sm mx-auto mb-8 leading-relaxed max-w-[260px]">
                      No authentic record matches the code <span className="font-mono text-red-500 font-bold bg-white px-1.5 py-0.5 rounded border border-red-100">{inputCode}</span> in our ledger.
                    </p>
                    <button
                      onClick={handleReset}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[13px] tracking-widest rounded-2xl py-4 transition-all flex items-center justify-center gap-2 uppercase"
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
      </div>

    </div>
  )
}
