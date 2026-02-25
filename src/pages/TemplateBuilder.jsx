import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Save,
  Loader2,
  ArrowLeft,
  Trash2,
  FileText,
  Pencil,
  Plus,
  CheckCircle2,
  AlertCircle,
  Search,
  LayoutTemplate,
  Database,
  Type
} from 'lucide-react'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import {
  ClassicEditor,
  Essentials,
  Autoformat,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  BlockQuote,
  Heading,
  Link,
  List,
  Paragraph,
  Indent,
  IndentBlock,
  Table,
  TableToolbar,
  TableColumnResize,
  TableProperties,
  TableCellProperties,
  MediaEmbed,
  Undo,
  Font,
  Highlight,
  Alignment,
  HorizontalLine,
  SpecialCharacters,
  SpecialCharactersEssentials
} from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'
import API from '../api/client'
import { extractFieldsFromHTML } from '../utils/templateFields'

const ckStyles = `
  .ck-editor__editable_inline {
    min-height: 400px;
    padding: 0 1rem !important;
  }
  .ck-editor {
    width: 100% !important;
  }
  .ck-toolbar {
    border-top-left-radius: 0.75rem !important;
    border-top-right-radius: 0.75rem !important;
    border: 1px solid #e2e8f0 !important;
    background-color: #f8fafc !important;
  }
  .ck-content {
    border-bottom-left-radius: 0.75rem !important;
    border-bottom-right-radius: 0.75rem !important;
    border: 1px solid #e2e8f0 !important;
    border-top: none !important;
  }
  /* Fix Lucide icon alignment in editor */
  .ck-editor__editable blockquote {
    border-left: 4px solid #db2777;
    background: #fdf2f8;
    padding: 1rem;
    font-style: italic;
  }
  
  /* Make CKEditor popups appear above our modals */
  .ck.ck-balloon-panel {
    z-index: 9999 !important;
  }
`

const FALLBACK_CONFIG = {
  default_html: '',
  help_texts: { template_name_placeholder: 'e.g. Event Ticket, Invoice, Certificate...' },
}
const EMPTY_HTML = ''

