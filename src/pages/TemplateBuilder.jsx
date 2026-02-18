import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Database, Loader2, ArrowLeft, Sparkles, BookOpen, Trash2, FileText } from 'lucide-react'
import { Puck } from "@measured/puck";
import "@measured/puck/puck.css";
import API from '../api/client'
import { puckConfig } from '../components/puck.config'
import { extractFieldsFromPuckContent } from '../utils/puckFields'

// Custom CSS to hide viewport switcher
const puckCustomStyles = `
  /* Hide the viewport switcher controls in Puck */
  [data-puck-viewport-controls],
  .Puck-viewportControls,
  button[aria-label*="viewport"],
  div[class*="ViewportControls"],
  div[class*="viewportControls"] {
    display: none !important;
  }
`;



const FALLBACK_CONFIG = {
  default_html: '',
  help_texts: {
    template_name_placeholder: 'e.g. Event Ticket, Invoice, Certificate...',
  },
}

export default function TemplateBuilder({ token, onTemplateCreated, onCancel }) {
  const [name, setName] = useState('')
  const [existingTemplates, setExistingTemplates] = useState([])
  const [templateLoading, setTemplateLoading] = useState(false)

  // PUCK STATE
  const [puckData, setPuckData] = useState({
    content: [],
    root: {},
  });

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [config, setConfig] = useState(FALLBACK_CONFIG)
  const [configLoading, setConfigLoading] = useState(true)

  const help = config.help_texts || FALLBACK_CONFIG.help_texts

  // Fetch initial config
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
      setExistingTemplates(res.data || [])
    } catch (err) {
      console.error('Failed to fetch templates', err)
    } finally {
      setTemplateLoading(false)
    }
  }

  const handleDeleteTemplate = async (id) => {
    const template = existingTemplates.find(t => t.id === id)
    const name = template?.name || 'this template'
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone. Documents already created with this template will not be affected.`)) return
    try {
      await API.delete(`document-types/${id}/`)
      setExistingTemplates(prev => prev.filter(t => t.id !== id))
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

    // Extract ALL editable fields from Puck (headers, text, fonts, tables, DynamicFields, etc.)
    const extractedFields = extractFieldsFromPuckContent(puckData.content)

    // if (extractedFields.length === 0) {
    // return setError('At least one DynamicField is required in the template')
    // }

    setIsSubmitting(true)
    try {
      const payload = {
        name,
        fields_schema: extractedFields,
        template_html: '', // No custom HTML for now, rely on Puck
        ui_config: puckData,
        template_file: (config.default_template_file || 'backendapp/base_universal_template.html'),
      }
      await API.post('document-types/', payload, { headers: { Authorization: `Bearer ${token}` } })
      setSuccess('Template created successfully!')
      setName('');
      setPuckData({ content: [], root: {} });
      fetchTemplates() // Refresh list
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create template.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1600px] mx-auto pb-20 px-4">
      {/* Custom CSS to hide viewport controls */}
      <style dangerouslySetInnerHTML={{ __html: puckCustomStyles }} />

      {/* Header */}
      <div className="mb-8 rounded-3xl bg-white p-6 lg:p-8 border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-pink/5 to-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-pink-50">
              <Sparkles className="w-4 h-4 text-brand-pink" />
            </div>
            <span className="text-sm font-bold text-brand-pink uppercase tracking-wider">Template Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">Template Builder</h1>
          <p className="text-slate-500 mt-2 max-w-lg">Design professional document templates using our drag-and-drop editor. Define fields, layouts, and styles with ease.</p>
        </div>
        <button onClick={onCancel} className="relative z-10 flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-navy hover:border-slate-300 font-semibold text-sm transition-all bg-white hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* Left Sidebar: Created Templates */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-pink-50">
                    <BookOpen className="w-5 h-5 text-brand-pink" />
                  </div>
                  <div>
                    <h2 className="font-bold text-brand-navy">Created Templates</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{existingTemplates.length} template{existingTemplates.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto p-3 space-y-2">
              {templateLoading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-500 font-medium">Loading templates...</p>
                </div>
              ) : existingTemplates.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-600">No templates yet</p>
                  <p className="text-xs text-slate-500 mt-1">Create one using the builder on the right</p>
                </div>
              ) : (
                existingTemplates.map((t) => (
                  <div key={t.id} className="group flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-pink-100 hover:bg-pink-50/50 hover:shadow-sm transition-all cursor-default">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-white group-hover:text-brand-pink transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-brand-navy text-sm truncate group-hover:text-brand-pink transition-colors">{t.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {t.id}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-white rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Center: Builder Form */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Name */}
            <section className="bg-white rounded-2xl border border-pink-100 p-6 shadow-card">
              <h2 className="text-lg font-bold text-brand-navy mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-pink" /> Step 1: Template Name
              </h2>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={help.template_name_placeholder}
                className="w-full px-5 py-4 rounded-xl border border-pink-100 bg-pink-50/30 text-brand-navy font-semibold outline-none focus:ring-2 focus:ring-brand-pink/20"
              />
            </section>

            {/* Feedback Messages */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {success}
              </div>
            )}

            {/* BUILDER AREA */}
            <div className="bg-white rounded-2xl border border-pink-100 shadow-card overflow-hidden min-h-[600px]">
              <Puck
                config={{
                  ...puckConfig,
                  viewports: [
                    {
                      width: 1280,
                      label: "Desktop",
                    },
                  ]
                }}
                data={puckData}
                onChange={setPuckData}
                onPublish={() => handleSubmit()}
              />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-xl bg-brand-pink text-white font-bold shadow-lg shadow-brand-pink/25 hover:bg-pink-600 flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />} Save Template
            </button>
          </form>

        </div>
      </div>
    </motion.div>
  )
}