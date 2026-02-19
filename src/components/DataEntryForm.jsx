import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus,
  Trash2,
  Layout,
  Database,
  Wand2,
  Loader2,
  AlertCircle,
  FileCheck,
  Table2,
  Lock,
  Pencil,
  Check,
} from 'lucide-react'
import API from '../api/client'
import { extractDynamicFields, extractTableSchemas } from '../utils/puckFields'

// ─── Table Editor ────────────────────────────────────────────────────────────

function TableEditor({ tableIdx, schema, fields, onBatchFieldChange }) {
  const { headers, defaultRows } = schema
  const numCols = headers.length

  // Initialize rows from existing fields or template defaults
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
  const [focusCell, setFocusCell] = useState(null) // {ri, ci}

  // Sync a set of rows into the parent fields state
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

  // Sync on mount so template defaults are in parent state
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
    <div className="space-y-3">
      {/* Column header pills */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `32px repeat(${numCols}, 1fr) 40px` }}>
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

      {/* Rows */}
      <AnimatePresence initial={false}>
        {rows.map((row, ri) => (
          <motion.div
            key={ri}
            initial={{ opacity: 0, height: 0, scale: 0.97 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="grid gap-2 group"
            style={{ gridTemplateColumns: `32px repeat(${numCols}, 1fr) 40px` }}
          >
            {/* Row number */}
            <div className="flex items-center justify-center">
              <span className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-pink-100 text-slate-500 group-hover:text-brand-pink text-[11px] font-bold flex items-center justify-center transition-colors">
                {ri + 1}
              </span>
            </div>

            {/* Cells */}
            {row.slice(0, numCols).map((cell, ci) => (
              <div key={ci} className="relative">
                <input
                  type="text"
                  value={cell}
                  onChange={(e) => updateCell(ri, ci, e.target.value)}
                  onFocus={() => setFocusCell({ ri, ci })}
                  onBlur={() => setFocusCell(null)}
                  placeholder={`${headers[ci]}...`}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-brand-navy text-sm font-semibold outline-none transition-all ${isFocused(ri, ci)
                    ? 'border-brand-pink bg-white shadow-lg shadow-brand-pink/10 ring-4 ring-brand-pink/5'
                    : cell
                      ? 'border-emerald-200 bg-emerald-50/40 hover:border-brand-pink hover:bg-white'
                      : 'border-slate-200 bg-slate-50/80 hover:border-pink-300 hover:bg-white'
                    }`}
                />
                {cell && !isFocused(ri, ci) && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500 pointer-events-none" />
                )}
              </div>
            ))}

            {/* Remove button */}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeRow(ri)}
                disabled={rows.length === 1}
                className="w-8 h-8 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed"
                title="Remove row"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add row */}
      <motion.button
        type="button"
        onClick={addRow}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-brand-pink border-2 border-dashed border-pink-200 hover:border-brand-pink hover:bg-pink-50 transition-all mt-1"
      >
        <Plus className="w-4 h-4" />
        Add Row
      </motion.button>
    </div>
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

  const selectedTemplate =
    templates.find((t) => t.id === documentData.templateId) || templates[0] || null

  // Detect a user-created Puck template by checking if ANY field has a puckPath.
  // System templates (Certificate, Receipt, etc.) never have puckPath — they use
  // plain fields_schema entries. Only Puck-built templates have puckPath set.
  const allTemplateFields = selectedTemplate?.fields || selectedTemplate?.fields_schema || []
  const hasPuckFields = allTemplateFields.some((f) => !!f.puckPath) || !!selectedTemplate?.ui_config?.content

  // For user-created (Puck) templates → only DynamicField inputs
  // For system templates (Certificate, Receipt, etc.) → all fields as-is
  const userFields = (() => {
    if (!selectedTemplate) return []
    if (!hasPuckFields) return allTemplateFields           // system template: show all
    return allTemplateFields.filter(                       // Puck template: only user inputs
      (f) => f.puckPath?.type === 'DynamicField'
    )
  })()

  // Table schemas — only for Puck templates that have ui_config
  const tableSchemas = (() => {
    if (!hasPuckFields || !selectedTemplate?.ui_config?.content) return []
    return extractTableSchemas(selectedTemplate.ui_config.content)
  })()

  // Pre-fill DynamicField inputs with their placeholder values when template changes
  const prevTemplateId = useRef(null)
  useEffect(() => {
    if (!selectedTemplate || !hasPuckFields) return
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
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const handleFieldChange = (fieldId, value) => {
    onUpdate({
      fields: {
        ...(documentData.fields || {}),
        [fieldId]: value,
      },
    })
    if (errors[`field:${fieldId}`]) {
      setErrors((prev) => ({ ...prev, [`field:${fieldId}`]: null }))
    }
  }

  // Batch update for table cells (handles undefined = delete)
  const handleBatchFieldChange = useCallback(
    (updates) => {
      const newFields = { ...(documentData.fields || {}) }
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined) {
          delete newFields[k]
        } else {
          newFields[k] = v
        }
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

    // Validate only user-fillable DynamicField inputs
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
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Loader2 className="w-8 h-8 text-brand-pink animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading templates...</p>
      </div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden relative"
    >
      {/* Success Overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute top-0 left-0 w-full z-20 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 flex items-center justify-center gap-3 shadow-lg"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            >
              <FileCheck className="w-6 h-6" strokeWidth={2.5} />
            </motion.div>
            <span className="font-semibold text-sm">Document created successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 sm:px-8 lg:px-10 py-6 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-brand-soft rounded-lg shrink-0">
            <Layout className="w-5 h-5 text-brand-pink" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-navy tracking-tight">
              Create Document
            </h2>
            <p className="text-sm text-slate-400 font-medium mt-0.5">
              Choose a template and fill in the details
            </p>
          </div>
        </div>
      </div>

      {/* Server Error */}
      {errors.server && (
        <div className="mx-6 sm:mx-8 lg:mx-10 mt-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-tight rounded-xl flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errors.server}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 lg:p-10 space-y-8">

        {/* Template Selector */}
        <div className="space-y-3">
          <label
            htmlFor="templateId"
            className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1"
          >
            Document Type
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-pink transition-colors">
              <Database className="w-4 h-4" />
            </div>
            <select
              id="templateId"
              value={documentData.templateId || ''}
              onChange={(e) => handleChange('templateId', parseInt(e.target.value))}
              className="w-full pl-11 pr-12 py-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-brand-navy font-bold focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink focus:bg-white transition-smooth appearance-none outline-none"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
              <Wand2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Template Info Badge (Puck templates) */}
        {hasPuckFields && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-pink-50/50 border border-pink-100">
            <Lock className="w-4 h-4 text-brand-pink shrink-0" />
            <p className="text-xs text-slate-600 font-medium">
              Template design is locked. Fill in the fields below to personalise your document.
              To edit the design, go to{' '}
              <span className="font-bold text-brand-pink">Template Builder → Edit</span>.
            </p>
          </div>
        )}

        {/* Fields section */}
        {userFields.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-brand-navy tracking-tight flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-pink-100 text-brand-pink flex items-center justify-center text-[10px] font-bold">1</span>
              {hasPuckFields ? 'Template Fields' : 'Your Information'}
            </h3>

            {/* Puck template: read-only field display */}
            {hasPuckFields ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 divide-y divide-slate-100 overflow-hidden">
                {userFields.map((def) => (
                  <div key={def.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                      {def.label}
                    </span>
                    <span className="text-sm font-semibold text-brand-navy text-right truncate">
                      {def.placeholder || '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* System template: editable inputs */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {userFields.map((def) => {
                  const key = `field:${def.id}`
                  const value = (documentData.fields || {})[def.id] ?? ''
                  const isTextArea = def.type === 'textarea'
                  const isSelect = def.type === 'select' && def.options?.length > 0
                  const border = errors[key]
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-slate-200 bg-slate-50/50'

                  return (
                    <div
                      key={def.id}
                      className={`${isTextArea ? 'sm:col-span-2' : ''} space-y-2.5`}
                    >
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                        {def.label}
                        {def.required ? <span className="text-red-400"> *</span> : null}
                      </label>
                      {isTextArea ? (
                        <textarea
                          rows={4}
                          value={value}
                          onChange={(e) => handleFieldChange(def.id, e.target.value)}
                          placeholder={def.placeholder || `Specify ${def.label.toLowerCase()}...`}
                          className={`w-full px-5 py-4 rounded-2xl border font-bold text-brand-navy placeholder-slate-300 focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink focus:bg-white transition-smooth outline-none resize-none ${border}`}
                        />
                      ) : isSelect ? (
                        <select
                          value={value || def.placeholder || (def.options?.[0]?.value ?? '')}
                          onChange={(e) => handleFieldChange(def.id, e.target.value)}
                          className={`w-full px-5 py-4 rounded-2xl border font-bold text-brand-navy focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink focus:bg-white transition-smooth outline-none appearance-none bg-slate-50/50 ${border}`}
                        >
                          {def.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={def.type || 'text'}
                          value={value}
                          onChange={(e) => handleFieldChange(def.id, e.target.value)}
                          placeholder={def.placeholder || `Enter ${def.label.toLowerCase()}...`}
                          className={`w-full px-5 py-4 rounded-2xl border font-bold text-brand-navy placeholder-slate-300 focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink focus:bg-white transition-smooth outline-none ${border}`}
                        />
                      )}
                      <AnimatePresence>
                        {errors[key] && (
                          <motion.p
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[10px] font-bold text-red-500 uppercase tracking-tighter pl-1"
                          >
                            {errors[key]}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Table Editors — only for system templates, not Puck-built ones */}
        {!hasPuckFields && tableSchemas.length > 0 && (
          <div className="space-y-6">
            {tableSchemas.map((schema, ti) => (
              <div key={schema.tableIdx} className="space-y-3">
                <h3 className="text-sm font-black text-brand-navy tracking-tight flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-pink-100 text-brand-pink flex items-center justify-center text-[10px] font-bold">
                    {userFields.length > 0 ? ti + 2 : ti + 1}
                  </span>
                  <Table2 className="w-4 h-4 text-brand-pink" />
                  Table {tableSchemas.length > 1 ? ti + 1 : ''}
                  <span className="text-[10px] text-slate-400 font-normal normal-case">
                    — {schema.headers.join(', ')}
                  </span>
                </h3>
                <TableEditor
                  key={`${selectedTemplate?.id}-${schema.tableIdx}`}
                  tableIdx={schema.tableIdx}
                  schema={schema}
                  fields={documentData.fields || {}}
                  onBatchFieldChange={handleBatchFieldChange}
                />
              </div>
            ))}
          </div>
        )}

        {/* No editable content message — only for Puck templates with no DynamicFields */}
        {userFields.length === 0 && hasPuckFields && (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
            <p className="text-sm font-medium">This template has no user-fillable fields.</p>
            <p className="text-xs mt-1">Add DynamicField or Table components in the Template Builder.</p>
          </div>
        )}

        {/* Custom Fields */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-black text-brand-navy tracking-tight">Custom Fields</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                Add extra information not in the template
              </p>
            </div>
            <motion.button
              type="button"
              onClick={addCustomFieldRow}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-brand-pink text-sm font-bold hover:bg-brand-pink hover:text-white transition-smooth shadow-sm"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              + Add Field
            </motion.button>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {(documentData.customFields || []).map((cf) => (
                <motion.div
                  key={cf.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex gap-3 group"
                >
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      className="px-5 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-brand-navy focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-smooth outline-none placeholder:text-slate-300"
                      placeholder="Label"
                      value={cf.label}
                      onChange={(e) => updateCustomFieldRow(cf.id, { label: e.target.value })}
                    />
                    <input
                      className="px-5 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-brand-navy focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-smooth outline-none placeholder:text-slate-300"
                      placeholder="Value"
                      value={cf.value}
                      onChange={(e) => updateCustomFieldRow(cf.id, { value: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomFieldRow(cf.id)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-white rounded-xl transition-smooth shadow-sm lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {(documentData.customFields || []).length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                <p className="text-sm font-medium">No custom fields yet</p>
                <p className="text-xs mt-1">
                  Click &quot;Add Field&quot; to add extra information
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isGenerating}
          className={`w-full h-16 rounded-2xl text-white font-black tracking-widest uppercase text-xs transition-smooth shadow-2xl relative overflow-hidden ${isGenerating
            ? 'bg-slate-300 cursor-not-allowed shadow-none'
            : 'bg-brand-navy hover:bg-brand-pink shadow-brand-pink/20'
            }`}
          whileHover={!isGenerating ? { y: -3 } : {}}
          whileTap={!isGenerating ? { scale: 0.99 } : {}}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating document...
            </div>
          ) : (
            <span className="relative z-10 flex items-center justify-center gap-3">
              Create Document
              <Plus className="w-4 h-4" />
            </span>
          )}
        </motion.button>
      </form>
    </motion.section>
  )
}