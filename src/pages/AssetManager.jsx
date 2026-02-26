import { useState, useRef, useCallback, useEffect } from 'react'
import {
    Image, Upload, Trash2, Star, Copy, CheckCircle2,
    AlertCircle, Loader2, X, Plus, Building2, PenLine, Stamp
} from 'lucide-react'
import API from '../api/client'

const TAB_TYPES = [
    { key: 'logo', label: 'Logos', Icon: Building2, desc: 'Company & brand logos' },
    { key: 'signature', label: 'Signatures', Icon: PenLine, desc: 'Authorized signatures' },
    { key: 'stamp', label: 'Stamps', Icon: Stamp, desc: 'Official stamps & seals' },
]

export default function AssetManager({ token }) {
    const [activeTab, setActiveTab] = useState('logo')
    const [assets, setAssets] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [uploadName, setUploadName] = useState('')
    const [uploadFile, setUploadFile] = useState(null)
    const [uploadPreview, setUploadPreview] = useState(null)
    const [copiedId, setCopiedId] = useState(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const fileRef = useRef(null)

    const authHeader = { headers: { Authorization: `Bearer ${token}` } }

    const fetchAssets = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await API.get(`assets/?type=${activeTab}`, authHeader)
            setAssets(res.data)
        } catch {
            setError('Failed to load assets.')
        } finally {
            setIsLoading(false)
        }
    }, [activeTab, token])

    useEffect(() => { fetchAssets() }, [fetchAssets])

    const handleFileSelect = (f) => {
        if (!f) return
        setUploadFile(f)
        if (uploadPreview) URL.revokeObjectURL(uploadPreview)
        setUploadPreview(URL.createObjectURL(f))
        if (!uploadName) setUploadName(f.name.replace(/\.[^.]+$/, ''))
    }

    const onDrop = useCallback((e) => {
        e.preventDefault(); setIsDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) handleFileSelect(f)
    }, [uploadName])

    const resetUploadForm = () => {
        setUploadFile(null); setUploadName('')
        if (uploadPreview) URL.revokeObjectURL(uploadPreview)
        setUploadPreview(null)
        if (fileRef.current) fileRef.current.value = ''
    }

    const handleUpload = async () => {
        if (!uploadFile || !uploadName.trim()) { setError('Please provide a name and pick a file.'); return }
        setIsUploading(true); setError('')
        const formData = new FormData()
        formData.append('file', uploadFile)
        formData.append('name', uploadName.trim())
        formData.append('asset_type', activeTab)
        try {
            await API.post('assets/', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            })
            setSuccess('Asset uploaded!')
            resetUploadForm()
            fetchAssets()
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.detail || 'Upload failed.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this asset?')) return
        try {
            await API.delete(`assets/${id}/`, authHeader)
            setAssets(prev => prev.filter(a => a.id !== id))
            setSuccess('Asset deleted.'); setTimeout(() => setSuccess(''), 3000)
        } catch { setError('Failed to delete.') }
    }

    const handleSetDefault = async (asset) => {
        try {
            await API.patch(`assets/${asset.id}/`, { is_default: !asset.is_default }, authHeader)
            fetchAssets()
            setSuccess(asset.is_default ? 'Default removed.' : 'Set as default!')
            setTimeout(() => setSuccess(''), 3000)
        } catch { setError('Failed to update.') }
    }

    const handleCopyUrl = (url, id) => {
        navigator.clipboard.writeText(url)
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const currentTab = TAB_TYPES.find(t => t.key === activeTab)

    return (
        <div className="space-y-8 pb-12">

            {/* ── Page Header ── */}
            <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-pink to-pink-600 flex items-center justify-center shadow-xl shadow-brand-pink/30 shrink-0">
                    <Image className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-brand-navy tracking-tight">Asset Manager</h1>
                    <p className="text-slate-500 mt-0.5">Store logos, signatures & stamps — ready to grab in Template Builder</p>
                </div>
            </div>

            {/* ── Alerts ── */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-600 flex-1">{error}</p>
                    <button onClick={() => setError('')} className="text-red-300 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-sm font-semibold text-emerald-700">{success}</p>
                </div>
            )}

            {/* ── Tab Bar ── */}
            <div className="flex gap-2">
                {TAB_TYPES.map(tab => {
                    const TabIcon = tab.Icon
                    return (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setError('') }}
                            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${activeTab === tab.key
                                    ? 'border-brand-pink bg-pink-50 text-brand-pink shadow-md shadow-brand-pink/10'
                                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                }`}
                        >
                            <TabIcon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            {activeTab === tab.key && assets.length > 0 && (
                                <span className="ml-1 bg-brand-pink text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{assets.length}</span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* ── Main Layout ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

                {/* ── Upload Panel ── */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Panel header */}
                    <div className="px-7 py-5 border-b border-slate-100 bg-gradient-to-r from-pink-50/60 to-white">
                        <h2 className="font-bold text-brand-navy flex items-center gap-2">
                            <Plus className="w-4 h-4 text-brand-pink" />
                            Upload {currentTab?.label.slice(0, -1)}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">{currentTab?.desc}</p>
                    </div>

                    <div className="p-7 space-y-6">
                        {/* Drop Zone */}
                        <div
                            onDrop={onDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onClick={() => fileRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all select-none
                                ${isDragging
                                    ? 'border-brand-pink bg-pink-50 scale-[1.02] shadow-lg shadow-brand-pink/10'
                                    : 'border-slate-200 hover:border-brand-pink/60 hover:bg-slate-50/80'
                                }
                                ${uploadPreview ? 'p-4 min-h-[220px]' : 'p-12 min-h-[220px]'}
                            `}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={e => handleFileSelect(e.target.files[0])}
                            />

                            {uploadPreview ? (
                                <div className="flex flex-col items-center gap-3 w-full">
                                    <div className="w-full bg-slate-50 rounded-xl flex items-center justify-center p-3 min-h-[150px]">
                                        <img
                                            src={uploadPreview}
                                            alt="preview"
                                            className="max-h-36 max-w-full object-contain rounded-lg drop-shadow-sm"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium truncate max-w-full">{uploadFile?.name}</p>
                                </div>
                            ) : (
                                <>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all ${isDragging ? 'bg-brand-pink text-white scale-110' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        <Upload className="w-7 h-7" />
                                    </div>
                                    <p className="font-bold text-brand-navy text-center">Drop image here</p>
                                    <p className="text-slate-400 text-sm text-center mt-1">or click to browse</p>
                                    <div className="flex gap-2 mt-4 flex-wrap justify-center">
                                        {['PNG', 'JPG', 'SVG', 'WebP'].map(fmt => (
                                            <span key={fmt} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">{fmt}</span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {uploadPreview && (
                            <button
                                onClick={(e) => { e.stopPropagation(); resetUploadForm() }}
                                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-3 h-3" /> Remove file
                            </button>
                        )}

                        {/* Name input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700">Asset Name</label>
                            <input
                                type="text"
                                value={uploadName}
                                onChange={e => setUploadName(e.target.value)}
                                placeholder={`e.g. Main ${currentTab?.label.slice(0, -1)}`}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-pink/20 focus:border-brand-pink transition-all placeholder-slate-300"
                            />
                        </div>

                        {/* Upload button */}
                        <button
                            onClick={handleUpload}
                            disabled={isUploading || !uploadFile}
                            className="w-full py-3.5 rounded-xl bg-brand-pink text-white font-bold text-sm hover:bg-pink-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-pink/25 hover:shadow-brand-pink/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                        >
                            {isUploading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                                : <><Upload className="w-4 h-4" /> Upload {currentTab?.label.slice(0, -1)}</>
                            }
                        </button>

                        {/* Quick tip */}
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            Tip: After uploading, click <strong>Copy URL</strong> to paste the asset directly into your Template Builder.
                        </p>
                    </div>
                </div>

                {/* ── Asset Gallery ── */}
                <div className="lg:col-span-3 space-y-5">
                    <div className="flex items-center gap-3">
                        {currentTab && <currentTab.Icon className="w-5 h-5 text-brand-pink" />}
                        <h2 className="font-bold text-brand-navy text-lg">
                            {currentTab?.label}
                            <span className="ml-2 text-sm text-slate-400 font-normal">({assets.length} {assets.length === 1 ? 'asset' : 'assets'})</span>
                        </h2>
                    </div>

                    {/* Loading */}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-100">
                            <Loader2 className="w-10 h-10 text-brand-pink animate-spin mb-3" />
                            <p className="text-slate-400 text-sm">Loading assets...</p>
                        </div>
                    ) : assets.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center px-8">
                            {currentTab && <currentTab.Icon className="w-12 h-12 text-slate-200 mb-4" />}
                            <p className="font-bold text-slate-600 text-lg">No {currentTab?.label.toLowerCase()} yet</p>
                            <p className="text-slate-400 text-sm mt-2 max-w-xs">
                                Upload your first {currentTab?.label.slice(0, -1).toLowerCase()} using the panel on the left.
                            </p>
                        </div>
                    ) : (
                        /* Asset Grid */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {assets.map(asset => (
                                <div
                                    key={asset.id}
                                    className={`group bg-white rounded-3xl border-2 overflow-hidden transition-all duration-200 hover:shadow-xl ${asset.is_default
                                        ? 'border-brand-pink shadow-lg shadow-brand-pink/10'
                                        : 'border-slate-100 hover:border-slate-200 shadow-sm'
                                        }`}
                                >
                                    {/* Default ribbon */}
                                    {asset.is_default && (
                                        <div className="bg-gradient-to-r from-brand-pink to-pink-500 text-white text-[10px] font-black px-4 py-1.5 text-center tracking-widest uppercase flex items-center justify-center gap-1.5">
                                            <Star className="w-3 h-3 fill-current" /> Default Asset
                                        </div>
                                    )}

                                    {/* Image area */}
                                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 flex items-center justify-center min-h-[180px] p-6 border-b border-slate-100 relative overflow-hidden">
                                        {/* Subtle grid bg */}
                                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                        <img
                                            src={asset.file_url}
                                            alt={asset.name}
                                            className="relative max-h-36 max-w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                                            onError={e => {
                                                e.target.style.display = 'none'
                                                e.target.parentElement.innerHTML += '<div class="flex flex-col items-center text-slate-300"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.5\'><rect width=\'18\' height=\'18\' x=\'3\' y=\'3\' rx=\'2\' ry=\'2\'/><circle cx=\'9\' cy=\'9\' r=\'2\'/><path d=\'m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\'/></svg><p style=\'font-size:11px;margin-top:8px\'>Image unavailable</p></div>'
                                            }}
                                        />
                                    </div>

                                    {/* Info & Actions */}
                                    <div className="p-5 space-y-4">
                                        <div>
                                            <p className="font-bold text-brand-navy truncate" title={asset.name}>{asset.name}</p>
                                            <p className="text-xs text-slate-400 mt-0.5 capitalize">{asset.asset_type}</p>
                                        </div>

                                        {/* Action Row */}
                                        <div className="flex items-center gap-2">
                                            {/* Copy URL */}
                                            <button
                                                onClick={() => handleCopyUrl(asset.file_url, asset.id)}
                                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all ${copiedId === asset.id
                                                    ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
                                                    : 'border-slate-200 text-slate-600 hover:border-brand-pink hover:text-brand-pink hover:bg-pink-50'
                                                    }`}
                                            >
                                                {copiedId === asset.id
                                                    ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</>
                                                    : <><Copy className="w-3.5 h-3.5" /> Copy URL</>
                                                }
                                            </button>

                                            {/* Set Default */}
                                            <button
                                                onClick={() => handleSetDefault(asset)}
                                                title={asset.is_default ? 'Remove default' : 'Set as default'}
                                                className={`p-2 rounded-xl border-2 transition-all ${asset.is_default
                                                    ? 'border-brand-pink text-brand-pink bg-pink-50'
                                                    : 'border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500 hover:bg-amber-50'
                                                    }`}
                                            >
                                                <Star className={`w-4 h-4 ${asset.is_default ? 'fill-current' : ''}`} />
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(asset.id)}
                                                title="Delete asset"
                                                className="p-2 rounded-xl border-2 border-slate-200 text-slate-300 hover:border-red-200 hover:text-red-400 hover:bg-red-50 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
