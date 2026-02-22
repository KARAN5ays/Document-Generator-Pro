import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DataEntryForm from './components/DataEntryForm'
import { extractFieldsFromPuckContent } from './utils/puckFields'
import PdfPreviewer from './components/PdfPreviewer'
import VerificationTool from './pages/VerificationTool'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import TemplateBuilder from './pages/TemplateBuilder'
import YourDocuments from './pages/YourDocuments'
import SettingsView from './pages/SettingsView'
import API from './api/client'



// Simple Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-red-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <div className="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-auto text-sm font-mono mb-6">
              <p className="font-bold text-red-300 mb-2">{this.state.error && this.state.error.toString()}</p>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-brand-navy text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [templates, setTemplates] = useState([])
  const [activeView, setActiveView] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authView, setAuthView] = useState('login') // 'login' | 'register' | 'publicVerify'
  const [verifyPreFillCode, setVerifyPreFillCode] = useState('')
  const [userProfile, setUserProfile] = useState(null)

  // Auth state management
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || null
  })

  // Handle successful login
  const handleLogin = (newToken) => {
    setToken(newToken)
    setActiveView('dashboard') // Reset view on login
  }

  // Handle logout
  const handleLogout = () => {
    setToken(null)
    setActiveView('dashboard') // Reset view
    setTemplates([]) // Clear templates
    setUserProfile(null) // Clear profile
    setDocumentData({ // Reset document data
      templateId: null,
      fields: {},
      customFields: [],
      themeAccent: 'auto',
      uniqueCode: null,
      pdfUrl: null,
    })
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
  }

  const [documentData, setDocumentData] = useState({
    templateId: null,
    fields: {},
    customFields: [],
    themeAccent: 'auto',
    uniqueCode: null,
    pdfUrl: null,
  })

  useEffect(() => {
    if (token) {
      fetchTemplates()
      fetchUserProfile()
    }
  }, [token])

  const fetchUserProfile = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await API.get('users/me/', config)
      setUserProfile({
        name: res.data.username || res.data.email?.split('@')[0] || 'User',
        email: res.data.email,
        role: res.data.is_superuser ? 'Administrator' : 'Standard User'
      })
    } catch (err) {
      console.error("Failed to fetch user profile", err)
      if (err.response?.status === 401) {
        handleLogout()
      }
    }
  }

  useEffect(() => {
    const onLogout = () => setToken(null)
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  // Extract editable fields: fields_schema (saved) or from Puck ui_config for user-created templates
  const getFieldsForTemplate = (t) => {
    if (t.fields_schema && Array.isArray(t.fields_schema) && t.fields_schema.length > 0) {
      return t.fields_schema
    }
    // Derive from ui_config (Puck) - headers, text, fonts, tables, DynamicFields, etc.
    const rawContent = t.ui_config?.content
    if (!rawContent) return []
    return extractFieldsFromPuckContent(rawContent)
  }

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }
      const response = await API.get('document-types/', config)
      const data = response.data.map(t => ({
        ...t,
        fields: getFieldsForTemplate(t) // fields_schema or derived from ui_config
      }))
      setTemplates(data)
      if (data.length > 0) {
        setDocumentData(prev => {
          const exists = data.some(t => t.id === prev.templateId)
          if (exists && prev.templateId !== null) return prev
          return { ...prev, templateId: data[0].id }
        })
      }
    } catch (err) {
      console.error("Failed to fetch templates", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    if (authView === 'publicVerify') {
      return (
        <ErrorBoundary>
          <div className="min-h-screen bg-brand-soft pt-12">
            {/* Minimal public header for verification page */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center max-w-[1600px] mx-auto z-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-pink to-pink-600 flex items-center justify-center shadow-md shadow-brand-pink/20 ring-1 ring-white/50">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                </div>
                <div>
                  <h1 className="text-base font-bold text-brand-pink tracking-tight">DocGen</h1>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold -mt-0.5">Tech Cloud</p>
                </div>
              </div>
              <button
                onClick={() => setAuthView('login')}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                Sign In
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <VerificationTool initialCode="" />
            </motion.div>
          </div>
        </ErrorBoundary>
      )
    }

    return authView === 'login' ? (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setAuthView('register')}
        onSwitchToVerify={() => setAuthView('publicVerify')}
      />
    ) : (
      <Register
        onSwitchToLogin={() => setAuthView('login')}
        onLogin={handleLogin}
      />
    )
  }

  // If we have a token but haven't fetched templates yet, show a clean loading state
  if (isLoading && token && templates.length === 0) {
    return (
      <div className="min-h-screen bg-brand-soft flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-brand-navy font-bold">Loading your workspace...</p>
      </div>
    )
  }

  const handleBackendResponse = (backendData) => {
    setDocumentData((prev) => ({
      ...prev,
      uniqueCode: backendData.tracking_field,
      fields: backendData.metadata || prev.fields,
      pdfUrl: backendData.pdf_url || null,
    }))
  }

  const handleDocumentUpdate = (data) => {
    if (data.fields) {
      setDocumentData((prev) => ({ ...prev, ...data, uniqueCode: null, pdfUrl: null }))
    } else {
      setDocumentData((prev) => ({ ...prev, ...data }))
    }
  }

  const handleAddTemplate = (template) => {
    setTemplates((prev) => [template, ...prev])
    setDocumentData((prev) => ({ ...prev, templateId: template.id }))
  }



  const handleViewChange = (view) => {
    if (view !== 'verify') setVerifyPreFillCode('')
    setActiveView(view)
    setSidebarOpen(false)
  }

  const handleVerifyWithCode = (code) => {
    setVerifyPreFillCode(code || '')
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-brand-soft">
        <Navbar
          username={userProfile?.name || "Loading..."}
          notificationCount={0}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />

        <Sidebar
          activeView={activeView}
          onViewChange={handleViewChange}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          username={userProfile?.name || "Loading..."}
          role={userProfile?.role || "User"}
        />

        {/* Main content: pt-24 clears fixed navbar (h-16) + 32px visual gap */}
        <main className="lg:ml-64 pt-24 min-h-screen pb-24 px-4 sm:px-6 lg:px-8 transition-all overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-[1600px] mx-auto pt-6 lg:pt-8"
            >
              {activeView === 'generate' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 xl:gap-10 items-start">
                  <DataEntryForm
                    templates={templates}
                    documentData={documentData}
                    token={token}
                    onUpdate={handleDocumentUpdate}
                    onSubmit={handleBackendResponse}
                    onAddTemplate={handleAddTemplate}
                  />
                  <div className="sticky top-28">
                    <PdfPreviewer
                      documentData={documentData}
                      templates={templates}
                      onUpdate={handleDocumentUpdate}
                    />
                  </div>
                </div>
              )}

              {activeView === 'dashboard' && (
                <Dashboard onNavigate={handleViewChange} />
              )}

              {activeView === 'documents' && (
                <YourDocuments onNavigate={handleViewChange} />
              )}

              {activeView === 'verify' && (
                <VerificationTool initialCode={verifyPreFillCode} />
              )}

              {activeView === 'builder' && (
                <TemplateBuilder
                  token={token}
                  onTemplateCreated={() => {
                    fetchTemplates()
                    setActiveView('generate')
                  }}
                  onCancel={() => setActiveView('dashboard')}
                />
              )}

              {activeView === 'settings' && (
                <SettingsView userProfile={userProfile} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  )
}