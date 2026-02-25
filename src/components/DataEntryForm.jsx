import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus,
  Trash2,
  Wand2,
  Loader2,
  AlertCircle,
  FileCheck,
  Table2,
  Lock,
  Check,
  ChevronDown,
  Sparkles,
  FileText,
  PenLine,
  LayoutTemplate,
  ListPlus,
} from 'lucide-react'
import API from '../api/client'
import { extractDynamicFields } from '../utils/puckFields'

// ─── Table Editor ─────────────────────────────────────────────────────────────

function TableEditor({ tableIdx, schema, fields, onBatchFieldChange }) {
  const { headers, defaultRows } = schema
  const numCols = headers.length

  const initRows = () => {
    const existingRows = []
    for (let ri = 0; ri < 200; ri++) {
      const firstKey = `table_${tableIdx}_r_${ri}_c_0`
      if (!(firstKey in fields) && ri >= defaultRows.length) break
      const row = []
      for (let ci = 0; ci < numCols; ci++) {
        const id = `table_${tableIdx}_r_${ri}_c_${ci}`
        row.push(fields[id] !== undefined ? String(fields[id]) : (defaultRows[ri]?.[ci] ?? ''))
      }
      existingRows.push(row)
    }
    return existingRows.length > 0
      ? existingRows
      : defaultRows.length > 0
        ? defaultRows.map(r => [...r])
        : [Array(numCols).fill('')]
  }

  const [rows, setRows] = useState(initRows)
  const [focusCell, setFocusCell] = useState(null)

  const syncRows = useCallback(
    (newRows, clearedCount = 0) => {
      const updates = {}
      newRows.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          updates[`table_${tableIdx}_r_${ri}_c_${ci}`] = cell
        })
      })
      for (let ri = newRows.length; ri < newRows.length + clearedCount; ri++) {
        for (let ci = 0; ci < numCols; ci++) {
          updates[`table_${tableIdx}_r_${ri}_c_${ci}`] = undefined
        }
      }
      onBatchFieldChange(updates)
    },
    [tableIdx, numCols, onBatchFieldChange]
  )

  useEffect(() => {
    syncRows(initRows())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateCell = (ri, ci, val) => {
    const newRows = rows.map((r, i) => (i === ri ? r.map((c, j) => (j === ci ? val : c)) : r))
    setRows(newRows)
    onBatchFieldChange({ [`table_${tableIdx}_r_${ri}_c_${ci}`]: val })
  }

  const addRow = () => {
    const newRow = Array(numCols).fill('')
    const newRows = [...rows, newRow]
    setRows(newRows)
    syncRows(newRows)
  }

  const removeRow = (ri) => {
    const newRows = rows.filter((_, i) => i !== ri)
    setRows(newRows)
    syncRows(newRows, 1)
  }

  const isFocused = (ri, ci) => focusCell?.ri === ri && focusCell?.ci === ci

  return (
    <div className="space-y-2">
      {/* Column headers */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `28px repeat(${numCols}, 1fr) 36px` }}>
        <div />
        {headers.map((h, hi) => (
          <div
            key={hi}
            className="px-3 py-1.5 rounded-lg bg-pink-50 border border-pink-100 text-center text-[10px] font-bold text-brand-pink uppercase tracking-wider truncate"
          >
            {h}
          </div>
        ))}
        <div />
      </div>

      <AnimatePresence initial={false}>
        {rows.map((row, ri) => (
          <motion.div
            key={ri}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="grid gap-2 group"
            style={{ gridTemplateColumns: `28px repeat(${numCols}, 1fr) 36px` }}
          >
            <div className="flex items-center justify-center">
              <span className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-pink-100 text-slate-400 group-hover:text-brand-pink text-[10px] font-bold flex items-center justify-center transition-colors">
                {ri + 1}
              </span>
            </div>

            {row.slice(0, numCols).map((cell, ci) => (
              <div key={ci} className="relative">
                <input
                  type="text"
                  value={cell}
                  onChange={(e) => updateCell(ri, ci, e.target.value)}
                  onFocus={() => setFocusCell({ ri, ci })}
                  onBlur={() => setFocusCell(null)}
                  placeholder={`${headers[ci]}...`}
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-brand-navy text-sm font-medium outline-none transition-all ${isFocused(ri, ci)
                    ? 'border-brand-pink bg-white shadow-md shadow-brand-pink/10 ring-4 ring-brand-pink/5'
                    : cell
                      ? 'border-emerald-200 bg-emerald-50/40 hover:border-brand-pink hover:bg-white'
                      : 'border-slate-200 bg-white hover:border-pink-200 hover:bg-slate-50'
                    }`}
                />
                {cell && !isFocused(ri, ci) && (
                  <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-500 pointer-events-none" />
                )}
              </div>
            ))}

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeRow(ri)}
                disabled={rows.length === 1}
                className="w-7 h-7 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                title="Remove row"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-brand-pink border-2 border-dashed border-pink-200 hover:border-brand-pink hover:bg-pink-50/50 transition-all"
      >
        <Plus className="w-4 h-4" />
        Add Row
      </button>
    </div>
  )
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function SectionCard({ step, icon: Icon, title, description, children, accent = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${accent ? 'border-pink-200 bg-pink-50/50' : 'border-slate-200 bg-white'}`}
    >
      <div className={`px-5 py-4 flex items-center gap-3 border-b ${accent ? 'border-pink-200 bg-pink-50' : 'border-slate-100 bg-slate-50'}`}>
        {step && (
          <span className="w-6 h-6 rounded-full bg-brand-pink text-white flex items-center justify-center text-[11px] font-black shrink-0">
            {step}
          </span>
        )}
        <div className={`p-1.5 rounded-lg ${accent ? 'bg-pink-100' : 'bg-white border border-slate-200 shadow-sm'}`}>
          <Icon className={`w-4 h-4 ${accent ? 'text-brand-pink' : 'text-slate-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-brand-navy">{title}</h3>
          {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </motion.div>
  )
}

// ─── Main DataEntryForm ───────────────────────────────────────────────────────

export default function DataEntryForm({
  templates = [],
  documentData,
  onUpdate,
  onSubmit,
  onAddTemplate,
  token,
}) {
  const [errors, setErrors] = useState({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [success, setSuccess] = useState(false)
  const prevTemplateId = useRef(null)

  const selectedTemplate =
    templates.find((t) => t.id === documentData.templateId) || templates[0] || null

  const allTemplateFields = selectedTemplate?.fields || selectedTemplate?.fields_schema || []
  const hasDynamicHtmlFields = allTemplateFields.some((f) => !!f.isDynamicHtmlField) || !!selectedTemplate?.template_html

  const userFields = (() => {
    if (!selectedTemplate) return []
    if (!hasDynamicHtmlFields) return allTemplateFields
    return allTemplateFields.filter(
      (f) => f.isDynamicHtmlField
    )
  })()

  const tableSchemas = [] // Tables are rendered inside CKEditor directly

  useEffect(() => {
    if (!selectedTemplate || !hasDynamicHtmlFields) return
    if (prevTemplateId.current === selectedTemplate.id) return
    prevTemplateId.current = selectedTemplate.id

    const existing = documentData.fields || {}
    const updates = {}
    userFields.forEach((def) => {
      if (existing[def.id] === undefined && def.placeholder) {
        updates[def.id] = def.placeholder
      }
    })
    if (Object.keys(updates).length > 0) {
      onUpdate({ fields: { ...existing, ...updates } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.id])

  const handleChange = (field, value) => {
    onUpdate({ [field]: value })
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  const handleFieldChange = (fieldId, value) => {
    onUpdate({ fields: { ...(documentData.fields || {}), [fieldId]: value } })
    if (errors[`field:${fieldId}`]) {
      setErrors((prev) => ({ ...prev, [`field:${fieldId}`]: null }))
    }
  }

  const handleBatchFieldChange = useCallback(
    (updates) => {
      const newFields = { ...(documentData.fields || {}) }
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined) delete newFields[k]
        else newFields[k] = v
      })
      onUpdate({ fields: newFields })
    },
    [documentData.fields, onUpdate]
  )

  const addCustomFieldRow = () => {
    const next = [
      ...(documentData.customFields || []),
      { id: `cf-${Date.now().toString(36)}`, label: '', value: '' },
    ]
    onUpdate({ customFields: next })
  }

  const updateCustomFieldRow = (id, patch) => {
    const next = (documentData.customFields || []).map((cf) =>
      cf.id === id ? { ...cf, ...patch } : cf
    )
    onUpdate({ customFields: next })
  }

  const removeCustomFieldRow = (id) => {
    const next = (documentData.customFields || []).filter((cf) => cf.id !== id)
    onUpdate({ customFields: next })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setSuccess(false)
    const newErrors = {}

    if (!selectedTemplate) {
      setErrors({ server: 'No document template selected.' })
      return
    }

    const fields = documentData.fields || {}
    for (const def of userFields) {
      const v = fields[def.id]
      const isEmpty = v === undefined || v === null || `${v}`.trim() === ''
      if (def.required && isEmpty) {
        newErrors[`field:${def.id}`] = `${def.label} is required`
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsGenerating(true)
    try {
      const payload = {
        document_type: selectedTemplate.id,
        metadata: {
          ...documentData.fields,
          custom_fields: (documentData.customFields || []).map(({ label, value }) => ({
            label,
            value,
          })),
        },
      }

      const config = { headers: { Authorization: `Bearer ${token}` } }
      const response = await API.post('create/', payload, config)
      onSubmit(response.data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('API Error:', err)
      setErrors({
        server:
          err.response?.data?.detail ||
          err.response?.data?.message ||
          'Something went wrong. Please try again.',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-7 h-7 text-brand-pink animate-spin" />
        </div>
        <p className="text-slate-500 font-semibold">Loading templates...</p>
        <p className="text-xs text-slate-400 mt-1">Please wait while we fetch your document types</p>
      </div>
    )
  }

  const stepCount = (userFields.length > 0 ? 1 : 0) + (tableSchemas.length > 0 && !hasDynamicHtmlFields ? 1 : 0) + 1

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative"
    >
      {/* Success Banner */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="absolute top-0 left-0 w-full z-20 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-4 flex items-center justify-center gap-3 shadow-lg"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 400 }}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0"
            >
              <FileCheck className="w-5 h-5" strokeWidth={2.5} />
            </motion.div>
            <div>
              <p className="font-bold text-sm">Document Created Successfully!</p>
              <p className="text-xs text-white/80">Check the preview panel for your PDF</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-white">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
            <PenLine className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-brand-navy tracking-tight">Create Document</h2>
            <p className="text-sm text-slate-500 mt-0.5">Fill in the details to generate your document</p>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {errors.server && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-6 sm:mx-8 mt-5 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errors.server}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">

        {/* Step 1 – Template Picker */}
        <SectionCard step="①" icon={LayoutTemplate} title="Document Type" description="Pick a template to get started">
          <div className="relative">
            <select
              id="templateId"
              value={documentData.templateId || ''}
              onChange={(e) => handleChange('templateId', parseInt(e.target.value))}
              className="w-full pl-5 pr-10 py-3.5 rounded-xl border border-slate-200 bg-white text-brand-navy font-semibold text-sm focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all appearance-none outline-none shadow-sm"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {hasDynamicHtmlFields && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-100"
            >
              <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                This template's layout is set in the Template Builder. Fill in the variables below to personalise it. To change the design, go to{' '}
                <span className="font-bold text-amber-700">Template Builder → Edit</span>.
              </p>
            </motion.div>
          )}
        </SectionCard>

        {/* Step 2 – Fields */}
        {userFields.length > 0 && (
          <SectionCard
            step="②"
            icon={FileText}
            title={hasDynamicHtmlFields ? 'Template Fields' : 'Your Information'}
            description="Fill in the details for your document"
          >
            {hasDynamicHtmlFields && false ? (
              /* Puck template: show field values as read-only */
              <div className="rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
                {userFields.map((def) => (
                  <div key={def.id} className="flex items-center justify-between px-4 py-3 gap-4 hover:bg-slate-50 transition-colors">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0 min-w-[80px]">
                      {def.label}
                    </span>
                    <span className="text-sm font-semibold text-brand-navy text-right truncate">
                      {def.placeholder || '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userFields.map((def) => {
                  const key = `field:${def.id}`
                  const value = (documentData.fields || {})[def.id] ?? ''
                  const isTextArea = def.type === 'textarea'
                  const isSelect = def.type === 'select' && def.options?.length > 0
                  const hasError = !!errors[key]

                  return (
                    <div
                      key={def.id}
                      className={`${isTextArea ? 'sm:col-span-2' : ''} space-y-1.5`}
                    >
                      <label className="block text-xs font-semibold text-slate-500 pl-0.5">
                        {def.label}
                        {def.required && <span className="text-red-400 ml-0.5">*</span>}
                      </label>

                      {isTextArea ? (
                        <textarea
                          rows={3}
                          value={value}
                          onChange={(e) => handleFieldChange(def.id, e.target.value)}
                          placeholder={def.placeholder || `Enter ${def.label.toLowerCase()}...`}
                          className={`w-full px-4 py-3 rounded-xl border text-sm text-brand-navy font-medium placeholder-slate-300 focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink focus:bg-white transition-all outline-none resize-none ${hasError ? 'border-red-300 bg-red-50/30' : 'border-slate-200 bg-slate-50/30 hover:border-slate-300'}`}
                        />
                      ) : isSelect ? (
                        <div className="relative">
                          <select
                            value={value || def.placeholder || (def.options?.[0]?.value ?? '')}
                            onChange={(e) => handleFieldChange(def.id, e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border text-sm text-brand-navy font-medium focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all outline-none appearance-none ${hasError ? 'border-red-300 bg-red-50/30' : 'border-slate-200 bg-slate-50/30'}`}
                          >
                            {def.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type={def.type || 'text'}
                            value={value}
                            onChange={(e) => handleFieldChange(def.id, e.target.value)}
                            placeholder={def.placeholder || `Enter ${def.label.toLowerCase()}...`}
                            className={`w-full px-4 py-3 rounded-xl border text-sm text-brand-navy font-medium placeholder-slate-300 focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink focus:bg-white transition-all outline-none ${hasError ? 'border-red-300 bg-red-50/30' : 'border-slate-200 bg-slate-50/30 hover:border-slate-300'}`}
                          />
                          {value && !hasError && (
                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500 pointer-events-none" />
                          )}
                        </div>
                      )}

                      <AnimatePresence>
                        {errors[key] && (
                          <motion.p
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xs font-semibold text-red-500 pl-0.5 flex items-center gap-1"
                          >
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            {errors[key]}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* Table Editors — only for system templates */}
        {!hasDynamicHtmlFields && tableSchemas.length > 0 && (
          <>
            {tableSchemas.map((schema, ti) => (
              <SectionCard
                key={schema.tableIdx}
                step={`${userFields.length > 0 ? ti + 3 : ti + 2}`}
                icon={Table2}
                title={`Table ${tableSchemas.length > 1 ? ti + 1 : ''} — ${schema.headers.join(', ')}`}
                description="Enter data row by row"
              >
                <TableEditor
                  key={`${selectedTemplate?.id}-${schema.tableIdx}`}
                  tableIdx={schema.tableIdx}
                  schema={schema}
                  fields={documentData.fields || {}}
                  onBatchFieldChange={handleBatchFieldChange}
                />
              </SectionCard>
            ))}
          </>
        )}

        {/* No editable fields message for Custom templates */}
        {userFields.length === 0 && hasDynamicHtmlFields && (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
            <Wand2 className="w-7 h-7 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold">No user-fillable fields</p>
            <p className="text-xs mt-1 opacity-75">Add {'{{ Variables }}'} in the Template Builder to see them here.</p>
          </div>
        )}

        {/* Custom Fields — only for system/built-in templates */}
        {!hasDynamicHtmlFields && (
          <SectionCard
            icon={ListPlus}
            title="Custom Fields"
            description="Add extra information beyond the template"
            accent
          >
            <AnimatePresence mode="popLayout">
              {(documentData.customFields || []).map((cf) => (
                <motion.div
                  key={cf.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex gap-2.5 group mb-2.5"
                >
                  <div className="flex-1 grid grid-cols-2 gap-2.5">
                    <input
                      className="px-4 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-medium text-brand-navy focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all outline-none placeholder:text-slate-300"
                      placeholder="e.g. Serial No."
                      value={cf.label}
                      onChange={(e) => updateCustomFieldRow(cf.id, { label: e.target.value })}
                    />
                    <input
                      className="px-4 py-2.5 rounded-xl border border-pink-200 bg-white text-sm font-medium text-brand-navy focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-all outline-none placeholder:text-slate-300"
                      placeholder="e.g. SN-00123"
                      value={cf.value}
                      onChange={(e) => updateCustomFieldRow(cf.id, { value: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomFieldRow(cf.id)}
                    className="self-center p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Remove field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {(documentData.customFields || []).length === 0 && (
              <div className="text-center py-5 border-2 border-dashed border-pink-200 rounded-xl text-slate-400 mb-3">
                <Sparkles className="w-6 h-6 mx-auto mb-1.5 text-pink-300" />
                <p className="text-xs font-semibold text-slate-500">No custom fields yet</p>
                <p className="text-[11px] mt-0.5 opacity-75">Click below to add extra label-value pairs</p>
              </div>
            )}

            <button
              type="button"
              onClick={addCustomFieldRow}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-pink-200 text-brand-pink text-sm font-semibold hover:bg-pink-50 hover:border-brand-pink transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Custom Field
            </button>
          </SectionCard>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isGenerating}
          className={`w-full h-14 rounded-xl text-white font-bold tracking-wide text-sm transition-all shadow-sm ${isGenerating
            ? 'bg-slate-200 cursor-not-allowed text-slate-400 border border-slate-300'
            : 'bg-brand-navy hover:bg-slate-800 border border-brand-navy'
            }`}
          whileHover={!isGenerating ? { y: -1 } : {}}
          whileTap={!isGenerating ? { scale: 0.99 } : {}}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2.5">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating document...</span>
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2.5">
              <Sparkles className="w-4 h-4" />
              Generate Document
            </span>
          )}
        </motion.button>
      </form>
    </motion.section>
  )
}