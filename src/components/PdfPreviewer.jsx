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
import { injectFieldsIntoHTML } from '../utils/puckFields'



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
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-slate-800 transition-smooth shadow-sm"
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

      </div>

      <div className="p-6 sm:p-8 lg:p-10 flex justify-center bg-brand-soft/30 min-h-[500px]">
        <motion.div
          ref={printRef}
          className={`w-full bg-white shadow-card overflow-hidden print-shadow relative ${template?.template_html ? 'rounded-none' : 'rounded-2xl border border-slate-200'
            } ${template?.layout === 'idcard' ? 'max-w-sm' :
              template?.layout === 'certificate' ? 'max-w-4xl' : 'max-w-xl'
            }`}
          style={{ minHeight: template?.layout === 'certificate' ? '580px' : '800px' }}
          whileHover={{ y: -2, shadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          {hasValidData ? (
            <motion.div
              key={`${documentData.templateId || 'template'}-${documentData.uniqueCode || 'preview'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={template?.template_html ? "w-full min-h-full" : "p-10"}
            >
              {!template?.template_html && (
                <div className={`bg-slate-50 border-b border-slate-100 -m-10 -mb-8 p-10 rounded-t-lg relative overflow-hidden`}>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                        <Zap className="w-3 h-3 text-brand-pink" />
                        System Template
                      </div>
                      <h1 className="text-3xl font-black text-brand-navy tracking-tight uppercase">
                        {template?.name || 'Document'}
                      </h1>
                    </div>
                    {documentData.uniqueCode && (
                      <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-slate-600 text-[10px] font-mono tracking-widest font-bold">
                          # {documentData.uniqueCode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Layout components */}
              <div className={template?.template_html ? "" : "pt-12"}>
                {template?.template_html ? (
                  <div
                    className="p-10 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: injectFieldsIntoHTML(template.template_html, fields) }}
                  />
                ) : template?.layout === 'certificate' ? (
                  <CertificatePreview fields={fields} template={template} documentData={documentData} formatDate={formatDate} />
                ) : template?.layout === 'receipt' ? (
                  <ReceiptPreview fields={fields} documentData={documentData} formatDate={formatDate} formatAmount={formatAmount} />
                ) : template?.layout === 'letter' || template?.name?.toLowerCase().includes('letter') ? (
                  <LetterPreview fields={fields} template={template} documentData={documentData} formatDate={formatDate} />
                ) : (
                  <DefaultPreview fields={fields} template={template} documentData={documentData} />
                )}
              </div>

              {!template?.template_html && documentData.uniqueCode && (
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
      <div className="rounded-xl border-[16px] border-double border-slate-200 p-12 bg-white relative overflow-hidden shadow-inner">
        {/* Decorative corners */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-brand-pink opacity-50"></div>
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-brand-pink opacity-50"></div>
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-brand-pink opacity-50"></div>
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-brand-pink opacity-50"></div>

        <div className="text-sm font-bold uppercase tracking-[0.3em] text-brand-pink mb-6">Certificate of Achievement</div>
        <h2 className="text-5xl font-serif font-black text-brand-navy mb-4 tracking-tight">{template?.name || 'Certificate'}</h2>

        <div className="w-16 h-1 bg-brand-pink mx-auto mb-12"></div>

        <div className="text-sm italic text-slate-500 mb-3">This is proudly presented to</div>
        <div className="text-4xl font-serif font-bold text-slate-900 mb-6 border-b border-slate-200 inline-block pb-2 px-8">{fields.name || '[Recipient Name]'}</div>

        <div className="text-slate-600 mb-2 font-medium">for successful completion of</div>
        <div className="text-2xl font-bold text-brand-navy mb-4">{fields.courseName || '[Course Name]'}</div>

        {fields.grade && (
          <div className="mt-4 text-slate-600">
            Graduated with honors: <span className="font-bold text-brand-pink px-3 py-1 bg-pink-50 rounded-lg">{fields.grade}</span>
          </div>
        )}

        <div className="mt-12 text-sm text-slate-500 font-medium">Issued on <span className="text-slate-800 font-bold">{formatDate(fields.date) || '[Date]'}</span></div>

        {(documentData.customFields || []).length > 0 && (
          <div className="mt-8 pt-6 max-w-sm mx-auto">
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

        <div className="mt-16 flex justify-between items-end px-8">
          <div className="text-center w-40">
            <div className="border-b-2 border-slate-300 pb-2 mb-2"></div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Authorized Signature</div>
          </div>
          <div className="relative z-10">
            <div className="w-24 h-24 rounded-full border-4 border-pink-100 bg-pink-50 flex items-center justify-center text-[10px] uppercase tracking-widest text-brand-pink font-bold p-2 text-center leading-tight shadow-sm">
              <span className="opacity-80">Official<br />Seal of<br />Excellence</span>
            </div>
          </div>
          <div className="text-center w-40">
            <div className="border-b-2 border-slate-300 pb-2 mb-2"></div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date of Issuance</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReceiptPreview({ fields, documentData, formatDate, formatAmount }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 w-full max-w-sm mx-auto shadow-sm relative overflow-hidden">
      {/* Decorative top zig-zag edge (simplified) */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(circle,transparent_4px,white_4px)] bg-[length:12px_12px] -mt-1 hidden fill-slate-50"></div>

      <div className="text-center mb-8 border-b border-dashed border-slate-300 pb-6">
        <div className="w-12 h-12 bg-slate-50 border border-slate-200 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-brand-navy uppercase tracking-widest mb-1">Official Receipt</h3>
        {documentData.uniqueCode && (
          <p className="text-xs text-slate-500 font-mono tracking-widest">#{documentData.uniqueCode}</p>
        )}
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-end text-sm">
          <span className="text-slate-500 font-medium">Date</span>
          <span className="font-bold text-slate-800">{formatDate(fields.date) || '[Date]'}</span>
        </div>
        <div className="flex justify-between items-end text-sm">
          <span className="text-slate-500 font-medium">Customer</span>
          <span className="font-bold text-slate-800 text-right">{fields.name || '[Name]'}</span>
        </div>
      </div>

      <div className="border-t-2 border-slate-800 pt-6 pb-2 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-slate-600 font-black uppercase tracking-widest text-sm">Total Paid</span>
          <span className="text-3xl font-black text-brand-navy">${formatAmount(fields.amount)}</span>
        </div>
      </div>

      {(documentData.customFields || []).length > 0 && (
        <div className="mt-6 pt-4 border-t border-dashed border-slate-200 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Additional Details</div>
          {(documentData.customFields || []).map(cf => (
            <div key={cf.id} className="flex justify-between text-xs">
              <span className="text-slate-500">{cf.label}</span>
              <span className="font-medium">{cf.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-xs text-slate-400 mt-8 font-medium">
        Thank you for your business.
      </div>
    </div>
  )
}

function LetterPreview({ fields, template, documentData, formatDate }) {
  const customFields = (documentData.customFields || []).filter(cf => cf.label || cf.value)
  return (
    <div className="text-left font-serif leading-relaxed text-slate-800 space-y-6 max-w-2xl mx-auto px-4 py-8">
      <div className="text-sm font-sans mb-12 text-slate-500 flex justify-between items-start border-b border-slate-200 pb-6">
        <div>
          <div className="font-bold text-brand-navy uppercase tracking-widest">{template?.name || 'Official Letter'}</div>
          {documentData.uniqueCode && (
            <div>Ref: #{documentData.uniqueCode}</div>
          )}
        </div>
        <div className="text-right">
          <div>{formatDate(fields.date) || '[Date]'}</div>
        </div>
      </div>

      <div className="text-base">
        <p>Dear <strong>{fields.name || '[Recipient Name]'}</strong>,</p>
      </div>

      <div className="text-base space-y-4">
        <p>This letter is to officially confirm the details regarding the aforementioned subject. Please find the relevant information documented below.</p>
      </div>

      <div className="bg-slate-50 border-l-4 border-brand-pink p-6 my-8 space-y-3 font-sans text-sm shadow-sm">
        {(template?.fields || []).map((def) => {
          const val = fields[def.id]
          if (def.id === 'name' || def.id === 'date') return null
          return (
            <div key={def.id} className="grid grid-cols-3 gap-4 border-b border-slate-200 last:border-0 pb-2 last:pb-0">
              <span className="text-slate-500 font-medium col-span-1">{def.label}</span>
              <span className="font-bold text-brand-navy col-span-2">{val || `[${def.label}]`}</span>
            </div>
          )
        })}
        {customFields.map((cf) => (
          <div key={cf.id} className="grid grid-cols-3 gap-4 border-b border-slate-200 last:border-0 pb-2 last:pb-0">
            <span className="text-slate-500 font-medium col-span-1">{cf.label || '—'}</span>
            <span className="font-bold text-brand-navy col-span-2">{cf.value || '—'}</span>
          </div>
        ))}
      </div>

      <div className="text-base mt-8">
        <p>Should you require any further validation, please use the reference code provided at the top of this document at our official verification portal.</p>
      </div>

      <div className="mt-16 pt-8">
        <p className="mb-8">Sincerely,</p>
        <div className="w-48 border-b border-slate-300 mb-2"></div>
        <p className="font-bold text-brand-navy">Authorized Representative</p>
        <p className="text-sm text-slate-500">Global Issuing Authority</p>
      </div>
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