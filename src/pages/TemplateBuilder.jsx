import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  Database,
  Loader2,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Trash2,
  FileText,
  Pencil,
  X,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react'
import { Puck } from '@measured/puck'
import '@measured/puck/puck.css'
import API from '../api/client'
import { puckConfig } from '../components/puck.config'
import { extractFieldsFromPuckContent } from '../utils/puckFields'

// Enhanced Puck UI styles — bigger canvas, clearer fonts, readable tables
const puckCustomStyles = `
  /* Hide viewport switcher */
  [data-puck-viewport-controls],
  .Puck-viewportControls,
  button[aria-label*="viewport"],
  div[class*="ViewportControls"],
  div[class*="viewportControls"] {
    display: none !important;
  }

  /* ── Overall Puck shell ─────────────────────────────────────── */
  .Puck {
    font-family: 'Inter', system-ui, sans-serif !important;
    font-size: 14px !important;
  }

  /* ── Left component panel ─────────────────────────────────── */
  [class*="SideBar"],
  [class*="ComponentList"],
  [class*="sideBar"],
  [class*="componentList"] {
    min-width: 220px !important;
    font-size: 13px !important;
  }

  /* Component pill labels */
  [class*="ComponentList"] button,
  [class*="componentList"] button,
  [class*="draggable"] {
    font-size: 13px !important;
    font-weight: 600 !important;
    padding: 10px 14px !important;
    border-radius: 8px !important;
    line-height: 1.4 !important;
  }

  /* ── Right properties panel ───────────────────────────────── */
  [class*="PuckFields"],
  [class*="puckFields"],
  [class*="Fields"],
  [class*="FieldLabel"],
  [class*="fieldLabel"] {
    font-size: 13px !important;
    font-weight: 500 !important;
  }

  [class*="Input"],
  [class*="input"] input,
  [class*="input"] textarea,
  [class*="input"] select {
    font-size: 13px !important;
    padding: 8px 10px !important;
    border-radius: 6px !important;
  }

  /* Section / object field headers */
  [class*="ObjectField"] > legend,
  [class*="objectField"] > legend,
  [class*="FieldWrapper"] label,
  [class*="fieldWrapper"] label {
    font-size: 12px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
    color: #64748b !important;
    margin-bottom: 4px !important;
  }

  /* ── Canvas / Iframe area ─────────────────────────────────── */
  [class*="Frame"],
  [class*="frame"],
  iframe {
    min-height: 78vh !important;
  }

  /* Canvas preview scale — keep at 100% so text looks natural */
  [class*="CanvasArea"],
  [class*="canvasArea"] {
    background: #f8fafc !important;
    padding: 24px !important;
  }

  /* Canvas inner content text */
  [class*="CanvasArea"] *,
  [class*="canvasArea"] *,
  .component-preview * {
    font-size: 14px;
    line-height: 1.6;
  }

  /* ── Table components inside canvas ──────────────────────── */
  [class*="CanvasArea"] table,
  [class*="canvasArea"] table {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 13px !important;
    font-weight: 500 !important;
  }

  [class*="CanvasArea"] th,
  [class*="canvasArea"] th {
    background: #fdf2f8 !important;
    color: #db2777 !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.07em !important;
    padding: 10px 14px !important;
    border: 1px solid #fbcfe8 !important;
  }

  [class*="CanvasArea"] td,
  [class*="canvasArea"] td {
    padding: 9px 14px !important;
    border: 1px solid #e2e8f0 !important;
    font-size: 13px !important;
    color: #1e293b !important;
  }

  [class*="CanvasArea"] tr:nth-child(even) td,
  [class*="canvasArea"] tr:nth-child(even) td {
    background: #f8fafc !important;
  }

  /* ── Toolbar ──────────────────────────────────────────────── */
  [class*="Puck--header"],
  [class*="puck--header"],
  header[class*="Puck"] {
    font-size: 14px !important;
    font-weight: 600 !important;
    min-height: 52px !important;
  }

  /* Publish / Save button in Puck toolbar */
  [class*="Puck--header"] button[class*="primary"],
  [class*="puck--header"] button[class*="primary"] {
    font-size: 13px !important;
    font-weight: 700 !important;
    padding: 8px 20px !important;
    border-radius: 8px !important;
  }
`

const FALLBACK_CONFIG = {
  default_html: '',
  help_texts: {
    template_name_placeholder: 'e.g. Event Ticket, Invoice, Certificate...',
  },
}

const EMPTY_PUCK = { content: [], root: {} }