export default function TemplateBuilder({ token, onTemplateCreated, onTemplateDeleted, onCancel }) {
  // 'list' | 'editor'
  const [view, setView] = useState('list')
  const [search, setSearch] = useState('')

  // Editor state
  const [name, setName] = useState('')
  const [templateHtml, setTemplateHtml] = useState(EMPTY_HTML)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // List state
  const [templates, setTemplates] = useState([])
  const [templateLoading, setTemplateLoading] = useState(true)
  const [config, setConfig] = useState(FALLBACK_CONFIG)

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
    }
  }

  const fetchTemplates = async () => {
    try {
      setTemplateLoading(true)
      const res = await API.get('document-types/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const editable = (res.data || []).filter(t => t.can_edit_in_builder === true)
      setTemplates(editable)
    } catch (err) {
      console.error('Failed to fetch templates', err)
    } finally {
      setTemplateLoading(false)
    }
  }

  const openCreate = () => {
    setName('')
    setTemplateHtml(EMPTY_HTML)
    setEditingTemplate(null)
    setError(null)
    setSuccess(null)
    setView('editor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEdit = async (template) => {
    setError(null)
    setSuccess(null)
    setEditLoading(true)
    setView('editor')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const res = await API.get(`document-types/${template.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const full = res.data
      const htmlContent = full.template_html || EMPTY_HTML
      setName(full.name || '')
      setTemplateHtml(htmlContent)
      setEditingTemplate({ ...full, _loadedAt: Date.now() })
    } catch (err) {
      console.error('Failed to load template for edit', err)
      setError('Could not load template. Please try again.')
      const htmlContent = template.template_html || EMPTY_HTML
      setName(template.name || '')
      setTemplateHtml(htmlContent)
      setEditingTemplate({ ...template, _loadedAt: Date.now() })
    } finally {
      setEditLoading(false)
    }
  }

  const closeEditor = () => {
    setView('list')
    setEditingTemplate(null)
    setName('')
    setTemplateHtml(EMPTY_HTML)
    setError(null)
    setSuccess(null)
  }

  const handleDelete = async (id) => {
    const t = templates.find(t => t.id === id)
    if (!window.confirm(`Permanently delete "${t?.name}"? This cannot be undone.`)) return
    try {
      await API.delete(`document-types/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTemplates(prev => prev.filter(t => t.id !== id))
      if (onTemplateDeleted) {
        onTemplateDeleted(id)
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message
      alert(msg || 'Failed to delete template.')
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!name.trim()) return setError('Template name is required')
    if (!templateHtml.trim()) return setError('Template content is required')

    const extractedFields = extractFieldsFromHTML(templateHtml)

    setIsSubmitting(true)
    try {
      const payload = {
        name,
        fields_schema: extractedFields,
        template_html: templateHtml,
        template_file: config.default_template_file || 'backendapp/base_universal_template.html',
      }
      const headers = { Authorization: `Bearer ${token}` }

      if (editingTemplate) {
        await API.patch(`document-types/${editingTemplate.id}/`, payload, { headers })
        setSuccess('Template updated successfully!')
        setTemplates(prev =>
          prev.map(t => t.id === editingTemplate.id ? { ...t, name, template_html: templateHtml } : t)
        )
        setEditingTemplate(prev => ({ ...prev, name, template_html: templateHtml }))
        if (onTemplateCreated) onTemplateCreated(editingTemplate.id) // re-use for syncing updates
      } else {
        const res = await API.post('document-types/', payload, { headers })
        setSuccess('Template created successfully!')
        setEditingTemplate(res.data)
        fetchTemplates()
        if (onTemplateCreated) {
          onTemplateCreated(res.data.id)
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${editingTemplate ? 'update' : 'create'} template.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  // ── List View ──────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1600px] mx-auto pb-20"
      >
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <button onClick={onCancel} className="hover:text-brand-pink transition-colors">Dashboard</button>
              <span>/</span>
              <span className="font-semibold text-slate-600">Templates</span>
            </div>
            <h1 className="text-2xl font-black text-brand-navy tracking-tight">Template Builder</h1>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-pink text-white font-bold text-sm shadow-lg shadow-brand-pink/20 hover:bg-pink-600 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Template
          </button>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-brand-navy font-medium outline-none focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/5 transition-all bg-slate-50/50 placeholder:text-slate-300"
              />
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          {templateLoading ? (
            <div className="flex items-center gap-3 px-6 py-16 justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-brand-pink" />
              <p className="text-sm text-slate-500 font-medium">Loading templates...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mb-2">
                <LayoutTemplate className="w-8 h-8 text-pink-300" />
              </div>
              <p className="text-base font-bold text-slate-600">
                {search ? 'No templates match your search' : 'No templates yet'}
              </p>
              <p className="text-sm text-slate-400">
                {search ? 'Try a different name.' : 'Click "+ Add Template" to design your first template.'}
              </p>
              {!search && (
                <button
                  onClick={openCreate}
                  className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-pink text-white font-bold text-sm shadow-lg shadow-brand-pink/20 hover:bg-pink-600 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Template
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Components</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence initial={false}>
                    {filtered.map((t) => {
                      return (
                        <motion.tr
                          key={t.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group hover:bg-pink-50/30 transition-colors"
                        >
                          {/* Name */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-brand-pink" />
                              </div>
                              <button
                                onClick={() => openEdit(t)}
                                className="font-semibold text-sm text-brand-navy hover:text-brand-pink transition-colors text-left"
                              >
                                {t.name}
                              </button>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-50 border border-pink-100 text-xs font-semibold text-brand-pink">
                              Custom Template
                            </span>
                          </td>

                          {/* Components */}
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-500">
                              <span className="font-semibold text-brand-navy">Text</span>
                              <span className="text-slate-400 ml-1">Template</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEdit(t)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-brand-pink hover:bg-pink-50 rounded-lg transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(t.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>

              {/* Table footer */}
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-400 font-medium">
                  {filtered.length} template{filtered.length !== 1 ? 's' : ''}
                  {search && ` found for "${search}"`}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // ── Editor View ────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1200px] mx-auto pb-20 px-0"
    >

      <style dangerouslySetInnerHTML={{ __html: ckStyles }} />

      {/* Editor Header */}
      <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={closeEditor}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-brand-navy hover:border-slate-300 font-semibold text-sm transition-all bg-white hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Templates
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {editingTemplate ? 'Editing' : 'New Template'}
            </p>
            <h1 className="text-lg font-black text-brand-navy tracking-tight">
              {editingTemplate ? editingTemplate.name : 'Template Builder'}
            </h1>
          </div>
        </div>

        {/* Feedback pills */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Template Name */}
      <div className="mb-5 bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          <Database className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
          Template Name
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={help.template_name_placeholder}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/40 text-brand-navy font-semibold text-sm outline-none focus:border-brand-pink focus:ring-4 focus:ring-brand-pink/5 focus:bg-white transition-all placeholder:text-slate-300"
        />
      </div>

      {/* CK Editor */}
      <div className="mb-5 bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between items-center">
          <span><Type className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" /> Template Content</span>
          <span className="text-brand-pink font-medium lowercase normal-case tracking-normal">Use {"{{ VariableName }}"} to insert dynamic fields</span>
        </label>

        {editLoading ? (
          <div className="h-[400px] bg-slate-50/50 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-brand-pink" />
            <p className="text-sm font-semibold text-slate-600">Loading editor...</p>
          </div>
        ) : (
          <div className="ckeditor-wrapper border border-slate-200 rounded-xl overflow-hidden min-h-[400px]">
            <CKEditor
              onReady={(editor) => {
                console.log('CKEditor is ready!', editor)
              }}
              editor={ClassicEditor}
              data={templateHtml}
              onChange={(event, editor) => {
                const data = editor.getData()
                setTemplateHtml(data)
              }}
              config={{
                licenseKey: 'GPL',
                plugins: [
                  Essentials, Autoformat, Bold, Italic, Underline, Strikethrough,
                  BlockQuote, Heading, Link, List, Paragraph, Indent, IndentBlock,
                  Table, TableToolbar, TableColumnResize, TableProperties, TableCellProperties,
                  MediaEmbed, Undo, Font, Highlight, Alignment, HorizontalLine,
                  SpecialCharacters, SpecialCharactersEssentials
                ],
                toolbar: {
                  items: [
                    'heading', '|',
                    'bold', 'italic', 'underline', 'strikethrough', 'link', 'bulletedList', 'numberedList', '|',
                    'outdent', 'indent', '|',
                    'blockQuote', 'insertTable', 'mediaEmbed', 'undo', 'redo', '|',
                    'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', 'highlight', '|',
                    'alignment', 'horizontalLine', 'specialCharacters'
                  ]
                },
                table: {
                  contentToolbar: [
                    'tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'
                  ]
                },
                heading: {
                  options: [
                    { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                    { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                    { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                    { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                    { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
                    { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
                    { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
                  ]
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full h-14 rounded-xl bg-brand-pink text-white font-bold shadow-lg shadow-brand-pink/25 hover:bg-pink-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.99]"
      >
        {isSubmitting ? (
          <Loader2 className="animate-spin w-5 h-5" />
        ) : (
          <>
            <Save className="w-5 h-5" />
            {editingTemplate ? 'Update Template' : 'Save Template'}
          </>
        )}
      </button>
    </motion.div>
  )
}