import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2, Layout, Database, Wand2, Loader2, AlertCircle, FileCheck } from 'lucide-react'
import API from '../api/client'

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

  const addCustomFieldRow = () => {
    const next = [
      ...(documentData.customFields || []),
      { id: `cf-${Date.now().toString(36)}`, label: '', value: '' },
    ]
    onUpdate({ customFields: next })
  }

  const updateCustomFieldRow = (id, patch) => {
    const next = (documentData.customFields || []).map((cf) => (cf.id === id ? { ...cf, ...patch } : cf))
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
      setErrors({ server: "No document template selected." })
      return
    }

    // Validation Logic
    const fields = documentData.fields || {}
    const defs = selectedTemplate?.fields || []
    for (const def of defs) {
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
          custom_fields: (documentData.customFields || []).map(({ label, value }) => ({ label, value }))
        }
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      const response = await API.post('create/', payload, config)
      onSubmit(response.data)
      setSuccess(true)
      // Auto-dismiss success after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("API Error:", err)
      setErrors({ server: err.response?.data?.detail || err.response?.data?.message || "Something went wrong. Please try again." })
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

      <div className="px-6 sm:px-8 lg:px-10 py-6 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-brand-soft rounded-lg shrink-0">
            <Layout className="w-5 h-5 text-brand-pink" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-navy tracking-tight">Create Document</h2>
            <p className="text-sm text-slate-400 font-medium mt-0.5">Choose a template and fill in the details</p>
          </div>
        </div>
      </div>

      {errors.server && (
        <div className="mx-6 sm:mx-8 lg:mx-10 mt-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-tight rounded-xl flex items-center gap-3">
          <AlertCircle className="w-4 h-4" />
          {errors.server}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 lg:p-10 space-y-8">
        <div className="space-y-3">
          <label htmlFor="templateId" className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
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

        {/* Dynamic fields - from fields_schema or extracted from Puck (headers, text, fonts, tables, etc.) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(selectedTemplate?.fields || []).map((def) => {
            const key = `field:${def.id}`
            const value = (documentData.fields || {})[def.id] ?? ''
            const isTextArea = def.type === 'textarea'
            const isSelect = def.type === 'select' && def.options?.length > 0
            const border = errors[key] ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-slate-50/50'

            return (
              <div key={def.id} className={`${isTextArea ? 'sm:col-span-2' : ''} space-y-2.5`}>
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
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={def.type}
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

        {/* Custom fields section */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/30 p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-black text-brand-navy tracking-tight">Custom Fields</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Add extra fields not in the template</p>
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
                      placeholder="Variable Label"
                      value={cf.label}
                      onChange={(e) => updateCustomFieldRow(cf.id, { label: e.target.value })}
                    />
                    <input
                      className="px-5 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-brand-navy focus:ring-4 focus:ring-brand-pink/5 focus:border-brand-pink transition-smooth outline-none placeholder:text-slate-300"
                      placeholder="Variable Value"
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
                <p className="text-xs mt-1">Click &quot;Add Field&quot; above to add extra information to your document</p>
              </div>
            )}
          </div>
        </div>

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