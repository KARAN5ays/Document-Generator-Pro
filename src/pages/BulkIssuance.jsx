import { useState, useRef, useCallback, useEffect } from 'react'
import {
    Upload, FileText, CheckCircle2, AlertCircle, Users,
    ChevronDown, Download, X, Loader2, Info
} from 'lucide-react'
import API from '../api/client'

const STEPS = ['Select Template', 'Upload File', 'Review & Submit']

export default function BulkIssuance({ token }) {
    const [step, setStep] = useState(0)
    const [templates, setTemplates] = useState([])
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [file, setFile] = useState(null)
    const [previewRows, setPreviewRows] = useState([])
    const [previewHeaders, setPreviewHeaders] = useState([])
    const [isDragging, setIsDragging] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)

    const authHeader = { headers: { Authorization: `Bearer ${token}` } }

    useEffect(() => {
        API.get('document-types/', authHeader)
            .then(res => setTemplates(res.data))
            .catch(() => setError('Failed to load templates.'))
    }, [])

    // ── CSV preview ──────────────────────────────────────────────────────────
    const previewCSV = (f) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const lines = e.target.result.split('\n').filter(Boolean)
            if (lines.length === 0) return
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
            const rows = lines.slice(1, 6).map(line => {
                const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
                return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']))
            })
            setPreviewHeaders(headers)
            setPreviewRows(rows)
        }
        reader.readAsText(f)
    }

    const handleFileAccepted = (f) => {
        setFile(f)
        setError('')
        setResult(null)
        const name = f.name.toLowerCase()
        if (name.endsWith('.csv')) previewCSV(f)
        else {
            // Excel: just show filename, no client-side preview
            setPreviewHeaders([])
            setPreviewRows([])
        }
    }

    // ── Drag-and-drop handlers ───────────────────────────────────────────────
    const onDrop = useCallback((e) => {
        e.preventDefault()
        setIsDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) handleFileAccepted(f)
    }, [])

    const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
    const onDragLeave = () => setIsDragging(false)

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!selectedTemplate || !file) return
        setIsSubmitting(true)
        setError('')
        const formData = new FormData()
        formData.append('file', file)
        formData.append('document_type', selectedTemplate.id)
        try {
            const res = await API.post('bulk-issuance/', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            })
            setResult(res.data)
            setStep(3) // done
        } catch (err) {
            setError(err.response?.data?.error || 'Bulk issuance failed. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // ── Download tracking codes ───────────────────────────────────────────────
    const downloadCodes = () => {
        if (!result?.tracking_codes) return
        const content = result.tracking_codes.join('\n')
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'tracking_codes.txt'
        a.click()
        URL.revokeObjectURL(url)
    }

    const reset = () => {
        setStep(0); setFile(null); setSelectedTemplate(null)
        setPreviewRows([]); setPreviewHeaders([]); setResult(null); setError('')
    }

    // ── UI ───────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-pink to-pink-600 flex items-center justify-center shadow-lg shadow-brand-pink/25">
                    <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-brand-navy">Bulk Issuance</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Generate hundreds of documents at once from a CSV or Excel file</p>
                </div>
            </div>

            {/* Progress Steps */}
            {step < 3 && (
                <div className="flex items-center gap-2">
                    {STEPS.map((label, i) => (
                        <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                            <div className={`flex items-center gap-2 ${i <= step ? 'text-brand-pink' : 'text-slate-400'}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                                    ${i < step ? 'bg-brand-pink border-brand-pink text-white'
                                        : i === step ? 'border-brand-pink text-brand-pink bg-pink-50'
                                            : 'border-slate-200 text-slate-400 bg-white'}`}>
                                    {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                </div>
                                <span className="text-sm font-semibold hidden sm:block">{label}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`h-[1px] flex-1 mx-2 transition-colors ${i < step ? 'bg-brand-pink' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Step 0: Template Selection ── */}
            {step === 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
                    <h2 className="text-lg font-bold text-brand-navy">Choose a Document Template</h2>
                    <p className="text-slate-500 text-sm">Select the template you want to use. The column headers in your file should match the template's field names.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {templates.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t)}
                                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${selectedTemplate?.id === t.id
                                    ? 'border-brand-pink bg-pink-50'
                                    : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedTemplate?.id === t.id ? 'bg-brand-pink text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="font-semibold text-brand-navy text-sm">{t.name}</p>
                                    {t.fields_schema?.length > 0 && (
                                        <p className="text-xs text-slate-400 mt-0.5">Fields: {t.fields_schema.map(f => f.name || f).join(', ')}</p>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Hint */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-blue-700">Your CSV/Excel column headers must match the template field names above (case-insensitive).</p>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        disabled={!selectedTemplate}
                        onClick={() => setStep(1)}
                        className="w-full py-3 rounded-xl bg-brand-pink text-white font-bold text-sm hover:bg-pink-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-pink/20 hover:shadow-brand-pink/30 hover:-translate-y-0.5 active:translate-y-0">
                        Continue →
                    </button>
                </div>
            )}

            {/* ── Step 1: Upload File ── */}
            {step === 1 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-brand-navy">Upload Your File</h2>
                        <button onClick={() => setStep(0)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold flex items-center gap-1">
                            <ChevronDown className="w-3 h-3 rotate-90" /> Back
                        </button>
                    </div>

                    <div
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
                            ${isDragging ? 'border-brand-pink bg-pink-50 scale-[1.01]' : 'border-slate-200 hover:border-brand-pink/50 hover:bg-slate-50'}`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            onChange={e => e.target.files[0] && handleFileAccepted(e.target.files[0])}
                        />
                        <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all ${isDragging ? 'bg-brand-pink text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Upload className="w-7 h-7" />
                        </div>
                        <p className="font-bold text-brand-navy">Drop your file here, or click to browse</p>
                        <p className="text-slate-400 text-sm mt-1">Supports <span className="font-semibold text-slate-600">.csv</span> and <span className="font-semibold text-slate-600">.xlsx</span> files</p>
                    </div>

                    {file && (
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-emerald-800 truncate">{file.name}</p>
                                <p className="text-xs text-emerald-600">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewHeaders([]); setPreviewRows([]) }}>
                                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                            </button>
                        </div>
                    )}

                    <button
                        disabled={!file}
                        onClick={() => setStep(2)}
                        className="w-full py-3 rounded-xl bg-brand-pink text-white font-bold text-sm hover:bg-pink-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-pink/20 hover:shadow-brand-pink/30 hover:-translate-y-0.5 active:translate-y-0">
                        Preview & Submit →
                    </button>
                </div>
            )}

            {/* ── Step 2: Review ── */}
            {step === 2 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-brand-navy">Review & Submit</h2>
                        <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold flex items-center gap-1">
                            <ChevronDown className="w-3 h-3 rotate-90" /> Back
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-pink-50 rounded-xl border border-pink-100">
                            <p className="text-xs text-pink-500 font-semibold uppercase tracking-wider">Template</p>
                            <p className="font-bold text-brand-navy mt-1">{selectedTemplate?.name}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">File</p>
                            <p className="font-bold text-brand-navy mt-1 truncate">{file?.name}</p>
                        </div>
                    </div>

                    {/* CSV Preview Table */}
                    {previewHeaders.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold text-slate-600 mb-2">Preview (first 5 rows)</p>
                            <div className="overflow-auto rounded-xl border border-slate-100">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            {previewHeaders.map(h => (
                                                <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewRows.map((row, i) => (
                                            <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                                {previewHeaders.map(h => (
                                                    <td key={h} className="px-3 py-2 text-slate-600 whitespace-nowrap">{row[h] || '—'}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Showing first 5 rows. All rows in the file will be processed.</p>
                        </div>
                    )}

                    {file?.name?.toLowerCase().endsWith('.xlsx') && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700">Excel file preview is not available in the browser. All rows will be processed on submit.</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl bg-brand-pink text-white font-bold text-sm hover:bg-pink-600 transition-all disabled:opacity-60 shadow-lg shadow-brand-pink/20 hover:shadow-brand-pink/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Generating Documents...</>
                        ) : (
                            <><Users className="w-4 h-4" /> Generate All Documents</>
                        )}
                    </button>
                </div>
            )}

            {/* ── Step 3: Results ── */}
            {step === 3 && result && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-brand-navy">Bulk Issuance Complete!</h2>
                        <p className="text-slate-500 text-sm mt-1">Your documents have been generated successfully.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <p className="text-4xl font-black text-emerald-600">{result.created}</p>
                            <p className="text-sm text-emerald-700 font-semibold mt-1">Documents Created</p>
                        </div>
                        <div className="text-center p-6 bg-red-50 rounded-2xl border border-red-100">
                            <p className="text-4xl font-black text-red-500">{result.errors?.length || 0}</p>
                            <p className="text-sm text-red-600 font-semibold mt-1">Rows Failed</p>
                        </div>
                    </div>

                    {result.errors?.length > 0 && (
                        <div className="p-4 bg-red-50 rounded-xl border border-red-100 space-y-1">
                            <p className="text-sm font-bold text-red-700 mb-2">Row Errors</p>
                            {result.errors.map((err, i) => (
                                <p key={i} className="text-xs text-red-600">Row {err.row}: {err.reason}</p>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={downloadCodes}
                            className="flex-1 py-3 rounded-xl border-2 border-brand-pink text-brand-pink font-bold text-sm hover:bg-pink-50 transition-all flex items-center justify-center gap-2">
                            <Download className="w-4 h-4" /> Download Tracking Codes
                        </button>
                        <button
                            onClick={reset}
                            className="flex-1 py-3 rounded-xl bg-brand-pink text-white font-bold text-sm hover:bg-pink-600 transition-all shadow-lg shadow-brand-pink/20">
                            New Bulk Import
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
