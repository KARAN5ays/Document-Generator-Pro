import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReactToPrint } from 'react-to-print'
import {
  Printer,
  Download,
  Palette,
  ExternalLink,
  Eye,
  Sparkles,
  Zap,
  FileText
} from 'lucide-react'
import API, { getBackendOrigin } from '../api/client'
import PuckRenderer from './PuckRenderer'

const THEME_OPTIONS = ['auto', 'blue', 'emerald', 'red', 'slate', 'violet', 'cyan', 'amber']

export default function PdfPreviewer({ documentData, templates, onUpdate }) {
  const printRef = useRef(null)

  const template =
    templates?.find((t) => t.id === documentData.templateId) || templates?.[0] || null
  const fields = documentData.fields || {}

  // Always show preview when a template is selected.
  // This ensures custom fields (and partial fills) are visible in real-time.
  const hasValidData = Boolean(template)

  const formatAmount = (amount) => {
    const num = parseFloat(amount)
    if (isNaN(num)) return '0.00'
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleDownloadOfficial = () => {
    // Use pdf_url from create response (backend returns path like /media/documents/XXX.pdf)
    if (documentData.pdfUrl) {
      const fullUrl = documentData.pdfUrl.startsWith('http')
        ? documentData.pdfUrl
        : `${getBackendOrigin()}${documentData.pdfUrl.startsWith('/') ? '' : '/'}${documentData.pdfUrl}`
      window.open(fullUrl, '_blank', 'noopener,noreferrer')
      return
    }
    // Fallback: try API download endpoint if pdf_url not available
    if (!documentData.uniqueCode) return
    API.get(`documents/download/${documentData.uniqueCode}/`, { responseType: 'blob' })
      .then((resp) => {
        const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
      })
      .catch((err) => {
        console.error('Download error', err)
        alert('Failed to download PDF. Try creating the document again.')
      })
  }

  const pageStyle = `
    @page { size: ${template?.layout === 'certificate' ? 'A4 landscape' : 'A4'}; margin: 20mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .print-shadow { box-shadow: none !important; }
    }
  `

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${template?.name || 'Document'}-${documentData.uniqueCode || 'Preview'}`,
    pageStyle,
  })

  // Theme Gradients
  const accentGradients = {
    slate: 'from-slate-500 to-slate-700',
    amber: 'from-amber-500 to-amber-700',
    emerald: 'from-emerald-500 to-emerald-700',
    blue: 'from-blue-500 to-blue-700',
    violet: 'from-violet-500 to-violet-700',
    cyan: 'from-cyan-500 to-cyan-700',
    red: 'from-red-500 to-red-700',
  }

  const effectiveAccent =
    documentData.themeAccent && documentData.themeAccent !== 'auto'
      ? documentData.themeAccent
      : template?.accent
  const gradient = accentGradients[effectiveAccent] || accentGradients.slate

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden"
    >
      <div className="px-6 sm:px-8 py-5 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-soft rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-brand-pink" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-navy">Document Preview</h2>
              <p className="text-xs text-slate-400 font-medium">See how your document will look</p>
            </div>
          </div>

          <AnimatePresence>
            {hasValidData && documentData.uniqueCode && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex gap-3"
              >
                <motion.button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-smooth"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Printer className="w-4 h-4" />
                  Print View
                </motion.button>
                <motion.button
                  onClick={handleDownloadOfficial}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-brand-pink transition-smooth shadow-lg shadow-brand-navy/10"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  Official PDF
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggles */}
        <div className="mt-5 flex items-center gap-4 py-3 px-4 bg-slate-50/50 rounded-xl border border-slate-100 flex-wrap">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-4 shrink-0">
            <Palette className="w-3.5 h-3.5" />
            Theme
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {THEME_OPTIONS.map((a) => {
              const active = (documentData.themeAccent || 'auto') === a
              return (
                <motion.button
                  key={a}
                  type="button"
                  onClick={() => onUpdate?.({ themeAccent: a })}
                  whileTap={{ scale: 0.92 }}
                  className={`relative group h-6 px-3 rounded-full text-[10px] font-bold transition-smooth uppercase tracking-tighter ${active
                    ? 'bg-brand-pink text-white'
                    : 'bg-white text-slate-400 border border-slate-200 hover:border-brand-pink hover:text-brand-pink'
                    }`}
                >
                  {a}
                  {active && (
                    <motion.div
                      layoutId="active-theme"
                      className="absolute inset-0 bg-brand-pink rounded-full -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 lg:p-10 flex justify-center bg-brand-soft/30 min-h-[500px]">
        <motion.div
          ref={printRef}
          className={`w-full bg-white shadow-2xl rounded-2xl overflow-hidden print-shadow border border-slate-100/50 relative ${template?.layout === 'idcard' ? 'max-w-sm' :
            template?.layout === 'certificate' ? 'max-w-4xl' : 'max-w-xl'
            }`}
          style={{ minHeight: template?.layout === 'certificate' ? '580px' : '450px' }}
          whileHover={{ y: -4, shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)" }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          {hasValidData ? (
            <motion.div
              key={`${documentData.templateId || 'template'}-${documentData.uniqueCode || 'preview'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="p-10"
            >
              <div className={`bg-gradient-to-r ${gradient} -m-10 -mb-8 p-10 rounded-t-lg relative overflow-hidden`}>
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">
                      <Zap className="w-3 h-3 fill-white/20" />
                      System Template
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                      {template?.name || 'Document'}
                    </h1>
                  </div>
                  {documentData.uniqueCode && (
                    <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                      <p className="text-white text-[10px] font-mono tracking-widest font-bold">
                        # {documentData.uniqueCode}
                      </p>
                    </div>
                  )}
                </div>
                {/* Decorative sparkles */}
                <Sparkles className="absolute top-4 right-4 text-white/10 w-24 h-24 rotate-12" />
              </div>

              {/* Layout components */}
              <div className="pt-12">
                {template?.ui_config?.content ? (
                  <>
                    <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm p-8">
                      <PuckRenderer data={template.ui_config} fields={fields} />
                    </div>
                  </>
                ) : template?.layout === 'certificate' ? (
                  <CertificatePreview fields={fields} template={template} documentData={documentData} formatDate={formatDate} />
                ) : template?.layout === 'receipt' ? (
                  <ReceiptPreview fields={fields} documentData={documentData} formatDate={formatDate} formatAmount={formatAmount} />
                ) : (
                  <DefaultPreview fields={fields} template={template} documentData={documentData} />
                )}
              </div>

              {documentData.uniqueCode && (
                <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                    <ExternalLink className="w-3 h-3 text-brand-pink" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Verify at docgen.enterprise/verify
                    </span>
                  </div>
                  <p className="font-mono font-bold text-brand-navy text-xs tracking-widest opacity-30">
                    {documentData.uniqueCode}
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="p-10 flex flex-col items-center justify-center min-h-[500px] text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-500 mb-2">Preview will appear here</h3>
              <p className="text-sm text-slate-400 max-w-[260px]">Fill in the form on the left and your document preview will show here in real time</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  )
}

function CertificatePreview({ fields, template, documentData, formatDate }) {
  return (
    <div className="text-center relative">
      <div className="rounded-xl border-[12px] border-double border-slate-200 p-10 bg-white relative overflow-hidden">
        <div className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-8">Official Document of Completion</div>
        <h2 className="text-4xl font-serif font-bold text-slate-900 mb-2">{template?.name || 'Certificate'}</h2>
        <div className="w-24 h-1 bg-slate-200 mx-auto mb-10"></div>

        <div className="text-sm italic text-slate-500 mb-2">This is to certify that</div>
        <div className="text-3xl font-serif font-bold text-slate-900 mb-4">{fields.name}</div>
        <div className="text-slate-700 mb-2">has successfully completed the requirements for</div>
        <div className="text-xl font-semibold text-slate-900 mb-2">{fields.courseName}</div>

        {fields.grade && (
          <div className="mt-2 text-slate-600">
            with a grade of <span className="font-bold text-slate-900">{fields.grade}</span>
          </div>
        )}

        <div className="mt-10 text-sm text-slate-600">Issued on <span className="font-medium text-slate-800">{formatDate(fields.date)}</span></div>

        {(documentData.customFields || []).length > 0 && (
          <div className="mt-12 pt-6 border-t border-slate-100 max-w-sm mx-auto">
            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-3">Additional Credentials</div>
            <div className="space-y-1">
              {(documentData.customFields || []).map(cf => (
                <div key={cf.id} className="flex justify-between text-xs px-4">
                  <span className="text-slate-500">{cf.label}:</span>
                  <span className="font-bold text-slate-800">{cf.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 flex justify-between items-end px-4">
          <div className="text-center w-32 pb-4">
            <div className="border-b border-slate-300 pb-1 mb-1 italic text-slate-400 text-[10px]">Authored Signature</div>
          </div>
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center text-[8px] uppercase tracking-tighter text-slate-300 font-bold p-1 text-center leading-none">
              Official<br />Verified<br />Secure
            </div>
          </div>
          <div className="text-center w-32 pb-4">
            <div className="border-b border-slate-300 pb-1 mb-1 italic text-slate-400 text-[10px]">Official Registrar</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReceiptPreview({ fields, documentData, formatDate, formatAmount }) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="flex justify-between text-sm">
        <span>Customer: <strong>{fields.name}</strong></span>
        <span>Date: <strong>{formatDate(fields.date)}</strong></span>
      </div>

      {fields.grade && (
        <div className="mt-3 text-sm flex justify-between border-t border-slate-50 pt-3">
          <span className="text-slate-500">Grade</span>
          <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 text-xs font-bold">{fields.grade}</span>
        </div>
      )}

      <div className="mt-5 flex justify-between border-t pt-4">
        <span className="text-slate-600">Total Amount</span>
        <span className="text-lg font-bold">${formatAmount(fields.amount)}</span>
      </div>

      {(documentData.customFields || []).length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400">Additional Details</div>
          {(documentData.customFields || []).map(cf => (
            <div key={cf.id} className="flex justify-between text-xs">
              <span className="text-slate-500">{cf.label}</span>
              <span className="font-medium">{cf.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DefaultPreview({ fields, template, documentData }) {
  const customFields = (documentData.customFields || []).filter(cf => cf.label || cf.value)
  return (
    <div className="space-y-1">
      {(template?.fields || []).map((def) => {
        const val = fields[def.id]
        if (def.id === 'grade' && val) return null
        return (
          <div key={def.id} className="flex justify-between items-center border-b border-slate-100 py-2.5 text-sm gap-4">
            <span className="text-slate-500 shrink-0">{def.label}</span>
            <span className={`font-semibold text-right truncate ${val ? 'text-brand-navy' : 'text-slate-300 italic'}`}>
              {val || `Enter ${def.label.toLowerCase()}...`}
            </span>
          </div>
        )
      })}

      {fields.grade && !(template?.fields || []).some(f => f.id === 'grade') && (
        <div className="flex justify-between items-center border-b border-slate-100 py-2.5 text-sm">
          <span className="text-slate-500">Grade</span>
          <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 text-xs font-bold">{fields.grade}</span>
        </div>
      )}

      {customFields.length > 0 && (
        <>
          <div className="pt-3 pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom Fields</span>
          </div>
          {customFields.map((cf) => (
            <div key={cf.id} className="flex justify-between items-center border-b border-pink-50 py-2.5 text-sm gap-4">
              <span className="text-slate-500 shrink-0">{cf.label || '—'}</span>
              <span className="font-semibold text-brand-navy text-right truncate">{cf.value || '—'}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}