export default function TemplateBuilder({ token, onTemplateCreated, onCancel }) {
  const [name, setName] = useState('')
  const [existingTemplates, setExistingTemplates] = useState([])
  const [templateLoading, setTemplateLoading] = useState(false)
  const [puckData, setPuckData] = useState(EMPTY_PUCK)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [config, setConfig] = useState(FALLBACK_CONFIG)
  const [configLoading, setConfigLoading] = useState(true)
  const [editLoading, setEditLoading] = useState(false)

  // Edit mode state
  const [editingTemplate, setEditingTemplate] = useState(null) // null = create, object = edit

  const help = config.help_texts || FALLBACK_CONFIG.help_texts

  useEffect(() => {
    fetchConfig()
    fetchTemplates()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await API.get('template-builder-config/')
      setConfig({ ...FALLBACK_CONFIG, ...res.data })
    } catch {
      setConfig(FALLBACK_CONFIG)
    } finally {
      setConfigLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      setTemplateLoading(true)
      const res = await API.get('document-types/')
      // Only display templates belonging to the user. Global/system templates will be hidden from the builder.
      const editableTemplates = (res.data || []).filter(t => t.can_edit_in_builder === true)
      setExistingTemplates(editableTemplates)
    } catch (err) {
      console.error('Failed to fetch templates', err)
    } finally {
      setTemplateLoading(false)
    }
  }

  // Load a template into the editor for editing
  // Fetches the full detail endpoint to ensure ui_config is complete
  const loadTemplateForEdit = async (template) => {
    setError(null)
    setSuccess(null)
    setEditLoading(true)
    try {
      // The list endpoint may not return the full ui_config; fetch the detail
      const res = await API.get(`document-types/${template.id}/`)
      const full = res.data
      const uiConfig =
        full.ui_config && Object.keys(full.ui_config).length > 0
          ? full.ui_config
          : EMPTY_PUCK

      // Set name first so the key change + puckData assignment happen in one render
      setName(full.name || '')
      setPuckData(uiConfig)
      setEditingTemplate({ ...full, _loadedAt: Date.now() })
    } catch (err) {
      console.error('Failed to load template for edit', err)
      setError('Could not load template. Please try again.')
      // Fallback: use whatever the list gave us
      const uiConfig =
        template.ui_config && Object.keys(template.ui_config).length > 0
          ? template.ui_config
          : EMPTY_PUCK
      setName(template.name || '')
      setPuckData(uiConfig)
      setEditingTemplate({ ...template, _loadedAt: Date.now() })
    } finally {
      setEditLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Cancel edit mode — back to create
  const cancelEdit = () => {
    setEditingTemplate(null)
    setName('')
    setPuckData(EMPTY_PUCK)
    setError(null)
    setSuccess(null)
  }

  const handleDeleteTemplate = async (id) => {
    const template = existingTemplates.find((t) => t.id === id)
    const tName = template?.name || 'this template'
    if (
      !window.confirm(
        `Permanently delete "${tName}"? This cannot be undone. Documents already created with this template will not be affected.`
      )
    )
      return
    try {
      await API.delete(`document-types/${id}/`)
      setExistingTemplates((prev) => prev.filter((t) => t.id !== id))
      if (editingTemplate?.id === id) cancelEdit()
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message
      alert(msg || 'Failed to delete template. You may not have permission.')
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!name.trim()) return setError('Template name is required')

    const extractedFields = extractFieldsFromPuckContent(puckData.content)

    setIsSubmitting(true)
    try {
      const payload = {
        name,
        fields_schema: extractedFields,
        template_html: '',
        ui_config: puckData,
        template_file:
          config.default_template_file || 'backendapp/base_universal_template.html',
      }

      if (editingTemplate) {
        // UPDATE existing template
        await API.patch(`document-types/${editingTemplate.id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSuccess('Template updated successfully!')
        setExistingTemplates((prev) =>
          prev.map((t) => (t.id === editingTemplate.id ? { ...t, name, ui_config: puckData, fields_schema: extractedFields } : t))
        )
        setEditingTemplate((prev) => ({ ...prev, name, ui_config: puckData }))
      } else {
        // CREATE new template
        await API.post('document-types/', payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSuccess('Template created successfully!')
        setName('')
        setPuckData(EMPTY_PUCK)
        fetchTemplates()
      }
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${editingTemplate ? 'update' : 'create'} template.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto pb-20 px-4"
    >
      <style dangerouslySetInnerHTML={{ __html: puckCustomStyles }} />

      {/* Header */}
      <div className="mb-8 rounded-3xl bg-white p-6 lg:p-8 border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-pink/5 to-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-pink-50">
              <Sparkles className="w-4 h-4 text-brand-pink" />
            </div>
            <span className="text-sm font-bold text-brand-pink uppercase tracking-wider">
              Template Engine
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">
            Template Builder
          </h1>
          <p className="text-slate-500 mt-2 max-w-lg">
            Design professional document templates using our drag-and-drop editor. Click{' '}
            <span className="font-semibold text-brand-pink">Edit</span> on any existing template to
            modify it.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="relative z-10 flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-navy hover:border-slate-300 font-semibold text-sm transition-all bg-white hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      <div className="space-y-6">

        {/* ── Saved Templates — table layout matching YourDocuments ──────── */}
        <div className="bg-white rounded-2xl border border-pink-100 shadow-sm overflow-hidden">
          {/* Header bar */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-brand-pink" />
              </div>
              <div>
                <h2 className="font-bold text-brand-navy text-lg">Saved Templates</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {existingTemplates.length} template{existingTemplates.length !== 1 ? 's' : ''} — click <span className="font-semibold text-brand-pink">Edit</span> to modify in the builder below
                </p>
              </div>
            </div>
            {editingTemplate && (
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-pulse" />
                  <span className="text-xs font-bold text-brand-pink">Editing: {editingTemplate.name}</span>
                </div>
                <button
                  onClick={cancelEdit}
                  title="Cancel edit"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Table body */}
          {templateLoading ? (
            <div className="flex items-center gap-3 px-6 py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
              <p className="text-sm text-slate-500 font-medium">Loading templates...</p>
            </div>
          ) : existingTemplates.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">No saved templates yet</p>
                <p className="text-xs text-slate-400 mt-1">Create your first template using the editor below</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-pink-100/50 text-xs text-slate-500 uppercase tracking-wider sticky top-0 z-10">
                    <th className="px-6 py-4 font-bold">Template</th>
                    <th className="px-6 py-4 font-bold">Template ID</th>
                    <th className="px-6 py-4 font-bold">Components</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {existingTemplates.map((t) => {
                    const isEditing = editingTemplate?.id === t.id
                    const componentCount = t.ui_config?.content
                      ? Array.isArray(t.ui_config.content)
                        ? t.ui_config.content.length
                        : Object.values(t.ui_config.content || {}).flat().length
                      : 0
                    return (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`group transition-colors border-b border-slate-50 last:border-0 ${isEditing ? 'bg-pink-50/40' : 'hover:bg-pink-50/30'
                          }`}
                      >
                        {/* Template name + icon */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isEditing ? 'bg-brand-pink text-white' : 'bg-pink-100 text-brand-pink'
                              }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${isEditing ? 'text-brand-pink' : 'text-brand-navy'}`}>
                                {t.name}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium">Custom Template</span>
                            </div>
                          </div>
                        </td>

                        {/* ID */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg w-fit">
                            #{t.id}
                          </div>
                        </td>

                        {/* Component count */}
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-600">
                            {componentCount > 0 ? componentCount : '—'}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border bg-pink-50 text-brand-pink border-pink-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-pulse" />
                              Editing
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border bg-slate-100 text-slate-600 border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Saved
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => loadTemplateForEdit(t)}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-brand-pink hover:bg-pink-50 rounded-lg transition-colors"
                              title="Edit template"
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(t.id)}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete template"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Builder Form — full width ──────────────────────────────── */}
        <div className="space-y-6">

          {/* Edit mode banner */}
          <AnimatePresence>
            {editingTemplate && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl bg-pink-50 border border-pink-200"
              >
                <div className="flex items-center gap-3">
                  <Pencil className="w-4 h-4 text-brand-pink shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-brand-navy">
                      Editing: <span className="text-brand-pink">{editingTemplate.name}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Changes will update the existing template. In-progress documents won&apos;t be affected.
                    </p>
                  </div>
                </div>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-white border border-slate-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Name */}
            <section className="bg-white rounded-2xl border border-pink-100 p-6 shadow-card">
              <h2 className="text-lg font-bold text-brand-navy mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-pink" />
                {editingTemplate ? 'Template Name' : 'Step 1: Template Name'}
              </h2>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={help.template_name_placeholder}
                className="w-full px-5 py-4 rounded-xl border border-pink-100 bg-pink-50/30 text-brand-navy font-semibold outline-none focus:ring-2 focus:ring-brand-pink/20"
              />
            </section>

            {/* Feedback */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Puck Builder — full-width, tall canvas */}
            <div className="bg-white rounded-2xl border border-pink-100 shadow-card overflow-hidden relative" style={{ minHeight: '85vh' }}>
              {editLoading && (
                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-brand-pink" />
                  <p className="text-sm font-semibold text-slate-600">Loading template…</p>
                </div>
              )}
              <Puck
                key={editingTemplate?._loadedAt ?? 'new'}
                config={{
                  ...puckConfig,
                  viewports: [{ width: 1280, label: 'Desktop' }],
                }}
                data={puckData}
                onChange={setPuckData}
                onPublish={() => handleSubmit()}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-xl bg-brand-pink text-white font-bold shadow-lg shadow-brand-pink/25 hover:bg-pink-600 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : editingTemplate ? (
                <>
                  <Save className="w-5 h-5" />
                  Update Template
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Template
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  )
}